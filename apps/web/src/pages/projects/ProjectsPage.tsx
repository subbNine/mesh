import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, LayoutGrid, Plus, Users } from 'lucide-react';
import { useProjectStore } from '../../store/project.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';

const EMPTY_PROJECT_STATS = {
  total: 0,
  done: 0,
  inProgress: 0,
  review: 0,
  todo: 0,
  progressPercent: 0,
};

export default function ProjectsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const projects = useProjectStore((state) => state.projects);
  const isLoading = useProjectStore((state) => state.isLoading);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const createProject = useProjectStore((state) => state.createProject);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (workspaceId) {
      fetchProjects(workspaceId).catch(console.error);
    }
  }, [workspaceId, fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setError('');

    try {
      setIsCreating(true);
      const proj = await createProject(workspaceId!, newProjectName.trim(), newProjectDesc.trim() || undefined);
      setNewProjectName('');
      setNewProjectDesc('');
      setIsModalOpen(false);
      navigate(`/w/${workspaceId}/p/${proj.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create project');
    } finally {
      setIsCreating(false);
    }
  };

  const totalTasks = useMemo(
    () => projects.reduce((sum: number, project: any) => sum + (project.taskCount || 0), 0),
    [projects],
  );

  return (
    <div className="w-full min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <BriefcaseBusiness size={14} /> Workspace projects
            </div>
            <h1 className="mt-4 text-balance font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Projects that keep the work in motion.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Open a project to view its task canvas, discussions, files, docs, and everything your team needs in context.
            </p>

            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)} size="lg" icon={<Plus size={18} />}>
                New project
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
              <div className="text-sm font-medium text-muted-foreground">Projects</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{projects.length}</div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="text-sm font-medium text-muted-foreground">Tracked tasks</div>
              <div className="mt-2 flex items-center gap-2 text-3xl font-black tracking-tight text-foreground">
                {totalTasks}
                <LayoutGrid size={18} className="text-primary" />
              </div>
            </div>
          </motion.div>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {['project-a', 'project-b', 'project-c', 'project-d', 'project-e', 'project-f'].map((key) => (
              <div key={key} className="h-64 animate-pulse rounded-3xl border border-border/60 bg-card/60" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl border border-dashed border-border/80 bg-card/50 px-6 py-16 text-center shadow-sm"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BriefcaseBusiness size={28} />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-foreground">No projects yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Create your first project to start organizing tasks, comments, docs, and files around the canvas.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsModalOpen(true)} size="lg" icon={<Plus size={18} />}>
                Create project
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((proj: any, idx: number) => (
              <motion.button
                key={proj.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="group text-left"
                onClick={() => navigate(`/w/${workspaceId}/p/${proj.id}`)}
              >
                <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" style={{cursor: 'pointer'}}>
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-black text-primary">
                      {proj.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      {proj.taskCount || 0} {(proj.taskCount || 0) === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary">{proj.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {proj.description || 'Add a goal, scope, or quick summary so the team knows what this project is about.'}
                  </p>

                  <div className="mt-4 rounded-2xl border border-border/60 bg-background/70 p-3">
                    {(() => {
                      const stats = proj.stats ?? {
                        ...EMPTY_PROJECT_STATS,
                        total: proj.taskCount || 0,
                      };

                      if (stats.total === 0) {
                        return (
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progress</div>
                            <p className="mt-2 text-sm font-semibold text-foreground">No tasks yet</p>
                            <p className="mt-1 text-xs text-muted-foreground">Kick off the first task to start tracking momentum.</p>
                          </div>
                        );
                      }

                      return (
                        <div>
                          <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            <span>{stats.done} / {stats.total} tasks done</span>
                            <span className="text-foreground">{stats.progressPercent}%</span>
                          </div>
                          <ProgressBar value={stats.progressPercent} className="mt-2 h-2.5" />
                          <p className="mt-2 text-xs text-muted-foreground">
                            {stats.progressPercent >= 100
                              ? 'Everything in this project is wrapped.'
                              : stats.progressPercent > 0
                                ? `${stats.inProgress} in progress · ${stats.review} in review · ${stats.todo} to do`
                                : 'No work marked done yet.'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={15} className="text-primary" />
                    <span>{proj.memberCount || 0} {(proj.memberCount || 0) === 1 ? 'member' : 'members'}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4 text-sm">
                    <div className="flex -space-x-2">
                      {proj.previewMembers?.slice(0, 4).map((pm: any) => (
                        <div
                          key={pm.id}
                          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted text-[11px] font-bold text-primary"
                          title={`${pm.user?.firstName} ${pm.user?.lastName}`}
                        >
                          {pm.user?.avatarUrl ? (
                            <img src={pm.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (pm.user?.firstName?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                      ))}
                      {(proj.memberCount || 0) > 4 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-primary-foreground">
                          +{(proj.memberCount || 0) - 4}
                        </div>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      Open <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create project"
          description="Add a new project to this workspace."
        >
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
            <Input
              label="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Q3 web redesign"
              required
              autoFocus
              disabled={isCreating}
            />
            <div className="space-y-2">
              <label htmlFor="newProjectDescription" className="block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="newProjectDescription"
                className="min-h-[110px] w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="What is this project trying to achieve?"
                disabled={isCreating}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-border/70 pt-5">
              <Button type="button" variant="tertiary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isCreating} disabled={!newProjectName.trim()}>
                Create project
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
