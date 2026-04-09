import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  CircleDotDashed,
  Italic,
  List,
  ListOrdered,
  StickyNote,
  X,
} from 'lucide-react';

import { normalizeScratchpadContent } from '../../lib/scratchpad-utils';
import { useScratchpadStore } from '../../store/scratchpad.store';

function ToolbarButton({
  active,
  onClick,
  children,
}: Readonly<{
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
        active
          ? 'border-amber-400/80 bg-amber-100 text-amber-900 dark:border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-100'
          : 'border-slate-300/70 bg-white/70 text-slate-600 hover:border-amber-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-amber-300/40 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

type ScratchpadPanelProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>;

export function ScratchpadPanel({ isOpen, onClose }: ScratchpadPanelProps) {
  const scratchpad = useScratchpadStore((state) => state.scratchpad);
  const isLoading = useScratchpadStore((state) => state.isLoading);
  const isSaving = useScratchpadStore((state) => state.isSaving);
  const isDirty = useScratchpadStore((state) => state.isDirty);
  const fetchScratchpad = useScratchpadStore((state) => state.fetchScratchpad);
  const updateLocalContent = useScratchpadStore((state) => state.updateLocalContent);
  const saveScratchpad = useScratchpadStore((state) => state.saveScratchpad);

  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );

  const normalizedContent = useMemo(
    () => normalizeScratchpadContent(scratchpad?.content),
    [scratchpad?.content],
  );
  const serializedContent = useMemo(() => JSON.stringify(normalizedContent), [normalizedContent]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: normalizedContent as never,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'h-full min-h-[320px] overflow-y-auto overscroll-contain rounded-[24px] border border-amber-200/70 bg-white/70 px-4 py-4 text-[15px] text-slate-800 outline-none shadow-inner shadow-amber-100/50 backdrop-blur-sm [scrollbar-gutter:stable] [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-black [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-300 [&_blockquote]:pl-3 [&_blockquote]:italic dark:border-amber-200/20 dark:bg-slate-950/50 dark:text-slate-100',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      updateLocalContent(currentEditor.getJSON() as Record<string, unknown>);
    },
  });

  useEffect(() => {
    if (isOpen) {
      void fetchScratchpad();
    }
  }, [fetchScratchpad, isOpen]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentSerialized = JSON.stringify(editor.getJSON());
    if (currentSerialized !== serializedContent) {
      editor.commands.setContent(normalizedContent as never, { emitUpdate: false });
    }

    if (isOpen) {
      requestAnimationFrame(() => {
        editor.commands.focus('end');
      });
    }
  }, [editor, isOpen, normalizedContent, serializedContent]);

  useEffect(() => {
    if (!isOpen || !isDirty) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        void saveScratchpad();
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [isDirty, isOpen, saveScratchpad, serializedContent]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (useScratchpadStore.getState().isDirty) {
        void saveScratchpad();
      }
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [saveScratchpad]);

  const saveLabel = isOffline
    ? 'Offline · saved locally'
    : isSaving
      ? 'Syncing…'
      : isDirty
        ? 'Saving soon…'
        : 'All changes saved';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120]"
        >
          <button
            type="button"
            aria-label="Close scratchpad"
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"
          />

          <motion.aside
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute right-3 top-20 flex h-[min(78vh,680px)] min-h-0 w-[min(92vw,460px)] flex-col overflow-hidden rounded-[28px] border border-amber-200/70 bg-[#fffaf0]/95 text-slate-900 shadow-[0_35px_80px_-35px_rgba(120,72,20,0.45)] backdrop-blur-xl dark:border-amber-200/10 dark:bg-[#151821]/95 dark:text-slate-100 sm:right-6"
          >
            <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(180deg,transparent,transparent_31px,rgba(180,138,64,0.12)_32px)] dark:opacity-20" />

            <div className="relative flex h-full min-h-0 flex-col p-3 sm:p-4">
              <div className="mb-3 flex items-start justify-between gap-3 rounded-[22px] border border-amber-200/70 bg-white/70 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                    <StickyNote size={12} />
                    Personal scratchpad
                  </div>
                  <h3 className="mt-2 font-display text-xl font-black tracking-tight">Your working memory</h3>
                  <p className="mt-1 text-sm font-serif italic text-slate-600 dark:text-slate-300">
                    Private, persistent, and always within reach.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-amber-200/60 bg-amber-50/70 px-3 py-2.5 dark:border-amber-200/10 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center gap-2">
                  {editor && (
                    <>
                      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                        <Bold size={15} />
                      </ToolbarButton>
                      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                        <Italic size={15} />
                      </ToolbarButton>
                      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                        <List size={15} />
                      </ToolbarButton>
                      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                        <ListOrdered size={15} />
                      </ToolbarButton>
                    </>
                  )}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                  <CircleDotDashed size={12} className={isSaving ? 'animate-spin' : ''} />
                  {saveLabel}
                </div>
              </div>

              {isLoading && !scratchpad && !editor ? (
                <div className="flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-amber-200/70 bg-white/50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                  Loading scratchpad…
                </div>
              ) : (
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {!editor?.getText().trim() && (
                    <div className="pointer-events-none absolute left-5 top-4 z-10 max-w-[280px] text-sm italic text-slate-400 dark:text-slate-500">
                      Jot down rough plans, reminders, and half-formed ideas…
                    </div>
                  )}
                  <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto" />
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
