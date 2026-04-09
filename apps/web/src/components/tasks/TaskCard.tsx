import React, { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from 'react-router-dom';
import { type ITask } from "@mesh/shared";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { CalendarDays, Check, ChevronDown, Link2, Lock, Pin, PinOff, Trash2, User } from "lucide-react";
import { DependencyModal } from '../dependencies/DependencyModal';
import { DependencyPopup } from '../dependencies/DependencyPopup';
import { getTaskDependencyState } from '../../lib/dependency-utils';
import { useTaskStore } from "../../store/task.store";
import { useAuthStore } from "../../store/auth.store";
import { useProjectStore } from "../../store/project.store";

interface TaskCardProps {
  task: ITask;
  onClick: () => void;
  className?: string;
}

const INTERACTIVE_CARD_SELECTOR = 'button, input, select, textarea, a, dialog, [data-card-interactive="true"]';

const isInteractiveCardTarget = (target: EventTarget | null) => {
  const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  return Boolean(element?.closest(INTERACTIVE_CARD_SELECTOR));
};

const statusConfig: Record<
  string,
  { label: string; color: string; border: string; dot: string }
> = {
  todo: {
    label: "To Do",
    color: "bg-zinc-100 text-zinc-600",
    border: "border-zinc-200",
    dot: "bg-zinc-400",
  },
  inprogress: {
    label: "In Progress",
    color: "bg-primary/10 text-primary",
    border: "border-primary/20",
    dot: "bg-primary",
  },
  review: {
    label: "Review",
    color: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  done: {
    label: "Done",
    color: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export function TaskCard({ task, onClick, className = "" }: TaskCardProps) {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const [isPinned, setIsPinned] = useState(false);
  const [isCardActive, setIsCardActive] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDependencyPopupOpen, setIsDependencyPopupOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const dueDateMenuRef = useRef<HTMLDivElement>(null);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const updateTask = useTaskStore((state) => state.updateTask);
  const dependencySnapshot = useTaskStore((state) => state.dependenciesByTaskId[task.id]);
  const user = useAuthStore((state: any) => state.user);
  const members = useProjectStore((state) => state.members);
  const currentProject = useProjectStore((state) => state.currentProject);

  useEffect(() => {
    const check = (globalThis as any).__meshIsPinned;
    if (check) setIsPinned(check(task.id));
  }, [task.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setIsStatusOpen(false);
      }

      if (dueDateMenuRef.current && !dueDateMenuRef.current.contains(target)) {
        setIsDueDateOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canDelete = useMemo(() => {
    if (!user) return false;
    // Creator can delete
    if (task.createdBy === user.id) return true;
    // Admin can delete
    const member = members.find((m) => m.userId === user.id);
    const isAdmin =
      member?.role === "admin" ||
      member?.role === "owner" ||
      currentProject?.createdBy === user.id;
    return isAdmin;
  }, [user, task.createdBy, members, currentProject]);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pin = (globalThis as any).__meshPinTask;
    const unpin = (globalThis as any).__meshUnpinTask;

    if (isPinned) {
      unpin?.(task.id);
      setIsPinned(false);
    } else {
      pin?.(task.id);
      setIsPinned(true);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this task blueprint? This action is irreversible.",
      )
    ) {
      deleteTask(task.id);
    }
  };

  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueStatus = dueDate
    ? isPast(dueDate) && !isToday(dueDate)
      ? "overdue"
      : isToday(dueDate)
        ? "today"
        : "future"
    : null;
  const dueClasses =
    dueStatus === "overdue"
      ? "bg-red-50 border-red-200 text-red-700"
      : dueStatus === "today"
        ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-zinc-100 border-zinc-200 text-zinc-600";

  const updateDueDate = (value: string | null) => {
    setIsDueDateOpen(false);
    updateTask(task.id, { dueDate: value });
  };

  const handleStatusChange = (nextStatus: ITask['status']) => {
    setIsStatusOpen(false);
    if (nextStatus === task.status) return;
    updateTask(task.id, { status: nextStatus });
  };

  const handleClearDueDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateDueDate(null);
  };

  const config = statusConfig[task.status] || statusConfig.todo;

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || isInteractiveCardTarget(event.target)) {
      return;
    }
    onClick();
  };

  const dependencyState = getTaskDependencyState({
    ...task,
    blockedBy: dependencySnapshot?.blockedBy ?? task.blockedBy,
    blocks: dependencySnapshot?.blocks ?? task.blocks,
    isBlocked: dependencySnapshot?.isBlocked ?? task.isBlocked,
    dependencyCount: dependencySnapshot?.dependencyCount ?? task.dependencyCount,
  });
  const dependencyToneClass = dependencyState.isBlocked
    ? dependencyState.severity === 'critical'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-sky-200 bg-sky-50 text-sky-700';

  const actionDockClass = isCardActive
    ? 'opacity-100 translate-y-0'
    : 'opacity-80 md:opacity-65 translate-y-0.5';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsCardActive(true)}
      onMouseLeave={() => setIsCardActive(false)}
      className={`relative group flex flex-col bg-card border border-border/60 rounded-xl hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer overflow-visible ${className}`}
    >
      {/* Blueprint Thumbnail */}
      <div className="h-[120px] w-full border-b border-border/40 relative overflow-visible">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-t-xl bg-muted/30">
          {/* Architectural Background Grid for the preview */}
          <div className="absolute inset-0 bg-dot-grid opacity-10 pointer-events-none" />

          {task.snapshotUrl ? (
            <img
              src={task.snapshotUrl}
              alt={task.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-40 transition-opacity">
              <div className="w-10 h-0.5 bg-border rounded-full" />
              <div className="w-6 h-0.5 bg-border rounded-full" />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">
                New Canvas
              </span>
            </div>
          )}
        </div>

        {/* Overlay Badges */}
        <div data-card-interactive="true" className="absolute top-2 left-2 z-20 flex gap-1.5 pointer-events-auto">
          {dependencyState.dependencyCount > 0 && (
            <button
              type="button"
              data-card-interactive="true"
              onClick={(event) => {
                event.stopPropagation();
                setIsDependencyPopupOpen((prev) => !prev);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest backdrop-blur-md transition-colors ${dependencyToneClass}`}
              title={dependencyState.summaryLabel}
            >
              {dependencyState.isBlocked ? <Lock size={10} /> : <Link2 size={10} />}
              {dependencyState.isBlocked ? 'Blocked' : 'Linked'}
            </button>
          )}

          <div ref={statusMenuRef} data-card-interactive="true" className="relative z-30">
            <button
              type="button"
              data-card-interactive="true"
              onClick={(event) => {
                event.stopPropagation();
                setIsStatusOpen((prev) => !prev);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest backdrop-blur-md transition-colors hover:shadow-sm ${config.border} ${config.color}`}
              title="Change task status"
            >
              <div className={`w-1 h-1 rounded-full ${config.dot}`} />
              {config.label}
              <ChevronDown size={9} className="opacity-50" />
            </button>

            <AnimatePresence>
              {isStatusOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  data-card-interactive="true"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="absolute left-0 top-full z-[80] mt-1.5 w-40 rounded-xl border border-border/80 bg-card/95 p-1 shadow-xl backdrop-blur-xl"
                >
                  {Object.entries(statusConfig).map(([statusKey, statusValue]) => (
                    <button
                      key={statusKey}
                      type="button"
                      data-card-interactive="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleStatusChange(statusKey as ITask['status']);
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${task.status === statusKey ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusValue.dot}`} />
                        {statusValue.label}
                      </span>
                      {task.status === statusKey && <Check size={11} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          data-card-interactive="true"
          className={`absolute top-2 right-2 z-20 flex items-center gap-1 pointer-events-auto transition-all duration-200 ${actionDockClass}`}
        >
          {canDelete && (
            <button
              type="button"
              data-card-interactive="true"
              onClick={handleDelete}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              className="p-1.5 rounded-lg backdrop-blur-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
              title="Delete Blueprint"
            >
              <Trash2 size={12} />
            </button>
          )}

          <button
            type="button"
            data-card-interactive="true"
            onClick={handlePinToggle}
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            className={`p-1.5 rounded-lg backdrop-blur-xl border border-white/10 transition-all ${
              isPinned
                ? "bg-primary text-primary-foreground shadow-lg opacity-100"
                : "bg-black/20 text-white hover:bg-black/40"
            }`}
            title={isPinned ? "Unpin" : "Pin to Board"}
          >
            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
        </div>
      </div>

      {workspaceId && (
        <DependencyPopup
          isOpen={isDependencyPopupOpen}
          onClose={() => setIsDependencyPopupOpen(false)}
          onManage={() => {
            setIsDependencyPopupOpen(false);
            setIsDependencyModalOpen(true);
          }}
          task={task}
          workspaceId={workspaceId}
        />
      )}

      <div className="sm:p-3 p-2.5 flex flex-col flex-1 space-y-2">
        <div className="space-y-0.5">
          <h4 className="font-display font-black text-sm text-foreground tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {task.title || "Untitled Task"}
          </h4>
          <p className="text-[11px] text-muted-foreground font-serif italic line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
            {task.description || "No blueprint description..."}
          </p>
        </div>

        <div className="pt-1.5 space-y-2 border-t border-border/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-tight">
              {formatDistanceToNow(new Date(task.createdAt), {
                addSuffix: true,
              })}
            </span>
            <div data-card-interactive="true" className="relative z-10 flex items-center gap-1.5">
              <button
                type="button"
                data-card-interactive="true"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsDependencyPopupOpen(false);
                  setIsDependencyModalOpen(true);
                }}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${dependencyState.isBlocked ? 'text-amber-700 hover:bg-amber-50' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
                title="Manage dependencies"
              >
                {dependencyState.isBlocked ? <Lock size={12} /> : <Link2 size={12} />}
                {dependencyState.dependencyCount > 0 ? 'Deps' : 'Link'}
              </button>

              <button
                type="button"
                data-card-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDueDateOpen((prev) => !prev);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
                title="Set due date"
              >
                <CalendarDays size={12} />
                {dueDate ? format(dueDate, "MMM d") : "Add due date"}
              </button>
            </div>
          </div>

          {dueDate && (
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${dueClasses}`}
            >
              <span>
                {isPast(dueDate) && !isToday(dueDate)
                  ? "Overdue"
                  : isToday(dueDate)
                    ? "Due today"
                    : "Due"}
              </span>
              <span className="opacity-80">{format(dueDate, "MMM d")}</span>
            </div>
          )}

          {isDueDateOpen && (
            <div
              data-card-interactive="true"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              ref={dueDateMenuRef}
              className="absolute right-3 bottom-20 z-[60] w-44 rounded-2xl border border-border/70 bg-card p-3 shadow-xl"
            >
              <input
                type="date"
                value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                onChange={(e) => updateDueDate(e.target.value || null)}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  data-card-interactive="true"
                  onClick={handleClearDueDate}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="rounded-xl bg-muted/80 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-foreground/80 hover:bg-muted"
                >
                  Clear
                </button>
                <button
                  type="button"
                  data-card-interactive="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDueDateOpen(false);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="rounded-xl bg-primary px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* User Info */}
            {task.assignee ? (
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md bg-primary/10 border border-primary/20 flex flex-shrink-0 items-center justify-center text-primary text-[8px] font-black overflow-hidden shadow-sm"
                  title={`${task.assignee.firstName} ${task.assignee.lastName}`}
                >
                  {task.assignee.avatarUrl ? (
                    <img
                      src={task.assignee.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(task.assignee.firstName, task.assignee.lastName)
                  )}
                </div>
              </div>
            ) : (
              <div
                className="w-5 h-5 rounded-md border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground/30"
                title="Unassigned"
              >
                <User size={10} />
              </div>
            )}
          </div>
        </div>
      </div>
      <DependencyModal
        isOpen={isDependencyModalOpen}
        onClose={() => setIsDependencyModalOpen(false)}
        task={task}
      />
    </motion.div>
  );
}
