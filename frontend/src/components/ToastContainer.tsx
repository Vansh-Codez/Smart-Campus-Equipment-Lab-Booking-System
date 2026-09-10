import React from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { CheckCircle2, AlertTriangle, Info, X, Zap } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useWebSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
              : toast.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-100'
              : toast.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-100'
              : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-100'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Zap className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className="flex-1 text-sm">
            <h5 className="font-semibold">{toast.title}</h5>
            <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
