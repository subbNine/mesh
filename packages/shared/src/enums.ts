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

export const ActivityEventType = {
  TaskCreated: 'task.created',
  TaskStatusChanged: 'task.status_changed',
  TaskAssigned: 'task.assigned',
  TaskDueDateSet: 'task.due_date_set',
  CommentCreated: 'comment.created',
  CommentResolved: 'comment.resolved',
  CanvasElementAdded: 'canvas.element_added',
  CanvasElementDeleted: 'canvas.element_deleted',
  ProjectCreated: 'project.created',
  MemberAdded: 'member.added',
} as const;
export type ActivityEventType = typeof ActivityEventType[keyof typeof ActivityEventType];

export const CanvasElementType = {
  Text: 'text',
  Image: 'image',
  Callout: 'callout',
} as const;
export type CanvasElementType = typeof CanvasElementType[keyof typeof CanvasElementType];
