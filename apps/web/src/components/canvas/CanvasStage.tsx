import Konva from 'konva';
import React, { useEffect, useState, useRef, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as Y from 'yjs';
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Group, Circle, Rect, Line, Path } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Awareness } from 'y-protocols/awareness';
import { RichTextOverlay } from './RichTextOverlay';
import { useTextTool } from './useTextTool';
import { api } from '../../lib/api';
import type { IUser } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { CommentCompose } from '../comments/CommentCompose';
import { getUserColor } from '../../lib/user-color';

let _canvasUndoManager: Y.UndoManager | null = null;
export const getCanvasUndoManager = () => _canvasUndoManager;

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  content?: string;
  backgroundColor?: string;
  zIndex: number;
  createdBy: string;
  createdAt: string;
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  parentId?: string;
  relX?: number;
  relY?: number;
  relW?: number;
  relH?: number;
}

interface CanvasComment {
  id: string;
  canvasX: number;
  canvasY: number;
  authorId: string;
  initials: string;
  color: string;
  replyCount: number;
  resolvedAt: string | null;
  elementId?: string;
  relX?: number;
  relY?: number;
}

interface CanvasStageProps {
  taskId: string;
  ydoc: Y.Doc;
  awareness: Awareness;
  currentUser: IUser;
  activeTool: string;
  activeCommentId?: string | null;
  onToolChange?: (tool: string) => void;
  onPinClick: (commentId: string) => void;
  showComments?: boolean;
}

const imagePreviewCache = new Map<string, HTMLImageElement>();

const URLImage = React.memo(({ src, width, height, isSelected, ...props }: any) => {
  const [img, setImg] = useState<HTMLImageElement | null>(imagePreviewCache.get(src) || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (img || !src) return;
    const image = new globalThis.Image();
    image.src = src;
    image.crossOrigin = 'Anonymous';
    image.onload = () => {
      imagePreviewCache.set(src, image);
      setImg(image);
    };
    image.onerror = () => setError(true);
  }, [src, img]);

  if (error) {
    return (
      <Group {...props}>
        <Rect width={width} height={height} fill="#fee2e2" stroke="#ef4444" strokeWidth={isSelected ? 2 : 1} />
        <Text text="⚠" width={width} height={height} align="center" verticalAlign="middle" fill="#ef4444" fontSize={24} />
      </Group>
    );
  }

  if (!img) {
    return (
      <Group {...props}>
        <Rect width={width} height={height} fill="#f4f4f5" stroke={isSelected ? "#3b82f6" : "transparent"} strokeWidth={2} />
      </Group>
    );
  }
  return <KonvaImage image={img} width={width} height={height} {...props} />;
});

const CanvasElementView = React.memo(({ 
  el, 
  isSelected, 
  isEditing, 
  activeTool, 
  handleDragMove, 
  handleDragEnd, 
  onSelect, 
  onEdit 
}: {
  el: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  activeTool: string;
  handleDragMove: (e: any) => void;
  handleDragEnd: (e: any) => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
}) => {
  const isSelectTool = activeTool === 'select';

  if (el.type === 'text') {
    return (
      <Rect
        id={el.id}
        x={el.x}
        y={el.y}
        width={el.width || 200}
        height={el.height || 60}
        rotation={el.rotation || 0}
        fill="transparent"
        stroke={isSelected ? "#3b82f6" : "transparent"}
        strokeWidth={1}
        draggable={isSelectTool && !isEditing}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          if (isSelectTool) {
            e.cancelBubble = true;
            onSelect(el.id);
          }
        }}
        onDblClick={() => isSelectTool && onEdit(el.id)}
      />
    );
  }

  if (el.type === 'image') {
    return (
      <URLImage
        id={el.id}
        src={el.content}
        x={el.x}
        y={el.y}
        width={el.width || 300}
        height={el.height || 200}
        rotation={el.rotation || 0}
        isSelected={isSelected}
        draggable={isSelectTool}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={(e: any) => {
          if (isSelectTool) {
            e.cancelBubble = true;
            onSelect(el.id);
          }
        }}
      />
    );
  }
  if (el.type === 'pencil') {
    return (
      <Line
        id={el.id}
        points={el.points || []}
        stroke={el.stroke || '#000'}
        strokeWidth={el.strokeWidth || 2}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        draggable={isSelectTool}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          if (isSelectTool) {
            e.cancelBubble = true;
            onSelect(el.id);
          }
        }}
      />
    );
  }

  return null;
});

