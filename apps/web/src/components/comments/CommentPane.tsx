import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, Send, Check, MessageSquare } from 'lucide-react';
import { useCanvasStore } from '../../store/canvas.store';
import { api } from '../../lib/api';
import type { IUser } from '@mesh/shared';
import * as Y from 'yjs';
import { getUserColor } from '../../lib/user-color';
import { formatRelativeTime } from '../../lib/date-utils';

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
        <span key={i} className="text-primary font-semibold bg-primary/10 px-1 rounded-md">
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
  <div className="border border-zinc-200/50 rounded-xl p-4 bg-white animate-pulse space-y-3">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-zinc-100" />
      <div className="h-3 w-24 bg-zinc-100 rounded" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-zinc-100 rounded opacity-70" />
      <div className="h-3 w-2/3 bg-zinc-100 rounded opacity-50" />
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
    
    // Optimistic Update
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
    } catch(e) { 
      fetchComments(false); // revert
    }
  };

  const visibleComments = comments.filter(c => showResolved || !c.resolvedAt);

  return (
    <div className="flex flex-col h-full bg-white relative z-[100] border-l border-zinc-200 shadow-xl overflow-hidden">
      <div className="h-[52px] px-4 border-b border-zinc-200/80 flex items-center justify-between flex-shrink-0 bg-white">
        <h3 className="font-semibold text-[15px] text-zinc-900">Comments</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors">
            <input 
              type="checkbox" 
              checked={showResolved} 
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded-sm border-zinc-300 text-primary focus:ring-primary/20 cursor-pointer"
            />
            Show resolved
          </label>
          <div className="w-[1px] h-4 bg-zinc-200 mx-1" />
          <button onClick={toggleCommentPane} className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 scroll-smooth">
        {isLoading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : visibleComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-2 opacity-80 pt-10">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-sm font-medium">No active comments.</p>
          </div>
        ) : (
          visibleComments.map((comment) => {
            const isActive = activeCommentId === comment.id;
            const isResolved = !!comment.resolvedAt;
            let cardClasses = 'border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer';
            if (isResolved) {
              cardClasses += ' opacity-60 grayscale-[0.5]';
            }
            if (isActive) {
              cardClasses += ' border-primary ring-2 ring-primary/10 shadow-md bg-white';
            } else {
              cardClasses += ' border-zinc-200/80 shadow-sm hover:border-zinc-300 bg-white';
            }

            return (
              <div
                key={comment.id}
                ref={(el) => { commentRefs.current[comment.id] = el; }}
                onClick={() => onCommentClick(comment.id)}
                className={cardClasses}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: getUserColor(comment.author.id) }}
                      >
                        {getInitials(comment.author.firstName, comment.author.lastName)}
                      </div>
                      <span className="text-[13px] font-semibold text-zinc-900 leading-none">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-400 whitespace-nowrap">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                      <button 
                        onClick={(e) => handleResolve(e, comment.id, isResolved)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isResolved ? 'bg-green-500 border-green-600 text-white hover:bg-zinc-400 hover:border-zinc-500' : 'border-zinc-300 text-zinc-300 hover:text-green-500 hover:border-green-500'}`}
                        title={isResolved ? 'Unresolve' : 'Resolve thread'}
                      >
                        {isResolved ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[13px] text-zinc-700 leading-relaxed break-words whitespace-pre-wrap ml-8">
                    {highlightMentions(comment.body)}
                  </p>
                </div>

                {(comment.replies.length > 0 || isActive) && !isResolved && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-3 pl-12 border-b border-zinc-100/50 last:border-b-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: getUserColor(reply.author.id) }}
                            >
                              {getInitials(reply.author.firstName, reply.author.lastName)}
                            </div>
                            <span className="text-[12px] font-semibold text-zinc-900">{reply.author.firstName}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium">{formatRelativeTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-[13px] text-zinc-600 leading-relaxed ml-7">
                          {highlightMentions(reply.body)}
                        </p>
                      </div>
                    ))}

                    <div className="p-3 pl-12 bg-zinc-50/50" onClick={e => e.stopPropagation()}>
                      <div className="flex items-end gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
                        <textarea
                          value={replyText[comment.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
                          placeholder="Reply to thread..."
                          className="flex-1 bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 resize-none min-h-[22px] max-h-[80px]"
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && (replyText[comment.id]?.trim() || '')) {
                              e.preventDefault();
                              handleReplySubmit(comment.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!(replyText[comment.id]?.trim() || '')}
                          className="w-[26px] h-[26px] bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <Send className="w-3 h-3 ml-px" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
