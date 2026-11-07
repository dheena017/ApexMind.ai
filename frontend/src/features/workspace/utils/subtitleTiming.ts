/**
 * frontend/src/features/workspace/utils/subtitleTiming.ts
 *
 * Subtitle timing, cue duration calculations, and reading speed validation.
 */

import { ScriptSubtitle } from '../types';

export function formatTimecode(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = (s % 60).toFixed(1);
  return `${mins.toString().padStart(2, '0')}:${Number(secs) < 10 ? '0' : ''}${secs}`;
}

export function formatSRTTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatVTTTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function calculateReadingSpeedWpm(text: string, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((wordCount / durationSeconds) * 60);
}

export function recalculateContiguousTimings(subtitles: ScriptSubtitle[]): ScriptSubtitle[] {
  let currentTime = 0;
  return subtitles.map((cue) => {
    const updated = {
      ...cue,
      start: Number(currentTime.toFixed(2)),
      duration: Number(Math.max(0.5, cue.duration).toFixed(2)),
    };
    currentTime += updated.duration;
    return updated;
  });
}

export function rebalanceSubtitleTimings(subtitles: ScriptSubtitle[], targetDurationSec: number): ScriptSubtitle[] {
  if (subtitles.length === 0) return [];
  const durationPerCue = Number((targetDurationSec / subtitles.length).toFixed(1));
  return subtitles.map((s, idx) => ({
    ...s,
    start: Number((idx * durationPerCue).toFixed(1)),
    duration: durationPerCue,
  }));
}

export function splitSubtitleCue(subtitles: ScriptSubtitle[], index: number): ScriptSubtitle[] | null {
  const target = subtitles[index];
  if (!target) return null;

  const words = target.text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return null;

  const mid = Math.ceil(words.length / 2);
  const firstPart = words.slice(0, mid).join(' ');
  const secondPart = words.slice(mid).join(' ');
  const halfDuration = Number((target.duration / 2).toFixed(1));

  const cue1: ScriptSubtitle = {
    ...target,
    text: firstPart,
    duration: halfDuration,
  };
  const cue2: ScriptSubtitle = {
    text: secondPart,
    start: Number((target.start + halfDuration).toFixed(1)),
    duration: halfDuration,
  };

  const next = [...subtitles];
  next.splice(index, 1, cue1, cue2);
  return next;
}

export function insertSubtitleCue(subtitles: ScriptSubtitle[], afterIndex?: number): ScriptSubtitle[] {
  const next = [...subtitles];
  if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < next.length) {
    const prev = next[afterIndex];
    const start = Number((prev.start + prev.duration).toFixed(1));
    next.splice(afterIndex + 1, 0, {
      text: 'New subtitle cue...',
      start,
      duration: 2.0,
    });
  } else {
    const lastSub = next[next.length - 1];
    const start = lastSub ? Number((lastSub.start + lastSub.duration).toFixed(1)) : 0;
    next.push({
      text: 'New subtitle cue...',
      start,
      duration: 2.0,
    });
  }
  return next;
}

export function generateCuesFromText(fullText: string, targetDurationSec: number = 30): ScriptSubtitle[] {
  const words = fullText.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunkSize = 5;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  const targetSec = targetDurationSec > 0 ? targetDurationSec : 30;
  const durationPerChunk = Number((targetSec / chunks.length).toFixed(1));

  return chunks.map((chunk, idx) => ({
    text: chunk,
    start: Number((idx * durationPerChunk).toFixed(1)),
    duration: durationPerChunk,
  }));
}
