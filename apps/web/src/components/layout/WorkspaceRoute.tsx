import { useEffect } from 'react';
import { Navigate, useParams, Outlet } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.store';

export function WorkspaceRoute({ children }: { children?: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const fetchWorkspaces = useWorkspaceStore(state => state.fetchWorkspaces);
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const setCurrentWorkspace = useWorkspaceStore(state => state.setCurrentWorkspace);
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const isLoading = useWorkspaceStore(state => state.isLoading);

  useEffect(() => {
    if (workspaces.length === 0 && !isLoading) {
      fetchWorkspaces().catch(console.error);
    }
  }, [fetchWorkspaces, workspaces.length, isLoading]);

  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const match = workspaces.find(w => w.id === workspaceId);
      if (match) {
        if (currentWorkspace?.id !== match.id) {
          setCurrentWorkspace(match);
        }
      }
    }
  }, [workspaceId, workspaces, currentWorkspace?.id, setCurrentWorkspace]);

  // Handle blocking conditions securely redirecting back to base layout
  if (!isLoading && workspaces.length > 0 && workspaceId) {
    const exists = workspaces.some(w => w.id === workspaceId);
    if (!exists) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
