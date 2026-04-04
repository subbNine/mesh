import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white gap-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-zinc-400 font-medium animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
