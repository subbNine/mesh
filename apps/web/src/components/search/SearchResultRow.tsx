import type { ISearchResult } from '@mesh/shared';
import { LayoutGrid, CheckSquare, ChevronRight } from 'lucide-react';

interface Props {
  result: ISearchResult;
  onClick: () => void;
  isFocused?: boolean;
}

export function SearchResultRow({ result, onClick, isFocused }: Props) {
  const statusColor = (status?: string) => {
    switch (status) {
      case 'todo': return 'bg-zinc-400';
      case 'inprogress': return 'bg-amber-400';
      case 'review': return 'bg-sky-400';
      case 'done': return 'bg-emerald-400';
      default: return 'bg-zinc-300';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        isFocused ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        result.type === 'task' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
      }`}>
        {result.type === 'task' ? <LayoutGrid size={16} /> : <CheckSquare size={16} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span 
            className="text-sm font-medium truncate text-foreground"
            dangerouslySetInnerHTML={{ __html: result.highlight || result.title }}
          />
          {result.status && (
            <div className={`w-1.5 h-1.5 rounded-full ${statusColor(result.status)}`} />
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
          <span className="truncate">{result.projectName}</span>
          {result.parentTaskTitle && (
            <>
              <ChevronRight size={10} className="shrink-0" />
              <span className="truncate opacity-70">Task: {result.parentTaskTitle}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={14} className={`text-muted-foreground/30 transition-transform ${isFocused ? 'translate-x-0.5 opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
