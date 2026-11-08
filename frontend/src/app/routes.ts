export type PageRoute =
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'workspace-prompt'
  | 'workspace-script'
  | 'workspace-editor'
  | 'workspace-media'
  | 'workspace-audio'
  | 'workspace-captions'
  | 'workspace-text'
  | 'workspace-elements'
  | 'workspace-canvas'
  | 'workspace-publish'
  | 'workspace-youtube'
  | 'workspace-automations'
  | 'workspace-image'
  | 'workspace-video'
  | 'videos'
  | 'channels'
  | 'youtube'
  | 'youtube-overview'
  | 'youtube-videos'
  | 'youtube-shorts'
  | 'youtube-playlists'
  | 'youtube-posts'
  | 'youtube-schedules'
  | 'youtube-analytics'
  | 'youtube-seo'
  | 'notifications'
  | 'profile'
  | 'profile-details'
  | 'profile-preferences'
  | 'profile-channels'
  | 'profile-activity'
  | 'profile-usage'
  | 'profile-studio-activity'
  | 'profile-security'
  | 'settings'
  | 'terms'
  | 'privacy'
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
  // ── 1. Landing & Auth ──
  { id: 'landing', path: '/', title: 'ApexMind - AI Motivational Video Studio', aliases: ['/landing', '/home'] },
  { id: 'login', path: '/login', title: 'Sign In - ApexMind Studio', aliases: ['/signin', '/auth'] },

  // ── 2. Creator Dashboard ──
  { id: 'dashboard', path: '/dashboard', title: 'Creator Dashboard - ApexMind Studio', aliases: ['/home-dashboard', '/overview'] },

  // ── 3. AI Video Creation Workspace & Sub-Panes ──
  { id: 'workspace', path: '/workspace', title: 'AI Video Studio - ApexMind', aliases: ['/studio'] },
  { id: 'workspace-prompt', path: '/workspace/prompt', title: 'AI Script Creator - ApexMind Studio', aliases: ['/studio/prompt'] },
  { id: 'workspace-script', path: '/workspace/script', title: 'Scene & Subtitles - ApexMind Studio', aliases: ['/workspace/editor', '/studio/editor', '/studio/script'] },
  { id: 'workspace-editor', path: '/workspace/editor', title: 'Scene & Subtitles - ApexMind Studio', aliases: ['/studio/editor'] },
  { id: 'workspace-media', path: '/workspace/media', title: 'Media Assets & B-Roll - ApexMind Studio', aliases: ['/studio/media', '/workspace/photos', '/workspace/videos', '/studio/photos', '/studio/videos'] },
  { id: 'workspace-image', path: '/workspace/image', title: 'Stock Photos - ApexMind Studio', aliases: ['/studio/photos', '/workspace/photos'] },
  { id: 'workspace-video', path: '/workspace/video', title: 'Stock Videos - ApexMind Studio', aliases: ['/studio/videos', '/workspace/videos'] },
  { id: 'workspace-audio', path: '/workspace/audio', title: 'Voice, Soundtracks & SFX - ApexMind Studio', aliases: ['/studio/audio', '/workspace/soundtracks'] },
  { id: 'workspace-captions', path: '/workspace/captions', title: 'Kinetic Captions & Typography - ApexMind Studio', aliases: ['/workspace/text', '/studio/text', '/studio/captions'] },
  { id: 'workspace-text', path: '/workspace/text', title: 'Kinetic Captions & Typography - ApexMind Studio', aliases: ['/studio/text'] },
  { id: 'workspace-elements', path: '/workspace/elements', title: 'Visual Elements & Badges - ApexMind Studio', aliases: ['/studio/elements'] },
  { id: 'workspace-canvas', path: '/workspace/canvas', title: 'Aspect Ratio & Canvas - ApexMind Studio', aliases: ['/studio/canvas'] },
  { id: 'workspace-publish', path: '/workspace/publish', title: 'Export & Publish - ApexMind Studio', aliases: ['/workspace/youtube', '/studio/youtube-pane', '/workspace/export', '/workspace/yt'] },
  { id: 'workspace-youtube', path: '/workspace/youtube', title: 'Export & Publish - ApexMind Studio', aliases: ['/studio/youtube-pane'] },
  { id: 'workspace-automations', path: '/workspace/automations', title: 'Daily Automations - ApexMind Studio', aliases: ['/studio/automations-pane', '/workspace/auto'] },

  // ── 4. Video Assets Library ──
  { id: 'videos', path: '/videos', title: 'Video Assets Library - ApexMind', aliases: ['/video-library', '/studio-videos', '/library'] },

  // ── 5. Omnichannel Social Fleet ──
  { id: 'channels', path: '/social-accounts', title: 'Connected Social Fleet - ApexMind', aliases: ['/channels', '/fleet', '/social-channels', '/connected-channels', '/auth/callback/meta'] },

  // ── 6. YouTube Channel Studio Hub ──
  { id: 'youtube', path: '/youtube', title: 'YouTube Studio Hub - ApexMind', aliases: ['/studio/youtube', '/youtube/overview'] },
  { id: 'youtube-overview', path: '/youtube', title: 'YouTube Studio Hub - ApexMind', aliases: ['/youtube/overview'] },
  { id: 'youtube-shorts', path: '/youtube/shorts', title: 'Channel Shorts - ApexMind Studio', aliases: ['/channel/shorts', '/shorts', '/youtube-shorts'] },
  { id: 'youtube-videos', path: '/youtube/videos', title: 'Channel Videos - ApexMind Studio', aliases: ['/channel/videos', '/youtube-videos'] },
  { id: 'youtube-schedules', path: '/youtube/schedules', title: 'Auto Upload Schedules - ApexMind Studio', aliases: ['/schedules', '/automation'] },
  { id: 'youtube-playlists', path: '/youtube/playlists', title: 'Channel Playlists - ApexMind Studio', aliases: ['/channel/playlists', '/playlists'] },
  { id: 'youtube-posts', path: '/youtube/community', title: 'Community Posts - ApexMind Studio', aliases: ['/youtube/posts', '/channel/community', '/community'] },
  { id: 'youtube-analytics', path: '/youtube/analytics', title: 'Channel Analytics - ApexMind Studio', aliases: ['/analytics'] },
  { id: 'youtube-seo', path: '/youtube/seo', title: 'SEO & Trending - ApexMind Studio', aliases: ['/seo'] },

  // ── 7. Creator Profile & Badges ──
  { id: 'profile', path: '/profile', title: 'Creator Profile & Badges - ApexMind', aliases: ['/account'] },
  { id: 'profile-details', path: '/profile/details', title: 'Creator Details & Badges - ApexMind' },
  { id: 'profile-preferences', path: '/profile/preferences', title: 'Studio Preferences - ApexMind' },
  { id: 'profile-channels', path: '/profile/channels', title: 'Connected Accounts - ApexMind' },
  { id: 'profile-activity', path: '/profile/activity', title: 'Creator Activity Log - ApexMind' },
  { id: 'profile-usage', path: '/profile/usage', title: 'Studio Usage & Quotas - ApexMind', aliases: ['/usage'] },
  { id: 'profile-studio-activity', path: '/profile/studio-activity', title: 'Studio Activity - ApexMind', aliases: ['/activity'] },
  { id: 'profile-security', path: '/profile/security', title: 'Account Security - ApexMind' },

  // ── 8. Global Notifications & Settings ──
  { id: 'notifications', path: '/notifications', title: 'Notifications & Alerts - ApexMind', aliases: ['/alerts', '/inbox'] },
  { id: 'settings', path: '/settings', title: 'Settings & AI Engine - ApexMind', aliases: ['/config', '/preferences'] },

  // ── 9. Public & Legal ──
  { id: 'terms', path: '/terms', title: 'Terms of Service - ApexMind', aliases: ['/terms-of-service', '/tos'] },
  { id: 'privacy', path: '/privacy', title: 'Privacy Policy - ApexMind', aliases: ['/privacy-policy'] },
  { id: 'loading', path: '/loading', title: 'Loading - ApexMind' },
  { id: '404', path: '/404', title: '404 Page Not Found - ApexMind' },
];

