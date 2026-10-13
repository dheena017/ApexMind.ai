import React, { useMemo } from 'react';

export interface TimelineWaveformProps {
  type: 'voice' | 'music' | 'sfx';
  color: string;
  barsCount?: number;
}

/**
 * High-definition dynamic waveform renderer for Voice, Music, and SFX
 */
export const TimelineWaveform: React.FC<TimelineWaveformProps> = ({
  type,
  color,
  barsCount = 75,
}) => {
  const bars = useMemo(() => {
    const list: number[] = [];
    for (let i = 0; i < barsCount; i++) {
      if (type === 'voice') {
        // Human speech prosody: phrase peaks, syllabic spikes, brief silence intervals
        const isPause = i % 15 === 13 || i % 15 === 14;
        if (isPause) {
          list.push(10);
        } else {
          const speechPulse = Math.sin(i * 0.45) * 25 + Math.cos(i * 1.15) * 32;
          const cadence = (i % 5) * 8;
          const height = 32 + speechPulse + cadence;
          list.push(Math.min(96, Math.max(14, height)));
        }
      } else if (type === 'music') {
        // 4/4 musical rhythm: punchy kick transients, snare peaks, continuous bass floor
        const isKick = i % 8 === 0;
        const isSnare = i % 8 === 4;
        const base = isKick ? 94 : isSnare ? 82 : i % 2 === 0 ? 56 : 38;
        const synthMelody = Math.sin(i * 0.28) * 14;
        list.push(Math.min(98, Math.max(22, base + synthMelody)));
      } else {
        // SFX: exponential rise, transient hit, smooth tail decay
        const phase = i % 25;
        const burst = phase < 6 ? phase * 15 : Math.max(12, 90 - (phase - 6) * 5);
        list.push(burst);
      }
    }
    return list;
  }, [type, barsCount]);

  return (
    <div className="absolute inset-0 flex items-center justify-between gap-[2px] px-2 opacity-55 pointer-events-none overflow-hidden select-none">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full shrink-0 transition-all ${color}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
};

export default TimelineWaveform;
