import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ActivityEvent } from './entities/activity-events.entity';
import { Project } from '../projects/entities/projects.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { ProjectExclusion } from '../projects/entities/project_exclusions.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { User } from '../users/entities/users.entity';
import { ActivityEventType, IActivityEvent } from '@mesh/shared';

interface ActivityListFilters {
  projectId?: string | string[];
  actorId?: string | string[];
  eventType?: string | string[];
  from?: string;
  to?: string;
  page?: number | string;
  limit?: number | string;
}

type ActivityDateValue = string | Date | null | undefined;

interface ActivityTaskRef {
  id: string;
  projectId: string;
  title: string;
}

interface ActivityProjectRef {
  id: string;
  workspaceId: string;
  name: string;
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEvent)
    private readonly activityRepo: Repository<ActivityEvent>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(ProjectExclusion)
    private readonly projectExclusionRepo: Repository<ProjectExclusion>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async recordTaskCreated(task: ActivityTaskRef, actorId: string) {
    return this.createForTask(task, actorId, ActivityEventType.TaskCreated, {});
  }

  async recordTaskStatusChanged(
    task: ActivityTaskRef,
    actorId: string,
    fromStatus: string,
    toStatus: string,
  ) {
    return this.createForTask(task, actorId, ActivityEventType.TaskStatusChanged, {
      fromStatus,
      toStatus,
    });
  }

  async recordTaskAssigned(
    task: ActivityTaskRef,
    actorId: string,
    previousAssigneeId: string | null,
    assigneeId: string | null,
  ) {
    const [previousAssigneeName, assigneeName] = await Promise.all([
      this.getUserDisplayName(previousAssigneeId),
      this.getUserDisplayName(assigneeId),
    ]);

    return this.createForTask(task, actorId, ActivityEventType.TaskAssigned, {
      previousAssigneeId,
      previousAssigneeName,
      assigneeId,
      assigneeName,
    });
  }

  async recordTaskDueDateChanged(
    task: ActivityTaskRef,
    actorId: string,
    previousDueDate?: ActivityDateValue,
    dueDate?: ActivityDateValue,
  ) {
    return this.createForTask(task, actorId, ActivityEventType.TaskDueDateSet, {
      previousDueDate: this.toIso(previousDueDate),
      dueDate: this.toIso(dueDate),
    });
  }

  async recordCommentCreated(
    task: ActivityTaskRef,
    actorId: string,
    comment: { id: string; body: string },
  ) {
    return this.createForTask(task, actorId, ActivityEventType.CommentCreated, {
      commentId: comment.id,
      commentPreview: this.previewText(comment.body),
    });
  }

  async recordCommentResolved(
    task: ActivityTaskRef,
    actorId: string,
    comment: { id: string; body: string },
  ) {
    return this.createForTask(task, actorId, ActivityEventType.CommentResolved, {
      commentId: comment.id,
      commentPreview: this.previewText(comment.body),
    });
  }

  async recordProjectCreated(project: ActivityProjectRef, actorId: string) {
    return this.createForProject(project, actorId, ActivityEventType.ProjectCreated, {});
  }

  async recordMemberAdded(project: ActivityProjectRef, actorId: string, memberId: string) {
    const memberName = await this.getUserDisplayName(memberId);

    return this.createForProject(project, actorId, ActivityEventType.MemberAdded, {
      memberId,
      memberName,
    });
  }

  async getWorkspaceActivity(userId: string, workspaceId: string, filters: ActivityListFilters) {
    await this.ensureWorkspaceAccess(workspaceId, userId);

    const accessibleProjectIds = await this.getAccessibleProjectIds(workspaceId, userId);
    const { page, limit } = this.normalizePagination(filters.page, filters.limit);
    const projectIds = this.parseList(filters.projectId);
    const actorIds = this.parseList(filters.actorId);
    const eventTypes = this.parseList(filters.eventType);

    const query = this.activityRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.actor', 'actor')
      .where('event.workspaceId = :workspaceId', { workspaceId });

    query.andWhere(
      new Brackets((qb) => {
        qb.where('event.projectId IS NULL');
        if (accessibleProjectIds.length > 0) {
          qb.orWhere('event.projectId IN (:...accessibleProjectIds)', { accessibleProjectIds });
        }
      }),
    );

    if (projectIds.length > 0) {
      query.andWhere('event.projectId IN (:...projectIds)', { projectIds });
    }

    if (actorIds.length > 0) {
      query.andWhere('event.actorId IN (:...actorIds)', { actorIds });
    }

    if (eventTypes.length > 0) {
      query.andWhere('event.eventType IN (:...eventTypes)', { eventTypes });
    }

    if (filters.from) {
      query.andWhere('event.createdAt >= :from', { from: filters.from });
    }

    if (filters.to) {
      query.andWhere('event.createdAt <= :to', { to: filters.to });
    }

    query
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [events, total] = await query.getManyAndCount();

    return {
      events: events as IActivityEvent[],
      total,
      hasMore: page * limit < total,
    };
  }

  async getTaskActivity(userId: string, taskId: string, filters: Pick<ActivityListFilters, 'page' | 'limit'>) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.ensureProjectAccess(task.projectId, userId);

    const { page, limit } = this.normalizePagination(filters.page, filters.limit);

    const [events, total] = await this.activityRepo.createQueryBuilder('event')
      .leftJoinAndSelect('event.actor', 'actor')
      .where('event.taskId = :taskId', { taskId })
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      events: events as IActivityEvent[],
      total,
      hasMore: page * limit < total,
    };
  }

  private async createForTask(
    task: ActivityTaskRef,
    actorId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const project = await this.projectRepo.findOne({ where: { id: task.projectId } });
    if (!project) {
      return null;
    }

    const event = this.activityRepo.create({
      workspaceId: project.workspaceId,
      projectId: project.id,
      taskId: task.id,
      actorId,
      eventType,
      payload: {
        taskTitle: task.title,
        projectName: project.name,
        ...payload,
      },
    });

    return this.activityRepo.save(event);
  }

  private async createForProject(
    project: ActivityProjectRef,
    actorId: string,
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const event = this.activityRepo.create({
      workspaceId: project.workspaceId,
      projectId: project.id,
      taskId: null,
      actorId,
      eventType,
      payload: {
        projectName: project.name,
        ...payload,
      },
    });

    return this.activityRepo.save(event);
  }

  private async ensureWorkspaceAccess(workspaceId: string, userId: string) {
    const membership = await this.workspaceMemberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You do not have access to this workspace');
    }
  }

  private async ensureProjectAccess(projectId: string, userId: string) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const directMembership = await this.projectMemberRepo.findOne({
      where: { projectId, userId },
    });

    if (directMembership) {
      return project;
    }

    const workspaceMembership = await this.workspaceMemberRepo.findOne({
      where: { workspaceId: project.workspaceId, userId },
    });

    if (!workspaceMembership) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const exclusion = await this.projectExclusionRepo.findOne({
      where: { projectId, userId },
    });

    if (exclusion) {
      throw new ForbiddenException('You have been excluded from this project');
    }

    return project;
  }

  private async getAccessibleProjectIds(workspaceId: string, userId: string) {
    const workspaceProjects = await this.projectRepo.find({ where: { workspaceId } });
    const exclusions = await this.projectExclusionRepo.find({ where: { userId } });
    const memberships = await this.projectMemberRepo.find({ where: { userId } });

    const excludedProjectIds = new Set(exclusions.map((item) => item.projectId));
    const memberProjectIds = new Set(memberships.map((item) => item.projectId));

    return workspaceProjects
      .filter((project) => !excludedProjectIds.has(project.id) || memberProjectIds.has(project.id))
      .map((project) => project.id);
  }

  private parseList(value?: string | string[]) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry) => entry.split(',')).map((entry) => entry.trim()).filter(Boolean);
    }

    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  private normalizePagination(page?: number | string, limit?: number | string) {
    const parsedPage = Number.parseInt(String(page ?? '1'), 10);
    const parsedLimit = Number.parseInt(String(limit ?? '50'), 10);

    return {
      page: Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
      limit: Number.isNaN(parsedLimit) || parsedLimit < 1 ? 50 : Math.min(parsedLimit, 100),
    };
  }

  private async getUserDisplayName(userId?: string | null) {
    if (!userId) {
      return null;
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    return `${user.firstName} ${user.lastName}`.trim();
  }

  private toIso(value?: ActivityDateValue) {
    if (!value) {
      return null;
    }

    return new Date(value).toISOString();
  }

  private previewText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Activity payload text cannot be empty');
    }

    return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
  }
}
