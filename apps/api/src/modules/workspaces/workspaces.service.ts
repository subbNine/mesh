import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from './entities/workspaces.entity';
import { WorkspaceMember } from './entities/workspace_members.entity';
import { User } from '../users/entities/users.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceMemberRole, TaskStatus } from '@mesh/shared';
import { InvitationsService } from '../auth/invitations.service';
import { Task } from '../tasks/entities/tasks.entity';
import { TaskAssignee } from '../tasks/entities/task-assignees.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { ActivityEvent } from '../activity/entities/activity-events.entity';
import { Not } from 'typeorm';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly memberRepo: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly taskAssigneeRepo: Repository<TaskAssignee>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(ActivityEvent)
    private readonly activityEventRepo: Repository<ActivityEvent>,
    private readonly invitationsService: InvitationsService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace = this.workspaceRepo.create({
      name: dto.name,
      ownerId: userId,
    });
    
    // Save workspace first to get ID
    const savedWorkspace = await this.workspaceRepo.save(workspace);

    // Add creator as owner member
    const member = this.memberRepo.create({
      workspaceId: savedWorkspace.id,
      userId: userId,
      role: WorkspaceMemberRole.Owner,
    });
    
    await this.memberRepo.save(member);

    return savedWorkspace;
  }

  async findAllForUser(userId: string): Promise<any[]> {
    const members = await this.memberRepo.find({
      where: { userId },
      relations: ['workspace'],
    });

    const workspaces = members.map(m => m.workspace);

    // Get member counts for each
    const result = await Promise.all(
      workspaces.map(async (ws) => {
        const memberCount = await this.memberRepo.count({ where: { workspaceId: ws.id } });
        return {
          ...ws,
          memberCount,
        };
      })
    );

    return result;
  }

  async findOne(workspaceId: string, userId: string): Promise<Workspace> {
    const isMember = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const workspace = await this.workspaceRepo.findOne({
      where: { id: workspaceId },
      relations: ['owner'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async inviteMember(workspaceId: string, inviterId: string, dto: InviteMemberDto) {
    const inviterMember = await this.memberRepo.findOne({
      where: { workspaceId, userId: inviterId },
    });

    if (!inviterMember || inviterMember.role !== WorkspaceMemberRole.Owner) {
      throw new ForbiddenException('Only workspace owners can invite members');
    }

    return this.invitationsService.createWorkspaceInvite(
      workspaceId,
      inviterId,
      dto.email,
      dto.role || WorkspaceMemberRole.Member,
    );
  }

  async removeMember(workspaceId: string, removerId: string, targetUserId: string): Promise<void> {
    const removerMember = await this.memberRepo.findOne({
      where: { workspaceId, userId: removerId },
    });

    if (!removerMember || removerMember.role !== WorkspaceMemberRole.Owner) {
      throw new ForbiddenException('Only workspace owners can remove members');
    }

    const targetMember = await this.memberRepo.findOne({
      where: { workspaceId, userId: targetUserId },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in workspace');
    }

    if (targetMember.role === WorkspaceMemberRole.Owner) {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.memberRepo.remove(targetMember);
  }

  async getMembers(workspaceId: string, userId: string): Promise<any[]> {
    // Verify requestor is member
    const isMember = await this.memberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const members = await this.memberRepo.find({
      where: { workspaceId },
      relations: ['user'],
    });

    // Enhance each member with counts and projects
    return Promise.all(
      members.map(async (member) => {
        // Count active tasks assigned to this user
        // Using task_assignees join table
        const activeTaskCount = await this.taskRepo.count({
          where: {
            taskAssignees: { userId: member.userId },
            status: Not(TaskStatus.Done),
            project: { workspaceId }, // Scoped to this workspace
          },
          relations: ['taskAssignees', 'project'],
        });

        // Get projects this user is part of (within this workspace)
        const projectMembers = await this.projectMemberRepo.find({
          where: {
            userId: member.userId,
            project: { workspaceId },
          },
          relations: ['project'],
        });

        const projects = projectMembers.map((pm) => ({
          id: pm.project.id,
          name: pm.project.name,
        }));

        return {
          ...member,
          activeTaskCount,
          projects,
        };
      }),
    );
  }

  async getMemberProfile(workspaceId: string, requestorId: string, targetUserId: string): Promise<any> {
    // Verify requestor is member
    const isMember = await this.memberRepo.findOne({
      where: { workspaceId, userId: requestorId },
    });

    if (!isMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId: targetUserId },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // Active task count
    const activeTaskCount = await this.taskRepo.count({
      where: {
        taskAssignees: { userId: targetUserId },
        status: Not(TaskStatus.Done),
        project: { workspaceId },
      },
      relations: ['taskAssignees', 'project'],
    });

    // Projects
    const projectMembers = await this.projectMemberRepo.find({
      where: {
        userId: targetUserId,
        project: { workspaceId },
      },
      relations: ['project'],
    });

    const projects = projectMembers.map((pm) => ({
      id: pm.project.id,
      name: pm.project.name,
    }));

    // Recent Activity (last 5)
    const recentActivity = await this.activityEventRepo.find({
      where: {
        workspaceId,
        actorId: targetUserId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 5,
    });

    return {
      ...member,
      activeTaskCount,
      projects,
      recentActivity,
    };
  }

  async update(workspaceId: string, userId: string, dto: UpdateWorkspaceDto): Promise<Workspace> {
    const isOwner = await this.memberRepo.findOne({
      where: { workspaceId, userId, role: WorkspaceMemberRole.Owner },
    });

    if (!isOwner) {
      throw new ForbiddenException('Only workspace owners can update settings');
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    if (dto.name) workspace.name = dto.name;
    
    return this.workspaceRepo.save(workspace);
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    const isOwner = await this.memberRepo.findOne({
      where: { workspaceId, userId, role: WorkspaceMemberRole.Owner },
    });

    if (!isOwner) {
      throw new ForbiddenException('Only workspace owners can delete the workspace');
    }

    const workspace = await this.workspaceRepo.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // Due to CASCADE, deleting the workspace deletes members and other relationships
    await this.workspaceRepo.remove(workspace);
  }
}

