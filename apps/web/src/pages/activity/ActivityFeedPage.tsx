import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDays, endOfDay, endOfMonth, startOfDay, startOfMonth } from 'date-fns';
import { ActivityEventRow } from '../../components/activity/ActivityEventRow';
import { Button } from '../../components/ui/Button';
import { DateField } from '../../components/ui/DateField';
import { useActivityFeedStore } from '../../store/activityFeed.store';
import { useProjectStore } from '../../store/project.store';
import { useWorkspaceStore } from '../../store/workspace.store';
import {
  COMMENT_ACTIVITY_TYPES,
  PROJECT_ACTIVITY_TYPES,
  TASK_ACTIVITY_TYPES,
} from '../../lib/activity-utils';
import {
  Activity,
  CalendarRange,
  ChevronDown,
  FolderKanban,
  Inbox,
  Users,
} from 'lucide-react';

const EVENT_CATEGORY_OPTIONS = [
  { key: 'tasks', label: 'Tasks', values: TASK_ACTIVITY_TYPES },
  { key: 'comments', label: 'Comments', values: COMMENT_ACTIVITY_TYPES },
  { key: 'project', label: 'Project events', values: PROJECT_ACTIVITY_TYPES },
] as const;

type EventCategory = typeof EVENT_CATEGORY_OPTIONS[number]['key'];
type DateRangeOption = 'all' | 'today' | 'week' | 'month' | 'custom';

