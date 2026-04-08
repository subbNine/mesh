import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ITaskDependency, ITaskDependenciesResponse, TaskStatus } from '@mesh/shared';

import { ProjectsService } from '../projects/projects.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Task } from '../tasks/entities/tasks.entity';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import { TaskDependency } from './entities/task-dependencies.entity';

@Injectable()
export class DependenciesService {
  constructor(
    @InjectRepository(TaskDependency)
    private readonly dependencyRepo: Repository<TaskDependency>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly projectsService: ProjectsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getForTask(taskId: string, userId: string): Promise<ITaskDependenciesResponse> {
    const task = await this.getAccessibleTask(taskId, userId);
    const dependencies = await this.getDependenciesForTaskIds([task.id]);
    return this.buildSummary(task.id, dependencies);
  }

  async create(taskId: string, userId: string, dto: CreateDependencyDto): Promise<ITaskDependency> {
    const currentTask = await this.getAccessibleTask(taskId, userId);
    const { blockingTaskId, blockedTaskId } = this.resolveRelationship(taskId, dto);

    if (blockingTaskId === blockedTaskId) {
      throw new BadRequestException('A task cannot depend on itself.');
    }

    const otherTaskId = blockingTaskId === taskId ? blockedTaskId : blockingTaskId;
    const otherTask = await this.getAccessibleTask(otherTaskId, userId);

    if (otherTask.projectId !== currentTask.projectId) {
      throw new BadRequestException('Dependencies must stay within the same project for MVP.');
    }

    const existing = await this.dependencyRepo.findOne({
      where: { blockingTaskId, blockedTaskId },
    });

    if (existing) {
      throw new ConflictException('This dependency already exists.');
    }

    const createsCycle = await this.wouldCreateCycle(blockingTaskId, blockedTaskId);
    if (createsCycle) {
      throw new BadRequestException('This would create a circular dependency.');
    }

    const dependency = this.dependencyRepo.create({
      blockingTaskId,
      blockedTaskId,
      createdBy: userId,
    });

    const saved = await this.dependencyRepo.save(dependency);
    const hydrated = await this.findDependencyById(saved.id);

    return this.toDependencyDto(hydrated);
  }

  async remove(dependencyId: string, userId: string): Promise<ITaskDependency> {
    const dependency = await this.findDependencyById(dependencyId);
    await this.projectsService.checkAccess(dependency.blockingTask.projectId, userId);

    const dto = this.toDependencyDto(dependency);
    await this.dependencyRepo.remove(dependency);
    return dto;
  }

  async attachDependencyState<T extends Task>(tasks: T[]): Promise<T[]> {
    if (tasks.length === 0) return tasks;

    const taskIds = tasks.map((task) => task.id);
    const dependencies = await this.getDependenciesForTaskIds(taskIds);

    for (const task of tasks) {
      const summary = this.buildSummary(task.id, dependencies);
      task.blockedBy = summary.blockedBy;
      task.blocks = summary.blocks;
      task.isBlocked = summary.isBlocked;
      task.dependencyCount = summary.dependencyCount;
    }

    return tasks;
  }

  async handleTaskCompleted(task: Task, actorId: string): Promise<void> {
    if (task.status !== TaskStatus.Done) {
      return;
    }

    const outgoingDependencies = await this.dependencyRepo.createQueryBuilder('dependency')
      .leftJoinAndSelect('dependency.blockedTask', 'blockedTask')
      .where('dependency.blockingTaskId = :taskId', { taskId: task.id })
      .getMany();

    if (outgoingDependencies.length === 0) {
      return;
    }

    const blockedTaskIds = Array.from(new Set(outgoingDependencies.map((dependency) => dependency.blockedTaskId)));
    const unresolvedRows = await this.dependencyRepo.createQueryBuilder('dependency')
      .leftJoin('dependency.blockingTask', 'upstreamTask')
      .select('dependency.blockedTaskId', 'blockedTaskId')
      .addSelect('COUNT(*)', 'count')
      .where('dependency.blockedTaskId IN (:...blockedTaskIds)', { blockedTaskIds })
      .andWhere('upstreamTask.status != :doneStatus', { doneStatus: TaskStatus.Done })
      .groupBy('dependency.blockedTaskId')
      .getRawMany<{ blockedTaskId: string; count: string }>();

    const unresolvedByTaskId = new Map(
      unresolvedRows.map((row) => [row.blockedTaskId, Number.parseInt(row.count, 10)]),
    );

    await Promise.all(
      outgoingDependencies.map(async (dependency) => {
        const unresolvedCount = unresolvedByTaskId.get(dependency.blockedTaskId) ?? 0;
        if (unresolvedCount === 0 && dependency.blockedTask.assigneeId) {
          await this.notificationsService.createTaskUnblockedNotification(
            dependency.blockedTaskId,
            dependency.blockedTask.assigneeId,
            actorId,
            {
              taskTitle: dependency.blockedTask.title,
              blockingTaskTitle: task.title,
            },
          );
        }
      }),
    );
  }

  private resolveRelationship(taskId: string, dto: CreateDependencyDto) {
    const hasBlocksTaskId = Boolean(dto.blocksTaskId);
    const hasDependsOnTaskId = Boolean(dto.dependsOnTaskId);

    if (hasBlocksTaskId === hasDependsOnTaskId) {
      throw new BadRequestException('Provide exactly one of blocksTaskId or dependsOnTaskId.');
    }

    return hasBlocksTaskId
      ? { blockingTaskId: taskId, blockedTaskId: dto.blocksTaskId as string }
      : { blockingTaskId: dto.dependsOnTaskId as string, blockedTaskId: taskId };
  }

  private async getAccessibleTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectsService.checkAccess(task.projectId, userId);
    return task;
  }

