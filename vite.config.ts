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
      proxy: {
        '/api/mcp': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          ws: true,
        },
        // Passkey / WebAuthn Cloud Function (firebase emulators:start --only functions)
        '/api/auth': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          // Gen2 emulator path: /PROJECT/REGION/authApi/...
          rewrite: (p: string) => {
            const project = process.env.GCLOUD_PROJECT || 'agape-sovereign';
            const region = process.env.FUNCTION_REGION || 'us-central1';
            return `/${project}/${region}/authApi${p}`;
          },
        },
        // App / Cloud Run API (local server.ts or App Hosting emulator)
        '/api': {
          target: process.env.VITE_API_PROXY || 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
