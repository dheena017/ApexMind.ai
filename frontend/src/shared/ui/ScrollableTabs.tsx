import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  badge?: string | number | React.ReactNode;
  title?: string;
}

export interface ScrollableTabContainerProps {
  children: React.ReactNode;
  className?: string;
  scrollStep?: number;
  trackRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * ScrollableTabContainer
 * Wraps any horizontal strip of buttons/pills with smooth left/right scroll navigation arrows.
 * Uses soft gradient fade masks and scroll-padding to ensure tabs are NEVER chopped in half or hidden under arrows.
 */
export const ScrollableTabContainer: React.FC<ScrollableTabContainerProps> = ({
  children,
  className = '',
  scrollStep,
  trackRef: externalTrackRef,
}) => {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalTrackRef || internalScrollRef;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isOverflow = scrollWidth > clientWidth + 3;
    setCanScrollLeft(isOverflow && scrollLeft > 6);
    setCanScrollRight(isOverflow && scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

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
    const step = scrollStep || Math.max(120, Math.floor(el.clientWidth * 0.65));
    const offset = direction === 'left' ? -step : step;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className={`relative flex items-center w-full min-w-0 group/scrolltabs ${className}`}>
      {/* Left Scroll Arrow with Smooth Gradient Fade Mask */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-0.5 pr-3 bg-gradient-to-r from-[#181818] via-[#181818]/90 to-transparent pointer-events-none rounded-l-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleScroll('left');
            }}
            className="pointer-events-auto w-5 h-[26px] rounded-md bg-[#24242C] hover:bg-[#2563EB] text-zinc-300 hover:text-white border border-[#383846] hover:border-[#60A5FA]/50 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Scroll Left"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Scrollable Track with Snap Alignment & Scroll Padding */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          scrollPaddingLeft: canScrollLeft ? '28px' : '4px',
          scrollPaddingRight: canScrollRight ? '28px' : '4px',
        }}
        className="flex-1 flex items-center gap-1 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth select-none min-w-0 cursor-grab active:cursor-grabbing px-0.5"
      >
        {children}
      </div>

      {/* Right Scroll Arrow with Smooth Gradient Fade Mask */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pr-0.5 pl-3 bg-gradient-to-l from-[#181818] via-[#181818]/90 to-transparent pointer-events-none rounded-r-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleScroll('right');
            }}
            className="pointer-events-auto w-5 h-[26px] rounded-md bg-[#24242C] hover:bg-[#2563EB] text-zinc-300 hover:text-white border border-[#383846] hover:border-[#60A5FA]/50 shadow-md flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Scroll Right"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
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
 * Ensures active tabs are gracefully centered without harsh cutoffs, and tab labels remain legible.
 */
export function ScrollableTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  pillClassName = '',
  containerBgClassName = 'bg-[#181818]',
  scrollStep,
}: ScrollableTabsProps<T>) {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab gracefully inside its track ONLY (never scroll outer layout/page)
  useEffect(() => {
    const tabEl = activeTabRef.current;
    const trackEl = trackRef.current;
    if (tabEl && trackEl) {
      const tabRect = tabEl.getBoundingClientRect();
      const trackRect = trackEl.getBoundingClientRect();
      if (tabRect.left < trackRect.left || tabRect.right > trackRect.right) {
        const offset = tabRect.left - trackRect.left - trackRect.width / 2 + tabRect.width / 2;
        trackEl.scrollBy({ left: offset, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  return (
    <div className={`p-1 ${containerBgClassName} rounded-xl border border-[#242424] min-w-0 relative ${className}`}>
      <ScrollableTabContainer scrollStep={scrollStep} trackRef={trackRef}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex-1 min-w-fit shrink-0 snap-start flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-sm font-bold border border-[#60A5FA]/40 ring-1 ring-[#60A5FA]/20'
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
              {tab.badge !== undefined &&
                (React.isValidElement(tab.badge) ? (
                  tab.badge
                ) : (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#242424] text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ))}
            </button>
          );
        })}
      </ScrollableTabContainer>
    </div>
  );
}

export default ScrollableTabs;