  private async findDependencyById(dependencyId: string): Promise<TaskDependency> {
    const dependency = await this.dependencyRepo.createQueryBuilder('dependency')
      .leftJoinAndSelect('dependency.blockingTask', 'blockingTask')
      .leftJoinAndSelect('blockingTask.assignee', 'blockingAssignee')
      .leftJoinAndSelect('dependency.blockedTask', 'blockedTask')
      .leftJoinAndSelect('blockedTask.assignee', 'blockedAssignee')
      .where('dependency.id = :dependencyId', { dependencyId })
      .getOne();

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    return dependency;
  }

  private async getDependenciesForTaskIds(taskIds: string[]): Promise<TaskDependency[]> {
    if (taskIds.length === 0) return [];

    return this.dependencyRepo.createQueryBuilder('dependency')
      .leftJoinAndSelect('dependency.blockingTask', 'blockingTask')
      .leftJoinAndSelect('blockingTask.assignee', 'blockingAssignee')
      .leftJoinAndSelect('dependency.blockedTask', 'blockedTask')
      .leftJoinAndSelect('blockedTask.assignee', 'blockedAssignee')
      .where('dependency.blockingTaskId IN (:...taskIds)', { taskIds })
      .orWhere('dependency.blockedTaskId IN (:...taskIds)', { taskIds })
      .orderBy('dependency.createdAt', 'DESC')
      .getMany();
  }

  private buildSummary(taskId: string, dependencies: TaskDependency[]): ITaskDependenciesResponse {
    const blockedBy = dependencies
      .filter((dependency) => dependency.blockedTaskId === taskId)
      .map((dependency) => this.toDependencyDto(dependency));

    const blocks = dependencies
      .filter((dependency) => dependency.blockingTaskId === taskId)
      .map((dependency) => this.toDependencyDto(dependency));

    const isBlocked = blockedBy.some((dependency) => dependency.blockingTask.status !== TaskStatus.Done);

    return {
      blockedBy,
      blocks,
      isBlocked,
      dependencyCount: blockedBy.length + blocks.length,
    };
  }

  private toDependencyDto(dependency: TaskDependency): ITaskDependency {
    return {
      id: dependency.id,
      blockingTaskId: dependency.blockingTaskId,
      blockingTask: {
        id: dependency.blockingTask.id,
        title: dependency.blockingTask.title,
        status: dependency.blockingTask.status as TaskStatus,
        snapshotUrl: dependency.blockingTask.snapshotUrl ?? null,
        assignee: dependency.blockingTask.assignee ?? null,
      },
      blockedTaskId: dependency.blockedTaskId,
      blockedTask: {
        id: dependency.blockedTask.id,
        title: dependency.blockedTask.title,
        status: dependency.blockedTask.status as TaskStatus,
        snapshotUrl: dependency.blockedTask.snapshotUrl ?? null,
        assignee: dependency.blockedTask.assignee ?? null,
      },
      createdBy: dependency.createdBy,
      createdAt: dependency.createdAt,
    };
  }

  private async wouldCreateCycle(blockingTaskId: string, blockedTaskId: string): Promise<boolean> {
    let pendingIds = [blockedTaskId];
    const visited = new Set<string>();

    while (pendingIds.length > 0) {
      const nextBatch = pendingIds.filter((taskId) => !visited.has(taskId));
      if (nextBatch.length === 0) {
        return false;
      }

      nextBatch.forEach((taskId) => visited.add(taskId));
      if (nextBatch.includes(blockingTaskId)) {
        return true;
      }

      const downstreamDependencies = await this.dependencyRepo.find({
        where: { blockingTaskId: In(nextBatch) },
      });

      pendingIds = downstreamDependencies.map((dependency) => dependency.blockedTaskId);
    }

    return false;
  }
}
