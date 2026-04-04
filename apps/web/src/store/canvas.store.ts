import { create } from 'zustand';

interface CanvasState {
  activeTool: 'select' | 'text' | 'image' | 'comment';
  selectedElementId: string | null;
  isCommentPaneOpen: boolean;
  activeCommentId: string | null;
  zoom: number;
  sidebarMode: 'navigation' | 'thumbnails';

  setActiveTool: (tool: 'select' | 'text' | 'image' | 'comment') => void;
  setSelectedElement: (id: string | null) => void;
  toggleCommentPane: () => void;
  setActiveComment: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setSidebarMode: (mode: 'navigation' | 'thumbnails') => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: 'select',
  selectedElementId: null,
  isCommentPaneOpen: false,
  activeCommentId: null,
  zoom: 1,
  sidebarMode: 'navigation',

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  toggleCommentPane: () => set((state) => ({ isCommentPaneOpen: !state.isCommentPaneOpen })),
  setActiveComment: (id) => set({ activeCommentId: id, isCommentPaneOpen: !!id }),
  setZoom: (zoom) => set({ zoom }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
}));
