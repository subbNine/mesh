import { format } from 'date-fns';
import { ActivityEventType, type IActivityEvent } from '@mesh/shared';

export const TASK_ACTIVITY_TYPES = [
  ActivityEventType.TaskCreated,
  ActivityEventType.TaskStatusChanged,
  ActivityEventType.TaskAssigned,
  ActivityEventType.TaskDueDateSet,
];

export const COMMENT_ACTIVITY_TYPES = [
  ActivityEventType.CommentCreated,
  ActivityEventType.CommentResolved,
];

export const PROJECT_ACTIVITY_TYPES = [
  ActivityEventType.ProjectCreated,
  ActivityEventType.MemberAdded,
];

function formatStatus(status?: string | null) {
  switch (status) {
    case 'todo':
      return 'To do';
    case 'inprogress':
      return 'In progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return 'Updated';
  }
}

function formatDateLabel(value?: string | null) {
  if (!value) {
    return 'no date';
  }

  return format(new Date(value), 'MMM d');
}

export function getActivityDescription(event: IActivityEvent) {
  const actorName = `${event.actor?.firstName ?? ''} ${event.actor?.lastName ?? ''}`.trim() || 'Someone';
  const payload = event.payload as Record<string, string | null | undefined>;
  const taskTitle = payload.taskTitle ?? 'Untitled task';
  const projectName = payload.projectName ?? 'Untitled project';

  switch (event.eventType) {
    case ActivityEventType.TaskCreated:
      return `${actorName} created canvas task “${taskTitle}”`;
    case ActivityEventType.TaskStatusChanged:
      return `${actorName} moved “${taskTitle}” from ${formatStatus(payload.fromStatus)} to ${formatStatus(payload.toStatus)}`;
    case ActivityEventType.TaskAssigned:
      return payload.assigneeName
        ? `${actorName} assigned “${taskTitle}” to ${payload.assigneeName}`
        : `${actorName} cleared the assignee on “${taskTitle}”`;
    case ActivityEventType.TaskDueDateSet:
      if (payload.dueDate && payload.previousDueDate) {
        return `${actorName} updated the due date on “${taskTitle}” to ${formatDateLabel(payload.dueDate)}`;
      }
      if (payload.dueDate) {
        return `${actorName} set a due date on “${taskTitle}” for ${formatDateLabel(payload.dueDate)}`;
      }
      return `${actorName} cleared the due date on “${taskTitle}”`;
    case ActivityEventType.CommentCreated:
      return `${actorName} commented on “${taskTitle}”`;
    case ActivityEventType.CommentResolved:
      return `${actorName} resolved a comment on “${taskTitle}”`;
    case ActivityEventType.ProjectCreated:
      return `${actorName} created project “${projectName}”`;
    case ActivityEventType.MemberAdded:
      return `${actorName} added ${payload.memberName ?? 'a teammate'} to “${projectName}”`;
    case ActivityEventType.CanvasElementAdded:
      return `${actorName} added a canvas element to “${taskTitle}”`;
    case ActivityEventType.CanvasElementDeleted:
      return `${actorName} removed a canvas element from “${taskTitle}”`;
    default:
      return `${actorName} updated “${taskTitle}”`;
  }
}

export function getActivityLink(event: IActivityEvent) {
  if (event.taskId && event.projectId) {
    return `/w/${event.workspaceId}/p/${event.projectId}/tasks/${event.taskId}/canvas`;
  }

  if (event.projectId) {
    return `/w/${event.workspaceId}/p/${event.projectId}`;
  }

  return `/w/${event.workspaceId}/activity`;
}
