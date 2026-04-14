import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/tasks.entity';
import { Subtask } from '../subtasks/entities/subtasks.entity';
import { WorkspaceMember } from '../workspaces/entities/workspace_members.entity';
import { ISearchResult } from '@mesh/shared';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Subtask)
    private readonly subtaskRepo: Repository<Subtask>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepo: Repository<WorkspaceMember>,
  ) {}

  async search(workspaceId: string, userId: string, query: string, filters?: any): Promise<ISearchResult[]> {
    const isMember = await this.workspaceMemberRepo.findOne({
      where: { workspaceId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    const searchQuery = query.trim();
    if (!searchQuery) return [];

    // Search Tasks
    const tasksPromise = this.taskRepo.query(`
      SELECT 
        t.id, 
        'task' as type, 
        t.title,
        ts_headline('english', t.title || ' ' || coalesce(t.description, ''), websearch_to_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15, ShortWord=3, HighlightAll=FALSE') as highlight,
        t."projectId",
        p.name as "projectName",
        t.status,
        ts_rank_cd(t.search_vector, websearch_to_tsquery('english', $1)) as rank
      FROM tasks t
      JOIN projects p ON t."projectId" = p.id
      LEFT JOIN project_members pm ON p.id = pm."projectId" AND pm."userId" = $2
      LEFT JOIN project_exclusions pe ON p.id = pe."projectId" AND pe."userId" = $2
      WHERE p."workspaceId" = $3
      AND (pm.id IS NOT NULL OR pe.id IS NULL)
      AND t.search_vector @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT 10
    `, [searchQuery, userId, workspaceId]);

    // Search Subtasks
    const subtasksPromise = this.subtaskRepo.query(`
      SELECT 
        s.id, 
        'subtask' as type, 
        s.title,
        ts_headline('english', s.title, websearch_to_tsquery('english', $1), 'StartSel=<mark>, StopSel=</mark>') as highlight,
        p.id as "projectId",
        p.name as "projectName",
        t.id as "parentTaskId",
        t.title as "parentTaskTitle",
        ts_rank_cd(s.search_vector, websearch_to_tsquery('english', $1)) as rank
      FROM subtasks s
      JOIN tasks t ON s."taskId" = t.id
      JOIN projects p ON t."projectId" = p.id
      LEFT JOIN project_members pm ON p.id = pm."projectId" AND pm."userId" = $2
      LEFT JOIN project_exclusions pe ON p.id = pe."projectId" AND pe."userId" = $2
      WHERE p."workspaceId" = $3
      AND (pm.id IS NOT NULL OR pe.id IS NULL)
      AND s.search_vector @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT 10
    `, [searchQuery, userId, workspaceId]);

    const [tasks, subtasks] = await Promise.all([tasksPromise, subtasksPromise]);

    return [...tasks, ...subtasks].sort((a, b) => b.rank - a.rank);
  }
}
