import { useCallback, useEffect, useState } from 'react';
import AppLayout from './app/AppLayout';
import AppRouter from './app/AppRouter';
import { APP_ROUTES, parseRoute, routeToPath, type PageRoute } from './app/routes';
import { consoleLogger } from './shared/utils/logger';
import { useAuth } from './features/auth/context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();

  const [activePage, setActivePage] = useState<PageRoute>(() => {
    // If not authenticated, always mount directly to login
    const parsed = typeof window === 'undefined' ? 'login' : parseRoute(window.location.pathname);
    return parsed;
  });

  // Strict Authentication Guard: Only allow login when not authenticated - no fallback
  useEffect(() => {
    if (!isAuthenticated) {
      if (activePage !== 'login') {
        consoleLogger.warn('AuthGuard', `Access to [${activePage}] blocked. Requiring login.`);
        setActivePage('login');
        if (window.location.pathname !== '/login') {
          window.history.pushState({ page: 'login' }, '', '/login');
        }
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
      if (!isAuthenticated) {
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

      // Strict Auth Guard: If not logged in, only allow login
      if (!isAuthenticated) {
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
