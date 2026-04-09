import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectsService } from '../projects/projects.service';
import { Task } from '../tasks/entities/tasks.entity';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { ReorderSubtasksDto } from './dto/reorder-subtasks.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { Subtask } from './entities/subtasks.entity';

@Injectable()
export class SubtasksService {
  constructor(
    @InjectRepository(Subtask)
    private readonly subtaskRepo: Repository<Subtask>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(taskId: string, userId: string): Promise<Subtask[]> {
    await this.getTaskWithAccess(taskId, userId);

    return this.subtaskRepo.find({
      where: { taskId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async create(taskId: string, userId: string, dto: CreateSubtaskDto): Promise<Subtask> {
    await this.getTaskWithAccess(taskId, userId);

    const rawPosition = await this.subtaskRepo.createQueryBuilder('subtask')
      .select('COALESCE(MAX(subtask.position), -1) + 1', 'nextPosition')
      .where('subtask.taskId = :taskId', { taskId })
      .getRawOne<{ nextPosition?: string }>();

    const subtask = this.subtaskRepo.create({
      taskId,
      title: dto.title.trim(),
      position: Number(rawPosition?.nextPosition ?? 0),
      createdBy: userId,
      isCompleted: false,
      completedAt: null,
    });

    return this.subtaskRepo.save(subtask);
  }

  async update(subtaskId: string, userId: string, dto: UpdateSubtaskDto): Promise<Subtask> {
    const subtask = await this.getSubtaskWithAccess(subtaskId, userId);

    if (dto.title !== undefined) {
      subtask.title = dto.title.trim();
    }

    if (dto.isCompleted !== undefined) {
      subtask.isCompleted = dto.isCompleted;
      subtask.completedAt = dto.isCompleted ? new Date() : null;
    }

    if (dto.position !== undefined) {
      subtask.position = dto.position;
    }

    return this.subtaskRepo.save(subtask);
  }

  async delete(subtaskId: string, userId: string): Promise<{ id: string; taskId: string }> {
    const subtask = await this.getSubtaskWithAccess(subtaskId, userId);
    await this.subtaskRepo.remove(subtask);

    return { id: subtaskId, taskId: subtask.taskId };
  }

  async reorder(taskId: string, userId: string, dto: ReorderSubtasksDto): Promise<Subtask[]> {
    await this.getTaskWithAccess(taskId, userId);

    const subtasks = await this.subtaskRepo.find({
      where: { taskId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    const existingIds = new Set(subtasks.map((subtask) => subtask.id));
    const hasMismatch = subtasks.length !== dto.orderedIds.length || dto.orderedIds.some((id) => !existingIds.has(id));

    if (hasMismatch) {
      throw new BadRequestException('orderedIds must include every subtask exactly once.');
    }

    await Promise.all(
      dto.orderedIds.map((id, index) =>
        this.subtaskRepo.update({ id, taskId }, { position: index }),
      ),
    );

    return this.findAll(taskId, userId);
  }

  private async getTaskWithAccess(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.projectsService.checkAccess(task.projectId, userId);
    return task;
  }

  private async getSubtaskWithAccess(subtaskId: string, userId: string): Promise<Subtask> {
    const subtask = await this.subtaskRepo.findOne({
      where: { id: subtaskId },
      relations: ['task'],
    });

    if (!subtask) {
      throw new NotFoundException('Subtask not found');
    }

    await this.projectsService.checkAccess(subtask.task.projectId, userId);
    return subtask;
  }
}
