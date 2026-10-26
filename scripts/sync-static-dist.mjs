#!/usr/bin/env node
/**
 * Syncs public static compliance assets (/privacy, /terms, /contact, PWA icons, manifest, sw.js)
 * into frontend/dist AND mirrors frontend/dist -> dist so Firebase Hosting (frontend/dist)
 * and GitHub Actions workflows (dist) receive the exact same production output.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const FRONTEND_DIST = path.join(ROOT, 'frontend', 'dist');
const ROOT_DIST = path.join(ROOT, 'dist');

function copyRecursive(src, dest, skipIndexHtml = false) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skipIndexHtml && entry.name === 'index.html') continue;
    if (entry.name === 'server.js') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath, false);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(FRONTEND_DIST)) {
  console.error('frontend/dist does not exist yet — run vite build first.');
  process.exit(1);
}

// 1. Copy public static compliance routes & PWA assets into frontend/dist (preserving Vite's index.html)
copyRecursive(PUBLIC_DIR, FRONTEND_DIST, true);

// 2. Mirror frontend/dist -> root dist/ for CI workflows expecting dist/
if (fs.existsSync(ROOT_DIST)) {
  fs.rmSync(ROOT_DIST, { recursive: true, force: true });
}
copyRecursive(FRONTEND_DIST, ROOT_DIST, false);

console.log('✅ Synced static compliance assets into frontend/dist and mirrored to dist/');
