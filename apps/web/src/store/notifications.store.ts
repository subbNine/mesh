import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import type { INotification } from '@mesh/shared';

interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  addNotification: (notification: INotification) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, _get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      fetchNotifications: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/notifications');
          set({ notifications: data });
        } catch (error) {
          console.error('Failed to fetch notifications', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchUnreadCount: async () => {
        try {
          const { data } = await api.get('/notifications/unread-count');
          set({ unreadCount: data.count });
        } catch (error) {
          console.error('Failed to fetch unread count', error);
        }
      },

      markRead: async (id: string) => {
        try {
          await api.patch(`/notifications/${id}/read`);
          set(state => ({
            notifications: state.notifications.map(n => 
              n.id === id ? { ...n, readAt: new Date().toISOString() } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        } catch (error) {
          console.error('Failed to mark notification as read', error);
        }
      },

      markAllRead: async () => {
        try {
          await api.patch('/notifications/read-all');
          set(state => ({
            notifications: state.notifications.map(n => ({ ...n, readAt: new Date().toISOString() })),
            unreadCount: 0
          }));
        } catch (error) {
          console.error('Failed to mark all notifications as read', error);
        }
      },

      addNotification: (notification: INotification) => {
        set(state => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1
        }));
      }
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ unreadCount: state.unreadCount }), // Only persist count if needed
    }
  )
);
