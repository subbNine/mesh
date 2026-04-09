import { Injectable, Inject, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/users.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { IStorageProvider } from '../files/storage/storage.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { IMyAssignmentsResponse, ITask, TaskStatus } from '@mesh/shared';
import * as path from 'node:path';

interface GetMyAssignmentsOptions {
  workspaceId?: string;
  status?: string;
  includeCompleted?: string | boolean;
  projectId?: string | string[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageProvider,
  ) {}

  async findUsersByNames(userNames: string[]): Promise<User[]> {
    if (!userNames || userNames.length === 0) return [];
    return this.userRepo.find({
      where: { userName: In(userNames) },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findMe(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateMe(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findMe(userId);

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    return this.userRepo.save(user);
  }

  private parseList(value?: string | string[]): string[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.flatMap((entry) => entry.split(',')).map((entry) => entry.trim()).filter(Boolean);
    }

    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  private sortByDueDate(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private sortOther(tasks: ITask[]): ITask[] {
    return [...tasks].sort((a, b) => {
      const aDone = a.status === TaskStatus.Done;
      const bDone = b.status === TaskStatus.Done;

      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }

      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : null;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : null;

      if (aDue !== null && bDue !== null && aDue !== bDue) {
        return aDue - bDue;
      }

      if (aDue !== null && bDue === null) {
        return -1;
      }

      if (aDue === null && bDue !== null) {
        return 1;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getMyAssignments(userId: string, options: GetMyAssignmentsOptions): Promise<IMyAssignmentsResponse> {
    if (!options.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    const workspaceMember = await this.workspaceMemberRepo.findOne({
      where: { workspaceId: options.workspaceId, userId },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    const statuses = this.parseList(options.status);
    const projectIds = this.parseList(options.projectId);
    const includeCompleted = options.includeCompleted === true || options.includeCompleted === 'true';

    const query = this.taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.taskAssignees', 'taskAssignees')
      .leftJoinAndSelect('taskAssignees.user', 'taskAssigneeUser')
      .where('taskAssignees.userId = :userId', { userId })
      .andWhere('project.workspaceId = :workspaceId', { workspaceId: options.workspaceId })
      .distinct(true);

    if (statuses.length > 0) {
      query.andWhere('task.status IN (:...statuses)', { statuses });
    } else if (!includeCompleted) {
      query.andWhere('task.status != :doneStatus', { doneStatus: TaskStatus.Done });
    }

    if (projectIds.length > 0) {
      query.andWhere('task.projectId IN (:...projectIds)', { projectIds });
    }

    query
      .orderBy('task.dueDate', 'ASC', 'NULLS LAST')
      .addOrderBy('task.createdAt', 'DESC');

    const tasks = await query.getMany();

    const assignments = tasks.map((task) => {
      const joinedAssignees = (task.taskAssignees ?? [])
        .map((taskAssignee) => taskAssignee.user)
        .filter(Boolean);

      const assignees = joinedAssignees.length > 0
        ? joinedAssignees
        : task.assignee
          ? [task.assignee]
          : [];

      return {
        ...task,
        assignees,
        assignee: assignees[0] ?? null,
        assigneeId: assignees[0]?.id ?? null,
        projectName: task.project?.name,
      };
    }) as ITask[];

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(todayEnd);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const grouped: IMyAssignmentsResponse = {
      overdue: [],
      dueToday: [],
      dueThisWeek: [],
      other: [],
    };

    for (const task of assignments) {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      const isDone = task.status === TaskStatus.Done;

      if (isDone) {
        grouped.other.push(task);
        continue;
      }

      if (dueDate && dueDate < todayStart) {
        grouped.overdue.push(task);
        continue;
      }

      if (dueDate && dueDate >= todayStart && dueDate <= todayEnd) {
        grouped.dueToday.push(task);
        continue;
      }

      if (dueDate && dueDate > todayEnd && dueDate <= weekEnd) {
        grouped.dueThisWeek.push(task);
        continue;
      }

      grouped.other.push(task);
    }

    return {
      overdue: this.sortByDueDate(grouped.overdue),
      dueToday: this.sortByDueDate(grouped.dueToday),
      dueThisWeek: this.sortByDueDate(grouped.dueThisWeek),
      other: this.sortOther(grouped.other),
    };
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      throw new BadRequestException('Avatar size must not exceed 1MB');
    }

    const user = await this.findMe(userId);

    // 1. Delete old avatar if it exists in Azure
    if (user.avatarUrl) {
      try {
        // Extract key from URL if it's our Azure URL
        // Example: https://{account}.blob.core.windows.net/container/avatars/userid.png
        const urlParts = user.avatarUrl.split('/');
        const key = `avatars/${urlParts.at(-1)}`;
        await this.storageProvider.deleteFile(key).catch(e => console.error('Failed to delete old avatar', e));
      } catch (e) {
        console.warn('Could not parse old avatar URL for deletion', e);
      }
    }

    // 2. Upload new avatar
    const ext = path.extname(file.originalname) || '.png';
    const key = `avatars/${userId}${ext}`;
    const url = await this.storageProvider.uploadFile(key, file.buffer, file.mimetype);

    // 3. Update DB
    user.avatarUrl = url;
    return this.userRepo.save(user);
  }
}
