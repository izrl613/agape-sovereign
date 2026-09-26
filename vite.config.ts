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
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // Accept the sandbox preview host (e2b proxy) alongside localhost
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
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
