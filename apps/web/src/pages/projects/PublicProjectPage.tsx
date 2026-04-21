import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  BarChart3,
  Users,
  CheckCircle2,
  Eye,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';

import { api } from '../../lib/api';
import PublicTaskCanvasView from './PublicTaskCanvasView';

interface PublicProjectStats {
  total: number;
  done: number;
  inProgress: number;
  review: number;
  todo: number;
  progressPercent: number;
}

interface PublicMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

interface PublicTask {
  id: string;
  title: string;
  status: string;
  description: string | null;
  snapshotUrl: string | null;
  dueDate: string | null;
  assignees: { id: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  assignee: { id: string; firstName: string; lastName: string; avatarUrl: string | null } | null;
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

interface PublicProject {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdAt: string;
  stats: PublicProjectStats;
  members: PublicMember[];
  isMember: boolean;
  viewerWorkspaceId?: string;
  taskCount: number;
  memberCount: number;
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'done':
      return { label: 'Done', color: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400', borderColor: 'border-emerald-200 dark:border-emerald-800', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40' };
    case 'review':
      return { label: 'Review', color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400', borderColor: 'border-amber-200 dark:border-amber-800', bgColor: 'bg-amber-50 dark:bg-amber-950/40' };
    case 'inprogress':
      return { label: 'In Progress', color: 'bg-sky-500', textColor: 'text-sky-700 dark:text-sky-400', borderColor: 'border-sky-200 dark:border-sky-800', bgColor: 'bg-sky-50 dark:bg-sky-950/40' };
    default:
      return { label: 'To Do', color: 'bg-zinc-400 dark:bg-zinc-500', textColor: 'text-zinc-600 dark:text-zinc-400', borderColor: 'border-zinc-200 dark:border-zinc-700', bgColor: 'bg-zinc-50 dark:bg-zinc-900/60' };
  }
}

export default function PublicProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<PublicProject | null>(null);
  const [tasks, setTasks] = useState<PublicTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [projectRes, tasksRes] = await Promise.all([
          api.get(`/public/projects/${slug}`),
          api.get(`/public/projects/${slug}/tasks`, { params: { perPage: 200 } }),
        ]);
        setProject(projectRes.data);
        const tasksPayload = tasksRes.data;
        setTasks(Array.isArray(tasksPayload) ? tasksPayload : (tasksPayload.result ?? []));
      } catch (err: any) {
        setError(
          err.response?.status === 404
            ? 'This project link is no longer active or does not exist.'
            : 'Failed to load project. Please try again.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [slug]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading project overview…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-4">
          <Eye size={28} />
        </div>
        <h1 className="font-display text-2xl font-black tracking-tight text-foreground">Project unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md text-center">{error || 'This link may have expired or been revoked.'}</p>
      </div>
    );
  }

