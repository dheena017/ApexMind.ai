/**
 * frontend/src/features/workspace/utils/scriptFormatter.ts
 *
 * Text normalization and script transcript formatting utilities.
 */

import { SceneItem } from '../types/script';

export function formatScriptAsReadableText(title: string, scenes: SceneItem[]): string {
  const header = `=== ${title.toUpperCase()} ===\n\n`;
  const body = scenes
    .map((sc) => {
      const timeRange = `[${formatTime(sc.startTime)} - ${formatTime(sc.endTime)}] Scene ${sc.sceneNumber} (${sc.beat.toUpperCase()})`;
      const narration = sc.narration ? `Narration: ${sc.narration}` : '';
      const visual = sc.visualDescription ? `Visual: ${sc.visualDescription}` : '';
      const action = sc.action ? `Action: ${sc.action}` : '';
      return [timeRange, narration, visual, action].filter(Boolean).join('\n');
    })
    .join('\n\n');

  return `${header}${body}`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingDuration(text: string, wordsPerMinute: number = 150): number {
  const words = countWords(text);
  if (words === 0) return 0;
  return Math.round((words / wordsPerMinute) * 60);
}

export function applyFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  style: 'bold' | 'italic' | 'caps'
): string {
  const current = text || '';
  const selectedValue = current.slice(selectionStart, selectionEnd) || current;

  let modified = selectedValue;
  if (style === 'bold') modified = `**${selectedValue}**`;
  if (style === 'italic') modified = `*${selectedValue}*`;
  if (style === 'caps') modified = selectedValue.toUpperCase();

  return selectionStart === selectionEnd
    ? modified
    : current.slice(0, selectionStart) + modified + current.slice(selectionEnd);
}
