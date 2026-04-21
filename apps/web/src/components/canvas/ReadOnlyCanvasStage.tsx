import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { Stage, Layer, Text, Image as KonvaImage, Group, Circle, Rect, Line } from 'react-konva';

/**
 * Read-only canvas renderer for public project pages.
 *
 * Loads a Yjs document from a base64-encoded state update (no WebSocket),
 * extracts the elements array, and renders them using Konva — identical to
 * the full CanvasStage but with all editing, selection, dragging, comments,
 * and toolbar controls stripped out. Supports pan and zoom only.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
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
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  anchorX?: number;
  anchorY?: number;
}

// ─── ProseMirror types ────────────────────────────────────────────────────────
interface PMTextMark { type: string; attrs?: Record<string, unknown>; }
interface PMDocNode { type: string; text?: string; attrs?: Record<string, unknown>; marks?: PMTextMark[]; content?: PMDocNode[]; }

type TextAlignMode = 'left' | 'center' | 'right';
interface RichTextRun { text: string; bold: boolean; italic: boolean; underline: boolean; code: boolean; fontSize: number; fontFamily: string; color: string; }
interface RichTextParagraph { align: TextAlignMode; spaceBefore: number; runs: RichTextRun[]; }
interface RichTextLine { y: number; height: number; maxFontSize: number; tokens: Array<RichTextRun & { x: number }>; }

// ─── Font constants ───────────────────────────────────────────────────────────
const DEFAULT_FONT = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO_FONT = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";

// ─── Measure ──────────────────────────────────────────────────────────────────
let _measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx() {
  if (!_measureCtx && globalThis.document) _measureCtx = globalThis.document.createElement('canvas').getContext('2d');
  return _measureCtx;
}
function measureRun(text: string, run: Pick<RichTextRun, 'bold' | 'italic' | 'fontSize' | 'fontFamily'>) {
  const ctx = getMeasureCtx();
  if (!ctx) return text.length * run.fontSize * 0.6;
  ctx.font = `${run.italic ? 'italic ' : ''}${run.bold ? '700 ' : '400 '}${run.fontSize}px ${run.fontFamily}`;
  return ctx.measureText(text).width;
}
function fontStyle({ bold, italic }: Pick<RichTextRun, 'bold' | 'italic'>) {
  if (bold && italic) return 'bold italic';
  if (bold) return 'bold';
  if (italic) return 'italic';
  return 'normal';
}

// ─── Text extraction ──────────────────────────────────────────────────────────
function extractPMText(node: PMDocNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'mention') return `@${(node.attrs?.label as string) ?? ''}`;
  return (node.content ?? []).map(extractPMText).join('');
}
function extractPlainText(content?: string): string {
  if (!content) return '';
  if (content.trimStart().startsWith('{')) {
    try { return extractPMText(JSON.parse(content) as PMDocNode).trim(); } catch {}
  }
  if (globalThis.document) {
    const div = globalThis.document.createElement('div');
    div.innerHTML = content;
    return (div.innerText || div.textContent || '').trim();
  }
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── PM → Paragraph model ──────────────────────────────────────────────────── 
function makeBase(fs: number): Omit<RichTextRun, 'text'> {
  return { bold: false, italic: false, underline: false, code: false, fontSize: fs, fontFamily: DEFAULT_FONT, color: '#1a1a1a' };
}
function applyMarks(base: Omit<RichTextRun, 'text'>, marks: PMTextMark[]): Omit<RichTextRun, 'text'> {
  const n = { ...base };
  for (const m of marks) {
    if (m.type === 'bold') n.bold = true;
    else if (m.type === 'italic') n.italic = true;
    else if (m.type === 'underline') n.underline = true;
    else if (m.type === 'code') { n.code = true; n.fontFamily = MONO_FONT; n.fontSize = Math.max(12, n.fontSize - 2); }
    else if (m.type === 'textStyle') {
      const fs = m.attrs?.fontSize as string | undefined;
      if (fs) { const v = parseFloat(fs); if (isFinite(v) && v > 0) n.fontSize = v; }
      if (m.attrs?.color) n.color = m.attrs.color as string;
    }
    else if (m.type === 'mention') { n.bold = true; n.color = '#0ca3ba'; }
  }
  return n;
}
function nodeRuns(node: PMDocNode, i: Omit<RichTextRun, 'text'>): RichTextRun[] {
  if (node.type === 'text') return [{ ...applyMarks(i, node.marks ?? []), text: node.text ?? '' }];
  if (node.type === 'hardBreak') return [{ ...i, text: '\n' }];
  if (node.type === 'mention') return [{ ...applyMarks(i, [{ type: 'mention' }]), text: `@${(node.attrs?.label as string) ?? ''}` }];
  return (node.content ?? []).flatMap(c => nodeRuns(c, i));
}
function nodeAlign(n: PMDocNode): TextAlignMode { const a = n.attrs?.textAlign as string; return a === 'center' || a === 'right' ? a : 'left'; }

function parseToParagraphs(content: string, fs: number): RichTextParagraph[] {
  if (!content.trimStart().startsWith('{')) return [];
  let doc: PMDocNode;
  try { doc = JSON.parse(content); if (doc.type !== 'doc') return []; } catch { return []; }
  const paras: RichTextParagraph[] = [];
  function proc(n: PMDocNode) {
    if (n.type === 'doc') (n.content ?? []).forEach(proc);
    else if (n.type === 'paragraph') {
      const b = makeBase(fs);
      paras.push({ align: nodeAlign(n), spaceBefore: paras.length > 0 ? 4 : 0, runs: (n.content ?? []).flatMap(c => nodeRuns(c, b)) });
    } else if (n.type === 'heading') {
      const lvl = (n.attrs?.level as number) ?? 1;
      const hfs = lvl === 1 ? Math.max(fs + 10, 30) : Math.max(fs + 6, 24);
      const b: Omit<RichTextRun, 'text'> = { bold: true, italic: false, underline: false, code: false, fontSize: hfs, fontFamily: DEFAULT_FONT, color: '#0f0f0f' };
      paras.push({ align: nodeAlign(n), spaceBefore: paras.length > 0 ? 10 : 0, runs: (n.content ?? []).flatMap(c => nodeRuns(c, b)) });
    } else if (n.type === 'bulletList') (n.content ?? []).forEach((item, i) => listItem(item, 'bullet', i + 1));
    else if (n.type === 'orderedList') { const s = (n.attrs?.start as number) ?? 1; (n.content ?? []).forEach((item, i) => listItem(item, 'ordered', s + i)); }
    else (n.content ?? []).forEach(proc);
  }
  function listItem(item: PMDocNode, t: 'bullet' | 'ordered', idx: number) {
    const pfx = t === 'bullet' ? '• ' : `${idx}. `;
    const b = makeBase(fs);
    for (const c of item.content ?? []) {
      if (c.type === 'paragraph') paras.push({ align: nodeAlign(c), spaceBefore: paras.length > 0 ? 2 : 0, runs: [{ ...b, text: pfx }, ...(c.content ?? []).flatMap(cc => nodeRuns(cc, b))] });
      else proc(c);
    }
  }
  proc(doc);
  return paras;
}

// ─── Word wrap ────────────────────────────────────────────────────────────────
function wrapToLines(paras: RichTextParagraph[], maxW: number, maxH: number): RichTextLine[] {
  const sw = Math.max(maxW, 24);
  const sh = Math.max(maxH, 20);
  const lines: RichTextLine[] = [];
  let curY = 0;

  for (const para of paras) {
    if (para.spaceBefore > 0 && lines.length > 0) { curY += para.spaceBefore; if (curY >= sh) break; }
    const wrapLines = wrapRuns(para.runs, sw, para.align);
    if (wrapLines.length === 0) { curY += 20; continue; }
    for (const wl of wrapLines) {
      if (curY + wl.h > sh) return lines;
      lines.push({ y: curY, height: wl.h, maxFontSize: wl.mfs, tokens: wl.tokens });
      curY += wl.h;
    }
  }
  return lines;
}

function wrapRuns(runs: RichTextRun[], maxW: number, align: TextAlignMode) {
  const result: { tokens: Array<RichTextRun & { x: number }>; w: number; h: number; mfs: number }[] = [];
  let lineRuns: RichTextRun[] = [], lw = 0, lh = 0, mfs = 0;

  function push(text: string, run: RichTextRun, w: number) {
    const last = lineRuns.at(-1);
    if (last && last.bold === run.bold && last.italic === run.italic && last.fontSize === run.fontSize && last.fontFamily === run.fontFamily && last.color === run.color) last.text += text;
    else lineRuns.push({ ...run, text });
    lw += w; lh = Math.max(lh, run.fontSize * 1.4); mfs = Math.max(mfs, run.fontSize);
  }
  function commit() {
    if (!lineRuns.some(r => r.text.trim())) { lineRuns = []; lw = 0; lh = 0; mfs = 0; return; }
    const trimmed = lineRuns.map((r, i) => i === lineRuns.length - 1 ? { ...r, text: r.text.trimEnd() } : r);
    let aw = 0; for (const r of trimmed) aw += measureRun(r.text, r);
    let ox = 0;
    if (align === 'center') ox = Math.max((maxW - aw) / 2, 0);
    else if (align === 'right') ox = Math.max(maxW - aw, 0);
    let cx = ox;
    const tokens = trimmed.filter(r => r.text).map(r => { const w = measureRun(r.text, r); const t = { ...r, x: cx }; cx += w; return t; });
    result.push({ tokens, w: aw, h: Math.max(lh, 20), mfs: Math.max(mfs, 12) });
    lineRuns = []; lw = 0; lh = 0; mfs = 0;
  }

  for (const run of runs) {
    const segs = run.text.split('\n');
    let si = 0;
    for (const seg of segs) {
      if (si > 0) commit();
      si++;
      if (!seg) continue;
      for (const word of seg.split(/(\s+)/)) {
        if (!lineRuns.length && /^\s+$/.test(word)) continue;
        if (!word) continue;
        let ww = measureRun(word, run);
        if (lineRuns.length > 0 && lw + ww > maxW && !/^\s+$/.test(word)) { commit(); const tw = word.trimStart(); if (!tw) continue; ww = measureRun(tw, run); push(tw, run, ww); continue; }
        push(word, run, ww);
      }
    }
  }
  commit();
  return result;
}

// ─── Image component ─────────────────────────────────────────────────────────
const imgCache = new Map<string, HTMLImageElement>();
const ROImage = React.memo(({ src, width, height, ...props }: any) => {
  const [img, setImg] = useState<HTMLImageElement | null>(imgCache.get(src) || null);
  useEffect(() => {
    if (img || !src) return;
    const image = new globalThis.Image();
    image.src = src;
    image.crossOrigin = 'Anonymous';
    image.onload = () => { imgCache.set(src, image); setImg(image); };
  }, [src, img]);
  if (!img) return <Rect width={width} height={height} fill="#f4f4f5" {...props} />;
  return <KonvaImage image={img} width={width} height={height} {...props} />;
});

// ─── Element renderer ─────────────────────────────────────────────────────────
const ROElement = React.memo(({ el }: { el: CanvasElement }) => {
  const isCallout = el.type === 'callout';
  const isText = el.type === 'text' || isCallout;
  const w = el.width || (isCallout ? 220 : 200);
  const h = el.height || (isCallout ? 88 : 60);
  const px = isCallout ? 12 : 8;
  const py = isCallout ? 10 : 8;
  const cw = Math.max(w - (isCallout ? 24 : 16), 24);
  const ch = Math.max(h - (isCallout ? 20 : 16), 20);
  const defFs = isCallout ? 18 : 20;
  const plain = extractPlainText(el.content);
  const richLines = isText && plain.length > 0 ? wrapToLines(parseToParagraphs(el.content || '', defFs), cw, ch) : [];

  if (isText) {
    const fill = el.backgroundColor ?? (isCallout ? '#fff2b3' : '#ffffff');
    const stroke = isCallout ? '#d4a017' : 'transparent';
    const sw = isCallout ? 1.25 : 1;
    const localAnchorX = typeof el.anchorX === 'number' ? el.anchorX - el.x : w * 0.5;
    const localAnchorY = typeof el.anchorY === 'number' ? el.anchorY - el.y : h + 18;
    const tailBaseX = Math.min(Math.max(localAnchorX, 24), Math.max(w - 24, 24));

    return (
      <Group x={el.x} y={el.y} width={w} height={h} rotation={el.rotation || 0} listening={false}>
        {isCallout && (
          <>
            <Line points={[tailBaseX, h - 2, localAnchorX, localAnchorY]} stroke={stroke} strokeWidth={2} lineCap="round" listening={false} />
            <Circle x={localAnchorX} y={localAnchorY} radius={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} listening={false} />
          </>
        )}
        <Rect width={w} height={h} fill={fill} stroke={stroke} strokeWidth={sw} cornerRadius={isCallout ? 18 : 2} shadowColor={isCallout ? '#f59e0b' : undefined} shadowBlur={isCallout ? 6 : 0} shadowOpacity={isCallout ? 0.12 : 0} />
        {richLines.length > 0 ? (
          richLines.map((line, li) => (
            <Group key={`l-${li}`} listening={false}>
              {line.tokens.map((tok, ti) => (
                <Text key={`t-${li}-${ti}`} x={px + tok.x} y={py + line.y + (line.maxFontSize - tok.fontSize) * 0.78} text={tok.text} fill={tok.color} fontSize={tok.fontSize} fontStyle={fontStyle(tok)} textDecoration={tok.underline ? 'underline' : undefined} fontFamily={tok.fontFamily} listening={false} />
              ))}
            </Group>
          ))
        ) : (
          <Text x={px} y={py} width={cw} height={ch} text={plain || (isCallout ? 'Callout' : '')} fill={plain ? '#1a1a1a' : '#adb5bd'} fontSize={defFs} lineHeight={1.45} fontStyle="italic" wrap="word" listening={false} />
        )}
      </Group>
    );
  }

  if (el.type === 'image') {
    return <ROImage src={el.content} x={el.x} y={el.y} width={el.width || 300} height={el.height || 200} rotation={el.rotation || 0} listening={false} />;
  }

  if (el.type === 'pencil') {
    return <Line points={el.points || []} stroke={el.stroke || '#000'} strokeWidth={el.strokeWidth || 2} tension={0.5} lineCap="round" lineJoin="round" listening={false} />;
  }

  return null;
});

// ─── Main Component ──────────────────────────────────────────────────────────
interface ReadOnlyCanvasProps {
  /** Base64-encoded Yjs state update */
  canvasDoc: string | null;
}

