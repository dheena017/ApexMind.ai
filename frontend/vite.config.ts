import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {createLogger, defineConfig, loadEnv} from 'vite';

const frontendRoot = import.meta.dirname;
const projectRoot = resolve(frontendRoot, '..');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, projectRoot, '');
  const disableHmr = env.DISABLE_HMR === 'true';
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:8000';

  const customLogger = createLogger();
  const originalError = customLogger.error.bind(customLogger);
  let warnedBackendOffline = false;

  customLogger.error = (msg, options) => {
    if (msg.includes('http proxy error') && (msg.includes('ECONNREFUSED') || msg.includes('127.0.0.1:8000'))) {
      if (!warnedBackendOffline) {
        warnedBackendOffline = true;
        customLogger.info(
          '\x1b[33m[ApexMind Notice]\x1b[0m FastAPI backend offline at http://127.0.0.1:8000. ' +
          'Run with \x1b[36m--with-backend\x1b[0m or \x1b[36mnpm run dev\x1b[0m to enable backend APIs.'
        );
      }
      return;
    }
    originalError(msg, options);
  };

  const apiProxy = {
    '/api': {
      target: backendUrl,
      changeOrigin: true,
      configure: (proxy: any) => {
        proxy.on('error', (_err: any, _req: any, res: any) => {
          if (res && 'writeHead' in res && !res.headersSent) {
            res.writeHead(503, {'Content-Type': 'application/json'});
            res.end(
              JSON.stringify({
                status: 'error',
                error: 'Backend Service Offline',
                message: `FastAPI backend is offline at ${backendUrl}. Start it with 'npm run dev' or 'python script/frontend.py --with-backend'.`,
              })
            );
          }
        });
      },
    },
  };

  return {
    root: frontendRoot,
    envDir: projectRoot,
    customLogger,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@/src': resolve(frontendRoot, 'src'),
        '@': resolve(frontendRoot, 'src'),
      },
    },
    server: {
      strictPort: true,
      proxy: apiProxy,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: !disableHmr,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: disableHmr ? null : {},
    },
    preview: {
      strictPort: true,
      proxy: apiProxy,
    },
  };
});

