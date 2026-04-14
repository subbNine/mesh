import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ProjectMemberRole, WorkspaceMemberRole, NotificationType } from '@mesh/shared';

import { NotificationsService } from '../notifications/notifications.service';

import { Invitation } from './entities/invitation.entity';
import { Project } from '../projects/entities/projects.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { User } from '../users/entities/users.entity';
import { Workspace } from '../workspaces/entities/workspaces.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { Repository } from 'typeorm';

type InviteScope = 'workspace' | 'project';
type WorkspaceInviteRole = keyof typeof WorkspaceMemberRole | WorkspaceMemberRole;
type ProjectInviteRole = keyof typeof ProjectMemberRole | ProjectMemberRole;

const INVITE_EXPIRY_HOURS = 24;

type InviteTokenPayload = {
  type: 'mesh-invite';
  scope: InviteScope;
  email: string;
  workspaceId: string;
  projectId?: string;
  role: string;
  inviterId: string;
  exp?: number;
};

type ResolvedInvite = {
  id: string | null;
  scope: InviteScope;
  email: string;
  workspaceId: string;
  projectId: string | null;
  role: string;
  inviterId: string;
  expiresAt: Date | null;
  acceptedAt: Date | null;
  acceptedByUserId: string | null;
};

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createWorkspaceInvite(
    workspaceId: string,
    inviterId: string,
    email: string,
    role: WorkspaceInviteRole = WorkspaceMemberRole.Member,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = this.normalizeWorkspaceRole(role);
    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const inviter = await this.userRepo.findOne({ where: { id: inviterId } });
    const existingUser = await this.userRepo.findOne({ where: { email: normalizedEmail } });

    if (existingUser) {
      const existingMember = await this.workspaceMemberRepo.findOne({
        where: { workspaceId, userId: existingUser.id },
      });

      if (existingMember) {
        throw new ConflictException('User is already a member of this workspace');
      }
    }

    const invitation = await this.createInvitationRecord({
      scope: 'workspace',
      email: normalizedEmail,
      workspaceId,
      projectId: null,
      role: normalizedRole,
      inviterId,
    });

    const workspaceRoleSuffix = normalizedRole ? ` as ${normalizedRole}` : '';

    await this.notificationsService.sendEmail({
      recipientEmail: normalizedEmail,
      type: NotificationType.InvitedToWorkspace,
      subject: `You're invited to join ${workspace.name} on Mesh`,
      templateName: 'invitation',
      data: {
        preheader: `${inviter?.firstName || 'A teammate'} invited you to collaborate in ${workspace.name}.`,
        headline: `Join ${workspace.name}`,
        body: `${inviter?.firstName || 'A teammate'} invited you to collaborate in Mesh. Review the invite, sign in or create your account, and join the workspace${workspaceRoleSuffix}.`,
        inviteUrl: this.buildInviteUrl(invitation.id),
        ctaLabel: 'Review workspace invite',
        metaLabel: 'Workspace access',
        metaValue: workspace.name,
        expiresLabel: invitation.expiresAt.toLocaleString(),
      }
    });

    return {
      invited: true,
      inviteId: invitation.id,
      scope: 'workspace' as const,
      email: normalizedEmail,
      workspaceId,
      workspaceName: workspace.name,
      expiresAt: invitation.expiresAt.toISOString(),
      delivery: 'email' as const,
    };
  }

  async createProjectInvite(
    projectId: string,
    inviterId: string,
    email: string,
    role: ProjectInviteRole = ProjectMemberRole.Member,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = this.normalizeProjectRole(role);
    const project = await this.projectRepo.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: project.workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const inviter = await this.userRepo.findOne({ where: { id: inviterId } });
    const existingUser = await this.userRepo.findOne({ where: { email: normalizedEmail } });

    if (existingUser) {
      const existingMember = await this.projectMemberRepo.findOne({
        where: { projectId, userId: existingUser.id },
      });

      if (existingMember) {
        throw new ConflictException('User already has access to this project');
      }
    }

    const invitation = await this.createInvitationRecord({
      scope: 'project',
      email: normalizedEmail,
      workspaceId: project.workspaceId,
      projectId,
      role: normalizedRole,
      inviterId,
    });

    await this.notificationsService.sendEmail({
      recipientEmail: normalizedEmail,
      type: NotificationType.InvitedToProject,
      subject: `You're invited to ${project.name} on Mesh`,
      templateName: 'invitation',
      data: {
        preheader: `${inviter?.firstName || 'A teammate'} invited you into the ${project.name} project.`,
        headline: `Join the ${project.name} project`,
        body: `${inviter?.firstName || 'A teammate'} invited you to collaborate on ${project.name} in the ${workspace.name} workspace. Review the invite to sign in or create your account, then confirm you want to join.`,
        inviteUrl: this.buildInviteUrl(invitation.id),
        ctaLabel: 'Review project invite',
        metaLabel: 'Project access',
        metaValue: `${workspace.name} · ${project.name}`,
        expiresLabel: invitation.expiresAt.toLocaleString(),
      }
    });

    return {
      invited: true,
      inviteId: invitation.id,
      scope: 'project' as const,
      email: normalizedEmail,
      workspaceId: project.workspaceId,
      workspaceName: workspace.name,
      projectId,
      projectName: project.name,
      expiresAt: invitation.expiresAt.toISOString(),
      delivery: 'email' as const,
    };
  }

  async previewInvite(inviteRef: string) {
    const invite = await this.resolveInviteReference(inviteRef);
    const workspace = await this.workspaceRepo.findOne({ where: { id: invite.workspaceId } });

    if (!workspace) {
      throw new NotFoundException('This invite points to a workspace that no longer exists.');
    }

    const project = invite.projectId
      ? await this.projectRepo.findOne({ where: { id: invite.projectId } })
      : null;
    const existingUser = await this.userRepo.findOne({ where: { email: invite.email } });

    return {
      inviteId: invite.id,
      email: invite.email,
      scope: invite.scope,
      role: invite.role,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      hasExistingAccount: Boolean(existingUser),
      expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
      status: invite.acceptedAt ? 'accepted' : 'pending',
    };
  }

  async acceptInvite(inviteRef: string, user: Pick<User, 'id' | 'email'>) {
    const invite = await this.resolveInviteReference(inviteRef);
    const normalizedEmail = user.email.trim().toLowerCase();

    if (normalizedEmail !== invite.email) {
      throw new UnauthorizedException('Sign in or register with the invited email address to accept this invite.');
    }

    if (invite.acceptedAt && invite.acceptedByUserId && invite.acceptedByUserId !== user.id) {
      throw new ConflictException('This invite has already been accepted.');
    }

    if (!invite.acceptedAt) {
      this.ensureInviteNotExpired(invite.expiresAt);
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: invite.workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.ensureWorkspaceMembership(
      user.id,
      workspace.id,
      invite.scope === 'workspace'
        ? (invite.role as WorkspaceMemberRole)
        : WorkspaceMemberRole.Member,
    );

    let projectId: string | null = null;
    let redirectTo = `/w/${workspace.id}`;

    if (invite.scope === 'project' && invite.projectId) {
      const project = await this.projectRepo.findOne({ where: { id: invite.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await this.ensureProjectMembership(user.id, project.id, invite.role as ProjectMemberRole);
      projectId = project.id;
      redirectTo = `/w/${workspace.id}/p/${project.id}`;
    }

    if (invite.id && !invite.acceptedAt) {
      await this.invitationRepo.update(invite.id, {
        acceptedAt: new Date(),
        acceptedByUserId: user.id,
      });
    }

    return {
      accepted: true,
      redirectTo,
      workspaceId: workspace.id,
      projectId,
    };
  }

  private async createInvitationRecord({
    scope,
    email,
    workspaceId,
    projectId,
    role,
    inviterId,
  }: {
    scope: InviteScope;
    email: string;
    workspaceId: string;
    projectId: string | null;
    role: string;
    inviterId: string;
  }) {
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

    const invitation = this.invitationRepo.create({
      scope,
      email,
      workspaceId,
      projectId,
      role,
      inviterId,
      expiresAt,
      acceptedAt: null,
      acceptedByUserId: null,
    });

    return this.invitationRepo.save(invitation);
  }

  private async resolveInviteReference(inviteRef: string): Promise<ResolvedInvite> {
    if (!inviteRef?.trim()) {
      throw new BadRequestException('Invite id is required.');
    }

    const invitation = await this.findInvitationById(inviteRef);
    if (invitation) {
      if (!invitation.acceptedAt) {
        this.ensureInviteNotExpired(invitation.expiresAt);
      }

      return {
        id: invitation.id,
        scope: invitation.scope,
        email: invitation.email,
        workspaceId: invitation.workspaceId,
        projectId: invitation.projectId ?? null,
        role: invitation.role,
        inviterId: invitation.inviterId,
        expiresAt: invitation.expiresAt,
        acceptedAt: invitation.acceptedAt ?? null,
        acceptedByUserId: invitation.acceptedByUserId ?? null,
      };
    }

    const payload = await this.verifyInviteToken(inviteRef);

    return {
      id: null,
      scope: payload.scope,
      email: payload.email.trim().toLowerCase(),
      workspaceId: payload.workspaceId,
      projectId: payload.projectId ?? null,
      role: payload.role,
      inviterId: payload.inviterId,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      acceptedAt: null,
      acceptedByUserId: null,
    };
  }

  private async findInvitationById(inviteRef: string): Promise<Invitation | null> {
    if (!this.isUuid(inviteRef)) {
      return null;
    }

    return this.invitationRepo.findOne({ where: { id: inviteRef } });
  }

  private async verifyInviteToken(token: string): Promise<InviteTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<InviteTokenPayload>(token);

      if (payload.type !== 'mesh-invite' || !payload.email || !payload.workspaceId || !payload.scope) {
        throw new BadRequestException('This invite link is invalid.');
      }

      return payload;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('This invite link is invalid or has expired.');
    }
  }

  private ensureInviteNotExpired(expiresAt: Date | null) {
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This invite has expired. Ask the sender for a new invite.');
    }
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private normalizeWorkspaceRole(role?: WorkspaceInviteRole): WorkspaceMemberRole {
    if (role === WorkspaceMemberRole.Owner || role === 'Owner') {
      return WorkspaceMemberRole.Owner;
    }

    return WorkspaceMemberRole.Member;
  }

  private normalizeProjectRole(role?: ProjectInviteRole): ProjectMemberRole {
    if (role === ProjectMemberRole.Admin || role === 'Admin') {
      return ProjectMemberRole.Admin;
    }

    return ProjectMemberRole.Member;
  }

  private async ensureWorkspaceMembership(userId: string, workspaceId: string, role: WorkspaceMemberRole) {
    const existing = await this.workspaceMemberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (existing) {
      return existing;
    }

    const member = this.workspaceMemberRepo.create({
      workspaceId,
      userId,
      role: role || WorkspaceMemberRole.Member,
    });

    return this.workspaceMemberRepo.save(member);
  }

  private async ensureProjectMembership(userId: string, projectId: string, role: ProjectMemberRole) {
    const existing = await this.projectMemberRepo.findOne({
      where: { projectId, userId },
    });

    if (existing) {
      return existing;
    }

    const projectMember = this.projectMemberRepo.create({
      projectId,
      userId,
      role: role || ProjectMemberRole.Member,
    });

    return this.projectMemberRepo.save(projectMember);
  }

  private buildInviteUrl(inviteId: string): string {
    const baseUrl = process.env.WEB_URL || 'http://localhost:5173';
    return `${baseUrl}/invite/${encodeURIComponent(inviteId)}`;
  }

}
