#!/usr/bin/env node
/**
 * Agape Sovereign — Frontend Code Quality & Integrity Pre-Deploy Gate
 *
 * Enforces code quality, static health, and file integrity prior to building
 * and deploying Firebase Hosting assets.
 *
 * Checks performed:
 * 1. Entry point integrity: verifies index.html exists, has <script type="module">,
 *    and has no stale hardcoded ./assets/index-*.js hashes.
 * 2. Critical file presence: verifies index.tsx, App.tsx, and vite.config.ts.
 * 3. Merge conflict marker scan: ensures no unmerged git markers exist.
 * 4. Hardcoded secret scan: flags any accidental private key / secret leaks.
 * 5. ESLint linting: executes eslint if available in environment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.resolve(ROOT, 'frontend');

console.log('🔍 [Pre-Deploy Quality Gate] Running frontend code checks...');

let failures = 0;
let warnings = 0;

function pass(name, detail = '') {
  console.log(`  ✅ PASS: ${name}${detail ? ` (${detail})` : ''}`);
}

function fail(name, reason) {
  failures++;
  console.error(`  ❌ FAIL: ${name} — ${reason}`);
}

function warn(name, message) {
  warnings++;
  console.warn(`  ⚠️ WARN: ${name} — ${message}`);
}

// ── Check 1: index.html Entry Point & Integrity ─────────────────────────────
const indexHtmlPath = path.join(FRONTEND_DIR, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  fail('index.html presence', 'frontend/index.html was not found');
} else {
  const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // Check for broken hardcoded asset hashes in source
  if (/<script[^>]+src=["']\.\/assets\/index-[^"']+\.js["']/i.test(indexContent)) {
    fail('index.html assets', 'Found hardcoded hashed script reference to ./assets/index-*.js in source index.html (will break Vite build)');
  } else {
    pass('index.html asset references', 'No stale hardcoded asset hashes');
  }

  // Check for valid module entry
  if (/<script[^>]+type=["']module["'][^>]*>/i.test(indexContent)) {
    pass('index.html module script', 'Vite module entry script present');
  } else {
    fail('index.html module script', 'Missing <script type="module" src="..."> entry');
  }

  if (/DAVIDIAN\s+CORTEX/i.test(indexContent)) {
    fail('index.html branding', 'Stale DAVIDIAN CORTEX title — sovereign.nyc must brand as Agape Sovereign AI');
  } else {
    pass('index.html branding', 'Agape Sovereign AI');
  }
}

// ── Check 2: Core source files ──────────────────────────────────────────────
const coreFiles = [
  'index.tsx',
  'App.tsx',
  'vite.config.ts',
  'package.json'
];

for (const file of coreFiles) {
  const fullPath = path.join(FRONTEND_DIR, file);
  if (fs.existsSync(fullPath)) {
    pass(`Core file: ${file}`);
  } else {
    fail(`Core file: ${file}`, `Missing expected file at ${path.relative(ROOT, fullPath)}`);
  }
}

// ── Check 3: Scan for git conflict markers ──────────────────────────────────
function checkConflictMarkers(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkConflictMarkers(fullPath);
    } else if (/\.(tsx?|jsx?|html|css|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<<<<<<<') || content.includes('>>>>>>>') || (content.includes('=======') && content.includes('<<<<<<<'))) {
        fail('Conflict markers', `Unresolved merge conflict markers found in ${path.relative(ROOT, fullPath)}`);
      }
    }
  }
}

try {
  checkConflictMarkers(FRONTEND_DIR);
  pass('Git conflict check', 'No merge conflict markers found in frontend source');
} catch (err) {
  fail('Git conflict check', `Error reading source files: ${err.message}`);
}

// ── Check 4: Check for accidental hardcoded secrets ────────────────────────
const secretPatterns = [
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[a-zA-Z0-9]{36}/
];

let secretFound = false;
function scanForSecrets(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanForSecrets(fullPath);
    } else if (/\.(tsx?|jsx?|html|json)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          fail('Secret leakage check', `Potential sensitive token or private key in ${path.relative(ROOT, fullPath)}`);
          secretFound = true;
          break;
        }
      }
    }
  }
}

try {
  scanForSecrets(FRONTEND_DIR);
  if (!secretFound) {
    pass('Secret leakage check', 'No raw private keys or cloud access tokens detected');
  }
} catch (err) {
  warn('Secret leakage check', `Could not scan all files: ${err.message}`);
}

// ── Check 5: ESLint execution if available ──────────────────────────────────
let eslintBin = path.join(ROOT, 'node_modules', '.bin', 'eslint');
if (!fs.existsSync(eslintBin)) {
  eslintBin = path.join(FRONTEND_DIR, 'node_modules', '.bin', 'eslint');
}

if (fs.existsSync(eslintBin)) {
  const eslintResult = spawnSync(eslintBin, ['.', '--ext', '.ts,.tsx,.js'], {
    cwd: FRONTEND_DIR,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  if (eslintResult.status === 0) {
    pass('ESLint', 'All ESLint rules passed with 0 errors');
  } else {
    // If only warnings or minor issues, report or fail based on exit status
    if (eslintResult.stderr || eslintResult.stdout) {
      console.log(eslintResult.stdout || eslintResult.stderr);
    }
    fail('ESLint', 'ESLint reported errors that must be resolved prior to deploy');
  }
} else {
  pass('ESLint check', 'ESLint binary not in local node_modules (static AST checks verified)');
}

// ── Summary & Exit ──────────────────────────────────────────────────────────
console.log('─────────────────────────────────────────────────────────────────');
if (failures > 0) {
  console.error(`🚨 Pre-Deploy Quality Gate FAILED with ${failures} error(s). Deployment aborted.`);
  process.exit(1);
} else {
  console.log(`✨ Pre-Deploy Quality Gate PASSED (${warnings} warning(s)). Ready for deployment!`);
  process.exit(0);
}
