import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
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
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>(align || 'left');
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(280);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const normalizedOptions = options.map(normalizeOption);
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Dynamic Auto-Positioning (Vertical Flip & Horizontal Alignment)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Detect nearest scrollable ancestor container if any
    let scrollParent: HTMLElement | null = null;
    let parent = triggerRef.current.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight
      ) {
        scrollParent = parent;
        break;
      }
      parent = parent.parentElement;
    }

    let spaceBelow = vh - rect.bottom;
    let spaceAbove = rect.top;
    let spaceRight = vw - rect.left;
    let spaceLeft = rect.right;

    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect();
      spaceBelow = Math.min(spaceBelow, parentRect.bottom - rect.bottom);
      spaceAbove = Math.min(spaceAbove, rect.top - parentRect.top);
      spaceRight = Math.min(spaceRight, parentRect.right - rect.left);
      spaceLeft = Math.min(spaceLeft, rect.right - parentRect.left);
    }

    // Vertical placement: flip upwards if space below is too tight and space above has more room
    const estimatedHeight = 220;
    let nextPlacement: 'bottom' | 'top' = 'bottom';
    if (autoPosition && spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      nextPlacement = 'top';
    }
    setPlacement(nextPlacement);

    // Dynamic max-height clamped to available space
    const availableSpace = nextPlacement === 'top' ? spaceAbove - 12 : spaceBelow - 12;
    setMaxMenuHeight(Math.max(130, Math.min(availableSpace, 300)));

    // Horizontal alignment: if opening left-aligned would cause right overflow, align to right
    if (align) {
      setHorizontalAlign(align);
    } else if (autoPosition) {
      if (spaceRight < 230 && spaceLeft >= 200) {
        setHorizontalAlign('right');
      } else {
        setHorizontalAlign('left');
      }
    }
  }, [align, autoPosition]);

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

  const isCompact = variant === 'compact';

  // Variant & size classes
  const triggerBase = isCompact
    ? `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#181818] border border-[#242424] text-xs font-semibold text-[#E5E5E5] hover:border-white/10 hover:text-white hover:bg-[#26262C] transition-all cursor-pointer shadow-xs select-none ${
        isOpen ? 'border-[#60A5FA]/40 ring-1 ring-[#2563EB]/40 text-white bg-[#181818]' : ''
      }`
    : `w-full flex items-center justify-between gap-2 rounded-xl bg-[#181818] border border-[#242424] px-3.5 py-2.5 text-xs text-[#E5E5E5] hover:border-white/10 hover:bg-[#26262C] focus:outline-none transition-all cursor-pointer select-none ${
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
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          tabIndex={-1}
          style={{ maxHeight: `${maxMenuHeight}px` }}
          className={`absolute z-50 p-1.5 rounded-xl bg-[#141414] border border-[#242424] shadow-2xl shadow-black/90 custom-scrollbar overflow-y-auto ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            horizontalAlign === 'right' ? 'right-0 left-auto' : 'left-0 right-auto'
          } ${
            isCompact
              ? 'min-w-[210px] w-max max-w-[calc(100vw-32px)]'
              : 'min-w-full w-max min-w-[230px] max-w-[calc(100vw-32px)] sm:max-w-xs'
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
        </div>
      )}
    </div>
  );
};
