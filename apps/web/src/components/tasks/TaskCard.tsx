import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type ITask } from '@mesh/shared';
import { formatDistanceToNow } from 'date-fns';
import { Pin, PinOff, User } from 'lucide-react';

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

  useEffect(() => {
    const check = (globalThis as any).__meshIsPinned;
    if (check) setIsPinned(check(task.id));
  }, [task.id]);

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

  const config = statusConfig[task.status] || statusConfig.todo;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`group flex flex-col bg-card border border-border/60 rounded-2xl hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all cursor-pointer overflow-hidden ${className}`}
    >
      {/* Blueprint Thumbnail */}
      <div className="h-[160px] w-full bg-muted/30 border-b border-border/40 relative overflow-hidden flex items-center justify-center">
        {/* Architectural Background Grid for the preview */}
        <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />
        
        {task.snapshotUrl ? (
          <img 
            src={task.snapshotUrl} 
            alt={task.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
            <div className="w-12 h-1 bg-border rounded-full" />
            <div className="w-8 h-1 bg-border rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest mt-2">New Canvas</span>
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
            <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-md border ${config.border} ${config.color}`}>
                <div className={`w-1 h-1 rounded-full ${config.dot}`} />
                {config.label}
            </span>
        </div>

        {/* Pin button */}
        <button
          onClick={handlePinToggle}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-xl border border-white/10 transition-all ${
            isPinned 
              ? 'bg-primary text-primary-foreground shadow-lg' 
              : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'
          }`}
        >
          {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1 space-y-3">
        <div className="space-y-1">
            <h4 className="font-display font-black text-lg text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {task.title || 'Untitled Task'}
            </h4>
            <p className="text-xs text-muted-foreground font-serif italic line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                {task.description || 'No blueprint description...'}
            </p>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-border/40">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-tight">
            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
          </span>

          {/* User Info */}
          {task.assignee ? (
            <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary text-[10px] font-black overflow-hidden shadow-sm" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
                    {task.assignee.avatarUrl ? (
                        <img src={task.assignee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        getInitials(task.assignee.firstName, task.assignee.lastName)
                    )}
                </div>
            </div>
          ) : (
             <div className="w-7 h-7 rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground/30" title="Unassigned">
                <User size={12} />
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
