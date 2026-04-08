import type { ITask, ITaskDependency } from '@mesh/shared';

export interface TaskDependencyState {
  blockedBy: ITaskDependency[];
  blocks: ITaskDependency[];
  unresolvedBlockedBy: ITaskDependency[];
  dependencyCount: number;
  isBlocked: boolean;
  severity: 'critical' | 'warning' | 'info';
  summaryLabel: string;
}

export function getTaskDependencyState(task?: Partial<ITask> | null): TaskDependencyState {
  const blockedBy = task?.blockedBy ?? [];
  const blocks = task?.blocks ?? [];
  const unresolvedBlockedBy = blockedBy.filter((dependency) => dependency.blockingTask.status !== 'done');
  const dependencyCount = task?.dependencyCount ?? blockedBy.length + blocks.length;
  const isBlocked = task?.isBlocked ?? unresolvedBlockedBy.length > 0;

  const severity = isBlocked
    ? unresolvedBlockedBy.some((dependency) => dependency.blockingTask.status === 'todo')
      ? 'critical'
      : 'warning'
    : 'info';

  const blockedLabel = unresolvedBlockedBy.length > 0
    ? `Blocked by ${unresolvedBlockedBy.length}`
    : blockedBy.length > 0
      ? `Depends on ${blockedBy.length}`
      : null;

  const blocksLabel = blocks.length > 0 ? `Blocks ${blocks.length}` : null;
  const summaryLabel = [blockedLabel, blocksLabel].filter(Boolean).join(' · ') || 'Manage dependencies';

  return {
    blockedBy,
    blocks,
    unresolvedBlockedBy,
    dependencyCount,
    isBlocked,
    severity,
    summaryLabel,
  };
}
