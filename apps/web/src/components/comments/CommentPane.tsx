import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check, MessageSquare, CornerDownRight } from 'lucide-react';
import { useCanvasStore } from '../../store/canvas.store';
import { api } from '../../lib/api';
import type { IUser } from '@mesh/shared';
import * as Y from 'yjs';
import { getUserColor } from '../../lib/user-color';
import { formatRelativeTime } from '../../lib/date-utils';
import { Button } from '../ui/Button';

export interface CommentReply {
  id: string;
  body: string;
  createdAt: string;
  author: { firstName: string; lastName: string; userName: string; id: string; avatarUrl?: string };
}

export interface CanvasComment {
  id: string;
  body: string;
  canvasX: number;
  canvasY: number;
  resolvedAt: string | null;
  createdAt: string;
  author: { firstName: string; lastName: string; userName: string; id: string; avatarUrl?: string };
  replies: CommentReply[];
}

interface CommentPaneProps {
  taskId: string;
  ydoc: Y.Doc;
  currentUser: IUser;
  activeCommentId: string | null;
  onCommentClick: (id: string) => void;
}

const highlightMentions = (text: string) => {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="text-primary font-black bg-primary/10 px-1 rounded-md">
          {part}
        </span>
      );
    }
    return part;
  });
};

const getInitials = (fName: string, lName: string) => {
  return `${fName?.[0] || ''}${lName?.[0] || ''}`.toUpperCase().substring(0, 2);
};

const CommentSkeleton = () => (
  <div className="border border-border/40 rounded-3xl p-6 bg-card/50 animate-pulse space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-muted" />
      <div className="h-4 w-32 bg-muted rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-muted rounded opacity-70" />
      <div className="h-3 w-2/3 bg-muted rounded opacity-50" />
    </div>
  </div>
);

