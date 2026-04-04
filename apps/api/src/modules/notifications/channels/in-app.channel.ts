import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notifications.entity';
import { INotificationChannel, NotificationPayload } from './channel.interface';

@Injectable()
export class InAppChannel implements INotificationChannel {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    const notification = this.notificationRepo.create({
      recipientId: payload.recipientId,
      type: payload.type,
      resourceId: payload.resourceId,
      resourceType: payload.resourceType,
    });
    
    await this.notificationRepo.save(notification);
  }
}
