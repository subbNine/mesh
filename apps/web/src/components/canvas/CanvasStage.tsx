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
import { useToast } from '../../store/toast.store';
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
  opacity?: number;
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
  anchorRelX?: number;
  anchorRelY?: number;
  anchorX?: number;
  anchorY?: number;
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

function htmlToPlainText(content?: string) {
  if (!content) return '';

  if (globalThis.document) {
    const div = globalThis.document.createElement('div');
    div.innerHTML = content;
    return (div.innerText || div.textContent || '').trim();
  }

  return content.replaceAll(/<[^>]+>/g, ' ').replaceAll(/\s+/g, ' ').trim();
}

function getTextFormatting(content = '') {
  const source = content;
  const bold = /<(strong|b)(\s|>)/i.test(source);
  const italic = /<(em|i)(\s|>)/i.test(source);
  const underline = /<u(\s|>)/i.test(source);
  const alignMatch = /text-align\s*:\s*(left|center|right)/i.exec(source);

  return {
    fontStyle: [bold && 'bold', italic && 'italic'].filter(Boolean).join(' ') || 'normal',
    textDecoration: underline ? 'underline' : undefined,
    align: (alignMatch?.[1]?.toLowerCase() as 'left' | 'center' | 'right' | undefined) || 'left',
  };
}

type TextAlignMode = 'left' | 'center' | 'right';

interface RichTextToken {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: TextAlignMode;
}

interface RichTextLine {
  y: number;
  height: number;
  maxFontSize: number;
  tokens: Array<RichTextToken & { x: number }>;
}

const DEFAULT_TEXT_FONT_FAMILY = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
let textMeasureContext: CanvasRenderingContext2D | null = null;

function getCanvasFontStyle({ bold, italic }: Pick<RichTextToken, 'bold' | 'italic'>) {
  if (bold && italic) return 'bold italic';
  if (bold) return 'bold';
  if (italic) return 'italic';
  return 'normal';
}

function getTextMeasureContext() {
  if (textMeasureContext || !globalThis.document) {
    return textMeasureContext;
  }

  textMeasureContext = globalThis.document.createElement('canvas').getContext('2d');
  return textMeasureContext;
}

function measureRichTextToken(text: string, token: RichTextToken) {
  const context = getTextMeasureContext();

  if (!context) {
    return text.length * token.fontSize * 0.6;
  }

  context.font = `${token.italic ? 'italic ' : ''}${token.bold ? '700 ' : '400 '}${token.fontSize}px ${token.fontFamily}`;
  return context.measureText(text).width;
}

function parseTextAlign(value?: string | null): TextAlignMode | undefined {
  const normalized = value?.toLowerCase();
  if (normalized === 'center' || normalized === 'right' || normalized === 'left') {
    return normalized;
  }

  return undefined;
}

