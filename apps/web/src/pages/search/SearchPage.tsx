import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, Filter, LayoutGrid, CheckSquare, ChevronRight, ArrowUpDown } from 'lucide-react';
import { useSearchStore } from '../../store/search.store';
import { SearchResultRow } from '../../components/search/SearchResultRow';
import type { ISearchResult } from '@mesh/shared';

export default function SearchPage() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  
  const { results, isLoading, search, addToHistory } = useSearchStore();
  const [filterType, setFilterType] = useState<'all' | 'task' | 'subtask'>('all');

  useEffect(() => {
    if (workspaceId && q) {
      search(workspaceId, q);
    }
  }, [workspaceId, q, search]);

  const filteredResults = results.filter(r => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const handleSelect = (result: ISearchResult) => {
    addToHistory(result);
    // Navigation handled by the component or manually
    const url = result.type === 'task' 
      ? `/w/${workspaceId}/p/${result.projectId}/tasks/${result.id}/canvas`
      : `/w/${workspaceId}/p/${result.projectId}/tasks/${result.parentTaskId}/canvas`;
    window.location.href = url;
  };

  return (
    <div className="h-full flex flex-col bg-background/30 backdrop-blur-3xl overflow-hidden rounded-3xl border border-border/40 shadow-2xl relative z-10">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-dot-grid opacity-[0.08] pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-8 border-b border-border/40 relative z-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-black tracking-tight mb-6">Search Results</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                defaultValue={q}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchParams({ q: e.currentTarget.value });
                  }
                }}
                className="w-full bg-card/40 border border-border/50 py-3.5 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base placeholder:text-muted-foreground/60"
                placeholder="Search anything..."
              />
            </div>
            
            <div className="flex items-center gap-2 bg-card/40 border border-border/50 p-1.5 rounded-2xl">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'all' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('task')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'task' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                Tasks
              </button>
              <button
                onClick={() => setFilterType('subtask')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'subtask' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              >
                Subtasks
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 overflow-y-auto px-6 py-8 relative z-10 scrollbar-none">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-medium">Searching for "{q}"...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-muted-foreground px-2">
                <span className="text-xs font-bold uppercase tracking-widest">{filteredResults.length} matches located</span>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <ArrowUpDown size={12} />
                  <span>Ranked by Relevance</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {filteredResults.map((result) => (
                  <SearchResultRow
                    key={`${result.type}-${result.id}-page`}
                    result={result}
                    onClick={() => handleSelect(result)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-muted-foreground/30 text-center">
              <Search size={64} className="mb-2 opacity-50" />
              <div className="space-y-1">
                <p className="text-xl font-display font-black text-muted-foreground/50">No results for "{q}"</p>
                <p className="text-sm">Try broadening your search or checking project filters</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
