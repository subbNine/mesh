import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, UserPlus, MessageSquare, ClipboardList, AtSign, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '../../store/notifications.store';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { INotification } from '@mesh/shared';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markRead, markAllRead } = useNotificationStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
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
    
    // Navigation logic based on resourceType
    if (n.resourceType === 'task' && n.resourceId) {
      // Assuming resourceId is taskId, navigate to canvas or task detail.
      // Need workspaceId and projectId potentially. 
      // For now, let's navigate to task detail within its project if we have context.
      // Since notifications don't have project context in this stub, we should maybe add it.
      // Simplified: Navigate to projects list for now or generic task detail route.
      navigate(`/tasks/${n.resourceId}/canvas`);
    } else if (n.resourceType === 'project' && n.resourceId) {
      navigate(`/projects/${n.resourceId}`);
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
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-muted transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllRead()}
                className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto overflow-x-hidden">
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-muted-foreground opacity-30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full p-4 flex gap-3 text-left hover:bg-muted/50 transition-colors relative border-b border-border/50 last:border-0 ${
                    !n.readAt ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm">
                      {getIcon(n.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    {renderNotificationMessage(n)}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!n.readAt && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/10 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
              >
                Close panel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
