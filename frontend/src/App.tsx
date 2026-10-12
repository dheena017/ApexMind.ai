import { useCallback, useEffect, useState } from 'react';
import AppLayout from './app/AppLayout';
import AppRouter from './app/AppRouter';
import { APP_ROUTES, parseRoute, routeToPath, type PageRoute } from './app/routes';
import { consoleLogger } from './shared/utils/logger';
import { useAuth } from './features/auth/context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();

  const [activePage, setActivePage] = useState<PageRoute>(() => {
    const parsed = typeof window === 'undefined' ? 'landing' : parseRoute(window.location.pathname);
    // If user is already authenticated and visits '/', default to dashboard
    if (parsed === 'landing' && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('apexmind_user');
        const token = localStorage.getItem('apexmind_token');
        if (stored && token) {
          return 'dashboard';
        }
      } catch {}
    }
    return parsed;
  });

  // Auth Guard: Unauthenticated users attempting to access internal studio pages are redirected to login
  useEffect(() => {
    const isPublicPage = activePage === 'landing' || activePage === 'login' || activePage === '404';
    if (!isAuthenticated && !isPublicPage) {
      consoleLogger.warn('AuthGuard', `Access to [${activePage}] requires login. Redirecting to login.`);
      setActivePage('login');
      if (window.location.pathname !== '/login') {
        window.history.pushState({ page: 'login' }, '', '/login');
      }
    }
  }, [isAuthenticated, activePage]);

  // When user completes login, redirect to Dashboard by default
  useEffect(() => {
    if (isAuthenticated && activePage === 'login') {
      consoleLogger.info('Auth', 'Authenticated user on login view -> redirecting to Dashboard');
      setActivePage('dashboard');
      if (window.location.pathname !== '/dashboard') {
        window.history.pushState({ page: 'dashboard' }, '', '/dashboard');
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
      const isPublicPage = parsed === 'landing' || parsed === 'login' || parsed === '404';
      if (!isAuthenticated && !isPublicPage) {
        setActivePage('login');
        return;
      }
      consoleLogger.action('Router', `Browser History PopState detected -> navigating to: "${parsed}"`);
      setActivePage(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const handleNavigate = useCallback(
    (page: string) => {
      let targetRoute = APP_ROUTES.find((route) => route.id === page)?.id ?? '404';
      const isPublicPage = targetRoute === 'landing' || targetRoute === 'login' || targetRoute === '404';

      // If user tries to open a protected studio page without login, direct to login
      if (!isAuthenticated && !isPublicPage) {
        consoleLogger.warn('AuthGuard', `Must login to access [${targetRoute}]. Redirecting to login.`);
        targetRoute = 'login';
      }

      const targetPath = routeToPath(targetRoute);

      setActivePage((currentRoute) => {
        if (currentRoute !== targetRoute) {
          consoleLogger.nav(currentRoute, targetRoute);
        }
        return targetRoute;
      });

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page: targetRoute }, '', targetPath);
      }
    },
    [isAuthenticated]
  );

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate}>
      <AppRouter activePage={activePage} onNavigate={handleNavigate} />
    </AppLayout>

  );
}
