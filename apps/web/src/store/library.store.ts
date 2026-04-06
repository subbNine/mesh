import { create } from 'zustand';
import type {
  IProjectDocument,
  IProjectFile,
  IProjectFolder,
  IProjectLibraryResponse,
} from '@mesh/shared';
import { api } from '../lib/api';
import { useToastStore } from './toast.store';

interface CreateDocumentPayload {
  title?: string;
  folderId?: string;
}

interface UpdateDocumentPayload {
  title?: string;
  content?: Record<string, unknown>;
}

interface LibraryState {
  currentFolder: IProjectFolder | null;
  folders: IProjectFolder[];
  documents: IProjectDocument[];
  files: IProjectFile[];
  currentDocument: IProjectDocument | null;
  uploadProgress: Record<string, number>;
  isLoading: boolean;
  isSavingDocument: boolean;
  fetchLibrary: (projectId: string, folderId?: string) => Promise<void>;
  createFolder: (projectId: string, name: string) => Promise<void>;
  deleteFolder: (projectId: string, folderId: string) => Promise<void>;
  createDocument: (projectId: string, payload?: CreateDocumentPayload) => Promise<{ id: string; title: string }>;
  fetchDocument: (projectId: string, docId: string) => Promise<void>;
  updateDocument: (projectId: string, docId: string, payload: UpdateDocumentPayload) => Promise<void>;
  uploadFiles: (projectId: string, files: File[], folderId?: string) => Promise<void>;
  renameFile: (projectId: string, fileId: string, name: string) => Promise<void>;
  deleteDocument: (projectId: string, docId: string) => Promise<void>;
  deleteFile: (projectId: string, fileId: string) => Promise<void>;
  moveItem: (projectId: string, itemId: string, itemType: 'document' | 'file', folderId?: string | null) => Promise<void>;
  clearCurrentDocument: () => void;
}

const sortDocuments = (documents: IProjectDocument[]) =>
  [...documents].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );

const sortFiles = (files: IProjectFile[]) =>
  [...files].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

const applyLibraryPayload = (payload: IProjectLibraryResponse) => ({
  currentFolder: payload.currentFolder,
  folders: payload.folders,
  documents: sortDocuments(payload.documents),
  files: sortFiles(payload.files),
  isLoading: false,
});

export const useLibraryStore = create<LibraryState>((set, get) => ({
  currentFolder: null,
  folders: [],
  documents: [],
  files: [],
  currentDocument: null,
  uploadProgress: {},
  isLoading: false,
  isSavingDocument: false,

  fetchLibrary: async (projectId, folderId) => {
    set({ isLoading: true });

    try {
      const endpoint = folderId
        ? `/projects/${projectId}/library/folders/${folderId}`
        : `/projects/${projectId}/library`;
      const { data } = await api.get<IProjectLibraryResponse>(endpoint);
      set(applyLibraryPayload(data));
    } catch (error) {
      console.error('Failed to fetch project library', error);
      useToastStore.getState().addToast('error', 'Failed to load project library');
      set({ isLoading: false });
    }
  },

  createFolder: async (projectId, name) => {
    await api.post(`/projects/${projectId}/folders`, { name });
    await get().fetchLibrary(projectId, get().currentFolder?.id);
    useToastStore.getState().addToast('success', 'Folder created');
  },

  deleteFolder: async (projectId, folderId) => {
    await api.delete(`/projects/${projectId}/folders/${folderId}`);
    await get().fetchLibrary(projectId);
    useToastStore.getState().addToast('success', 'Folder deleted');
  },

  createDocument: async (projectId, payload = {}) => {
    const { data } = await api.post<{ id: string; title: string }>(`/projects/${projectId}/documents`, payload);
    return data;
  },

  fetchDocument: async (projectId, docId) => {
    try {
      const { data } = await api.get<IProjectDocument>(`/projects/${projectId}/documents/${docId}`);
      set({ currentDocument: data });
    } catch (error) {
      console.error('Failed to fetch document', error);
      useToastStore.getState().addToast('error', 'Failed to load document');
    }
  },

  updateDocument: async (projectId, docId, payload) => {
    set({ isSavingDocument: true });

    try {
      const { data } = await api.patch<IProjectDocument>(`/projects/${projectId}/documents/${docId}`, payload);
      set((state) => ({
        currentDocument: data,
        documents: sortDocuments(
          state.documents.some((document) => document.id === data.id)
            ? state.documents.map((document) => (document.id === data.id ? data : document))
            : [data, ...state.documents],
        ),
        isSavingDocument: false,
      }));
    } catch (error) {
      console.error('Failed to save document', error);
      useToastStore.getState().addToast('error', 'Failed to save document');
      set({ isSavingDocument: false });
      throw error;
    }
  },

  uploadFiles: async (projectId, files, folderId) => {
    const uploaded: IProjectFile[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('files', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      set((state) => ({
        uploadProgress: {
          ...state.uploadProgress,
          [file.name]: 0,
        },
      }));

      const { data } = await api.post<IProjectFile[]>(`/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [file.name]: percent,
            },
          }));
        },
      });

      uploaded.push(...data);
    }

    set((state) => ({
      files: sortFiles([...uploaded, ...state.files]),
      uploadProgress: {},
    }));

    useToastStore.getState().addToast('success', `${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded`);
  },

  renameFile: async (projectId, fileId, name) => {
    const { data } = await api.patch<IProjectFile>(`/projects/${projectId}/files/${fileId}`, { name });
    set((state) => ({
      files: state.files.map((file) => (file.id === fileId ? data : file)),
    }));
    useToastStore.getState().addToast('success', 'File renamed');
  },

  deleteDocument: async (projectId, docId) => {
    await api.delete(`/projects/${projectId}/documents/${docId}`);
    set((state) => ({
      documents: state.documents.filter((document) => document.id !== docId),
      currentDocument: state.currentDocument?.id === docId ? null : state.currentDocument,
    }));
    useToastStore.getState().addToast('success', 'Document deleted');
  },

  deleteFile: async (projectId, fileId) => {
    await api.delete(`/projects/${projectId}/files/${fileId}`);
    set((state) => ({
      files: state.files.filter((file) => file.id !== fileId),
    }));
    useToastStore.getState().addToast('success', 'File deleted');
  },

  moveItem: async (projectId, itemId, itemType, folderId) => {
    await api.patch(`/projects/${projectId}/library/move`, {
      itemId,
      itemType,
      folderId: folderId ?? null,
    });

    await get().fetchLibrary(projectId, get().currentFolder?.id);
    useToastStore.getState().addToast('success', 'Library item moved');
  },

  clearCurrentDocument: () => set({ currentDocument: null }),
}));