export function parseRoute(pathname: string): PageRoute {
  const pathOnly = pathname.split('?')[0].split('#')[0];
  const clean = pathOnly.replace(/\/+$/, '') || '/';
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
  return match ? match.path : (page.startsWith('/') ? page : `/${page}`);
}

export function getQueryParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params: Record<string, string> = {};
  try {
    new URLSearchParams(window.location.search).forEach((v, k) => {
      params[k] = v;
    });
  } catch {}
  return params;
}

export function getQueryParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

export function buildRouteUrl(
  page: PageRoute | string,
  queryParams?: Record<string, string | number | boolean | null | undefined>
): string {
  let basePath = '';
  let searchParams = new URLSearchParams();

  if (page.includes('?')) {
    const [p, q] = page.split('?');
    basePath = routeToPath(p);
    searchParams = new URLSearchParams(q);
  } else {
    basePath = routeToPath(page);
  }

  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, String(v));
      } else {
        searchParams.delete(k);
      }
    });
  }

  const qs = searchParams.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function updateUrlQuery(
  newParams: Record<string, string | number | boolean | null | undefined>,
  replaceState = true
): void {
  if (typeof window === 'undefined') return;
  try {
    const currentParams = new URLSearchParams(window.location.search);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') {
        currentParams.delete(k);
      } else {
        currentParams.set(k, String(v));
      }
    });
    const qs = currentParams.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (replaceState) {
      window.history.replaceState(window.history.state, '', newUrl);
    } else {
      window.history.pushState(window.history.state, '', newUrl);
    }
  } catch {}
}

export const REDIRECT_STORAGE_KEY = 'apexmind_redirect_after_login';

export function getPostLoginRedirect(): PageRoute {
  if (typeof window === 'undefined') return 'dashboard';

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
