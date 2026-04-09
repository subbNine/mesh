import { create } from 'zustand';
import { type IScratchpad } from '@mesh/shared';

import { api } from '../lib/api';
import { normalizeScratchpadContent } from '../lib/scratchpad-utils';

const SCRATCHPAD_CACHE_KEY = 'mesh.scratchpad.cache.v1';

interface ScratchpadCache {
  id?: string;
  userId?: string;
  content: Record<string, unknown>;
  updatedAt: string;
  isDirty: boolean;
}

interface ScratchpadState {
  scratchpad: IScratchpad | null;
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  hasLoaded: boolean;
  fetchScratchpad: (force?: boolean) => Promise<IScratchpad | null>;
  updateLocalContent: (content: Record<string, unknown>) => void;
  saveScratchpad: () => Promise<void>;
  setOpen: (isOpen: boolean) => void;
}

const readCache = (): ScratchpadCache | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SCRATCHPAD_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ScratchpadCache;
  } catch (error) {
    console.error('Failed to parse scratchpad cache', error);
    window.localStorage.removeItem(SCRATCHPAD_CACHE_KEY);
    return null;
  }
};

const writeCache = (scratchpad: IScratchpad | null, isDirty: boolean) => {
  if (typeof window === 'undefined' || !scratchpad) {
    return;
  }

  window.localStorage.setItem(
    SCRATCHPAD_CACHE_KEY,
    JSON.stringify({
      id: scratchpad.id,
      userId: scratchpad.userId,
      content: normalizeScratchpadContent(scratchpad.content),
      updatedAt: new Date(scratchpad.updatedAt).toISOString(),
      isDirty,
    }),
  );
};

const buildScratchpadFromCache = (cache: ScratchpadCache): IScratchpad => ({
  id: cache.id ?? 'local-scratchpad',
  userId: cache.userId ?? 'me',
  content: normalizeScratchpadContent(cache.content),
  createdAt: cache.updatedAt,
  updatedAt: cache.updatedAt,
});

export const useScratchpadStore = create<ScratchpadState>((set, get) => ({
  scratchpad: null,
  isOpen: false,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  hasLoaded: false,

  fetchScratchpad: async (force = false) => {
    const cached = readCache();

    if (cached && (!get().scratchpad || get().isDirty)) {
      set({
        scratchpad: buildScratchpadFromCache(cached),
        isDirty: cached.isDirty,
      });
    }

    if (!force && get().hasLoaded && get().scratchpad) {
      return get().scratchpad;
    }

    set({ isLoading: true });

    try {
      const { data } = await api.get('/scratchpad/me');
      const normalized = {
        ...data,
        content: normalizeScratchpadContent(data.content),
      } as IScratchpad;

      set((state) => {
        const nextScratchpad = state.isDirty && state.scratchpad
          ? { ...normalized, content: normalizeScratchpadContent(state.scratchpad.content) }
          : normalized;

        writeCache(nextScratchpad, state.isDirty);

        return {
          scratchpad: nextScratchpad,
          isLoading: false,
          hasLoaded: true,
        };
      });

      return get().scratchpad;
    } catch (error) {
      console.error('Failed to fetch scratchpad', error);
      set({ isLoading: false, hasLoaded: Boolean(get().scratchpad) });
      return get().scratchpad;
    }
  },

  updateLocalContent: (content) => {
    set((state) => {
      const now = new Date().toISOString();
      const scratchpad = state.scratchpad ?? {
        id: 'local-scratchpad',
        userId: 'me',
        content: normalizeScratchpadContent(content),
        createdAt: now,
        updatedAt: now,
      };

      const nextScratchpad: IScratchpad = {
        ...scratchpad,
        content: normalizeScratchpadContent(content),
        updatedAt: now,
      };

      writeCache(nextScratchpad, true);

      return {
        scratchpad: nextScratchpad,
        isDirty: true,
        hasLoaded: true,
      };
    });
  },

  saveScratchpad: async () => {
    const { scratchpad, isSaving } = get();

    if (!scratchpad || isSaving) {
      return;
    }

    set({ isSaving: true });

    try {
      const { data } = await api.patch('/scratchpad/me', {
        content: normalizeScratchpadContent(scratchpad.content),
      });

      const normalized = {
        ...data,
        content: normalizeScratchpadContent(data.content),
      } as IScratchpad;

      set({
        scratchpad: normalized,
        isSaving: false,
        isDirty: false,
        hasLoaded: true,
      });

      writeCache(normalized, false);
    } catch (error) {
      console.error('Failed to save scratchpad', error);
      set({ isSaving: false });
    }
  },

  setOpen: (isOpen) => {
    set({ isOpen });

    if (isOpen) {
      void get().fetchScratchpad();
    }
  },
}));
