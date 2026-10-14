/**
 * API utility for resolving backend URLs across environments.
 *
 * In local development:
 * Resolves to empty string '' by default so requests go to `/api/...` through the Vite dev server proxy.
 *
 * In production (Render, Vercel, Netlify):
 * Resolves to VITE_API_URL / VITE_BACKEND_URL / VITE_API_BASE_URL.
 * If running on Render (e.g. *.onrender.com) and no variable was provided at build time,
 * automatically falls back to the deployed backend URL 'https://apexmind-backend-zxw7.onrender.com'.
 */

export const API_BASE_URL: string = (() => {
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
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
 * Returns the full URL for an API endpoint.
 *
 * Examples:
 *   apiUrl('/api/auth/login')
 *   -> In dev: '/api/auth/login'
 *   -> In Render prod: 'https://apexmind-backend-zxw7.onrender.com/api/auth/login'
 */
export function apiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
