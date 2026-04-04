import React, { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';

interface CommentComposeProps {
  screenX: number;
  screenY: number;
  canvasX: number;
  canvasY: number;
  onSubmit: (body: string) => void;
  onCancel: () => void;
}

export function CommentCompose({ screenX, screenY, onSubmit, onCancel }: CommentComposeProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    // Prevent these keys from bubbling to canvas stage logic
    e.stopPropagation();
  };

  return (
    <div
      className="absolute bg-white rounded-xl shadow-xl border border-zinc-200/80 p-3 flex flex-col gap-3 w-72 animate-in fade-in zoom-in-95 duration-100 z-50"
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
      
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a comment..."
        className="w-full text-[13px] p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-zinc-800 placeholder-zinc-400 transition-all font-medium"
        rows={3}
      />
      
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[13px] font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Comment
        </button>
      </div>
    </div>
  );
}
