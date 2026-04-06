import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { ActivityEvent } from './entities/activity-events.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { Project } from '../projects/entities/projects.entity';
import { ProjectMember } from '../projects/entities/project_members.entity';
import { ProjectExclusion } from '../projects/entities/project_exclusions.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { User } from '../users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityEvent,
      Task,
      Project,
      ProjectMember,
      ProjectExclusion,
      WorkspaceMember,
      User,
    ]),
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
