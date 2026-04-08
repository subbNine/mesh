import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notifications.entity';
import { INotificationChannel, NotificationPayload } from './channel.interface';
import { NotificationsGateway } from '../notifications.gateway';

@Injectable()
export class InAppChannel implements INotificationChannel {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) { }

  async send(payload: NotificationPayload): Promise<void> {
    const notification = this.notificationRepo.create({
      recipientId: payload.recipientId,
      actorId: payload.actorId,
      type: payload.type,
      resourceId: payload.resourceId,
      resourceType: payload.resourceType,
      data: payload.data ?? null,
    });

    const saved = await this.notificationRepo.save(notification);

    this.gateway.pushToUser(payload.recipientId, {
      ...saved,
      actor: payload.actorId ? { id: payload.actorId } : undefined,
    });
  }
}

