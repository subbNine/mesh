import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCheck,
  FolderPlus,
  ListTodo,
  MessageSquare,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { ActivityEventType, type IActivityEvent } from '@mesh/shared';
import { getActivityDescription, getActivityLink } from '../../lib/activity-utils';
import { formatRelativeTime } from '../../lib/date-utils';

interface ActivityEventRowProps {
  event: IActivityEvent;
  showProject?: boolean;
}

function getEventMeta(eventType: string) {
  switch (eventType) {
    case ActivityEventType.TaskCreated:
      return { icon: Sparkles, tone: 'border-primary/20 bg-primary/10 text-primary' };
    case ActivityEventType.TaskStatusChanged:
      return { icon: ListTodo, tone: 'border-amber-200 bg-amber-50 text-amber-700' };
    case ActivityEventType.TaskAssigned:
      return { icon: UserPlus, tone: 'border-sky-200 bg-sky-50 text-sky-700' };
    case ActivityEventType.TaskDueDateSet:
      return { icon: CalendarDays, tone: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700' };
    case ActivityEventType.CommentCreated:
      return { icon: MessageSquare, tone: 'border-violet-200 bg-violet-50 text-violet-700' };
    case ActivityEventType.CommentResolved:
      return { icon: CheckCheck, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
    case ActivityEventType.ProjectCreated:
    case ActivityEventType.MemberAdded:
      return { icon: FolderPlus, tone: 'border-zinc-200 bg-zinc-100 text-zinc-700' };
    default:
      return { icon: Sparkles, tone: 'border-border bg-muted text-foreground' };
  }
}

export function ActivityEventRow({ event, showProject = true }: Readonly<ActivityEventRowProps>) {
  const actorName = `${event.actor?.firstName ?? ''} ${event.actor?.lastName ?? ''}`.trim() || 'Someone';
  const actorInitials = `${event.actor?.firstName?.[0] ?? ''}${event.actor?.lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  const payload = event.payload as Record<string, string | undefined>;
  const eventMeta = getEventMeta(event.eventType);
  const Icon = eventMeta.icon;

  return (
    <Link
      to={getActivityLink(event)}
      className="group block rounded-[24px] border border-border/50 bg-card/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 text-sm font-black text-primary">
            {event.actor?.avatarUrl ? (
              <img src={event.actor.avatarUrl} alt={`${actorName} avatar`} className="h-full w-full object-cover" />
            ) : (
              actorInitials
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${eventMeta.tone}`}>
            <Icon size={10} />
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm leading-relaxed text-foreground/90">
                {getActivityDescription(event)}
              </p>
              {payload.commentPreview && (
                <p className="line-clamp-2 text-xs font-serif italic text-muted-foreground/80">
                  “{payload.commentPreview}”
                </p>
              )}
            </div>

            <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
              {formatRelativeTime(event.createdAt)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em]">
            <span className="rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-muted-foreground">
              {actorName}
            </span>
            {showProject && payload.projectName && (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">
                {payload.projectName}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
