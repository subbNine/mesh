import { create } from 'zustand';
import { type TaskStatus, type ITask, type IMyAssignmentsResponse, type ITaskDependenciesResponse, type ISubtask } from '@mesh/shared';
import { api } from '../lib/api';
import { useToastStore } from './toast.store';

interface MyAssignmentsFilters {
  workspaceId: string;
  status?: TaskStatus[];
  includeCompleted?: boolean;
  projectId?: string[];
}

type TaskWritePayload = Partial<ITask> & {
  assigneeIds?: string[];
  assigneeId?: string | null;
};

const emptyAssignments: IMyAssignmentsResponse = {
  overdue: [],
  dueToday: [],
  dueThisWeek: [],
  other: [],
};


const mapAssignments = (
  groups: IMyAssignmentsResponse,
  taskId: string,
  updater: (task: ITask) => ITask,
): IMyAssignmentsResponse => ({
  overdue: groups.overdue.map((task) => (task.id === taskId ? updater(task) : task)),
  dueToday: groups.dueToday.map((task) => (task.id === taskId ? updater(task) : task)),
  dueThisWeek: groups.dueThisWeek.map((task) => (task.id === taskId ? updater(task) : task)),
  other: groups.other.map((task) => (task.id === taskId ? updater(task) : task)),
});

const mergeDependencyState = (task: ITask, dependencies?: ITaskDependenciesResponse): ITask => {
  if (!dependencies) return task;

  return {
    ...task,
    blockedBy: dependencies.blockedBy,
    blocks: dependencies.blocks,
    isBlocked: dependencies.isBlocked,
    dependencyCount: dependencies.dependencyCount,
  };
};

const applySubtaskSummary = (task: ITask, subtasks: ISubtask[]): ITask => ({
  ...task,
  subtaskCount: subtasks.length,
  completedSubtaskCount: subtasks.filter((subtask) => subtask.isCompleted).length,
});

interface TaskState {
  tasks: ITask[];
  currentTask: ITask | null;
  isLoading: boolean;
  dependenciesByTaskId: Record<string, ITaskDependenciesResponse>;
  subtasksByTaskId: Record<string, ISubtask[]>;
  paginationMetadata: {
    total: number;
    page: number;
    perPage: number;
    pages: number;
  } | null;
  assignments: IMyAssignmentsResponse;
  rowOrder: TaskStatus[];
  rowLimit: number;
  
