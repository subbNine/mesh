import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { getTaskDependencyState } from '../../lib/dependency-utils';
import type { ITask } from '@mesh/shared';
import { format } from 'date-fns';
import { useCanvasStore } from '../../store/canvas.store';
import { useTaskStore } from '../../store/task.store';
import { useProjectStore } from '../../store/project.store';
import { ArrowLeft, CalendarDays, Check, ChevronDown, Layers, Link2, Lock, MessageSquare, MoreHorizontal, StickyNote, UserPlus } from 'lucide-react';
import { DependencyDropdown } from '../dependencies/DependencyDropdown';
import { DependencyModal } from '../dependencies/DependencyModal';
import { AssigneeStack } from '../tasks/AssigneeStack';
import { NotificationBell } from '../ui/NotificationBell';
import { useAuthStore } from '../../store/auth.store';
import { getUserColor } from '../../lib/user-color';

type CanvasTopBarProps = Readonly<{
  task: ITask;
  awarenessUsers: any[];
  onTaskUpdate: (updates: Partial<ITask>) => void;
  isScratchpadOpen: boolean;
  onToggleScratchpad: () => void;
}>;

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, border: string }> = {
  todo: { label: 'To Do', color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' },
  inprogress: { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  review: { label: 'Review', color: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-200' },
  done: { label: 'Done', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
};

export function CanvasTopBar({
  task,
  awarenessUsers,
  onTaskUpdate,
  isScratchpadOpen,
  onToggleScratchpad,
}: CanvasTopBarProps) {
  const navigate = useNavigate();
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const currentUser = useAuthStore(state => state.user);
  const members = useProjectStore(state => state.members);
  const dependencySnapshot = useTaskStore((state) => state.dependenciesByTaskId[task.id]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [isDependenciesOpen, setIsDependenciesOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const dueDateMenuRef = useRef<HTMLDivElement>(null);
  const dependenciesMenuRef = useRef<HTMLDivElement>(null);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  const toggleCommentPane = useCanvasStore(state => state.toggleCommentPane);
  const isCommentPaneOpen = useCanvasStore(state => state.isCommentPaneOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setIsStatusOpen(false);
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(e.target as Node)) setIsAssigneeOpen(false);
      if (dueDateMenuRef.current && !dueDateMenuRef.current.contains(e.target as Node)) setIsDueDateOpen(false);
      if (dependenciesMenuRef.current && !dependenciesMenuRef.current.contains(e.target as Node)) setIsDependenciesOpen(false);
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) setIsOverflowOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== task.title) {
      onTaskUpdate({ title: title.trim() });
      api.patch(`/tasks/${task.id}`, { title: title.trim() }).catch(console.error);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setIsStatusOpen(false);
    if (newStatus === task.status) return;
    onTaskUpdate({ status: newStatus as any });
    api.patch(`/tasks/${task.id}`, { status: newStatus }).catch(console.error);
  };

  const handleAssigneeSelection = (nextIds: string[]) => {
    const nextAssignees = members
      .filter((member) => nextIds.includes(member.userId))
      .map((member) => member.user);

    onTaskUpdate({
      assignees: nextAssignees,
      assignee: nextAssignees[0] ?? null,
      assigneeId: nextIds[0] ?? null,
    } as Partial<ITask>);

    api.patch(`/tasks/${task.id}`, { assigneeIds: nextIds }).catch(console.error);
  };

  const handleAssigneeToggle = (userId: string) => {
    const currentIds = selectedAssigneeIds;
    const isSelected = currentIds.includes(userId);

    if (!isSelected && currentIds.length >= 5) {
      return;
    }

    const nextIds = isSelected
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];

    handleAssigneeSelection(nextIds);
  };

  const handleDueDateChange = (dueDate: string | null) => {
    setIsDueDateOpen(false);
    if (dueDate === task.dueDate) return;
    onTaskUpdate({ dueDate });
    api.patch(`/tasks/${task.id}`, { dueDate }).catch(console.error);
  };

  const visibleAvatars = awarenessUsers.slice(0, 5);
  const extraAvatars = awarenessUsers.length > 5 ? awarenessUsers.length - 5 : 0;
  const statusKey = task.status?.toLowerCase() ?? 'todo';
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo;
  const dependencyState = getTaskDependencyState({
    ...task,
    blockedBy: dependencySnapshot?.blockedBy ?? task.blockedBy,
    blocks: dependencySnapshot?.blocks ?? task.blocks,
    isBlocked: dependencySnapshot?.isBlocked ?? task.isBlocked,
    dependencyCount: dependencySnapshot?.dependencyCount ?? task.dependencyCount,
  });

  const currentAssignee = members.find(m => m.userId === task.assigneeId)?.user;
  const selectedAssignees = task.assignees?.length
    ? task.assignees
    : currentAssignee
      ? [currentAssignee]
      : [];
  const selectedAssigneeIds = selectedAssignees.map((assignee) => assignee.id);
  const assigneeLabel = selectedAssignees.length === 0
    ? 'Nobody'
    : selectedAssignees.length === 1
      ? `${selectedAssignees[0].firstName} ${selectedAssignees[0].lastName}`
      : `${selectedAssignees[0].firstName} +${selectedAssignees.length - 1}`;

  return (
    <div className="h-14 px-4 flex items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-3xl shadow-sm relative z-30">

      {/* Left Area: Context & Hierarchy */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-transparent hover:border-border/40"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 hidden md:flex">
                <Layers size={10} className="text-primary opacity-50" />
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 leading-none">Task Blueprint</span>
            </div>

            <div className="flex items-center gap-2">
                {isEditingTitle ? (
                <input
                    autoFocus
                    className="font-display font-black text-base bg-transparent border-b border-primary/40 outline-none text-foreground min-w-0 px-0 py-0 leading-none tracking-tight"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleBlur();
                    if (e.key === 'Escape') { setTitle(task.title); setIsEditingTitle(false); }
                    }}
                />
                ) : (
                <h2
                    className="font-display font-black text-sm md:text-base text-foreground truncate cursor-text hover:text-primary transition-all tracking-tight leading-none"
                    onClick={() => setIsEditingTitle(true)}
                >
                    {task.title || 'Untitled Blueprint'}
                </h2>
                )}

                {/* Status Selector */}
                <div className="relative" ref={statusMenuRef}>
                    <button
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all hover:shadow-sm ${config.bg} ${config.color} ${config.border}`}
                    >
                        {config.label}
                        <ChevronDown size={9} className="opacity-40" />
                    </button>

                    <AnimatePresence>
                        {isStatusOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-1.5 w-40 bg-card/60 backdrop-blur-3xl rounded-lg shadow-lg border border-border/80 p-1 z-50 overflow-hidden"
                        >
                            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${task.status === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-1.5">
                                <div className={`w-1 h-1 rounded-full ${s === 'inprogress' ? 'bg-primary' : s === 'done' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                                {cfg.label}
                                </div>
                                {task.status === s && <Check size={10} />}
                            </button>
                            ))}
                        </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {dependencyState.dependencyCount > 0 && workspaceId && (
                  <div className="relative" ref={dependenciesMenuRef}>
                    <button
                      onClick={() => setIsDependenciesOpen((prev) => !prev)}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-sm ${dependencyState.isBlocked ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}
                    >
                      {dependencyState.isBlocked ? <Lock size={10} /> : <Link2 size={10} />}
                      <span className="max-w-[180px] truncate">{dependencyState.summaryLabel}</span>
                      <ChevronDown size={9} className="opacity-40" />
                    </button>

                    <DependencyDropdown
                      isOpen={isDependenciesOpen}
                      onClose={() => setIsDependenciesOpen(false)}
                      onManage={() => {
                        setIsDependenciesOpen(false);
                        setIsDependencyModalOpen(true);
                      }}
                      task={task}
                      workspaceId={workspaceId}
                    />
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Center Checkpoint (Presence) - Hidden on Mobile */}
      <div className="hidden lg:flex items-center gap-5">
         <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
                {visibleAvatars.map((user, idx) => {
                    const isMe = user.userId === currentUser?.id;
                    const color = user.color || getUserColor(user.userId);
                    return (
                        <motion.div
                            key={user.clientId}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ y: -4, scale: 1.1, zIndex: 100 }}
                            className="w-8 h-8 rounded-lg border-2 border-card flex items-center justify-center text-[9px] font-black text-white relative shadow-md overflow-hidden group cursor-pointer"
                            style={{ backgroundColor: color, zIndex: visibleAvatars.length - idx }}
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg" />

                            <div className="absolute top-10 left-1/2 -translate-x-1/2 hidden group-hover:block px-2.5 py-1 bg-foreground text-background text-[9px] font-black uppercase tracking-widest rounded-md shadow-lg border border-white/10 whitespace-nowrap z-[200] pointer-events-none">
                                {user.name} {isMe && '(You)'}
                            </div>
                        </motion.div>
                    );
                })}
                {extraAvatars > 0 && (
                    <div className="w-8 h-8 rounded-lg bg-muted border-2 border-card flex items-center justify-center text-[9px] font-black text-muted-foreground shadow-md">
                        +{extraAvatars}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-none mb-0.5">Live Now</span>
                <span className="text-[10px] font-serif italic text-muted-foreground/60 leading-none">{awarenessUsers.length} collaborator{awarenessUsers.length !== 1 ? 's' : ''}</span>
            </div>
         </div>
      </div>

      {/* Right Area: Management & Control */}
      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">

        {/* Assignee Tool */}
        <div className="relative" ref={assigneeMenuRef}>
            <button
                onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all hover:bg-muted/50 border border-transparent hover:border-border/40 group"
            >
                <AssigneeStack assignees={selectedAssignees} maxVisible={3} size="md" />
                <div className="flex flex-col items-start pr-1 hidden md:flex">
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">Assigned team</span>
                    <span className="text-[10px] font-black tracking-tight text-foreground/80 group-hover:text-primary transition-colors leading-none">
                        {assigneeLabel}
                    </span>
                </div>
            </button>

            <AnimatePresence>
                {isAssigneeOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-1.5 w-72 bg-card/80 backdrop-blur-3xl rounded-xl shadow-lg border border-border/80 p-1.5 z-50 overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 px-2.5 py-2">
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/60">Task crew</div>
                        <div className="text-[11px] text-muted-foreground">Pick up to five collaborators</div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                        {selectedAssigneeIds.length}/5
                      </span>
                    </div>

                    <button
                        onClick={() => handleAssigneeSelection([])}
                        className="mt-1 w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-muted/50 transition-all group"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground/40 border border-dashed border-border/60">
                                <UserPlus size={12} />
                            </div>
                            <span className={selectedAssigneeIds.length > 0 ? 'text-muted-foreground/80' : 'text-primary font-black'}>No assignees</span>
                        </div>
                        {selectedAssigneeIds.length === 0 && <Check size={12} className="text-primary" />}
                    </button>
                    {members.map((m) => {
                      const isSelected = selectedAssigneeIds.includes(m.userId);
                      const selectionLimitReached = !isSelected && selectedAssigneeIds.length >= 5;
                      const avatarUrl = (m.user as { avatarUrl?: string | null }).avatarUrl;

                      return (
                        <button
                            key={m.userId}
                            onClick={() => handleAssigneeToggle(m.userId)}
                            disabled={selectionLimitReached}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all group ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'} ${selectionLimitReached ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-black text-white shadow-sm overflow-hidden"
                                    style={{ backgroundColor: getUserColor(m.userId) }}
                                >
                                    {avatarUrl ? (
                                      <img src={avatarUrl} alt={`${m.user.firstName} ${m.user.lastName}`} className="h-full w-full object-cover" />
                                    ) : (
                                      <span>{m.user.firstName[0]}{m.user.lastName[0]}</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className={isSelected ? 'text-primary' : 'text-muted-foreground/80'}>
                                      {m.user.firstName} {m.user.lastName}
                                  </span>
                                  <span className="text-[8px] uppercase tracking-[0.16em] text-muted-foreground/50">
                                    {isSelected ? 'Assigned' : 'Available'}
                                  </span>
                                </div>
                            </div>
                            {isSelected && <Check size={12} className="text-primary" />}
                        </button>
                      );
                    })}
                </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="relative" ref={dueDateMenuRef}>
          <button
            onClick={() => setIsDueDateOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-muted/40 text-sm font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/80 transition-all"
          >
            <CalendarDays size={14} />
            <span>
              {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'Add due date'}
            </span>
          </button>

          <AnimatePresence>
            {isDueDateOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-2xl z-50"
              >
                <input
                  type="date"
                  value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDueDateChange(e.target.value || null)}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDueDateChange(null)}
                    className="rounded-xl bg-muted/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80 hover:bg-muted"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDueDateOpen(false)}
                    className="rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary/90"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Collaborator Indicator */}
        <div className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary animate-pulse shadow-inner relative overflow-hidden">
            <span className="text-[9px] font-black">{awarenessUsers.length}</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
        </div>

        <div className="w-px h-6 bg-border/40 mx-1 hidden md:block" />

        <button
          onClick={onToggleScratchpad}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isScratchpadOpen
            ? 'border-amber-300 bg-amber-100 text-amber-900 shadow-lg shadow-amber-500/10 dark:border-amber-200/20 dark:bg-amber-500/10 dark:text-amber-100'
            : 'border-amber-200/60 bg-[#fff8e7] text-[#8a6530] hover:-translate-y-0.5 hover:shadow-md dark:border-amber-200/10 dark:bg-slate-900/60 dark:text-amber-100'}`}
          title="Open your scratchpad"
        >
          <StickyNote size={14} />
          <span className="hidden xl:inline">Scratchpad</span>
        </button>

        <button
          onClick={toggleCommentPane}
          className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${isCommentPaneOpen
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
              : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40'
            }`}
          title="Toggle Blueprint Discussion"
        >
          <MessageSquare size={16} />
        </button>

        <NotificationBell />

        <div className="relative" ref={overflowMenuRef}>
          <button
            onClick={() => setIsOverflowOpen((prev) => !prev)}
            className="w-8 h-8 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all border border-transparent hover:border-border/40 flex items-center justify-center"
          >
            <MoreHorizontal size={16} />
          </button>

          <AnimatePresence>
            {isOverflowOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-2xl z-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    setIsDependencyModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
                >
                  <Link2 size={14} className="text-primary" />
                  Manage dependencies
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <DependencyModal
        isOpen={isDependencyModalOpen}
        onClose={() => setIsDependencyModalOpen(false)}
        task={task}
      />
    </div>
  );
}
