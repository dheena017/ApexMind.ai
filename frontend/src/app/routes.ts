export type PageRoute =
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'youtube'
  | 'notifications'
  | 'profile'
  | 'profile-details'
  | 'profile-preferences'
  | 'profile-channels'
  | 'profile-activity'
  | 'profile-usage'
  | 'profile-security'
  | 'settings'
  | 'login'
  | 'loading'
  | '404';

export interface RouteConfig {
  id: PageRoute;
  path: string;
  title: string;
  aliases?: string[];
}

export const APP_ROUTES: RouteConfig[] = [
  { id: 'landing', path: '/', title: 'ApexMind - AI Motivational YouTube Studio', aliases: ['/landing'] },
  { id: 'dashboard', path: '/dashboard', title: 'Dashboard - ApexMind Studio' },
  { id: 'workspace', path: '/workspace', title: 'AI Video Studio - ApexMind', aliases: ['/studio'] },
  { id: 'youtube', path: '/youtube', title: 'YouTube Manager - ApexMind', aliases: ['/channels'] },
  { id: 'notifications', path: '/notifications', title: 'Notifications - ApexMind', aliases: ['/alerts'] },
  { id: 'profile', path: '/profile', title: 'Profile & Badges - ApexMind', aliases: ['/account'] },
  { id: 'profile-details', path: '/profile/details', title: 'Creator Details - ApexMind' },
  { id: 'profile-preferences', path: '/profile/preferences', title: 'Creator Preferences - ApexMind' },
  { id: 'profile-channels', path: '/profile/channels', title: 'Connected Channels - ApexMind' },
  { id: 'profile-activity', path: '/profile/activity', title: 'Creator Activity - ApexMind' },
  { id: 'profile-usage', path: '/profile/usage', title: 'Studio Usage - ApexMind' },
  { id: 'profile-security', path: '/profile/security', title: 'Account Security - ApexMind' },
  { id: 'settings', path: '/settings', title: 'Settings - ApexMind' },
  { id: 'login', path: '/login', title: 'Sign In - ApexMind' },
  { id: 'loading', path: '/loading', title: 'Loading - ApexMind' },
  { id: '404', path: '/404', title: '404 Page Not Found - ApexMind' },
];

export function parseRoute(pathname: string): PageRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const lower = clean.toLowerCase();

  for (const route of APP_ROUTES) {
    if (route.path.toLowerCase() === lower) {
      return route.id;
    }
    if (route.aliases?.some((a) => a.toLowerCase() === lower)) {
      return route.id;
    }
  }

  return '404';
}

export function routeToPath(page: string): string {
  const match = APP_ROUTES.find((r) => r.id === page);
  return match ? match.path : `/${page}`;
}

export const REDIRECT_STORAGE_KEY = 'apexmind_redirect_after_login';

export function getPostLoginRedirect(): PageRoute {
  if (typeof window === 'undefined') return 'dashboard';

  // 1. Check URL query parameters: ?redirect=... or ?returnTo=...
  try {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect') || params.get('returnTo');
    if (redirectParam) {
      const cleaned = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
      const parsed = parseRoute(cleaned);
      if (parsed !== '404' && parsed !== 'login' && parsed !== 'landing') {
        return parsed;
      }
    }
  } catch {}

  // 2. Check sessionStorage
  try {
    const saved = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    if (saved) {
      const cleaned = saved.startsWith('/') ? saved : `/${saved}`;
      const parsed = parseRoute(cleaned);
      if (parsed !== '404' && parsed !== 'login' && parsed !== 'landing') {
        return parsed;
      }
    }
  } catch {}

  // 3. Fallback default
  return 'dashboard';
}

export function savePostLoginRedirect(targetRoute: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (targetRoute && targetRoute !== 'landing' && targetRoute !== 'login' && targetRoute !== '404') {
      sessionStorage.setItem(REDIRECT_STORAGE_KEY, targetRoute);
    }
  } catch {}
}

export function clearPostLoginRedirect(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
  } catch {}
}