const RemoteCursor = React.memo(({ state }: { state: any }) => {
  const posRef = useRef({ x: state.cursor?.x || 0, y: state.cursor?.y || 0 });
  const [pos, setPos] = useState(posRef.current);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const animate = () => {
      if (!state.cursor) return;
      const dx = state.cursor.x - posRef.current.x;
      const dy = state.cursor.y - posRef.current.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        posRef.current = state.cursor;
        setPos(state.cursor);
        return;
      }
      posRef.current = {
        x: posRef.current.x + dx * 0.2,
        y: posRef.current.y + dy * 0.2
      };
      setPos({ ...posRef.current });
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state.cursor]);

  if (!state.cursor) return null;

  return (
    <Group x={pos.x} y={pos.y} listening={false}>
      <Path
        data="M0,0 L0,18 L5,13 L11,13 Z"
        fill={state.color}
        stroke="white"
        strokeWidth={1.5}
      />
      <Group x={12} y={12}>
        <Rect width={state.name.length * 7 + 10} height={20} fill={state.color} cornerRadius={4} />
        <Text text={state.name} fill="white" fontSize={11} fontStyle="bold" padding={5} y={-1} />
      </Group>
    </Group>
  );
});

export const CanvasStage = forwardRef<HTMLDivElement, CanvasStageProps>(({
  taskId,
  ydoc,
  awareness,
  currentUser,
  activeTool,
  activeCommentId,
  onToolChange,
  onPinClick,
  showComments = true,
}, ref) => {
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const dragUpdateTimeoutRef = useRef<number | null>(null);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftCommentPos, setDraftCommentPos] = useState<any | null>(null);
  const [stageProps, setStageProps] = useState({ scale: 1, x: 0, y: 0 });
  const [drawingPoints, setDrawingPoints] = useState<number[] | null>(null);

  const setStoreZoom = useCanvasStore((state: any) => state.setZoom);
  const globalZoom = useCanvasStore((state: any) => state.zoom);

  // Sync global zoom store with local stageProps scale
  useEffect(() => {
    setStageProps(prev => ({ ...prev, scale: globalZoom }));
  }, [globalZoom]);

  // Cleanup drag timeout on unmount
  useEffect(() => {
    return () => {
      if (dragUpdateTimeoutRef.current) {
        clearTimeout(dragUpdateTimeoutRef.current);
      }
    };
  }, []);

  const triggerSnapshot = useCallback(() => {
    setTimeout(async () => {
      if (!stageRef.current) return;
      try {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 });
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, 'snapshot.png');
        await api.post(`/canvas/${taskId}/snapshot`, formData);
      } catch (err) { console.error('Snapshot error', err); }
    }, 2000);
  }, [taskId]);

  useImperativeHandle(ref, () => ({
    fitToView: () => {
      if (elements.length === 0) {
        setStageProps({ scale: 1, x: 0, y: 0 });
        setStoreZoom(1);
        return;
      }
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + (el.width || 0));
        maxY = Math.max(maxY, el.y + (el.height || 0));
      });
      const padding = 100;
      const width = (maxX - minX) + padding * 2;
      const height = (maxY - minY) + padding * 2;
      const sw = globalThis.innerWidth;
      const sh = globalThis.innerHeight;
      const scale = Math.min(Math.max(Math.min(sw / width, sh / height), 0.2), 2);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      setStageProps({ scale, x: sw / 2 - centerX * scale, y: sh / 2 - centerY * scale });
      setStoreZoom(scale);
    }
  }) as any);

  useEffect(() => {
    const yElements = ydoc.getArray<Y.Map<any>>('elements');
    const yComments = ydoc.getArray<Y.Map<any>>('comments');
    _canvasUndoManager = new Y.UndoManager(yElements);
    
    const updateElements = () => {
      const parsed = yElements.toArray().map(m => m.toJSON() as CanvasElement);
      parsed.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      setElements(parsed);
    };
    const updateComments = () => {
      const parsed = yComments.toArray().map(m => m.toJSON() as CanvasComment);
      setComments(parsed);
    };
    yElements.observeDeep(updateElements);
    yComments.observeDeep(updateComments);
    updateElements();
    updateComments();
    return () => {
      yElements.unobserveDeep(updateElements);
      yComments.unobserveDeep(updateComments);
      _canvasUndoManager?.destroy();
      _canvasUndoManager = null;
    };
  }, [ydoc]);

  useEffect(() => {
    const updateAwareness = () => {
      const states = Array.from(awareness.getStates().values());
      setRemoteUsers(states.filter(s => s.userId !== currentUser.id && s.cursor));
    };
    awareness.on('change', updateAwareness);
    return () => awareness.off('change', updateAwareness);
  }, [awareness, currentUser.id]);

  useEffect(() => {
    if (selectedId && trRef.current && layerRef.current) {
      const node = layerRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else {
      trRef.current?.nodes([]);
    }
  }, [selectedId, elements]);

  const handlePointerDown = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (!pos) return;
    if (activeTool === 'select') {
      if (e.target === stage) setSelectedId(null);
    } else if (activeTool === 'text') {
      textTool.handleMouseDown(e, stage);
    } else if (activeTool === 'pencil') {
      setDrawingPoints([pos.x, pos.y]);
    } else if (activeTool === 'comment') {
      const hit = stage.getIntersection(stage.getPointerPosition());
      const el = hit?.attrs.id && elements.find(item => item.id === hit.attrs.id);
      if (el) {
        setDraftCommentPos({
          canvasX: pos.x, canvasY: pos.y, elementId: el.id, relX: pos.x - el.x, relY: pos.y - el.y
        });
      }
      onToolChange?.('select');
    }
  };

  const handlePointerMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (pos) awareness.setLocalStateField('cursor', { x: pos.x, y: pos.y });
    if (activeTool === 'text') textTool.handleMouseMove(e, stage);
    else if (activeTool === 'pencil' && drawingPoints) setDrawingPoints([...drawingPoints, pos!.x, pos!.y]);
  };

  const handlePointerUp = async (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'text') {
      textTool.handleMouseUp(e, stageRef.current);
    } else if (activeTool === 'pencil' && drawingPoints && drawingPoints.length > 4) {
      const points = [...drawingPoints];
      setDrawingPoints(null);

      // 1. Calculate bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < points.length; i += 2) {
        minX = Math.min(minX, points[i]);
        minY = Math.min(minY, points[i+1]);
        maxX = Math.max(maxX, points[i]);
        maxY = Math.max(maxY, points[i+1]);
      }

      const padding = 10;
      const w = maxX - minX + padding * 2;
      const h = maxY - minY + padding * 2;
      const id = crypto.randomUUID();

      // 2. Generate PNG Data URL
      const tempLine = new Konva.Line({
        points: points.map((p, i) => i % 2 === 0 ? p - minX + padding : p - minY + padding),
        stroke: '#000',
        strokeWidth: 2,
        tension: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
      });
      
      const dataUrl = tempLine.toDataURL({
        width: w,
        height: h,
        pixelRatio: 2,
      });

      // 3. Find parent image if drawing overlaps one
      const centerX = minX + w / 2;
      const centerY = minY + h / 2;
      const parent = [...elements].reverse().find(el => 
        el.type === 'image' &&
        centerX >= el.x && centerX <= el.x + (el.width || 0) &&
        centerY >= el.y && centerY <= el.y + (el.height || 0)
      );

      const relX = parent ? (minX - parent.x) / (parent.width || 1) : undefined;
      const relY = parent ? (minY - parent.y) / (parent.height || 1) : undefined;
      const relW = parent ? w / (parent.width || 1) : undefined;
      const relH = parent ? h / (parent.height || 1) : undefined;

      // 4. Add phantom element to Yjs immediately
      ydoc.transact(() => {
        const arr = ydoc.getArray<Y.Map<any>>('elements');
        const element = new Y.Map();
        element.set('id', id);
        element.set('type', 'image');
        element.set('content', dataUrl);
        element.set('x', minX - padding);
        element.set('y', minY - padding);
        element.set('width', w);
        element.set('height', h);
        element.set('opacity', 0.5);
        element.set('zIndex', arr.length);
        element.set('createdBy', currentUser.id);
        element.set('createdAt', new Date().toISOString());
        if (parent) {
          element.set('parentId', parent.id);
          element.set('relX', relX);
          element.set('relY', relY);
          element.set('relW', relW);
          element.set('relH', relH);
        }
        arr.push([element]);
      });

      try {
        // 4. Upload to server
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, 'drawing.png');
        formData.append('taskId', taskId);

        const response = await api.post('/files', formData);
        const { url } = response.data;

        // 5. Update phantom with final URL
        ydoc.transact(() => {
          const arr = ydoc.getArray<Y.Map<any>>('elements');
          const map = arr.toArray().find(m => m.get('id') === id);
          if (map) {
            map.set('content', url);
            map.set('opacity', 1.0);
          }
        });
        triggerSnapshot();
      } catch (err) {
        console.error('Failed to commit drawing as image', err);
        // Clean up on failure
        ydoc.transact(() => {
          const arr = ydoc.getArray<Y.Map<any>>('elements');
          const index = arr.toArray().findIndex(m => m.get('id') === id);
          if (index > -1) arr.delete(index, 1);
        });
      }
    } else {
      setDrawingPoints(null);
    }
  };

  const handleTransform = () => {
    if (!selectedId || !trRef.current) return;
    const node = layerRef.current.findOne(`#${selectedId}`);
    if (!node) return;
    node.setAttrs({
      width: Math.max(5, node.width() * node.scaleX()),
      height: Math.max(5, node.height() * node.scaleY()),
      scaleX: 1, scaleY: 1
    });
  };

  const handleTransformEnd = () => {
    if (!selectedId || !trRef.current) return;
    const node = layerRef.current.findOne(`#${selectedId}`);
    if (!node) return;
    ydoc.transact(() => {
      const arr = ydoc.getArray<Y.Map<any>>('elements');
      const map = arr.toArray().find(m => m.get('id') === selectedId);
      if (map) {
        map.set('x', node.x()); map.set('y', node.y());
        map.set('width', node.width()); map.set('height', node.height());
        map.set('rotation', node.rotation());
      }
    });
    triggerSnapshot();
  };

  const handleDragMove = (e: any) => {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();

    // Immediately update child elements' positions if this is a parent
    const parentElement = elements.find(el => el.id === id);
    if (parentElement) {
      const children = elements.filter(el => el.parentId === id);
      children.forEach(child => {
        const childNode = layerRef.current?.findOne(`#${child.id}`);
        if (childNode) {
          const newX = x + (child.relX || 0) * (parentElement.width || 0);
          const newY = y + (child.relY || 0) * (parentElement.height || 0);
          childNode.setAttrs({ x: newX, y: newY });
        }
      });
      if (children.length > 0) {
        layerRef.current?.batchDraw();
      }
    }

    // Throttle Yjs updates to every 50ms for efficiency
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current);
    }

    dragUpdateTimeoutRef.current = window.setTimeout(() => {
      ydoc.transact(() => {
        const arr = ydoc.getArray<Y.Map<any>>('elements');
        const map = arr.toArray().find(m => m.get('id') === id);
        if (map) {
          if (map.get('parentId')) {
            const parent = elements.find(p => p.id === map.get('parentId'));
            if (parent) {
              map.set('relX', (x - parent.x) / (parent.width || 1));
              map.set('relY', (y - parent.y) / (parent.height || 1));
            }
          } else {
            map.set('x', x);
            map.set('y', y);
          }
        }
      });
    }, 50);
  };

  const handleDragEnd = (e: any) => {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();

    // Clear pending update timeout
    if (dragUpdateTimeoutRef.current) {
      clearTimeout(dragUpdateTimeoutRef.current);
      dragUpdateTimeoutRef.current = null;
    }

    // Final position update to Yjs
    ydoc.transact(() => {
      const arr = ydoc.getArray<Y.Map<any>>('elements');
      const map = arr.toArray().find(m => m.get('id') === id);
      if (map) {
        if (map.get('parentId')) {
          const parent = elements.find(p => p.id === map.get('parentId'));
          if (parent) {
            map.set('relX', (x - parent.x) / (parent.width || 1));
            map.set('relY', (y - parent.y) / (parent.height || 1));
          }
        } else {
          map.set('x', x);
          map.set('y', y);
        }
      }
    });
    triggerSnapshot();
  };

  const toolExit = () => onToolChange?.('select');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = 
        activeEl instanceof HTMLInputElement || 
        activeEl instanceof HTMLTextAreaElement || 
        activeEl?.hasAttribute('contenteditable') ||
        editingId !== null;

      if (isInput) return;

      const key = e.key.toLowerCase();

      // Tool Hotkeys
      if (key === 'v') { e.preventDefault(); onToolChange?.('select'); }
      else if (key === 't') { e.preventDefault(); onToolChange?.('text'); }
      else if (key === 'i') { e.preventDefault(); onToolChange?.('image'); }
      else if (key === 'c') { e.preventDefault(); onToolChange?.('comment'); }
      else if (key === 'p') { e.preventDefault(); onToolChange?.('pencil'); }
      else if (key === 'escape') {
        e.preventDefault();
        onToolChange?.('select');
        setSelectedId(null);
        setEditingId(null);
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) _canvasUndoManager?.redo();
        else _canvasUndoManager?.undo();
      } else if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault();
        _canvasUndoManager?.redo();
      }

      // Deletion
      if (key === 'backspace' || key === 'delete') {
        if (selectedId) {
          e.preventDefault();
          ydoc.transact(() => {
            const arr = ydoc.getArray<Y.Map<any>>('elements');
            const targetIndex = arr.toArray().findIndex(m => m.get('id') === selectedId);
            if (targetIndex > -1) {
              const target = arr.get(targetIndex);
              // Unbind children before deleting the parent
              if (target.get('type') === 'image') {
                const parentX = target.get('x');
                const parentY = target.get('y');
                const parentW = target.get('width') || 1;
                const parentH = target.get('height') || 1;
                
                arr.toArray().forEach((m) => {
                  if (m.get('parentId') === selectedId) {
                    const absX = parentX + (m.get('relX') || 0) * parentW;
                    const absY = parentY + (m.get('relY') || 0) * parentH;
                    const absW = (m.get('relW') || 1) * parentW;
                    const absH = (m.get('relH') || 1) * parentH;
                    
                    m.set('x', absX);
                    m.set('y', absY);
                    m.set('width', absW);
                    m.set('height', absH);
                    m.set('parentId', undefined);
                    m.set('relX', undefined);
                    m.set('relY', undefined);
                    m.set('relW', undefined);
                    m.set('relH', undefined);
                  }
                });
              }
              arr.delete(targetIndex, 1);
              setSelectedId(null);
            }
          });
          triggerSnapshot();
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, onToolChange, ydoc, triggerSnapshot]);

  const textTool = useTextTool({
    ydoc, userId: currentUser.id,
    onBoxCreated: (box) => {
      setSelectedId(box.id); setEditingId(box.id); triggerSnapshot();
    },
    onToolExit: toolExit
  });
  const { previewRect } = textTool;

  const containerCursor = useMemo(() => {
    if (activeTool === 'text') return 'cursor-crosshair';
    if (activeTool === 'comment') return 'cursor-cell';
    return '';
  }, [activeTool]);

  return (
    <div className={`w-full h-full relative overflow-hidden ${containerCursor}`}
      style={{
        backgroundImage: 'radial-gradient(#828282 1px, transparent 1px)',
        backgroundSize: '20px 20px', backgroundPosition: `${stageProps.x}px ${stageProps.y}px`
      }}
    >
      <Stage
        width={globalThis.innerWidth} height={globalThis.innerHeight}
        scaleX={stageProps.scale} scaleY={stageProps.scale}
        x={stageProps.x} y={stageProps.y}
        draggable={activeTool === 'select'}
        ref={stageRef}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
        onDragMove={(e) => {
          if (e.target === stageRef.current) {
            setStageProps(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
          }
        }}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStageProps(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
          }
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          const stage = stageRef.current;
          const oldScale = stage.scaleX();
          const pointer = stage.getPointerPosition();
          const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
          const newScale = e.evt.deltaY < 0 ? oldScale * 1.05 : oldScale / 1.05;
          const s = Math.min(Math.max(newScale, 0.1), 3);
          setStageProps({ scale: s, x: pointer.x - mousePointTo.x * s, y: pointer.y - mousePointTo.y * s });
          setStoreZoom(s);
        }}
      >
        <Layer ref={layerRef}>
          {elements.map(el => {
            let renderedEl = { ...el };
            if (el.parentId) {
              const parent = elements.find(p => p.id === el.parentId);
              if (parent) {
                renderedEl.x = parent.x + (el.relX || 0) * (parent.width || 0);
                renderedEl.y = parent.y + (el.relY || 0) * (parent.height || 0);
                renderedEl.width = (el.relW || 1) * (parent.width || 1);
                renderedEl.height = (el.relH || 1) * (parent.height || 1);
              }
            }
            return (
              <CanvasElementView
                key={el.id} el={renderedEl}
                isSelected={selectedId === el.id} isEditing={editingId === el.id}
                activeTool={activeTool} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd}
                onSelect={setSelectedId} onEdit={setEditingId}
              />
            );
          })}
          {selectedId && <Transformer ref={trRef} onTransform={handleTransform} onTransformEnd={handleTransformEnd} />}

          {previewRect && (
             <Rect
                x={previewRect.x}
                y={previewRect.y}
                width={previewRect.width}
                height={previewRect.height}
                stroke="#3182ce"
                strokeWidth={2 / stageProps.scale}
                dash={[5, 5]}
             />
          )}

          {showComments && comments.map(c => {
            const el = c.elementId ? elements.find(i => i.id === c.elementId) : null;
            const x = el ? el.x + (c.relX || 0) : c.canvasX;
            const y = el ? el.y + (c.relY || 0) : c.canvasY;
            const isActive = activeCommentId === c.id;
            return (
              <Group key={c.id} x={x} y={y} onClick={() => onPinClick(c.id)}>
                <Circle radius={16} fill={c.color} shadowBlur={isActive ? 10 : 2} />
                <Text text={c.initials} x={-8} y={-6} fill="#fff" fontStyle="bold" />
              </Group>
            );
          })}
        </Layer>
        <Layer listening={false}>
          {remoteUsers.map((u, i) => <RemoteCursor key={u.userId || i} state={u} />)}
          {drawingPoints && <Line points={drawingPoints} stroke="#000" strokeWidth={2} tension={0.5} lineCap="round" />}
        </Layer>
      </Stage>

      {elements.filter(el => el.type === 'text').map(el => (
        <RichTextOverlay
          key={el.id} 
          el={{
            id: el.id,
            x: el.x,
            y: el.y,
            width: el.width || 200,
            height: el.height || 60,
            rotation: el.rotation,
            content: el.content,
            backgroundColor: el.backgroundColor
          }} 
          stageProps={stageProps}
          isEditing={editingId === el.id} 
          onBeginEdit={() => setEditingId(el.id)}
          onEndEdit={() => setEditingId(null)} 
          ydoc={ydoc} 
          isSelected={selectedId === el.id}
        />
      ))}

      {draftCommentPos && (
        <CommentCompose
          screenX={draftCommentPos.canvasX * stageProps.scale + stageProps.x}
          screenY={draftCommentPos.canvasY * stageProps.scale + stageProps.y}
          canvasX={draftCommentPos.canvasX} canvasY={draftCommentPos.canvasY}
          onCancel={() => setDraftCommentPos(null)}
          onSubmit={async (body) => {
            try {
              const res = await api.post('/comments', { 
                taskId, body, canvasX: draftCommentPos.canvasX, canvasY: draftCommentPos.canvasY,
                elementId: draftCommentPos.elementId, relX: draftCommentPos.relX, relY: draftCommentPos.relY
              });
              ydoc.transact(() => {
                const arr = ydoc.getArray<Y.Map<any>>('comments');
                const m = new Y.Map();
                m.set('id', res.data.id); m.set('canvasX', res.data.canvasX); m.set('canvasY', res.data.canvasY);
                m.set('elementId', draftCommentPos.elementId); m.set('relX', draftCommentPos.relX); m.set('relY', draftCommentPos.relY);
                m.set('authorId', currentUser.id); m.set('color', getUserColor(currentUser.id));
                const init = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase().substring(0, 2);
                m.set('initials', init); m.set('replyCount', 0); m.set('resolvedAt', null);
                arr.push([m]);
              });
            } catch (e) { console.error(e); }
            setDraftCommentPos(null);
          }}
        />
      )}
    </div>
  );
});

CanvasStage.displayName = 'CanvasStage';
