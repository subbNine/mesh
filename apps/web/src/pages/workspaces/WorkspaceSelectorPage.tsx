import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LayoutGrid, Plus, LogOut, User, Layers } from 'lucide-react';

export default function WorkspaceSelectorPage() {
  const navigate = useNavigate();
  const fetchWorkspaces = useWorkspaceStore(state => state.fetchWorkspaces);
  const createWorkspace = useWorkspaceStore(state => state.createWorkspace);
  const setCurrentWorkspace = useWorkspaceStore(state => state.setCurrentWorkspace);
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const isLoading = useWorkspaceStore(state => state.isLoading);
  
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

  const logout = useAuthStore((state: any) => state.logout);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col text-foreground font-sans selection:bg-primary/20 overflow-hidden relative transition-colors duration-500">
      {/* Architectural Background Grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Floating Glass Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-[100]">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass h-14 rounded-2xl flex items-center justify-between px-6 shadow-2xl backdrop-blur-3xl border-border/40 transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Layers size={18} />
             </div>
             <span className="font-display font-black text-lg tracking-tight uppercase text-foreground">Mesh</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => navigate('/settings/profile')}
              className="px-3"
              icon={<User size={16} />}
            >
              Profile
            </Button>
            <div className="w-px h-4 bg-border/40 mx-2" />
            <Button
              variant="tertiary"
              size="sm"
              onClick={logout}
              className="px-3 hover:text-destructive"
              icon={<LogOut size={16} />}
            >
              Sign out
            </Button>
          </div>
        </motion.div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="relative flex-1 w-full max-w-6xl mx-auto px-8 pt-40 pb-24">
        <header className="flex flex-col items-center text-center gap-6 mb-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">
                Entry Protocol Activated
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tight text-foreground leading-none">
                Select <span className="text-primary italic">Workspace</span>.
            </h1>
            <p className="mt-8 text-muted-foreground text-lg sm:text-xl max-w-[480px] font-serif italic opacity-70">
                Establish a technical environment to begin mapping initiatives.
            </p>
          </motion.div>
        </header>

        {isLoading && workspaces.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
            />
          </div>
        ) : workspaces.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-8 max-w-2xl mx-auto glass rounded-[40px] border-dashed border-2 border-border/40 text-center"
          >
             <div className="w-20 h-20 rounded-[32px] bg-muted/40 flex items-center justify-center mb-8 text-muted-foreground/30 ring-1 ring-border/50">
                <LayoutGrid size={40} />
             </div>
             <h3 className="font-display text-3xl font-black text-foreground mb-4">No Areas Found</h3>
             <p className="text-muted-foreground mb-12 max-w-[360px] mx-auto text-lg italic font-serif leading-relaxed opacity-60">
                The technical registry is empty. Initiate your first workspace blueprint.
             </p>
             <Button onClick={() => setIsModalOpen(true)} size="xl" variant="primary" className="rounded-2xl" icon={<Plus size={18} />}>
               Initialize Workspace
             </Button>
          </motion.div>
        ) : (
          <div className="space-y-12">
            <div className="flex justify-end">
              <Button 
                onClick={() => setIsModalOpen(true)} 
                variant="outline" 
                size="md"
                className="h-11 rounded-2xl border-dashed px-6"
                icon={<Plus size={18} />}
              >
                Blueprint Workspace
              </Button>
            </div>
            
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              <AnimatePresence>
                {workspaces.map((ws: any, idx: number) => (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSelectWorkspace(ws)}
                    className="group relative cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-primary/10 blur-[40px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                    
                    <div className="relative glass h-64 p-8 rounded-[40px] border-border/40 group-hover:border-primary/50 transition-all duration-500 overflow-hidden flex flex-col justify-between shadow-2xl">
                        {/* Internal Technical Grid */}
                        <div className="absolute inset-x-0 top-0 h-40 bg-dot-grid opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none" />
                        
                        <div className="flex justify-between items-start">
                          <div className="w-16 h-16 rounded-[22px] bg-muted/20 border border-border/40 text-primary flex items-center justify-center font-display font-black text-3xl shadow-inner group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                             {ws.name.substring(0, 1).toUpperCase()}
                          </div>
                          
                          <div className="py-1 px-3 rounded-lg bg-card border border-border/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 shadow-sm">
                             Active Registry
                          </div>
                        </div>

                        <div className="mt-4">
                          <h3 className="font-display font-black text-2xl text-foreground group-hover:text-primary transition-colors tracking-tight mb-2">
                             {ws.name}
                          </h3>
                          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                              <span className="flex items-center gap-2">
                                <User size={12} className="text-primary/40" />
                                {ws.memberCount || 1} MBR
                              </span>
                              <div className="w-1 h-1 rounded-full bg-border/40" />
                              <span>Est. {new Date(ws.createdAt).getFullYear()}</span>
                          </div>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Initialize Workspace"
          description="Build a new team environment blueprint"
        >
          <form onSubmit={handleCreate} className="space-y-6 pt-4">
            {error && <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-2xl border border-destructive/20 font-medium">{error}</div>}
            <Input 
              label="Blueprint Designation"
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              placeholder="e.g., Engineering Team Alpha"
              className="h-14 rounded-2xl text-lg bg-muted/20"
              autoFocus
              disabled={isCreating}
            />
            <div className="flex justify-end gap-3 pt-8 border-t border-border/40">
              <Button type="button" variant="tertiary" size="lg" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" loading={isCreating} disabled={!newWorkspaceName.trim()} className="px-10 h-14 rounded-2xl">
                Lock Registry
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
