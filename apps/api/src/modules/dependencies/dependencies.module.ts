import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { Task } from '../tasks/entities/tasks.entity';
import { DependenciesController } from './dependencies.controller';
import { DependenciesService } from './dependencies.service';
import { TaskDependency } from './entities/task-dependencies.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskDependency, Task]),
    ProjectsModule,
    NotificationsModule,
  ],
  controllers: [DependenciesController],
  providers: [DependenciesService],
  exports: [DependenciesService],
})
export class DependenciesModule {}
