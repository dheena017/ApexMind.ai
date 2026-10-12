import {useCallback, useEffect, useState} from 'react';
import AppLayout from './app/AppLayout';
import AppRouter from './app/AppRouter';
import {APP_ROUTES, parseRoute, routeToPath, type PageRoute} from './app/routes';
import {consoleLogger} from './shared/utils/logger';

export default function App() {
  const [activePage, setActivePage] = useState<PageRoute>(() => {
    const initialRoute = typeof window === 'undefined'
      ? 'landing'
      : parseRoute(window.location.pathname);
    consoleLogger.info('Router', `Initial application mount on route: "${initialRoute}"`);
    return initialRoute;
  });

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
    const targetRoute = APP_ROUTES.find((route) => route.id === page)?.id ?? '404';
    const targetPath = routeToPath(targetRoute);

    setActivePage((currentRoute) => {
      if (currentRoute !== targetRoute) {
        consoleLogger.nav(currentRoute, targetRoute);
      }
      return targetRoute;
    });

    if (window.location.pathname !== targetPath) {
      window.history.pushState({page: targetRoute}, '', targetPath);
    }
  }, []);

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate}>
      <AppRouter activePage={activePage} onNavigate={handleNavigate} />
    </AppLayout>
  );
}