export default function ActivityFeedPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const activeWorkspaceId = workspaceId ?? '';

  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const members = useWorkspaceStore((state) => state.members);
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  const events = useActivityFeedStore((state) => state.workspaceEvents);
  const total = useActivityFeedStore((state) => state.workspaceTotal);
  const hasMore = useActivityFeedStore((state) => state.workspaceHasMore);
  const isLoading = useActivityFeedStore((state) => state.isLoadingWorkspace);
  const fetchWorkspaceActivity = useActivityFeedStore((state) => state.fetchWorkspaceActivity);

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(['tasks', 'comments', 'project']);
  const [dateRange, setDateRange] = useState<DateRangeOption>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [actorMenuOpen, setActorMenuOpen] = useState(false);

  useEffect(() => {
    if (activeWorkspaceId && projects.length === 0) {
      fetchProjects(activeWorkspaceId).catch(console.error);
    }
  }, [activeWorkspaceId, projects.length, fetchProjects]);

  const eventTypes = useMemo(() => {
    if (selectedCategories.length === EVENT_CATEGORY_OPTIONS.length) {
      return undefined;
    }

    return EVENT_CATEGORY_OPTIONS
      .filter((option) => selectedCategories.includes(option.key))
      .flatMap((option) => option.values);
  }, [selectedCategories]);

  const dateFilter = useMemo(() => {
    const now = new Date();

    if (dateRange === 'today') {
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    }

    if (dateRange === 'week') {
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(addDays(now, 6)).toISOString(),
      };
    }

    if (dateRange === 'month') {
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfMonth(now).toISOString(),
      };
    }

    if (dateRange === 'custom') {
      return {
        from: customFrom ? startOfDay(new Date(customFrom)).toISOString() : undefined,
        to: customTo ? endOfDay(new Date(customTo)).toISOString() : undefined,
      };
    }

    return {
      from: undefined,
      to: undefined,
    };
  }, [dateRange, customFrom, customTo]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      return;
    }

    setPage(1);
    fetchWorkspaceActivity(
      activeWorkspaceId,
      {
        projectId: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
        actorId: selectedActorIds.length > 0 ? selectedActorIds : undefined,
        eventType: eventTypes,
        from: dateFilter.from,
        to: dateFilter.to,
        page: 1,
        limit: 50,
      },
      false,
    ).catch(console.error);
  }, [activeWorkspaceId, selectedProjectIds, selectedActorIds, eventTypes, dateFilter, fetchWorkspaceActivity]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  const toggleActor = (actorId: string) => {
    setSelectedActorIds((current) =>
      current.includes(actorId)
        ? current.filter((id) => id !== actorId)
        : [...current, actorId],
    );
  };

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      return [...current, category];
    });
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchWorkspaceActivity(
      activeWorkspaceId,
      {
        projectId: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
        actorId: selectedActorIds.length > 0 ? selectedActorIds : undefined,
        eventType: eventTypes,
        from: dateFilter.from,
        to: dateFilter.to,
        page: nextPage,
        limit: 50,
      },
      true,
    );
  };

  const projectFilterLabel = selectedProjectIds.length === 0 ? 'All projects' : `${selectedProjectIds.length} selected`;
  const actorFilterLabel = selectedActorIds.length === 0 ? 'All members' : `${selectedActorIds.length} selected`;

  if (!activeWorkspaceId) {
    return null;
  }

  let pageContent;

  if (isLoading && events.length === 0) {
    pageContent = (
      <div className="space-y-3">
        {['first', 'second', 'third'].map((key) => (
          <div key={key} className="h-24 rounded-[24px] border border-border/50 bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  } else if (events.length === 0) {
    pageContent = (
      <div className="rounded-[32px] border-2 border-dashed border-border/50 bg-card/40 px-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-muted/60 text-muted-foreground">
          <Inbox size={28} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-black text-foreground">No matching activity yet.</h2>
        <p className="mt-2 text-sm font-serif italic text-muted-foreground">
          Try widening the filters, or check back after the team makes more updates.
        </p>
      </div>
    );
  } else {
    pageContent = (
      <div className="space-y-3">
        {events.map((event) => (
          <ActivityEventRow key={event.id} event={event} />
        ))}

        {hasMore && (
          <div className="pt-2">
            <Button size="md" variant="outline" onClick={() => { handleLoadMore().catch(console.error); }} loading={isLoading}>
              Load more
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full overflow-x-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[32px] border border-border/50 bg-card/60 p-6 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Activity size={12} />
                Team pulse
              </div>
              <div>
                <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                  Activity
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-serif italic text-muted-foreground sm:text-base">
                  {currentWorkspace?.name || 'Workspace'} · a chronological view of what changed across the team.
                </p>
              </div>
            </div>

            <div className="rounded-[24px] border border-border/60 bg-background/70 px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Events loaded</div>
              <div className="mt-2 text-3xl font-black text-foreground">{total}</div>
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-border/50 bg-card/50 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProjectMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground"
                >
                  <FolderKanban size={12} />
                  {projectFilterLabel}
                  <ChevronDown size={12} className={projectMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>

                {projectMenuOpen && (
                  <div className="dropdown-surface absolute left-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl p-2 shadow-2xl">
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                      {projects.map((project) => (
                        <label
                          key={project.id}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <span className="truncate pr-3">{project.name}</span>
                          <input
                            type="checkbox"
                            checked={selectedProjectIds.includes(project.id)}
                            onChange={() => toggleProject(project.id)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActorMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground"
                >
                  <Users size={12} />
                  {actorFilterLabel}
                  <ChevronDown size={12} className={actorMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>

                {actorMenuOpen && (
                  <div className="dropdown-surface absolute left-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl p-2 shadow-2xl">
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                      {members.map((member: any) => (
                        <label
                          key={member.userId}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          <span className="truncate pr-3">{member.user?.firstName} {member.user?.lastName}</span>
                          <input
                            type="checkbox"
                            checked={selectedActorIds.includes(member.userId)}
                            onChange={() => toggleActor(member.userId)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <CalendarRange size={12} />
                Range
              </div>

              {(['all', 'today', 'week', 'month', 'custom'] as DateRangeOption[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDateRange(option)}
                  className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    dateRange === option
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {option === 'week' ? 'This week' : option}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <DateField
                  value={customFrom}
                  onChange={setCustomFrom}
                  ariaLabel="Filter activity from date"
                />
                <DateField
                  value={customTo}
                  onChange={setCustomTo}
                  ariaLabel="Filter activity to date"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {EVENT_CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleCategory(option.key)}
                  className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    selectedCategories.includes(option.key)
                      ? 'bg-foreground text-background'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {pageContent}
      </div>
    </div>
  );
}
