import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Command, CornerDownLeft } from 'lucide-react';
import { useSearchStore } from '../../store/search.store';
import { SearchResultRow } from './SearchResultRow';
import type { ISearchResult } from '@mesh/shared';

export function SearchPalette() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { 
    isOpen, 
    setIsOpen, 
    query, 
    results, 
    isLoading, 
    history,
    setQuery, 
    search, 
    addToHistory,
    clearHistory 
  } = useSearchStore();

  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Keyboard Shortcut ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // ── Focus Input ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setFocusedIndex(0);
    }
  }, [isOpen]);

  // ── Debounced Search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (workspaceId && query.length > 2) {
        search(workspaceId, query);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, workspaceId, search]);

  const handleSelect = useCallback((result: ISearchResult) => {
    addToHistory(result);
    setIsOpen(false);
    setQuery('');
    
    if (result.type === 'task') {
      navigate(`/w/${workspaceId}/p/${result.projectId}/tasks/${result.id}/canvas`);
    } else {
      // For subtasks, navigate to parent task canvas
      navigate(`/w/${workspaceId}/p/${result.projectId}/tasks/${result.parentTaskId}/canvas`);
    }
  }, [workspaceId, navigate, addToHistory, setIsOpen, setQuery]);

  // ── Keyboard Navigation ──
  const currentList = query.length > 0 ? results : history;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % Math.max(currentList.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + currentList.length) % Math.max(currentList.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentList[focusedIndex]) {
        handleSelect(currentList[focusedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-background/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden glass"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/40">
              <Search className="text-muted-foreground w-5 h-5" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, subtasks..."
                className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/60 text-foreground"
              />
              <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md bg-muted/30 border border-border/40">
                <Command size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">K</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results Content */}
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2 px-2">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-xs font-medium">Searching workspace...</span>
                </div>
              ) : query.length > 0 ? (
                <>
                  {results.length > 0 ? (
                    <div className="space-y-1">
                      <h4 className="px-3 py-2 text-[10px] uppercase tracking-wider font-black text-muted-foreground/50">Search Results</h4>
                      {results.map((result, idx) => (
                        <SearchResultRow 
                          key={`${result.type}-${result.id}`}
                          result={result}
                          onClick={() => handleSelect(result)}
                          isFocused={focusedIndex === idx}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                      <Search size={32} />
                      <p className="text-sm font-medium">No results for "{query}"</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {history.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-3 py-2">
                        <h4 className="text-[10px] uppercase tracking-wider font-black text-muted-foreground/50">Recent Searches</h4>
                        <button 
                          onClick={clearHistory}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      {history.map((result, idx) => (
                        <SearchResultRow 
                          key={`${result.type}-${result.id}-history`}
                          result={result}
                          onClick={() => handleSelect(result)}
                          isFocused={focusedIndex === idx}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center gap-1 text-muted-foreground/50 text-center">
                      <Command size={32} className="mb-2" />
                      <p className="text-sm font-medium px-8">Quickly find tasks across your workspace</p>
                      <p className="text-xs opacity-60">Try searching for project titles or task descriptions</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="bg-muted px-1.5 py-0.5 rounded border border-border/50">↑↓</span>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CornerDownLeft size={12} />
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="bg-muted px-1.5 py-0.5 rounded border border-border/50">ESC</span>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