function parseRichTextTokens(content: string, defaultFontSize: number, defaultColor: string) {
  if (!globalThis.document) {
    return [] as RichTextToken[];
  }

  const root = globalThis.document.createElement('div');
  root.innerHTML = content;

  const baseStyle: Omit<RichTextToken, 'text'> = {
    bold: false,
    italic: false,
    underline: false,
    fontSize: defaultFontSize,
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    color: defaultColor,
    align: 'left',
  };

  const tokens: RichTextToken[] = [];

  const pushToken = (text: string, style: Omit<RichTextToken, 'text'>) => {
    if (!text) return;

    const lastToken = tokens[tokens.length - 1];
    const nextToken: RichTextToken = { text, ...style };

    if (
      lastToken &&
      lastToken.bold === nextToken.bold &&
      lastToken.italic === nextToken.italic &&
      lastToken.underline === nextToken.underline &&
      lastToken.fontSize === nextToken.fontSize &&
      lastToken.fontFamily === nextToken.fontFamily &&
      lastToken.color === nextToken.color &&
      lastToken.align === nextToken.align
    ) {
      lastToken.text += text;
      return;
    }

    tokens.push(nextToken);
  };

  const pushBreak = (style: Omit<RichTextToken, 'text'>) => {
    const lastToken = tokens[tokens.length - 1];
    if (!lastToken || lastToken.text.endsWith('\n')) {
      return;
    }
    pushToken('\n', style);
  };

  const visitNode = (node: Node, inheritedStyle: Omit<RichTextToken, 'text'>) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushToken(node.textContent ?? '', inheritedStyle);
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tag = node.tagName.toLowerCase();
    if (tag === 'br') {
      pushBreak(inheritedStyle);
      return;
    }

    const nextStyle = { ...inheritedStyle };

    // Handle mentions (TipTap format)
    if (tag === 'span' && (node.classList.contains('mention') || node.hasAttribute('data-mention-id'))) {
      nextStyle.bold = true;
      nextStyle.color = '#0ca3ba'; // Primary theme color
    }

    if (tag === 'strong' || tag === 'b') nextStyle.bold = true;
    if (tag === 'em' || tag === 'i') nextStyle.italic = true;
    if (tag === 'u') nextStyle.underline = true;
    if (tag === 'code' || tag === 'pre') {
      nextStyle.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";
      nextStyle.fontSize = Math.max(14, inheritedStyle.fontSize - 1);
    }
    if (tag === 'h1') {
      nextStyle.bold = true;
      nextStyle.fontSize = Math.max(inheritedStyle.fontSize + 10, 30);
    }
    if (tag === 'h2') {
      nextStyle.bold = true;
      nextStyle.fontSize = Math.max(inheritedStyle.fontSize + 6, 24);
    }

    const inlineFontSize = Number.parseFloat(node.style.fontSize || '');
    if (Number.isFinite(inlineFontSize)) {
      nextStyle.fontSize = inlineFontSize;
    }

    if (node.style.fontWeight) {
      nextStyle.bold = nextStyle.bold || Number.parseInt(node.style.fontWeight, 10) >= 600 || node.style.fontWeight === 'bold';
    }

    if (node.style.fontStyle === 'italic') {
      nextStyle.italic = true;
    }

    if (node.style.textDecoration.includes('underline')) {
      nextStyle.underline = true;
    }

    if (node.style.color) {
      nextStyle.color = node.style.color;
    }

    const inlineAlign = parseTextAlign(node.style.textAlign);
    if (inlineAlign) {
      nextStyle.align = inlineAlign;
    }

    const isBlock = ['p', 'div', 'li', 'blockquote', 'pre', 'h1', 'h2', 'ul', 'ol'].includes(tag);
    if (isBlock && tokens.length > 0) {
      pushBreak(nextStyle);
    }

    if (tag === 'li') {
      pushToken('• ', nextStyle);
    }

    Array.from(node.childNodes).forEach((child) => visitNode(child, nextStyle));

    if (isBlock) {
      pushBreak(nextStyle);
    }
  };

  Array.from(root.childNodes).forEach((child) => visitNode(child, baseStyle));

  return tokens;
}

