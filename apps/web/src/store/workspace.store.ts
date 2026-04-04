import { create } from 'zustand';
import { api } from '../lib/api';

interface WorkspaceState {
  workspaces: any[];
  currentWorkspace: any | null;
  members: any[];
  isLoading: boolean;
  error: string | null;
  
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<any>;
  setCurrentWorkspace: (workspace: any | null) => void;
  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role?: string) => Promise<void>;
  removeMember: (workspaceId: string, userId: string) => Promise<void>;
  updateWorkspace: (workspaceId: string, payload: { name?: string }) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, _get) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/workspaces');
      set({ workspaces: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch workspaces', isLoading: false });
      throw error;
    }
  },

  createWorkspace: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/workspaces', { name });
      set(state => ({ 
        workspaces: [...state.workspaces, response.data],
        isLoading: false 
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create workspace', isLoading: false });
      throw error;
    }
  },

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  fetchMembers: async (workspaceId: string) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/members`);
      set({ members: response.data });
    } catch (error: any) {
      console.error('Fetch members error:', error);
      throw error;
    }
  },

  inviteMember: async (workspaceId: string, email: string, role?: string) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/members/invite`, { email, role });
      set(state => ({ members: [...state.members, response.data] }));
    } catch (error: any) {
      console.error('Invite member error:', error);
      throw error;
    }
  },

  removeMember: async (workspaceId: string, userId: string) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
      set(state => ({ members: state.members.filter(m => m.userId !== userId) }));
    } catch (error: any) {
      console.error('Remove member error:', error);
      throw error;
    }
  },

  updateWorkspace: async (workspaceId: string, payload: { name?: string }) => {
    try {
      const response = await api.patch(`/workspaces/${workspaceId}`, payload);
      set(state => ({
        workspaces: state.workspaces.map(w => w.id === workspaceId ? response.data : w),
        currentWorkspace: state.currentWorkspace?.id === workspaceId ? response.data : state.currentWorkspace
      }));
    } catch (error: any) {
      console.error('Update workspace error:', error);
      throw error;
    }
  },

  deleteWorkspace: async (workspaceId: string) => {
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      set(state => ({
        workspaces: state.workspaces.filter(w => w.id !== workspaceId),
        currentWorkspace: state.currentWorkspace?.id === workspaceId ? null : state.currentWorkspace
      }));
    } catch (error: any) {
      console.error('Delete workspace error:', error);
      throw error;
    }
  },
}));
