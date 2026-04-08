import { create } from 'zustand';

const INK_COLOR_STORAGE_KEY = 'mesh_canvas_ink_color';
const DEFAULT_INK_COLOR = '#111827';

function loadInkColor() {
  try {
    return globalThis.localStorage?.getItem(INK_COLOR_STORAGE_KEY) || DEFAULT_INK_COLOR;
  } catch {
    return DEFAULT_INK_COLOR;
  }
}

export type CanvasTool = 'select' | 'text' | 'image' | 'comment' | 'pencil' | 'callout';

interface CanvasState {
  activeTool: CanvasTool;
  selectedElementId: string | null;
  isCommentPaneOpen: boolean;
  activeCommentId: string | null;
  zoom: number;
  sidebarMode: 'navigation' | 'thumbnails';
  inkColor: string;

  setActiveTool: (tool: CanvasTool) => void;
  setSelectedElement: (id: string | null) => void;
  setCommentPaneOpen: (open: boolean) => void;
  toggleCommentPane: () => void;
  setActiveComment: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setSidebarMode: (mode: 'navigation' | 'thumbnails') => void;
  setInkColor: (color: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: 'select',
  selectedElementId: null,
  isCommentPaneOpen: false,
  activeCommentId: null,
  zoom: 1,
  sidebarMode: 'navigation',
  inkColor: loadInkColor(),

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  setCommentPaneOpen: (open) => set({ isCommentPaneOpen: open }),
  toggleCommentPane: () => set((state) => ({ isCommentPaneOpen: !state.isCommentPaneOpen })),
  setActiveComment: (id) => set({ activeCommentId: id, isCommentPaneOpen: !!id || undefined }),
  setZoom: (zoom) => set({ zoom }),
  setSidebarMode: (mode) => set({ sidebarMode: mode }),
  setInkColor: (inkColor) => {
    try {
      globalThis.localStorage?.setItem(INK_COLOR_STORAGE_KEY, inkColor);
    } catch {
      // ignore storage errors
    }
    set({ inkColor });
  },
}));