function buildRichTextLines(tokens: RichTextToken[], maxWidth: number, maxHeight: number) {
  const lines: RichTextLine[] = [];
  const safeWidth = Math.max(maxWidth, 24);
  const safeHeight = Math.max(maxHeight, 20);

  let currentTokens: RichTextToken[] = [];
  let currentWidth = 0;
  let currentHeight = 0;
  let currentMaxFontSize = 0;
  let currentY = 0;
  let shouldStop = false;

  const pushLineToken = (text: string, token: RichTextToken, width: number) => {
    const lastToken = currentTokens[currentTokens.length - 1];
    if (
      lastToken &&
      lastToken.bold === token.bold &&
      lastToken.italic === token.italic &&
      lastToken.underline === token.underline &&
      lastToken.fontSize === token.fontSize &&
      lastToken.fontFamily === token.fontFamily &&
      lastToken.color === token.color &&
      lastToken.align === token.align
    ) {
      lastToken.text += text;
    } else {
      currentTokens.push({ ...token, text });
    }

    currentWidth += width;
    currentHeight = Math.max(currentHeight, token.fontSize * 1.35);
    currentMaxFontSize = Math.max(currentMaxFontSize, token.fontSize);
  };

  const commitLine = () => {
    const lineHeight = Math.max(currentHeight || 24, 20);
    if (currentY + lineHeight > safeHeight) {
      shouldStop = true;
      return;
    }

    const align = currentTokens[0]?.align ?? 'left';
    const offsetX = align === 'center'
      ? Math.max((safeWidth - currentWidth) / 2, 0)
      : align === 'right'
        ? Math.max(safeWidth - currentWidth, 0)
        : 0;

    let cursorX = offsetX;
    const positionedTokens = currentTokens.map((token) => {
      const tokenWidth = measureRichTextToken(token.text, token);
      const positioned = { ...token, x: cursorX };
      cursorX += tokenWidth;
      return positioned;
    });

    lines.push({ y: currentY, height: lineHeight, maxFontSize: currentMaxFontSize, tokens: positionedTokens });
    currentY += lineHeight;
    currentTokens = [];
    currentWidth = 0;
    currentHeight = 0;
    currentMaxFontSize = 0;
  };

  for (const token of tokens) {
    const parts = token.text.split(/(\n|\s+)/).filter(Boolean);

    for (let part of parts) {
      if (part === '\n') {
        commitLine();
        if (shouldStop) return lines;
        continue;
      }

      if (!currentTokens.length) {
        part = part.replace(/^\s+/, '');
      }

      if (!part) continue;

      let partWidth = measureRichTextToken(part, token);
      if (currentTokens.length > 0 && currentWidth + partWidth > safeWidth && !/^\s+$/.test(part)) {
        commitLine();
        if (shouldStop) return lines;
        part = part.replace(/^\s+/, '');
        if (!part) continue;
        partWidth = measureRichTextToken(part, token);
      }

      if (partWidth <= safeWidth) {
        pushLineToken(part, token, partWidth);
        continue;
      }

      let chunk = '';
      for (const char of Array.from(part)) {
        const nextChunk = `${chunk}${char}`;
        const nextWidth = measureRichTextToken(nextChunk, token);

        if (!chunk || nextWidth <= safeWidth) {
          chunk = nextChunk;
          continue;
        }

        const chunkWidth = measureRichTextToken(chunk, token);
        pushLineToken(chunk, token, chunkWidth);
        commitLine();
        if (shouldStop) return lines;
        chunk = char;
      }

      if (chunk) {
        const chunkWidth = measureRichTextToken(chunk, token);
        pushLineToken(chunk, token, chunkWidth);
      }
    }
  }

  if (currentTokens.length && !shouldStop) {
    commitLine();
  }

  return lines;
}

const MAX_TRANSFORM_DIMENSION = 4000;

