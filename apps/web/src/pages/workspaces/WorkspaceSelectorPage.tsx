import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

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

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col text-foreground font-sans selection:bg-primary/20">
      {/* Sleek Top Navigation Bar */}
      <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-display font-bold shadow-[inset_0_1px_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.1)]">
              M
            </div>
            <span className="font-display font-bold text-[19px] tracking-tight">Mesh</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/settings/profile')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </button>
            <div className="w-[1px] h-4 bg-zinc-200" />
            <button
              onClick={logout}
              className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 md:py-24 animate-fade-in">
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">Select Workspace</h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-xl">Choose a workspace to continue, or establish a brand new team environment.</p>
        </div>

        {isLoading && workspaces.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] border border-zinc-200/50 text-center animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20">
               <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
             </div>
             <h3 className="font-display text-2xl font-bold text-foreground mb-3">No Workspaces Found</h3>
             <p className="text-muted-foreground mb-10 max-w-md mx-auto text-[15px] leading-relaxed">You haven't been added to any workspaces yet. Build your first workspace to start collaborating natively.</p>
             <Button onClick={() => setIsModalOpen(true)} size="lg" className="w-full sm:w-auto h-12 px-8 text-[15px] shadow-[0_4px_10px_rgba(12,163,186,0.2)]">
               Create Workspace
             </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-end">
              <Button onClick={() => setIsModalOpen(true)} variant="secondary" className="shadow-sm bg-white hover:bg-zinc-50 border-zinc-200 h-10">
                <svg className="w-4 h-4 mr-2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Workspace
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((ws: any) => (
                <Card 
                  key={ws.id} 
                  className="group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 hover:border-zinc-300 transition-all duration-300"
                  onClick={() => handleSelectWorkspace(ws)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-100 to-white border border-zinc-200 text-primary flex items-center justify-center font-display font-bold text-xl shadow-sm">
                        {ws.name.substring(0, 1).toUpperCase()}
                      </div>
                    </div>
                    <CardTitle className="font-display font-bold text-xl group-hover:text-primary transition-colors">{ws.name}</CardTitle>
                    <CardDescription className="text-[11px] font-medium uppercase tracking-widest mt-2 opacity-80">
                      {new Date(ws.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center text-sm font-medium text-muted-foreground mt-2 bg-muted/50 rounded-lg py-2 px-3">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {ws.memberCount || 1} Member{(ws.memberCount || 1) !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Workspace"
          description="Build a new team environment"
        >
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium">{error}</div>}
            <Input 
              label="Workspace Name"
              value={newWorkspaceName}
              onChange={e => setNewWorkspaceName(e.target.value)}
              placeholder="e.g., Engineering Team"
              autoFocus
              disabled={isCreating}
            />
            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isCreating} disabled={!newWorkspaceName.trim()}>Create Workspace</Button>
            </div>
          </form>
        </Modal>

      </main>
    </div>
  );
}
