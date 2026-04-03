import { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { api } from '../../lib/api';

export default function ProjectRoute() {
  const { workspaceId, projectId } = useParams();
  const navigate = useNavigate();
  
  const setCurrentProject = useProjectStore(state => state.setCurrentProject);
  const currentProject = useProjectStore(state => state.currentProject);
  
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!projectId) return;
    
    let isMounted = true;
    
    const loadProject = async () => {
      try {
        setLoading(true);
        setErrorStatus(null);
        
        const { data } = await api.get(`/projects/${projectId}`);
        
        if (isMounted) {
          setCurrentProject(data);
        }
      } catch (err: any) {
        if (isMounted) {
          const status = err.response?.status;
          setErrorStatus(status || 500);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadProject();
    
    return () => {
      isMounted = false;
      setCurrentProject(null);
    };
  }, [projectId, setCurrentProject]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 max-w-md">You do not have permission to access this project. You may have been explicitly excluded or lack necessary workspace roles.</p>
        <button 
          onClick={() => navigate(`/w/${workspaceId}/projects`)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  if (errorStatus === 404 || !currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">The project you are looking for does not exist or has been deleted.</p>
        <button 
          onClick={() => navigate(`/w/${workspaceId}/projects`)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          View All Projects
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      <Outlet />
    </div>
  );
}
