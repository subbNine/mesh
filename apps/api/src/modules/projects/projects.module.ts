import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/projects.entity';
import { ProjectMember } from './entities/project_members.entity';
import { ProjectExclusion } from './entities/project_exclusions.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { Task } from '../tasks/entities/tasks.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      ProjectExclusion,
      WorkspaceMember,
      Task,
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
