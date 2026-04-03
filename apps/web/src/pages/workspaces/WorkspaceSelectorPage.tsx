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
    navigate(`/w/${workspace.id}/projects`); // Contextual route
  };

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Global Sidebar */}
      <aside className="bg-card border-r border-border flex flex-col w-64 flex-shrink-0 relative z-20 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center space-x-2 font-bold text-lg text-foreground tracking-tight">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              M
            </div>
            <span>Mesh</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Main Menu</div>
          <button
            className="w-full flex items-center px-3 py-2.5 rounded-lg transition-colors bg-primary/10 text-primary font-medium"
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Workspaces
          </button>

          <button
            onClick={() => navigate('/settings/profile')}
            className="w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-muted-foreground hover:bg-muted hover:text-foreground group"
          >
            <svg className="w-5 h-5 mr-3 flex-shrink-0 group-hover:text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile Settings
          </button>
        </nav>

        <div className="p-4 border-t border-border overflow-hidden">
          <div className="flex items-center cursor-pointer group" onClick={logout} title="Log out">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
              {(user?.firstName?.[0] || 'U').toUpperCase()}
            </div>
            <div className="ml-3 min-w-0 pr-2">
              <p className="text-sm font-medium text-foreground truncate block">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate hover:text-destructive transition-colors block">Log out</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background flex flex-col relative min-w-0">
        <div className="p-8 max-w-5xl mx-auto w-full space-y-8 pb-20">
          
          <header className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Select a Workspace</h1>
              <p className="text-muted-foreground mt-1">Choose an existing workspace or create a new one to get started.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>Create Workspace</Button>
          </header>

          {isLoading && workspaces.length === 0 ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
               <h3 className="text-lg font-medium text-foreground mb-2">No Workspaces Found</h3>
               <p className="text-muted-foreground mb-6">You don't belong to any workspaces yet. Create one to start collaborating.</p>
               <Button onClick={() => setIsModalOpen(true)} size="lg">Create your first Workspace</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* List Existing Workspaces */}
              {workspaces.map((ws: any) => (
                <Card 
                  key={ws.id} 
                  className="hover:border-primary/50 cursor-pointer transition-colors flex flex-col group shadow-md"
                  onClick={() => handleSelectWorkspace(ws)}
                >
                  <CardHeader>
                    <CardTitle className="group-hover:text-primary transition-colors">{ws.name}</CardTitle>
                    <CardDescription>Created on {new Date(ws.createdAt).toLocaleDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {ws.memberCount || 1} Member{(ws.memberCount || 1) !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="secondary" fullWidth className="group-hover:bg-primary group-hover:text-primary-foreground">
                      Enter Workspace
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Create Workspace"
            description="Build a new team environment"
          >
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}
              <Input 
                label="Workspace Name"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                placeholder="E.g., Engineering Team"
                autoFocus
                disabled={isCreating}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" loading={isCreating} disabled={!newWorkspaceName.trim()}>Create</Button>
              </div>
            </form>
          </Modal>

        </div>
      </main>
    </div>
  );
}
