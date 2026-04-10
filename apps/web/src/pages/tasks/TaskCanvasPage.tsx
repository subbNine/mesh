import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { connectToCanvas, disconnectFromCanvas } from '../../lib/ws';
import { useCanvasStore } from '../../store/canvas.store';
import { useAuthStore } from '../../store/auth.store';
import type { ITask } from '@mesh/shared';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
import { getUserColor } from '../../lib/user-color';

import { CanvasTopBar } from '../../components/canvas/CanvasTopBar';
import { CanvasToolbar } from '../../components/canvas/CanvasToolbar';
import { CanvasStage } from '../../components/canvas/CanvasStage';
import { ScratchpadPanel } from '../../components/scratchpad/ScratchpadPanel';
import { CommentPane } from '../../components/comments/CommentPane';
import { useScratchpadStore } from '../../store/scratchpad.store';

const saveCanvasState = async (doc: Y.Doc, taskId: string) => {
  try {
    const stateUpdate = Y.encodeStateAsUpdate(doc);
    const authToken = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/canvas/${taskId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: new Uint8Array(stateUpdate),
    });
  } catch (error) {
    console.error('[Canvas] Failed to save debounced state:', error);
  }
};

export default function TaskCanvasPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = useState<ITask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  const [isSynced, setIsSynced] = useState(false);
  const [awarenessUsers, setAwarenessUsers] = useState<any[]>([]);

  const currentUser = useAuthStore(state => state.user);
  const isScratchpadOpen = useScratchpadStore((state) => state.isOpen);
  const setScratchpadOpen = useScratchpadStore((state) => state.setOpen);
  const fetchScratchpad = useScratchpadStore((state) => state.fetchScratchpad);

  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    isCommentPaneOpen,
    setCommentPaneOpen,
    toggleCommentPane,
    activeCommentId,
    setActiveComment
  } = useCanvasStore();

  useEffect(() => {
    if (globalThis.innerWidth < 1024 && isCommentPaneOpen) {
      setCommentPaneOpen(false);
    }
  }, [isCommentPaneOpen, setCommentPaneOpen]);

  useEffect(() => {
    if (currentUser) {
      void fetchScratchpad();
    }

    return () => {
      setScratchpadOpen(false);
    };
  }, [currentUser, fetchScratchpad, setScratchpadOpen]);

  const handleAwarenessChange = useCallback((aw: Awareness) => {
    const uniqueUsers = new Map<string, any>();

    for (const [clientId, state] of aw.getStates().entries()) {
      if (!state?.userId) continue;

      const nextUser = {
        clientId,
        ...state,
      };
      const existingUser = uniqueUsers.get(state.userId);

      if (!existingUser || clientId === aw.clientID || (!!state.cursor && !existingUser.cursor)) {
        uniqueUsers.set(state.userId, nextUser);
      }
    }

    setAwarenessUsers(Array.from(uniqueUsers.values()));
  }, []);

  const loadCommentsFromBackend = useCallback(async (doc: Y.Doc) => {
    try {
      const collectedComments: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data } = await api.get(`/tasks/${taskId}/comments`, {
          params: {
            page,
            limit: 100,
          },
        });

        const commentsPage = Array.isArray(data) ? data : (data.comments ?? []);
        collectedComments.push(...commentsPage);
        hasMore = Array.isArray(data) ? false : Boolean(data.hasMore);
        page += 1;

        if (Array.isArray(data)) {
          break;
        }
      }

      if (collectedComments.length > 0) {
        doc.transact(() => {
          const commentsArr = doc.getArray<Y.Map<any>>('comments');
          if (commentsArr.length === 0) {
            for (const comment of collectedComments) {
              const cm = new Y.Map();
              for (const [k, v] of Object.entries(comment)) {
                cm.set(k, v);
              }
              commentsArr.push([cm]);
            }
          }
        });
      }
    } catch (err: any) {
      console.warn('[Canvas] Comments API failed or 404', err.message);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId || !currentUser) return;

    setIsLoading(true);
    setIsSynced(false);
    setAwarenessUsers([]);

    let wsProvider: WebsocketProvider | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    let currentAwareness: Awareness | null = null;
    let removeAwarenessListener: (() => void) | null = null;
    let removeDocListener: (() => void) | null = null;
    let isDisposed = false;

    const handleDocUpdate = (doc: Y.Doc) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!isDisposed) {
          saveCanvasState(doc, taskId);
        }
      }, 1500);
    };

    const init = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const { ydoc: doc, provider: prov, awareness: aw } = connectToCanvas(taskId, token);

        if (isDisposed) {
          disconnectFromCanvas(prov);
          return;
        }

        wsProvider = prov;
        currentAwareness = aw;
        setYdoc(doc);
        setAwareness(aw);

        prov.on('sync', (nextIsSynced: boolean) => {
          if (!isDisposed) {
            setIsSynced(nextIsSynced);
          }
        });

        aw.setLocalState({
          userId: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          avatarUrl: currentUser.avatarUrl,
          color: getUserColor(currentUser.id),
          cursor: null
        });

        const awarenessChangeHandler = () => handleAwarenessChange(aw);
        const docUpdateHandler = () => handleDocUpdate(doc);

        aw.on('change', awarenessChangeHandler);
        doc.on('update', docUpdateHandler);
        removeAwarenessListener = () => aw.off('change', awarenessChangeHandler);
        removeDocListener = () => doc.off('update', docUpdateHandler);
        handleAwarenessChange(aw);

        const res = await api.get(`/tasks/${taskId}`);
        if (!isDisposed) {
          setTask(res.data);
          await loadCommentsFromBackend(doc);
        }

        if (isDisposed) {
          removeAwarenessListener?.();
          removeDocListener?.();
          disconnectFromCanvas(prov);
        }
      } catch (err) {
        console.error('Failed to initialize canvas page', err);
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isDisposed = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      removeAwarenessListener?.();
      removeDocListener?.();
      
      if (currentAwareness) {
        currentAwareness.setLocalState(null);
      }
      if (wsProvider) {
        disconnectFromCanvas(wsProvider);
      }
    };
  }, [taskId, currentUser, handleAwarenessChange, loadCommentsFromBackend]);

  const canvasRef = useRef<any>(null);

  if (isLoading || !task || !ydoc || !awareness || !currentUser) {
    return (
      <div className="h-full w-full flex flex-col bg-background">
        <div className="slim-progress-bar" />
        <div className="h-16 border-b border-border/40 bg-card px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
             <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="font-display font-black text-2xl tracking-tight text-foreground/20 uppercase">Syncing Canvas</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden overscroll-none bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-dot-grid opacity-[0.1] pointer-events-none z-0" />

      {!isSynced && <div className="slim-progress-bar" />}

      {/* Precision Top Bar */}
      <div className="relative z-30 px-2 pt-2 sm:px-0 sm:pt-0">
        <CanvasTopBar
          task={task}
          awarenessUsers={awarenessUsers}
          onTaskUpdate={(updates) => setTask((prev) => prev ? { ...prev, ...updates } : prev)}
          isScratchpadOpen={isScratchpadOpen}
          onToggleScratchpad={() => setScratchpadOpen(!isScratchpadOpen)}
        />
      </div>

      <ScratchpadPanel
        isOpen={isScratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
      />

      <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <CanvasStage
            ref={canvasRef}
            taskId={taskId!}
            ydoc={ydoc}
            awareness={awareness as any}
            currentUser={currentUser}
            activeTool={activeTool}
            activeCommentId={activeCommentId}
            onToolChange={setActiveTool as any}
            onPinClick={(id: string | null) => setActiveComment(id)}
            showComments={isCommentPaneOpen}
          />

          <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-[min(calc(100%-1rem),720px)] -translate-x-1/2 sm:bottom-8">
            <CanvasToolbar
              taskId={taskId!}
              ydoc={ydoc}
              currentUser={currentUser}
              activeTool={activeTool}
              onToolChange={setActiveTool as any}
              onToggleComments={toggleCommentPane}
              showComments={isCommentPaneOpen}
              zoomLevel={zoom}
              onZoomIn={() => setZoom(Math.min(zoom * 1.25, 3))}
              onZoomOut={() => setZoom(Math.max(zoom / 1.25, 0.2))}
              onZoomReset={() => setZoom(1)}
              onFitToView={() => canvasRef.current?.fitToView()}
            />
          </div>
        </div>

        <AnimatePresence>
          {isCommentPaneOpen && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-2 bottom-2 top-2 z-20 flex flex-col overflow-hidden rounded-[28px] border border-border/40 bg-card/80 shadow-2xl shadow-primary/5 backdrop-blur-3xl md:bottom-4 md:right-4 md:top-4 md:left-auto md:w-[340px] md:rounded-[32px]"
            >
              <CommentPane
                taskId={taskId!}
                ydoc={ydoc}
                currentUser={currentUser}
                activeCommentId={activeCommentId}
                onCommentClick={(id) => setActiveComment(id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