  const stats = project.stats;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background texture */}
      <div className="fixed inset-0 bg-dot-grid opacity-[0.06] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Floating member banner for authenticated project members */}
      <AnimatePresence>
        {project.isMember && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="sticky top-0 z-50 border-b border-primary/20 bg-primary/5 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between">
              <p className="text-xs font-semibold text-primary">
                You're a member of this project
              </p>
              <button
                type="button"
                onClick={() => navigate(`/w/${project.viewerWorkspaceId}/p/${project.id}`)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                Open in workspace <ArrowRight size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner border border-primary/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/70">Public Project</div>
              <div className="font-display text-sm font-bold text-muted-foreground">Mesh</div>
            </div>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground font-serif italic opacity-75">
              {project.description}
            </p>
          )}
        </motion.header>

        {/* Stats Dashboard */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-10"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Overall progress */}
            <div className="sm:col-span-2 lg:col-span-1 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-3">
                <BarChart3 size={12} className="text-primary" /> Overall
              </div>
              <div className="text-5xl font-black tracking-tighter text-foreground font-display">{stats.progressPercent}%</div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.progressPercent}%` }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {stats.done} of {stats.total} tasks completed
              </p>
            </div>

            {/* Status breakdown cards */}
            {[
              { key: 'todo', label: 'To Do', count: stats.todo, color: 'bg-zinc-400 dark:bg-zinc-500', accent: 'text-zinc-600 dark:text-zinc-400' },
              { key: 'inprogress', label: 'In Progress', count: stats.inProgress, color: 'bg-sky-500', accent: 'text-sky-600 dark:text-sky-400' },
              { key: 'review', label: 'Review', count: stats.review, color: 'bg-amber-500', accent: 'text-amber-600 dark:text-amber-400' },
              { key: 'done', label: 'Done', count: stats.done, color: 'bg-emerald-500', accent: 'text-emerald-600 dark:text-emerald-400' },
            ].map((s, idx) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.04 }}
                className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.color} shadow-[0_0_8px_rgba(0,0,0,0.15)]`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">{s.label}</span>
                </div>
                <div className={`text-3xl font-black tracking-tighter font-display ${s.accent}`}>{s.count}</div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {stats.total > 0 ? Math.round((s.count / stats.total) * 100) : 0}% of total
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Task Cards Grid */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <CheckCircle2 size={12} /> Tasks
            </div>
            <span className="text-xs text-muted-foreground">{tasks.length} total</span>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-card/50 py-16 text-center">
              <p className="text-sm text-muted-foreground font-serif italic">No tasks have been created for this project yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tasks.map((task, idx) => {
                const statusCfg = getStatusConfig(task.status);
                const taskAssignees = task.assignees?.length > 0 ? task.assignees : task.assignee ? [task.assignee] : [];

                return (
                  <motion.button
                    key={task.id}
                    type="button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 + idx * 0.015 }}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="group text-left rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    {/* Snapshot preview */}
                    {task.snapshotUrl && (
                      <div className="mb-3 aspect-[16/9] overflow-hidden rounded-xl border border-border/40 bg-muted/30">
                        <img
                          src={task.snapshotUrl}
                          alt=""
                          className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                      </h3>
                    </div>

                    <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${statusCfg.borderColor} ${statusCfg.bgColor} ${statusCfg.textColor}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.color}`} />
                      {statusCfg.label}
                    </div>

                    {/* Subtask progress */}
                    {(task.subtaskCount ?? 0) > 0 && (
                      <div className="mt-2 text-[10px] text-muted-foreground">
                        {task.completedSubtaskCount ?? 0}/{task.subtaskCount} subtasks
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      {/* Assignees */}
                      <div className="flex -space-x-1.5">
                        {taskAssignees.slice(0, 3).map((assignee) => (
                          <div
                            key={assignee.id}
                            className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[9px] font-bold text-primary"
                            title={`${assignee.firstName} ${assignee.lastName}`}
                          >
                            {assignee.avatarUrl ? (
                              <img src={assignee.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              assignee.firstName?.[0]?.toUpperCase()
                            )}
                          </div>
                        ))}
                        {taskAssignees.length > 3 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary text-[8px] font-bold text-primary-foreground">
                            +{taskAssignees.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Due date */}
                      {task.dueDate && (
                        <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <CalendarDays size={10} />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Team Section */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Users size={12} /> Team
            </div>
            <span className="text-xs text-muted-foreground">{project.members?.length || 0} members</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(project.members || []).map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + idx * 0.03 }}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-xl"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted text-sm font-bold text-primary">
                  {member.user?.avatarUrl ? (
                    <img src={member.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (member.user?.firstName?.[0] || '?').toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {member.user?.firstName} {member.user?.lastName}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {member.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-border/40 pt-8 pb-12 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground/40">
            <Layers size={14} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Powered by Mesh</span>
          </div>
        </footer>
      </div>

      {/* Read-only canvas overlay */}
      <AnimatePresence>
        {selectedTaskId && slug && (
          <PublicTaskCanvasView
            slug={slug}
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