export function CommentPane({ taskId, ydoc, currentUser, activeCommentId, onCommentClick }: CommentPaneProps) {
  const toggleCommentPane = useCanvasStore(state => state.toggleCommentPane);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchComments = useCallback(async (syncYdoc = false) => {
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      const fetched: CanvasComment[] = res.data;
      setComments(fetched);
      
      if (syncYdoc) {
        ydoc.transact(() => {
          const yComments = ydoc.getArray<Y.Map<any>>('comments');
          const existingIds = new Set(yComments.toArray().map(m => m.get('id')));
          for (const c of fetched) {
            const initials = getInitials(c.author.firstName, c.author.lastName);
            if (existingIds.has(c.id)) {
              const target = yComments.toArray().find(m => m.get('id') === c.id);
              if (target) {
                target.set('replyCount', c.replies.length);
                target.set('resolvedAt', c.resolvedAt);
              }
            } else {
              const map = new Y.Map();
              map.set('id', c.id);
              map.set('canvasX', c.canvasX);
              map.set('canvasY', c.canvasY);
              map.set('authorId', c.author.id);
              map.set('initials', initials);
              map.set('color', getUserColor(c.author.id));
              map.set('replyCount', c.replies.length);
              map.set('resolvedAt', c.resolvedAt);
              yComments.push([map]);
            }
          }
        });
      }
    } catch(e) { 
      console.error('Failed to load comments', e); 
    } finally {
      setIsLoading(false);
    }
  }, [taskId, ydoc]);

  useEffect(() => {
    fetchComments(true);
    const handleYUpdate = () => { fetchComments(false); };
    const yComments = ydoc.getArray<Y.Map<any>>('comments');
    yComments.observe(handleYUpdate);
    return () => { yComments.unobserve(handleYUpdate); };
  }, [taskId, fetchComments, ydoc]);

  useEffect(() => {
    if (activeCommentId && commentRefs.current[activeCommentId]) {
      commentRefs.current[activeCommentId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCommentId, comments]);

  const handleResolve = async (e: React.MouseEvent, id: string, isResolved: boolean) => {
    e.stopPropagation();
    try {
      const endpoint = isResolved ? `/comments/${id}/unresolve` : `/comments/${id}/resolve`;
      await api.patch(endpoint);
      setComments(prev => prev.map(c => c.id === id ? { ...c, resolvedAt: isResolved ? null : new Date().toISOString() } : c));
      ydoc.transact(() => {
        const yComments = ydoc.getArray<Y.Map<any>>('comments');
        const target = yComments.toArray().find(m => m.get('id') === id);
        if (target) target.set('resolvedAt', isResolved ? null : new Date().toISOString());
      });
    } catch(e) {}
  };

  const handleReplySubmit = async (commentId: string) => {
    const body = replyText[commentId];
    if (!body?.trim()) return;
    
    const tempReply: CommentReply = { 
      id: crypto.randomUUID(), 
      body, 
      createdAt: new Date().toISOString(), 
      author: { firstName: currentUser.firstName, lastName: currentUser.lastName, userName: currentUser.userName, id: currentUser.id }
    };
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...c.replies, tempReply] } : c));
    setReplyText(prev => ({ ...prev, [commentId]: '' }));

    try {
      await api.post(`/comments/${commentId}/replies`, { body });
      fetchComments(false); 
    } catch(e) { fetchComments(false); }
  };

  const visibleComments = comments.filter(c => showResolved || !c.resolvedAt);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      
      {/* Discussion Header */}
      <div className="h-16 px-6 border-b border-border/40 flex items-center justify-between flex-shrink-0 bg-card/40 backdrop-blur-3xl">
        <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-1">Collaborative</span>
            <h3 className="font-display font-black text-xl text-foreground tracking-tight leading-none">Discussion</h3>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleCommentPane} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Resolved Toggle Bar */}
      <div className="px-6 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{visibleComments.length} active threads</span>
           <label className="flex items-center gap-2 cursor-pointer group">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Show Resolved</span>
                <div 
                    onClick={() => setShowResolved(!showResolved)}
                    className={`w-8 h-4 rounded-full relative transition-all ${showResolved ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                >
                    <motion.div 
                        animate={{ x: showResolved ? 16 : 2 }}
                        className="absolute top-1 left-0 w-2 h-2 rounded-full bg-white shadow-sm" 
                    />
                </div>
           </label>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
        <AnimatePresence mode="popLayout">
            {isLoading ? (
            <div className="space-y-6">
                <CommentSkeleton />
                <CommentSkeleton />
                <CommentSkeleton />
            </div>
            ) : visibleComments.length === 0 ? (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-64 text-muted-foreground/40 gap-4"
            >
                <div className="w-16 h-16 rounded-[24px] bg-muted/30 flex items-center justify-center border-2 border-dashed border-border/50">
                    <MessageSquare size={32} />
                </div>
                <p className="font-serif italic text-lg text-balance text-center px-8">The canvas is quiet. Pin a thought to start the conversation.</p>
            </motion.div>
            ) : (
            visibleComments.map((comment) => {
                const isActive = activeCommentId === comment.id;
                const isResolved = !!comment.resolvedAt;

                return (
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={comment.id}
                    ref={(el) => { commentRefs.current[comment.id] = el; }}
                    onClick={() => onCommentClick(comment.id)}
                    className={`flex flex-col rounded-[32px] border transition-all duration-300 overflow-hidden cursor-pointer ${
                        isActive 
                        ? 'bg-card border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.02]' 
                        : 'bg-card/40 border-border/60 hover:border-primary/40'
                    } ${isResolved ? 'opacity-50 grayscale select-none' : ''}`}
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg border-2 border-card"
                                    style={{ backgroundColor: getUserColor(comment.author.id) }}
                                >
                                    {getInitials(comment.author.firstName, comment.author.lastName)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-display font-black text-sm text-foreground tracking-tight">
                                        {comment.author.firstName} {comment.author.lastName}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground opacity-60">
                                        {formatRelativeTime(comment.createdAt)}
                                    </span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => handleResolve(e, comment.id, isResolved)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isResolved ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200'}`}
                            >
                                {isResolved ? <Check size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </button>
                        </div>
                        
                        <p className="text-sm text-foreground/80 leading-relaxed font-serif italic pl-1 text-balance">
                            {highlightMentions(comment.body)}
                        </p>
                    </div>

                    {/* Replies Area */}
                    <AnimatePresence>
                        {(comment.replies.length > 0 || isActive) && !isResolved && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-muted/30 border-t border-border/40 pb-4"
                        >
                            {comment.replies.map((reply) => (
                            <div key={reply.id} className="p-4 px-6 relative">
                                <CornerDownRight className="absolute left-6 top-6 text-muted-foreground/30" size={14} />
                                <div className="pl-6 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black text-white shadow-sm"
                                                style={{ backgroundColor: getUserColor(reply.author.id) }}
                                            >
                                                {getInitials(reply.author.firstName, reply.author.lastName)}
                                            </div>
                                            <span className="text-xs font-black tracking-tight">{reply.author.firstName}</span>
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/60">{formatRelativeTime(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-serif italic">
                                        {highlightMentions(reply.body)}
                                    </p>
                                </div>
                            </div>
                            ))}

                            {isActive && (
                                <div className="px-6 pt-2" onClick={e => e.stopPropagation()}>
                                    <div className="flex flex-col bg-card border border-border/60 rounded-2xl p-3 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                                        <textarea
                                            value={replyText[comment.id] || ''}
                                            onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                            placeholder="Join the discussion..."
                                            className="bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40 resize-none font-serif italic mb-2 min-h-[40px] px-1"
                                            rows={2}
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleReplySubmit(comment.id)}
                                                disabled={!(replyText[comment.id]?.trim() || '')}
                                                className="h-8 rounded-xl px-4"
                                                icon={<Send size={12} />}
                                            >
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                );
            })
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
