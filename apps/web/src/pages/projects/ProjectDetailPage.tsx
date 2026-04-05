import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { TaskGrid } from '../../components/tasks/TaskGrid';
import { NewTaskModal } from '../../components/tasks/NewTaskModal';
import { NotificationBell } from '../../components/ui/NotificationBell';
import { 
  Plus, 
  Settings, 
  Filter, 
  Users, 
  Layout, 
  ChevronDown 
} from 'lucide-react';

export default function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  
  const currentProject = useProjectStore(state => state.currentProject);
  const updateProject = useProjectStore(state => state.updateProject);
  const fetchMembers = useProjectStore(state => state.fetchMembers);
  const members = useProjectStore(state => state.members);
  const user = useAuthStore((state: any) => state.user);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All blueprinted', status: '' },
    { id: 'todo', label: 'To Do', status: 'todo' },
    { id: 'inprogress', label: 'In Progress', status: 'inprogress' },
    { id: 'review', label: 'Review', status: 'review' },
    { id: 'done', label: 'Done', status: 'done' },
  ];

  useEffect(() => {
    if (projectId) fetchMembers(projectId);
  }, [projectId, fetchMembers]);

  useEffect(() => {
    if (currentProject) {
      setEditName(currentProject.name);
      setEditDesc(currentProject.description || '');
    }
  }, [currentProject]);

  const isProjAdmin = useMemo(() => {
    if (!user || !currentProject) return false;
    if (currentProject.createdBy === user.id) return true;
    const member = members.find(m => m.userId === user.id);
    return member?.role === 'admin' || member?.role === 'owner';
  }, [members, user, currentProject]);

  const handleUpdateDetails = async () => {
    if (!editName.trim() || (editName === currentProject?.name && editDesc === (currentProject?.description || ''))) {
      setIsEditingDetails(false);
      return;
    }
    try {
      setIsSaving(true);
      await updateProject(projectId!, { name: editName.trim(), description: editDesc.trim() || undefined });
      setIsEditingDetails(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const taskFilters = useMemo(() => ({
    assigneeId: filterAssignee || undefined
  }), [filterAssignee]);

  if (!currentProject) return null;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

      {/* Top Header */}
      <header className="px-8 py-8 border-b border-border/40 relative z-20 bg-background/60 backdrop-blur-3xl">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {isEditingDetails ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 max-w-2xl bg-muted/30 p-6 rounded-[32px] border border-border/40"
              >
                <input
                  autoFocus
                  className="text-4xl font-display font-black bg-transparent border-none focus:ring-0 px-0 py-0 text-foreground placeholder:opacity-20 outline-none tracking-tight"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Blueprint Name"
                />
                <textarea
                  className="text-lg font-serif italic bg-transparent border-none focus:ring-0 px-0 py-0 text-muted-foreground placeholder:opacity-20 outline-none resize-none min-h-[80px]"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Project vision..."
                />
                <div className="flex items-center gap-3 mt-2">
                  <Button size="md" onClick={handleUpdateDetails} loading={isSaving}>Update Blueprint</Button>
                  <Button size="md" variant="tertiary" onClick={() => {
                    setIsEditingDetails(false);
                    setEditName(currentProject.name);
                    setEditDesc(currentProject.description || '');
                  }}>Discard Changes</Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                   <Layout size={12} fill="currentColor" /> Project Blueprint
                </div>
                <div className="flex items-start gap-4 group">
                    <h1 
                        onClick={() => isProjAdmin && setIsEditingDetails(true)}
                        className={`text-5xl md:text-6xl font-display font-black text-foreground tracking-[calc(-0.04em)] leading-none ${isProjAdmin ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                    >
                        {currentProject.name}
                    </h1>
                    <Button
                        variant="tertiary"
                        size="sm"
                        className="p-2 opacity-0 group-hover:opacity-100 rounded-full transition-all mt-2"
                        onClick={() => navigate(`/w/${workspaceId}/p/${projectId}/settings`)}
                        title="Blueprint Settings"
                    >
                        <Settings size={20} />
                    </Button>
                </div>
                <p className="max-w-2xl text-xl text-muted-foreground font-serif italic leading-relaxed opacity-80 decoration-primary/20 decoration-2 underline-offset-8">
                    {currentProject.description || 'Define the architectural vision for this project...'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
             <div className="flex items-center bg-muted/50 rounded-2xl p-1 border border-border/50">
               <Button 
                    onClick={() => setIsTaskModalOpen(true)} 
                    variant="primary" 
                    size="lg" 
                    className="h-11 shadow-2xl shadow-primary/20"
                    icon={<Plus size={18} />}
               >
                 New Task
               </Button>
             </div>
             <div className="w-[1px] h-10 bg-border/40 mx-2" />
             <NotificationBell />
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="px-8 py-4 border-b border-border/40 bg-card/10 backdrop-blur-md relative z-10 sticky top-0 overflow-visible">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Status Tabs (Blueprint Style) */}
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className="relative py-2 group whitespace-nowrap"
              >
                <span className={`text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'}`}>
                    {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabBadge"
                    className="absolute -bottom-4 left-0 right-0 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Precision Controls */}
          <div className="flex items-center gap-3">
             <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                    <Users size={16} />
                </div>
                <select
                    className="pl-10 pr-10 py-2 border border-border/60 rounded-xl text-[10px] font-black uppercase tracking-widest bg-card/30 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none transition-all hover:bg-card/50"
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                >
                    <option value="">All Engineers</option>
                    <option value="me">Assigned to Me</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <ChevronDown size={14} />
                </div>
             </div>

             <div className="relative group">
                <Button variant="outline" size="md" className="h-9 px-4 border-dashed border-2">
                   <Filter size={14} className="mr-2" /> Precision Filter
                </Button>
             </div>
          </div>
        </div>
      </div>

      {/* Main Blueprint Gallery */}
      <main className="flex-1 overflow-y-auto p-8 relative z-0 no-scrollbar">
        <div className="max-w-[1600px] mx-auto h-full min-h-[500px]">
          <TaskGrid
            projectId={projectId!}
            activeTab={activeTab as any}
            filters={taskFilters}
          />
        </div>
      </main>

      <AnimatePresence>
        {isTaskModalOpen && (
          <NewTaskModal
            projectId={projectId!}
            onClose={() => setIsTaskModalOpen(false)}
            onCreated={(task) => {
              console.log('Task blueprint created:', task);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
