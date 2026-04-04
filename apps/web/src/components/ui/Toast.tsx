import { useToastStore } from '../../store/toast.store';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: any; onRemove: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg transition-all duration-300 transform ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 scale-95'
      } ${bgColors[toast.type as keyof typeof bgColors] || bgColors.info}`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type as keyof typeof icons]}</div>
      <div className="flex-1 flex flex-col pt-0.5">
        <p className="text-[13px] font-medium leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onRemove}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
