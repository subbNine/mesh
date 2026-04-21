import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/tasks.entity';
import { TaskAssignee } from './entities/task-assignees.entity';
import { ProjectsModule } from '../projects/projects.module';
import { CanvasModule } from '../canvas/canvas.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityModule } from '../activity/activity.module';
import { DependenciesModule } from '../dependencies/dependencies.module';
import { Subtask } from '../subtasks/entities/subtasks.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskAssignee, Subtask]),
    forwardRef(() => ProjectsModule),
    forwardRef(() => CanvasModule),
    NotificationsModule,
    ActivityModule,
    DependenciesModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
