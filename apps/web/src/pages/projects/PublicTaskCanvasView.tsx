import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, CalendarDays, Eye } from 'lucide-react';

import { api } from '../../lib/api';
import ReadOnlyCanvasStage from '../../components/canvas/ReadOnlyCanvasStage';

interface TaskDetail {
  id: string;
  title: string;
  status: string;
  description: string | null;
  snapshotUrl: string | null;
  dueDate: string | null;
  createdAt: string;
  canvasDoc: string | null;
  assignees: { id: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'done': return { label: 'Done', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'review': return { label: 'Review', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' };
    case 'inprogress': return { label: 'In Progress', color: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-200 dark:border-sky-800' };
    default: return { label: 'To Do', color: 'bg-zinc-400 dark:bg-zinc-500', text: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-900/60', border: 'border-zinc-200 dark:border-zinc-700' };
  }
}

interface PublicTaskCanvasViewProps {
  slug: string;
  taskId: string;
  onClose: () => void;
}

/**
 * Read-only task canvas overlay for public project pages.
 * Renders the full Konva canvas (pan + zoom) using the Yjs document
 * returned by the API. No editing tools, no comments, no WebSocket.
 */
export default function PublicTaskCanvasView({ slug, taskId, onClose }: PublicTaskCanvasViewProps) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/public/projects/${slug}/tasks/${taskId}`);
        if (!cancelled) setTask(data);
      } catch (err) {
        console.error('[PublicTaskCanvasView] Failed to load task', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [slug, taskId]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const statusCfg = task ? getStatusLabel(task.status) : null;
  const assignees = task?.assignees?.length ? task.assignees : task?.assignee ? [task.assignee] : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col w-[min(95vw,1100px)] h-[90vh] rounded-3xl border border-border/60 bg-card shadow-2xl overflow-hidden"
      >
        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-border/40 bg-card/95 backdrop-blur-xl z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Eye size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold tracking-tight text-foreground truncate">{task?.title || 'Loading…'}</h2>
            </div>

            {/* Status + metadata inline */}
            {task && (
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                {statusCfg && (
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${statusCfg.border} ${statusCfg.bg} ${statusCfg.text}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.color}`} />
                    {statusCfg.label}
                  </div>
                )}

                {task.dueDate && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                    <CalendarDays size={9} />
                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                )}

                {/* Assignee avatars */}
                {assignees.length > 0 && (
                  <div className="flex -space-x-1.5 ml-1">
                    {assignees.slice(0, 3).map((a) => (
                      <div
                        key={a.id}
                        className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[8px] font-bold text-primary"
                        title={`${a.firstName} ${a.lastName}`}
                      >
                        {a.avatarUrl ? (
                          <img src={a.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          a.firstName?.[0]?.toUpperCase()
                        )}
                      </div>
                    ))}
                    {assignees.length > 3 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-[7px] font-bold text-primary-foreground">
                        +{assignees.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 ml-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Canvas area — takes remaining height */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="mt-3 text-xs text-muted-foreground">Loading canvas…</p>
            </div>
          ) : task ? (
            <ReadOnlyCanvasStage canvasDoc={task.canvasDoc} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Task not found</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
