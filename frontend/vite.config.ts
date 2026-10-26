import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api/auth': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (p: string) => `/agape-sovereign/us-central1/authApi${p}`,
      },
      '/api/architect': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (p: string) => `/agape-sovereign/us-central1/architectApi${p}`,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase-auth': ['firebase/app', 'firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          'pdf-vendor': ['jspdf'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
  },
});
