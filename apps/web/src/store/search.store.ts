import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';
import type { ISearchResult } from '@mesh/shared';

interface SearchState {
  query: string;
  results: ISearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  history: ISearchResult[];
  
  setQuery: (query: string) => void;
  setIsOpen: (isOpen: boolean) => void;
  search: (workspaceId: string, query: string) => Promise<void>;
  addToHistory: (result: ISearchResult) => void;
  clearHistory: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: '',
      results: [],
      isLoading: false,
      isOpen: false,
      history: [],

      setQuery: (query) => set({ query }),
      setIsOpen: (isOpen) => set({ isOpen }),

      search: async (workspaceId, query) => {
        if (!query.trim()) {
          set({ results: [], isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const { data } = await api.get(`/workspaces/${workspaceId}/search`, {
            params: { q: query },
          });
          set({ results: data, isLoading: false });
        } catch (error) {
          console.error('Search failed', error);
          set({ results: [], isLoading: false });
        }
      },

      addToHistory: (result) => {
        const { history } = get();
        const filtered = history.filter((item) => item.id !== result.id);
        const next = [result, ...filtered].slice(0, 10);
        set({ history: next });
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'mesh_search_history',
      partialize: (state) => ({ history: state.history }),
    }
  )
);
