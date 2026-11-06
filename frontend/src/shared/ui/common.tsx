import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0 rounded-xl';

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-[#60A5FA]/40 shadow-xs active:scale-[0.99]',
    secondary: 'bg-[#181818] hover:bg-[#26262C] text-zinc-300 hover:text-white border border-[#242424] hover:border-white/10',
    outline: 'border border-[#242424] hover:border-white/10 hover:bg-[#26262C] text-[#9CA3AF] hover:text-white',
    ghost: 'hover:bg-[#26262C] text-[#9CA3AF] hover:text-white',
    danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-xs gap-1.5 min-h-[36px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[42px]',
    lg: 'px-6 py-3.5 text-base gap-2.5 font-bold min-h-[48px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// Card Component (#1E1E1E Surface Panel)
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#141414] border border-[#242424] rounded-2xl p-5 ${
        hoverable ? 'hover:bg-[#181818] hover:border-white/10 transition-all cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Input Component (#121212 Subtle Canvas, #2F2F2F Border)
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: React.ReactNode }> = ({
  label,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && <label className="block text-xs font-semibold text-[#9CA3AF] tracking-wide uppercase">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3.5 text-[#6B7280] pointer-events-none">{icon}</div>}
        <input
          className={`w-full bg-[#181818] border border-[#242424] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/40 text-[#E5E5E5] placeholder-[#6B7280] text-sm rounded-xl py-2.5 ${
            icon ? 'pl-10' : 'pl-3.5'
          } pr-3.5 transition-colors outline-none`}
          {...props}
        />
      </div>
    </div>
  );
};

// Badge Component
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'blue' | 'purple' | 'cyan' | 'green' | 'amber' | 'crimson' | 'gray'; className?: string }> = ({
  children,
  variant = 'blue',
  className = '',
}) => {
  const styles = {
    blue: 'bg-[#2563EB] border border-[#60A5FA]/40 text-white font-bold shadow-xs',
    purple: 'bg-[#181818] border border-[#242424] text-purple-400',
    cyan: 'bg-[#181818] border border-[#242424] text-cyan-400',
    green: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/10 border border-amber-500/20 text-amber-300',
    crimson: 'bg-red-500/10 border border-red-500/20 text-red-400',
    gray: 'bg-gray-800/80 text-[#9CA3AF] border border-gray-700/50',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Modal Component
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#242424] bg-[#141414] shadow-2xl animate-scale-up sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#242424] p-4 sm:p-5">
          <h3 className="text-lg font-bold text-[#E5E5E5]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#26262C] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

// Tabs Component
export const Tabs: React.FC<{
  options: { id: string; label: string; icon?: React.ReactNode }[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}> = ({ options, activeId, onChange, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 p-1 bg-[#141414] border border-[#242424] rounded-xl ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeId === opt.id ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-sm font-bold' : 'text-[#9CA3AF] border border-transparent hover:text-white hover:bg-[#26262C] hover:border-white/10'
          }`}
        >
          {opt.icon && <span>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// Re-export CustomSelect for unified UI kit consumption
export { CustomSelect } from './CustomSelect';
export type { CustomSelectProps, SelectOption, RawOption } from './CustomSelect';
