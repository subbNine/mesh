import { useRef, useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RichTextOverlayProps {
  el: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    content?: string;
    backgroundColor?: string;
  };
  stageProps: { scale: number; x: number; y: number };
  isEditing: boolean;
  onBeginEdit: () => void;
  onEndEdit: () => void;
  ydoc: Y.Doc;
  isSelected: boolean;
  variant?: 'text' | 'callout';
}

function saveContent(ydoc: Y.Doc, id: string, content: string) {
  ydoc.transact(() => {
    const arr = ydoc.getArray<Y.Map<any>>('elements');
    const map = arr.toArray().find((m) => m.get('id') === id);
    if (map) map.set('content', content);
  });
}

export function RichTextOverlay({
  el,
  stageProps,
  isEditing,
  onEndEdit,
  ydoc,
  isSelected,
  variant = 'text',
}: RichTextOverlayProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const [localText, setLocalText] = useState(el.content ?? '');
  const lastHtml = useRef(el.content ?? '');
  const justCommitted = useRef(false);
  const isCallout = variant === 'callout';
  const placeholderHtml = isCallout
    ? '<span style="color: #92400e; font-style: italic;">Add callout</span>'
    : '<span style="color: #adb5bd; font-style: italic;">Text block</span>';
  
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
  });

  useEffect(() => {
    if (!isEditing) {
      if (justCommitted.current) {
        // Skip updating from props if we just committed locally
        return;
      }
      setLocalText(el.content ?? '');
      lastHtml.current = el.content ?? '';
    }
  }, [el.content, isEditing]);

  useEffect(() => {
    if (isEditing && contentEditableRef.current) {
      const div = contentEditableRef.current;
      
      div.innerHTML = el.content ?? placeholderHtml;
      
      div.focus();
      
      const isEmptyOrPlaceholder = !el.content || el.content === 'Double click to edit' || el.content === 'Text block';
      
      const selection = window.getSelection();
      const docRange = document.createRange();
      docRange.selectNodeContents(div);

      if (isEmptyOrPlaceholder) {
        // Select all text natively for easy replacement
        selection?.removeAllRanges();
        selection?.addRange(docRange);
      } else {
        // Collapse to end
        docRange.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(docRange);
      }
    }
  }, [isEditing, el.content]);

  // Track if we've committed during this edit session to avoid double-saves
  const hasCommittedThisSession = useRef(false);

  useEffect(() => {
    if (isEditing) {
      hasCommittedThisSession.current = false;
    }
    
    return () => {
      // Save on unmount ONLY if we were editing and haven't committed yet
      if (isEditing && contentEditableRef.current && !hasCommittedThisSession.current) {
        const html = contentEditableRef.current.innerHTML;
        saveContent(ydoc, el.id, html);
      }
    };
  }, [isEditing, ydoc, el.id]);

  const commit = useCallback(() => {
    if (contentEditableRef.current && !hasCommittedThisSession.current) {
      const html = contentEditableRef.current.innerHTML;
      hasCommittedThisSession.current = true;
      
      // Update localText immediately so the preview renders correctly 
      // before the Yjs observer has a chance to propagate back
      setLocalText(html);
      justCommitted.current = true;
      saveContent(ydoc, el.id, html);
      
      // Reset justCommitted after a short delay to allow Yjs to catch up
      setTimeout(() => { justCommitted.current = false; }, 500);
    }
    onEndEdit();
  }, [ydoc, el.id, onEndEdit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      commit();
    }
    e.stopPropagation(); 
  };

  const handleBlur = () => {
    commit();
  };
  
  const updateFormatState = () => {
    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      align: document.queryCommandState('justifyCenter') ? 'center' 
             : document.queryCommandState('justifyRight') ? 'right' : 'left',
    });
  };
  
  const handleExec = (cmd: string, val?: string) => {
    if (cmd.startsWith('justify')) {
      document.execCommand(cmd, false, val);
      updateFormatState();
      return;
    }
    document.execCommand(cmd, false, val);
    updateFormatState();
  };

  const handleFontSizeChange = (delta: number) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    let currentSize = 20; 
    const parent = selection.anchorNode?.parentElement;
    if (parent) {
      const sizeStr = window.getComputedStyle(parent).fontSize;
      currentSize = parseInt(sizeStr) || 20;
    }
    
    const newSize = Math.max(8, Math.min(96, currentSize + delta));

    document.execCommand('styleWithCSS', false, 'false');
    
    // Chrome sometimes ignores execCommand if it thinks the font is ALREADY that size class.
    // By dynamically checking the reported size and picking an inverse dummy target, we guarantee Native DOM wrappers.
    let dummySize = '7';
    if (document.queryCommandValue('fontSize') === '7') {
      dummySize = '1';
    }
    
    document.execCommand('fontSize', false, dummySize);
    
    const container = contentEditableRef.current;
    if (!container) return;

    // Standardize spans output by chrome sizes and naked font tags
    const spans = container.querySelectorAll<HTMLElement>('span, font, i, em');
    spans.forEach(span => {
      const isDummy7 = dummySize === '7' && (span.getAttribute('size') === '7' || span.style.fontSize === '-webkit-xxx-large' || span.style.fontSize === 'xx-large');
      const isDummy1 = dummySize === '1' && (span.getAttribute('size') === '1' || span.style.fontSize === '-webkit-x-small' || span.style.fontSize === 'x-small');
      
      if (isDummy7 || isDummy1) {
        span.removeAttribute('size');
        span.style.fontSize = `${newSize}px`;
      }
    });

    updateFormatState();
  };

  const handleBackgroundColorChange = (color: string) => {
    ydoc.transact(() => {
      const elements = ydoc.getArray<Y.Map<any>>('elements');
      const map = elements.toArray().find((m) => m.get('id') === el.id);
      if (map) {
        map.set('backgroundColor', color);
      }
    });
  };

  const screenX = el.x * stageProps.scale + stageProps.x;
  const screenY = el.y * stageProps.scale + stageProps.y;

  const rotation = el.rotation || 0;

  const baseContentStyle: React.CSSProperties = {
    fontSize: isCallout ? '18px' : '20px',
    lineHeight: 1.45,
    fontFamily: 'inherit',
    transform: `scale(${stageProps.scale}) rotate(${rotation}deg)`,
    transformOrigin: 'top left',
    width: el.width,
    height: el.height,
    backgroundColor: el.backgroundColor || (isCallout ? '#fff2b3' : '#ffffff'),
    borderRadius: isCallout ? '18px' : '2px',
    border: isCallout ? `1.5px solid ${isSelected ? '#0ea5e9' : '#d4a017'}` : undefined,
    boxShadow: isCallout ? '0 12px 30px rgba(245, 158, 11, 0.18)' : undefined,
  };

  if (!isEditing) {
    return (
      <div 
        className="absolute canvas-rich-text"
        style={{
          left: screenX,
          top: screenY,
          pointerEvents: 'none',
          zIndex: isSelected ? 10 : 1,
        }}
      >
        <style>{`
          .canvas-rich-text i, .canvas-rich-text em { font-style: italic !important; }
          .canvas-rich-text u { text-decoration: underline !important; }
          .canvas-rich-text b, .canvas-rich-text strong { font-weight: bold !important; }
        `}</style>
        <div
          style={{
           ...baseContentStyle,
           position: 'relative' // Anchor absolute children natively inside the scaled frame
          }}
        >
          {(isSelected || !localText) && (
            <div
              className="absolute inset-0 rounded"
              style={{
                border: '1.5px dashed #0ca3ba',
                background: localText ? 'transparent' : 'rgba(12,163,186,0.03)',
              }}
            />
          )}

          <div
            className="absolute inset-0 p-2 overflow-hidden break-words"
            style={{ color: '#1a1a1a' }}
            dangerouslySetInnerHTML={{ __html: localText || placeholderHtml }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute canvas-rich-text"
      style={{
        left: screenX,
        top: screenY,
        zIndex: 100,
      }}
    >
      <style>{`
        .canvas-rich-text i, .canvas-rich-text em { font-style: italic !important; }
        .canvas-rich-text u { text-decoration: underline !important; }
        .canvas-rich-text b, .canvas-rich-text strong { font-weight: bold !important; }
      `}</style>
      <div
        className="absolute bottom-[calc(100%+6px)] left-0 bg-white border border-zinc-200 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.10)] px-1.5 py-1 flex items-center gap-0.5 select-none"
        style={{ pointerEvents: 'auto', whiteSpace: 'nowrap' }}
        onMouseDown={(e) => e.preventDefault()} 
      >
        <button
          onMouseDown={(e) => { e.preventDefault(); handleExec('bold'); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-[13px] font-bold ${formatState.bold ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          onMouseDown={(e) => { e.preventDefault(); handleExec('italic'); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${formatState.italic ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          onMouseDown={(e) => { e.preventDefault(); handleExec('underline'); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${formatState.underline ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-zinc-200 mx-1" />

        <button
          onMouseDown={(e) => { e.preventDefault(); handleFontSizeChange(-4); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 text-[11px] font-bold transition-colors"
          title="Decrease Font Size"
        >
          A-
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleFontSizeChange(4); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 text-xs font-bold transition-colors"
          title="Increase Font Size"
        >
          A+
        </button>

        <div className="w-px h-4 bg-zinc-200 mx-1" />

        {(['left', 'center', 'right'] as const).map((align) => {
          const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
          return (
            <button
              key={align}
              onMouseDown={(e) => { e.preventDefault(); handleExec(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`); }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${formatState.align === align ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              title={`Align ${align}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}

        <div className="w-px h-4 bg-zinc-200 mx-1" />

        {/* Background Color Palette */}
        {(['#ffffff', '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff']).map((color) => {
          const isActive = (el.backgroundColor || '#ffffff') === color;
          return (
            <button
              key={color}
              onMouseDown={(e) => { e.preventDefault(); handleBackgroundColorChange(color); }}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                isActive ? 'border-zinc-800 scale-110 shadow-sm' : 'border-zinc-200 hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
              title={`Background Color ${color}`}
            />
          );
        })}
      </div>

      <div
        ref={contentEditableRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={updateFormatState}
        onMouseUp={updateFormatState}
        spellCheck
        style={{
          ...baseContentStyle,
          padding: '8px',
          margin: 0,
          outline: 'none',
          border: '2px solid #0ca3ba',
          borderRadius: '4px',
          boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.97)',
          color: '#1a1a1a',
          boxShadow: '0 0 0 4px rgba(12,163,186,0.12)',
          caretColor: '#0ca3ba',
          display: 'block',
          overflowY: 'auto',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      />
    </div>
  );
}
