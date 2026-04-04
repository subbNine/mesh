import React, { useState, useEffect } from 'react';
import { type ITask } from '@mesh/shared';
import { formatDistanceToNow } from 'date-fns';
import { Pin, PinOff } from 'lucide-react';

interface TaskCardProps {
  task: ITask;
  onClick: () => void;
  className?: string;
}

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700 border-gray-200',
  inprogress: 'bg-blue-50 text-blue-700 border-blue-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  done: 'bg-green-50 text-green-700 border-green-200',
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
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
    if (isPinned) {
      (globalThis as any).__meshUnpinTask?.(task.id);
      setIsPinned(false);
    } else {
      (globalThis as any).__meshPinTask?.(task.id);
      setIsPinned(true);
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden ${className}`}
    >
      {/* Thumbnail */}
      <div className="h-[140px] w-full bg-muted/40 border-b border-border relative overflow-hidden flex items-center justify-center">
        {task.snapshotUrl ? (
          <img 
            src={task.snapshotUrl} 
            alt={`Snapshot for ${task.title}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-muted-foreground/50 text-sm font-medium">No Preview</div>
        )}
        
        {/* Pin button — visible on hover */}
        <button
          onClick={handlePinToggle}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all ${
            isPinned 
              ? 'bg-primary/90 text-white shadow-sm opacity-100' 
              : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60'
          }`}
          title={isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">{task.title}</h4>
        
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
          {task.description || 'No description provided.'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColors[task.status] || statusColors.todo} w-fit`}>
              {statusLabels[task.status] || 'Unknown'}
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Assignee Avatar */}
          {task.assignee ? (
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary text-xs font-bold overflow-hidden" title={`${task.assignee.firstName} ${task.assignee.lastName}`}>
              {task.assignee.avatarUrl ? (
                <img src={task.assignee.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(task.assignee.firstName, task.assignee.lastName)
              )}
            </div>
          ) : (
             <div className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/50 bg-muted text-[10px]" title="Unassigned">
               —
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

