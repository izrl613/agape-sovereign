import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appRoot = fileURLToPath(new URL('./frontend/', import.meta.url));

export default defineConfig({
  root: appRoot,
  base: './',
  plugins: [react()],
  server: { host: '0.0.0.0' },
  build: { outDir: 'dist', emptyOutDir: true },
});
