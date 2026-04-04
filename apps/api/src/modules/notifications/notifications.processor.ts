import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationPayload } from './channels/channel.interface';
import { InAppChannel } from './channels/in-app.channel';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly inAppChannel: InAppChannel,
    private readonly emailChannel: EmailChannel,
    private readonly pushChannel: PushChannel,
  ) {
    super();
  }

  async process(job: Job<NotificationPayload, any, string>): Promise<any> {
    this.logger.log(`Processing notification job ${job.id} of type ${job.name} for user ${job.data.recipientId}`);
    
    const payload = job.data;
    const channels = payload.channels || [];

    const promises: Promise<void>[] = [];

    channels.forEach(channelType => {
      switch (channelType) {
        case 'in-app':
          promises.push(this.inAppChannel.send(payload));
          break;
        case 'email':
          promises.push(this.emailChannel.send(payload));
          break;
        case 'push':
          promises.push(this.pushChannel.send(payload));
          break;
        default:
          this.logger.warn(`Unknown channel type: ${channelType}`);
      }
    });

    try {
      // Execute all channel sends concurrently
      await Promise.allSettled(promises);
      // Wait, Promise.allSettled doesn't throw. We should use Promise.all to trigger BullMQ retries 
      // if we want a failure in one channel to retry the whole job, 
      // or we can split channels into sub-jobs if we want independent retry logic.
      // Given the requirement, Promise.all is better for triggering BullMQ's built-in retry.
      await Promise.all(promises);
    } catch (err) {
      this.logger.error(`Error sending notification job ${job.id}`, err);
      throw err; // Throws to trigger BullMQ retry
    }
  }
}
