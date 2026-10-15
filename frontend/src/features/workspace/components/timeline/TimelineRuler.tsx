import React from 'react';

const getDecimalPlaces = (value: number) => {
  for (let places = 0; places <= 3; places += 1) {
    if (Math.abs(value - Number(value.toFixed(places))) < 1e-7) return places;
  }
  return 3;
};

const formatRulerLabel = (time: number, decimalPlaces: number) => {
  const roundedTime = Number(time.toFixed(decimalPlaces));
  const wholeSeconds = Math.floor(roundedTime);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const seconds = wholeSeconds % 60;
  const fractionalSeconds = roundedTime - wholeSeconds;
  const secondLabel = `${String(seconds).padStart(2, '0')}${
    decimalPlaces > 0 ? fractionalSeconds.toFixed(decimalPlaces).slice(1) : ''
  }`;
  const prefix = hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    : String(minutes).padStart(2, '0');

  return `${prefix}:${secondLabel}`;
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
  const tickInterval = ticks.length > 1 ? ticks[1] - ticks[0] : totalDuration;
  const decimalPlaces = getDecimalPlaces(tickInterval);

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
              className="absolute bottom-0 h-1 w-px bg-[#303030] pointer-events-none"
              style={{ left: `${(tick / totalDuration) * 100}%` }}
            />
          );
        });
      })}
      {ticks.map((t, idx) => {
        const pct = (t / totalDuration) * 100;
        const label = formatRulerLabel(t, decimalPlaces);
        const labelPosition =
          idx === 0 ? 'translate-x-0' : idx === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2';
        return (
          <div
            key={`${t}-${idx}`}
            className="absolute top-0 bottom-0 flex w-px flex-col justify-between"
            style={{ left: idx === ticks.length - 1 ? `calc(${pct}% - 1px)` : `${pct}%` }}
          >
            <span className={`text-[9px] leading-none font-mono-studio text-[#9CA3AF] ${labelPosition} pt-1 pointer-events-none`}>
              {label}
            </span>
            <div className="w-px h-1.5 bg-[#52525B] pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
};

export default TimelineRuler;
