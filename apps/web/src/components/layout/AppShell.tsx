import React, { useState } from 'react';
import { Outlet, Link, useParams, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspace.store';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../ui/Avatar';

export function AppShell() {
  const { workspaceId } = useParams();
  const currentWorkspace = useWorkspaceStore(state => state.currentWorkspace);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const navLinks = [
    { name: 'Projects', path: `/w/${workspaceId}/projects`, icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg> },
    { name: 'Settings', path: `/w/${workspaceId}/settings`, icon: <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className={`bg-card border-r border-border flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex flex-shrink-0 relative z-20`}>
        <div className="h-16 flex items-center px-4 border-b border-border justify-between">
          <Link to="/workspaces" className="flex items-center space-x-2 overflow-hidden hover:opacity-80 transition-opacity flex-1">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
              {currentWorkspace?.name?.[0]?.toUpperCase() || 'W'}
            </div>
            {!isCollapsed && <span className="font-semibold text-foreground truncate">{currentWorkspace?.name || 'Workspace'}</span>}
          </Link>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-muted-foreground hover:text-foreground hidden lg:block p-1">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto w-full">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={isCollapsed ? link.name : undefined}
              >
                <div className={`flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`}>
                  {link.icon}
                </div>
                {!isCollapsed && <span className="ml-3 truncate">{link.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border overflow-hidden">
          <div className="flex items-center cursor-pointer group" onClick={logout} title="Log out">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} className="w-10 h-10 text-sm" />
            {!isCollapsed && (
              <div className="ml-3 min-w-0 pr-2">
                <p className="text-sm font-medium text-foreground truncate block">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground truncate hover:text-destructive transition-colors block">Log out</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background flex flex-col relative min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
