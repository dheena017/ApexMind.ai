/**
 * API utility for resolving backend URLs across environments.
 *
 * In local development:
 * Resolves to empty string '' by default so requests go to `/api/...` through the Vite dev server proxy.
 *
 * In production (Render, Vercel, Netlify):
 * Resolves to VITE_API_URL.
 * If running on Render (e.g. *.onrender.com) and no variable was provided at build time,
 * automatically falls back to the deployed backend URL 'https://apexmind-backend-zxw7.onrender.com'.
 */

export const API_BASE_URL: string = (() => {
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    ''
  ).trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  // Auto-detect production deployment on Render
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://apexmind-backend-zxw7.onrender.com';
  }

  return '';
})();

/**
 * Returns the full URL for an API endpoint or media asset.
 *
 * Automatically normalizes any hardcoded localhost/loopback endpoints
 * (e.g. from local database records) so they point to the correct live API base in production.
 *
 * Examples:
 *   apiUrl('/api/auth/google')
 *   -> In dev: '/api/auth/google'
 *   -> In Render prod: 'https://apexmind-backend-zxw7.onrender.com/api/auth/google'
 *   apiUrl('http://127.0.0.1:8000/api/media/cover_123.jpg')
 *   -> In dev: '/api/media/cover_123.jpg'
 *   -> In Render prod: 'https://apexmind-backend-zxw7.onrender.com/api/media/cover_123.jpg'
 */
export function apiUrl(endpoint?: string | null): string {
  if (!endpoint) return '';

  let clean = endpoint.trim();

  // Strip hardcoded localhost / loopback addresses that may be stored in database or state
  clean = clean.replace(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/, '');

  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }
  const cleanEndpoint = clean.startsWith('/') ? clean : `/${clean}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
