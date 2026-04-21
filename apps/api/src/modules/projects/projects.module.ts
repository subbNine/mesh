import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { PublicProjectController } from './public-project.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/projects.entity';
import { ProjectMember } from './entities/project_members.entity';
import { ProjectExclusion } from './entities/project_exclusions.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { CanvasModule } from '../canvas/canvas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectMember,
      ProjectExclusion,
      WorkspaceMember,
      Task,
    ]),
    ActivityModule,
    AuthModule,
    forwardRef(() => TasksModule),
    forwardRef(() => CanvasModule),
  ],
  controllers: [ProjectsController, PublicProjectController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
