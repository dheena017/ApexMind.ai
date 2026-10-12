import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {defineConfig, loadEnv} from 'vite';

const frontendRoot = import.meta.dirname;
const projectRoot = resolve(frontendRoot, '..');

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, projectRoot, '');
  const disableHmr = env.DISABLE_HMR === 'true';
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:8000';
  const apiProxy = {
    '/api': {
      target: backendUrl,
      changeOrigin: true,
    },
  };

  return {
    root: frontendRoot,
    envDir: projectRoot,
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
