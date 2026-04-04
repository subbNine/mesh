import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { ArrowLeft, MessageSquare, MoreHorizontal } from 'lucide-react';

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

        {/* Status pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: STATUS_BG[statusKey] ?? '#f4f4f5',
            color: STATUS_TEXT[statusKey] ?? '#52525b',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: STATUS_COLORS[statusKey] ?? '#a1a1aa' }}
          />
          {getStatusLabel(task.status ?? 'todo')}
        </div>
      </div>

      {/* Right: presence + actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Overlapping presence avatars */}
        {awarenessUsers.length > 0 && (
          <div className="flex items-center -space-x-1.5">
            {visibleAvatars.map((user, idx) => (
              <div
                key={user.clientId}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white relative group flex-shrink-0 cursor-default"
                style={{
                  backgroundColor: USER_PALETTE[idx % USER_PALETTE.length],
                  zIndex: visibleAvatars.length - idx,
                }}
                title={user.name}
              >
                {user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                <div className="absolute top-9 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-zinc-800 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
                  {user.name}
                </div>
              </div>
            ))}
            {extraAvatars > 0 && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-zinc-100 text-zinc-600 border-2 border-white">
                +{extraAvatars}
              </div>
            )}
          </div>
        )}

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

        <button className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
