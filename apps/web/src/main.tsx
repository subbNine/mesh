import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import InvitePage from './pages/auth/InvitePage';
import WorkspaceSelectorPage from './pages/workspaces/WorkspaceSelectorPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import DocumentEditorPage from './pages/projects/DocumentEditorPage';
import MyWorkPage from './pages/my-work/MyWorkPage';
import SearchPage from './pages/search/SearchPage';
import ActivityFeedPage from './pages/activity/ActivityFeedPage';
import TeamPage from './pages/team/TeamPage';
import TaskCanvasPage from './pages/tasks/TaskCanvasPage';
import ProfilePage from './pages/settings/ProfilePage';
import WorkspaceSettingsPage from './pages/settings/WorkspaceSettingsPage';
import ProjectSettingsPage from './pages/settings/ProjectSettingsPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import LandingPage from './pages/LandingPage';
import PublicProjectPage from './pages/projects/PublicProjectPage';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { WorkspaceRoute } from './components/layout/WorkspaceRoute';
import ProjectRoute from './components/layout/ProjectRoute';
import { AppShell } from './components/layout/AppShell';
import { useAuthStore } from './store/auth.store';

import { Toaster } from './components/ui/Toast';
import { ThemeProvider } from './components/layout/ThemeProvider';

import { connectNotifications, disconnectNotifications } from './lib/notifications-socket';

function AppRoot() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const isLoading = useAuthStore((state) => state.isLoading);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (token) {
      connectNotifications(token);
    } else {
      disconnectNotifications();
    }
    return () => disconnectNotifications();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/invite/:inviteId" element={<InvitePage />} />

          {/* Public project share route — no auth required */}
          <Route path="/share/:slug" element={<PublicProjectPage />} />

          {/* Protected Routes */}
          <Route path="/workspaces" element={<ProtectedRoute><WorkspaceSelectorPage /></ProtectedRoute>} />
          {/* Protected Settings Routes - System */}
          <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          
          {/* Workspace AppShell Hierarchy */}
          <Route 
            path="/w/:workspaceId" 
            element={
              <ProtectedRoute>
                <WorkspaceRoute>
                  <AppShell />
                </WorkspaceRoute>
              </ProtectedRoute>
            }
          >
            {/* Workspace level root route, redirecting to projects */}
            <Route index element={<ProjectsPage />} />
            
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="my-work" element={<MyWorkPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="activity" element={<ActivityFeedPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<WorkspaceSettingsPage />} />
            
            {/* Project Bounds */}
            <Route path="p/:projectId" element={<ProjectRoute />}>
              <Route index element={<ProjectDetailPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
              <Route path="docs/:docId" element={<DocumentEditorPage />} />
              <Route path="tasks/:taskId/canvas" element={<TaskCanvasPage />} />
            </Route>
          </Route>

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
);
