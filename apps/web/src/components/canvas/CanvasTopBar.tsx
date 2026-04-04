import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { useProjectStore } from '../../store/project.store';
import { ArrowLeft, MessageSquare, MoreHorizontal, ChevronDown, Check, UserPlus } from 'lucide-react';
import { NotificationBell } from '../ui/NotificationBell';
import { useAuthStore } from '../../store/auth.store';
import { getUserColor } from '../../lib/user-color';

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

export function CanvasTopBar({ task, awarenessUsers, onTaskUpdate }: CanvasTopBarProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const members = useProjectStore(state => state.members);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);

  const toggleCommentPane = useCanvasStore(state => state.toggleCommentPane);
  const isCommentPaneOpen = useCanvasStore(state => state.isCommentPaneOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setIsStatusOpen(false);
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(e.target as Node)) setIsAssigneeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== task.title) {
      onTaskUpdate({ title: title.trim() });
      api.patch(`/tasks/${task.id}`, { title: title.trim() }).catch(console.error);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setIsStatusOpen(false);
    if (newStatus === task.status) return;
    onTaskUpdate({ status: newStatus as any });
    api.patch(`/tasks/${task.id}`, { status: newStatus }).catch(console.error);
  };

  const handleAssigneeChange = (userId: string | null) => {
    setIsAssigneeOpen(false);
    if (userId === task.assigneeId) return;
    onTaskUpdate({ assigneeId: userId } as any);
    api.patch(`/tasks/${task.id}`, { assigneeId: userId }).catch(console.error);
  };

  const visibleAvatars = awarenessUsers.slice(0, 5);
  const extraAvatars = awarenessUsers.length > 5 ? awarenessUsers.length - 5 : 0;
  const statusKey = task.status?.toLowerCase() ?? 'todo';

  const currentAssignee = members.find(m => m.userId === task.assigneeId)?.user;

  return (
    <div className="h-[52px] border-b border-zinc-200/80 bg-white/98 backdrop-blur-sm px-5 flex items-center justify-between z-30 relative flex-shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.04)]">

      {/* Left: back + title + selectors */}
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
            className="font-semibold text-[15px] text-zinc-900 truncate cursor-text hover:text-zinc-700 transition-colors max-w-[240px]"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit title"
          >
            {task.title}
          </button>
        )}

        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:bg-zinc-50 border border-zinc-200/60 shadow-sm"
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
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isStatusOpen && (
              <div className="absolute top-8 left-0 w-40 bg-white rounded-xl shadow-2xl border border-zinc-200/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {['todo', 'inprogress', 'review', 'done'].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
                      <span className={task.status === s ? 'text-zinc-900 font-bold' : 'text-zinc-600'}>
                        {getStatusLabel(s)}
                      </span>
                    </div>
                    {task.status === s && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assignee Selector */}
          <div className="relative" ref={assigneeMenuRef}>
            <button
              onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
              className="flex items-center gap-2 px-2 py-0.5 rounded-full hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200 group"
            >
              <div className="flex items-center -space-x-1">
                {currentAssignee ? (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white"
                    style={{ backgroundColor: getUserColor(currentAssignee.id) }}
                  >
                    {currentAssignee.firstName[0]}{currentAssignee.lastName[0]}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400">
                    <UserPlus className="w-3 h-3" />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">
                {currentAssignee ? `${currentAssignee.firstName} ${currentAssignee.lastName}` : 'Unassigned'}
              </span>
            </button>

            {isAssigneeOpen && (
              <div className="absolute top-8 left-0 w-56 bg-white rounded-xl shadow-2xl border border-zinc-200/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Assign to</div>
                <button
                  onClick={() => handleAssigneeChange(null)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                      <UserPlus className="w-3 h-3" />
                    </div>
                    <span className={task.assigneeId ? 'text-zinc-600' : 'text-zinc-900 font-bold'}>Unassigned</span>
                  </div>
                  {!task.assigneeId && <Check className="w-3 h-3 text-primary" />}
                </button>
                {members.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => handleAssigneeChange(m.userId)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: getUserColor(m.userId) }}
                      >
                        {m.user.firstName[0]}{m.user.lastName[0]}
                      </div>
                      <span className={task.assigneeId === m.userId ? 'text-zinc-900 font-bold' : 'text-zinc-600'}>
                        {m.user.firstName} {m.user.lastName}
                      </span>
                    </div>
                    {task.assigneeId === m.userId && <Check className="w-3 h-3 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: presence + actions */}
      <div className="flex items-center gap-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          {awarenessUsers.length > 0 && (
            <div className="flex items-center -space-x-2">
              {visibleAvatars.map((user, idx) => {
                const isMe = user.userId === currentUser?.id;
                const userColor = user.color || getUserColor(user.userId);

                return (
                  <div
                    key={user.clientId}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white relative group flex-shrink-0 cursor-pointer transition-transform hover:scale-110 hover:z-50 overflow-visible"
                    style={{
                      backgroundColor: userColor,
                      boxShadow: `0 0 0 2px ${userColor}`,
                      zIndex: visibleAvatars.length - idx,
                    }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                    )}

                    <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:block px-2.5 py-1.5 bg-zinc-900 text-white text-[10px] font-medium rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-[100] pointer-events-none transition-all">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {user.name} {isMe && '(You)'}
                      </div>
                    </div>
                  </div>
                );
              })}
              {extraAvatars > 0 && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold bg-zinc-100 text-zinc-500 border-2 border-white z-0 relative">
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

        <div className="w-px h-4 bg-zinc-200" />

        <button
          onClick={toggleCommentPane}
          className={`p-1.5 rounded-lg transition-colors ${isCommentPaneOpen
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
