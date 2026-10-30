import React from 'react';

export interface TimelineTransitionButtonProps {
  leftPercent: number;
  topPx: number;
  activeTransition?: string;
  duration?: number;
  variant?: 'seam' | 'in' | 'out';
  title?: string;
  onClick: () => void;
}

export interface TransitionStyleConfig {
  label: string;
  className: string;
  wingBg: string;
  wingBorder: string;
  icon: React.ReactNode;
}

export const getTransitionConfig = (transId?: string): TransitionStyleConfig => {
  if (!transId || transId === 'none') {
    return {
      label: 'None',
      className: 'bg-[#1A1A20] hover:bg-[#262630] border-white/20 text-neutral-400',
      wingBg: 'bg-amber-400/20',
      wingBorder: 'border-amber-400/50',
      icon: <div className="w-[1.5px] h-2.5 bg-neutral-300 rounded-full shrink-0" />,
    };
  }

  // Crossfade / Dissolve / Luma / Blur
  if (transId === 'dissolve' || transId === 'crossfade' || transId === 'luma-fade' || transId === 'blur-crossfade') {
    return {
      label: transId === 'luma-fade' ? 'Luma Fade' : transId === 'blur-crossfade' ? 'Blur Crossfade' : 'Crossfade',
      className: 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-black shadow-amber-500/30',
      wingBg: 'bg-amber-400/25',
      wingBorder: 'border-amber-400/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-black shrink-0">
          <polygon points="2,3 10,10 2,17" />
          <polygon points="18,3 10,10 18,17" />
        </svg>
      ),
    };
  }

  // Fade to Black
  if (transId === 'fade-black' || transId === 'fade') {
    return {
      label: 'Fade to Black',
      className: 'bg-zinc-800 hover:bg-zinc-700 border-zinc-500 text-zinc-100 shadow-black/40',
      wingBg: 'bg-zinc-800/40',
      wingBorder: 'border-zinc-500/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-current shrink-0">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M10,3 A7,7 0 0,1 10,17 Z" fill="currentColor" />
        </svg>
      ),
    };
  }

  // Fade to White
  if (transId === 'fade-white') {
    return {
      label: 'Fade to White',
      className: 'bg-white hover:bg-zinc-200 border-white text-black shadow-white/30',
      wingBg: 'bg-white/25',
      wingBorder: 'border-white/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-current shrink-0">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="white" />
          <path d="M10,3 A7,7 0 0,1 10,17 Z" fill="black" />
        </svg>
      ),
    };
  }

  // Slides & Whip Pans
  if (transId.startsWith('slide') || transId.startsWith('whip-pan')) {
    const isLeft = transId.includes('left');
    const isUp = transId.includes('up');
    const isDown = transId.includes('down');
    return {
      label: transId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      className: 'bg-sky-400 hover:bg-sky-300 border-sky-300 text-black shadow-sky-500/30',
      wingBg: 'bg-sky-400/25',
      wingBorder: 'border-sky-400/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-none stroke-black stroke-[2.2] shrink-0">
          {isLeft ? (
            <>
              <line x1="17" y1="10" x2="3" y2="10" />
              <polyline points="9,5 3,10 9,15" />
            </>
          ) : isUp ? (
            <>
              <line x1="10" y1="17" x2="10" y2="3" />
              <polyline points="5,9 10,3 15,9" />
            </>
          ) : isDown ? (
            <>
              <line x1="10" y1="3" x2="10" y2="17" />
              <polyline points="5,11 10,17 15,11" />
            </>
          ) : (
            <>
              <line x1="3" y1="10" x2="17" y2="10" />
              <polyline points="11,5 17,10 11,15" />
            </>
          )}
        </svg>
      ),
    };
  }

  // Pushes
  if (transId.startsWith('push')) {
    const isLeft = transId.includes('left');
    const isUp = transId.includes('up');
    const isDown = transId.includes('down');
    return {
      label: transId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      className: 'bg-emerald-400 hover:bg-emerald-300 border-emerald-300 text-black shadow-emerald-500/30',
      wingBg: 'bg-emerald-400/25',
      wingBorder: 'border-emerald-400/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-none stroke-black stroke-[2.2] shrink-0">
          <line x1="10" y1="2" x2="10" y2="18" />
          {isLeft ? (
            <polyline points="7,7 3,10 7,13" />
          ) : isUp ? (
            <polyline points="7,7 10,3 13,7" />
          ) : isDown ? (
            <polyline points="7,13 10,17 13,13" />
          ) : (
            <polyline points="13,7 17,10 13,13" />
          )}
        </svg>
      ),
    };
  }

  // Zooms
  if (transId.includes('zoom')) {
    const isOut = transId.includes('out');
    return {
      label: transId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      className: 'bg-indigo-500 hover:bg-indigo-400 border-indigo-300 text-white shadow-indigo-500/30',
      wingBg: 'bg-indigo-500/25',
      wingBorder: 'border-indigo-400/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-none stroke-white stroke-[2] shrink-0">
          {isOut ? (
            <>
              <polyline points="3,7 7,7 7,3" />
              <polyline points="17,7 13,7 13,3" />
              <polyline points="3,13 7,13 7,17" />
              <polyline points="17,13 13,13 13,17" />
            </>
          ) : (
            <>
              <polyline points="6,2 2,2 2,6" />
              <polyline points="14,2 18,2 18,6" />
              <polyline points="6,18 2,18 2,14" />
              <polyline points="14,18 18,18 18,14" />
            </>
          )}
        </svg>
      ),
    };
  }

  // Wipes & Reveals
  if (transId.includes('wipe') || transId.includes('reveal')) {
    return {
      label: transId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      className: 'bg-cyan-400 hover:bg-cyan-300 border-cyan-300 text-black shadow-cyan-500/30',
      wingBg: 'bg-cyan-400/25',
      wingBorder: 'border-cyan-400/60',
      icon: (
        <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-none stroke-black stroke-[2] shrink-0">
          <circle cx="10" cy="10" r="7" />
          <line x1="3" y1="17" x2="17" y2="3" />
        </svg>
      ),
    };
  }

  // RGB Split, Glitch, Flash, Rotate
  return {
    label: transId.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    className: 'bg-fuchsia-500 hover:bg-fuchsia-400 border-fuchsia-300 text-white shadow-fuchsia-500/30',
    wingBg: 'bg-fuchsia-500/25',
    wingBorder: 'border-fuchsia-400/60',
    icon: (
      <svg viewBox="0 0 20 20" className="w-2.5 h-2.5 fill-current shrink-0">
        <polygon points="11,2 4,11 9,11 8,18 16,9 11,9" />
      </svg>
    ),
  };
};

