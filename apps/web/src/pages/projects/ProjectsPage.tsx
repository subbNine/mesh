import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';

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
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 w-full">
      <header className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage all initiatives aligned within this workspace.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>New Project</Button>
      </header>

      {isLoading && projects.length === 0 ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
           <h3 className="text-lg font-medium text-foreground mb-2">No Projects Initially Mapped</h3>
           <p className="text-muted-foreground mb-6">Create the first project generating isolated tasks exclusively.</p>
           <Button onClick={() => setIsModalOpen(true)} size="lg">Create Project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj: any) => (
            <Card 
              key={proj.id} 
              className="hover:border-primary/50 cursor-pointer transition-colors flex flex-col group shadow-md"
              onClick={() => navigate(`/w/${workspaceId}/p/${proj.id}`)}
            >
              <CardHeader>
                <CardTitle className="group-hover:text-primary transition-colors text-xl">{proj.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2 h-10">
                  {truncate(proj.description || 'No description provided.', 100)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex justify-between items-end border-t border-border pt-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Members</p>
                    <div className="flex -space-x-2 pt-1 min-h-[32px]">
                      {proj.previewMembers?.slice(0, 5).map((pm: any) => (
                        <div key={pm.id} className="inline-block rounded-full ring-2 ring-card bg-card relative z-0 hover:z-20 transition-all cursor-pointer" title={`${pm.user?.firstName} ${pm.user?.lastName}`}>
                          <Avatar size="sm" name={`${pm.user?.firstName || 'U'} ${pm.user?.lastName || ''}`} />
                        </div>
                      ))}
                      {(proj.memberCount || 0) > 5 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-2 ring-card z-10">
                          +{(proj.memberCount || 0) - 5}
                        </div>
                      )}
                      {(!proj.previewMembers || proj.previewMembers.length === 0) && (
                        <p className="text-sm text-muted-foreground pl-2 pt-1">{proj.memberCount || 0} Member{proj.memberCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Tasks</p>
                    <div className="text-sm font-medium text-foreground bg-primary/10 text-primary px-3 py-1 rounded-full inline-block">
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
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">{error}</div>}
          <Input 
            label="Project Name"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="E.g., Web Redesign"
            required
            autoFocus
            disabled={isCreating}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg text-base bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] resize-y"
              value={newProjectDesc}
              onChange={e => setNewProjectDesc(e.target.value)}
              placeholder="Brief summary..."
              disabled={isCreating}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isCreating} disabled={!newProjectName.trim()}>Create</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
