import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  Layers,
  LogOut,
  Pin,
  Plus,
  StickyNote,
  User,
  Users,
} from 'lucide-react';
import type { INotification, ITask } from '@mesh/shared';

import { api } from '../../lib/api';
import { ScratchpadPanel } from '../../components/scratchpad/ScratchpadPanel';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { extractScratchpadText } from '../../lib/scratchpad-utils';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notifications.store';
import { useScratchpadStore } from '../../store/scratchpad.store';
import { useWorkspaceStore } from '../../store/workspace.store';

const PINNED_KEY = 'mesh_pinned_tasks';

type DashboardTask = ITask & {
  workspaceId?: string;
  projectName?: string;
};

function loadPinnedIds(): string[] {
  try {
    return JSON.parse(globalThis.localStorage.getItem(PINNED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'review':
      return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'inprogress':
      return 'border-primary/20 bg-primary/10 text-primary';
    default:
      return 'border-zinc-200 bg-zinc-100 text-zinc-700';
  }
}

function renderMentionSummary(notification: INotification) {
  const actorName = notification.actor
    ? `${notification.actor.firstName} ${notification.actor.lastName}`
    : 'Someone';
  const sourceType = typeof notification.data?.sourceType === 'string' ? notification.data.sourceType : 'comment';

  return sourceType === 'canvas_element'
    ? `${actorName} mentioned you in a canvas note`
    : `${actorName} mentioned you in a comment`;
}

function DashboardCard({
  title,
  meta,
  icon,
  className = '',
  children,
}: Readonly<{
  title: string;
  meta: string;
  icon: ReactNode;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl sm:p-5 ${className}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            {icon}
            {title}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate();
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const logout = useAuthStore((state: any) => state.logout);

  const notifications = useNotificationStore((state) => state.notifications);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const scratchpad = useScratchpadStore((state) => state.scratchpad);
  const isScratchpadOpen = useScratchpadStore((state) => state.isOpen);
  const setScratchpadOpen = useScratchpadStore((state) => state.setOpen);
  const fetchScratchpad = useScratchpadStore((state) => state.fetchScratchpad);

  const [pinnedTasks, setPinnedTasks] = useState<DashboardTask[]>([]);
  const [dueThisWeekTasks, setDueThisWeekTasks] = useState<DashboardTask[]>([]);
  const [projectIndex, setProjectIndex] = useState<Record<string, { workspaceId: string; name: string }>>({});
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces().catch(console.error);
    fetchNotifications().catch(console.error);
    void fetchScratchpad();
  }, [fetchNotifications, fetchScratchpad, fetchWorkspaces]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setError('');

    try {
      setIsCreating(true);
      const ws = await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsModalOpen(false);
      handleSelectWorkspace(ws);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace);
    navigate(`/w/${workspace.id}/projects`);
  };

  const handleOpenTask = async (task: { id: string; projectId?: string; workspaceId?: string }) => {
    let nextProjectId = task.projectId;
    let nextWorkspaceId = task.workspaceId ?? (nextProjectId ? projectIndex[nextProjectId]?.workspaceId : undefined);

    if (!nextProjectId) {
      try {
        const { data } = await api.get(`/tasks/${task.id}`);
        nextProjectId = data.projectId;
        nextWorkspaceId = projectIndex[data.projectId]?.workspaceId;
      } catch (error) {
        console.error('Failed to resolve task route', error);
        return;
      }
    }

    if (!nextProjectId || !nextWorkspaceId) {
      return;
    }

    navigate(`/w/${nextWorkspaceId}/p/${nextProjectId}/tasks/${task.id}/canvas`);
  };

  const handleMentionClick = async (notification: INotification) => {
    if (!notification.resourceId) {
      return;
    }

    if (!notification.readAt) {
      await markRead(notification.id);
    }

    await handleOpenTask({ id: notification.resourceId });
  };

  const totalMembers = useMemo(
    () => workspaces.reduce((sum: number, ws: any) => sum + (ws.memberCount || 1), 0),
    [workspaces],
  );

  const mentionNotifications = useMemo(
    () => notifications.filter((notification) => notification.type === 'mentioned').slice(0, 10),
    [notifications],
  );

  const scratchpadPreview = useMemo(() => {
    const preview = extractScratchpadText(scratchpad?.content);
    return preview || 'Capture rough notes, fleeting ideas, and open loops that should follow you across every task.';
  }, [scratchpad?.content]);

  useEffect(() => {
    if (workspaces.length === 0) {
      setPinnedTasks([]);
      setDueThisWeekTasks([]);
      setProjectIndex({});
      return;
    }

    let cancelled = false;

    const loadDashboardData = async () => {
      setIsDashboardLoading(true);

      try {
        const projectEntries = await Promise.all(
          workspaces.map(async (workspace: any) => {
            try {
              const { data } = await api.get(`/workspaces/${workspace.id}/projects`);
              return data.map((project: { id: string; name: string }) => [
                project.id,
                { workspaceId: workspace.id, name: project.name },
              ] as const);
            } catch (error) {
              console.error('Failed to fetch workspace projects', error);
              return [];
            }
          }),
        );

        const nextProjectIndex = Object.fromEntries(projectEntries.flat());
        const pinnedIds = loadPinnedIds();

        const pinnedResults: DashboardTask[] = [];
        for (const id of pinnedIds) {
          try {
            const { data } = await api.get(`/tasks/${id}`);
            const projectMeta = nextProjectIndex[data.projectId];
            pinnedResults.push({
              ...data,
              projectName: data.projectName ?? projectMeta?.name,
              workspaceId: projectMeta?.workspaceId,
            });
          } catch {
            // Ignore stale pins.
          }
        }

        const dueResults = (
          await Promise.all(
            workspaces.map(async (workspace: any) => {
              try {
                const { data } = await api.get('/users/me/assignments', {
                  params: { workspaceId: workspace.id },
                });

                const tasks = [...(data.dueToday ?? []), ...(data.dueThisWeek ?? [])] as DashboardTask[];
                return tasks.map((task) => ({
                  ...task,
                  workspaceId: workspace.id,
                  projectName: task.projectName ?? nextProjectIndex[task.projectId]?.name,
                }));
              } catch (error) {
                console.error('Failed to fetch due-this-week tasks', error);
                return [] as DashboardTask[];
              }
            }),
          )
        )
          .flat()
          .reduce<DashboardTask[]>((acc, task) => {
            if (acc.some((existing) => existing.id === task.id)) {
              return acc;
            }
            return [...acc, task];
          }, [])
          .sort((a, b) => {
            const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          })
          .slice(0, 10);

        if (!cancelled) {
          setProjectIndex(nextProjectIndex);
          setPinnedTasks(pinnedResults);
          setDueThisWeekTasks(dueResults);
        }
      } finally {
        if (!cancelled) {
          setIsDashboardLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [workspaces]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Layers size={18} />
            </div>
            <div>
              <div className="font-display text-xl font-black tracking-tight">Mesh</div>
              <div className="text-xs text-muted-foreground">Choose the workspace you want to jump into.</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="tertiary" size="sm" onClick={() => navigate('/settings/profile')} icon={<User size={14} />}>
              Profile
            </Button>
            <Button variant="tertiary" size="sm" onClick={logout} icon={<LogOut size={14} />}>
              Sign out
            </Button>
          </div>
        </nav>

        <header className="mb-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BriefcaseBusiness size={14} /> Team spaces
            </div>
            <h1 className="mt-4 text-balance font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Pick up where your team left off.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Workspaces keep projects, tasks, comments, docs, files, and activity organized in one place.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setIsModalOpen(true)} size="lg" icon={<Plus size={18} />}>
                New workspace
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          >
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Workspaces</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{workspaces.length}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Team seats</div>
              <div className="mt-2 flex items-center gap-2 text-3xl font-black tracking-tight text-foreground">
                {totalMembers}
                <Users size={18} className="text-primary" />
              </div>
            </div>
          </motion.div>
        </header>

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <DashboardCard
            title="Scratchpad"
            meta="Private, persistent, and instantly available from anywhere"
            icon={<StickyNote size={12} />}
            className="overflow-hidden border-amber-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(255,248,231,0.95),_rgba(255,252,244,0.96)_55%,_rgba(255,247,226,0.94)_100%)] dark:border-amber-200/10 dark:bg-[radial-gradient(circle_at_top_left,_rgba(38,31,21,0.96),_rgba(21,24,33,0.96)_60%,_rgba(17,19,27,0.98)_100%)]"
          >
            <div className="space-y-4">
              <p className="line-clamp-5 text-sm leading-7 text-slate-700 dark:text-slate-200">
                {scratchpadPreview}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-amber-300/50 bg-white/70 px-4 py-3 dark:border-amber-200/10 dark:bg-slate-900/70">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                    Personal thinking space
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {scratchpad
                      ? `Updated ${formatDistanceToNow(new Date(scratchpad.updatedAt), { addSuffix: true })}`
                      : 'Ready whenever you want to jot something down.'}
                  </div>
                </div>

                <Button size="sm" onClick={() => setScratchpadOpen(true)}>
                  Expand
                </Button>
              </div>
            </div>
          </DashboardCard>

          <div className="grid gap-4">
            <DashboardCard
              title="Pinned tasks"
              meta="Quick-return items you’ve pinned from the board"
              icon={<Pin size={12} />}
            >
              {isDashboardLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-2xl border border-border/50 bg-muted/40" />
                  ))}
                </div>
              ) : pinnedTasks.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
                  Pin a task from any board to keep it close at hand here.
                </div>
              ) : (
                <div className="space-y-2">
                  {pinnedTasks.slice(0, 5).map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => void handleOpenTask(task)}
                      className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-border/60 bg-background/60 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {task.projectName || 'Project'}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(task.status)}`}>
                        {task.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </DashboardCard>

            <DashboardCard
              title="Last 10 mentions"
              meta="Recent callouts that need your attention"
              icon={<AtSign size={12} />}
            >
              {mentionNotifications.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
                  No recent mentions yet — quiet is good.
                </div>
              ) : (
                <div className="space-y-2">
                  {mentionNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleMentionClick(notification)}
                      className={`flex w-full items-start gap-3 rounded-[20px] border px-3 py-3 text-left transition-all hover:border-primary/40 hover:bg-background/60 ${notification.readAt ? 'border-border/60 bg-background/40' : 'border-primary/20 bg-primary/[0.05]'}`}
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-primary">
                        <AtSign size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm text-foreground">{renderMentionSummary(notification)}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </DashboardCard>
          </div>
        </div>

        <DashboardCard
          title="Tasks due this week"
          meta="Your next deadlines across active workspaces"
          icon={<CalendarDays size={12} />}
          className="mb-6"
        >
          {isDashboardLoading ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl border border-border/50 bg-muted/40" />
              ))}
            </div>
          ) : dueThisWeekTasks.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-border/70 bg-background/40 px-4 py-5 text-sm text-muted-foreground">
              Nothing due this week — your runway is clear.
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {dueThisWeekTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => void handleOpenTask(task)}
                  className="rounded-[22px] border border-border/60 bg-background/50 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{task.projectName || 'Project'}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                    <CalendarDays size={11} />
                    {task.dueDate ? format(new Date(task.dueDate), 'EEE, MMM d') : 'No due date'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </DashboardCard>

        {isLoading && workspaces.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {['ws-a', 'ws-b', 'ws-c', 'ws-d', 'ws-e', 'ws-f'].map((key) => (
              <div key={key} className="h-48 animate-pulse rounded-3xl border border-border/60 bg-card/60" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-dashed border-border/80 bg-card/50 px-6 py-16 text-center shadow-sm"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BriefcaseBusiness size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">No workspaces yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Create your first workspace to start organizing projects and collaborating with your team.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)} size="lg" icon={<Plus size={18} />}>
                Create workspace
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((ws: any, idx: number) => (
              <motion.button
                key={ws.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => handleSelectWorkspace(ws)}
                className="group text-left"
              >
                <div className="h-full rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-black text-primary">
                      {ws.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {ws.memberCount || 1} {(ws.memberCount || 1) === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary">{ws.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Created {new Date(ws.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
                    <span className="text-muted-foreground">Open workspace</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      Continue <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <ScratchpadPanel
          isOpen={isScratchpadOpen}
          onClose={() => setScratchpadOpen(false)}
        />

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create workspace"
          description="Start a shared space for a team, product, or initiative."
        >
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
            <Input
              label="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. Product Team"
              autoFocus
              disabled={isCreating}
            />
            <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
              <Button type="button" variant="tertiary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isCreating} disabled={!newWorkspaceName.trim()}>
                Create workspace
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
