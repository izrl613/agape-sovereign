import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    fs: { allow: ['..'] }, // import ../firebase-applet-config.json (single source)
    proxy: {
      // Emulator functions are at /PROJECT/REGION/FUNCTION/path.
      '/api/auth': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (p) => `/agape-sovereign/us-central1/authApi${p}`,
      },
      '/api/architect': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (p) => `/agape-sovereign/us-central1/architectApi${p}`,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
