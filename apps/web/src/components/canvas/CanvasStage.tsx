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

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  content?: string;
  backgroundColor?: string;
  zIndex: number;
  createdBy: string;
  createdAt: string;
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

const URLImage = ({ src, ...props }: any) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = new globalThis.Image();
    image.src = src;
    image.crossOrigin = 'Anonymous';
    image.onload = () => setImg(image);
  }, [src]);

  if (!img) {
    return <Rect fill="#e4e4e7" {...props} />;
  }
  return <KonvaImage image={img} {...props} />;
};

let _canvasUndoManager: Y.UndoManager | null = null;
export const getCanvasUndoManager = () => _canvasUndoManager;

// Helper to create a dot grid pattern
const createGridPattern = (_color: string) => {
  const canvas = globalThis.document.createElement('canvas');
  // const ctx = canvas.getContext('2d');
  const size = 20; // grid spacing
  canvas.width = size;
  canvas.height = size;

  // if (ctx) {
  // ctx.fillStyle = color;
  // ctx.beginPath();
  // ctx.arc(1, 1, 0.8, 0, Math.PI * 2);
  // ctx.fill();
  // }
  return canvas;
};

const RemoteCursor: React.FC<{ state: any }> = ({ state }) => {
  const [pos, setPos] = useState({ x: state.cursor?.x || 0, y: state.cursor?.y || 0 });
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const animate = () => {
      if (!state.cursor) return;
      
      setPos(prev => {
        const dx = state.cursor.x - prev.x;
        const dy = state.cursor.y - prev.y;
        
        // If distance is very small, just snap
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
          return state.cursor;
        }
        
        // Lerp factor (0.2 for smooth following)
        return {
          x: prev.x + dx * 0.2,
          y: prev.y + dy * 0.2
        };
      });
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state.cursor]);

  if (!state.cursor) return null;

  const initials = state.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';

  return (
    <Group x={pos.x} y={pos.y} listening={false}>
      {/* Cursor Arrow */}
      <Path
        data="M0,0 L0,18 L5,13 L11,13 Z"
        fill={state.color}
        stroke="white"
        strokeWidth={1.5}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={4}
        shadowOffsetY={2}
      />
      {/* Name Label */}
      <Group x={12} y={12}>
        <Rect
          width={state.name.length * 7 + 10}
          height={20}
          fill={state.color}
          cornerRadius={4}
          shadowColor="rgba(0,0,0,0.1)"
          shadowBlur={2}
        />
        <Text
          text={state.name}
          fill="white"
          fontSize={11}
          fontStyle="bold"
          padding={5}
          y={-1}
        />
      </Group>
    </Group>
  );
};

