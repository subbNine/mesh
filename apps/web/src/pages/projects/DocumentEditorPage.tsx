import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlertTriangle,
  ArrowLeft,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Save,
} from 'lucide-react';
import { useLibraryStore } from '../../store/library.store';
import { useProjectStore } from '../../store/project.store';

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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

const EMPTY_DOCUMENT_CONTENT: Record<string, unknown> = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

function getEditorContent(content: Record<string, unknown> | null | undefined) {
  if (content && typeof content === 'object' && 'type' in content) {
    return content;
  }

  return EMPTY_DOCUMENT_CONTENT;
}

export default function DocumentEditorPage() {
  const { workspaceId, projectId, docId } = useParams();
  const currentProject = useProjectStore((state) => state.currentProject);
  const {
    currentDocument,
    isSavingDocument,
    fetchDocument,
    updateDocument,
    clearCurrentDocument,
  } = useLibraryStore();

  const [draftTitle, setDraftTitle] = useState('');
  const [pendingContent, setPendingContent] = useState<Record<string, unknown>>(EMPTY_DOCUMENT_CONTENT);
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'saving'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[55vh] rounded-3xl bg-background px-5 py-5 text-[15px] text-foreground outline-none [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-zinc-950 [&_pre]:p-4 [&_pre]:text-zinc-100 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      setPendingContent(currentEditor.getJSON() as Record<string, unknown>);
      setSaveState('dirty');
    },
  });

  useEffect(() => {
    if (projectId && docId) {
      void fetchDocument(projectId, docId);
    }

    return () => clearCurrentDocument();
  }, [projectId, docId, fetchDocument, clearCurrentDocument]);

  useEffect(() => {
    if (!currentDocument) {
      return;
    }

    const editorContent = getEditorContent(currentDocument.content as Record<string, unknown> | null | undefined);

    setDraftTitle(currentDocument.title);
    setPendingContent(editorContent);
    setSaveState('saved');
    setLastSavedAt(new Date(currentDocument.updatedAt));

    if (editor) {
      editor.commands.setContent(editorContent as never, { emitUpdate: false });
    }
  }, [currentDocument, editor]);

  useEffect(() => {
    if (!projectId || !docId || !currentDocument || saveState !== 'dirty') {
      return;
    }

    const timeout = globalThis.setTimeout(async () => {
      try {
        setSaveState('saving');
        await updateDocument(projectId, docId, {
          title: draftTitle,
          content: pendingContent,
        });
        setLastSavedAt(new Date());
        setSaveState('saved');
      } catch (error) {
        console.error('Failed to auto-save document', error);
        setSaveState('dirty');
      }
    }, 3000);

    return () => globalThis.clearTimeout(timeout);
  }, [projectId, docId, currentDocument, draftTitle, pendingContent, saveState, updateDocument]);

  const wordCount = useMemo(() => {
    if (!editor) {
      return 0;
    }

    const text = editor.getText().trim();
    if (!text) {
      return 0;
    }

    return text.split(/\s+/).filter(Boolean).length;
  }, [editor, pendingContent]);

  const saveLabel = saveState === 'saving' || isSavingDocument
    ? 'Saving…'
    : saveState === 'dirty'
      ? 'Unsaved changes'
      : 'All changes saved';

  if (!currentDocument || !editor) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          Loading document editor…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <Link
        to={`/w/${workspaceId}/p/${projectId}?tab=library`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft size={16} />
        Back to Docs & files
      </Link>

      <div className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              {currentProject?.name ?? 'Project'} document
            </p>

            <input
              value={draftTitle}
              onChange={(event) => {
                setDraftTitle(event.target.value);
                setSaveState('dirty');
              }}
              placeholder="Untitled document"
              className="w-full bg-transparent text-3xl font-black tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            />

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{wordCount} words</span>
              <span className="rounded-full bg-muted px-3 py-1">{saveLabel}</span>
              {lastSavedAt && (
                <span>
                  Updated {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            <Save size={14} />
            Auto-saves after 3 seconds
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Live collaboration is not enabled for project docs yet.</p>
            <p className="mt-1 opacity-80">
              Changes are saved automatically and the latest save wins if two people edit the same document at once.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-border/60 pb-4">
          <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 size={16} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive('horizontalRule')} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={16} />
          </ToolbarButton>
        </div>

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
