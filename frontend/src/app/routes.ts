export type PageRoute =
  | 'landing'
  | 'dashboard'
  | 'workspace'
  | 'workspace-script'
  | 'workspace-prompt'
  | 'workspace-editor'
  | 'workspace-media'
  | 'workspace-audio'
  | 'workspace-elements'
  | 'workspace-text'
  | 'workspace-canvas'
  | 'workspace-image'
  | 'workspace-video'
  | 'videos'
  | 'youtube'
  | 'youtube-videos'
  | 'youtube-shorts'
  | 'youtube-playlists'
  | 'youtube-posts'
  | 'youtube-analytics'
  | 'youtube-seo'
  | 'youtube-trending'
  | 'youtube-schedules'
  | 'youtube-settings'
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
  // ── 1. Landing & Home ──
  { id: 'landing', path: '/', title: 'ApexMind - AI Motivational YouTube Studio', aliases: ['/landing', '/home'] },
  { id: 'dashboard', path: '/dashboard', title: 'Dashboard - ApexMind Studio', aliases: ['/home-dashboard'] },

  // ── 2. AI Video Creation Workspace & Sub-Panes ──
  { id: 'workspace', path: '/workspace', title: 'AI Video Studio - ApexMind', aliases: ['/studio', '/editor'] },
  { id: 'workspace-script', path: '/workspace/script', title: 'Script & AI - ApexMind Studio', aliases: ['/studio/script'] },
  { id: 'workspace-prompt', path: '/workspace/prompt', title: 'AI Script Creator - ApexMind Studio', aliases: ['/studio/prompt'] },
  { id: 'workspace-editor', path: '/workspace/editor', title: 'Script & Subtitles - ApexMind Studio', aliases: ['/studio/editor'] },
  { id: 'workspace-media', path: '/workspace/media', title: 'Media Library - ApexMind Studio', aliases: ['/studio/media'] },
  { id: 'workspace-audio', path: '/workspace/audio', title: 'Voice & Audio - ApexMind Studio', aliases: ['/studio/audio'] },
  { id: 'workspace-elements', path: '/workspace/elements', title: 'Visual Elements - ApexMind Studio', aliases: ['/studio/elements'] },
  { id: 'workspace-text', path: '/workspace/text', title: 'Text & Captions - ApexMind Studio', aliases: ['/studio/text'] },
  { id: 'workspace-canvas', path: '/workspace/canvas', title: 'Video Canvas - ApexMind Studio', aliases: ['/studio/canvas'] },
  { id: 'workspace-image', path: '/workspace/image', title: 'Stock Photos - ApexMind Studio', aliases: ['/studio/photos', '/workspace/photos'] },
  { id: 'workspace-video', path: '/workspace/video', title: 'Stock Videos - ApexMind Studio', aliases: ['/studio/videos', '/workspace/videos'] },

  // ── 3. Video Assets Library ──
  { id: 'videos', path: '/videos', title: 'Website Video Library - ApexMind', aliases: ['/video-library', '/studio-videos', '/library'] },

  // ── 4. YouTube Channel Studio & Dedicated Sub-Paths ──
  { id: 'youtube', path: '/youtube', title: 'YouTube Studio Hub - ApexMind', aliases: ['/channels', '/studio/youtube', '/youtube/overview'] },
  { id: 'youtube-videos', path: '/youtube/videos', title: 'Channel Videos - ApexMind Studio', aliases: ['/channel/videos', '/youtube-videos'] },
  { id: 'youtube-shorts', path: '/youtube/shorts', title: 'Channel Shorts - ApexMind Studio', aliases: ['/channel/shorts', '/shorts', '/youtube-shorts'] },
  { id: 'youtube-playlists', path: '/youtube/playlists', title: 'Channel Playlists - ApexMind Studio', aliases: ['/channel/playlists', '/playlists'] },
  { id: 'youtube-posts', path: '/youtube/community', title: 'Community Posts - ApexMind Studio', aliases: ['/youtube/posts', '/channel/community', '/community'] },
  { id: 'youtube-seo', path: '/youtube/seo', title: 'SEO & Tags Generator - ApexMind Studio', aliases: ['/youtube/tags', '/seo', '/tags'] },
  { id: 'youtube-trending', path: '/youtube/trending', title: 'Viral Trending Shorts - ApexMind Studio', aliases: ['/youtube/viral', '/trending', '/viral'] },
  { id: 'youtube-schedules', path: '/youtube/schedules', title: 'Auto Upload Schedules - ApexMind Studio', aliases: ['/schedules', '/automation'] },
  { id: 'youtube-analytics', path: '/youtube/analytics', title: 'Realtime Channel Analytics - ApexMind Studio', aliases: ['/analytics', '/channel/analytics'] },
  { id: 'youtube-settings', path: '/youtube/settings', title: 'YouTube Channel Settings - ApexMind Studio', aliases: ['/youtube/config'] },

  // ── 5. Creator Profile & Badges ──
  { id: 'profile', path: '/profile', title: 'Profile & Badges - ApexMind', aliases: ['/account'] },
  { id: 'profile-details', path: '/profile/details', title: 'Creator Details - ApexMind' },
  { id: 'profile-preferences', path: '/profile/preferences', title: 'Creator Preferences - ApexMind' },
  { id: 'profile-channels', path: '/profile/channels', title: 'Connected Channels - ApexMind' },
  { id: 'profile-activity', path: '/profile/activity', title: 'Creator Activity - ApexMind' },
  { id: 'profile-usage', path: '/profile/usage', title: 'Studio Usage - ApexMind', aliases: ['/usage'] },
  { id: 'profile-studio-activity', path: '/profile/studio-activity', title: 'Studio Activity - ApexMind', aliases: ['/activity'] },
  { id: 'profile-security', path: '/profile/security', title: 'Account Security - ApexMind' },

  // ── 6. Global Notifications & System Settings ──
  { id: 'notifications', path: '/notifications', title: 'Notifications - ApexMind', aliases: ['/alerts', '/inbox'] },
  { id: 'settings', path: '/settings', title: 'Settings - ApexMind', aliases: ['/config', '/preferences'] },

  // ── 7. Public & Legal ──
  { id: 'terms', path: '/terms', title: 'Terms of Service - ApexMind', aliases: ['/terms-of-service', '/tos'] },
  { id: 'privacy', path: '/privacy', title: 'Privacy Policy - ApexMind', aliases: ['/privacy-policy'] },
  { id: 'login', path: '/login', title: 'Sign In - ApexMind', aliases: ['/signin', '/auth'] },
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
