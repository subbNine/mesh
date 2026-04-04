import { useEffect, useState, useCallback } from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { Folder, Settings, LogOut, Pin, ChevronRight, LayoutGrid, List, User } from 'lucide-react';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { TaskThumbnailSidebar } from '../tasks/TaskThumbnailSidebar';

// ─── Pinned Tasks helpers (localStorage-backed, max 5) ──────────────────────
const PINNED_KEY = 'mesh_pinned_tasks';

function loadPinnedIds(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePinnedIds(ids: string[]) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(ids.slice(0, 5)));
}

export function AppShell() {
  const { workspaceId } = useParams();
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();

  const fetchProjects = useProjectStore(state => state.fetchProjects);
  const projects = useProjectStore(state => state.projects);

  const { sidebarMode, setSidebarMode } = useCanvasStore();

  const isCanvasRoute = location.pathname.includes('/canvas');

  // Reset to navigation mode when leaving a canvas route
  useEffect(() => {
    if (!isCanvasRoute && sidebarMode === 'thumbnails') {
      setSidebarMode('navigation');
    }
  }, [isCanvasRoute, sidebarMode, setSidebarMode]);

  // ── Pinned tasks state ──────────────────────────────────────────────────
  const [pinnedIds, setPinnedIds] = useState<string[]>(loadPinnedIds);
  const [pinnedTasks, setPinnedTasks] = useState<(ITask & { projectName?: string })[]>([]);

  useEffect(() => {
    if (workspaceId) {
      fetchProjects(workspaceId);
    }
  }, [workspaceId, fetchProjects]);

  // Fetch full task objects for pinned IDs
  useEffect(() => {
    if (pinnedIds.length === 0) {
      setPinnedTasks([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const results: (ITask & { projectName?: string })[] = [];
      for (const id of pinnedIds) {
        try {
          const { data } = await api.get(`/tasks/${id}`);
          const proj = projects.find(p => p.id === data.projectId);
          results.push({ ...data, projectName: proj?.name });
        } catch {
          // Task may have been deleted
        }
      }
      if (!cancelled) {
        setPinnedTasks(results);
        // Clean up IDs for tasks that no longer exist
        const validIds = results.map(t => t.id);
        if (validIds.length !== pinnedIds.length) {
          setPinnedIds(validIds);
          savePinnedIds(validIds);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [pinnedIds, projects]);

  const unpinTask = useCallback((taskId: string) => {
    const next = pinnedIds.filter(id => id !== taskId);
    setPinnedIds(next);
    savePinnedIds(next);
  }, [pinnedIds]);

  // Public helper for other components to pin a task
  useEffect(() => {
    (globalThis as any).__meshPinTask = (taskId: string) => {
      if (pinnedIds.includes(taskId)) return;
      const next = [taskId, ...pinnedIds].slice(0, 5);
      setPinnedIds(next);
      savePinnedIds(next);
    };
    (globalThis as any).__meshUnpinTask = (taskId: string) => {
      unpinTask(taskId);
    };
    (globalThis as any).__meshIsPinned = (taskId: string) => pinnedIds.includes(taskId);
  }, [pinnedIds, unpinTask]);

  // ── Status color helper ─────────────────────────────────────────────────
  const statusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-zinc-400';
      case 'inprogress': return 'bg-amber-400';
      case 'review': return 'bg-violet-400';
      case 'done': return 'bg-emerald-400';
      default: return 'bg-zinc-300';
    }
  };

  // ── Responsive Sidebar Rail Logic ──────────────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(globalThis.innerWidth < 1200);
  
  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(globalThis.innerWidth < 1200);
    };
    globalThis.addEventListener('resize', handleResize);
    return () => globalThis.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside 
        className={`bg-card border-r border-border flex flex-col hidden md:flex flex-shrink-0 relative z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        
        {/* Header Branding */}
        <div className={`pt-6 px-5 pb-5 border-b border-border space-y-4 ${isCollapsed ? 'px-4 flex items-center justify-center' : ''}`}>
          <Link to="/workspaces" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded bg-[#15afc5] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm transition-transform active:scale-95">
              M
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="font-bold text-[17px] text-foreground tracking-tight leading-tight">Mesh</span>
                <span className="text-[11px] text-primary font-medium tracking-wide">Canvas-first PM</span>
              </div>
            )}
          </Link>

          {/* Toggle Rail Mode (Only on Canvas) */}
          {isCanvasRoute && !isCollapsed && (
            <div className="flex bg-muted/40 p-1 rounded-lg border border-border/60 animate-in fade-in duration-300">
              <button
                onClick={() => setSidebarMode('navigation')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  sidebarMode === 'navigation' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                Nav
              </button>
              <button
                onClick={() => setSidebarMode('thumbnails')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  sidebarMode === 'thumbnails' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="w-3 h-3" />
                Thumbnails
              </button>
            </div>
          )}
        </div>

        {/* Navigation Content OR Thumbnails Rail */}
        <nav className="flex-1 overflow-y-auto w-full scrollbar-none flex flex-col">
          {sidebarMode === 'thumbnails' && !isCollapsed ? (
            <TaskThumbnailSidebar />
          ) : (
            <div className={`py-6 space-y-8 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          
          {/* WORKSPACE Section */}
          <div className="space-y-3">
            {!isCollapsed && <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 animate-in fade-in duration-300">Workspace</h4>}
            <div className="space-y-1">
              <Link
                to={`/w/${workspaceId}`}
                title={isCollapsed ? 'My Workspace' : undefined}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors group ${
                  location.pathname === `/w/${workspaceId}` || location.pathname === `/w/${workspaceId}/projects` ? 'bg-primary/5 text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                } ${isCollapsed ? 'justify-center px-0 h-10' : ''}`}
              >
                <Folder className={`${isCollapsed ? 'w-5 h-5' : 'w-[18px] h-[18px] mr-3'}`} />
                {!isCollapsed && <span className="text-sm animate-in fade-in duration-300">My Workspace</span>}
              </Link>
            </div>
          </div>

          {/* PROJECTS Section */}
          <div className="space-y-3">
            {!isCollapsed && <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 animate-in fade-in duration-300">Projects</h4>}
            <div className="space-y-1">
              {projects.map((project) => {
                const isActive = location.pathname.includes(`/p/${project.id}`);
                return (
                  <Link
                    key={project.id}
                    to={`/w/${workspaceId}/p/${project.id}`}
                    title={isCollapsed ? project.name : undefined}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors group ${
                      isActive ? 'bg-primary/5 text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    } ${isCollapsed ? 'justify-center px-0 h-10' : ''}`}
                  >
                    <div className={`${isCollapsed ? '' : 'w-[18px] h-[18px] mr-3'} flex items-center justify-center flex-shrink-0`}>
                      <div className={`rounded-full transition-all ${isActive ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/60'} ${isCollapsed ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} />
                    </div>
                    {!isCollapsed && <span className="text-sm truncate animate-in fade-in duration-300">{project.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* PINNED Section */}
          {pinnedTasks.length > 0 && (
            <div className="space-y-3">
              {!isCollapsed && (
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-1.5 animate-in fade-in duration-300">
                  <Pin className="w-3 h-3" />
                  Pinned
                </h4>
              )}
              <div className="space-y-0.5">
                {pinnedTasks.map((task) => {
                  const isActive = location.pathname.includes(`/tasks/${task.id}`);
                  return (
                    <div
                      key={task.id}
                      className={`group flex items-center rounded-lg transition-colors ${
                        isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Link
                        to={`/w/${workspaceId}/p/${task.projectId}/tasks/${task.id}`}
                        title={isCollapsed ? task.title : undefined}
                        className={`flex-1 flex items-center ${isCollapsed ? 'px-0 h-10 justify-center' : 'px-3 py-2 min-w-0'}`}
                      >
                        <div className={`flex items-center justify-center flex-shrink-0 ${isCollapsed ? '' : 'w-[18px] h-[18px] mr-3'}`}>
                          <div className={`rounded-full ${statusColor(task.status)} ${isCollapsed ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
                        </div>
                        {!isCollapsed && (
                          <div className="min-w-0 flex-1 animate-in fade-in duration-300">
                            <span className={`text-sm truncate block ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                              {task.title}
                            </span>
                            {task.projectName && (
                              <span className="text-[10px] text-muted-foreground/60 truncate block leading-tight">
                                {task.projectName}
                              </span>
                            )}
                          </div>
                        )}
                        {!isCollapsed && <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ml-1 opacity-0 group-hover:opacity-50 transition-opacity ${isActive ? 'opacity-50' : ''}`} />}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-border mt-auto space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
          <Link
            to="/settings/profile"
            title={isCollapsed ? 'Profile' : undefined}
            className={`flex items-center rounded-lg transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground ${isCollapsed ? 'justify-center h-10 px-0' : 'px-3 py-2.5'}`}
          >
            <User className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'}`} />
            {!isCollapsed && <span className="text-sm font-medium animate-in fade-in duration-300">Profile</span>}
          </Link>
          <button
            onClick={logout}
            title={isCollapsed ? 'Sign out' : undefined}
            className={`w-full flex items-center rounded-lg transition-colors text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${isCollapsed ? 'justify-center h-10 px-0' : 'px-3 py-2.5'}`}
          >
            <LogOut className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'}`} />
            {!isCollapsed && <span className="text-sm font-medium animate-in fade-in duration-300">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background flex flex-col relative min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
