import React, { useMemo } from 'react';
import { Send, X } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { useProjectStore } from '../../store/project.store';
import { getMentionSuggestions } from '../mentions/mention-suggestions';

interface CommentComposeProps {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

export function CommentCompose({ screenX, screenY, onSubmit, onCancel }: CommentComposeProps) {
  const members = useProjectStore((state) => state.members);
  const mentionSuggestions = useMemo(() => getMentionSuggestions(members), [members]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention text-primary font-bold bg-primary/5 px-1 rounded',
        },
        suggestion: mentionSuggestions,
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'w-full text-[13px] p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[80px] text-zinc-800 placeholder:text-zinc-400 font-medium',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSubmit();
          return true;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
          return true;
        }
        return false;
      },
    },
  });

  const handleSubmit = () => {
    if (editor && !editor.isEmpty) {
      onSubmit(editor.getHTML());
      editor.commands.clearContent();
    }
  };

  return (
    <div
      className="absolute bg-white rounded-xl shadow-xl border border-zinc-200/80 p-3 flex flex-col gap-3 w-72 animate-in fade-in zoom-in-95 duration-100 z-50 focus-within:ring-4 focus-within:ring-primary/5 transition-all"
      style={{
        left: screenX,
        top: screenY,
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-semibold text-zinc-900">New Comment</span>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-700 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative group">
        {!editor?.getText() && (
          <div className="absolute top-2.5 left-2.5 text-[13px] text-zinc-400 pointer-events-none font-medium">
            Type a comment...
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!editor || editor.isEmpty}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Comment
        </button>
      </div>
    </div>
  );
}

