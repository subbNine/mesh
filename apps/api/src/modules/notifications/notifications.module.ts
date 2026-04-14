import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notifications.entity';
import { NotificationsProcessor } from './notifications.processor';
import { InAppChannel } from './channels/in-app.channel';
import { EmailChannel } from './channels/email.channel';
import { PushChannel } from './channels/push.channel';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { Task } from '../tasks/entities/tasks.entity';
import { DueDateNotificationsService } from './due-date-notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Task]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
    UsersModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    DueDateNotificationsService,
    NotificationsProcessor,
    NotificationsGateway,
    InAppChannel,
    EmailChannel,
    PushChannel,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}

