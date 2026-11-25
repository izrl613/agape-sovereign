import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'lucide-react'],
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
      react: path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'lucide-react': path.resolve(import.meta.dirname, 'node_modules/lucide-react'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    fs: { allow: ['..'] }, // import ../firebase-applet-config.json
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
