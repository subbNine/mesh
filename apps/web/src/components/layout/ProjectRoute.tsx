import { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import { api } from '../../lib/api';
import { useToast } from '../../store/toast.store';
import { useProjectStore } from '../../store/project.store';
import ForbiddenPage from '../../pages/errors/ForbiddenPage';
import NotFoundPage from '../../pages/errors/NotFoundPage';

export default function ProjectRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const { error: showError } = useToast();
  const { setCurrentProject, fetchMembers } = useProjectStore();
  
  const [project, setProject] = useState<any | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;
      setIsLoading(true);
      setErrorStatus(null);

      try {
        const { data } = await api.get(`/projects/${projectId}`);
        setProject(data);
        
        // Stabilize global store
        setCurrentProject(data);
        await fetchMembers(projectId);
      } catch (err: any) {
        setErrorStatus(err.response?.status || 500);
        if (err.response?.status !== 403 && err.response?.status !== 404) {
          showError('Failed to load project');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, showError, setCurrentProject, fetchMembers]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] w-full gap-4">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Loading project...</p>
      </div>
    );
  }

  if (errorStatus === 403) return <ForbiddenPage />;
  if (errorStatus === 404) return <NotFoundPage />;
  if (errorStatus) return <div className="p-8 text-center text-zinc-500">Could not load project. Please try again.</div>;

  return <Outlet context={{ project }} />;
}
