import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

import { ProtectedRoute } from './components/layout/ProtectedRoute';
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
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected Routes */}
        <Route path="/workspaces" element={<ProtectedRoute><WorkspaceSelectorPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/canvas" element={<ProtectedRoute><TaskCanvasPage /></ProtectedRoute>} />
        
        {/* Protected Settings Routes */}
        <Route path="/settings/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings/workspace" element={<ProtectedRoute><WorkspaceSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/project" element={<ProtectedRoute><ProjectSettingsPage /></ProtectedRoute>} />
        
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
