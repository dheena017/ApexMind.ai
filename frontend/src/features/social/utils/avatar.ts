import type { SyntheticEvent } from 'react';

export function getSocialAvatarFallback(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .replace(/[&<>"']/g, '');
  const label = initials || '?';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#27272a"/><text x="48" y="53" fill="#e4e4e7" font-family="Arial,sans-serif" font-size="32" font-weight="600" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function handleSocialAvatarError(
  event: SyntheticEvent<HTMLImageElement>,
  name: string,
): void {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.src = getSocialAvatarFallback(name);
}
