import React from 'react';

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
      className="h-6 border-b border-[#262626] bg-[#141414] relative cursor-pointer"
      onPointerDown={onRulerPointerDown}
    >
      {ticks.map((t, idx) => {
        const pct = (t / totalDuration) * 100;
        return (
          <div
            key={idx}
            className="absolute top-0 bottom-0 flex flex-col justify-between"
            style={{ left: `${pct}%` }}
          >
            <span className="text-[8px] font-mono-studio text-[#6B7280] -translate-x-1/2 pt-0.5 pointer-events-none">
              {Math.floor(t)}s
            </span>
            <div className="w-px h-1.5 bg-[#333333] pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

export default TimelineRuler;
