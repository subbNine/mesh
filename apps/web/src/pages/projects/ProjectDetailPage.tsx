import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { TaskGrid } from '../../components/tasks/TaskGrid';
import { NewTaskModal } from '../../components/tasks/NewTaskModal';
import { NotificationBell } from '../../components/ui/NotificationBell';
import ProjectLibraryPage from './ProjectLibraryPage';
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
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');

  const tabs = [
    { id: 'all', label: 'All blueprinted', status: '' },
    { id: 'todo', label: 'To Do', status: 'todo' },
    { id: 'inprogress', label: 'In Progress', status: 'inprogress' },
    { id: 'review', label: 'Review', status: 'review' },
    { id: 'done', label: 'Done', status: 'done' },
    { id: 'library', label: 'Docs & Files', status: '' },
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

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'all');
  }, [searchParams]);

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
      <header className="px-3 py-3 sm:px-6 sm:py-4 border-b border-border/40 relative z-20 bg-background/60 backdrop-blur-3xl">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {isEditingDetails ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 max-w-2xl bg-muted/30 p-4 rounded-2xl border border-border/40"
              >
                <input
                  autoFocus
                  className="text-2xl font-display font-black bg-transparent border-none focus:ring-0 px-0 py-0 text-foreground placeholder:opacity-20 outline-none tracking-tight"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Blueprint Name"
                />
                <textarea
                  className="text-sm font-serif italic bg-transparent border-none focus:ring-0 px-0 py-0 text-muted-foreground placeholder:opacity-20 outline-none resize-none min-h-[60px]"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Project vision..."
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button size="sm" onClick={handleUpdateDetails} loading={isSaving}>Update Blueprint</Button>
                  <Button size="sm" variant="tertiary" onClick={() => {
                    setIsEditingDetails(false);
                    setEditName(currentProject.name);
                    setEditDesc(currentProject.description || '');
                  }}>Discard Changes</Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary">
                   <Layout size={10} fill="currentColor" /> Project Blueprint
                </div>
                <div className="flex items-start gap-2 group">
                <button
                    type="button"
                    onClick={() => isProjAdmin && setIsEditingDetails(true)}
                    className={`text-left text-xl sm:text-3xl md:text-4xl font-display font-black text-foreground tracking-[calc(-0.02em)] leading-tight ${isProjAdmin ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                >
                    {currentProject.name}
                </button>
                <Button
                    variant="tertiary"
                    size="sm"
                    className="p-1 opacity-0 group-hover:opacity-100 rounded-lg transition-all mt-0.5"
                    onClick={() => navigate(`/w/${workspaceId}/p/${projectId}/settings`)}
                    title="Blueprint Settings"
                >
                    <Settings size={14} />
                </Button>
            </div>
            <p className="max-w-2xl text-xs sm:text-base text-muted-foreground font-serif italic leading-relaxed opacity-80 decoration-primary/20 decoration-2 underline-offset-4 line-clamp-2 md:line-clamp-none">
                {currentProject.description || 'Define the architectural vision for this project...'}
            </p>
          </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 w-full md:w-auto justify-between md:justify-end">
             <div className="flex items-center bg-muted/50 rounded-lg p-0.5 md:p-1 border border-border/50 flex-1 md:flex-none">
               <Button
                    onClick={() => setIsTaskModalOpen(true)}
                    variant="primary"
                    size="sm"
                    className="h-8 md:h-9 shadow-lg shadow-primary/20 w-full md:w-auto text-[10px] md:text-xs"
                    icon={<Plus size={14} />}
               >
                 New Task
               </Button>
             </div>
             <div className="hidden md:block w-[1px] h-8 bg-border/40 mx-1" />
             <div className="scale-75 md:scale-100">
                <NotificationBell />
             </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="px-3 py-1.5 sm:px-6 sm:py-2.5 border-b border-border/40 bg-card/10 backdrop-blur-md relative z-10 sticky top-0 overflow-visible">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">

          {/* Status Tabs (Blueprint Style) */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 w-full md:w-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams(tab.id === 'all' ? {} : { tab: tab.id });
                }}
                className="relative py-1 group whitespace-nowrap"
              >
                <span className={`text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'}`}>
                    {tab.label}
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Precision Controls */}
          {activeTab === 'library' ? (
            <div className="w-full md:w-auto rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary text-center md:text-left">
              Shared docs, files, and folders for this project
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-between md:justify-end">
               <div className="relative group">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none">
                      <Users size={14} />
                  </div>
                  <select
                      className="pl-8 pr-8 py-1.5 border border-border/60 rounded-lg text-[9px] font-black uppercase tracking-widest bg-card/30 text-foreground focus:outline-none focus:ring-1.5 focus:ring-primary/40 appearance-none transition-all hover:bg-card/50"
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                  >
                      <option value="">All Engineers</option>
                      <option value="me">Assigned to Me</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <ChevronDown size={12} />
                  </div>
               </div>

               <div className="relative group">
                  <Button variant="outline" size="sm" className="h-8 px-3 border-dashed border-1.5 text-[9px]">
                     <Filter size={12} className="mr-1.5" /> Filter
                  </Button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Blueprint Gallery */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-5 relative z-0 no-scrollbar">
        <div className="max-w-[1600px] mx-auto h-full min-h-[400px]">
          {activeTab === 'library' ? (
            <ProjectLibraryPage />
          ) : (
            <TaskGrid
              projectId={projectId!}
              activeTab={activeTab as any}
              filters={taskFilters}
            />
          )}
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
