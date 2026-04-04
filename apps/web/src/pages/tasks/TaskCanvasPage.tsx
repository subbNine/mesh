import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
    
    // Use native fetch to avoid Axios serialization issues with binary data
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

  // Responsive: Hide comment pane by default on smaller screens (< 1400px)
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
      <div className="h-full w-full flex flex-col" style={{ background: '#eef0f3' }}>
        <div className="slim-progress-bar" />
        {/* Skeleton top bar */}
        <div className="h-[52px] border-b border-border bg-card px-5 flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded-md bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-10 h-10 border-2 border-muted border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading canvas…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#f5f5f5' }}>
      {!isSynced && <div className="slim-progress-bar" />}
      <CanvasTopBar
        task={task}
        awarenessUsers={awarenessUsers}
        onTaskUpdate={(updates) => setTask(prev => prev ? { ...prev, ...updates } : prev)}
      />

      <div className="flex-1 relative flex overflow-hidden">
        {/* Main canvas area */}
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

        {/* Sliding comment panel — 280px, matches mockup */}
        {isCommentPaneOpen && (
          <div
            className="w-[280px] flex-shrink-0 border-l border-zinc-200/80 bg-white shadow-[-4px_0_16px_rgba(0,0,0,0.04)] relative z-20 flex flex-col"
            style={{ animation: 'slideInRight 0.18s ease-out' }}
          >
            <CommentPane 
              taskId={taskId!} 
              ydoc={ydoc} 
              currentUser={currentUser} 
              activeCommentId={activeCommentId} 
              onCommentClick={(id) => {
                setActiveComment(id);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
