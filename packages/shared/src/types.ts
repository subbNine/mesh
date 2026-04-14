import {
  TaskStatus,
  WorkspaceMemberRole,
  ProjectMemberRole,
  NotificationType,
  ActivityEventType
} from './enums';

export type ISODateValue = string | Date;

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

export interface IProjectStats {
  total: number;
  done: number;
  inProgress: number;
  review: number;
  todo: number;
  progressPercent: number;
}

export interface IProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string | Date;
  taskCount?: number;
  memberCount?: number;
  stats?: IProjectStats;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  user: IUser;
}

export interface ITaskDependencyTaskRef {
  id: string;
  title: string;
  status: TaskStatus;
  snapshotUrl: string | null;
  assignee: IUser | null;
}

export interface ITaskDependency {
  id: string;
  blockingTaskId: string;
  blockingTask: ITaskDependencyTaskRef;
  blockedTaskId: string;
  blockedTask: ITaskDependencyTaskRef;
  createdBy: string;
  createdAt: ISODateValue;
}

export interface ITaskDependenciesResponse {
  blockedBy: ITaskDependency[];
  blocks: ITaskDependency[];
  isBlocked: boolean;
  dependencyCount: number;
}

export interface IScratchpad {
  id: string;
  userId: string;
  content: Record<string, unknown> | null;
  createdAt: ISODateValue;
  updatedAt: ISODateValue;
}

export interface ITask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  assignee: IUser | null;
  assignees: IUser[];
  snapshotUrl: string | null;
  dueDate?: ISODateValue | null;
  projectName?: string;
  blockedBy?: ITaskDependency[];
  blocks?: ITaskDependency[];
  isBlocked?: boolean;
  dependencyCount?: number;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ISubtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  createdBy: string;
  createdAt: ISODateValue;
  completedAt: ISODateValue | null;
}

export interface IMyAssignmentsResponse {
  overdue: ITask[];
  dueToday: ITask[];
  dueThisWeek: ITask[];
  other: ITask[];
}

export interface IProjectFolder {
  id: string;
  projectId: string;
  name: string;
  createdBy: string;
  createdAt: ISODateValue;
  itemCount?: number;
}

export interface IProjectDocument {
  id: string;
  projectId: string;
  folderId: string | null;
  title: string;
  content: Record<string, unknown>;
  authorId: string;
  author: IUser;
  createdAt: ISODateValue;
  updatedAt: ISODateValue;
}

export interface IProjectFile {
  id: string;
  projectId: string;
  folderId: string | null;
  name: string;
  url: string;
  key?: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  uploader: IUser;
  createdAt: ISODateValue;
}

export interface IProjectLibraryResponse {
  currentFolder: IProjectFolder | null;
  folders: IProjectFolder[];
  documents: IProjectDocument[];
  files: IProjectFile[];
}

export interface IActivityEvent {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  taskId?: string | null;
  actorId: string;
  actor: IUser;
  eventType: ActivityEventType;
  payload: Record<string, unknown>;
  createdAt: ISODateValue;
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
  actorId: string | null;
  actor: IUser | null;
  type: NotificationType;
  resourceId: string | null;
  resourceType: 'task' | 'project' | null;
  data?: Record<string, unknown> | null;
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
export interface ISearchResult {
  id: string;
  type: 'task' | 'subtask';
  title: string;
  highlight: string;
  projectId: string;
  projectName: string;
  status?: TaskStatus;
  parentTaskId?: string;
  parentTaskTitle?: string;
}
