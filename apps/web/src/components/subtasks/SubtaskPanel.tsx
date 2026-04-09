import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ISubtask, type ITask } from '@mesh/shared';
import { Check, GripVertical, ListChecks, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTaskStore } from '../../store/task.store';

const EMPTY_SUBTASKS: ISubtask[] = [];

type SubtaskPanelProps = Readonly<{
  task: ITask;
  isOpen: boolean;
  onClose: () => void;
}>;

function getProgressTone(total: number, completed: number) {
  if (total === 0) {
    return 'from-zinc-300 to-zinc-200';
  }

  const ratio = completed / total;

  if (ratio >= 1) {
    return 'from-emerald-500 to-emerald-400';
  }

  if (ratio >= 0.5) {
    return 'from-amber-500 to-amber-400';
  }

  return 'from-zinc-400 to-zinc-300';
}

function SortableSubtaskRow({
  subtask,
  onToggle,
  onDelete,
}: Readonly<{
  subtask: ISubtask;
  onToggle: (subtask: ISubtask) => void;
  onDelete: (subtaskId: string) => void;
}>) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: subtask.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group flex items-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-3 py-2.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Reorder subtask"
      >
        <GripVertical size={14} />
      </button>

      <button
        type="button"
        onClick={() => onToggle(subtask)}
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${subtask.isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border/70 bg-card text-transparent hover:border-primary/40'}`}
        title={subtask.isCompleted ? 'Mark incomplete' : 'Mark complete'}
      >
        <Check size={12} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${subtask.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {subtask.title}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDelete(subtask.id)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        title="Delete subtask"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function SubtaskPanel({ task, isOpen, onClose }: SubtaskPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const fetchSubtasks = useTaskStore((state) => state.fetchSubtasks);
  const createSubtask = useTaskStore((state) => state.createSubtask);
  const updateSubtask = useTaskStore((state) => state.updateSubtask);
  const deleteSubtask = useTaskStore((state) => state.deleteSubtask);
  const reorderSubtasks = useTaskStore((state) => state.reorderSubtasks);
  const subtaskSnapshot = useTaskStore((state) => state.subtasksByTaskId[task.id]);
  const subtasks = subtaskSnapshot ?? EMPTY_SUBTASKS;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!isOpen) return;

    fetchSubtasks(task.id).catch(console.error);
  }, [fetchSubtasks, isOpen, task.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const completedCount = useMemo(() => subtasks.filter((subtask) => subtask.isCompleted).length, [subtasks]);
  const progressPercent = subtasks.length === 0 ? 0 : Math.round((completedCount / subtasks.length) * 100);

  const handleCreate = async () => {
    if (!draftTitle.trim()) return;

    await createSubtask(task.id, draftTitle.trim());
    setDraftTitle('');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = subtasks.findIndex((subtask) => subtask.id === active.id);
    const newIndex = subtasks.findIndex((subtask) => subtask.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextOrder = arrayMove(subtasks, oldIndex, newIndex).map((subtask) => subtask.id);
    await reorderSubtasks(task.id, nextOrder);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          className="absolute right-0 top-full mt-2 w-[300px] max-w-[calc(100vw-24px)] rounded-[24px] border border-border/70 bg-card/95 p-3 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur-xl z-50"
        >
          <div className="mb-3 rounded-2xl border border-primary/15 bg-primary/[0.04] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Subtasks</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{completedCount} / {subtasks.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ListChecks size={16} />
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${getProgressTone(subtasks.length, completedCount)}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {subtasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-3 py-4 text-sm text-muted-foreground">
                No subtasks yet. Add a checklist item to break the work into smaller steps.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => { handleDragEnd(event).catch(console.error); }}>
                <SortableContext items={subtasks.map((subtask) => subtask.id)} strategy={verticalListSortingStrategy}>
                  {subtasks.map((subtask) => (
                    <SortableSubtaskRow
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={(entry) => { updateSubtask(task.id, entry.id, { isCompleted: !entry.isCompleted }).catch(console.error); }}
                      onDelete={(subtaskId) => { deleteSubtask(task.id, subtaskId).catch(console.error); }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="mt-3 border-t border-border/60 pt-3">
            <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-3 py-2">
              <Plus size={14} className="text-primary" />
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleCreate();
                  }
                }}
                placeholder="Add a subtask..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Press Enter to add and keep the checklist moving.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
