/**
 * frontend/src/features/workspace/utils/srtExporter.ts
 *
 * Export utilities for .SRT and .VTT subtitle file generation and browser download.
 */

import { ScriptSubtitle } from '../types';
import { formatSRTTime, formatVTTTime } from './subtitleTiming';

export function generateSrtContent(subtitles: ScriptSubtitle[]): string {
  return subtitles
    .map((s, i) => {
      const start = formatSRTTime(s.start);
      const end = formatSRTTime(s.start + s.duration);
      return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
    })
    .join('\n');
}

export function generateVttContent(subtitles: ScriptSubtitle[]): string {
  const cues = subtitles
    .map((s, i) => {
      const start = formatVTTTime(s.start);
      const end = formatVTTTime(s.start + s.duration);
      return `${i + 1}\n${start} --> ${end}\n${s.text}\n`;
    })
    .join('\n');
  return `WEBVTT\n\n${cues}`;
}

export function downloadSubtitleFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSRTFile(subtitles: ScriptSubtitle[], title: string = 'video_subtitles'): boolean {
  if (!subtitles || subtitles.length === 0) return false;
  const content = generateSrtContent(subtitles);
  const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.srt`;
  downloadSubtitleFile(content, safeFilename);
  return true;
}

export async function copyTranscriptToClipboard(subtitles: ScriptSubtitle[]): Promise<boolean> {
  if (!subtitles || subtitles.length === 0) return false;
  const fullTranscript = subtitles.map((s) => s.text).join(' ');
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullTranscript);
      return true;
    }
  } catch {}
  return false;
}