/**
 * Compact Framed Timeline Transition Button
 * - Double-bezel framed styling matching reference image (dark outer container + rounded color badge)
 * - Distinct colors and icons based on transition preset
 * - Compact 16x16px inner badge with clean hover interactions
 */
export const TimelineTransitionButton: React.FC<TimelineTransitionButtonProps> = ({
  leftPercent,
  topPx,
  activeTransition,
  duration = 0.5,
  title,
  onClick,
}) => {
  const isTransitionActive = Boolean(activeTransition && activeTransition !== 'none');
  const styleConfig = getTransitionConfig(activeTransition);

  const defaultTitle = isTransitionActive
    ? `${styleConfig.label} Transition (${duration.toFixed(1)}s) • Click to edit in inspector`
    : `Add transition cut • Click to open in inspector`;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title || defaultTitle}
      style={{
        left: `${leftPercent}%`,
        top: `${topPx}px`,
        transform: 'translate(-50%, -50%)',
      }}
      className={`group absolute z-35 flex items-center justify-center cursor-pointer select-none transition-all duration-150 hover:scale-115 active:scale-95 shadow-md ${
        isTransitionActive
          ? 'p-[2px] rounded-[6px] bg-[#141417] border border-black/80 ring-1 ring-white/15 hover:ring-white/30'
          : 'w-[16px] h-[16px] rounded-[4px] bg-[#1A1A20] hover:bg-[#262630] border border-white/20 hover:border-amber-400/80 text-neutral-400 hover:text-white'
      }`}
    >
      {/* Immediate Floating Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-0.5 rounded-md bg-[#18181C]/95 border border-[#3B82F6]/60 text-[10px] font-mono-studio text-white whitespace-nowrap shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-1.5 backdrop-blur-md">
        <span className={`w-1.5 h-1.5 rounded-full ${isTransitionActive ? 'bg-amber-400' : 'bg-blue-400'}`} />
        <span className="font-semibold text-zinc-100">{isTransitionActive ? styleConfig.label : 'Cut Seam'}</span>
        <span className="text-[9px] text-[#A1A1AA]">{isTransitionActive ? `(${duration.toFixed(1)}s)` : 'Click to add'}</span>
      </div>

      {isTransitionActive ? (
        <div
          className={`w-[16px] h-[16px] rounded-[4px] flex items-center justify-center shadow-xs border transition-colors ${styleConfig.className}`}
        >
          {styleConfig.icon}
        </div>
      ) : (
        // Neutral Cut Mark: Minimalist crisp vertical line
        <div className="w-[1.5px] h-2.5 bg-neutral-300 group-hover:bg-amber-300 rounded-full shrink-0 transition-colors" />
      )}
    </button>
  );
};

export default TimelineTransitionButton;
