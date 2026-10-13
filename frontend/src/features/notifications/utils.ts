export function formatTimeAgo(timestampStr: string): string {
  if (!timestampStr) return '';
  const trimmed = timestampStr.trim();
  if (trimmed.toLowerCase() === 'just now') return 'Just now';

  // Handle both standard SQL timestamps 'YYYY-MM-DD HH:MM:SS' and ISO formats
  const formatted = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T') + 'Z';
  const parsed = Date.parse(formatted);
  if (isNaN(parsed)) {
    // Try fallback parse
    const fallback = Date.parse(trimmed);
    if (isNaN(fallback)) return trimmed;
    return getRelativeString(fallback);
  }

  return getRelativeString(parsed);
}

function getRelativeString(timestampMs: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestampMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