export default function ReadOnlyCanvasStage({ canvasDoc }: ReadOnlyCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<any>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [stageSize, setStageSize] = useState({ width: 800, height: 500 });
  const [stageProps, setStageProps] = useState({ scale: 1, x: 0, y: 0 });

  // Load Yjs doc from base64
  useEffect(() => {
    if (!canvasDoc) return;

    const doc = new Y.Doc();
    try {
      const binary = Uint8Array.from(atob(canvasDoc), c => c.charCodeAt(0));
      Y.applyUpdate(doc, binary);
    } catch (err) {
      console.error('[ReadOnlyCanvas] Failed to decode Yjs document', err);
      return;
    }

    const yElements = doc.getArray<Y.Map<any>>('elements');
    const parsed = yElements.toArray().map(m => m.toJSON() as CanvasElement);
    parsed.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    setElements(parsed);

    return () => { doc.destroy(); };
  }, [canvasDoc]);

  // Fit to view on load
  useEffect(() => {
    if (elements.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 100));
      maxY = Math.max(maxY, el.y + (el.height || 60));
    }

    const padding = 60;
    const contentW = (maxX - minX) + padding * 2;
    const contentH = (maxY - minY) + padding * 2;
    const sw = stageSize.width;
    const sh = stageSize.height;
    const scale = Math.min(Math.max(Math.min(sw / contentW, sh / contentH), 0.15), 2);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setStageProps({ scale, x: sw / 2 - cx * scale, y: sh / 2 - cy * scale });
  }, [elements, stageSize]);

  // Container resize
  useEffect(() => {
    const update = () => {
      const node = containerRef.current;
      if (!node) return;
      setStageSize({ width: Math.max(node.clientWidth, 1), height: Math.max(node.clientHeight, 1) });
    };
    update();
    const obs = typeof ResizeObserver !== 'undefined' && containerRef.current ? new ResizeObserver(update) : null;
    if (containerRef.current && obs) obs.observe(containerRef.current);
    globalThis.addEventListener('resize', update);
    return () => { obs?.disconnect(); globalThis.removeEventListener('resize', update); };
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageProps.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.1), 5);

    setStageProps({
      scale: clampedScale,
      x: pointer.x - ((pointer.x - stageProps.x) / oldScale) * clampedScale,
      y: pointer.y - ((pointer.y - stageProps.y) / oldScale) * clampedScale,
    });
  }, [stageProps]);

  if (!canvasDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-3 text-muted-foreground/30">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>
        </div>
        <p className="text-xs font-serif italic">No canvas content yet</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px] relative bg-muted/10 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageProps.scale}
        scaleY={stageProps.scale}
        x={stageProps.x}
        y={stageProps.y}
        draggable
        onDragEnd={(e) => {
          setStageProps(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
        }}
        onWheel={handleWheel}
      >
        <Layer>
          {elements.map(el => (
            <ROElement key={el.id} el={el} />
          ))}
        </Layer>
      </Stage>

      {/* Read-only badge */}
      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-card/90 border border-border/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm shadow-sm pointer-events-none">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        Read-only
      </div>
    </div>
  );
}
