import React from 'react';

const formatRulerLabel = (time: number, totalDuration: number) => {
  if (totalDuration < 60) {
    return Number.isInteger(time) ? `${time}s` : `${Number(time.toFixed(1))}s`;
  }

  const minutes = Math.floor(time / 60);
  const seconds = Number((time % 60).toFixed(1));
  const secondLabel = Number.isInteger(seconds)
    ? String(seconds).padStart(2, '0')
    : seconds.toFixed(1).padStart(4, '0');
  return `${String(minutes).padStart(2, '0')}:${secondLabel}`;
};

export interface TimelineRulerProps {
  ticks: number[];
  totalDuration: number;
  onRulerPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  ticks,
  totalDuration,
  onRulerPointerDown,
}) => {
  return (
    <div
      className="h-6 border-b border-[#262626] bg-[#141414] relative cursor-ew-resize select-none"
      onPointerDown={onRulerPointerDown}
      title="Click or drag ruler to scrub playhead"
    >
      {ticks.slice(0, -1).flatMap((start, idx) => {
        const end = ticks[idx + 1];
        return [1, 2, 3].map((step) => {
          const tick = start + ((end - start) * step) / 4;
          return (
            <div
              key={`minor-${idx}-${step}`}
              className="absolute bottom-0 h-1 w-px bg-[#292929] pointer-events-none"
              style={{ left: `${(tick / totalDuration) * 100}%` }}
            />
          );
        });
      })}
      {ticks.map((t, idx) => {
        const pct = (t / totalDuration) * 100;
        const label = formatRulerLabel(t, totalDuration);
        const labelPosition =
          idx === 0 ? 'translate-x-0' : idx === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2';
        return (
          <div
            key={idx}
            className="absolute top-0 bottom-0 flex w-px flex-col justify-between"
            style={{ left: idx === ticks.length - 1 ? `calc(${pct}% - 1px)` : `${pct}%` }}
          >
            <span className={`text-[8px] font-mono-studio text-[#6B7280] ${labelPosition} pt-0.5 pointer-events-none`}>
              {label}
            </span>
            <div className="w-px h-1.5 bg-[#333333] pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

export default TimelineRuler;
