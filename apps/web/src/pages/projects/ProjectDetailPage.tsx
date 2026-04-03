import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { Button } from '../../components/ui/Button';
import { TaskGrid } from '../../components/tasks/TaskGrid';
import { NewTaskModal } from '../../components/tasks/NewTaskModal';

export default function ProjectDetailPage() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  const currentProject = useProjectStore(state => state.currentProject);
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
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
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail);
      setFilterStatus(e.detail);
    };
    globalThis.addEventListener('task-tab-change', handleTabChange);
    return () => globalThis.removeEventListener('task-tab-change', handleTabChange);
  }, []);

  if (!currentProject) return null;

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      {/* Top Header */}
      <header className="px-6 md:px-8 py-5 border-b border-border bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentProject.name}</h1>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{currentProject.description || 'No description'}</p>
            </div>
            <Button 
                variant="secondary" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground p-1 mt-0.5"
                onClick={() => navigate(`/w/${workspaceId}/p/${projectId}/settings`)}
                title="Project Settings"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="">All Assignees</option>
              <option value="me">Assigned to Me</option>
              {/* Additional dynamic assignees can go here */}
            </select>
            
            <select 
              className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setActiveTab('all'); // Clear explicit tab if manually selecting abstract dropdown, or map them together
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
              className={`py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
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
            filters={{ assigneeId: filterAssignee || undefined }} 
          />
        </div>
      </main>

      {isTaskModalOpen && (
        <NewTaskModal 
          projectId={projectId!}
          onClose={() => setIsTaskModalOpen(false)}
          onCreated={(task) => {
            console.log('Task created globally:', task);
            // In the future: trigger refetch of tasks or optimistically update state
          }}
        />
      )}
    </div>
  );
}
