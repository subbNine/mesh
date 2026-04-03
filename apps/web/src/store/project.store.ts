import { create } from 'zustand';
import { api } from '../lib/api';

export interface IProject {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  taskCount?: number;
  memberCount?: number;
}

export interface IProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface IProjectExclusion {
  id: string;
  projectId: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

interface ProjectState {
  projects: IProject[];
  currentProject: IProject | null;
  members: IProjectMember[];
  exclusions: IProjectExclusion[];
  isLoading: boolean;
  
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, name: string, description?: string) => Promise<IProject>;
  setCurrentProject: (project: IProject | null) => void;
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  fetchMembers: (projectId: string) => Promise<void>;
  addMember: (projectId: string, userId: string, role?: string) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  excludeWorkspaceMember: (projectId: string, userId: string) => Promise<void>;
  removeExclusion: (projectId: string, userId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  members: [],
  exclusions: [],
  isLoading: false,

  fetchProjects: async (workspaceId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/workspaces/${workspaceId}/projects`);
      set({ projects: data });
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (workspaceId: string, name: string, description?: string) => {
    const { data } = await api.post(`/workspaces/${workspaceId}/projects`, { name, description });
    set((state) => ({ projects: [...state.projects, data] }));
    return data;
  },

  setCurrentProject: (project: IProject | null) => {
    set({ currentProject: project });
  },

  updateProject: async (projectId: string, payload: { name?: string; description?: string }) => {
    const { data } = await api.patch(`/projects/${projectId}`, payload);
    set((state) => ({
      projects: state.projects.map(p => p.id === projectId ? { ...p, ...data } : p),
      currentProject: state.currentProject?.id === projectId ? { ...state.currentProject, ...data } : state.currentProject,
    }));
  },

  deleteProject: async (projectId: string) => {
    await api.delete(`/projects/${projectId}`);
    set((state) => ({
      projects: state.projects.filter(p => p.id !== projectId),
      currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
    }));
  },

  fetchMembers: async (projectId: string) => {
    const { data } = await api.get(`/projects/${projectId}/members`);
    set({ members: data.active, exclusions: data.excluded });
  },

  addMember: async (projectId: string, userId: string, role?: string) => {
    const { data } = await api.post(`/projects/${projectId}/members`, { userId, role });
    set((state) => ({
      members: [...state.members, data],
      exclusions: state.exclusions.filter(e => e.userId !== userId)
    }));
  },

  removeMember: async (projectId: string, userId: string) => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
    set((state) => ({
      members: state.members.filter(m => m.userId !== userId)
    }));
  },

  excludeWorkspaceMember: async (projectId: string, userId: string) => {
    const { data } = await api.post(`/projects/${projectId}/exclusions`, { userId });
    set((state) => ({
      exclusions: [...state.exclusions, data],
      members: state.members.filter(m => m.userId !== userId)
    }));
  },

  removeExclusion: async (projectId: string, userId: string) => {
    await api.delete(`/projects/${projectId}/exclusions/${userId}`);
    set((state) => ({
      exclusions: state.exclusions.filter(e => e.userId !== userId)
    }));
  }
}));
