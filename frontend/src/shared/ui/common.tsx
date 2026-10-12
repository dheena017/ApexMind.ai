import React from 'react';

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
    primary: 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white shadow-lg shadow-[#3B82F6]/25 border border-[#60A5FA]/30 active:scale-[0.99]',
    secondary: 'bg-[#121212] hover:bg-[#1E1E1E] text-[#E5E5E5] border border-[#2F2F2F]',
    outline: 'border border-[#2F2F2F] hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/10 text-[#9CA3AF] hover:text-[#E5E5E5]',
    ghost: 'hover:bg-[#1E1E1E] text-[#9CA3AF] hover:text-[#E5E5E5]',
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
      className={`bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-5 ${
        hoverable ? 'hover:border-[#4A4A4A] hover:shadow-xl hover:shadow-[#3B82F6]/5 transition-all cursor-pointer' : ''
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
          className={`w-full bg-[#121212] border border-[#2F2F2F] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 text-[#E5E5E5] placeholder-[#6B7280] text-sm rounded-xl py-2.5 ${
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
    blue: 'bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA]',
    purple: 'bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA]',
    cyan: 'bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA]',
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between p-5 border-b border-[#2F2F2F]">
          <h3 className="text-lg font-bold text-[#E5E5E5]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#2A2A2A] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
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
    <div className={`flex items-center gap-1 p-1 bg-[#121212] border border-[#2F2F2F] rounded-xl ${className}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeId === opt.id
              ? 'bg-gradient-to-r from-[#3B82F6]/20 to-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/40 shadow-sm'
              : 'text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#1E1E1E]'
          }`}
        >
          {opt.icon && <span>{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
};
