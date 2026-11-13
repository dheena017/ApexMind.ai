import {Component, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

type ErrorBoundaryState = {
  hasError: boolean;
};

class AppErrorBoundary extends Component<
  {children: ReactNode},
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {hasError: false};

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ApexMind failed to render.', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 text-[#E5E5E5]"
          role="alert"
        >
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold">ApexMind could not load</h1>
            <p className="mt-3 text-[#A3A3A3]">
              Something went wrong while opening the app. Reload the page to try again.
            </p>
            <button
              className="mt-6 rounded-lg bg-blue-500 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload app
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

import {consoleLogger} from './shared/utils/logger';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ApexMind could not start because the #root element is missing.');
}

consoleLogger.printDevBanner();

// Global API Request/Response Logger Interceptor
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    // Trace application API endpoints (exclude background client log transport)
    if (url.includes('/api/') && !url.includes('/__apex_client_log')) {
      const method = (init?.method || 'GET').toUpperCase();
      consoleLogger.apiSent(method, url);
      const start = performance.now();
      try {
        const response = await originalFetch(input, init);
        const duration = performance.now() - start;
        consoleLogger.apiComing(method, url, response.status, duration);
        return response;
      } catch (err) {
        const duration = performance.now() - start;
        consoleLogger.apiComing(method, url, 0, duration, err);
        throw err;
      }
    }
    return originalFetch(input, init);
  };
}

import { AuthProvider } from './features/auth/context/AuthContext';

const hiddenStatusLabels = [
  'Free',
  'Run Queue',
  'Pinterest Connected',
  'Pinterest: Credentials Active',
  'Manually trigger scheduler to process due jobs',
];

const removeKnownStatusBadges = () => {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('span, div, button, a').forEach((element) => {
    const text = (element.textContent ?? '').trim();
    const title = (element.getAttribute('title') ?? '').trim();
    const ariaLabel = (element.getAttribute('aria-label') ?? '').trim();
    const className = (element.getAttribute('class') ?? '').toLowerCase();

    const shouldRemove = hiddenStatusLabels.some((label) => 
      text === label || title === label || ariaLabel === label || title.includes(label) || ariaLabel.includes(label)
    ) || (
      (text === 'Free' || title === 'Free' || ariaLabel === 'Free') && /emerald-500\/15|text-emerald-400|border-emerald-500\/25|bg-zinc-900\/60|bg-zinc-800/.test(className)
    );

    if (shouldRemove) {
      element.remove();
    }
  });
};

if (typeof window !== 'undefined') {
  const observer = new MutationObserver(() => {
    removeKnownStatusBadges();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  removeKnownStatusBadges();
}

createRoot(rootElement, {

  onRecoverableError(error, errorInfo) {
    console.error('ApexMind recovered from a rendering error.', error, errorInfo.componentStack);
  },
}).render(
  <AppErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppErrorBoundary>,
);

