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

createRoot(rootElement, {

  onRecoverableError(error, errorInfo) {
    console.error('ApexMind recovered from a rendering error.', error, errorInfo.componentStack);
  },
}).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
