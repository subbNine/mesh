import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationType } from '@mesh/shared';

import { NotificationPayload } from './channels/channel.interface';
import { Notification } from './entities/notifications.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue<NotificationPayload>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) { }

  async create(dto: {
    recipientId: string;
    actorId?: string;
    type: string;
    resourceId?: string;
    resourceType?: string;
    data?: any;
  }): Promise<void> {
    // Skip if recipientId === actor (no self-notifications)
    if (dto.actorId && dto.recipientId === dto.actorId) {
      return;
    }

    // Dispatch to Queue: Channels will handle their specific logic (DB persistence, real-time push, email, etc.)
    await this.dispatchNotification({
      recipientId: dto.recipientId,
      actorId: dto.actorId,
      type: dto.type,
      resourceId: dto.resourceId,
      resourceType: dto.resourceType,
      channels: ['in-app', 'email'], // Defaults to both
      data: dto.data,
    });
  }

  async dispatchNotification(payload: NotificationPayload & { actorId?: string }) {
    await this.notificationsQueue.add(payload.type, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000 * 60, // 1 minute
      },
    });
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationRepo.find({
      where: { recipientId: userId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.readAt = new Date();
    await this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { recipientId: userId, readAt: IsNull() },
      { readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { recipientId: userId, readAt: IsNull() },
    });
  }

  // Helper methods for specific actions
  async createTaskAssignedNotification(taskId: string, assigneeId: string, actorId: string): Promise<void> {
    await this.create({
      recipientId: assigneeId,
      actorId,
      type: NotificationType.Assigned,
      resourceId: taskId,
      resourceType: 'task',
    });
  }

  async createMentionNotification(taskId: string, mentionedUserId: string, actorId: string): Promise<void> {
    await this.create({
      recipientId: mentionedUserId,
      actorId,
      type: NotificationType.Mentioned,
      resourceId: taskId,
      resourceType: 'task',
    });
  }

  async createCommentNotification(taskId: string, recipientId: string, actorId: string): Promise<void> {
    await this.create({
      recipientId,
      actorId,
      type: NotificationType.Commented,
      resourceId: taskId,
      resourceType: 'task',
    });
  }

  async createTaskUnblockedNotification(
    taskId: string,
    recipientId: string,
    actorId: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      recipientId,
      actorId,
      type: NotificationType.TaskUnblocked,
      resourceId: taskId,
      resourceType: 'task',
      data,
    });
  }
}
