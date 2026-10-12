import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="flex-1 w-full min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-[#0A0A0A] text-[#E5E5E5]">
      <div className="relative flex items-center justify-center p-4 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA]">
        <Sparkles className="w-8 h-8 animate-pulse text-[#60A5FA]" />
        <Loader2 className="w-12 h-12 animate-spin absolute text-[#3B82F6]/40" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-white tracking-tight">ApexMind AI Studio</h3>
        <p className="text-xs text-[#9CA3AF] mt-1">Orchestrating video automation engine...</p>
      </div>
    </div>
  );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return <Loader2 className={`animate-spin text-[#60A5FA] ${sizes[size]} ${className}`} />;
};

export const ToastNotifier: React.FC<{
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}> = ({ message, type = 'info', onClose }) => {
  const colors = {
    success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
    error: 'bg-red-950/90 border-red-500/40 text-red-200',
    info: 'bg-[#1E1E1E]/95 border-[#3B82F6]/40 text-[#93C5FD]',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-bounce-short ${colors[type]}`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-xs opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
};
