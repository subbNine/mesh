import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check, MessageSquare, CornerDownRight, Activity } from 'lucide-react';
import { useCanvasStore } from '../../store/canvas.store';
import { api } from '../../lib/api';
import type { IUser } from '@mesh/shared';
import * as Y from 'yjs';
import { getUserColor } from '../../lib/user-color';
import { formatRelativeTime } from '../../lib/date-utils';
import { Button } from '../ui/Button';
import { ActivityTab } from '../activity/ActivityTab';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { getMentionSuggestions } from '../mentions/mention-suggestions';
import { useProjectStore } from '../../store/project.store';

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
  // Support both legacy @name and new data-mention-id spans
  const mentionIdRegex = /<span [^>]*data-mention-id="([^"]+)"[^>]*>(@?[^<]+)<\/span>/g;
  const legacyRegex = /(@\w+)/g;

  if (text.includes('data-mention-id')) {
    const parts: (string | React.JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionIdRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <span key={match.index} className="text-primary font-black bg-primary/10 px-1.5 py-0.5 rounded-md">
          {match[2]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }

  const parts = text.split(legacyRegex);
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

const COMMENTS_PAGE_SIZE = 20;

function mergeComments(current: CanvasComment[], incoming: CanvasComment[]) {
  const byId = new Map<string, CanvasComment>();

  for (const comment of [...current, ...incoming]) {
    byId.set(comment.id, comment);
  }

  return Array.from(byId.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function CommentPane({ taskId, ydoc, currentUser, activeCommentId, onCommentClick }: Readonly<CommentPaneProps>) {
  const toggleCommentPane = useCanvasStore(state => state.toggleCommentPane);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [showResolved, setShowResolved] = useState(false);
  const [page, setPage] = useState(1);
  const projectMembers = useProjectStore(state => state.members);
  const mentionSuggestions = useMemo(() => getMentionSuggestions(projectMembers), [projectMembers]);

  const replyEditor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention text-primary font-bold bg-primary/5 px-1 rounded',
        },
        suggestion: mentionSuggestions,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/40 min-h-[40px] px-1 font-serif italic',
      },
    },
  });

  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchComments = useCallback(async ({
    syncYdoc = false,
    append = false,
    targetPage = 1,
    limit = COMMENTS_PAGE_SIZE,
  }: {
    syncYdoc?: boolean;
    append?: boolean;
    targetPage?: number;
    limit?: number;
  } = {}) => {
    const isIncrementalLoad = append && targetPage > 1;

    if (isIncrementalLoad) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await api.get(`/tasks/${taskId}/comments`, {
        params: {
          page: targetPage,
          limit,
        },
      });
      const fetched: CanvasComment[] = res.data.comments ?? [];

      setComments((current) => (append ? mergeComments(current, fetched) : fetched));
      setHasMoreComments(Boolean(res.data.hasMore));
      setPage(append ? targetPage : Math.max(targetPage, Math.ceil(limit / COMMENTS_PAGE_SIZE)));

      if (syncYdoc) {
        ydoc.transact(() => {
          const yComments = ydoc.getArray<Y.Map<any>>('comments');
          const existingIds = new Set(yComments.toArray().map((map) => map.get('id')));
          for (const comment of fetched) {
            const initials = getInitials(comment.author.firstName, comment.author.lastName);
            if (existingIds.has(comment.id)) {
              const target = yComments.toArray().find((map) => map.get('id') === comment.id);
              if (target) {
                target.set('replyCount', comment.replies.length);
                target.set('resolvedAt', comment.resolvedAt);
              }
            } else {
              const map = new Y.Map();
              map.set('id', comment.id);
              map.set('canvasX', comment.canvasX);
              map.set('canvasY', comment.canvasY);
              map.set('authorId', comment.author.id);
              map.set('initials', initials);
              map.set('color', getUserColor(comment.author.id));
              map.set('replyCount', comment.replies.length);
              map.set('resolvedAt', comment.resolvedAt);
              yComments.push([map]);
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to load comments', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [taskId, ydoc]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMoreComments || isLoading || isLoadingMore) {
      return;
    }

    await fetchComments({
      append: true,
      targetPage: page + 1,
      syncYdoc: true,
    });
  }, [fetchComments, hasMoreComments, isLoading, isLoadingMore, page]);

  useEffect(() => {
    setComments([]);
    setPage(1);
    setHasMoreComments(false);
    setIsLoading(true);
    void fetchComments({ syncYdoc: true, targetPage: 1 });
  }, [taskId, fetchComments]);

  useEffect(() => {
    const handleYUpdate = () => {
      void fetchComments({
        targetPage: 1,
        limit: Math.max(page, 1) * COMMENTS_PAGE_SIZE,
      });
    };

    const yComments = ydoc.getArray<Y.Map<any>>('comments');
    yComments.observe(handleYUpdate);
    return () => {
      yComments.unobserve(handleYUpdate);
    };
  }, [fetchComments, page, ydoc]);

  useEffect(() => {
    if (activeCommentId && !comments.some((comment) => comment.id === activeCommentId) && hasMoreComments && !isLoadingMore) {
      void handleLoadMore();
      return;
    }

    if (activeCommentId && commentRefs.current[activeCommentId]) {
      commentRefs.current[activeCommentId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeCommentId, comments, handleLoadMore, hasMoreComments, isLoadingMore]);

  useEffect(() => {
    if (activeTab !== 'comments' || !hasMoreComments || isLoading || isLoadingMore) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMore();
        }
      },
      { rootMargin: '180px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activeTab, handleLoadMore, hasMoreComments, isLoading, isLoadingMore]);

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
    } catch (error) {
      console.error('Failed to update comment resolution state', error);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyEditor || replyEditor.isEmpty) return;
    const body = replyEditor.getHTML();

    const tempReply: CommentReply = {
      id: crypto.randomUUID(),
      body,
      createdAt: new Date().toISOString(),
      author: { firstName: currentUser.firstName, lastName: currentUser.lastName, userName: currentUser.userName, id: currentUser.id }
    };
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, replies: [...c.replies, tempReply] } : c));
    replyEditor.commands.clearContent();

    try {
      await api.post(`/comments/${commentId}/replies`, { body });
      void fetchComments({
        targetPage: 1,
        limit: Math.max(page, 1) * COMMENTS_PAGE_SIZE,
      });
    } catch (error) {
      console.error('Failed to post comment reply', error);
      void fetchComments({
        targetPage: 1,
        limit: Math.max(page, 1) * COMMENTS_PAGE_SIZE,
      });
    }
  };

  const visibleComments = comments.filter(c => showResolved || !c.resolvedAt);

  let commentsContent;

  if (isLoading) {
    commentsContent = (
      <div className="space-y-6">
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </div>
    );
  } else if (visibleComments.length === 0) {
    commentsContent = (
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
    );
  } else {
    commentsContent = visibleComments.map((comment) => {
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
          className={`flex flex-col rounded-[32px] border transition-all duration-300 overflow-hidden cursor-pointer ${isActive
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
                  <div className="px-6 pt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col bg-card border border-border/60 rounded-2xl p-3 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm">
                      <div className="relative">
                        {replyEditor?.isEmpty && (
                          <div className="absolute top-2 left-1 text-sm text-muted-foreground/40 font-serif italic pointer-events-none">
                            Join the discussion...
                          </div>
                        )}
                        <EditorContent editor={replyEditor} />
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleReplySubmit(comment.id);
                          }}
                          disabled={!replyEditor || replyEditor.isEmpty}
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
    });
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">

      {/* Discussion Header */}
      <div className="border-b border-border/40 bg-card/40 px-6 py-4 backdrop-blur-3xl">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary leading-none">Collaborative</span>
              <h3 className="font-display text-xl font-black tracking-tight text-foreground leading-none">Task stream</h3>
            </div>
            <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${activeTab === 'comments'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Comments
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${activeTab === 'activity'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Activity size={12} />
                Activities
              </button>
            </div>
          </div>
          <button onClick={toggleCommentPane} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
            <X size={18} />
          </button>
        </div>
      </div>

      {activeTab === 'comments' ? (
        <>
          {/* Resolved Toggle Bar */}
          <div className="px-6 py-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{visibleComments.length} active threads</span>
            <div className="flex items-center gap-2 group">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Show Resolved</span>
              <button
                type="button"
                onClick={() => setShowResolved(!showResolved)}
                className={`w-8 h-4 rounded-full relative transition-all ${showResolved ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                aria-pressed={showResolved}
                aria-label="Toggle resolved comments"
              >
                <motion.div
                  animate={{ x: showResolved ? 16 : 2 }}
                  className="absolute top-1 left-0 w-2 h-2 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>
          </div>

          {/* Comment List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
            <AnimatePresence mode="popLayout">{commentsContent}</AnimatePresence>

            {(hasMoreComments || isLoadingMore) && (
              <div ref={loadMoreRef} className="flex justify-center pt-2">
                <div className="rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {isLoadingMore ? 'Loading more comments…' : 'Scroll for more'}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-32">
          <ActivityTab taskId={taskId} />
        </div>
      )}
    </div>
  );
}
