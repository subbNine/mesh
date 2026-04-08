import { useEffect, useState, useRef, useMemo } from 'react';
import { AtSign, Bell, Check, CheckCircle2, ClipboardList, Link2, MessageSquare, UserPlus } from 'lucide-react';
import { useNotificationStore } from '../../store/notifications.store';
import { api } from '../../lib/api';
import { formatRelativeTime } from '../../lib/date-utils';
import { useNavigate, useParams } from 'react-router-dom';
import type { INotification } from '@mesh/shared';

const NotificationSkeleton = () => (
  <div className="p-4 flex gap-3 animate-pulse border-b border-border/50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-3/4 bg-muted rounded" />
      <div className="h-2 w-1/4 bg-muted rounded opacity-60" />
    </div>
  </div>
);

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
      setIsLoading(false);
    };
    init();
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: INotification) => {
    if (!n.readAt) {
      await markRead(n.id);
    }
    setIsOpen(false);

    if (n.resourceType === 'task' && n.resourceId && workspaceId) {
      try {
        const { data } = await api.get(`/tasks/${n.resourceId}`);
        navigate(`/w/${workspaceId}/p/${data.projectId}/tasks/${n.resourceId}/canvas`);
      } catch (error) {
        console.error('Failed to resolve notification task route', error);
        navigate(`/w/${workspaceId}/projects`);
      }
      return;
    }

    if (n.resourceType === 'project' && n.resourceId && workspaceId) {
      navigate(`/w/${workspaceId}/p/${n.resourceId}`);
    }
  };

  const renderNotificationMessage = (n: INotification) => {
    const actorName = n.actor ? `${n.actor.firstName} ${n.actor.lastName}` : 'Someone';
    switch (n.type) {
      case 'assigned':
        return (
          <p className="text-sm">
            <span className="font-bold text-foreground">{actorName}</span> assigned you to a task.
          </p>
        );
      case 'mentioned':
        return (
          <p className="text-sm">
            <span className="font-bold text-foreground">{actorName}</span> mentioned you in a comment.
          </p>
        );
      case 'commented':
        return (
          <p className="text-sm">
            <span className="font-bold text-foreground">{actorName}</span> commented on your task.
          </p>
        );
      case 'added_to_project':
        return (
          <p className="text-sm">
            <span className="font-bold text-foreground">{actorName}</span> added you to a project.
          </p>
        );
      case 'task_unblocked': {
        const taskTitle = typeof n.data?.taskTitle === 'string' ? n.data.taskTitle : 'Your task';
        const blockingTaskTitle = typeof n.data?.blockingTaskTitle === 'string' ? n.data.blockingTaskTitle : 'A blocking task';

        return (
          <p className="text-sm">
            <span className="font-bold text-foreground">{actorName}</span> marked <span className="font-semibold text-foreground">{blockingTaskTitle}</span> done. <span className="font-semibold text-foreground">{taskTitle}</span> is now unblocked.
          </p>
        );
      }
      default:
        return <p className="text-sm">New notification.</p>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assigned': return <ClipboardList className="w-4 h-4 text-blue-500" />;
      case 'mentioned': return <AtSign className="w-4 h-4 text-purple-500" />;
      case 'commented': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'added_to_project': return <UserPlus className="w-4 h-4 text-orange-500" />;
      case 'task_unblocked': return <Link2 className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const dropdownClasses = useMemo(() => {
    return 'absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-border shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 origin-top-right';
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all relative ${isOpen ? 'bg-zinc-100 text-zinc-900 shadow-inner' : 'hover:bg-muted text-muted-foreground'}`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background animate-in zoom-in duration-300">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={dropdownClasses}>
          <div className="p-4 border-b border-border flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllRead()}
                className="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors uppercase tracking-tight flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto overflow-x-hidden scrollbar-hide">
            {isLoading ? (
              <>
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-50 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7 text-zinc-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">You're all caught up!</p>
                  <p className="text-[12px] text-zinc-400">No new notifications at the moment.</p>
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full p-4 flex gap-3 text-left hover:bg-zinc-50 transition-all relative border-b border-border/50 last:border-0 group ${
                    n.readAt ? '' : 'bg-primary/[0.02]'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-9 h-9 rounded-xl bg-white border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      {getIcon(n.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-700">
                      {renderNotificationMessage(n)}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 font-medium italic">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {n.readAt === null && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-zinc-50/30 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

