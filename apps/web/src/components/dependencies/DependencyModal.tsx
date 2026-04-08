import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Link2, Loader2, Lock, Search, Trash2 } from 'lucide-react';
import type { ITask } from '@mesh/shared';

import { api } from '../../lib/api';
import { getTaskDependencyState } from '../../lib/dependency-utils';
import { useTaskStore } from '../../store/task.store';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

type DependencyModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  task: ITask;
}>;

function statusPill(status: string) {
  switch (status) {
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'inprogress':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'review':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-600';
  }
}

export function DependencyModal({ isOpen, onClose, task }: DependencyModalProps) {
  const fetchDependencies = useTaskStore((state) => state.fetchDependencies);
  const createDependency = useTaskStore((state) => state.createDependency);
  const deleteDependency = useTaskStore((state) => state.deleteDependency);
  const dependencySnapshot = useTaskStore((state) => state.dependenciesByTaskId[task.id]);

  const [isLoading, setIsLoading] = useState(false);
  const [blocksQuery, setBlocksQuery] = useState('');
  const [dependsOnQuery, setDependsOnQuery] = useState('');
  const [blockResults, setBlockResults] = useState<ITask[]>([]);
  const [dependsOnResults, setDependsOnResults] = useState<ITask[]>([]);
  const [isSearchingBlocks, setIsSearchingBlocks] = useState(false);
  const [isSearchingDependsOn, setIsSearchingDependsOn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetchDependencies(task.id).finally(() => setIsLoading(false));
  }, [fetchDependencies, isOpen, task.id]);

  const dependencyState = getTaskDependencyState({
    ...task,
    blockedBy: dependencySnapshot?.blockedBy ?? task.blockedBy,
    blocks: dependencySnapshot?.blocks ?? task.blocks,
    isBlocked: dependencySnapshot?.isBlocked ?? task.isBlocked,
    dependencyCount: dependencySnapshot?.dependencyCount ?? task.dependencyCount,
  });

  const blockedTaskIds = useMemo(
    () => new Set(dependencyState.blocks.map((dependency) => dependency.blockedTaskId)),
    [dependencyState.blocks],
  );

  const blockingTaskIds = useMemo(
    () => new Set(dependencyState.blockedBy.map((dependency) => dependency.blockingTaskId)),
    [dependencyState.blockedBy],
  );

  useEffect(() => {
    if (!isOpen || !blocksQuery.trim()) {
      setBlockResults([]);
      return;
    }

    const handle = globalThis.setTimeout(async () => {
      setIsSearchingBlocks(true);
      try {
        const { data } = await api.get(`/projects/${task.projectId}/tasks`, {
          params: { search: blocksQuery.trim(), perPage: 8 },
        });

        setBlockResults(
          (data.result ?? []).filter((candidate: ITask) => candidate.id !== task.id && !blockedTaskIds.has(candidate.id)),
        );
      } catch (error) {
        console.error('Failed to search blockable tasks', error);
        setBlockResults([]);
      } finally {
        setIsSearchingBlocks(false);
      }
    }, 220);

    return () => globalThis.clearTimeout(handle);
  }, [blockedTaskIds, blocksQuery, isOpen, task.id, task.projectId]);

  useEffect(() => {
    if (!isOpen || !dependsOnQuery.trim()) {
      setDependsOnResults([]);
      return;
    }

    const handle = globalThis.setTimeout(async () => {
      setIsSearchingDependsOn(true);
      try {
        const { data } = await api.get(`/projects/${task.projectId}/tasks`, {
          params: { search: dependsOnQuery.trim(), perPage: 8 },
        });

        setDependsOnResults(
          (data.result ?? []).filter((candidate: ITask) => candidate.id !== task.id && !blockingTaskIds.has(candidate.id)),
        );
      } catch (error) {
        console.error('Failed to search upstream tasks', error);
        setDependsOnResults([]);
      } finally {
        setIsSearchingDependsOn(false);
      }
    }, 220);

    return () => globalThis.clearTimeout(handle);
  }, [blockingTaskIds, dependsOnQuery, isOpen, task.id, task.projectId]);

  const handleCreate = async (mode: 'blocks' | 'dependsOn', targetTaskId: string) => {
    await createDependency(
      task.id,
      mode === 'blocks' ? { blocksTaskId: targetTaskId } : { dependsOnTaskId: targetTaskId },
    );

    if (mode === 'blocks') {
      setBlocksQuery('');
      setBlockResults([]);
    } else {
      setDependsOnQuery('');
      setDependsOnResults([]);
    }
  };

  const renderDependencyRow = (
    dependency: typeof dependencyState.blockedBy[number],
    side: 'blockedBy' | 'blocks',
  ) => {
    const relatedTask = side === 'blockedBy' ? dependency.blockingTask : dependency.blockedTask;

    return (
      <div
        key={dependency.id}
        className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-3 py-2.5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${statusPill(relatedTask.status)}`}>
              {relatedTask.status}
            </span>
            <p className="truncate text-sm font-semibold text-foreground">{relatedTask.title}</p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {side === 'blockedBy' ? 'Must finish before this task can proceed' : 'Will be unblocked by this task'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => deleteDependency(dependency.id)}
          className="rounded-xl border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
          title="Remove dependency"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  const renderSearchResults = (results: ITask[], mode: 'blocks' | 'dependsOn') => {
    if (results.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          No matching tasks in this project.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {results.map((result) => (
          <button
            key={result.id}
            type="button"
            onClick={() => handleCreate(mode, result.id)}
            className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card/70 px-3 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{result.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {mode === 'blocks' ? 'Add as downstream task' : 'Add as blocker'}
              </p>
            </div>
            <ArrowRight size={14} className="text-primary" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage dependencies"
      description="Link this task to upstream blockers and downstream work in the same project."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.05] to-transparent px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/70">Dependency status</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{dependencyState.summaryLabel}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 size={16} className="mr-2 animate-spin" /> Loading dependencies...
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 size={16} className="text-primary" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">This task blocks</h3>
                  <p className="text-[11px] text-muted-foreground">Choose tasks that cannot proceed until this one is done.</p>
                </div>
              </div>

              <Input
                value={blocksQuery}
                onChange={(event) => setBlocksQuery(event.target.value)}
                placeholder="Search project tasks to block..."
                icon={<Search size={16} />}
              />

              {isSearchingBlocks ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Searching…</div>
              ) : blocksQuery.trim() ? renderSearchResults(blockResults, 'blocks') : null}

              <div className="space-y-2">
                {dependencyState.blocks.length > 0 ? (
                  dependencyState.blocks.map((dependency) => renderDependencyRow(dependency, 'blocks'))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    No downstream tasks linked yet.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">This task depends on</h3>
                  <p className="text-[11px] text-muted-foreground">Choose tasks that must be completed before this one can move forward.</p>
                </div>
              </div>

              <Input
                value={dependsOnQuery}
                onChange={(event) => setDependsOnQuery(event.target.value)}
                placeholder="Search project tasks this depends on..."
                icon={<Search size={16} />}
              />

              {isSearchingDependsOn ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Searching…</div>
              ) : dependsOnQuery.trim() ? renderSearchResults(dependsOnResults, 'dependsOn') : null}

              <div className="space-y-2">
                {dependencyState.blockedBy.length > 0 ? (
                  dependencyState.blockedBy.map((dependency) => renderDependencyRow(dependency, 'blockedBy'))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    No blockers linked yet.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
