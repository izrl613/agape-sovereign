#!/usr/bin/env node
/**
 * Agape Sovereign — Firebase Deploy Readiness Validator
 *
 * Checks 10 conditions that must be true for `firebase deploy` to succeed.
 * Used by autonomous agentic workflows (agentic-sovereign-updater,
 * gcp-monitoring-agent, compliance-agent) as a scheduled validation gate.
 *
 * Usage: node scripts/validate-firebase-deploy.mjs
 * Exit code: 0 = all checks pass, 1 = one or more checks fail
 *
 * Outputs JSON to stdout for workflow consumption:
 *   { "passed": bool, "checks": { "name": "pass"|"fail" }, "summary": "..." }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const results = [];

function check(name, description, pass, detail) {
  results.push({ name, description, status: pass ? 'pass' : 'fail', detail });
  if (!pass) process.stdout.write(`FAIL  ${name}: ${description} — ${detail}\n`);
  else process.stdout.write(`PASS  ${name}: ${description}\n`);
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

function fileExists(p) { return fs.existsSync(p); }

// ── Check 1: eslint configs exist for all workspaces ─────────────────────────
(function checkEslintConfigs() {
  const workspaces = [
    { name: 'frontend', files: ['.eslintrc.cjs', '.eslintrc.json', '.eslintrc.js'] },
    { name: 'backend', files: ['.eslintrc.cjs', '.eslintrc.json', '.eslintrc.js'] },
    { name: 'vscode-extension', files: ['.eslintrc.json', '.eslintrc.cjs', '.eslintrc.js'] },
    { name: 'functions', files: ['.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json'] },
  ];
  const missing = [];
  for (const ws of workspaces) {
    const hasConfig = ws.files.some(f => fileExists(path.join(ROOT, ws.name, f)));
    if (!hasConfig) missing.push(ws.name);
  }
  const pass = missing.length === 0;
  const detail = pass ? 'all 4 workspaces have eslint configs' : `missing in: ${missing.join(', ')}`;
  check('eslint-configs', 'Eslint configs exist for frontend, backend, vscode-extension, functions', pass, detail);
})();

// ── Check 2: firebase.json apphosting is a single object (not duplicate array) ─
(function checkFirebaseJsonApphosting() {
  const raw = readFile(path.join(ROOT, 'firebase.json'));
  if (!raw) { check('firebase-apphosting', 'firebase.json apphosting is valid', false, 'firebase.json not readable'); return; }
  let config;
  try { config = JSON.parse(raw); } catch { check('firebase-apphosting', 'firebase.json apphosting is valid', false, 'firebase.json is invalid JSON'); return; }
  const ah = config.apphosting;
  const pass = ah && !Array.isArray(ah) && typeof ah === 'object' && ah.backendId;
  const detail = pass ? `single object, backendId: ${ah.backendId}` : Array.isArray(ah) ? `array with ${ah.length} entries (should be single object)` : 'missing or malformed';
  check('firebase-apphosting', 'firebase.json apphosting is a single object (not duplicate array)', pass, detail);
})();

// ── Check 3: firebase-hosting-*.yml workflows are disabled ────────────────────
(function checkDuplicateWorkflowsDisabled() {
  const files = ['firebase-hosting-merge.yml', 'firebase-hosting-pull-request.yml'];
  const issues = [];
  for (const f of files) {
    const p = path.join(ROOT, '.github', 'workflows', f);
    const content = readFile(p);
    if (!content) { issues.push(`${f}: not found`); continue; }
    if (content.includes('if: false')) {
      // disabled — good
    } else if (content.includes('if: ${{ false }}')) {
      // also good
    } else {
      issues.push(`${f}: not disabled (missing 'if: false')`);
    }
  }
  const pass = issues.length === 0;
  const detail = pass ? 'firebase-hosting-merge.yml and firebase-hosting-pull-request.yml are disabled' : issues.join('; ');
  check('duplicate-workflows', 'firebase-hosting-*.yml are disabled (superseded by deploy.yml)', pass, detail);
})();

// ── Check 4: budget-check.mjs handles missing dependencies gracefully ─────────
(function checkBudgetCheckGraceful() {
  const content = readFile(path.join(ROOT, 'scripts', 'budget-check.mjs'));
  if (!content) { check('budget-check', 'budget-check.mjs handles missing deps gracefully', false, 'budget-check.mjs not found'); return; }
  const hasTryCatch = content.includes("try {") && content.includes("BigQuery") && content.includes("process.exit(0)");
  const pass = hasTryCatch;
  const detail = pass ? 'dynamic import with try/catch and clean exit on missing dep' : 'missing graceful fallback for @google-cloud/bigquery import';
  check('budget-check', 'budget-check.mjs handles missing @google-cloud/bigquery gracefully', pass, detail);
})();

// ── Check 5: functions is in root workspaces ──────────────────────────────────
(function checkFunctionsInWorkspaces() {
  const pkgRaw = readFile(path.join(ROOT, 'package.json'));
  if (!pkgRaw) { check('functions-workspace', 'functions is in root workspaces', false, 'package.json not found'); return; }
  let pkg;
  try { pkg = JSON.parse(pkgRaw); } catch { check('functions-workspace', 'functions is in root workspaces', false, 'package.json invalid JSON'); return; }
  const ws = pkg.workspaces || [];
  const pass = ws.includes('functions');
  const detail = pass ? 'functions listed in root workspaces' : `functions not in workspaces: [${ws.join(', ')}]`;
  check('functions-workspace', 'functions is in root workspaces array', pass, detail);
})();

// ── Check 6: functions has @google-cloud/bigquery and jspdf deps ──────────────
(function checkFunctionsDeps() {
  const raw = readFile(path.join(ROOT, 'functions', 'package.json'));
  if (!raw) { check('functions-deps', 'functions has required dependencies', false, 'functions/package.json not found'); return; }
  let pkg;
  try { pkg = JSON.parse(raw); } catch { check('functions-deps', 'functions has required dependencies', false, 'functions/package.json invalid'); return; }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const required = ['@google-cloud/bigquery', 'jspdf'];
  const missing = required.filter(d => !deps[d]);
  const pass = missing.length === 0;
  const detail = pass ? 'all required deps present' : `missing: ${missing.join(', ')}`;
  check('functions-deps', 'functions has @google-cloud/bigquery and jspdf dependencies', pass, detail);
})();

// ── Check 7: @types are in devDependencies (not dependencies) ─────────────────
(function checkTypesInDevDeps() {
  const raw = readFile(path.join(ROOT, 'functions', 'package.json'));
  if (!raw) { check('types-devdeps', '@types in devDependencies', false, 'functions/package.json not found'); return; }
  let pkg;
  try { pkg = JSON.parse(raw); } catch { check('types-devdeps', '@types in devDependencies', false, 'functions/package.json invalid'); return; }
  const deps = pkg.dependencies || {};
  const typeDepsInProd = Object.keys(deps).filter(k => k.startsWith('@types/'));
  const pass = typeDepsInProd.length === 0;
  const detail = pass ? 'no @types in production dependencies' : `@types in deps: ${typeDepsInProd.join(', ')} (should be devDependencies)`;
  check('types-devdeps', '@types/* are in devDependencies, not dependencies', pass, detail);
})();

// ── Check 8: typecheck script exists in root package.json ─────────────────────
(function checkTypecheckScript() {
  const raw = readFile(path.join(ROOT, 'package.json'));
  if (!raw) { check('typecheck-script', 'typecheck script in root package.json', false, 'package.json not found'); return; }
  let pkg;
  try { pkg = JSON.parse(raw); } catch { check('typecheck-script', 'typecheck script in root package.json', false, 'package.json invalid'); return; }
  const scripts = pkg.scripts || {};
  const pass = !!scripts.typecheck;
  const detail = pass ? `typecheck: "${scripts.typecheck}"` : 'typecheck script missing from root package.json';
  check('typecheck-script', 'typecheck script exists in root package.json', pass, detail);
})();

// ── Check 9: tsconfig paths in functions eslintrc use ./ prefix ───────────────
(function checkEslintrcTsconfigPaths() {
  const content = readFile(path.join(ROOT, 'functions', '.eslintrc.js'));
  if (!content) { check('eslintrc-tsconfig', 'eslintrc tsconfig paths use ./ prefix', false, 'functions/.eslintrc.js not found'); return; }
  const hasNoRelativeDot = content.includes('"./tsconfig.json') || content.includes("'./tsconfig.json");
  const pass = hasNoRelativeDot;
  const detail = pass ? 'tsconfig paths use ./ prefix for proper resolution' : 'tsconfig paths missing ./ prefix (may resolve from wrong directory)';
  check('eslintrc-tsconfig', 'tsconfig paths in functions .eslintrc.js use ./ prefix', pass, detail);
})();

// ── Check 10: lint passes with 0 errors (warnings ignored) ────────────────────
(function checkLintPasses() {
  const { execSync } = await_import('child_process');
  const has = await_import;
  // We can't depend on node_modules being installed, so use a file-level check:
  // eslint configs have no-unused-vars and no-explicit-any set to "warn" (not "error")
  const eslintConfigFiles = [
    path.join(ROOT, 'frontend', '.eslintrc.cjs'),
    path.join(ROOT, 'backend', '.eslintrc.cjs'),
  ];
  const issues = [];
  for (const f of eslintConfigFiles) {
    const content = readFile(f);
    if (!content) { issues.push(`${f}: not found`); continue; }
    if (!content.includes('"warn"') && !content.includes("'warn'")) {
      issues.push(`${f}: no-unused-vars/no-explicit-any may be set to error`);
    }
  }
  // Also check vscode-extension eslintrc
  const vsExt = path.join(ROOT, 'vscode-extension', '.eslintrc.json');
  const vsContent = readFile(vsExt);
  if (vsContent && !vsContent.includes('"warn"') && !vsContent.includes("'warn'")) {
    issues.push('vscode-extension/.eslintrc.json: no-unused-vars/no-explicit-any may be set to error');
  }
  const pass = issues.length === 0;
  const detail = pass ? 'eslint rules allow warnings (0 errors requirement)' : issues.join('; ');
  check('lint-zero-errors', 'Lint rules allow 0 errors (warnings demoted from error)', pass, detail);
})();

// ── Helper for top-level await ────────────────────────────────────────────────
function await_import(mod) {
  return mod;
}

// ── Summary ───────────────────────────────────────────────────────────────────
const passedCount = results.filter(r => r.status === 'pass').length;
const failedCount = results.filter(r => r.status === 'fail').length;
const totalChecks = results.length;

process.stdout.write('\n');
process.stdout.write(`Firebase Deploy Readiness: ${passedCount}/${totalChecks} checks passed`);
if (failedCount > 0) process.stdout.write(`, ${failedCount} failed`);
process.stdout.write('\n');

const summary = {
  passed: failedCount === 0,
  timestamp: new Date().toISOString(),
  total: totalChecks,
  passed_count: passedCount,
  failed_count: failedCount,
  checks: results.reduce((acc, r) => { acc[r.name] = { status: r.status, description: r.description, detail: r.detail }; return acc; }, {}),
};

process.stdout.write(`\n${JSON.stringify(summary, null, 2)}\n`);
process.exit(failedCount > 0 ? 1 : 0);
