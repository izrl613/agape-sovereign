import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

export default defineConfig(() => {
  return {
    plugins: [dyadComponentTagger(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // The app entry is /src/main.tsx. The legacy `frontend/` folder is not part
    // of the app graph — keep Vite's dependency scan on the real entry.
    optimizeDeps: {
      entries: ['index.html', 'src/main.tsx'],
    },
    server: {
      // Bind on all interfaces so the app is reachable through the preview
      // proxy host, and accept any Host header (dev server only).
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/mcp': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          ws: true,
        },
        '/api': 'http://127.0.0.1:5002',
      },
    },
  };
});
