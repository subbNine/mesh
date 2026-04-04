import { useEffect, useState } from 'react';
import { Navigate, useParams, Outlet } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useToast } from '../../store/toast.store';

export function WorkspaceRoute({ children }: { children?: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, isLoading, fetchWorkspaces, setCurrentWorkspace, fetchMembers } = useWorkspaceStore();
  const { error: showError } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!workspaceId) return;

      try {
        // 1. Fetch workspaces if not loaded
        if (workspaces.length === 0) {
          await fetchWorkspaces();
        }

        // 2. Check existence in the list
        const match = useWorkspaceStore.getState().workspaces.find(w => w.id === workspaceId);
        if (!match) {
           showError('Workspace not found');
           localStorage.setItem('redirect_reason', '404');
           setIsVerifying(false);
           return;
        }

        // 3. Set current and fetch members
        setCurrentWorkspace(match);
        await fetchMembers(workspaceId);
        setIsVerifying(false);
      } catch (err: any) {
        if (err.response?.status === 403) {
          showError('Access denied');
        } else if (err.response?.status === 404) {
          showError('Workspace not found');
        } else {
          showError('Could not connect to workspace');
        }
        setIsVerifying(false);
      }
    }

    verify();
  }, [workspaceId, fetchWorkspaces, setCurrentWorkspace, fetchMembers, showError]);

  if (isVerifying && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950/5 text-zinc-900 gap-4">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Redirect if verification failed (match not found or error occurred)
  const isMatch = workspaces.some(w => w.id === workspaceId);
  if (!isVerifying && !isMatch) {
    return <Navigate to="/workspaces" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
