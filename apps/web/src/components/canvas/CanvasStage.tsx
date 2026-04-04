import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Group, Circle, Rect } from 'react-konva';
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
const createGridPattern = (color: string) => {
  const canvas = globalThis.document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const size = 20; // grid spacing
  canvas.width = size;
  canvas.height = size;

  if (ctx) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(1, 1, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
};

export const CanvasStage: React.FC<CanvasStageProps> = ({
  taskId,
  ydoc,
  awareness,
  currentUser,
  activeTool,
  activeCommentId,
  onToolChange,
  onPinClick,
  showComments = true,
}) => {
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [cursors, setCursors] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draftCommentPos, setDraftCommentPos] = useState<{ screenX: number, screenY: number, canvasX: number, canvasY: number } | null>(null);

  const [stageProps, setStageProps] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const storeZoom = useCanvasStore((state: any) => state.zoom);
  const setStoreZoom = useCanvasStore((state: any) => state.setZoom);

  // Memoize grid pattern to prevent re-creation on every render
  const gridPattern = useMemo(() => createGridPattern('#757575'), []);

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

    yElements.observe(updateElements);
    yComments.observe(updateComments);

    updateElements();
    updateComments();

    return () => {
      yElements.unobserve(updateElements);
      yComments.unobserve(updateComments);
      if (_canvasUndoManager) {
        _canvasUndoManager.destroy();
        _canvasUndoManager = null;
      }
    };
  }, [ydoc]);

  useEffect(() => {
    const handleAwarenessUpdate = () => {
      const states = Array.from(awareness.getStates().entries());
      const newCursors: any[] = [];
      states.forEach(([clientId, state]) => {
        if (clientId !== awareness.clientID && state.user && state.cursor) {
          newCursors.push({
            clientId,
            name: state.user.name,
            color: state.user.color || '#3b82f6',
            x: state.cursor.x,
            y: state.cursor.y,
          });
        }
      });
      setCursors(newCursors);
    };

    awareness.on('change', handleAwarenessUpdate);
    return () => {
      awareness.off('change', handleAwarenessUpdate);
    };
  }, [awareness]);

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
      const pointerPos = stageRef.current.getPointerPosition();
      if (pointerPos && pos) {
        setDraftCommentPos({
          screenX: pointerPos.x,
          screenY: pointerPos.y,
          canvasX: pos.x,
          canvasY: pos.y,
        });
      }
      if (onToolChange) onToolChange('select');
    }
  };

  const handlePointerMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getRelativePointerPosition();
    if (pos) {
      awareness.setLocalStateField('cursor', { x: pos.x, y: pos.y });
    }
    if (activeTool === 'text') {
      textTool.handleMouseMove(e, stageRef.current);
    }
  };

  const handlePointerUp = (e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'text') {
      textTool.handleMouseUp(e, stageRef.current);
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
        backgroundColor: '#F9FAFB',
        backgroundImage: 'radial-gradient(#E5E7EB 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        backgroundPosition: `${stageProps.x}px ${stageProps.y}px`
      }}>

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
        style={{ background: '#f5f5f5' }} // Match design background
      >
        {/* Grid Layer */}
        <Layer listening={false}>
          <Rect
            x={-stageProps.x / stageProps.scale}
            y={-stageProps.y / stageProps.scale}
            width={globalThis.innerWidth / stageProps.scale}
            height={globalThis.innerHeight / stageProps.scale}
            fillPatternImage={gridPattern as any}
            fillPatternScale={{ x: 1 / stageProps.scale, y: 1 / stageProps.scale }}
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

            return (
              <Group
                key={comment.id}
                x={comment.canvasX}
                y={comment.canvasY}
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

          {cursors.map((cursor) => {
            const initials = cursor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 1).toUpperCase();
            return (
              <Group key={cursor.clientId} x={cursor.x} y={cursor.y}>
                <Circle
                  radius={14}
                  fill={cursor.color}
                  shadowColor="rgba(0,0,0,0.15)"
                  shadowBlur={6}
                  shadowOffsetY={2}
                />
                <Text
                  text={initials}
                  x={-14}
                  y={-5}
                  width={28}
                  align="center"
                  fill="#fff"
                  fontSize={11}
                  fontStyle="bold"
                />
              </Group>
            );
          })}

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
              });

              ydoc.transact(() => {
                const yComments = ydoc.getArray<Y.Map<any>>('comments');
                const commentMap = new Y.Map();
                commentMap.set('id', res.data.id);
                commentMap.set('canvasX', res.data.canvasX);
                commentMap.set('canvasY', res.data.canvasY);
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
            } catch (e) { console.error('Failed to create comment', e); }
            setDraftCommentPos(null);
          }}
        />
      )}
    </div>
  );
};
