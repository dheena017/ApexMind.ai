export type PageRoute =
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'youtube'
  | 'notifications'
  | 'profile'
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
