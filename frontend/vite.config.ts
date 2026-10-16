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
        proxy.on('error', (_err: any, req: any, res: any) => {
          const method = (req?.method || 'GET').toUpperCase();
          const url = req?.url || '';
          console.log(`[APEX_LOG] WARN|Frontend|Backend proxy error on ${method} ${url} | Backend unreachable at ${backendUrl}`);
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

  const apexLoggerPlugin = () => ({
    name: 'apexmind-terminal-logger',
    configureServer(server: any) {
      const handleLog = (data: any) => {
        if (!data || !data.module) return;
        const level = data.level || 'INFO';
        const mod = data.module;
        const msg = data.message || '';
        console.log(`[APEX_LOG] ${level}|${mod}|${msg}`);
      };

      server.ws?.on('apexmind:client-log', handleLog);
      server.hot?.on('apexmind:client-log', handleLog);

      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/__apex_client_log' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              handleLog(data);
            } catch {
              // ignore parse errors
            }
            res.statusCode = 204;
            res.end();
          });
          return;
        }
        next();
      });
    },
  });

  return {
    root: frontendRoot,
    envDir: projectRoot,
    customLogger,
    plugins: [react(), tailwindcss(), apexLoggerPlugin()],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || ''
      ),
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || env.BACKEND_URL || ''
      ),
    },
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

