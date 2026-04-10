import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { DateField } from '../../components/ui/DateField';
import { ProgressBar } from '../../components/ui/ProgressBar';
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
  CheckCircle2,
  Clock3,
  CircleDot
} from 'lucide-react';

const EMPTY_PROJECT_STATS = {
  total: 0,
  done: 0,
  inProgress: 0,
  review: 0,
  todo: 0,
  progressPercent: 0,
};

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

  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');
  const [filterDependsOn, setFilterDependsOn] = useState(false);
  const [filterBlocks, setFilterBlocks] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isFilterMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFilterMenuOpen]);

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

  const todayDateValue = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const toggleAssigneeFilter = (assigneeId: string) => {
    setSelectedAssigneeIds((current) =>
      current.includes(assigneeId)
        ? current.filter((id) => id !== assigneeId)
        : [...current, assigneeId],
    );
  };

  const filteredMembers = useMemo(() => {
    const query = assigneeSearch.trim().toLowerCase();

    return [...members]
      .sort((a, b) => {
        if (a.userId === user?.id) return -1;
        if (b.userId === user?.id) return 1;
        return `${a.user.firstName} ${a.user.lastName}`.localeCompare(`${b.user.firstName} ${b.user.lastName}`);
      })
      .filter((member) => {
        if (!query) return true;
        const haystack = `${member.user.firstName} ${member.user.lastName} ${member.user.email}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [assigneeSearch, members, user?.id]);

  const selectedAssigneeLabel = useMemo(() => {
    if (selectedAssigneeIds.length === 0) return 'All assignees';

    const labels = selectedAssigneeIds.map((assigneeId) => {
      if (assigneeId === 'unassigned') return 'Unassigned';
      const member = members.find((entry) => entry.userId === assigneeId);
      if (!member) return 'Unknown';
      return assigneeId === user?.id ? 'You' : `${member.user.firstName} ${member.user.lastName}`;
    });

    return labels.length <= 2 ? labels.join(', ') : `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  }, [members, selectedAssigneeIds, user?.id]);

  const activeFilterCount = useMemo(
    () => [selectedAssigneeIds.length > 0, Boolean(filterDueDate), filterDependsOn, filterBlocks].filter(Boolean).length,
    [selectedAssigneeIds.length, filterDueDate, filterDependsOn, filterBlocks],
  );

  const taskFilters = useMemo(() => ({
    assigneeId: selectedAssigneeIds.length > 0 ? selectedAssigneeIds.join(',') : undefined,
    dueDate: filterDueDate || undefined,
    dependsOn: filterDependsOn || undefined,
    blocks: filterBlocks || undefined,
  }), [selectedAssigneeIds, filterDueDate, filterDependsOn, filterBlocks]);

  const clearTaskFilters = () => {
    setSelectedAssigneeIds([]);
    setAssigneeSearch('');
    setFilterDueDate('');
    setFilterDependsOn(false);
    setFilterBlocks(false);
  };

  if (!currentProject) return null;

  const projectStats = currentProject.stats ?? {
    ...EMPTY_PROJECT_STATS,
    total: currentProject.taskCount ?? 0,
  };
  const hasProjectProgress = projectStats.total > 0;

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

      {/* Compact Top Header */}
      <header className="px-3 py-2 sm:px-6 sm:py-3 border-b border-border/40 relative z-20 bg-background/60 backdrop-blur-3xl">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
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
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary">
                  <Layout size={10} fill="currentColor" /> Project Blueprint
                </div>
                <div className="flex items-center gap-3 group">
                  <button
                    type="button"
                    onClick={() => isProjAdmin && setIsEditingDetails(true)}
                    className={`text-left text-xl sm:text-2xl font-display font-black text-foreground tracking-tight leading-none ${isProjAdmin ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                  >
                    {currentProject.name}
                  </button>
                  {hasProjectProgress && (
                    <div className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20">
                      {projectStats.progressPercent}% DONE
                    </div>
                  )}
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="p-1 opacity-0 group-hover:opacity-100 rounded-lg transition-all"
                    onClick={() => navigate(`/w/${workspaceId}/p/${projectId}/settings`)}
                    title="Blueprint Settings"
                  >
                    <Settings size={14} />
                  </Button>
                </div>

                {/* Compact Horizontal Stats Dashboard */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <p className="text-[11px] text-muted-foreground font-serif italic max-w-sm truncate opacity-70">
                    {currentProject.description || 'Define the architectural vision for this project...'}
                  </p>

                  {hasProjectProgress && (
                    <div className="flex items-center gap-4 border-l border-border/40 pl-6 h-4">
                      <div className="flex items-center gap-1.5 text-[10px] whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="font-black uppercase tracking-widest text-foreground">{projectStats.done}</span>
                        <span className="font-medium text-muted-foreground/60">Done</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]" />
                        <span className="font-black uppercase tracking-widest text-foreground">{projectStats.inProgress}</span>
                        <span className="font-medium text-muted-foreground/60">Active</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                        <span className="font-black uppercase tracking-widest text-foreground">{projectStats.review}</span>
                        <span className="font-medium text-muted-foreground/60">Review</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] whitespace-nowrap">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span className="font-black uppercase tracking-widest text-foreground">{projectStats.todo}</span>
                        <span className="font-medium text-muted-foreground/60">Queued</span>
                      </div>
                    </div>
                  )}
                </div>

                {hasProjectProgress && (
                  <div className="max-w-md mt-1">
                    <ProgressBar
                      value={projectStats.progressPercent}
                      segmented
                      segments={{
                        done: projectStats.done,
                        inProgress: projectStats.inProgress,
                        review: projectStats.review,
                        todo: projectStats.todo,
                      }}
                      className="h-1"
                    />
                  </div>
                )}
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
            <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
               {selectedAssigneeIds.length > 0 && (
                  <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    {selectedAssigneeLabel}
                  </div>
               )}

               <div className="relative" ref={filterMenuRef}>
                  <Button
                    type="button"
                    onClick={() => setIsFilterMenuOpen((open) => !open)}
                    variant="outline"
                    size="sm"
                    icon={<Filter size={12} />}
                    className={`h-8 px-3 border-dashed text-[10px] whitespace-nowrap ${activeFilterCount ? 'border-primary/40 bg-primary/5 text-primary' : ''}`}
                  >
                    {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
                  </Button>

                  {isFilterMenuOpen && (
                    <div className="dropdown-surface absolute right-0 top-[calc(100%+10px)] z-30 w-[min(24rem,calc(100vw-24px))] rounded-2xl p-4 shadow-2xl">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Assignees</p>
                          <div className="mt-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users size={13} />
                              <input
                                value={assigneeSearch}
                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                placeholder="Search teammates"
                                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
                              />
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => toggleAssigneeFilter('unassigned')}
                              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${selectedAssigneeIds.includes('unassigned') ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                              Unassigned
                            </button>
                          </div>

                          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                            {filteredMembers.map((member) => {
                              const isSelected = selectedAssigneeIds.includes(member.userId);
                              const displayName = member.userId === user?.id ? 'You' : `${member.user.firstName} ${member.user.lastName}`;

                              return (
                                <button
                                  key={member.userId}
                                  type="button"
                                  onClick={() => toggleAssigneeFilter(member.userId)}
                                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/70 text-foreground'}`}
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold">{displayName}</p>
                                    <p className="truncate text-[10px] text-muted-foreground">{member.user.email}</p>
                                  </div>
                                  <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {isSelected ? 'Selected' : 'Select'}
                                  </span>
                                </button>
                              );
                            })}

                            {filteredMembers.length === 0 && (
                              <div className="rounded-xl border border-dashed border-border/60 px-3 py-3 text-xs text-muted-foreground">
                                No teammates match that search.
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Due date</p>
                          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <DateField
                              value={filterDueDate}
                              onChange={setFilterDueDate}
                              ariaLabel="Filter by due date"
                              className="w-full"
                              inputClassName="text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setFilterDueDate((value) => value === todayDateValue ? '' : todayDateValue)}
                              className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${filterDueDate === todayDateValue ? 'bg-primary text-primary-foreground' : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                              Due today
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dependency state</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setFilterDependsOn((value) => !value)}
                              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${filterDependsOn ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                              Depends on
                            </button>
                            <button
                              type="button"
                              onClick={() => setFilterBlocks((value) => !value)}
                              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${filterBlocks ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                            >
                              Blocks
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/60 pt-3">
                          <button
                            type="button"
                            onClick={clearTaskFilters}
                            className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Clear all
                          </button>
                          <Button type="button" variant="secondary" size="sm" onClick={() => setIsFilterMenuOpen(false)} className="h-8 px-3">
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
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
