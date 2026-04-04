import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannel, NotificationPayload } from './channel.interface';

@Injectable()
export class PushChannel implements INotificationChannel {
  private readonly logger = new Logger(PushChannel.name);

  async send(payload: NotificationPayload): Promise<void> {
    // In a real implementation this would connect to APNS/FCM
    // e.g. await firebase.messaging().send({ token, notification: {...} })
    this.logger.log(`[Push] Sending push notification to user ${payload.recipientId} of type ${payload.type}`);
  }
}
