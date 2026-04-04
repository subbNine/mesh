import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { TaskGrid } from '../../components/tasks/TaskGrid';
import { NewTaskModal } from '../../components/tasks/NewTaskModal';
import { NotificationBell } from '../../components/ui/NotificationBell';

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

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Tasks', status: '' },
    { id: 'todo', label: 'To Do', status: 'todo' },
    { id: 'inprogress', label: 'In Progress', status: 'inprogress' },
    { id: 'review', label: 'Review', status: 'review' },
    { id: 'done', label: 'Done', status: 'done' },
  ];

  useEffect(() => {
    if (projectId) {
      fetchMembers(projectId);
    }
  }, [projectId, fetchMembers]);

  useEffect(() => {
    if (currentProject) {
      setEditName(currentProject.name);
      setEditDesc(currentProject.description || '');
    }
  }, [currentProject]);

  const isProjAdmin = useMemo(() => {
    if (!user || !currentProject) return false;
    // Creator is always admin
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

  useEffect(() => {
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail);
      setFilterStatus(e.detail);
    };
    globalThis.addEventListener('task-tab-change', handleTabChange);
    return () => globalThis.removeEventListener('task-tab-change', handleTabChange);
  }, []);

  const taskFilters = useMemo(() => ({
    assigneeId: filterAssignee || undefined
  }), [filterAssignee]);

  if (!currentProject) return null;

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="px-6 md:px-8 py-5 border-b border-border bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 group">
            {isEditingDetails ? (
              <div className="flex flex-col gap-3 min-w-[300px] animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  autoFocus
                  className="text-2xl font-bold bg-muted/60 border-none focus:ring-2 focus:ring-primary/40 rounded-lg px-2 py-1 text-foreground placeholder:opacity-50 outline-none"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Project name"
                />
                <textarea
                  className="text-sm bg-muted/40 border-none focus:ring-2 focus:ring-primary/30 rounded-lg px-2 py-1 text-muted-foreground placeholder:opacity-40 outline-none resize-none min-h-[60px]"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Describe your project goals..."
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button size="sm" onClick={handleUpdateDetails} loading={isSaving} className="h-8 rounded-full px-4">Save</Button>
                  <Button size="sm" variant="secondary" onClick={() => {
                    setIsEditingDetails(false);
                    setEditName(currentProject.name);
                    setEditDesc(currentProject.description || '');
                  }} className="h-8 rounded-full px-4">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className={`flex flex-col text-left group/wrap ${isProjAdmin ? 'cursor-pointer hover:bg-muted/30 px-3 -mx-3 py-1 -my-1 rounded-2xl transition-all duration-300 relative border border-transparent hover:border-border/40' : ''}`}
                  onClick={() => isProjAdmin && setIsEditingDetails(true)}
                  disabled={!isProjAdmin}
                >
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">{currentProject.name}</h1>
                    {isProjAdmin && (
                      <div className="p-1 rounded-full bg-primary/10 text-primary opacity-0 group-hover/wrap:opacity-100 transition-all duration-300 scale-90 group-hover/wrap:scale-100">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1 italic font-medium opacity-80 group-hover/wrap:opacity-100 transition-opacity">
                    {currentProject.description || 'Add a project description...'}
                  </p>

                  {isProjAdmin && (
                    <div className="absolute -bottom-8 left-0 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover/wrap:opacity-100 transition-all pointer-events-none translate-y-1 group-hover/wrap:translate-y-0">
                      Click to edit details
                    </div>
                  )}
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground p-1.5 mt-0.5 rounded-full transition-all"
                  onClick={() => navigate(`/w/${workspaceId}/p/${projectId}/settings`)}
                  title="Project Settings"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="">All Assignees</option>
              <option value="me">Assigned to Me</option>
            </select>

            <select
              className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setActiveTab('all');
              }}
            >
              <option value="">Status Filter (All)</option>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            <Button onClick={() => setIsTaskModalOpen(true)} className="flex-shrink-0">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </Button>

            <div className="w-px h-6 bg-border" />
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-6 md:px-8 border-b border-border overflow-x-auto no-scrollbar">
        <div className="flex space-x-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterStatus(tab.status);
              }}
              className={`py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          <TaskGrid
            projectId={projectId!}
            activeTab={activeTab as any}
            filters={taskFilters}
          />
        </div>
      </main>

      {isTaskModalOpen && (
        <NewTaskModal
          projectId={projectId!}
          onClose={() => setIsTaskModalOpen(false)}
          onCreated={(task) => {
            console.log('Task created globally:', task);
          }}
        />
      )}
    </div>
  );
}
