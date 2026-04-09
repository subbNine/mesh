import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMemberRole, TaskStatus } from '@mesh/shared';

import { Pagination, PaginatedResult, PaginatedResultType } from '../../common/utils/pagination.util';
import { ActivityService } from '../activity/activity.service';
import { CanvasService } from '../canvas/canvas.service';
import { DependenciesService } from '../dependencies/dependencies.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskAssignee } from './entities/task-assignees.entity';
import { Task } from './entities/tasks.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly taskAssigneeRepo: Repository<TaskAssignee>,
    private readonly projectsService: ProjectsService,
    @Inject(forwardRef(() => CanvasService))
    private readonly canvasService: CanvasService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
    private readonly dependenciesService: DependenciesService,
  ) {}

  async create(projectId: string, userId: string, dto: CreateTaskDto): Promise<Task> {
    await this.projectsService.checkAccess(projectId, userId);

    const normalizedAssigneeIds = this.normalizeAssigneeIds(dto.assigneeIds, dto.assigneeId);

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description,
      status: dto.status,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      assigneeId: normalizedAssigneeIds[0] ?? null,
      projectId,
      createdBy: userId,
    });

    const saved = await this.taskRepo.save(task);

    if (normalizedAssigneeIds.length > 0) {
      await this.syncTaskAssignees(saved, normalizedAssigneeIds, userId);
    }

    await this.canvasService.createEmpty(saved.id);

    const hydratedTask = await this.findOne(saved.id, userId);

    await this.activityService.recordTaskCreated(hydratedTask, userId).catch((error) => {
      console.error('Failed to record task.created activity event', error);
    });

    return hydratedTask;
  }

  async findAll(
    projectId: string,
    userId: string,
    filters?: {
      status?: string;
      assigneeId?: string;
      search?: string;
      dueDate?: string;
      dependsOn?: string | boolean;
      blocks?: string | boolean;
      page?: number;
      perPage?: number;
    },
  ): Promise<PaginatedResultType<Task>> {
    await this.projectsService.checkAccess(projectId, userId);

    const pagination = new Pagination(filters?.page, filters?.perPage);
    const query = this.baseTaskQuery()
      .where('task.projectId = :projectId', { projectId })
      .distinct(true);

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.assigneeId) {
      const requestedAssigneeIds = Array.from(
        new Set(
          filters.assigneeId
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => (value === 'me' ? userId : value)),
        ),
      );

      const includeUnassigned = requestedAssigneeIds.includes('unassigned');
      const assigneeIds = requestedAssigneeIds.filter((value) => value !== 'unassigned');

      if (includeUnassigned && assigneeIds.length > 0) {
        query.andWhere('(taskAssignees.id IS NULL OR taskAssignees.userId IN (:...assigneeIds))', { assigneeIds });
      } else if (includeUnassigned) {
        query.andWhere('taskAssignees.id IS NULL');
      } else if (assigneeIds.length > 0) {
        query.andWhere('taskAssignees.userId IN (:...assigneeIds)', { assigneeIds });
      }
    }

    if (filters?.search?.trim()) {
      query.andWhere('(task.title ILIKE :search OR task.description ILIKE :search)', {
        search: `%${filters.search.trim()}%`,
      });
    }

    if (filters?.dueDate) {
      query.andWhere('DATE(task."dueDate") = :dueDate', { dueDate: filters.dueDate });
    }

    if (filters?.dependsOn === true || filters?.dependsOn === 'true') {
      query.andWhere(
        'EXISTS (SELECT 1 FROM task_dependencies dependency_in WHERE dependency_in."blockedTaskId" = task.id)',
      );
    }

    if (filters?.blocks === true || filters?.blocks === 'true') {
      query.andWhere(
        'EXISTS (SELECT 1 FROM task_dependencies dependency_out WHERE dependency_out."blockingTaskId" = task.id)',
      );
    }

    query.orderBy('task.createdAt', 'DESC');
    query.skip(pagination.skip).take(pagination.perPage);

    const [tasks, total] = await query.getManyAndCount();
    const hydratedTasks = this.hydrateAssigneesForTasks(tasks);
    const decoratedTasks = await this.dependenciesService.attachDependencyState(hydratedTasks);

    return PaginatedResult.create(decoratedTasks, total, pagination);
  }

  async findOne(taskId: string, userId: string): Promise<Task> {
    const task = await this.baseTaskQuery()
      .where('task.id = :taskId', { taskId })
      .getOne();

    if (!task) {
      throw new NotFoundException('Task bound to parameters not located');
    }

    await this.projectsService.checkAccess(task.projectId, userId);

    const [decoratedTask] = await this.dependenciesService.attachDependencyState([
      this.hydrateAssignees(task),
    ]);

    return decoratedTask;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(taskId, userId);

    const previousStatus = task.status;
    const previousDueDate = task.dueDate ? new Date(task.dueDate).toISOString() : null;
    const previousPrimaryAssigneeId = task.assigneeId;

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    const saved = await this.taskRepo.save(task);

    const nextAssigneeIds =
      dto.assigneeIds !== undefined || dto.assigneeId !== undefined
        ? this.normalizeAssigneeIds(dto.assigneeIds, dto.assigneeId)
        : null;

    if (nextAssigneeIds) {
      await this.syncTaskAssignees(saved, nextAssigneeIds, userId);
    }

    const dueDateChanged =
      dto.dueDate !== undefined &&
      previousDueDate !== (saved.dueDate ? new Date(saved.dueDate).toISOString() : null);
    const statusChanged = dto.status !== undefined && previousStatus !== saved.status;
    const nextPrimaryAssigneeId = nextAssigneeIds ? (nextAssigneeIds[0] ?? null) : saved.assigneeId;
    const primaryAssigneeChanged = nextAssigneeIds !== null && previousPrimaryAssigneeId !== nextPrimaryAssigneeId;

    if (statusChanged) {
      await this.activityService.recordTaskStatusChanged(saved, userId, previousStatus, saved.status).catch((error) => {
        console.error('Failed to record task.status_changed activity event', error);
      });

      if (saved.status === TaskStatus.Done) {
        await this.dependenciesService.handleTaskCompleted(saved, userId).catch((error) => {
          console.error('Failed to resolve dependency unblock notifications', error);
        });
      }
    }

    if (primaryAssigneeChanged) {
      await this.activityService.recordTaskAssigned(saved, userId, previousPrimaryAssigneeId, nextPrimaryAssigneeId).catch((error) => {
        console.error('Failed to record task.assigned activity event', error);
      });
    }

    if (dueDateChanged) {
      await this.activityService.recordTaskDueDateChanged(saved, userId, previousDueDate, saved.dueDate).catch((error) => {
        console.error('Failed to record task.due_date_set activity event', error);
      });
    }

    return this.findOne(saved.id, userId);
  }

  async addAssignee(taskId: string, userId: string, assigneeUserId: string): Promise<Task> {
    const task = await this.findOne(taskId, userId);
    const nextAssigneeIds = Array.from(new Set([...(task.assignees ?? []).map((assignee) => assignee.id), assigneeUserId]));

    await this.syncTaskAssignees(task, nextAssigneeIds, userId);
    return this.findOne(taskId, userId);
  }

  async removeAssignee(taskId: string, userId: string, assigneeUserId: string): Promise<Task> {
    const task = await this.findOne(taskId, userId);
    const nextAssigneeIds = (task.assignees ?? [])
      .map((assignee) => assignee.id)
      .filter((id) => id !== assigneeUserId);

    await this.syncTaskAssignees(task, nextAssigneeIds, userId);
    return this.findOne(taskId, userId);
  }

  async updateSnapshot(taskId: string, snapshotUrl: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Requested native context task mapped undefined locally.');
    }

    task.snapshotUrl = snapshotUrl;
    await this.taskRepo.save(task);
  }

  async delete(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Target task not accessible');
    }

    const { role } = await this.projectsService.checkAccess(task.projectId, userId);
    const isCreator = task.createdBy === userId;
    const isAdmin = role === ProjectMemberRole.Admin;

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Task deletion specifically relies on ownership or administrative privileges.');
    }

    await this.taskRepo.remove(task);
  }

  private baseTaskQuery() {
    return this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.taskAssignees', 'taskAssignees')
      .leftJoinAndSelect('taskAssignees.user', 'taskAssigneeUser');
  }

  private hydrateAssignees(task: Task): Task {
    const joinedAssignees = (task.taskAssignees ?? [])
      .map((taskAssignee) => taskAssignee.user)
      .filter(Boolean);

    const assignees = joinedAssignees.length > 0
      ? joinedAssignees
      : task.assignee
        ? [task.assignee]
        : [];

    task.assignees = assignees;
    task.assignee = assignees[0] ?? null;
    task.assigneeId = assignees[0]?.id ?? null;

    return task;
  }

  private hydrateAssigneesForTasks(tasks: Task[]): Task[] {
    return tasks.map((task) => this.hydrateAssignees(task));
  }

  private normalizeAssigneeIds(assigneeIds?: string[] | null, assigneeId?: string | null): string[] {
    const combined = [...(assigneeIds ?? []), ...(assigneeId ? [assigneeId] : [])]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));

    const uniqueIds = Array.from(new Set(combined));

    if (uniqueIds.length > 5) {
      throw new BadRequestException('A task can have between 0 and 5 assignees.');
    }

    return uniqueIds;
  }

  private async syncTaskAssignees(task: Task, assigneeIds: string[], actorId: string): Promise<void> {
    const uniqueIds = this.normalizeAssigneeIds(assigneeIds);

    await Promise.all(
      uniqueIds.map(async (candidateUserId) => {
        await this.projectsService.checkAccess(task.projectId, candidateUserId);
      }),
    );

    const existing = await this.taskAssigneeRepo.find({
      where: { taskId: task.id },
    });

    const existingIds = existing.map((item) => item.userId);
    const additions = uniqueIds.filter((id) => !existingIds.includes(id));
    const removals = existing.filter((item) => !uniqueIds.includes(item.userId));

    if (removals.length > 0) {
      await this.taskAssigneeRepo.remove(removals);
    }

    if (additions.length > 0) {
      const rows = additions.map((userId) => this.taskAssigneeRepo.create({
        taskId: task.id,
        userId,
        assignedBy: actorId,
      }));

      await this.taskAssigneeRepo.save(rows);

      await Promise.all(
        additions.map((userId) =>
          this.notificationsService.createTaskAssignedNotification(task.id, userId, actorId).catch((error) => {
            console.error('Failed to send task assignment notification', error);
          }),
        ),
      );
    }

    task.assigneeId = uniqueIds[0] ?? null;
    await this.taskRepo.update({ id: task.id }, { assigneeId: task.assigneeId });
  }
}
