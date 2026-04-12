import { io, Socket } from 'socket.io-client';


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

  socket.on('notification', async (notification) => {
    console.log('[Notifications] New notification:', notification);
    const { useNotificationStore } = await import('../store/notifications.store');
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
