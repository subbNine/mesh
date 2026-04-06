import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, RepeatOptions } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType, TaskStatus } from '@mesh/shared';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notifications.entity';
import { Task } from '../tasks/entities/tasks.entity';

@Injectable()
export class DueDateNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(DueDateNotificationsService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.scheduleDailyCheck();
  }

  private async scheduleDailyCheck() {
    try {
      await this.notificationsQueue.add(
        'due-date-scan',
        {},
        {
          jobId: 'due-date-scan',
          removeOnComplete: true,
          repeat: {
            cron: '50 8 * * *',
            tz: 'UTC',
          } as RepeatOptions,
        },
      );
      this.logger.log('Scheduled due date notification repeatable job');
    } catch (error) {
      this.logger.error('Unable to schedule due date notification job', error as Error);
    }
  }

  async runDueDateNotifications(): Promise<void> {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    const dayAfterTomorrowStart = new Date(tomorrowStart);
    dayAfterTomorrowStart.setUTCDate(dayAfterTomorrowStart.getUTCDate() + 1);

    const dueTodayTasks = await this.taskRepo.createQueryBuilder('task')
      .where('task.dueDate >= :todayStart AND task.dueDate < :tomorrowStart', { todayStart, tomorrowStart })
      .andWhere('task.status != :done', { done: TaskStatus.Done })
      .andWhere('task.assigneeId IS NOT NULL')
      .getMany();

    const dueSoonTasks = await this.taskRepo.createQueryBuilder('task')
      .where('task.dueDate >= :tomorrowStart AND task.dueDate < :dayAfterTomorrowStart', { tomorrowStart, dayAfterTomorrowStart })
      .andWhere('task.status != :done', { done: TaskStatus.Done })
      .andWhere('task.assigneeId IS NOT NULL')
      .getMany();

    await Promise.all([
      ...dueTodayTasks.map((task) => this.sendReminder(task, NotificationType.DueToday)),
      ...dueSoonTasks.map((task) => this.sendReminder(task, NotificationType.DueSoon)),
    ]);
  }

  private async sendReminder(task: Task, type: NotificationType): Promise<void> {
    if (!task.assigneeId) {
      return;
    }

    const existing = await this.notificationRepo.findOne({
      where: {
        recipientId: task.assigneeId,
        resourceId: task.id,
        type,
      },
    });

    if (existing) {
      return;
    }

    await this.notificationsService.create({
      recipientId: task.assigneeId,
      type,
      resourceId: task.id,
      resourceType: 'task',
      data: {
        taskTitle: task.title,
        dueDate: task.dueDate?.toISOString(),
      },
    });
  }
}
