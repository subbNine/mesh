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
import { CommentPane } from '../../components/comments/CommentPane';

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
    if (globalThis.innerWidth < 1400 && isCommentPaneOpen) {
      setCommentPaneOpen(false);
    }
  }, []);

  const handleAwarenessChange = useCallback((aw: Awareness) => {
    const states = Array.from(aw.getStates().entries());
    const activeUsers = states
      .filter(([, state]) => state.userId)
      .map(([clientId, state]) => ({
        clientId,
        ...state
      }));
    setAwarenessUsers(activeUsers);
  }, [setAwarenessUsers]);

  const loadCommentsFromBackend = useCallback(async (doc: Y.Doc) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      if (data && Array.isArray(data)) {
        doc.transact(() => {
          const commentsArr = doc.getArray<Y.Map<any>>('comments');
          if (commentsArr.length === 0) {
            for (const c of data) {
              const cm = new Y.Map();
              for (const [k, v] of Object.entries(c)) {
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

    let wsProvider: WebsocketProvider;
    let debounceTimer: ReturnType<typeof setTimeout>;
    let currentAwareness: Awareness | null = null;

    const handleDocUpdate = (doc: Y.Doc) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        saveCanvasState(doc, taskId);
      }, 1500);
    };

    const init = async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const { ydoc: doc, provider: prov, awareness: aw } = connectToCanvas(taskId, token);
        
        wsProvider = prov;
        currentAwareness = aw;
        setYdoc(doc);
        setAwareness(aw);

        prov.on('sync', (isSynced: boolean) => {
          setIsSynced(isSynced);
        });

        aw.setLocalState({
          userId: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          avatarUrl: currentUser.avatarUrl,
          color: getUserColor(currentUser.id),
          cursor: null
        });

        aw.on('change', () => handleAwarenessChange(aw));
        doc.on('update', () => handleDocUpdate(doc));

        const res = await api.get(`/tasks/${taskId}`);
        setTask(res.data);

        await loadCommentsFromBackend(doc);

      } catch (err) {
        console.error('Failed to initialize canvas page', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      clearTimeout(debounceTimer);
      if (wsProvider) disconnectFromCanvas(wsProvider);
      if (currentAwareness) {
        currentAwareness.setLocalState(null);
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
            <h3 className="font-display font-black text-2xl tracking-tight text-foreground/20 uppercase">Syncing Blueprint</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative bg-background">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-dot-grid opacity-[0.1] pointer-events-none z-0" />

      {!isSynced && <div className="slim-progress-bar" />}
      
      {/* Precision Top Bar */}
      <div className="relative z-30">
        <CanvasTopBar
            task={task}
            awarenessUsers={awarenessUsers}
            onTaskUpdate={(updates) => setTask(prev => prev ? { ...prev, ...updates } : prev)}
        />
      </div>

      <div className="flex-1 relative flex overflow-hidden z-10">
        {/* Main Workspace Stage */}
        <div className="flex-1 relative overflow-hidden">
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

          {/* Floating Tool Dock */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
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

        {/* Floating Discussion Pane */}
        <AnimatePresence>
            {isCommentPaneOpen && (
                <motion.div
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-[340px] flex-shrink-0 bg-card/60 backdrop-blur-3xl border-l border-border/40 relative z-20 flex flex-col m-4 rounded-[32px] shadow-2xl overflow-hidden shadow-primary/5"
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
