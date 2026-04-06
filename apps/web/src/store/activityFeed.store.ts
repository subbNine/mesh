import { create } from 'zustand';
import { type IActivityEvent } from '@mesh/shared';
import { api } from '../lib/api';

interface ActivityQueryFilters {
  projectId?: string[];
  actorId?: string[];
  eventType?: string[];
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function mergeEvents(current: IActivityEvent[], incoming: IActivityEvent[]) {
  const byId = new Map<string, IActivityEvent>();

  for (const event of [...current, ...incoming]) {
    byId.set(event.id, event);
  }

  return Array.from(byId.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

interface ActivityFeedState {
  workspaceEvents: IActivityEvent[];
  workspaceTotal: number;
  workspaceHasMore: boolean;
  isLoadingWorkspace: boolean;
  taskEvents: Record<string, IActivityEvent[]>;
  taskHasMore: Record<string, boolean>;
  isLoadingTask: Record<string, boolean>;
  fetchWorkspaceActivity: (workspaceId: string, filters?: ActivityQueryFilters, append?: boolean) => Promise<void>;
  fetchTaskActivity: (taskId: string, filters?: Pick<ActivityQueryFilters, 'page' | 'limit'>, append?: boolean) => Promise<void>;
  clearWorkspaceActivity: () => void;
}

export const useActivityFeedStore = create<ActivityFeedState>((set) => ({
  workspaceEvents: [],
  workspaceTotal: 0,
  workspaceHasMore: false,
  isLoadingWorkspace: false,
  taskEvents: {},
  taskHasMore: {},
  isLoadingTask: {},

  fetchWorkspaceActivity: async (workspaceId, filters = {}, append = false) => {
    set({ isLoadingWorkspace: true });

    try {
      const params: Record<string, string | number> = {};

      if (filters.projectId && filters.projectId.length > 0) {
        params.projectId = filters.projectId.join(',');
      }

      if (filters.actorId && filters.actorId.length > 0) {
        params.actorId = filters.actorId.join(',');
      }

      if (filters.eventType && filters.eventType.length > 0) {
        params.eventType = filters.eventType.join(',');
      }

      if (filters.from) {
        params.from = filters.from;
      }

      if (filters.to) {
        params.to = filters.to;
      }

      if (filters.page) {
        params.page = filters.page;
      }

      if (filters.limit) {
        params.limit = filters.limit;
      }

      const { data } = await api.get(`/workspaces/${workspaceId}/activity`, { params });

      set((state) => ({
        workspaceEvents: append ? mergeEvents(state.workspaceEvents, data.events) : data.events,
        workspaceHasMore: data.hasMore,
        workspaceTotal: data.total,
        isLoadingWorkspace: false,
      }));
    } catch (error) {
      console.error('Failed to fetch workspace activity', error);
      set({ isLoadingWorkspace: false });
    }
  },

  fetchTaskActivity: async (taskId, filters = {}, append = false) => {
    set((state) => ({
      isLoadingTask: {
        ...state.isLoadingTask,
        [taskId]: true,
      },
    }));

    try {
      const params: Record<string, number> = {};

      if (filters.page) {
        params.page = filters.page;
      }

      if (filters.limit) {
        params.limit = filters.limit;
      }

      const { data } = await api.get(`/tasks/${taskId}/activity`, { params });

      set((state) => ({
        taskEvents: {
          ...state.taskEvents,
          [taskId]: append ? mergeEvents(state.taskEvents[taskId] ?? [], data.events) : data.events,
        },
        taskHasMore: {
          ...state.taskHasMore,
          [taskId]: data.hasMore,
        },
        isLoadingTask: {
          ...state.isLoadingTask,
          [taskId]: false,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch task activity', error);
      set((state) => ({
        isLoadingTask: {
          ...state.isLoadingTask,
          [taskId]: false,
        },
      }));
    }
  },

  clearWorkspaceActivity: () => set({
    workspaceEvents: [],
    workspaceHasMore: false,
    workspaceTotal: 0,
  }),
}));
