import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  badge?: string | number;
  title?: string;
}

export interface ScrollableTabContainerProps {
  children: React.ReactNode;
  className?: string;
  scrollStep?: number;
}

/**
 * ScrollableTabContainer
 * Wraps any horizontal strip of buttons/pills with smooth left/right scroll navigation arrows.
 * Arrows automatically appear when the content overflows and disappears when at the edges.
 */
export const ScrollableTabContainer: React.FC<ScrollableTabContainerProps> = ({
  children,
  className = '',
  scrollStep = 140,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 3);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 3);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    // ResizeObserver catches container or child size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    // Also observe all direct children
    Array.from(el.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      resizeObserver.disconnect();
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -scrollStep : scrollStep;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    // Map vertical mouse wheel to horizontal scrolling if content overflows
    if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className={`relative flex items-center group/scrolltabs w-full min-w-0 ${className}`}>
      {/* Left Scroll Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-7 w-5 rounded-r-md bg-[#141414]/95 border-y border-r border-[#333333] shadow-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#2563EB] hover:border-[#60A5FA]/50 transition-all cursor-pointer backdrop-blur-xs select-none"
          title="Scroll Left"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Scrollable Track */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex items-center gap-1 w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth select-none min-w-0"
      >
        {children}
      </div>

      {/* Right Scroll Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-7 w-5 rounded-l-md bg-[#141414]/95 border-y border-l border-[#333333] shadow-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#2563EB] hover:border-[#60A5FA]/50 transition-all cursor-pointer backdrop-blur-xs select-none"
          title="Scroll Right"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface ScrollableTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  pillClassName?: string;
  containerBgClassName?: string;
  scrollStep?: number;
}

/**
 * ScrollableTabs
 * Standardized studio tab control with smooth scroll navigation arrows and active highlighting.
 * Ensures tab labels are never truncated (like "Gradi...") and remain legible across all screen sizes.
 */
export function ScrollableTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  pillClassName = '',
  containerBgClassName = 'bg-[#181818]',
  scrollStep = 140,
}: ScrollableTabsProps<T>) {
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active tab into view if outside visible viewport
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeTab]);

  return (
    <div className={`p-1 ${containerBgClassName} rounded-xl border border-[#242424] min-w-0 ${className}`}>
      <ScrollableTabContainer scrollStep={scrollStep}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex-1 min-w-fit shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm font-bold border border-[#60A5FA]/40'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#26262C] hover:border-white/10 border border-transparent'
              } ${pillClassName}`}
              title={tab.title || tab.label}
            >
              {Icon && (
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? tab.color || 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-bold ml-0.5 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#242424] text-zinc-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </ScrollableTabContainer>
    </div>
  );
}

export default ScrollableTabs;
