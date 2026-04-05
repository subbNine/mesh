import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { useProjectStore } from '../../store/project.store';
import { ArrowLeft, MessageSquare, MoreHorizontal, ChevronDown, Check, UserPlus, Layers } from 'lucide-react';
import { NotificationBell } from '../ui/NotificationBell';
import { useAuthStore } from '../../store/auth.store';
import { getUserColor } from '../../lib/user-color';

type CanvasTopBarProps = Readonly<{
  task: ITask;
  awarenessUsers: any[];
  onTaskUpdate: (updates: Partial<ITask>) => void;
}>;

const STATUS_CONFIG: Record<string, { label: string, color: string, bg: string, border: string }> = {
  todo: { label: 'To Do', color: 'text-zinc-600', bg: 'bg-zinc-100', border: 'border-zinc-200' },
  inprogress: { label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  review: { label: 'Review', color: 'text-sky-700', bg: 'bg-sky-100', border: 'border-sky-200' },
  done: { label: 'Done', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' },
};

export function CanvasTopBar({ task, awarenessUsers, onTaskUpdate }: CanvasTopBarProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const members = useProjectStore(state => state.members);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);

  const toggleCommentPane = useCanvasStore(state => state.toggleCommentPane);
  const isCommentPaneOpen = useCanvasStore(state => state.isCommentPaneOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setIsStatusOpen(false);
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(e.target as Node)) setIsAssigneeOpen(false);
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

  const handleAssigneeChange = (userId: string | null) => {
    setIsAssigneeOpen(false);
    if (userId === task.assigneeId) return;
    onTaskUpdate({ assigneeId: userId } as any);
    api.patch(`/tasks/${task.id}`, { assigneeId: userId }).catch(console.error);
  };

  const visibleAvatars = awarenessUsers.slice(0, 5);
  const extraAvatars = awarenessUsers.length > 5 ? awarenessUsers.length - 5 : 0;
  const statusKey = task.status?.toLowerCase() ?? 'todo';
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.todo;

  const currentAssignee = members.find(m => m.userId === task.assigneeId)?.user;

  return (
    <div className="h-16 px-6 flex items-center justify-between border-b border-border/40 bg-card/60 backdrop-blur-3xl shadow-sm relative z-30">
      
      {/* Left Area: Context & Hierarchy */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border border-transparent hover:border-border/40"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
                <Layers size={12} className="text-primary opacity-50" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none">Task Blueprint</span>
            </div>
            
            <div className="flex items-center gap-3">
                {isEditingTitle ? (
                <input
                    autoFocus
                    className="font-display font-black text-xl bg-transparent border-b border-primary/40 outline-none text-foreground min-w-0 px-0 py-0 leading-none tracking-tight"
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
                    className="font-display font-black text-xl text-foreground truncate cursor-text hover:text-primary transition-all tracking-tight leading-none"
                    onClick={() => setIsEditingTitle(true)}
                >
                    {task.title || 'Untitled Blueprint'}
                </h2>
                )}

                {/* Status Selector */}
                <div className="relative" ref={statusMenuRef}>
                    <button
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all hover:shadow-sm ${config.bg} ${config.color} ${config.border}`}
                    >
                        {config.label}
                        <ChevronDown size={10} className="opacity-40" />
                    </button>

                    <AnimatePresence>
                        {isStatusOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-48 bg-card/60 backdrop-blur-3xl rounded-2xl shadow-2xl border border-border/80 p-1.5 z-50 overflow-hidden"
                        >
                            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${task.status === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground/60 hover:bg-muted/80 hover:text-foreground'}`}
                            >
                                <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${s === 'inprogress' ? 'bg-primary' : s === 'done' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                                {cfg.label}
                                </div>
                                {task.status === s && <Check size={12} />}
                            </button>
                            ))}
                        </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </div>

      {/* Center Checkpoint (Presence) */}
      <div className="flex items-center gap-8">
         <div className="flex items-center gap-4">
            <div className="flex items-center -space-x-3">
                {visibleAvatars.map((user, idx) => {
                    const isMe = user.userId === currentUser?.id;
                    const color = user.color || getUserColor(user.userId);
                    return (
                        <motion.div
                            key={user.clientId}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ y: -4, scale: 1.1, zIndex: 100 }}
                            className="w-10 h-10 rounded-xl border-2 border-card flex items-center justify-center text-[11px] font-black text-white relative shadow-lg overflow-hidden group cursor-pointer"
                            style={{ backgroundColor: color, zIndex: visibleAvatars.length - idx }}
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl" />
                            
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 hidden group-hover:block px-3 py-1.5 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-lg shadow-2xl border border-white/10 whitespace-nowrap z-[200] pointer-events-none">
                                {user.name} {isMe && '(You)'}
                            </div>
                        </motion.div>
                    );
                })}
                {extraAvatars > 0 && (
                    <div className="w-10 h-10 rounded-xl bg-muted border-2 border-card flex items-center justify-center text-[10px] font-black text-muted-foreground shadow-lg">
                        +{extraAvatars}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 leading-none mb-1">Live Now</span>
                <span className="text-[11px] font-serif italic text-muted-foreground/60 leading-none">{awarenessUsers.length} collaborator{awarenessUsers.length !== 1 ? 's' : ''}</span>
            </div>
         </div>
      </div>

      {/* Right Area: Management & Control */}
      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
        
        {/* Assignee Tool */}
        <div className="relative" ref={assigneeMenuRef}>
            <button
                onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-muted/50 border border-transparent hover:border-border/40 group"
            >
                <div className="flex items-center -space-x-1">
                    {currentAssignee ? (
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white border-2 border-card shadow-sm"
                        style={{ backgroundColor: getUserColor(currentAssignee.id) }}
                    >
                        {currentAssignee.firstName[0]}{currentAssignee.lastName[0]}
                    </div>
                    ) : (
                    <div className="w-8 h-8 rounded-lg bg-muted border-2 border-dashed border-border/40 flex items-center justify-center text-muted-foreground">
                        <UserPlus size={14} />
                    </div>
                    )}
                </div>
                <div className="flex flex-col items-start pr-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-0.5">Assigned to</span>
                    <span className="text-[11px] font-black tracking-tight text-foreground/80 group-hover:text-primary transition-colors leading-none">
                        {currentAssignee ? `${currentAssignee.firstName} ${currentAssignee.lastName}` : 'Nobody yet'}
                    </span>
                </div>
            </button>

            <AnimatePresence>
                {isAssigneeOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-card/60 backdrop-blur-3xl rounded-[24px] shadow-2xl border border-border/80 p-2 z-50 overflow-hidden"
                >
                    <div className="px-3 py-2 mb-1 text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] border-b border-border/40">Blueprint Access</div>
                    <button
                        onClick={() => handleAssigneeChange(null)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-muted/80 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground/40 border border-dashed border-border/60">
                                <UserPlus size={14} />
                            </div>
                            <span className={task.assigneeId ? 'text-muted-foreground/80' : 'text-primary font-black'}>No Assignee</span>
                        </div>
                        {!task.assigneeId && <Check size={14} className="text-primary" />}
                    </button>
                    {members.map((m) => (
                    <button
                        key={m.userId}
                        onClick={() => handleAssigneeChange(m.userId)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                                style={{ backgroundColor: getUserColor(m.userId) }}
                            >
                                {m.user.firstName[0]}{m.user.lastName[0]}
                            </div>
                            <span className={task.assigneeId === m.userId ? 'text-primary' : 'text-muted-foreground/80'}>
                                {m.user.firstName} {m.user.lastName}
                            </span>
                        </div>
                        {task.assigneeId === m.userId && <Check size={14} className="text-primary" />}
                    </button>
                    ))}
                </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="w-[1px] h-8 bg-border/40 mx-2" />

        <button
          onClick={toggleCommentPane}
          className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${isCommentPaneOpen
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40'
            }`}
          title="Toggle Blueprint Discussion"
        >
          <MessageSquare size={18} />
        </button>

        <NotificationBell />

        <button className="w-10 h-10 rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all border border-transparent hover:border-border/40 flex items-center justify-center">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}
