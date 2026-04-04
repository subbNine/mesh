import { create } from 'zustand';
import { type TaskStatus, type ITask } from '@mesh/shared';
import { api } from '../lib/api';
import { useToastStore } from './toast.store';

interface TaskState {
  tasks: ITask[];
  currentTask: ITask | null;
  isLoading: boolean;
  rowOrder: TaskStatus[];
  rowLimit: number;
  
  fetchTasks: (projectId: string, filters?: { status?: TaskStatus | string; assigneeId?: string }) => Promise<void>;
  createTask: (projectId: string, dto: Partial<ITask>) => Promise<ITask>;
  updateTask: (taskId: string, dto: Partial<ITask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setCurrentTask: (task: ITask | null) => void;
  setRowOrder: (order: TaskStatus[]) => void;
  setRowLimit: (n: number) => void;
  loadPreferences: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  rowOrder: ['todo', 'inprogress', 'review', 'done'],
  rowLimit: 10,

  fetchTasks: async (projectId, filters) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks`, { params: filters });
      set({ tasks: data, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  createTask: async (projectId, dto) => {
    const { data } = await api.post(`/projects/${projectId}/tasks`, dto);
    set((state) => ({ tasks: [data, ...state.tasks] }));
    return data;
  },

  updateTask: async (taskId, dto) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...dto } as ITask : t)),
    }));

    try {
      await api.patch(`/tasks/${taskId}`, dto);
      useToastStore.getState().addToast('success', 'Task updated');
    } catch (err) {
      console.error('Failed to update task:', err);
      useToastStore.getState().addToast('error', 'Failed to update task');
      set({ tasks: previousTasks });
    }
  },

  deleteTask: async (taskId) => {
    const previousTasks = get().tasks;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
    try {
      await api.delete(`/tasks/${taskId}`);
      useToastStore.getState().addToast('success', 'Task deleted');
    } catch (err) {
      console.error('Failed to delete task:', err);
      useToastStore.getState().addToast('error', 'Failed to delete task');
      set({ tasks: previousTasks });
    }
  },

  setCurrentTask: (task) => set({ currentTask: task }),

  setRowOrder: (order) => {
    localStorage.setItem('task_rowOrder', JSON.stringify(order));
    set({ rowOrder: order });
  },

  setRowLimit: (n) => {
    localStorage.setItem('task_rowLimit', n.toString());
    set({ rowLimit: n });
  },

  loadPreferences: () => {
    const savedOrder = localStorage.getItem('task_rowOrder');
    const savedLimit = localStorage.getItem('task_rowLimit');
    if (savedOrder) {
      try { 
        set({ rowOrder: JSON.parse(savedOrder) }); 
      } catch (e) { 
        console.error('Failed to parse saved task row order', e);
      }
    }
    if (savedLimit) {
      set({ rowLimit: parseInt(savedLimit, 10) });
    }
  },
}));
