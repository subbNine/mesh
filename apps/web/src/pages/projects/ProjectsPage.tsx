import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';


export default function ProjectsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const projects = useProjectStore(state => state.projects);
  const isLoading = useProjectStore(state => state.isLoading);
  const fetchProjects = useProjectStore(state => state.fetchProjects);
  const createProject = useProjectStore(state => state.createProject);

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

  const truncate = (str: string, len: number) => {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  return (
    <div className="w-full min-h-full flex flex-col pt-8 pb-20 px-8 lg:px-12 overflow-x-hidden font-sans bg-background">
      <div className="max-w-6xl w-full mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-2 text-base max-w-xl">Manage and organize all active initiatives mapped within this specific workspace.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="shadow-sm">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-zinc-200/50 animate-in zoom-in-95 duration-500">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 text-primary shadow-inner ring-1 ring-primary/20">
               <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
             </div>
             <h3 className="font-display text-xl font-bold text-foreground mb-2 tracking-tight">No Projects Yet</h3>
             <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">Launch your first dedicated project canvas to start plotting tasks and workflows.</p>
             <Button onClick={() => setIsModalOpen(true)} size="lg" className="shadow-sm">Initialize Project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj: any) => (
              <Card 
                key={proj.id} 
                className="group cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 hover:border-zinc-300 transition-all duration-300 flex flex-col bg-white"
                onClick={() => navigate(`/w/${workspaceId}/p/${proj.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-100 to-white border border-zinc-200 text-primary flex items-center justify-center font-display font-bold text-lg shadow-sm">
                      {proj.name.substring(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <CardTitle className="font-display group-hover:text-primary transition-colors text-[20px] font-bold leading-tight">{proj.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 h-10 text-[13px] leading-relaxed">
                    {truncate(proj.description || 'No contextual description provided.', 100)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end pt-2">
                  <div className="flex justify-between items-end border-t border-zinc-100 pt-5 mt-2">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">Members</p>
                      <div className="flex -space-x-2 min-h-[32px] pl-1">
                        {proj.previewMembers?.slice(0, 5).map((pm: any) => (
                          <div key={pm.id} className="inline-block rounded-full ring-2 ring-white relative z-0 hover:z-20 transition-all cursor-pointer shadow-sm hover:scale-110" title={`${pm.user?.firstName} ${pm.user?.lastName}`}>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-[11px] font-bold text-white shadow-inner">
                              {(pm.user?.firstName?.[0] || 'U').toUpperCase()}
                            </div>
                          </div>
                        ))}
                        {(proj.memberCount || 0) > 5 && (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-medium text-zinc-600 ring-2 ring-white z-10 shadow-sm">
                            +{(proj.memberCount || 0) - 5}
                          </div>
                        )}
                        {(!proj.previewMembers || proj.previewMembers.length === 0) && (
                          <p className="text-[13px] font-medium text-muted-foreground pl-1">{proj.memberCount || 0} Member{proj.memberCount !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-2 pr-1">Tasks</p>
                      <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg inline-flex items-center justify-center min-w-[32px] shadow-[inset_0_1px_rgba(255,255,255,0.5)]">
                        {proj.taskCount || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Project"
          description="Establish isolated tasks mapping against specialized features."
        >
          <form onSubmit={handleCreate} className="space-y-5 pt-2">
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium">{error}</div>}
            <Input 
              label="Project Name"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="e.g., Q3 Web Redesign"
              required
              autoFocus
              disabled={isCreating}
            />
            <div className="space-y-1.5 pt-1">
              <label className="block text-[13px] font-semibold text-foreground/80 tracking-tight">Description</label>
              <textarea
                className="w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-[15px] bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 min-h-[100px] resize-y placeholder:text-muted-foreground/70"
                value={newProjectDesc}
                onChange={e => setNewProjectDesc(e.target.value)}
                placeholder="What is the goal of this initiative?"
                disabled={isCreating}
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isCreating} disabled={!newProjectName.trim()}>Launch Project</Button>
            </div>
          </form>
        </Modal>

      </div>
    </div>
  );
}
