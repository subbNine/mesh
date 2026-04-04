import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationType } from '@mesh/shared';
import { NotificationPayload } from './channels/channel.interface';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue<NotificationPayload>,
  ) { }

  async dispatchNotification(payload: NotificationPayload) {
    await this.notificationsQueue.add(payload.type, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000 * 60, // 1 minute
      },
    });
  }

  async createTaskAssignedNotification(taskId: string, assigneeId: string): Promise<void> {
    await this.dispatchNotification({
      recipientId: assigneeId,
      type: NotificationType.Assigned,
      resourceId: taskId,
      resourceType: 'task',
      channels: ['in-app', 'email'], // Defaults to both
    });
  }

  async createMentionNotification(taskId: string, mentionedUserId: string): Promise<void> {
    await this.dispatchNotification({
      recipientId: mentionedUserId,
      type: NotificationType.Mentioned,
      resourceId: taskId,
      resourceType: 'comment',
      channels: ['in-app', 'email'],
    });
  }

  async createCommentNotification(taskId: string, assigneeId: string): Promise<void> {
    await this.dispatchNotification({
      recipientId: assigneeId,
      type: NotificationType.Commented, // assuming 'Commented' exists on NotificationType
      resourceId: taskId,
      resourceType: 'task', // or 'comment'
      channels: ['in-app'], // Maybe comment doesn't need email by default
    });
  }
}
