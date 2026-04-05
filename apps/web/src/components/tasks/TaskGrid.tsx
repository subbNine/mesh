import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskStatus } from '@mesh/shared';
import { useTaskStore } from '../../store/task.store';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { ArrowRight, GripVertical, Settings2, X, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/Button';
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
      className="p-4 mb-3 bg-card border border-border/60 rounded-2xl shadow-sm text-sm font-black uppercase tracking-widest cursor-grab active:cursor-grabbing flex items-center gap-3 touch-none hover:border-primary/40 transition-colors group"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <TaskCardSkeleton key={`skeleton-${i}`} className="w-full" />
        ))}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // ALL TAB MODE - Horizontal Rows
  if (activeTab === 'all') {
    return (
      <div className="flex flex-col gap-16 pb-20">
        <div className="flex justify-end">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsReorderModalOpen(true)}
            className="border-dashed border-2 px-4 h-10 rounded-xl"
            icon={<Settings2 size={16} />}
          >
            Structure Blueprint
          </Button>
        </div>

        {rowOrder.map(status => {
          const statusTasks = tasks.filter(t => t.status === status);
          if (statusTasks.length === 0) return null;
          
          const displayedTasks = statusTasks.slice(0, rowLimit);

          return (
            <motion.div 
              key={status} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-end gap-3">
                  <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight text-foreground lowercase">
                     {statusLabels[status] || status}
                  </h3>
                  <span className="mb-1 text-xs font-black uppercase tracking-widest text-primary/40">
                    {statusTasks.length} task{statusTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {statusTasks.length > rowLimit && (
                  <Button 
                    variant="tertiary"
                    size="sm"
                    className="group font-black uppercase tracking-[0.15em] text-[10px]"
                    onClick={() => {
                      const url = new URL(globalThis.location.href);
                      url.searchParams.set('status', status);
                      globalThis.history.pushState({}, '', url);
                      globalThis.dispatchEvent(new CustomEvent('task-tab-change', { detail: status }));
                    }}
                  >
                    Drill Down <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
              
              <div className="flex gap-8 overflow-x-auto no-scrollbar pb-6 -mx-8 px-8 mask-linear">
                <AnimatePresence mode="popLayout">
                  {displayedTasks.map(task => (
                    <div key={task.id} className="w-[320px] flex-shrink-0">
                      <TaskCard task={task} onClick={() => handleTaskClick(task.id)} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}

        {/* Modal for reordering */}
        <AnimatePresence>
          {isReorderModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsReorderModalOpen(false)}
                className="absolute inset-0 bg-background/80 backdrop-blur-xl" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-card w-full max-w-md rounded-[32px] border border-border/80 shadow-2xl overflow-hidden relative z-10"
              >
                <div className="p-8 border-b border-border/40 flex justify-between items-center bg-muted/20">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Architecture</span>
                    <h3 className="font-display font-black text-2xl tracking-tight text-foreground">Section Hierarchy</h3>
                  </div>
                  <button onClick={() => setIsReorderModalOpen(false)} className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 text-muted-foreground hover:text-foreground transition-all">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
                      {rowOrder.map((id) => (
                        <SortableStatusItem key={id} id={id} />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
                <div className="p-8 border-t border-border/40 flex justify-end bg-muted/20">
                  <Button 
                    onClick={() => setIsReorderModalOpen(false)}
                    variant="primary"
                    size="lg"
                    className="w-full h-14"
                  >
                    Lock Structure
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // STATUS TAB MODE (Specific Status) - Flat Grid
  const gridTasks = tasks.filter(t => t.status === activeTab);

  if (gridTasks.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border/40 rounded-[40px] bg-card/10 p-12 text-center"
      >
        <div className="w-20 h-20 rounded-[32px] bg-muted/50 flex items-center justify-center mb-6 text-muted-foreground/40">
           <LayoutGrid size={40} />
        </div>
        <h3 className="font-display font-black text-3xl text-foreground mb-3">Void Detected.</h3>
        <p className="max-w-[320px] text-muted-foreground font-serif italic text-lg opacity-80 mb-8">
           There are no blueprints found within the "{statusLabels[activeTab]}" stage of development.
        </p>
        <Button onClick={() => (globalThis as any).__meshShowNewTaskModal?.()} variant="outline" size="lg" className="rounded-2xl h-11 border-dashed">
            Initiate New Task
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20"
    >
      <AnimatePresence mode="popLayout">
        {gridTasks.map(task => (
           <TaskCard key={task.id} task={task} onClick={() => handleTaskClick(task.id)} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
