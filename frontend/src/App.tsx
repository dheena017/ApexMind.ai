import { useCallback, useEffect, useState } from 'react';
import AppLayout from './app/AppLayout';
import AppRouter from './app/AppRouter';
import {
  APP_ROUTES,
  parseRoute,
  routeToPath,
  buildRouteUrl,
  getQueryParams,
  getPostLoginRedirect,
  savePostLoginRedirect,
  clearPostLoginRedirect,
  type PageRoute,
} from './app/routes';
import { consoleLogger } from './shared/utils/logger';
import { useAuth, isSessionValid } from './features/auth/context/AuthContext';
import { WorkspaceTabType } from './features/workspace/components/WorkspaceSidebar';

export default function App() {
  const { isAuthenticated } = useAuth();

  const [activePage, setActivePage] = useState<PageRoute>(() => {
    const parsed = typeof window === 'undefined' ? 'landing' : parseRoute(window.location.pathname);
    // If user is already authenticated and visits '/' or '/login', send directly to dashboard
    if ((parsed === 'landing' || parsed === 'login') && typeof window !== 'undefined' && isSessionValid()) {
      if (window.location.pathname !== '/dashboard') {
        window.history.replaceState({ page: 'dashboard' }, '', '/dashboard');
      }
      return 'dashboard';
    }

    // If an unauthenticated user opens directly to an internal studio page, store the intent and load login
    const isPublic =
      parsed === 'landing' ||
      parsed === 'login' ||
      parsed === 'loading' ||
      parsed === '404' ||
      parsed === 'terms' ||
      parsed === 'privacy';
    if (!isPublic && typeof window !== 'undefined') {
      if (!isSessionValid()) {
        savePostLoginRedirect(parsed);
        return 'login';
      }
    }

    return parsed;
  });
  const [activeWorkspacePane, setActiveWorkspacePane] = useState<WorkspaceTabType>(() => {
    const parsed = typeof window === 'undefined' ? 'landing' : parseRoute(window.location.pathname);
    const params = getQueryParams();
    if (params.tab) {
      return params.tab as WorkspaceTabType;
    }
    if (parsed.startsWith('workspace-')) {
      return parsed.replace('workspace-', '') as WorkspaceTabType;
    }
    return 'editor';
  });

  // Sync activeWorkspacePane if activePage changes to a workspace sub-path
  useEffect(() => {
    if (activePage.startsWith('workspace-')) {
      const pane = activePage.replace('workspace-', '') as WorkspaceTabType;
      setActiveWorkspacePane(pane);
    } else if (activePage === 'workspace') {
      const params = getQueryParams();
      if (params.tab) {
        setActiveWorkspacePane(params.tab as WorkspaceTabType);
      }
    }
  }, [activePage]);

  // Auth Guard: Unauthenticated users attempting to access internal studio pages are redirected to login with redirect intent
  useEffect(() => {
    const isPublicPage =
      activePage === 'landing' ||
      activePage === 'login' ||
      activePage === 'loading' ||
      activePage === '404' ||
      activePage === 'terms' ||
      activePage === 'privacy';
    if (!isAuthenticated && !isPublicPage) {
      consoleLogger.warn('AuthGuard', `Access to [${activePage}] requires login. Storing redirect intent.`);
      savePostLoginRedirect(activePage);
      setActivePage('login');
      const loginUrl = `/login?redirect=${activePage}`;
      if (window.location.pathname !== '/login') {
        window.history.pushState({ page: 'login' }, '', loginUrl);
      }
    }
  }, [isAuthenticated, activePage]);

  // If already authenticated and on login or landing, send directly to Dashboard
  useEffect(() => {
    if (isAuthenticated && (activePage === 'login' || activePage === 'landing')) {
      const destination = getPostLoginRedirect() || 'dashboard';
      clearPostLoginRedirect();
      consoleLogger.info('Auth', `Authenticated creator on [${activePage}] -> directing directly to Studio [${destination}]`);
      setActivePage(destination);
      const targetPath = routeToPath(destination);
      if (window.location.pathname !== targetPath) {
        window.history.replaceState({ page: destination }, '', targetPath);
      }
    }
  }, [isAuthenticated, activePage]);

  useEffect(() => {
    const route = APP_ROUTES.find((r) => r.id === activePage);
    const pageTitle = route?.title ?? 'ApexMind - AI Motivational YouTube Studio';
    document.title = pageTitle;
    consoleLogger.info('Router', `Active view updated to [${activePage}] — title: "${pageTitle}"`);
  }, [activePage]);

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoute(window.location.pathname);
      const isPublicPage =
        parsed === 'landing' ||
        parsed === 'login' ||
        parsed === 'loading' ||
        parsed === '404' ||
        parsed === 'terms' ||
        parsed === 'privacy';
      if (!isAuthenticated && !isPublicPage) {
        savePostLoginRedirect(window.location.pathname + window.location.search);
        setActivePage('login');
        return;
      }
      // If user is authenticated and clicks back to landing or login, direct to dashboard
      if (isAuthenticated && (parsed === 'landing' || parsed === 'login')) {
        setActivePage('dashboard');
        window.history.replaceState({ page: 'dashboard' }, '', '/dashboard');
        return;
      }
      const params = getQueryParams();
      if (parsed.startsWith('workspace-')) {
        setActiveWorkspacePane(parsed.replace('workspace-', '') as WorkspaceTabType);
      } else if (parsed === 'workspace' && params.tab) {
        setActiveWorkspacePane(params.tab as WorkspaceTabType);
      }
      consoleLogger.action('Router', `Browser History PopState detected -> navigating to: "${parsed}"`, params);
      setActivePage(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const handleNavigate = useCallback(
    (page: string, queryParams?: Record<string, string | number | boolean | null | undefined>) => {
      // Support passing "workspace?tab=editor&videoId=xxx" or page id
      const [pathPart, queryPart] = page.split('?');
      let targetRoute = APP_ROUTES.find((route) => route.id === pathPart)?.id;
      if (!targetRoute) {
        targetRoute = parseRoute(pathPart);
      }

      const isPublicPage =
        targetRoute === 'landing' ||
        targetRoute === 'login' ||
        targetRoute === 'loading' ||
        targetRoute === '404' ||
        targetRoute === 'terms' ||
        targetRoute === 'privacy';

      // If user is already authenticated and tries to navigate to login or landing, route directly to dashboard
      if (isAuthenticated && (targetRoute === 'login' || targetRoute === 'landing')) {
        targetRoute = 'dashboard';
      }

      // If user explicitly navigates to login (e.g. clicks "Sign In"), clear prior deep redirect
      if (targetRoute === 'login') {
        clearPostLoginRedirect();
      }

      // Merge inline query parameters with queryParams argument
      const mergedParams: Record<string, any> = {};
      if (queryPart) {
        new URLSearchParams(queryPart).forEach((v, k) => {
          mergedParams[k] = v;
        });
      }
      if (queryParams) {
        Object.assign(mergedParams, queryParams);
      }

      // If user tries to open a protected studio page without login, save intent and redirect to login
      if (!isAuthenticated && !isPublicPage) {
        const fullIntended = buildRouteUrl(targetRoute, mergedParams);
        consoleLogger.warn('AuthGuard', `Must login to access [${fullIntended}]. Preserving target for post-login redirect.`);
        savePostLoginRedirect(fullIntended);
        setActivePage('login');
        const loginUrl = `/login?redirect=${encodeURIComponent(fullIntended)}`;
        if (window.location.pathname !== '/login') {
          window.history.pushState({ page: 'login' }, '', loginUrl);
        }
        return;
      }

      const targetPath = buildRouteUrl(targetRoute, mergedParams);

      setActivePage((currentRoute) => {
        if (currentRoute !== targetRoute) {
          consoleLogger.nav(currentRoute, targetRoute);
        }
        return targetRoute;
      });

      // Synchronize workspace sub-tab if specified
      if (targetRoute.startsWith('workspace-')) {
        const pane = targetRoute.replace('workspace-', '') as WorkspaceTabType;
        setActiveWorkspacePane(pane);
      } else if (targetRoute === 'workspace' && mergedParams.tab) {
        setActiveWorkspacePane(mergedParams.tab as WorkspaceTabType);
      }

      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== targetPath) {
        window.history.pushState({ page: targetRoute, params: mergedParams }, '', targetPath);
      }
    },
    [isAuthenticated]
  );

  const handleWorkspacePaneChange = useCallback(
    (pane: WorkspaceTabType) => {
      setActiveWorkspacePane(pane);
      const targetRoute = `workspace-${pane}` as PageRoute;
      // Preserve active query params (e.g. videoId) when changing tabs
      const currentParams = getQueryParams();
      const targetPath = buildRouteUrl(targetRoute, currentParams);
      const currentFullUrl = window.location.pathname + window.location.search;
      if (currentFullUrl !== targetPath) {
        window.history.pushState({ page: targetRoute, params: currentParams }, '', targetPath);
      }
    },
    []
  );

  return (
    <AppLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      activeWorkspacePane={activeWorkspacePane}
      onWorkspacePaneChange={handleWorkspacePaneChange}
    >
      <AppRouter
        activePage={activePage}
        onNavigate={handleNavigate}
        activeWorkspacePane={activeWorkspacePane}
        onWorkspacePaneChange={handleWorkspacePaneChange}
      />
    </AppLayout>

  );
}
