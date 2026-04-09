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
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';

import { ProjectMemberRole, WorkspaceMemberRole } from '@mesh/shared';

import { Project } from '../projects/entities/projects.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { User } from '../users/entities/users.entity';
import { Workspace } from '../workspaces/entities/workspaces.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';

type InviteScope = 'workspace' | 'project';

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

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private readonly transporter: nodemailer.Transporter;

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
    private readonly jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async createWorkspaceInvite(
    workspaceId: string,
    inviterId: string,
    email: string,
    role: WorkspaceMemberRole | string = WorkspaceMemberRole.Member,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
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

    const token = await this.createInviteToken({
      scope: 'workspace',
      email: normalizedEmail,
      workspaceId,
      role,
      inviterId,
    });

    await this.sendInvitationEmail({
      to: normalizedEmail,
      subject: `You're invited to join ${workspace.name} on Mesh`,
      preheader: `${inviter?.firstName || 'A teammate'} invited you to collaborate in ${workspace.name}.`,
      headline: `Join ${workspace.name}`,
      body: `${inviter?.firstName || 'A teammate'} invited you to collaborate in Mesh. Accept the invite to join the workspace${role ? ` as ${role}` : ''}.`,
      inviteUrl: this.buildInviteUrl(token),
      ctaLabel: 'Accept workspace invite',
      metaLabel: 'Workspace access',
      metaValue: workspace.name,
    });

    return {
      invited: true,
      scope: 'workspace' as const,
      email: normalizedEmail,
      workspaceId,
      workspaceName: workspace.name,
      delivery: 'email' as const,
    };
  }

  async createProjectInvite(
    projectId: string,
    inviterId: string,
    email: string,
    role: ProjectMemberRole | string = ProjectMemberRole.Member,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
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

    const token = await this.createInviteToken({
      scope: 'project',
      email: normalizedEmail,
      workspaceId: project.workspaceId,
      projectId,
      role,
      inviterId,
    });

    await this.sendInvitationEmail({
      to: normalizedEmail,
      subject: `You're invited to ${project.name} on Mesh`,
      preheader: `${inviter?.firstName || 'A teammate'} invited you into the ${project.name} project.`,
      headline: `Join the ${project.name} project`,
      body: `${inviter?.firstName || 'A teammate'} invited you to collaborate on ${project.name} in the ${workspace.name} workspace. Accept the invite to finish setup and jump in.`,
      inviteUrl: this.buildInviteUrl(token),
      ctaLabel: 'Accept project invite',
      metaLabel: 'Project access',
      metaValue: `${workspace.name} · ${project.name}`,
    });

    return {
      invited: true,
      scope: 'project' as const,
      email: normalizedEmail,
      workspaceId: project.workspaceId,
      workspaceName: workspace.name,
      projectId,
      projectName: project.name,
      delivery: 'email' as const,
    };
  }

  async previewInvite(token: string) {
    const payload = await this.verifyInviteToken(token);
    const workspace = await this.workspaceRepo.findOne({ where: { id: payload.workspaceId } });

    if (!workspace) {
      throw new NotFoundException('This invite points to a workspace that no longer exists.');
    }

    const project = payload.projectId
      ? await this.projectRepo.findOne({ where: { id: payload.projectId } })
      : null;
    const existingUser = await this.userRepo.findOne({ where: { email: payload.email } });

    return {
      email: payload.email,
      scope: payload.scope,
      role: payload.role,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      projectId: project?.id ?? null,
      projectName: project?.name ?? null,
      hasExistingAccount: Boolean(existingUser),
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
    };
  }

  async acceptInvite(token: string, user: Pick<User, 'id' | 'email'>) {
    const payload = await this.verifyInviteToken(token);
    const normalizedEmail = user.email.trim().toLowerCase();

    if (normalizedEmail !== payload.email) {
      throw new UnauthorizedException('Sign in or register with the invited email address to accept this invite.');
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: payload.workspaceId } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.ensureWorkspaceMembership(
      user.id,
      workspace.id,
      payload.scope === 'workspace'
        ? (payload.role as WorkspaceMemberRole)
        : WorkspaceMemberRole.Member,
    );

    if (payload.scope === 'project' && payload.projectId) {
      const project = await this.projectRepo.findOne({ where: { id: payload.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }

      await this.ensureProjectMembership(user.id, project.id, payload.role as ProjectMemberRole);

      return {
        accepted: true,
        redirectTo: `/w/${workspace.id}/p/${project.id}`,
        workspaceId: workspace.id,
        projectId: project.id,
      };
    }

    return {
      accepted: true,
      redirectTo: `/w/${workspace.id}`,
      workspaceId: workspace.id,
      projectId: null,
    };
  }

  private async createInviteToken(payload: Omit<InviteTokenPayload, 'type'>): Promise<string> {
    return this.jwtService.signAsync(
      {
        type: 'mesh-invite',
        ...payload,
      },
      { expiresIn: '7d' },
    );
  }

  private async verifyInviteToken(token: string): Promise<InviteTokenPayload> {
    if (!token?.trim()) {
      throw new BadRequestException('Invite token is required.');
    }

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

  private buildInviteUrl(token: string): string {
    const baseUrl = process.env.WEB_URL || 'http://localhost:5173';
    return `${baseUrl}/register?invite=${encodeURIComponent(token)}`;
  }

  private async sendInvitationEmail({
    to,
    subject,
    preheader,
    headline,
    body,
    inviteUrl,
    ctaLabel,
    metaLabel,
    metaValue,
  }: {
    to: string;
    subject: string;
    preheader: string;
    headline: string;
    body: string;
    inviteUrl: string;
    ctaLabel: string;
    metaLabel: string;
    metaValue: string;
  }) {
    const html = `
      <div style="margin:0;padding:32px;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#132238;">
        <div style="max-width:640px;margin:0 auto;background:white;border-radius:24px;overflow:hidden;border:1px solid #d9e3ec;box-shadow:0 24px 64px rgba(21,33,50,0.08);">
          <div style="padding:24px 24px 12px;background:radial-gradient(circle at top left, rgba(39,159,189,0.18), transparent 45%), #08111f;color:white;">
            <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,0.08);font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">Mesh invite</div>
            <h1 style="margin:16px 0 8px;font-size:28px;line-height:1.1;">${headline}</h1>
            <p style="margin:0;color:rgba(237,244,255,0.8);font-size:14px;line-height:1.6;">${preheader}</p>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#43546a;">${body}</p>
            <div style="margin:0 0 20px;padding:14px 16px;border-radius:16px;background:#f8fbfd;border:1px solid #d9e3ec;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#617086;margin-bottom:6px;">${metaLabel}</div>
              <div style="font-size:15px;font-weight:700;color:#152132;">${metaValue}</div>
            </div>
            <a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#279fbd;color:white;text-decoration:none;font-weight:800;letter-spacing:0.04em;">${ctaLabel}</a>
            <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#617086;">If the button does not work, copy this link into your browser:<br /><span style="word-break:break-all;color:#279fbd;">${inviteUrl}</span></p>
          </div>
        </div>
      </div>
    `;

    if (!process.env.SMTP_USER) {
      this.logger.log(`Mock invitation email to ${to} | ${subject} | ${inviteUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Mesh Invitations" <no-reply@mesh.app>',
      to,
      subject,
      html,
    });
  }
}
