import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';
import { Task } from '../tasks/entities/tasks.entity';
import { TaskAssignee } from '../tasks/entities/task-assignees.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Task, TaskAssignee, WorkspaceMember]),
    FilesModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
