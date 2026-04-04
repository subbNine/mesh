import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-destructive/20">
        <ShieldAlert className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-display font-bold text-zinc-900 mb-3 tracking-tight">Access Denied</h1>
      <p className="text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
        You don't have permission to access this resource. Please contact your workspace administrator.
      </p>
      <Button 
        variant="secondary" 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-6 h-11"
      >
        <ArrowLeft className="w-4 h-4" />
        Go back
      </Button>
    </div>
  );
}
