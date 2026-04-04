import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notifications.entity';
import { NotificationType } from '@mesh/shared';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async createTaskAssignedNotification(taskId: string, assigneeId: string): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipientId: assigneeId,
      type: NotificationType.Assigned,
      resourceId: taskId,
      resourceType: 'task',
    });
    return this.notificationRepo.save(notification);
  }

  async createMentionNotification(taskId: string, mentionedUserId: string): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipientId: mentionedUserId,
      type: NotificationType.Mentioned,
      resourceId: taskId,
      resourceType: 'comment',
    });
    return this.notificationRepo.save(notification);
  }

  async createCommentNotification(taskId: string, assigneeId: string): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipientId: assigneeId,
      type: NotificationType.Commented, // assuming 'Commented' exists on NotificationType
      resourceId: taskId,
      resourceType: 'task', // or 'comment'
    });
    return this.notificationRepo.save(notification);
  }
}

