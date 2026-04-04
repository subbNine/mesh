import { type ITask } from '@mesh/shared';
import { Link, useParams } from 'react-router-dom';
import { User } from 'lucide-react';

interface TaskThumbnailCardProps {
  task: ITask;
  index: number;
  isActive: boolean;
}

export function TaskThumbnailCard({ task, index, isActive }: TaskThumbnailCardProps) {
  const { workspaceId, projectId } = useParams();
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-zinc-400';
      case 'inprogress': return 'bg-amber-400';
      case 'review': return 'bg-violet-400';
      case 'done': return 'bg-emerald-400';
      default: return 'bg-zinc-300';
    }
  };

  const formattedIndex = (index + 1).toString().padStart(2, '0');

  return (
    <Link
      to={`/w/${workspaceId}/p/${projectId}/tasks/${task.id}/canvas`}
      className={`group relative flex gap-3 p-2.5 rounded-xl transition-all duration-200 border ${
        isActive 
          ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10' 
          : 'border-transparent hover:bg-muted/50 hover:border-border'
      }`}
    >
      {/* Index Number (Slide style) */}
      <div className="flex-shrink-0 flex flex-col items-center justify-start pt-1">
        <span className={`text-[10px] font-bold tracking-tighter ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
          {formattedIndex}
        </span>
      </div>

      {/* Thumbnail Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Mock Perspective Thumbnail */}
        <div className={`aspect-video w-full rounded-md overflow-hidden relative border ${
          isActive ? 'border-primary/30 shadow-inner' : 'border-border/50'
        } bg-slate-50 flex items-center justify-center`}>
           {task.snapshotUrl ? (
             <img src={task.snapshotUrl} alt={`${task.title} thumbnail`} className="w-full h-full object-cover" />
           ) : (
             <div className={`w-8 h-8 rounded-full opacity-10 ${statusColor(task.status)}`} />
           )}
           {isActive && (
             <div className="absolute top-1 right-1">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             </div>
           )}
        </div>

        <div className="space-y-1 px-0.5">
          <h5 className={`text-[13px] font-medium truncate leading-tight ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
            {task.title}
          </h5>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${statusColor(task.status)}`} />
              <span className="text-[10px] text-muted-foreground capitalize font-medium">{task.status.replace('-', ' ')}</span>
            </div>
            
            {task.assigneeId && (
               <div className="flex items-center gap-1 opacity-60">
                 <User className="w-2.5 h-2.5" />
                 <span className="text-[9px] font-medium tracking-tight">Assigned</span>
               </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover visual cue */}
      {!isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-primary/40 group-hover:h-8 transition-all duration-300 rounded-r-full" />
      )}
    </Link>
  );
}
