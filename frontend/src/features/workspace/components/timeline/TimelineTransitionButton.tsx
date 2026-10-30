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

/**
 * Timeline Transition Seam Button
 * Clean, simplest design matching the website's dark studio theme:
 * - Default cut: Dark studio button (bg-[#1E1E24] / border-white/20) with a clean subtle cut line
 * - Active transition: Amber badge (#F59E0B) with transition bowtie icon
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

  const defaultTitle = isTransitionActive
    ? `Transition: ${activeTransition} (${duration.toFixed(1)}s) • Click to edit in inspector`
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
      className={`absolute z-35 flex items-center justify-center cursor-pointer select-none transition-all hover:scale-110 active:scale-95 shadow-sm ${
        isTransitionActive
          ? 'w-[22px] h-[22px] rounded-[5px] bg-[#F59E0B] hover:bg-[#FBBF24] border border-[#18181B] text-black shadow-amber-500/20'
          : 'w-[20px] h-[20px] rounded-[5px] bg-[#1E1E24] hover:bg-[#282832] border border-white/20 hover:border-amber-400/80 text-neutral-300 hover:text-white'
      }`}
    >
      {isTransitionActive ? (
        // Active Transition: Sleek black bowtie icon
        <svg viewBox="0 0 20 20" className="w-3 h-3 fill-black shrink-0">
          <polygon points="3,3 10,10 3,17" />
          <polygon points="17,3 10,10 17,17" />
        </svg>
      ) : (
        // Neutral Cut: Minimalist vertical divider
        <div className="w-[1.5px] h-2.5 bg-neutral-300 hover:bg-amber-300 rounded-full shrink-0 transition-colors" />
      )}
    </button>
  );
};

export default TimelineTransitionButton;
