import { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useParams } from 'react-router-dom';
import { TaskThumbnailCard } from './TaskThumbnailCard';
import { useProjectStore } from '../../store/project.store';
import { Filter, User, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import { NewTaskModal } from './NewTaskModal';

export function TaskThumbnailSidebar() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  
  const members = useProjectStore(state => state.members);
  const fetchMembers = useProjectStore(state => state.fetchMembers);

  const fetchTasks = () => {
    if (projectId) {
      setIsLoading(true);
      api.get(`/projects/${projectId}/tasks`)
        .then(res => {
          // API returns { result: ITask[], metadata: {...} }
          setTasks(res.data.result || []);
        })
        .catch(err => console.error('Failed to fetch tasks for sidebar', err))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMembers(projectId);
      fetchTasks();
    }
  }, [projectId, fetchMembers]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const assigneeIds = t.assignees?.map((assignee) => assignee.id) ?? (t.assigneeId ? [t.assigneeId] : []);
      const matchAssignee = assigneeFilter === 'all' || assigneeIds.includes(assigneeFilter);
      return matchStatus && matchAssignee;
    });
  }, [tasks, statusFilter, assigneeFilter]);

  const statuses = [
    { id: 'all', label: 'All Status' },
    { id: 'todo', label: 'To Do' },
    { id: 'inprogress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' }
  ];

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="h-8 w-full bg-muted rounded-md animate-pulse mb-2" />
        {new Array(6).fill(0).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-28 w-full bg-muted/60 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
      
      {/* Search/Filter Bar */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
            <Filter className="w-3 h-3" />
            Filter Rail
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-bold uppercase tracking-tight"
          >
            <Plus className="w-3 h-3" />
            Add Task
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Status Select */}
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 pl-8 pr-2 bg-muted/40 border border-border/80 rounded-lg text-[11px] font-medium appearance-none outline-none focus:ring-1 focus:ring-primary/20 hover:bg-muted/60 transition-colors"
            >
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <CheckCircle2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60 transition-colors group-hover:text-primary/70" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Assignee Select */}
          <div className="relative group">
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full h-8 pl-8 pr-2 bg-muted/40 border border-border/80 rounded-lg text-[11px] font-medium appearance-none outline-none focus:ring-1 focus:ring-primary/20 hover:bg-muted/60 transition-colors"
            >
              <option value="all">Assignee</option>
              {members.map(m => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.firstName}
                </option>
              ))}
            </select>
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60 transition-colors group-hover:text-primary/70" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Task List (Thumbnails) */}
      <div className="flex-1 overflow-y-auto w-full p-2.5 space-y-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/10 hover:scrollbar-thumb-muted-foreground/20">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground/40 space-y-2">
            <Filter className="w-10 h-10 border-2 border-dashed border-muted/50 rounded-xl p-2 opacity-20" />
            <span className="text-[11px] font-medium">No shared tasks found</span>
          </div>
        ) : (
          filteredTasks.map((t, idx) => (
            <TaskThumbnailCard 
              key={t.id} 
              task={t} 
              index={idx} 
              isActive={t.id === taskId} 
            />
          ))
        )}
      </div>

      {/* Summary Footer */}
      <div className="p-3 border-t border-border bg-card/50 flex items-center justify-between">
         <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">
           {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
         </span>
      </div>

      {isModalOpen && (
        <NewTaskModal 
          projectId={projectId!}
          onClose={() => setIsModalOpen(false)}
          onCreated={(task) => {
            console.log('Task created from rail:', task);
            fetchTasks(); // Refresh list
          }}
        />
      )}
    </div>
  );
}
