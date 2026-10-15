import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export type RawOption =
  | SelectOption
  | { id: string; name: string; badge?: string; description?: string; icon?: React.ReactNode; disabled?: boolean }
  | string;

export interface CustomSelectProps {
  options: RawOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  variant?: 'compact' | 'form';
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  id?: string;
  name?: string;
  title?: string;
}

/**
 * Normalizes options of various shapes into standard SelectOption objects.
 */
function normalizeOption(opt: RawOption): SelectOption {
  if (typeof opt === 'string') {
    return { value: opt, label: opt };
  }
  if ('value' in opt && 'label' in opt) {
    return opt as SelectOption;
  }
  if ('id' in opt && 'name' in opt) {
    return {
      value: opt.id,
      label: opt.name,
      badge: opt.badge,
      description: opt.description,
      icon: opt.icon,
      disabled: opt.disabled,
    };
  }
  return { value: String((opt as any).id || (opt as any).value || ''), label: String((opt as any).name || (opt as any).label || '') };
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  label,
  labelClassName,
  placeholder = 'Select option...',
  icon,
  variant = 'form',
  size = 'md',
  align = 'left',
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  id,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const normalizedOptions = options.map(normalizeOption);
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (event.defaultPrevented) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optValue: string, optDisabled?: boolean) => {
    if (optDisabled || disabled) return;
    onChange?.(optValue);
    setIsOpen(false);
  };

  const isCompact = variant === 'compact';

  // Variant & size classes
  const triggerBase = isCompact
    ? `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141417] border border-[#2B2B32] text-xs font-semibold text-[#E5E5E5] hover:border-[#3B82F6]/60 hover:text-white hover:bg-[#1E1E24] transition-all cursor-pointer shadow-xs select-none ${
        isOpen ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40 text-white bg-[#1E1E24]' : ''
      }`
    : `w-full flex items-center justify-between gap-2 rounded-xl bg-[#141417] border border-[#2B2B32] px-3.5 py-2.5 text-xs text-[#E5E5E5] hover:border-[#4A4A54] focus:outline-none transition-all cursor-pointer select-none ${
        isOpen ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]/40 text-white' : ''
      }`;

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-50' : 'z-10'} ${isCompact ? 'inline-block' : 'w-full'} ${className}`}
    >
      {label && !isCompact && (
        <label
          htmlFor={selectId}
          className={`block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1.5 ${labelClassName || ''}`}
        >
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={title}
        className={`${triggerBase} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon && <span className="shrink-0 text-[#60A5FA]">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : value || <span className="text-[#6B7280]">{placeholder}</span>}
          </span>
        </div>

        <ChevronDown
          className={`shrink-0 transition-transform duration-200 ${
            isCompact ? 'w-3.5 h-3.5 text-[#9CA3AF]' : 'w-4 h-4 text-[#9CA3AF]'
          } ${isOpen ? 'rotate-180 text-[#60A5FA]' : ''}`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-50 mt-1.5 p-1.5 rounded-xl bg-[#16161A] border border-[#2D2D36] shadow-2xl shadow-black/90 custom-scrollbar max-h-72 overflow-y-auto ${
            isCompact
              ? align === 'right'
                ? 'right-0 min-w-[210px]'
                : 'left-0 min-w-[210px]'
              : 'left-0 right-0 w-full'
          } ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#6B7280] text-center">No options available</div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role="option"
                  tabIndex={0}
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(opt.value, opt.disabled);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(opt.value, opt.disabled);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(opt.value, opt.disabled);
                    }
                  }}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed text-[#6B7280]'
                      : isSelected
                      ? 'bg-[#3B82F6]/20 text-[#60A5FA] font-bold border border-[#3B82F6]/40 shadow-xs'
                      : 'text-[#D4D4D8] hover:bg-[#222228] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="truncate">
                      <div className="truncate font-medium">{opt.label}</div>
                      {opt.description && (
                        <div className="text-[10px] text-[#6B7280] truncate mt-0.5">{opt.description}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected
                          ? 'bg-[#3B82F6]/25 border border-[#3B82F6]/50 text-[#93C5FD]'
                          : 'bg-[#27272E] border border-[#363640] text-[#A1A1AA]'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#60A5FA] stroke-[2.5]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
