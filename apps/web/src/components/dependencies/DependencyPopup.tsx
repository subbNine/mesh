import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Link2, Lock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ITask } from '@mesh/shared';

import { getTaskDependencyState } from '../../lib/dependency-utils';
import { useTaskStore } from '../../store/task.store';

type DependencyPopupProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onManage: () => void;
  task: ITask;
  workspaceId: string;
}>;

function tone(status: string) {
  switch (status) {
    case 'done':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'inprogress':
      return 'text-sky-700 bg-sky-50 border-sky-200';
    case 'review':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    default:
      return 'text-zinc-600 bg-zinc-50 border-zinc-200';
  }
}

export function DependencyPopup({ isOpen, onClose, onManage, task, workspaceId }: DependencyPopupProps) {
  const navigate = useNavigate();
  const popupRef = useRef<HTMLDivElement>(null);
  const fetchDependencies = useTaskStore((state) => state.fetchDependencies);
  const dependencySnapshot = useTaskStore((state) => state.dependenciesByTaskId[task.id]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetchDependencies(task.id).finally(() => setIsLoading(false));
  }, [fetchDependencies, isOpen, task.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const dependencyState = getTaskDependencyState({
    ...task,
    blockedBy: dependencySnapshot?.blockedBy ?? task.blockedBy,
    blocks: dependencySnapshot?.blocks ?? task.blocks,
    isBlocked: dependencySnapshot?.isBlocked ?? task.isBlocked,
    dependencyCount: dependencySnapshot?.dependencyCount ?? task.dependencyCount,
  });

  const openTask = (taskId: string) => {
    navigate(`/w/${workspaceId}/p/${task.projectId}/tasks/${taskId}/canvas`);
    onClose();
  };

  const renderRows = (items: typeof dependencyState.blockedBy, mode: 'blockedBy' | 'blocks') => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          {mode === 'blockedBy' ? 'This task is blocked by' : 'This task blocks'}
        </p>
        {items.map((dependency) => {
          const relatedTask = mode === 'blockedBy' ? dependency.blockingTask : dependency.blockedTask;
          return (
            <button
              key={dependency.id}
              type="button"
              onClick={() => openTask(relatedTask.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm font-semibold text-foreground">{relatedTask.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] ${tone(relatedTask.status)}`}>
                    {relatedTask.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Open task</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-primary" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          data-card-interactive="true"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          className="absolute left-3 top-12 z-[70] w-80 rounded-[22px] border border-border/70 bg-card/95 p-3 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.5)] backdrop-blur-xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Dependency status</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{dependencyState.summaryLabel}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
              Loading dependency map...
            </div>
          ) : (
            <div className="space-y-3">
              {dependencyState.isBlocked && (
                <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Lock size={15} /> This task is currently blocked.
                </div>
              )}

              {renderRows(dependencyState.blockedBy, 'blockedBy')}
              {renderRows(dependencyState.blocks, 'blocks')}

              {!dependencyState.dependencyCount && (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                  No dependencies linked yet.
                </div>
              )}

              <button
                type="button"
                onClick={onManage}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Link2 size={14} /> Manage dependencies
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
