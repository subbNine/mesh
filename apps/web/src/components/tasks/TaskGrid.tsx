import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TaskStatus } from '@mesh/shared';
import { useTaskStore } from '../../store/task.store';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { ArrowRight, GripVertical, Settings2, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskGridProps {
  projectId: string;
  activeTab: 'all' | TaskStatus;
  filters: { assigneeId?: string };
}

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

// Sortable item wrapper for Reorder Modal
function SortableStatusItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="p-3 mb-2 bg-card border border-border rounded-lg shadow-sm text-sm font-medium cursor-grab active:cursor-grabbing flex items-center gap-3 touch-none"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      {statusLabels[id] || id}
    </div>
  );
}

export function TaskGrid({ projectId, activeTab, filters }: TaskGridProps) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { tasks, isLoading, rowOrder, rowLimit, fetchTasks, loadPreferences, setRowOrder } = useTaskStore();
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    fetchTasks(projectId, filters);
  }, [projectId, filters, fetchTasks]);


  const handleTaskClick = (taskId: string) => {
    navigate(`/w/${workspaceId}/p/${projectId}/tasks/${taskId}/canvas`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rowOrder.indexOf(active.id as any);
      const newIndex = rowOrder.indexOf(over.id as any);
      setRowOrder(arrayMove(rowOrder, oldIndex, newIndex));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <TaskCardSkeleton key={`skeleton-${i}`} className="w-full" />
        ))}
      </div>
    );
  }

  // ALL TAB MODE - Horizontal Rows
  if (activeTab === 'all') {
    return (
      <div className="flex flex-col gap-8 pb-10">
        <div className="flex justify-end">
          <button 
            onClick={() => setIsReorderModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            Rearrange Sections
          </button>
        </div>

        {rowOrder.map(status => {
          const statusTasks = tasks.filter(t => t.status === status);
          if (statusTasks.length === 0) return null; // Skip empty rows or show empty state? Let's show it so they can see order.
          
          const displayedTasks = statusTasks.slice(0, rowLimit);

          return (
            <div key={status} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{statusLabels[status] || status}</h3>
                  <span className="flex items-center justify-center bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
                {statusTasks.length > rowLimit && (
                  <button 
                    className="text-sm font-medium text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
                    onClick={() => {
                      // We don't have direct access to set activeTab from here smoothly without prop/URL change.
                      // Since activeTab comes from ProjectDetailPage, a real app would probably map this by pushing URL ?tab=status
                      // Wait, prompt says: "Show more ->"  switches the active tab to that status.
                      // I need to either invoke a callback or manually dispatch. 
                      // Wait, we can't change ProjectDetailPage state natively without an event... Wait, the URL doesn't have ?tab right now, it relies on local state `activeTab`.
                      // Oh, we could dispatch a custom event, or since they clicked "Show more", maybe use navigate(`?status=${status}`) and the page will pick it up? 
                      // The prompt doesn't specify a callback prop for `onTabChange`. I will just fire a custom window event for simplicity, OR rely on a query param change, OR in this example, it's a known placeholder logic.
                      
                      const url = new URL(globalThis.location.href);
                      url.searchParams.set('status', status);
                      globalThis.history.pushState({}, '', url);
                      globalThis.dispatchEvent(new CustomEvent('task-tab-change', { detail: status }));
                    }}
                  >
                    Show more <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {statusTasks.length > 0 ? (
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2 mask-linear">
                  {displayedTasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} className="w-[280px]" />
                  ))}
                </div>
              ) : (
                <div className="h-[140px] border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm flex-shrink-0">
                  No tasks here yet
                </div>
              )}
            </div>
          );
        })}

        {/* Modal for reordering */}
        {isReorderModalOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
                <h3 className="font-semibold text-foreground">Rearrange Sections</h3>
                <button onClick={() => setIsReorderModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
                    {rowOrder.map((id) => (
                      <SortableStatusItem key={id} id={id} />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
              <div className="p-4 border-t border-border flex justify-end bg-muted/20">
                <button 
                  onClick={() => setIsReorderModalOpen(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // STATUS TAB MODE (Specific Status) - Flat Grid
  const gridTasks = tasks.filter(t => t.status === activeTab);

  if (gridTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border rounded-xl bg-card/10">
        <h3 className="text-lg font-medium text-foreground mb-1">No tasks here yet</h3>
        <p className="text-sm text-muted-foreground">There are no tasks with the status "{statusLabels[activeTab]}".</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
      {gridTasks.map(task => (
        <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} className="w-full" />
      ))}
    </div>
  );
}
