import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Task } from '../tasks/entities/tasks.entity';
import { Subtask } from '../subtasks/entities/subtasks.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Subtask, WorkspaceMember]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
