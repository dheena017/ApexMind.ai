import { useCallback, useEffect, useState } from 'react';
import AppLayout from './app/AppLayout';
import AppRouter from './app/AppRouter';
import { APP_ROUTES, parseRoute, routeToPath, type PageRoute } from './app/routes';
import { consoleLogger } from './shared/utils/logger';
import { useAuth } from './features/auth/context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();

  const [activePage, setActivePage] = useState<PageRoute>(() => {
    const initialRoute = typeof window === 'undefined'
      ? 'landing'
      : parseRoute(window.location.pathname);
    consoleLogger.info('Router', `Initial application mount on route: "${initialRoute}"`);
    return initialRoute;
  });

  // Authentication Guard: Only allow access to protected pages if authenticated
  useEffect(() => {
    const isPublic = activePage === 'landing' || activePage === 'login';
    if (!isAuthenticated && !isPublic) {
      consoleLogger.warn('AuthGuard', `Unauthenticated access to [${activePage}] blocked. Redirecting to [login]`);
      setActivePage('login');
      if (window.location.pathname !== '/login') {
        window.history.pushState({ page: 'login' }, '', '/login');
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
      consoleLogger.action('Router', `Browser History PopState detected -> navigating to: "${parsed}"`);
      setActivePage(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback((page: string) => {
    let targetRoute = APP_ROUTES.find((route) => route.id === page)?.id ?? '404';

    // Route Protection: If not logged in and requesting a protected studio route, redirect to login
    const isPublic = targetRoute === 'landing' || targetRoute === 'login';
    if (!isAuthenticated && !isPublic) {
      consoleLogger.warn('AuthGuard', `Blocked unauthenticated attempt to visit [${targetRoute}]. Redirecting to [login].`);
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
  }, [isAuthenticated]);

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate}>
      <AppRouter activePage={activePage} onNavigate={handleNavigate} />
    </AppLayout>
  );
}
