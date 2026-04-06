import type { IProjectFolder } from '@mesh/shared';
import { ChevronRight, FolderOpen } from 'lucide-react';

interface FolderViewProps {
  currentFolder: IProjectFolder | null;
  onRootClick: () => void;
}

export function FolderView({ currentFolder, onRootClick }: FolderViewProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <button
        onClick={onRootClick}
        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
      >
        <FolderOpen size={14} />
        Library root
      </button>

      {currentFolder && (
        <>
          <ChevronRight size={14} className="opacity-60" />
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {currentFolder.name}
          </span>
        </>
      )}
    </div>
  );
}
