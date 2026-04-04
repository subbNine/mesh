import { io, Socket } from 'socket.io-client';
import { useNotificationStore } from '../store/notifications.store';

let socket: Socket | null = null;

export function connectNotifications(token: string) {
  if (socket?.connected) return;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  
  socket = io(`${apiUrl}/notifications`, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('[Notifications] Connected to socket');
  });

  socket.on('notification', (notification) => {
    console.log('[Notifications] New notification:', notification);
    useNotificationStore.getState().addNotification(notification);
  });

  socket.on('disconnect', () => {
    console.log('[Notifications] Disconnected from socket');
  });

  socket.on('connect_error', (error) => {
    console.error('[Notifications] Connection error:', error);
  });
}

export function disconnectNotifications() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
