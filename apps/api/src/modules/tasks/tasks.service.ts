import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/tasks.entity';
import { ProjectsService } from '../projects/projects.service';
import { CanvasService } from '../canvas/canvas.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityService } from '../activity/activity.service';
import { Pagination, PaginatedResult, PaginatedResultType } from '../../common/utils/pagination.util';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectMemberRole } from '@mesh/shared';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly projectsService: ProjectsService,
    @Inject(forwardRef(() => CanvasService))
    private readonly canvasService: CanvasService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
  ) { }

  async create(projectId: string, userId: string, dto: CreateTaskDto): Promise<Task> {
    await this.projectsService.checkAccess(projectId, userId);

    const task = this.taskRepo.create({
      ...dto,
      projectId,
      createdBy: userId,
    });
    const saved = await this.taskRepo.save(task);

    // Bootstrap local dependent properties (e.g., canvas instances mapping securely to the nested task bindings)
    await this.canvasService.createEmpty(saved.id);

    const hydratedTask = await this.taskRepo.findOne({
      where: { id: saved.id },
      relations: ['assignee', 'creator'],
    });

    if (hydratedTask) {
      await this.activityService.recordTaskCreated(hydratedTask, userId)
        .catch((error) => console.error('Failed to record task.created activity event', error));
    }

    return hydratedTask as Task;
  }

  async findAll(
    projectId: string,
    userId: string,
    filters?: { status?: string; assigneeId?: string; page?: number; perPage?: number }
  ): Promise<PaginatedResultType<Task>> {
    await this.projectsService.checkAccess(projectId, userId);

    const pagination = new Pagination(filters?.page, filters?.perPage);

    const query = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .where('task.projectId = :projectId', { projectId });

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.assigneeId) {
      if (filters.assigneeId === 'unassigned') {
        query.andWhere('task.assigneeId IS NULL');
      } else {
        query.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
      }
    }

    query.orderBy('task.createdAt', 'DESC');
    query.skip(pagination.skip).take(pagination.perPage);

    const [tasks, total] = await query.getManyAndCount();
    return PaginatedResult.create(tasks, total, pagination);
  }

  async findOne(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignee', 'creator'],
    });

    if (!task) throw new NotFoundException('Task bound to parameters not located');

    // Assure hierarchical verification implicitly scaling generic methods mapping access globally
    await this.projectsService.checkAccess(task.projectId, userId);
    return task;
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(taskId, userId);

    const previousStatus = task.status;
    const previousDueDate = task.dueDate ? new Date(task.dueDate).toISOString() : null;
    const wasAssignedTo = task.assigneeId;
    const isChangingAssignee = dto.assigneeId !== undefined && dto.assigneeId !== wasAssignedTo;

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description;
    if (dto.status !== undefined) task.status = dto.status;
    if (dto.assigneeId !== undefined) {
      task.assigneeId = dto.assigneeId === '' ? null : dto.assigneeId;
    }
    if (dto.dueDate !== undefined) {
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    const saved = await this.taskRepo.save(task);

    // Propagate implicit generic notifications matching schema structures natively!
    if (isChangingAssignee && saved.assigneeId) {
      await this.notificationsService.createTaskAssignedNotification(saved.id, saved.assigneeId, userId)
        .catch(e => console.error('Silent failure triggering assignment generic map correctly mapping boundary: ', e));
    }

    const dueDateChanged = dto.dueDate !== undefined
      && previousDueDate !== (saved.dueDate ? new Date(saved.dueDate).toISOString() : null);
    const statusChanged = dto.status !== undefined && previousStatus !== saved.status;

    if (statusChanged) {
      await this.activityService.recordTaskStatusChanged(saved, userId, previousStatus, saved.status)
        .catch((error) => console.error('Failed to record task.status_changed activity event', error));
    }

    if (isChangingAssignee) {
      await this.activityService.recordTaskAssigned(saved, userId, wasAssignedTo, saved.assigneeId)
        .catch((error) => console.error('Failed to record task.assigned activity event', error));
    }

    if (dueDateChanged) {
      await this.activityService.recordTaskDueDateChanged(saved, userId, previousDueDate, saved.dueDate)
        .catch((error) => console.error('Failed to record task.due_date_set activity event', error));
    }

    return this.taskRepo.findOne({
      where: { id: saved.id },
      relations: ['assignee', 'creator'],
    }) as Promise<Task>;
  }

  async updateSnapshot(taskId: string, snapshotUrl: string): Promise<void> {
    // Internal abstract map execution silently validating structural inputs.
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Requested native context task mapped undefined locally.');

    task.snapshotUrl = snapshotUrl;
    await this.taskRepo.save(task);
  }

  async delete(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Target task not accessible');

    const { role } = await this.projectsService.checkAccess(task.projectId, userId);

    // Allow deletion if user is an Admin OR the original creator
    const isCreator = task.createdBy === userId;
    const isAdmin = role === ProjectMemberRole.Admin;

    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Task deletion specifically relies on ownership or administrative privileges.');
    }

    // Cascade bound inherently executes deletion routines mapping internal documents cleanly natively globally
    await this.taskRepo.remove(task);
  }
}
