import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
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
  autoPosition?: boolean;
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
  align,
  autoPosition = true,
  disabled = false,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  id,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(280);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 230,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const normalizedOptions = options.map(normalizeOption);
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const isCompact = variant === 'compact';

  // Keep the portaled menu anchored to the trigger and inside the viewport.
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    const estimatedHeight = 220;
    const nextPlacement: 'bottom' | 'top' =
      autoPosition && spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';
    setPlacement(nextPlacement);

    const availableSpace = nextPlacement === 'top' ? spaceAbove : spaceBelow;
    setMaxMenuHeight(Math.max(0, Math.min(availableSpace - 12, 300)));

    const gutter = Math.min(16, vw / 2);
    const maxWidth = Math.max(0, Math.min(320, vw - gutter * 2));
    const preferredMinWidth = isCompact ? 210 : 230;
    const width = Math.min(Math.max(rect.width, Math.min(preferredMinWidth, maxWidth)), maxWidth);
    const shouldAlignRight = align === 'right' || (
      !align && autoPosition && rect.left + width > vw - gutter
    );
    const left = shouldAlignRight ? rect.right - width : rect.left;
    const clampedLeft = Math.max(gutter, Math.min(left, vw - width - gutter));

    setMenuPosition({
      top: nextPlacement === 'bottom' ? rect.bottom + 6 : undefined,
      bottom: nextPlacement === 'top' ? vh - rect.top + 6 : undefined,
      left: clampedLeft,
      width,
    });
  }, [align, autoPosition, isCompact]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Auto-scroll selected item into view when menu opens
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const activeItem = menuRef.current.querySelector('[aria-selected="true"]');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

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

  // Variant & size classes
  const triggerBase = isCompact
    ? `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181818] border border-[#242424] text-xs font-semibold text-[#E5E5E5] hover:border-white/10 hover:text-white hover:bg-[#26262C] transition-all cursor-pointer shadow-xs select-none ${
        isOpen ? 'border-[#60A5FA]/40 ring-1 ring-[#2563EB]/40 text-white bg-[#181818]' : ''
      }`
    : `w-full flex items-center justify-between gap-2 rounded-xl bg-[#181818] border border-[#242424] px-3.5 py-2.5 text-xs text-[#E5E5E5] hover:border-white/10 hover:bg-[#26262C] focus:outline-none focus-visible:border-[#60A5FA]/70 focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 transition-all cursor-pointer select-none ${
        isOpen ? 'border-[#60A5FA]/40 ring-1 ring-[#2563EB]/40 text-white' : ''
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
        ref={triggerRef}
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
      {isOpen && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: `${maxMenuHeight}px`,
          }}
          className={`z-[100] p-1.5 rounded-xl bg-[#141414] border border-[#242424] shadow-2xl shadow-black/90 custom-scrollbar overflow-y-auto ${menuClassName}`}
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
                      : isSelected ? 'bg-[#2563EB] text-white font-bold border border-[#60A5FA]/40 shadow-xs' : 'text-[#D4D4D8] hover:bg-[#26262C] hover:text-white hover:border-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{opt.label}</div>
                      {opt.description && (
                        <div className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-blue-100/90' : 'text-zinc-400'}`}>
                          {opt.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {opt.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isSelected ? 'bg-white/20 border border-white/30 text-white' : 'bg-[#222226] border border-[#333338] text-[#9CA3AF]'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>,
        document.body,
      )}
    </div>
  );
};
