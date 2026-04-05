import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { type ITask } from '@mesh/shared';
import { formatDistanceToNow } from 'date-fns';
import { Pin, PinOff, User, Trash2 } from 'lucide-react';
import { useTaskStore } from '../../store/task.store';
import { useAuthStore } from '../../store/auth.store';
import { useProjectStore } from '../../store/project.store';

interface TaskCardProps {
  task: ITask;
  onClick: () => void;
  className?: string;
}

const statusConfig: Record<string, { label: string, color: string, border: string, dot: string }> = {
  todo: { label: 'To Do', color: 'bg-zinc-100 text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400' },
  inprogress: { label: 'In Progress', color: 'bg-primary/10 text-primary', border: 'border-primary/20', dot: 'bg-primary' },
  review: { label: 'Review', color: 'bg-sky-100 text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  done: { label: 'Done', color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

export function TaskCard({ task, onClick, className = '' }: TaskCardProps) {
  const [isPinned, setIsPinned] = useState(false);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const user = useAuthStore((state: any) => state.user);
  const members = useProjectStore(state => state.members);
  const currentProject = useProjectStore(state => state.currentProject);

  useEffect(() => {
    const check = (globalThis as any).__meshIsPinned;
    if (check) setIsPinned(check(task.id));
  }, [task.id]);

  const canDelete = useMemo(() => {
    if (!user) return false;
    // Creator can delete
    if (task.createdBy === user.id) return true;
    // Admin can delete
    const member = members.find(m => m.userId === user.id);
    const isAdmin = member?.role === 'admin' || member?.role === 'owner' || currentProject?.createdBy === user.id;
    return isAdmin;
  }, [user, task.createdBy, members, currentProject]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pin = (globalThis as any).__meshPinTask;
    const unpin = (globalThis as any).__meshUnpinTask;
    
    if (isPinned) {
      unpin?.(task.id);
      setIsPinned(false);
    } else {
      pin?.(task.id);
      setIsPinned(true);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task blueprint? This action is irreversible.')) {
      deleteTask(task.id);
    }
  };

  const config = statusConfig[task.status] || statusConfig.todo;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group flex flex-col bg-card border border-border/60 rounded-xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden ${className}`}
    >
      {/* Blueprint Thumbnail */}
      <div className="h-[120px] w-full bg-muted/30 border-b border-border/40 relative overflow-hidden flex items-center justify-center">
        {/* Architectural Background Grid for the preview */}
        <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />

        {task.snapshotUrl ? (
          <img
            src={task.snapshotUrl}
            alt={task.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
            <div className="w-10 h-0.5 bg-border rounded-full" />
            <div className="w-6 h-0.5 bg-border rounded-full" />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">New Canvas</span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md backdrop-blur-md border ${config.border} ${config.color}`}>
                <div className={`w-0.5 h-0.5 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg backdrop-blur-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
              title="Delete Blueprint"
            >
              <Trash2 size={12} />
            </button>
          )}

          <button
            onClick={handlePinToggle}
            className={`p-1.5 rounded-lg backdrop-blur-xl border border-white/10 transition-all ${
              isPinned
                ? 'bg-primary text-primary-foreground shadow-lg opacity-100'
                : 'bg-black/20 text-white hover:bg-black/40'
            }`}
            title={isPinned ? 'Unpin' : 'Pin to Board'}
          >
            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
        </div>
      </div>

      <div className="sm:p-3 p-2.5 flex flex-col flex-1 space-y-2">
        <div className="space-y-0.5">
            <h4 className="font-display font-black text-sm text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {task.title || 'Untitled Task'}
            </h4>
            <p className="text-[11px] text-muted-foreground font-serif italic line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                {task.description || 'No blueprint description...'}
            </p>
        </div>

        <div className="pt-1.5 flex items-center justify-between border-t border-border/40">
          <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">
            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          </span>

          {/* User Info */}
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
                 <div className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary text-[8px] font-black overflow-hidden shadow-sm" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                    {task.assignee.avatarUrl ? (
                        <img src={task.assignee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        getInitials(task.assignee.firstName, task.assignee.lastName)
                    )}
                </div>
            </div>
          ) : (
             <div className="w-5 h-5 rounded-md border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground/30" title="Unassigned">
                <User size={10} />
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
