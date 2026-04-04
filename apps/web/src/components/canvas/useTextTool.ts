/**
 * useTextTool — encapsulates all draw-to-create text box logic.
 *
 * Returns:
 *   - drawState:  null while idle, or { startX, startY, currentX, currentY } while dragging
 *   - onMouseDown / onMouseMove / onMouseUp: Konva event handlers
 *   - commitTextBox: call to create the element and auto-enter edit mode
 */

import { useState, useCallback } from 'react';
import * as Y from 'yjs';
import type { KonvaEventObject } from 'konva/lib/Node';

export interface DrawState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface CreatedBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseTextToolOptions {
  ydoc: Y.Doc;
  userId: string;
  /** Called when a box is committed so the stage can enter edit mode */
  onBoxCreated: (box: CreatedBox) => void;
  /** Called after commit so parent can switch back to 'select' tool */
  onToolExit: () => void;
}

const MIN_WIDTH  = 80;
const MIN_HEIGHT = 30;
const DEFAULT_WIDTH  = 200;
const DEFAULT_HEIGHT = 40;

/** Normalise a rect so width/height are always positive, regardless of drag direction */
function normalise(sx: number, sy: number, ex: number, ey: number) {
  return {
    x: Math.min(sx, ex),
    y: Math.min(sy, ey),
    width:  Math.max(MIN_WIDTH,  Math.abs(ex - sx)),
    height: Math.max(MIN_HEIGHT, Math.abs(ey - sy)),
  };
}

export function useTextTool({ ydoc, userId, onBoxCreated, onToolExit }: UseTextToolOptions) {
  const [drawState, setDrawState] = useState<DrawState | null>(null);

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>, stage: any) => {
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      setDrawState({ startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>, stage: any) => {
      if (!drawState) return;
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      setDrawState((prev) => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
    },
    [drawState],
  );

  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>, stage: any) => {
      if (!drawState) return;

      const isDrag =
        Math.abs(drawState.currentX - drawState.startX) > 4 ||
        Math.abs(drawState.currentY - drawState.startY) > 4;

      const rect = isDrag
        ? normalise(drawState.startX, drawState.startY, drawState.currentX, drawState.currentY)
        : { x: drawState.startX, y: drawState.startY, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

      setDrawState(null);

      // Commit to Yjs
      const id = crypto.randomUUID();
      ydoc.transact(() => {
        const yElements = ydoc.getArray<Y.Map<any>>('elements');
        const el = new Y.Map();
        el.set('id', id);
        el.set('type', 'text');
        el.set('content', '');
        el.set('x', rect.x);
        el.set('y', rect.y);
        el.set('width', rect.width);
        el.set('height', rect.height);
        el.set('zIndex', yElements.length);
        el.set('createdBy', userId);
        el.set('createdAt', new Date().toISOString());
        el.set('backgroundColor', '#ffffff');
        yElements.push([el]);
      });

      onBoxCreated({ id, ...rect });
      onToolExit();          // Switch back to 'select' automatically
    },
    [drawState, ydoc, userId, onBoxCreated, onToolExit],
  );

  /** Derived rect for the preview overlay */
  const previewRect = drawState
    ? normalise(drawState.startX, drawState.startY, drawState.currentX, drawState.currentY)
    : null;

  return { drawState, previewRect, handleMouseDown, handleMouseMove, handleMouseUp };
}
