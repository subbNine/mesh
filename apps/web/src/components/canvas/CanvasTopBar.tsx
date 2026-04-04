import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { ArrowLeft, MessageSquare, MoreHorizontal } from 'lucide-react';
import { NotificationBell } from '../ui/NotificationBell';

type CanvasTopBarProps = Readonly<{
  task: ITask;
  awarenessUsers: any[];
  onTaskUpdate: (updates: Partial<ITask>) => void;
}>;

const STATUS_COLORS: Record<string, string> = {
  todo: '#0ca3ba',
  inprogress: '#f59e0b',
  review: '#8b5cf6',
  done: '#22c55e',
};

const STATUS_BG: Record<string, string> = {
  todo: '#e0f7fa',
  inprogress: '#fef3c7',
  review: '#ede9fe',
  done: '#dcfce7',
};

const STATUS_TEXT: Record<string, string> = {
  todo: '#0e7490',
  inprogress: '#92400e',
  review: '#5b21b6',
  done: '#15803d',
};

function getStatusLabel(status: string) {
  if (status === 'inprogress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const USER_PALETTE = ['#0ca3ba', '#a855f7', '#f59e0b', '#ec4899', '#22c55e', '#3b82f6'];

export function CanvasTopBar({ task, awarenessUsers, onTaskUpdate }: CanvasTopBarProps) {
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);

  const toggleCommentPane = useCanvasStore(state => state.toggleCommentPane);
  const isCommentPaneOpen = useCanvasStore(state => state.isCommentPaneOpen);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== task.title) {
      onTaskUpdate({ title: title.trim() });
      api.patch(`/tasks/${task.id}`, { title: title.trim() }).catch(console.error);
    }
  };

  const visibleAvatars = awarenessUsers.slice(0, 5);
  const extraAvatars = awarenessUsers.length > 5 ? awarenessUsers.length - 5 : 0;
  const statusKey = task.status?.toLowerCase() ?? 'todo';

  return (
    <div className="h-[52px] border-b border-zinc-200/80 bg-white/98 backdrop-blur-sm px-5 flex items-center justify-between z-20 relative flex-shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.04)]">

      {/* Left: back + title + status */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 rounded-md hover:bg-zinc-100 flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {isEditingTitle ? (
          <input
            autoFocus
            className="font-semibold text-[15px] bg-transparent border-b-2 border-primary outline-none text-zinc-900 min-w-0 w-48"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleBlur();
              if (e.key === 'Escape') { setTitle(task.title); setIsEditingTitle(false); }
            }}
          />
        ) : (
          <button
            className="font-semibold text-[15px] text-zinc-900 truncate cursor-text hover:text-zinc-700 transition-colors max-w-[280px]"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit title"
          >
            {task.title}
          </button>
        )}

        {/* Status pill (Interactive Toggle) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const statuses = ['todo', 'inprogress', 'review', 'done'];
            const currentIndex = statuses.indexOf(statusKey);
            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
            onTaskUpdate({ status: nextStatus as any });
            api.patch(`/tasks/${task.id}`, { status: nextStatus }).catch(console.error);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer border border-black/5"
          style={{
            backgroundColor: STATUS_BG[statusKey] ?? '#f4f4f5',
            color: STATUS_TEXT[statusKey] ?? '#52525b',
          }}
          title="Click to toggle status"
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: STATUS_COLORS[statusKey] ?? '#a1a1aa' }}
          />
          {getStatusLabel(task.status ?? 'todo')}
        </button>
      </div>

      {/* Right: presence + actions */}
      <div className="flex items-center gap-6 flex-shrink-0">
        {/* Presence Indicator */}
        <div className="flex items-center gap-3">
          {awarenessUsers.length > 0 && (
            <div className="flex items-center -space-x-2">
              {visibleAvatars.map((user, idx) => (
                <div
                  key={user.clientId}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white relative group flex-shrink-0 cursor-pointer transition-transform hover:scale-110 hover:z-50"
                  style={{
                    backgroundColor: USER_PALETTE[idx % USER_PALETTE.length],
                    zIndex: visibleAvatars.length - idx,
                  }}
                >
                  {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  
                  {/* Premium Tooltip */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:block px-2.5 py-1.5 bg-zinc-900 text-white text-[10px] font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-[100] pointer-events-none transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {user.name}
                    </div>
                  </div>
                </div>
              ))}
              {extraAvatars > 0 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-zinc-100 text-zinc-500 border-2 border-white z-0">
                  +{extraAvatars}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 rounded-md border border-emerald-100/50">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
              {awarenessUsers.length} {awarenessUsers.length === 1 ? 'Viewer' : 'Viewers'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-zinc-200" />

        <button
          onClick={toggleCommentPane}
          className={`p-1.5 rounded-lg transition-colors ${
            isCommentPaneOpen
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
          }`}
          title="Toggle comments"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <NotificationBell />

        <button className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
