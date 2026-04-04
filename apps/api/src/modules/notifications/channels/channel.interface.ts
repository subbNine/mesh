export type ChannelType = 'in-app' | 'email' | 'push';

export interface NotificationPayload {
  recipientId: string;
  type: string; // e.g. 'assigned', 'mentioned'
  resourceId?: string; // e.g. taskId
  resourceType?: string; // e.g. 'task'
  channels: ChannelType[];
  data?: Record<string, any>; // Extra data for templates like userName, taskName
}

export interface INotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
