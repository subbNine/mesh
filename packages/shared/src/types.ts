import {
  TaskStatus,
  WorkspaceMemberRole,
  ProjectMemberRole,
  NotificationType
} from './enums';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userName: string;
  avatarUrl: string | null;
  createdAt: string | Date;
}

export interface IWorkspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string | Date;
}

export interface IWorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  user: IUser;
}

export interface IProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string | Date;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  user: IUser;
}

export interface ITask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  assignee: IUser | null;
  snapshotUrl: string | null;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IComment {
  id: string;
  taskId: string;
  authorId: string;
  author: IUser;
  body: string;
  canvasX: number;
  canvasY: number;
  resolvedAt: string | Date | null;
  createdAt: string | Date;
  replies: ICommentReply[];
}

export interface ICommentReply {
  id: string;
  commentId: string;
  authorId: string;
  author: IUser;
  body: string;
  createdAt: string | Date;
}

export interface INotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  resourceId: string | null;
  resourceType: 'task' | 'project' | null;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export interface IFile {
  id: string;
  taskId: string;
  uploaderId: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | Date;
}