  fetchTasks: (projectId: string, filters?: {
    status?: TaskStatus;
    assigneeId?: string;
    dueDate?: string;
    dependsOn?: boolean;
    blocks?: boolean;
    page?: number;
    perPage?: number;
  }) => Promise<void>;
  fetchMyAssignments: (filters: MyAssignmentsFilters) => Promise<void>;
  createTask: (projectId: string, dto: TaskWritePayload) => Promise<ITask>;
  updateTask: (taskId: string, dto: TaskWritePayload) => Promise<void>;
  addAssignee: (taskId: string, userId: string) => Promise<void>;
  removeAssignee: (taskId: string, userId: string) => Promise<void>;
  fetchSubtasks: (taskId: string) => Promise<ISubtask[]>;
  createSubtask: (taskId: string, title: string) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, dto: { title?: string; isCompleted?: boolean; position?: number }) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  reorderSubtasks: (taskId: string, orderedIds: string[]) => Promise<void>;
  fetchDependencies: (taskId: string) => Promise<ITaskDependenciesResponse>;
  createDependency: (taskId: string, dto: { blocksTaskId?: string; dependsOnTaskId?: string }) => Promise<void>;
  deleteDependency: (dependencyId: string) => Promise<void>;
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
  dependenciesByTaskId: {},
  subtasksByTaskId: {},
  paginationMetadata: null,
  assignments: emptyAssignments,
  rowOrder: ['todo', 'inprogress', 'review', 'done'],
  rowLimit: 12, // Align with grid layout better (3-4 cols)

  fetchTasks: async (projectId, filters) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/projects/${projectId}/tasks`, { params: filters });
      // API now returns { result: ITask[], metadata: {...} }
      set({ 
        tasks: data.result, 
        paginationMetadata: data.metadata,
        isLoading: false 
      });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  fetchMyAssignments: async ({ workspaceId, status, includeCompleted, projectId }) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string | boolean> = { workspaceId };

      if (status && status.length > 0) {
        params.status = status.join(',');
      }

      if (projectId && projectId.length > 0) {
        params.projectId = projectId.join(',');
      }

      if (includeCompleted) {
        params.includeCompleted = true;
      }

      const { data } = await api.get('/users/me/assignments', { params });
      set({ assignments: { ...emptyAssignments, ...data }, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
      set({ assignments: emptyAssignments, isLoading: false });
    }
  },

  createTask: async (projectId, dto) => {
    const { data } = await api.post(`/projects/${projectId}/tasks`, dto);
    set((state) => ({ tasks: [data, ...state.tasks] }));
    return data;
  },

  updateTask: async (taskId, dto) => {
    const previousTasks = get().tasks;
    const previousAssignments = get().assignments;
    const previousCurrentTask = get().currentTask;

    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...dto } as ITask : task)),
      currentTask: state.currentTask?.id === taskId ? { ...state.currentTask, ...dto } as ITask : state.currentTask,
      assignments: mapAssignments(state.assignments, taskId, (task) => ({ ...task, ...dto } as ITask)),
    }));

    try {
      const { data } = await api.patch(`/tasks/${taskId}`, dto);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? data : task)),
        currentTask: state.currentTask?.id === taskId ? data : state.currentTask,
        assignments: mapAssignments(state.assignments, taskId, () => data),
      }));
      useToastStore.getState().addToast('success', 'Task updated');
    } catch (err) {
      console.error('Failed to update task:', err);
      useToastStore.getState().addToast('error', 'Failed to update task');
      set({ tasks: previousTasks, assignments: previousAssignments, currentTask: previousCurrentTask });
    }
  },

  addAssignee: async (taskId, userId) => {
    try {
      const { data } = await api.post(`/tasks/${taskId}/assignees`, { userId });
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? data : task)),
        currentTask: state.currentTask?.id === taskId ? data : state.currentTask,
        assignments: mapAssignments(state.assignments, taskId, () => data),
      }));
      useToastStore.getState().addToast('success', 'Assignee added');
    } catch (err) {
      console.error('Failed to add assignee:', err);
      useToastStore.getState().addToast('error', 'Failed to add assignee');
      throw err;
    }
  },

  removeAssignee: async (taskId, userId) => {
    try {
      const { data } = await api.delete(`/tasks/${taskId}/assignees/${userId}`);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? data : task)),
        currentTask: state.currentTask?.id === taskId ? data : state.currentTask,
        assignments: mapAssignments(state.assignments, taskId, () => data),
      }));
      useToastStore.getState().addToast('success', 'Assignee removed');
    } catch (err) {
      console.error('Failed to remove assignee:', err);
      useToastStore.getState().addToast('error', 'Failed to remove assignee');
      throw err;
    }
  },

  fetchSubtasks: async (taskId) => {
    const { data } = await api.get(`/tasks/${taskId}/subtasks`);
    const subtasks = [...data].sort((a: ISubtask, b: ISubtask) => a.position - b.position);

    set((state) => ({
      subtasksByTaskId: {
        ...state.subtasksByTaskId,
        [taskId]: subtasks,
      },
      tasks: state.tasks.map((task) => (task.id === taskId ? applySubtaskSummary(task, subtasks) : task)),
      currentTask: state.currentTask?.id === taskId ? applySubtaskSummary(state.currentTask, subtasks) : state.currentTask,
      assignments: mapAssignments(state.assignments, taskId, (task) => applySubtaskSummary(task, subtasks)),
    }));

    return subtasks;
  },

  createSubtask: async (taskId, title) => {
    try {
      await api.post(`/tasks/${taskId}/subtasks`, { title });
      await get().fetchSubtasks(taskId);
      useToastStore.getState().addToast('success', 'Subtask added');
    } catch (err) {
      console.error('Failed to create subtask:', err);
      useToastStore.getState().addToast('error', 'Failed to add subtask');
      throw err;
    }
  },

  updateSubtask: async (taskId, subtaskId, dto) => {
    try {
      await api.patch(`/subtasks/${subtaskId}`, dto);
      const subtasks = await get().fetchSubtasks(taskId);

      if (dto.isCompleted && subtasks.length > 0 && subtasks.every((subtask) => subtask.isCompleted)) {
        useToastStore.getState().addToast('info', 'All subtasks complete. Mark task as done?');
      }
    } catch (err) {
      console.error('Failed to update subtask:', err);
      useToastStore.getState().addToast('error', 'Failed to update subtask');
      throw err;
    }
  },

  deleteSubtask: async (taskId, subtaskId) => {
    try {
      await api.delete(`/subtasks/${subtaskId}`);
      await get().fetchSubtasks(taskId);
      useToastStore.getState().addToast('success', 'Subtask removed');
    } catch (err) {
      console.error('Failed to delete subtask:', err);
      useToastStore.getState().addToast('error', 'Failed to delete subtask');
      throw err;
    }
  },

  reorderSubtasks: async (taskId, orderedIds) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/subtasks/reorder`, { orderedIds });
      const subtasks = [...data].sort((a: ISubtask, b: ISubtask) => a.position - b.position);

      set((state) => ({
        subtasksByTaskId: {
          ...state.subtasksByTaskId,
          [taskId]: subtasks,
        },
        tasks: state.tasks.map((task) => (task.id === taskId ? applySubtaskSummary(task, subtasks) : task)),
        currentTask: state.currentTask?.id === taskId ? applySubtaskSummary(state.currentTask, subtasks) : state.currentTask,
        assignments: mapAssignments(state.assignments, taskId, (task) => applySubtaskSummary(task, subtasks)),
      }));
    } catch (err) {
      console.error('Failed to reorder subtasks:', err);
      useToastStore.getState().addToast('error', 'Failed to reorder subtasks');
      throw err;
    }
  },

  fetchDependencies: async (taskId) => {
    const { data } = await api.get(`/tasks/${taskId}/dependencies`);

    set((state) => ({
      dependenciesByTaskId: {
        ...state.dependenciesByTaskId,
        [taskId]: data,
      },
      tasks: state.tasks.map((task) => (task.id === taskId ? mergeDependencyState(task, data) : task)),
      currentTask: state.currentTask?.id === taskId ? mergeDependencyState(state.currentTask, data) : state.currentTask,
      assignments: mapAssignments(state.assignments, taskId, (task) => mergeDependencyState(task, data)),
    }));

    return data;
  },

  createDependency: async (taskId, dto) => {
    try {
      const { data } = await api.post(`/tasks/${taskId}/dependencies`, dto);
      const impactedTaskIds = Array.from(new Set([taskId, data.blockingTaskId, data.blockedTaskId].filter(Boolean)));
      await Promise.allSettled(impactedTaskIds.map((id) => get().fetchDependencies(id)));
      useToastStore.getState().addToast('success', 'Dependency added');
    } catch (err: any) {
      console.error('Failed to create dependency:', err);
      const message = err?.response?.data?.message || 'Failed to add dependency';
      useToastStore.getState().addToast('error', Array.isArray(message) ? message[0] : message);
      throw err;
    }
  },

  deleteDependency: async (dependencyId) => {
    try {
      const { data } = await api.delete(`/dependencies/${dependencyId}`);
      const impactedTaskIds = Array.from(new Set([data.blockingTaskId, data.blockedTaskId].filter(Boolean)));
      await Promise.allSettled(impactedTaskIds.map((id) => get().fetchDependencies(id)));
      useToastStore.getState().addToast('success', 'Dependency removed');
    } catch (err: any) {
      console.error('Failed to delete dependency:', err);
      const message = err?.response?.data?.message || 'Failed to remove dependency';
      useToastStore.getState().addToast('error', Array.isArray(message) ? message[0] : message);
      throw err;
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
      set({ rowLimit: Number.parseInt(savedLimit, 10) });
    }
  },
}));
