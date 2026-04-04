import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { connectToCanvas, disconnectFromCanvas } from '../../lib/ws';
import { useCanvasStore } from '../../store/canvas.store';
import { useAuthStore } from '../../store/auth.store';
import type { ITask } from '@mesh/shared';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';

import { CanvasTopBar } from '../../components/canvas/CanvasTopBar';
import { CanvasToolbar } from '../../components/canvas/CanvasToolbar';
import { CanvasStage, getCanvasUndoManager } from '../../components/canvas/CanvasStage';
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

  const [awarenessUsers, setAwarenessUsers] = useState<any[]>([]);

  const currentUser = useAuthStore(state => state.user);
  
  const {
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    isCommentPaneOpen,
    toggleCommentPane,
    activeCommentId,
    setActiveComment
  } = useCanvasStore();

  const handleAwarenessChange = useCallback((aw: Awareness) => {
    const states = Array.from(aw.getStates().entries());
    const activeUsers = states
      .filter(([, state]) => state.user)
      .map(([clientId, state]) => ({
        clientId,
        ...state.user
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
        setYdoc(doc);
        setAwareness(aw);

        aw.setLocalStateField('user', {
          name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          color: '#3b82f6'
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
    };
  }, [taskId, currentUser, handleAwarenessChange, loadCommentsFromBackend]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'i':
          setActiveTool('image');
          break;
        case 'c':
          setActiveTool('comment');
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault(); // Stop native undo
            const um = getCanvasUndoManager();
            if (e.shiftKey) {
              um?.redo();
            } else {
              um?.undo();
            }
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const um = getCanvasUndoManager();
            um?.redo();
          }
          break;
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);


  if (isLoading || !task || !ydoc || !awareness || !currentUser) {
    return (
      <div className="h-full w-full flex flex-col" style={{ background: '#eef0f3' }}>
        {/* Skeleton top bar */}
        <div className="h-[52px] border-b border-zinc-200/80 bg-white px-5 flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-zinc-200 animate-pulse" />
          <div className="h-4 w-48 rounded-md bg-zinc-200 animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-zinc-100 animate-pulse" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <div className="w-10 h-10 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading canvas…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: '#f5f5f5' }}>
      <CanvasTopBar
        task={task}
        awarenessUsers={awarenessUsers}
        onTaskUpdate={(updates) => setTask(prev => prev ? { ...prev, ...updates } : prev)}
      />

      <div className="flex-1 relative flex overflow-hidden">
        {/* Main canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <CanvasStage
            taskId={taskId!}
            ydoc={ydoc}
            awareness={awareness as any}
            currentUser={currentUser}
            activeTool={activeTool}
            activeCommentId={activeCommentId}
            onToolChange={setActiveTool as any}
            onPinClick={setActiveComment}
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
