import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectStore } from '../../store/project.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, LayoutGrid, Users, Briefcase, ArrowRight } from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full min-h-full flex flex-col pt-12 pb-24 px-8 lg:px-12 overflow-x-hidden font-sans bg-background relative transition-colors duration-500">
      {/* Architectural Underlay */}
      <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto space-y-16 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-black uppercase tracking-[.2em] text-primary">
                Registry / Projects
             </div>
             <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-foreground">
                Blueprint <span className="text-primary italic">Gallery</span>.
             </h1>
             <p className="text-muted-foreground mt-4 text-lg max-w-xl font-serif italic leading-relaxed opacity-70">
                Manage and organize all active initiatives mapped within this technical environment.
             </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            variant="primary" 
            size="lg" 
            className="h-14 rounded-2xl px-8 shadow-xl shadow-primary/20"
            icon={<Plus size={20} />}
          >
            New Project
          </Button>
        </header>

        {isLoading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-[40px] bg-muted/20 animate-pulse border border-border/40" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-8 text-center glass rounded-[48px] border-dashed border-2 border-border/40"
          >
             <div className="w-24 h-24 rounded-[36px] bg-muted/40 flex items-center justify-center mb-8 text-muted-foreground/20 ring-1 ring-border/50">
                <Briefcase size={44} />
             </div>
             <h3 className="font-display text-3xl font-black text-foreground mb-4">Void Entry</h3>
             <p className="text-muted-foreground mb-12 max-w-md italic font-serif text-lg leading-relaxed opacity-60">
                Launch your first dedicated project canvas to start plotting tasks and workflows.
             </p>
             <Button onClick={() => setIsModalOpen(true)} size="xl" className="rounded-2xl h-14 px-10">Initialize Project</Button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {projects.map((proj: any) => (
              <motion.div 
                key={proj.id} 
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group relative cursor-pointer"
                onClick={() => navigate(`/w/${workspaceId}/p/${proj.id}`)}
              >
                {/* Visual Glow */}
                <div className="absolute inset-0 bg-primary/10 blur-[40px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-full" />
                
                <div className="relative glass h-[340px] flex flex-col rounded-[44px] border-border/40 group-hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-2xl shadow-black/5 dark:shadow-black/20">
                    {/* Architectural Header (Thumbnail style) */}
                    <div className="h-32 bg-muted/30 border-b border-border/40 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-dot-grid opacity-[0.04] pointer-events-none" />
                        <div className="w-16 h-16 rounded-[22px] bg-card border border-border/40 text-primary flex items-center justify-center font-display font-black text-3xl group-hover:scale-110 transition-transform duration-700 shadow-inner">
                            {proj.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="absolute top-4 right-6 px-3 py-1 rounded-full bg-muted border border-border/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 shadow-sm">
                            Blueprint
                        </div>
                    </div>

                    <div className="p-8 flex flex-col flex-1 justify-between bg-card/10">
                        <div className="space-y-3">
                            <h3 className="font-display group-hover:text-primary transition-colors text-2xl font-black tracking-tight leading-none text-foreground">
                                {proj.name}
                            </h3>
                            <p className="text-muted-foreground text-[13px] font-serif italic leading-relaxed opacity-60 line-clamp-2">
                                {proj.description || 'Drafting technical workflows...'}
                            </p>
                        </div>

                        <div className="flex justify-between items-end pt-6 border-t border-border/40">
                             <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-1">
                                    <Users size={12} className="text-primary/60" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Assembly</p>
                                </div>
                                <div className="flex -space-x-3 mt-2 pr-4">
                                    {proj.previewMembers?.slice(0, 4).map((pm: any) => (
                                      <div key={pm.id} className="w-9 h-9 rounded-xl ring-4 ring-background bg-muted border border-border/40 flex items-center justify-center text-[11px] font-black text-primary overflow-hidden shadow-xl" title={`${pm.user?.firstName} ${pm.user?.lastName}`}>
                                         {pm.user?.avatarUrl ? <img src={pm.user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (pm.user?.firstName?.[0] || 'U').toUpperCase()}
                                      </div>
                                    ))}
                                    {(proj.memberCount || 0) > 4 && (
                                      <div className="w-9 h-9 rounded-xl ring-4 ring-background bg-primary text-white border border-primary/20 flex items-center justify-center text-[10px] font-black shadow-xl z-10">
                                        +{(proj.memberCount || 0) - 4}
                                      </div>
                                    )}
                                </div>
                             </div>

                             <div className="text-right pl-4">
                                <div className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest mb-2 flex items-center justify-end gap-1.5">
                                    <LayoutGrid size={11} /> TASKS
                                </div>
                                <div className="text-xl font-black text-primary px-4 py-1 rounded-[14px] bg-primary/10 border border-primary/20 inline-flex items-center justify-center min-w-[50px] shadow-lg">
                                    {proj.taskCount || 0}
                                </div>
                             </div>
                        </div>
                    </div>
                    
                    {/* View Project Hover Button */}
                    <div className="absolute inset-x-0 bottom-0 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        Enter Workspace <ArrowRight size={14} />
                    </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Project"
          description="Establish isolated tasks mapping against specialized features."
        >
          <form onSubmit={handleCreate} className="space-y-6 pt-4">
            {error && <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-2xl border border-destructive/20 font-medium">{error}</div>}
            <Input 
              label="Blueprint Host Designation"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="e.g., Q3 Web Redesign"
              required
              autoFocus
              className="h-14 rounded-2xl text-lg bg-muted/20"
              disabled={isCreating}
            />
            <div className="space-y-2">
              <label className="block text-xs font-black text-muted-foreground/60 uppercase tracking-widest pl-1">Strategic Description</label>
              <textarea
                className="w-full px-5 py-4 border border-border/40 rounded-2xl text-[15px] bg-muted/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 min-h-[120px] resize-none font-serif italic text-muted-foreground/80 placeholder:text-muted-foreground/30"
                value={newProjectDesc}
                onChange={e => setNewProjectDesc(e.target.value)}
                placeholder="What is the goal of this initiative?"
                disabled={isCreating}
              />
            </div>
            <div className="flex justify-end gap-3 pt-8 border-t border-border/40">
              <Button type="button" variant="tertiary" size="lg" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" loading={isCreating} disabled={!newProjectName.trim()} className="px-10 h-14 rounded-2xl">
                Launch Project
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
