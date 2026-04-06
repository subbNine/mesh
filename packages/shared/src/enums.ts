export const TaskStatus = {
  Todo: 'todo',
  InProgress: 'inprogress',
  Review: 'review',
  Done: 'done',
} as const;
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const WorkspaceMemberRole = {
  Owner: 'owner',
  Member: 'member',
} as const;
export type WorkspaceMemberRole = typeof WorkspaceMemberRole[keyof typeof WorkspaceMemberRole];

export const ProjectMemberRole = {
  Admin: 'admin',
  Member: 'member',
} as const;
export type ProjectMemberRole = typeof ProjectMemberRole[keyof typeof ProjectMemberRole];

export const NotificationType = {
  Assigned: 'assigned',
  Mentioned: 'mentioned',
  Commented: 'commented',
  AddedToProject: 'added_to_project',
  DueSoon: 'due_soon',
  DueToday: 'due_today',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const CanvasElementType = {
  Text: 'text',
  Image: 'image',
} as const;
export type CanvasElementType = typeof CanvasElementType[keyof typeof CanvasElementType];
