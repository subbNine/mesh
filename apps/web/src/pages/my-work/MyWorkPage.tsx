import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ScratchpadPanel } from '../../components/scratchpad/ScratchpadPanel';
import { MyWorkTaskRow } from '../../components/tasks/MyWorkTaskRow';
import { extractScratchpadText } from '../../lib/scratchpad-utils';
import { useTaskStore } from '../../store/task.store';
import { useProjectStore } from '../../store/project.store';
import { useScratchpadStore } from '../../store/scratchpad.store';
import { useWorkspaceStore } from '../../store/workspace.store';
import { type TaskStatus } from '@mesh/shared';
import {
  Briefcase,
  ChevronDown,
  Inbox,
  ListFilter,
  Sparkles,
  StickyNote,
  TriangleAlert,
} from 'lucide-react';

const STATUS_FILTERS: Array<{ value: 'all' | TaskStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'inprogress', label: 'In progress' },
  { value: 'review', label: 'Review' },
];

const SECTION_META = {
  overdue: {
    title: 'Overdue',
    subtitle: 'Start here first',
    tone: 'text-red-600 bg-red-50 border-red-200',
  },
  dueToday: {
    title: 'Due today',
    subtitle: 'Needs same-day focus',
    tone: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  dueThisWeek: {
    title: 'Due this week',
    subtitle: 'Coming up next',
    tone: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  other: {
    title: 'Everything else',
    subtitle: 'Lower urgency queue',
    tone: 'text-zinc-700 bg-zinc-50 border-zinc-200',
  },
} as const;

export default function MyWorkPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const projects = useProjectStore((state) => state.projects);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);

  const assignments = useTaskStore((state) => state.assignments);
  const fetchMyAssignments = useTaskStore((state) => state.fetchMyAssignments);
  const updateTask = useTaskStore((state) => state.updateTask);
  const isLoading = useTaskStore((state) => state.isLoading);

  const scratchpad = useScratchpadStore((state) => state.scratchpad);
  const isScratchpadOpen = useScratchpadStore((state) => state.isOpen);
  const setScratchpadOpen = useScratchpadStore((state) => state.setOpen);
  const fetchScratchpad = useScratchpadStore((state) => state.fetchScratchpad);

  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState<Record<keyof typeof SECTION_META, boolean>>({
    overdue: false,
    dueToday: false,
    dueThisWeek: false,
    other: false,
  });

  const activeWorkspaceId = workspaceId ?? '';

  useEffect(() => {
    if (activeWorkspaceId && projects.length === 0) {
      fetchProjects(activeWorkspaceId).catch(console.error);
    }
  }, [activeWorkspaceId, projects.length, fetchProjects]);

  useEffect(() => {
    void fetchScratchpad();

    return () => {
      setScratchpadOpen(false);
    };
  }, [fetchScratchpad, setScratchpadOpen]);

  const loadAssignments = useCallback(async () => {
    if (!activeWorkspaceId) {
      return;
    }

    await fetchMyAssignments({
      workspaceId: activeWorkspaceId,
      status: statusFilter === 'all' ? undefined : [statusFilter],
      includeCompleted: showCompleted,
      projectId: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
    });
  }, [activeWorkspaceId, statusFilter, showCompleted, selectedProjectIds, fetchMyAssignments]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (!isProjectMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProjectMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProjectMenuOpen]);

  const totalTasks =
    assignments.overdue.length +
    assignments.dueToday.length +
    assignments.dueThisWeek.length +
    assignments.other.length;

  const sections = useMemo(
    () => [
      { key: 'overdue', items: assignments.overdue },
      { key: 'dueToday', items: assignments.dueToday },
      { key: 'dueThisWeek', items: assignments.dueThisWeek },
      { key: 'other', items: assignments.other },
    ],
    [assignments],
  );

  const scratchpadPreview = useMemo(() => {
    const preview = extractScratchpadText(scratchpad?.content);
    return preview || 'Capture open loops, rough plans, and ideas that should follow you across every task.';
  }, [scratchpad?.content]);

  const scratchpadExcerpt = useMemo(() => {
    const compactPreview = scratchpadPreview.replace(/\s+/g, ' ').trim();

    if (compactPreview.length <= 320) {
      return compactPreview;
    }

    return `${compactPreview.slice(0, 320).trimEnd()}…`;
  }, [scratchpadPreview]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
    await loadAssignments();
  };

  const projectCountLabel = selectedProjectIds.length === 1 ? 'project' : 'projects';
  const projectFilterLabel =
    selectedProjectIds.length === 0 ? 'All projects' : `${selectedProjectIds.length} ${projectCountLabel}`;
  const projectProgressById = useMemo(
    () => new Map(projects.map((project) => [project.id, project.stats?.progressPercent ?? 0])),
    [projects],
  );
  const skeletonCards = ['alpha', 'beta', 'gamma', 'delta'];

  let pageContent;

  if (isLoading && totalTasks === 0) {
    pageContent = (
      <div className="grid gap-3">
        {skeletonCards.map((card) => (
          <div
            key={card}
            className="h-20 rounded-[24px] border border-border/50 bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  } else if (totalTasks === 0) {
    pageContent = (
      <div className="rounded-[32px] border-2 border-dashed border-border/50 bg-card/40 px-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-muted/60 text-muted-foreground">
          <Inbox size={28} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-black text-foreground">Nothing assigned to you yet.</h2>
        <p className="mt-2 text-sm font-serif italic text-muted-foreground">
          Ask a teammate to assign you to a task, or browse the active project boards.
        </p>
        <div className="mt-6">
          <Link to={`/w/${activeWorkspaceId}/projects`}>
            <Button size="md">Go to projects</Button>
          </Link>
        </div>
      </div>
    );
  } else {
    pageContent = (
      <div className="space-y-4">
        {sections.map(({ key, items }) => {
          if (items.length === 0) {
            return null;
          }

          const meta = SECTION_META[key as keyof typeof SECTION_META];
          const isCollapsed = collapsed[key as keyof typeof SECTION_META];

          return (
            <section
              key={key}
              className="relative overflow-visible rounded-[28px] border border-border/50 bg-card/50 shadow-lg shadow-black/5"
            >
              <button
                type="button"
                onClick={() =>
                  setCollapsed((current) => ({
                    ...current,
                    [key]: !current[key as keyof typeof SECTION_META],
                  }))
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${meta.tone}`}>
                    {meta.title}
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{items.length} task{items.length === 1 ? '' : 's'}</div>
                    <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
                  </div>
                </div>

                <ChevronDown size={16} className={isCollapsed ? 'transition-transform' : 'rotate-180 transition-transform'} />
              </button>

              {!isCollapsed && (
                <div className="space-y-3 border-t border-border/50 bg-background/30 p-3 sm:p-4">
                  {items.map((task) => (
                    <MyWorkTaskRow
                      key={task.id}
                      task={task}
                      workspaceId={activeWorkspaceId}
                      projectProgressPercent={projectProgressById.get(task.projectId)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
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
                <Sparkles size={12} />
                Personal focus queue
              </div>
              <div>
                <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                  My work
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-serif italic text-muted-foreground sm:text-base">
                  {currentWorkspace?.name || 'Workspace'} · every task assigned to you, grouped by urgency.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Overdue</div>
                <div className="mt-2 text-2xl font-black text-red-700">{assignments.overdue.length}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Today</div>
                <div className="mt-2 text-2xl font-black text-amber-800">{assignments.dueToday.length}</div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total</div>
                <div className="mt-2 text-2xl font-black text-foreground">{totalTasks}</div>
              </div>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-[32px] border border-amber-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(255,244,214,0.92),_rgba(255,251,239,0.92)_45%,_rgba(255,247,226,0.9)_100%)] p-5 shadow-2xl shadow-amber-500/10 dark:border-amber-200/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,31,21,0.96),_rgba(21,24,33,0.96)_55%,_rgba(17,19,27,0.98)_100%)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-900 dark:border-amber-200/20 dark:bg-slate-900/70 dark:text-amber-100">
                <StickyNote size={12} />
                Personal scratchpad
              </div>
              <div>
                <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                  One place to think while you work
                </h2>
                <div className="mt-2 max-w-3xl">
                  <p className="line-clamp-5 text-sm font-serif italic leading-7 text-slate-700 dark:text-slate-300">
                    {scratchpadExcerpt}
                  </p>
                  <button
                    type="button"
                    onClick={() => setScratchpadOpen(true)}
                    className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700 transition-colors hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
                  >
                    Expand scratchpad
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-w-[240px] flex-col gap-3 rounded-[24px] border border-amber-300/60 bg-white/70 p-4 shadow-lg shadow-amber-500/5 dark:border-slate-700 dark:bg-slate-900/70">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                Private · auto-saved · always yours
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {scratchpad
                  ? `Updated ${formatDistanceToNow(new Date(scratchpad.updatedAt), { addSuffix: true })}`
                  : 'Opens instantly from any task canvas or from here.'}
              </p>
              <Button size="sm" onClick={() => setScratchpadOpen(true)} className="w-full justify-center">
                Expand scratchpad
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border/50 bg-card/50 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <ListFilter size={12} />
                Status
              </div>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCompleted((value) => !value)}
                className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                  showCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {showCompleted ? 'Completed shown' : 'Show completed'}
              </button>

              <div className="relative" ref={projectMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProjectMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground"
                >
                  <Briefcase size={12} />
                  {projectFilterLabel}
                  <ChevronDown size={12} className={isProjectMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>

                {isProjectMenuOpen && (
                  <div className="dropdown-surface absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-2xl p-2 shadow-2xl">
                    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                      {projects.map((project) => {
                        const checked = selectedProjectIds.includes(project.id);

                        return (
                          <label
                            key={project.id}
                            className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                          >
                            <span className="truncate pr-3">{project.name}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProject(project.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </label>
                        );
                      })}
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-border/60 px-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProjectIds([])}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsProjectMenuOpen(false)}
                        className="text-[10px] font-black uppercase tracking-[0.2em] text-primary"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {pageContent}

        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card/40 px-4 py-3 text-xs text-muted-foreground">
          <TriangleAlert size={14} className="text-amber-500" />
          Done tasks stay tucked into <span className="font-semibold text-foreground">Everything else</span> when completion is visible.
        </div>
      </div>

      <ScratchpadPanel
        isOpen={isScratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
      />
    </div>
  );
}
