import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as Y from 'yjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontSize } from './extensions/FontSize';
import { useProjectStore } from '../../store/project.store';
import { getMentionSuggestions } from '../mentions/mention-suggestions';
import { api } from '../../lib/api';

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
  const members = useProjectStore((state) => state.members);
  const [localText, setLocalText] = useState(el.content ?? '');
  const justCommitted = useRef(false);
  const isCallout = variant === 'callout';
  const placeholderHtml = isCallout
    ? 'Add callout...'
    : 'Text block...';
  
  const mentionSuggestions = useMemo(() => getMentionSuggestions(members), [members]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention text-primary font-bold bg-primary/5 px-1 rounded',
        },
        suggestion: mentionSuggestions,
      }),
    ],
    content: el.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const scrollHeight = editor.view.dom.scrollHeight;
      const padding = isCallout ? 28 : 16;
      const contentHeight = Math.max(el.height, scrollHeight + padding);
      
      if (contentHeight > el.height + 2) { // Add 2px threshold to prevent loops
        ydoc.transact(() => {
          const arr = ydoc.getArray<Y.Map<any>>('elements');
          const map = arr.toArray().find(m => m.get('id') === el.id);
          if (map) map.set('height', contentHeight);
        });
      }
    },
  });

  const hasCommittedThisSession = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      if (justCommitted.current) return;
      setLocalText(el.content ?? '');
      if (editor) {
        editor.commands.setContent(el.content ?? '', false);
      }
    }
  }, [el.content, isEditing, editor]);

  const commit = useCallback(async () => {
    if (editor && !hasCommittedThisSession.current) {
      const html = editor.getHTML();
      hasCommittedThisSession.current = true;
      
      setLocalText(html);
      justCommitted.current = true;
      saveContent(ydoc, el.id, html);
      
      // Trigger backend mention processing
      const taskId = window.location.pathname.split('/').pop() || '';
      if (taskId && html.includes('data-mention-id')) {
        api.post(`/canvas/${taskId}/mentions`, { elementId: el.id, text: html }).catch(console.error);
      }
      
      setTimeout(() => { justCommitted.current = false; }, 500);
    }
    onEndEdit();
  }, [editor, ydoc, el.id, onEndEdit]);

  useEffect(() => {
    if (isEditing) {
      hasCommittedThisSession.current = false;
      if (editor) {
        editor.commands.focus();
      }
    }
    
    return () => {
      if (isEditing && editor && !hasCommittedThisSession.current) {
        const html = editor.getHTML();
        saveContent(ydoc, el.id, html);
      }
    };
  }, [isEditing, ydoc, el.id, editor]);

  const handleBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handleBackgroundColorChange = (color: string) => {
    ydoc.transact(() => {
      const elements = ydoc.getArray<Y.Map<any>>('elements');
      const map = elements.toArray().find((m) => m.get('id') === el.id);
      if (map) {
        map.set('backgroundColor', color);
      }
    });
  };

  const baseContentStyle: React.CSSProperties = {
    fontSize: isCallout ? '18px' : '20px',
    lineHeight: isCallout ? '26px' : '29px',
    fontFamily: 'inherit',
    transform: `scale(${stageProps.scale}) rotate(${el.rotation || 0}deg)`,
    transformOrigin: 'top left',
    width: el.width,
    height: el.height,
    backgroundColor: el.backgroundColor || (isCallout ? '#fff2b3' : '#ffffff'),
    borderRadius: isCallout ? '18px' : '2px',
    border: isCallout ? `1.5px solid ${isSelected ? '#0ea5e9' : '#d4a017'}` : undefined,
    boxShadow: isCallout ? '0 12px 30px rgba(245, 158, 11, 0.18)' : undefined,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  if (!isEditing) {
    return (
      <div 
        className="absolute canvas-rich-text"
        style={{
          left: el.x * stageProps.scale + stageProps.x,
          top: el.y * stageProps.scale + stageProps.y,
          pointerEvents: 'none',
          zIndex: isSelected ? 10 : 1,
        }}
      >
        <div
          style={{
            ...baseContentStyle,
            position: 'relative'
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

          <style>{`
            .canvas-rich-text-content span[style*="font-size"] {
              vertical-align: baseline;
            }
            .canvas-rich-text-content p {
              margin: 0;
            }
          `}</style>
          <div
            className="absolute inset-0 overflow-hidden break-words canvas-rich-text-content"
            style={{
              color: '#1a1a1a',
              padding: isCallout ? '12px 14px' : '8px',
              boxSizing: 'border-box',
            }}
            dangerouslySetInnerHTML={{ __html: localText || `<span style="color: #adb5bd; font-style: italic;">${placeholderHtml}</span>` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute canvas-rich-text"
      style={{
        left: el.x * stageProps.scale + stageProps.x,
        top: el.y * stageProps.scale + stageProps.y,
        zIndex: 100,
      }}
    >

      <AnimatePresence>
        {editor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute bottom-[calc(100%+6px)] left-0 bg-white/90 backdrop-blur-xl border border-zinc-200 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] px-1.5 py-1 flex items-center gap-0.5 select-none z-[101]"
            style={{ pointerEvents: 'auto', whiteSpace: 'nowrap' }}
            onMouseDown={(e) => e.preventDefault()} 
          >
            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors text-[13px] font-bold ${editor.isActive('bold') ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <button
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-zinc-200 mx-1" />

            <button
              onMouseDown={(e) => { 
                e.preventDefault(); 
                const attrs = editor.getAttributes('textStyle');
                let currentSize = 20;
                if (attrs?.fontSize) currentSize = parseInt(attrs.fontSize.replace('px', ''));
                editor.chain().focus().setFontSize(Math.max(8, currentSize - 4)).run();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 text-[11px] font-bold transition-colors"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onMouseDown={(e) => { 
                e.preventDefault(); 
                const attrs = editor.getAttributes('textStyle');
                let currentSize = 20;
                if (attrs?.fontSize) currentSize = parseInt(attrs.fontSize.replace('px', ''));
                editor.chain().focus().setFontSize(Math.min(96, currentSize + 4)).run();
              }}
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
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign(align).run(); }}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: align }) ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
                  title={`Align ${align}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}

            <div className="w-px h-4 bg-zinc-200 mx-1" />

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
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        style={{
          ...baseContentStyle,
          position: 'relative',
          border: '2px solid #0ca3ba',
          borderRadius: isCallout ? '18px' : '4px',
          background: el.backgroundColor || (isCallout ? '#fff2b3' : 'rgba(255,255,255,0.97)'),
          boxShadow: '0 0 0 4px rgba(12,163,186,0.12)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            commit();
          }
          e.stopPropagation();
        }}
      >
        <style>{`
          .tiptap-editor-container .ProseMirror span[style*="font-size"] {
            vertical-align: baseline;
          }
          .tiptap-editor-container .ProseMirror p {
            margin: 0;
          }
        `}</style>
        <EditorContent 
          editor={editor}
          className="tiptap-editor-container"
          style={{
            position: 'absolute',
            inset: isCallout ? '2px' : '0',
            padding: isCallout ? '12px 14px' : '8px',
            margin: 0,
            outline: 'none',
            border: 'none',
            borderRadius: isCallout ? '16px' : '2px',
            boxSizing: 'border-box',
            background: 'transparent',
            color: '#1a1a1a',
            caretColor: '#0ca3ba',
            display: 'block',
            width: isCallout ? 'calc(100% - 4px)' : '100%',
            height: isCallout ? 'calc(100% - 4px)' : '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          onBlur={handleBlur}
        />
      </div>
    </div>
  );
}
