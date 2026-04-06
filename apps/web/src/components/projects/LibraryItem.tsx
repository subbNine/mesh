import { useMemo, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { IProjectDocument, IProjectFile, IProjectFolder } from '@mesh/shared';
import {
  FileImage,
  FileText,
  Folder,
  GripHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

interface LibraryItemProps {
  type: 'folder' | 'document' | 'file';
  item: IProjectFolder | IProjectDocument | IProjectFile;
  title: string;
  meta: string;
  description?: string;
  onOpen: () => void;
  onDelete?: () => void;
  onRename?: (name: string) => Promise<void> | void;
}

export function LibraryItem({
  type,
  item,
  title,
  meta,
  description,
  onOpen,
  onDelete,
  onRename,
}: Readonly<LibraryItemProps>) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(title);

  const draggable = useDraggable({
    id: `${type}-${item.id}`,
    data: {
      itemId: item.id,
      itemType: type,
    },
    disabled: type === 'folder',
  });

  const droppable = useDroppable({
    id: `folder-${item.id}`,
    data: { folderId: item.id },
    disabled: type !== 'folder',
  });

  const style = useMemo(
    () => ({
      transform: CSS.Translate.toString(draggable.transform),
      opacity: draggable.isDragging ? 0.5 : 1,
    }),
    [draggable.transform, draggable.isDragging],
  );

  const icon = (() => {
    if (type === 'folder') return <Folder size={18} />;
    if (type === 'document') return <FileText size={18} />;

    const imageExtension = /\.(png|jpg|jpeg|gif|webp|svg)$/i;
    return imageExtension.exec(title) ? <FileImage size={18} /> : <FileText size={18} />;
  })();

  const accentClasses = {
    folder: 'bg-amber-500/12 text-amber-600 dark:text-amber-300',
    document: 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
    file: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  } as const;

  const submitRename = async () => {
    const nextName = name.trim();
    if (!nextName || nextName === title || !onRename) {
      setName(title);
      setIsRenaming(false);
      return;
    }

    await onRename(nextName);
    setIsRenaming(false);
  };

  return (
    <div
      ref={type === 'folder' ? droppable.setNodeRef : draggable.setNodeRef}
      style={type === 'folder' ? undefined : style}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border bg-card/70 p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg ${
        type === 'folder' && droppable.isOver ? 'border-primary bg-primary/5' : 'border-border/60'
      }`}
      {...(type === 'folder' ? { role: 'button', tabIndex: 0 } : draggable.attributes)}
      {...(type === 'folder' ? {} : draggable.listeners)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${accentClasses[type]}`}>
          {icon}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          {type !== 'folder' && <GripHorizontal size={14} className="opacity-60" />}
          {type === 'file' && onRename && !isRenaming && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setIsRenaming(true);
              }}
              className="rounded-full p-1.5 transition hover:bg-muted hover:text-foreground"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="rounded-full p-1.5 transition hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-4 space-y-2">
        {isRenaming ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onBlur={() => void submitRename()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submitRename();
              }
              if (event.key === 'Escape') {
                setName(title);
                setIsRenaming(false);
              }
            }}
            className="w-full rounded-xl border border-primary/30 bg-background px-3 py-2 text-sm font-semibold text-foreground outline-none ring-0"
          />
        ) : (
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{title}</h3>
        )}

        {description && <p className="line-clamp-2 text-xs text-muted-foreground">{description}</p>}
        <p className="text-[11px] text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}
