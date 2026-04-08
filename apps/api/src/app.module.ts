import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CanvasModule } from './modules/canvas/canvas.module';
import { CommentsModule } from './modules/comments/comments.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PresenceModule } from './modules/presence/presence.module';
import { UsersModule } from './modules/users/users.module';
import { ActivityModule } from './modules/activity/activity.module';
import { DocsModule } from './modules/docs/docs.module';
import { ProjectFilesModule } from './modules/project-files/project-files.module';
import { DependenciesModule } from './modules/dependencies/dependencies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: Number.parseInt(url.port || '6379', 10),
            username: url.username || undefined,
            password: url.password || undefined,
          },
        };
      },
    }),
    AuthModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    CanvasModule,
    CommentsModule,
    FilesModule,
    NotificationsModule,
    PresenceModule,
    UsersModule,
    ActivityModule,
    DocsModule,
    ProjectFilesModule,
    DependenciesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
