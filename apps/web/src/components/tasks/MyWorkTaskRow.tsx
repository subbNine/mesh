import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday } from 'date-fns';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { type ITask, type TaskStatus } from '@mesh/shared';

import { AssigneeStack } from './AssigneeStack';

interface MyWorkTaskRowProps {
  task: ITask;
  workspaceId: string;
  onStatusChange: (taskId: string, status: TaskStatus) => Promise<void> | void;
}

const STATUS_OPTIONS: Array<{
  value: TaskStatus;
  label: string;
  className: string;
}> = [
  {
    value: 'todo',
    label: 'To do',
    className: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  },
  {
    value: 'inprogress',
    label: 'In progress',
    className: 'border-primary/20 bg-primary/10 text-primary',
  },
  {
    value: 'review',
    label: 'Review',
    className: 'border-sky-200 bg-sky-100 text-sky-700',
  },
  {
    value: 'done',
    label: 'Done',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
];

const PROJECT_TONES = [
  'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  'border-sky-200 bg-sky-50 text-sky-700',
  'border-emerald-200 bg-emerald-50 text-emerald-700',
  'border-amber-200 bg-amber-50 text-amber-700',
  'border-violet-200 bg-violet-50 text-violet-700',
];

function getProjectTone(projectId: string): string {
  const seed = projectId.split('').reduce((total, char) => total + (char.codePointAt(0) ?? 0), 0);
  return PROJECT_TONES[seed % PROJECT_TONES.length];
}

function getDueMeta(task: ITask): { label: string; className: string } {
  if (!task.dueDate) {
    return {
      label: 'No due date',
      className: 'border-border/60 bg-muted/50 text-muted-foreground',
    };
  }

  const dueDate = new Date(task.dueDate);

  if (task.status === 'done') {
    return {
      label: `Completed · ${format(dueDate, 'MMM d')}`,
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    };
  }

  if (isPast(dueDate) && !isToday(dueDate)) {
    return {
      label: `Overdue · ${format(dueDate, 'MMM d')}`,
      className: 'border-red-200 bg-red-50 text-red-700',
    };
  }

  if (isToday(dueDate)) {
    return {
      label: `Due today · ${format(dueDate, 'MMM d')}`,
      className: 'border-amber-200 bg-amber-50 text-amber-800',
    };
  }

  return {
    label: `Due ${format(dueDate, 'MMM d')}`,
    className: 'border-amber-200/70 bg-amber-50/70 text-amber-700',
  };
}

export function MyWorkTaskRow({
  task,
  workspaceId,
  onStatusChange,
}: Readonly<MyWorkTaskRowProps>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentStatus =
    STATUS_OPTIONS.find((option) => option.value === task.status) ?? STATUS_OPTIONS[0];
  const dueMeta = getDueMeta(task);
  const projectTone = getProjectTone(task.projectId);

  const taskAssignees = task.assignees?.length ? task.assignees : task.assignee ? [task.assignee] : [];

  const handleStatusSelect = async (status: TaskStatus) => {
    setIsMenuOpen(false);

    if (status === task.status) {
      return;
    }

    try {
      setIsUpdating(true);
      await onStatusChange(task.id, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="group rounded-[24px] border border-border/50 bg-card/70 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Link
            to={`/w/${workspaceId}/p/${task.projectId}`}
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${projectTone}`}
          >
            {task.projectName || 'Project'}
          </Link>

          <div className="min-w-0 space-y-1">
            <Link
              to={`/w/${workspaceId}/p/${task.projectId}/tasks/${task.id}/canvas`}
              className="block text-sm font-display font-black tracking-tight text-foreground transition-colors hover:text-primary"
            >
              {task.title}
            </Link>
            <p className="line-clamp-1 text-xs font-serif italic text-muted-foreground/80">
              {task.description || 'Open the canvas to add notes, blockers, or next steps.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${currentStatus.className}`}
            >
              {currentStatus.label}
              <ChevronDown size={12} className={isMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-40 rounded-2xl border border-border/60 bg-popover p-1.5 shadow-2xl">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => void handleStatusSelect(option.value)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors hover:bg-muted ${option.value === task.status ? 'text-primary' : 'text-foreground'}`}
                  >
                    <span>{option.label}</span>
                    {option.value === task.status && <span className="text-[10px] uppercase tracking-[0.2em]">Now</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold ${dueMeta.className}`}>
            <CalendarDays size={12} />
            <span>{dueMeta.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <AssigneeStack assignees={taskAssignees} maxVisible={3} size="md" />
            <span className="text-[10px] font-semibold text-muted-foreground/80">
              {taskAssignees.length === 0
                ? 'Unassigned'
                : taskAssignees.length === 1
                  ? '1 assignee'
                  : `${taskAssignees.length} assignees`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
