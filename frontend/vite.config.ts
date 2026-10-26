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
      // Local development against the Firebase emulator suite
      // (`firebase emulators:start`); production uses Hosting rewrites.
      '/api/auth': 'http://localhost:5001/agape-sovereign/us-central1',
      '/api/architect': 'http://localhost:5001/agape-sovereign/us-central1',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
