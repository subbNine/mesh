import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import WorkspaceSelectorPage from './pages/workspaces/WorkspaceSelectorPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import TaskCanvasPage from './pages/tasks/TaskCanvasPage';
import ProfilePage from './pages/settings/ProfilePage';
import WorkspaceSettingsPage from './pages/settings/WorkspaceSettingsPage';
import ProjectSettingsPage from './pages/settings/ProjectSettingsPage';
import ForbiddenPage from './pages/errors/ForbiddenPage';
import NotFoundPage from './pages/errors/NotFoundPage';
import LandingPage from './pages/LandingPage';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { WorkspaceRoute } from './components/layout/WorkspaceRoute';
import { AppShell } from './components/layout/AppShell';
import { useAuthStore } from './store/auth.store';

function AppRoot() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-900 text-white">
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />


        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/settings" element={<ProjectSettingsPage />} />
          <Route path="canvas" element={<TaskCanvasPage />} />
          <Route path="settings" element={<WorkspaceSettingsPage />} />
        </Route>

        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>
);