function getTransformSizeBounds(element?: CanvasElement | null) {
  if (element?.type === 'callout') {
    return { minWidth: 120, minHeight: 56 };
  }

  if (element?.type === 'text') {
    return { minWidth: 80, minHeight: 30 };
  }

  return { minWidth: 24, minHeight: 24 };
}

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
  const isCallout = el.type === 'callout';
  const isTextElement = el.type === 'text' || isCallout;
  const width = el.width || (isCallout ? 220 : 200);
  const height = el.height || (isCallout ? 88 : 60);
  const paddingX = isCallout ? 12 : 8;
  const paddingY = isCallout ? 10 : 8;
  const contentWidth = Math.max(width - (isCallout ? 24 : 16), 24);
  const contentHeight = Math.max(height - (isCallout ? 20 : 16), 20);
  const textValue = htmlToPlainText(el.content);
  const hasContent = textValue.length > 0;
  const { fontStyle, textDecoration, align } = getTextFormatting(el.content);
  const richTextLines = isTextElement && hasContent
    ? buildRichTextLines(
        parseRichTextTokens(el.content || '', isCallout ? 18 : 20, '#1a1a1a'),
        contentWidth,
        contentHeight,
      )
    : [];

  if (isTextElement) {
    const fillColor = el.backgroundColor || (isCallout ? '#fff2b3' : '#ffffff');
    const strokeColor = isSelected ? '#0ea5e9' : isCallout ? '#d4a017' : 'transparent';
    const strokeWidth = isCallout ? (isSelected ? 2 : 1.25) : (isSelected ? 1.5 : 1);
    const shadowBlur = isCallout ? (isSelected ? 12 : 6) : 0;
    const placeholderText = isCallout ? 'Add callout' : 'Text block';
    const placeholderColor = isCallout ? '#92400e' : '#adb5bd';
    const localAnchorX = typeof el.anchorX === 'number' ? el.anchorX - el.x : width * 0.5;
    const localAnchorY = typeof el.anchorY === 'number' ? el.anchorY - el.y : height + 18;
    const tailBaseX = Math.min(Math.max(localAnchorX, 24), Math.max(width - 24, 24));

    return (
      <Group
        id={el.id}
        x={el.x}
        y={el.y}
        width={width}
        height={height}
        rotation={el.rotation || 0}
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
      >
        {isCallout && (
          <>
            <Line
              points={[tailBaseX, height - 2, localAnchorX, localAnchorY]}
              stroke={strokeColor}
              strokeWidth={2}
              lineCap="round"
              listening={false}
            />
            <Circle
              x={localAnchorX}
              y={localAnchorY}
              radius={4}
              fill={isSelected ? '#0ea5e9' : '#f59e0b'}
              stroke="#ffffff"
              strokeWidth={1.5}
              listening={false}
            />
          </>
        )}

        <Rect
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          cornerRadius={isCallout ? 18 : 2}
          shadowColor={isCallout ? '#f59e0b' : undefined}
          shadowBlur={shadowBlur}
          shadowOpacity={isCallout ? 0.12 : 0}
        />

        {!isEditing && (
          richTextLines.length > 0 ? (
            richTextLines.map((line, lineIndex) => (
              <Group key={`${el.id}-line-${lineIndex}`} listening={false}>
                {line.tokens.map((token, tokenIndex) => (
                  <Text
                    key={`${el.id}-token-${lineIndex}-${tokenIndex}`}
                    x={paddingX + token.x}
                    y={paddingY + line.y + (line.maxFontSize - token.fontSize) * 0.78}
                    text={token.text}
                    fill={token.color}
                    fontSize={token.fontSize}
                    fontStyle={getCanvasFontStyle(token)}
                    textDecoration={token.underline ? 'underline' : undefined}
                    fontFamily={token.fontFamily}
                    listening={false}
                  />
                ))}
              </Group>
            ))
          ) : (
            <Text
              x={paddingX}
              y={paddingY}
              width={contentWidth}
              height={contentHeight}
              text={hasContent ? textValue : placeholderText}
              fill={hasContent ? '#1a1a1a' : placeholderColor}
              fontSize={isCallout ? 18 : 20}
              lineHeight={1.45}
              fontStyle={hasContent ? fontStyle : 'italic'}
              textDecoration={hasContent ? textDecoration : undefined}
              align={align}
              verticalAlign="top"
              wrap="word"
              listening={false}
            />
          )
        )}
      </Group>
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragUpdateTimeoutRef = useRef<number | null>(null);

  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [comments, setComments] = useState<CanvasComment[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftCommentPos, setDraftCommentPos] = useState<any | null>(null);
  const [stageProps, setStageProps] = useState({ scale: 1, x: 0, y: 0 });
  const [drawingPoints, setDrawingPoints] = useState<number[] | null>(null);
  const [dragPreviewById, setDragPreviewById] = useState<Record<string, { x: number; y: number }>>({});
  const [stageSize, setStageSize] = useState({
    width: globalThis.innerWidth,
    height: globalThis.innerHeight,
  });

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const setStoreZoom = useCanvasStore((state: any) => state.setZoom);
  const globalZoom = useCanvasStore((state: any) => state.zoom);
  const inkColor = useCanvasStore((state: any) => state.inkColor);
  const snapToGrid = useCanvasStore((state: any) => state.snapToGrid);
  const { info } = useToast();

  // Sync global zoom store with local stageProps scale
  useEffect(() => {
    setStageProps(prev => ({ ...prev, scale: globalZoom }));
  }, [globalZoom]);

  useEffect(() => {
    const updateStageSize = () => {
      const node = containerRef.current;
      if (!node) {
        return;
      }

      const nextWidth = Math.max(Math.round(node.clientWidth), 1);
      const nextHeight = Math.max(Math.round(node.clientHeight), 1);

      setStageSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }

        return { width: nextWidth, height: nextHeight };
      });
    };

    updateStageSize();

    const node = containerRef.current;
    const observer = typeof ResizeObserver !== 'undefined' && node
      ? new ResizeObserver(() => updateStageSize())
      : null;

    if (node && observer) {
      observer.observe(node);
    }

    globalThis.addEventListener('resize', updateStageSize);

    return () => {
      observer?.disconnect();
      globalThis.removeEventListener('resize', updateStageSize);
    };
  }, []);

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
      const sw = stageSize.width;
      const sh = stageSize.height;
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

  const bringElementGroupToFront = useCallback((elementId: string) => {
    let selectionId = elementId;

    ydoc.transact(() => {
      const arr = ydoc.getArray<Y.Map<any>>('elements');
      const maps = arr.toArray();
      const byId = new Map<string, Y.Map<any>>();

      maps.forEach((map) => {
        const id = map.get('id');
        if (id) {
          byId.set(id, map);
        }
      });

      const resolveRootId = (id: string) => {
        let current = byId.get(id);
        let rootId = id;

        while (current?.get('parentId')) {
          rootId = current.get('parentId');
          current = byId.get(rootId);
        }

        return rootId;
      };

      const rootId = resolveRootId(elementId);
      selectionId = elementId;

      const collectGroupIds = (id: string, acc = new Set<string>()) => {
        if (acc.has(id)) return acc;
        acc.add(id);

        maps.forEach((map) => {
          if (map.get('parentId') === id) {
            const childId = map.get('id');
            if (childId) {
              collectGroupIds(childId, acc);
            }
          }
        });

        return acc;
      };

      const groupIds = collectGroupIds(rootId);
      const groupedMaps = maps
        .filter((map) => groupIds.has(map.get('id')))
        .sort((a, b) => (Number(a.get('zIndex')) || 0) - (Number(b.get('zIndex')) || 0));

      const maxOtherZIndex = maps.reduce((max, map) => {
        const id = map.get('id');
        if (groupIds.has(id)) return max;
        return Math.max(max, Number(map.get('zIndex')) || 0);
      }, -1);

      let nextZIndex = maxOtherZIndex + 1;
      groupedMaps.forEach((map) => {
        map.set('zIndex', nextZIndex++);
      });
    });

    return selectionId;
  }, [ydoc]);

  const handleSelectElement = useCallback((elementId: string) => {
    const selectionId = bringElementGroupToFront(elementId);
    setSelectedId(selectionId);
  }, [bringElementGroupToFront]);

  const handleEditElement = useCallback((elementId: string) => {
    const selectionId = bringElementGroupToFront(elementId);
    setSelectedId(selectionId);
    setEditingId(selectionId);
  }, [bringElementGroupToFront]);

  const resolveRootElement = useCallback((element: CanvasElement) => {
    let current: CanvasElement | undefined = element;

    while (current?.parentId) {
      const parent = elements.find((item) => item.id === current?.parentId);
      if (!parent) break;
      current = parent;
    }

    return current ?? element;
  }, [elements]);

  const getDropTargetElement = useCallback((target: any) => {
    let node = target;

    while (node) {
      const nodeId = typeof node.id === 'function' ? node.id() : node?.attrs?.id;
      if (nodeId) {
        const match = elements.find((item) => item.id === nodeId);
        if (match && match.type !== 'callout') {
          return resolveRootElement(match);
        }
      }
      node = typeof node.getParent === 'function' ? node.getParent() : null;
    }

    return null;
  }, [elements, resolveRootElement]);

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
    } else if (activeTool === 'callout') {
      const targetElement = getDropTargetElement(e.target);
      if (!targetElement) {
        info('Drop the callout onto an existing canvas item to attach it.');
        return;
      }

      const parentWidth = targetElement.width || 240;
      const parentHeight = targetElement.height || 160;
      const width = Math.min(280, Math.max(parentWidth * 0.5, 180));
      const height = Math.min(120, Math.max(parentHeight * 0.3, 78));
      const bubbleX = pos.x + 24;
      const bubbleY = pos.y - height - 20;
      const id = crypto.randomUUID();

      ydoc.transact(() => {
        const arr = ydoc.getArray<Y.Map<any>>('elements');
        const element = new Y.Map();
        element.set('id', id);
        element.set('type', 'callout');
        element.set('content', '');
        element.set('x', bubbleX);
        element.set('y', bubbleY);
        element.set('width', width);
        element.set('height', height);
        element.set('zIndex', arr.length);
        element.set('createdBy', currentUser.id);
        element.set('createdAt', new Date().toISOString());
        element.set('backgroundColor', '#fff2b3');
        element.set('parentId', targetElement.id);
        element.set('relX', (bubbleX - targetElement.x) / (parentWidth || 1));
        element.set('relY', (bubbleY - targetElement.y) / (parentHeight || 1));
        element.set('relW', width / (parentWidth || 1));
        element.set('relH', height / (parentHeight || 1));
        element.set('anchorRelX', (pos.x - targetElement.x) / (parentWidth || 1));
        element.set('anchorRelY', (pos.y - targetElement.y) / (parentHeight || 1));
        arr.push([element]);
      });

      setSelectedId(id);
      setEditingId(id);
      onToolChange?.('select');
      triggerSnapshot();
    } else if (activeTool === 'comment') {
      const el = getDropTargetElement(e.target);
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
        stroke: inkColor,
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

  const handleTransformEnd = () => {
    if (!selectedId || !trRef.current) return;
    const node = layerRef.current.findOne(`#${selectedId}`);
    if (!node) return;

    const { minWidth, minHeight } = getTransformSizeBounds(selectedElement);
    const scaleX = Math.abs(node.scaleX() || 1);
    const scaleY = Math.abs(node.scaleY() || 1);
    const nextWidth = Math.max(minWidth, node.width() * scaleX);
    const nextHeight = Math.max(minHeight, node.height() * scaleY);
    const nextX = node.x();
    const nextY = node.y();
    const nextRotation = node.rotation();

    node.setAttrs({
      x: nextX,
      y: nextY,
      width: nextWidth,
      height: nextHeight,
      scaleX: 1,
      scaleY: 1,
    });
    node.getLayer()?.batchDraw();

    ydoc.transact(() => {
      const arr = ydoc.getArray<Y.Map<any>>('elements');
      const map = arr.toArray().find(m => m.get('id') === selectedId);
      if (map) {
        const parentId = map.get('parentId');
        if (parentId) {
          const parent = elements.find((item) => item.id === parentId);
          if (parent) {
            map.set('relX', (nextX - parent.x) / (parent.width || 1));
            map.set('relY', (nextY - parent.y) / (parent.height || 1));
            map.set('relW', nextWidth / (parent.width || 1));
            map.set('relH', nextHeight / (parent.height || 1));
          } else {
            map.set('x', nextX);
            map.set('y', nextY);
            map.set('width', nextWidth);
            map.set('height', nextHeight);
          }
        } else {
          map.set('x', nextX);
          map.set('y', nextY);
          map.set('width', nextWidth);
          map.set('height', nextHeight);
        }
        map.set('rotation', nextRotation);
      }
    });
    triggerSnapshot();
  };

  const handleDragMove = (e: any) => {
    const id = e.target.id();
    let x = e.target.x();
    let y = e.target.y();

    if (snapToGrid) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
      e.target.x(x);
      e.target.y(y);
    }
    const draggedElement = elements.find((el) => el.id === id);

    if (draggedElement?.type === 'callout') {
      setDragPreviewById((prev) => {
        const current = prev[id];
        if (current?.x === x && current?.y === y) return prev;
        return { ...prev, [id]: { x, y } };
      });
    }

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

    setDragPreviewById((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

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
      else if (key === 'a') { e.preventDefault(); onToolChange?.('callout'); }
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
              const childMaps = arr.toArray().filter((m) => m.get('parentId') === selectedId);
              if (childMaps.length > 0) {
                const parentX = target.get('x');
                const parentY = target.get('y');
                const parentW = target.get('width') || 1;
                const parentH = target.get('height') || 1;

                childMaps.forEach((m) => {
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
      setSelectedId(box.id);
      setEditingId(box.id);
      triggerSnapshot();
    },
    onToolExit: toolExit
  });
  const { previewRect } = textTool;

  const containerCursor = useMemo(() => {
    if (activeTool === 'text') return 'cursor-crosshair';
    if (activeTool === 'callout') return 'cursor-copy';
    if (activeTool === 'comment') return 'cursor-cell';
    return '';
  }, [activeTool]);

  const getRenderedElement = useCallback((el: CanvasElement) => {
    const renderedEl = { ...el };

    if (el.parentId) {
      const parent = elements.find((item) => item.id === el.parentId);
      if (parent) {
        const parentWidth = parent.width || 1;
        const parentHeight = parent.height || 1;
        renderedEl.x = parent.x + (el.relX || 0) * parentWidth;
        renderedEl.y = parent.y + (el.relY || 0) * parentHeight;
        renderedEl.width = (el.relW || 1) * parentWidth;
        renderedEl.height = (el.relH || 1) * parentHeight;

        if (typeof el.anchorRelX === 'number') {
          renderedEl.anchorX = parent.x + el.anchorRelX * parentWidth;
        }
        if (typeof el.anchorRelY === 'number') {
          renderedEl.anchorY = parent.y + el.anchorRelY * parentHeight;
        }
      }
    }

    const dragPreview = dragPreviewById[el.id];
    if (dragPreview) {
      renderedEl.x = dragPreview.x;
      renderedEl.y = dragPreview.y;
    }

    return renderedEl;
  }, [elements, dragPreviewById]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden overscroll-none ${containerCursor}`}
      style={{
        backgroundImage: 'radial-gradient(#828282 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundPosition: `${stageProps.x}px ${stageProps.y}px`,
        overscrollBehavior: 'none',
        touchAction: activeTool === 'text' || Boolean(editingId) ? 'auto' : 'none',
      }}
    >
      <Stage
        width={stageSize.width} height={stageSize.height}
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
            const renderedEl = getRenderedElement(el);

            return (
              <CanvasElementView
                key={el.id} el={renderedEl}
                isSelected={selectedId === el.id} isEditing={editingId === el.id}
                activeTool={activeTool} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd}
                onSelect={handleSelectElement} onEdit={handleEditElement}
              />
            );
          })}
          {selectedId && (
            <Transformer
              ref={trRef}
              onTransformEnd={handleTransformEnd}
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                const { minWidth, minHeight } = getTransformSizeBounds(selectedElement);
                const nextWidth = Math.abs(newBox.width);
                const nextHeight = Math.abs(newBox.height);

                if (
                  !Number.isFinite(nextWidth) ||
                  !Number.isFinite(nextHeight) ||
                  nextWidth < minWidth ||
                  nextHeight < minHeight ||
                  nextWidth > MAX_TRANSFORM_DIMENSION ||
                  nextHeight > MAX_TRANSFORM_DIMENSION
                ) {
                  return oldBox;
                }

                if (snapToGrid) {
                  newBox.width = Math.round(newBox.width / 20) * 20;
                  newBox.height = Math.round(newBox.height / 20) * 20;
                  newBox.x = Math.round(newBox.x / 20) * 20;
                  newBox.y = Math.round(newBox.y / 20) * 20;
                }
                return newBox;
              }}
            />
          )}

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
          {drawingPoints && <Line points={drawingPoints} stroke={inkColor} strokeWidth={2} tension={0.5} lineCap="round" />}
        </Layer>
      </Stage>

      {elements
        .filter(el => (el.type === 'text' || el.type === 'callout') && editingId === el.id)
        .map(el => {
          const renderedEl = getRenderedElement(el);

          return (
            <RichTextOverlay
              key={el.id}
              el={{
                id: el.id,
                x: renderedEl.x,
                y: renderedEl.y,
                width: renderedEl.width || 200,
                height: renderedEl.height || 60,
                rotation: renderedEl.rotation,
                content: renderedEl.content,
                backgroundColor: renderedEl.backgroundColor
              }}
              stageProps={stageProps}
              isEditing={editingId === el.id}
              onBeginEdit={() => setEditingId(el.id)}
              onEndEdit={() => setEditingId(null)}
              ydoc={ydoc}
              isSelected={selectedId === el.id}
              variant={el.type === 'callout' ? 'callout' : 'text'}
            />
          );
        })}

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
