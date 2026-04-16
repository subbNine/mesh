import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './entities/workspaces.entity';
import { WorkspaceMember } from './entities/workspace_members.entity';
import { User } from '../users/entities/users.entity';
import { AuthModule } from '../auth/auth.module';
import { Task } from '../tasks/entities/tasks.entity';
import { TaskAssignee } from '../tasks/entities/task-assignees.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { ActivityEvent } from '../activity/entities/activity-events.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace, 
      WorkspaceMember, 
      User, 
      Task, 
      TaskAssignee, 
      ProjectMember, 
      ActivityEvent
    ]), 
    AuthModule
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
