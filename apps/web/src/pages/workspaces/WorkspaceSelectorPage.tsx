import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BriefcaseBusiness, Layers, LogOut, Plus, User, Users } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate();
  const fetchWorkspaces = useWorkspaceStore((state) => state.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((state) => state.setCurrentWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isLoading = useWorkspaceStore((state) => state.isLoading);
  const logout = useAuthStore((state: any) => state.logout);

  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces().catch(console.error);
  }, [fetchWorkspaces]);

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

  const totalMembers = useMemo(
    () => workspaces.reduce((sum: number, ws: any) => sum + (ws.memberCount || 1), 0),
    [workspaces],
  );

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