export const CanvasStage = forwardRef<any, CanvasStageProps>(({
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
  
  // Expose fitToView to parent
  useImperativeHandle(ref, () => ({
    fitToView: () => {
      // Find bounding box of all elements
      const yElements = ydoc.getArray<Y.Map<any>>('elements').toArray().map(m => m.toJSON() as CanvasElement);
      if (yElements.length === 0) {
        setStageProps({ scale: 1, x: 0, y: 0 });
        setStoreZoom(1);
        return;
      }

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      yElements.forEach(el => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + (el.width || 300));
        maxY = Math.max(maxY, el.y + (el.height || 200));
      });

      const padding = 100;
      const width = (maxX - minX) + padding * 2;
      const height = (maxY - minY) + padding * 2;
      
      const stageWidth = globalThis.innerWidth;
      const stageHeight = globalThis.innerHeight;

      const scale = Math.min(
        Math.max(Math.min(stageWidth / width, stageHeight / height), 0.2),
        2
      );

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setStageProps({
        scale,
        x: stageWidth / 2 - centerX * scale,
        y: stageHeight / 2 - centerY * scale,
      });
      setStoreZoom(scale);
    }
  }));
  const layerRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draftCommentPos, setDraftCommentPos] = useState<{ 
    screenX: number, 
    screenY: number, 
    canvasX: number, 
    canvasY: number,
    elementId?: string,
    relX?: number,
    relY?: number
  } | null>(null);

  const [stageProps, setStageProps] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [drawingPoints, setDrawingPoints] = useState<number[] | null>(null);

  const storeZoom = useCanvasStore((state: any) => state.zoom);
  const setStoreZoom = useCanvasStore((state: any) => state.setZoom);

  // Memoize grid pattern to prevent re-creation on every render
  const gridPattern = useMemo(() => createGridPattern('#828282'), []);

  useEffect(() => {
    if (Math.abs(storeZoom - stageProps.scale) > 0.001) {
      if (storeZoom === 1) {
        // Reset: Reset scale to 1 and center the canvas if no selection, 
        // or just reset scale at current center
        const center = { x: globalThis.innerWidth / 2, y: globalThis.innerHeight / 2 };
        const relatedTo = {
          x: (center.x - stageProps.x) / stageProps.scale,
          y: (center.y - stageProps.y) / stageProps.scale,
        };

        setStageProps({
          scale: 1,
          x: center.x - relatedTo.x,
          y: center.y - relatedTo.y,
        });
        return;
      }

      const center = { x: globalThis.innerWidth / 2, y: globalThis.innerHeight / 2 };
      const relatedTo = {
        x: (center.x - stageProps.x) / stageProps.scale,
        y: (center.y - stageProps.y) / stageProps.scale,
      };

      setStageProps({
        scale: storeZoom,
        x: center.x - relatedTo.x * storeZoom,
        y: center.y - relatedTo.y * storeZoom,
      });
    }
  }, [storeZoom]);

  useEffect(() => {
    const yElements = ydoc.getArray<Y.Map<any>>('elements');
    const yComments = ydoc.getArray<Y.Map<any>>('comments');

    _canvasUndoManager = new Y.UndoManager(yElements);

    const updateElements = () => {
      const parsed = yElements.toArray().map((map) => map.toJSON() as CanvasElement);
      parsed.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      setElements(parsed);
    };

    const updateComments = () => {
      const parsed = yComments.toArray().map((map) => map.toJSON() as CanvasComment);
      setComments(parsed);
    };

    yElements.observeDeep(updateElements);
    yComments.observeDeep(updateComments);

    updateElements();
    updateComments();

    return () => {
      yElements.unobserveDeep(updateElements);
      yComments.unobserveDeep(updateComments);
      if (_canvasUndoManager) {
        _canvasUndoManager.destroy();
        _canvasUndoManager = null;
      }
    };
  }, [ydoc]);

  useEffect(() => {
    const handleAwarenessUpdate = () => {
      const states = Array.from(awareness.getStates().values());
      const filtered = states.filter(s => s.userId !== currentUser.id && s.cursor);
      setRemoteUsers(filtered);
    };

    awareness.on('change', handleAwarenessUpdate);
    return () => {
      awareness.off('change', handleAwarenessUpdate);
    };
  }, [awareness, currentUser.id]);

  const handleMouseLeave = () => {
    awareness.setLocalStateField('cursor', null);
  };

  useEffect(() => {
    if (selectedId && trRef.current && layerRef.current) {
      const node = layerRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedId, elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedId(null);
        setEditingId(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingId) {
        deleteElement(selectedId);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId]);

  const deleteElement = (id: string) => {
    ydoc.transact(() => {
      const yElements = ydoc.getArray<Y.Map<any>>('elements');
      const idx = yElements.toArray().findIndex((m) => m.get('id') === id);
      if (idx !== -1) {
        yElements.delete(idx, 1);
      }
    });
    setSelectedId(null);
    triggerSnapshot();
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    if (!stageRef.current) return;

    // Zoom logic around cursor
    const stage = stageRef.current;
    const scaleBy = 1.05;
    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // calculate new zoom and clamp it
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.2), 3);

    // immediately update local stage constraints
    setStageProps({
      scale: clampedScale,
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });

    // synchronously notify Zustand store without triggering the zoom sync effect loop
    setStoreZoom(clampedScale);
  };

  const finalizeDrawing = async (points: number[]) => {
    if (points.length < 4) return;

    // Find if we're drawing over an existing image
    const stage = stageRef.current;
    if (!stage) return;

    // Find the element at the starting point to see if it's an image
    const startX = points[0];
    const startY = points[1];
    
    // Check elements in reverse z-order to find the top one
    const targetEl = [...elements].reverse().find(el => 
      el.type === 'image' && 
      startX >= el.x && startX <= el.x + el.width &&
      startY >= el.y && startY <= el.y + el.height
    );

    if (targetEl) {
      // Merge with existing image
      const img = new globalThis.Image();
      img.crossOrigin = 'Anonymous';
      img.src = targetEl.content!;
      await new Promise(resolve => img.onload = resolve);

      const offscreenCanvas = globalThis.document.createElement('canvas');
      offscreenCanvas.width = targetEl.width;
      offscreenCanvas.height = targetEl.height;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetEl.width, targetEl.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0] - targetEl.x, points[1] - targetEl.y);
        for (let i = 2; i < points.length; i += 2) {
          ctx.lineTo(points[i] - targetEl.x, points[i+1] - targetEl.y);
        }
        ctx.stroke();

        const dataUrl = offscreenCanvas.toDataURL();
        ydoc.transact(() => {
          const yElements = ydoc.getArray<Y.Map<any>>('elements');
          const map = yElements.toArray().find((m) => m.get('id') === targetEl.id);
          if (map) {
            map.set('content', dataUrl);
          }
        });
      }
    } else {
      // Create new image from drawing
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < points.length; i += 2) {
        minX = Math.min(minX, points[i]);
        minY = Math.min(minY, points[i+1]);
        maxX = Math.max(maxX, points[i]);
        maxY = Math.max(maxY, points[i+1]);
      }

      const padding = 5;
      const width = (maxX - minX) + padding * 2;
      const height = (maxY - minY) + padding * 2;

      const offscreenCanvas = globalThis.document.createElement('canvas');
      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0] - minX + padding, points[1] - minY + padding);
        for (let i = 2; i < points.length; i += 2) {
          ctx.lineTo(points[i] - minX + padding, points[i+1] - minY + padding);
        }
        ctx.stroke();

        const dataUrl = offscreenCanvas.toDataURL();
        ydoc.transact(() => {
          const elementsArray = ydoc.getArray<Y.Map<any>>('elements');
          const element = new Y.Map();
          element.set('id', crypto.randomUUID());
          element.set('type', 'image');
          element.set('content', dataUrl);
          element.set('x', minX - padding);
          element.set('y', minY - padding);
          element.set('width', width);
          element.set('height', height);
          element.set('zIndex', elementsArray.length);
          element.set('createdBy', currentUser.id);
          element.set('createdAt', new Date().toISOString());
          elementsArray.push([element]);
        });
      }
    }
    triggerSnapshot();
  };

  const snapshotTimeoutRef = useRef<any>(null);
  const triggerSnapshot = useCallback(() => {
    if (snapshotTimeoutRef.current) clearTimeout(snapshotTimeoutRef.current);
    snapshotTimeoutRef.current = setTimeout(async () => {
      if (!stageRef.current) return;
      try {
        const dataUrl = stageRef.current.toDataURL({ pixelRatio: 1 });
        const blob = await (await fetch(dataUrl)).blob();
        const formData = new FormData();
        formData.append('file', blob, 'snapshot.png');
        await api.post(`/canvas/${taskId}/snapshot`, formData);
      } catch (err) {
        console.error('Failed to trigger snapshot upload:', err);
      }
    }, 3000);
  }, [taskId]);

  const textTool = useTextTool({
    ydoc,
    userId: currentUser.id,
    onBoxCreated: (box) => {
      setSelectedId(box.id);
      setEditingId(box.id);
      triggerSnapshot();
    },
    onToolExit: () => {
      if (onToolChange) onToolChange('select');
    }
  });

  const handlePointerDown = (e: KonvaEventObject<MouseEvent>) => {
    if (!stageRef.current) return;
    const pos = stageRef.current.getRelativePointerPosition();
    if (!pos) return;

    if (activeTool === 'select') {
      const isStage = e.target === stageRef.current;
      if (isStage) setSelectedId(null);
    } else if (activeTool === 'text') {
      textTool.handleMouseDown(e, stageRef.current);
    } else if (activeTool === 'comment') {
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      const hit = stage.getIntersection(pointerPos);
      
      // Determine if hit is over one of our elements
      const elementUnderCursor = hit && hit.attrs.id && elements.find(el => el.id === hit.attrs.id);

      if (elementUnderCursor && pointerPos && pos) {
        setDraftCommentPos({
          screenX: pointerPos.x,
          screenY: pointerPos.y,
          canvasX: pos.x,
          canvasY: pos.y,
          elementId: elementUnderCursor.id,
          relX: pos.x - elementUnderCursor.x,
          relY: pos.y - elementUnderCursor.y
        });
      }
      if (onToolChange) onToolChange('select');
    } else if (activeTool === 'pencil') {
      setDrawingPoints([pos.x, pos.y]);
    }
  };

  const lastPointerMoveRef = useRef<number>(0);
  const handlePointerMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    
    // Throttle awareness updates (50ms)
    const now = Date.now();
    if (now - lastPointerMoveRef.current > 50) {
      if (pos) {
        awareness.setLocalStateField('cursor', { x: pos.x, y: pos.y });
      }
      lastPointerMoveRef.current = now;
    }

    if (pos) {
      // Logic for changing cursor based on tool and element hit
      if (activeTool === 'comment') {
        const hit = stage.getIntersection(stage.getPointerPosition()!);
        const isElement = hit && hit.attrs.id && elements.some(el => el.id === hit.attrs.id);
        stage.container().style.cursor = isElement ? 'cell' : 'not-allowed';
      }

      if (activeTool === 'text') {
        textTool.handleMouseMove(e, stageRef.current);
      } else if (activeTool === 'pencil' && drawingPoints) {
        setDrawingPoints([...drawingPoints, pos.x, pos.y]);
      }
    }
  };

  const handlePointerUp = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'text') {
      textTool.handleMouseUp(e, stageRef.current);
    } else if (activeTool === 'pencil' && drawingPoints) {
      finalizeDrawing(drawingPoints);
      setDrawingPoints(null);
    }
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, x, y } : el
    ));
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const id = e.target.id();
    const x = e.target.x();
    const y = e.target.y();

    ydoc.transact(() => {
      const yElements = ydoc.getArray<Y.Map<any>>('elements');
      const map = yElements.toArray().find((m) => m.get('id') === id);
      if (map) {
        map.set('x', x);
        map.set('y', y);
      }
    });
    triggerSnapshot();
  };

  const handleTransform = () => {
    if (!selectedId || !trRef.current) return;
    const node = layerRef.current.findOne(`#${selectedId}`);
    if (!node) return;

    node.setAttrs({
      width: Math.max(5, node.width() * node.scaleX()),
      height: Math.max(5, node.height() * node.scaleY()),
      scaleX: 1,
      scaleY: 1,
    });

    setElements(prev => prev.map(el =>
      el.id === selectedId
        ? { ...el, x: node.x(), y: node.y(), width: node.width(), height: node.height(), rotation: node.rotation() }
        : el
    ));
  };

  const handleTransformEnd = () => {
    if (!selectedId || !trRef.current) return;
    const node = layerRef.current.findOne(`#${selectedId}`);
    if (!node) return;

    ydoc.transact(() => {
      const yElements = ydoc.getArray<Y.Map<any>>('elements');
      const map = yElements.toArray().find((m) => m.get('id') === selectedId);
      if (map) {
        map.set('x', node.x());
        map.set('y', node.y());
        map.set('width', node.width());
        map.set('height', node.height());
        map.set('rotation', node.rotation());
      }
    });

    trRef.current.nodes([node]);
    trRef.current.getLayer().batchDraw();
    triggerSnapshot();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      const fileUrl = URL.createObjectURL(file);
      const img = new globalThis.Image();
      img.src = fileUrl;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down if it's too large, preserving aspect ratio
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Map drop coordinate to canvas coordinate
        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getPointerPosition() || { x: e.clientX, y: e.clientY };
        const canvasX = (pointer.x - stageProps.x) / stageProps.scale;
        const canvasY = (pointer.y - stageProps.y) / stageProps.scale;

        ydoc.transact(() => {
          const elementsArray = ydoc.getArray<Y.Map<any>>('elements');
          const element = new Y.Map();
          element.set('id', crypto.randomUUID());
          element.set('type', 'image');
          element.set('content', fileUrl);
          element.set('x', canvasX - width / 2); // Center image on cursor
          element.set('y', canvasY - height / 2);
          element.set('width', width);
          element.set('height', height);
          element.set('zIndex', elementsArray.length);
          element.set('createdBy', currentUser.id);
          element.set('createdAt', new Date().toISOString());
          elementsArray.push([element]);
        });
        triggerSnapshot();
      };
    } catch (err) {
      console.error('Failed to handle dropped image', err);
    }
  };

  return (
    <div className={`w-full h-full relative overflow-hidden ${activeTool === 'text' ? 'cursor-crosshair' : activeTool === 'comment' ? 'cursor-cell' : ''}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        // backgroundColor: '#f5f5f5',
        backgroundImage: 'radial-gradient(#828282 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        backgroundPosition: `${stageProps.x}px ${stageProps.y}px`
      }}
    >

      <Stage
        width={globalThis.innerWidth}
        height={globalThis.innerHeight}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handleMouseLeave}
        onDragMove={(e) => {
          // Only sync when the stage itself is being dragged (panning), not child nodes
          const stage = stageRef.current;
          if (stage && e.target === stage) {
            setStageProps(prev => ({ ...prev, x: stage.x(), y: stage.y() }));
          }
        }}
        onDragEnd={(e) => {
          const stage = stageRef.current;
          if (stage && e.target === stage) {
            setStageProps(prev => ({ ...prev, x: stage.x(), y: stage.y() }));
          }
        }}
        scaleX={stageProps.scale}
        scaleY={stageProps.scale}
        x={stageProps.x}
        y={stageProps.y}
        draggable={activeTool === 'select'}
        ref={stageRef}
      >
        {/* Grid Layer */}
        <Layer listening={false}>
          <Rect
            x={-stageProps.x / stageProps.scale}
            y={-stageProps.y / stageProps.scale}
            width={globalThis.innerWidth / stageProps.scale}
            height={globalThis.innerHeight / stageProps.scale}
            fillPatternImage={gridPattern as any}
            // fillPatternScale={{ x: 1 / stageProps.scale, y: 1 / stageProps.scale }}
            fillPatternOffset={{ x: 0, y: 0 }}
          />
        </Layer>

        <Layer ref={layerRef}>
          {elements.map((el) => {
            if (el.type === 'text') {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width || 200}
                  height={el.height || 60}
                  rotation={el.rotation || 0}
                  fill="transparent"
                  stroke={selectedId === el.id ? "#3b82f6" : "transparent"}
                  strokeWidth={1}
                  draggable={activeTool === 'select' && editingId !== el.id}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                    if (activeTool === 'select') {
                      setSelectedId(el.id);
                    }
                  }}
                  onDblClick={() => setEditingId(el.id)}
                />
              );
            }
            if (el.type === 'image') {
              return (
                <URLImage
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  src={el.content}
                  draggable={activeTool === 'select'}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onClick={() => activeTool === 'select' && setSelectedId(el.id)}
                />
              );
            }
            return null;
          })}

          {showComments && comments.map((comment) => {
            const isResolved = !!comment.resolvedAt;
            const isActive = activeCommentId === comment.id;
            const opacity = isResolved ? 0.6 : 1;

            let x = comment.canvasX;
            let y = comment.canvasY;

            // Anchor comment to element relative position if stored
            if (comment.elementId) {
              const parent = elements.find(el => el.id === comment.elementId);
              if (parent) {
                if (typeof comment.relX === 'number' && typeof comment.relY === 'number') {
                  x = parent.x + comment.relX;
                  y = parent.y + comment.relY;
                }
              }
            }

            return (
              <Group
                key={comment.id}
                x={x}
                y={y}
                onClick={(e) => {
                  e.cancelBubble = true;
                  onPinClick(comment.id);
                }}
                onMouseEnter={() => document.body.style.cursor = 'pointer'}
                onMouseLeave={() => document.body.style.cursor = 'default'}
                opacity={opacity}
                scaleX={isActive ? 1.15 : 1}
                scaleY={isActive ? 1.15 : 1}
              >
                {isActive && (
                  <Circle
                    radius={20}
                    stroke={comment.color}
                    strokeWidth={2}
                    opacity={0.4}
                  />
                )}
                <Circle
                  radius={16}
                  fill={isResolved ? '#9ca3af' : comment.color}
                  shadowColor="#000"
                  shadowBlur={isActive ? 12 : 4}
                  shadowOpacity={0.2}
                  shadowOffsetY={2}
                />
                <Text text={comment.initials} x={-8} y={-6} fill="#fff" fontSize={14} fontStyle="bold" />
                {(!isResolved && comment.replyCount > 0) && (
                  <Group x={10} y={-10}>
                    <Circle radius={8} fill="#ef4444"
                      shadowColor="#000" shadowBlur={2} shadowOpacity={0.2} shadowOffsetY={1} />
                    <Text text={comment.replyCount.toString()} x={-4} y={-4.5} fill="#fff" fontSize={10} fontStyle="bold" />
                  </Group>
                )}
              </Group>
            );
          })}

          {remoteUsers.map((userState, idx) => (
            <RemoteCursor key={userState.userId || idx} state={userState} />
          ))}

          {textTool.previewRect && (
            <Rect
              x={textTool.previewRect.x}
              y={textTool.previewRect.y}
              width={textTool.previewRect.width}
              height={textTool.previewRect.height}
              fill="rgba(12,163,186,0.1)"
              stroke="#0ca3ba"
              strokeWidth={1.5}
              dash={[4, 4]}
            />
          )}

          {drawingPoints && (
            <Line
              points={drawingPoints}
              stroke="#000000"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {selectedId && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }} onTransform={handleTransform} onTransformEnd={handleTransformEnd} />}
        </Layer>
      </Stage>
      {elements.filter(el => el.type === 'text').map((el) => (
        <RichTextOverlay
          key={`html-${el.id}`}
          el={el}
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
          canvasX={draftCommentPos.canvasX}
          canvasY={draftCommentPos.canvasY}
          onCancel={() => setDraftCommentPos(null)}
          onSubmit={async (body) => {
            try {
              const res = await api.post(`/comments`, {
                taskId,
                body,
                canvasX: draftCommentPos.canvasX,
                canvasY: draftCommentPos.canvasY,
                elementId: draftCommentPos.elementId,
                relX: draftCommentPos.relX,
                relY: draftCommentPos.relY,
              });

              ydoc.transact(() => {
                const yComments = ydoc.getArray<Y.Map<any>>('comments');
                const commentMap = new Y.Map();
                commentMap.set('id', res.data.id);
                commentMap.set('canvasX', res.data.canvasX);
                commentMap.set('canvasY', res.data.canvasY);
                commentMap.set('elementId', draftCommentPos.elementId);
                commentMap.set('relX', draftCommentPos.relX);
                commentMap.set('relY', draftCommentPos.relY);
                commentMap.set('authorId', currentUser.id);
                const initials = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase().substring(0, 2);
                commentMap.set('initials', initials);
                commentMap.set('color', getUserColor(currentUser.id));
                commentMap.set('replyCount', 0);
                commentMap.set('resolvedAt', null);
                yComments.push([commentMap]);
              });

              const store = useCanvasStore.getState?.() as any;
              if (store) {
                store.setActiveComment?.(res.data.id);
                if (!store.isCommentPaneOpen) {
                  store.toggleCommentPane?.();
                }
              }
            } catch (e) {
              console.error('Failed to create comment', e);
            }
            setDraftCommentPos(null);
          }}
        />
      )}
    </div>
  );
});

CanvasStage.displayName = 'CanvasStage';

