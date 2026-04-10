import { useEffect, useState, useCallback } from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore } from '../../store/project.store';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';
import {
  LogOut, ChevronRight, LayoutGrid,
  List, User, Moon, Sun, Monitor, Menu, X, Activity, Layers
} from 'lucide-react';
import { api } from '../../lib/api';
import type { ITask } from '@mesh/shared';
import { useCanvasStore } from '../../store/canvas.store';
import { useScratchpadStore } from '../../store/scratchpad.store';
import { TaskThumbnailSidebar } from '../tasks/TaskThumbnailSidebar';

// ─── Pinned Tasks helpers ──────────────────────
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
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();

  const fetchProjects = useProjectStore(state => state.fetchProjects);
  const projects = useProjectStore(state => state.projects);

  const sidebarMode = useCanvasStore(state => state.sidebarMode);
  const setSidebarMode = useCanvasStore(state => state.setSidebarMode);
  const isCanvasRoute = location.pathname.includes('/canvas');

  useEffect(() => {
    if (!isCanvasRoute && sidebarMode === 'thumbnails') {
      setSidebarMode('navigation');
    }
  }, [isCanvasRoute, sidebarMode, setSidebarMode]);

  // ── Global Safety Net: Reset scroll/pointer states on route change ──
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.pointerEvents = 'auto';

    // Close side panels on route change to prevent ghost overlays
    if (!isCanvasRoute) {
      useCanvasStore.getState().setCommentPaneOpen(false);
      useScratchpadStore.getState().setOpen(false);
    }
  }, [location.pathname, isCanvasRoute]);

  // ── Pinned tasks ──
  const [pinnedIds, setPinnedIds] = useState<string[]>(loadPinnedIds);
  const [pinnedTasks, setPinnedTasks] = useState<(ITask & { projectName?: string })[]>([]);

  useEffect(() => {
    if (workspaceId) fetchProjects(workspaceId);
  }, [workspaceId, fetchProjects]);

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
        } catch { }
      }
      if (!cancelled) {
        setPinnedTasks(results);
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

  useEffect(() => {
    (globalThis as any).__meshPinTask = (taskId: string) => {
      if (pinnedIds.includes(taskId)) return;
      const next = [taskId, ...pinnedIds].slice(0, 5);
      setPinnedIds(next);
      savePinnedIds(next);
    };
    (globalThis as any).__meshUnpinTask = (taskId: string) => unpinTask(taskId);
    (globalThis as any).__meshIsPinned = (taskId: string) => pinnedIds.includes(taskId);
  }, [pinnedIds, unpinTask]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-zinc-400';
      case 'inprogress': return 'bg-amber-400';
      case 'review': return 'bg-sky-400';
      case 'done': return 'bg-emerald-400';
      default: return 'bg-zinc-300';
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(globalThis.innerWidth < 1200);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsCollapsed(globalThis.innerWidth < 1200);
    globalThis.addEventListener('resize', handleResize);
    return () => globalThis.removeEventListener('resize', handleResize);
  }, []);

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Branding */}
      <div className={`p-4 flex items-center gap-2 ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-3' : ''}`}>
        <Link to="/workspaces" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/20 group-hover:scale-110 transition-transform">
            <Layers size={16} />
          </div>
          {(!isCollapsed || isMobileMenuOpen) && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-display font-black text-base tracking-tight"
            >
              Mesh
            </motion.span>
          )}
        </Link>
      </div>

      {/* Mode Switcher */}
      {isCanvasRoute && (!isCollapsed || isMobileMenuOpen) && (
        <div className="px-2 mb-4">
          <div className="bg-muted/50 p-0.5 rounded-lg flex gap-0.5 border border-border/50">
            <button
              onClick={() => setSidebarMode('navigation')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${sidebarMode === 'navigation' ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid size={12} /> Nav
            </button>
            <button
              onClick={() => setSidebarMode('thumbnails')}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${sidebarMode === 'thumbnails' ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List size={12} /> Canvas
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-none pb-8">
        {sidebarMode === 'thumbnails' && !isCollapsed ? (
          <TaskThumbnailSidebar />
        ) : (
          <div className="space-y-4">
            {/* Section: Workspace */}
            <div className="space-y-1">
              {(!isCollapsed || isMobileMenuOpen) && <h4 className="px-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Workspace</h4>}
              <Link
                to={`/w/${workspaceId}`}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all group text-sm ${location.pathname === `/w/${workspaceId}` || location.pathname === `/w/${workspaceId}/projects`
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1'
                  } ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}
              >
                <Layers size={16} className={isCollapsed && !isMobileMenuOpen ? '' : 'flex-shrink-0 text-primary'} />
                {(!isCollapsed || isMobileMenuOpen) && <span className="text-xs truncate font-bold">Overview</span>}
              </Link>
              <Link
                to={`/w/${workspaceId}/my-work`}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all group text-sm ${location.pathname === `/w/${workspaceId}/my-work`
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1'
                  } ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}
              >
                <List size={16} className={isCollapsed && !isMobileMenuOpen ? '' : 'flex-shrink-0'} />
                {(!isCollapsed || isMobileMenuOpen) && <span className="text-xs truncate">My work</span>}
              </Link>
              <Link
                to={`/w/${workspaceId}/activity`}
                className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all group text-sm ${location.pathname === `/w/${workspaceId}/activity`
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1'
                  } ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}
              >
                <Activity size={16} className={isCollapsed && !isMobileMenuOpen ? '' : 'flex-shrink-0'} />
                {(!isCollapsed || isMobileMenuOpen) && <span className="text-xs truncate">Activity</span>}
              </Link>
            </div>

            {/* Section: Projects */}
            <div className="space-y-1">
              {(!isCollapsed || isMobileMenuOpen) && <h4 className="px-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Projects</h4>}
              <div className="space-y-0.5">
                {projects.map(project => {
                  const isActive = location.pathname.includes(`/p/${project.id}`);
                  return (
                    <Link
                      key={project.id}
                      to={`/w/${workspaceId}/p/${project.id}`}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all group text-xs ${isActive ? 'bg-primary/5 text-foreground font-bold' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                        } ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary scale-125' : 'bg-primary/40 group-hover:bg-primary/70 group-hover:scale-110'} transition-all`} />
                      {(!isCollapsed || isMobileMenuOpen) && <span className="truncate">{project.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Section: Pinned */}
            {pinnedTasks.length > 0 && (
              <div className="space-y-1">
                {(!isCollapsed || isMobileMenuOpen) && <h4 className="px-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">Pinned</h4>}
                <div className="space-y-0.5">
                  {pinnedTasks.map(task => {
                    const isActive = location.pathname.includes(`/tasks/${task.id}`);
                    return (
                      <Link
                        key={task.id}
                        to={`/w/${workspaceId}/p/${task.projectId}/tasks/${task.id}/canvas`}
                        className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all group text-xs ${isActive ? 'bg-primary/5 text-foreground font-bold' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                          } ${isCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`}
                      >
                        <div className={`w-1 h-1 rounded-full ${statusColor(task.status)} group-hover:scale-125 transition-transform`} />
                        {(!isCollapsed || isMobileMenuOpen) && (
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="text-xs truncate leading-tight">{task.title}</span>
                            <span className="text-[9px] opacity-50 truncate">{task.projectName}</span>
                          </div>
                        )}
                        {(!isCollapsed || isMobileMenuOpen) && isActive && <ChevronRight size={10} className="ml-auto opacity-50" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer / User / Theme */}
      <div className="p-2 border-t border-border/50 space-y-1">
        <div className={`flex flex-col gap-0.5 ${isCollapsed && !isMobileMenuOpen ? 'items-center' : ''}`}>
          {/* Theme Toggle */}
          {(!isCollapsed || isMobileMenuOpen) ? (
            <div className="bg-muted/50 p-0.5 rounded-lg flex gap-0.5 mb-1 border border-border/50">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center py-1 rounded-md transition-all text-xs ${theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Sun size={12} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center py-1 rounded-md transition-all text-xs ${theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Moon size={12} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center py-1 rounded-md transition-all text-xs ${theme === 'system' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Monitor size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all mb-1"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}

          <Link
            to="/settings/profile"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-xs ${isCollapsed && !isMobileMenuOpen ? 'justify-center p-0 w-8 h-8' : ''}`}
          >
            <User size={14} />
            {(!isCollapsed || isMobileMenuOpen) && <span className="text-xs font-bold">Profile</span>}
          </Link>
          <button
            onClick={logout}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-xs ${isCollapsed && !isMobileMenuOpen ? 'justify-center p-0 w-8 h-8' : ''}`}
          >
            <LogOut size={14} />
            {(!isCollapsed || isMobileMenuOpen) && <span className="text-xs font-bold">Sign out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden p-4 gap-4">

      {/* Background Grid */}
      <div className="fixed inset-0 bg-dot-grid opacity-[0.08] pointer-events-none z-0" />

      {/* Desktop Sidebar (Floating) */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="hidden md:flex flex-col glass rounded-3xl border border-border/40 relative z-30 transition-all duration-300"
      >
        {renderSidebarContent()}
      </motion.aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-card/60 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-6 z-40">
        <Link to="/workspaces" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-primary/20 group-hover:scale-110 transition-transform">
            <Layers size={18} />
          </div>
          <span className="font-display font-black text-lg tracking-tighter">Mesh</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-foreground">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 top-16 bg-background z-30"
          >
            {renderSidebarContent()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`relative z-10 flex-1 bg-background/50 glass ${
          isCanvasRoute
            ? 'overflow-hidden rounded-3xl p-0 pt-14 md:pt-0'
            : 'overflow-auto rounded-3xl p-2 pt-14 sm:p-4 md:pt-4'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{
              opacity: 0,
              y: -10,
              transition: { duration: 0.2 },
              pointerEvents: 'none'
            }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full w-full ${isCanvasRoute ? 'overflow-hidden' : ''}`}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
