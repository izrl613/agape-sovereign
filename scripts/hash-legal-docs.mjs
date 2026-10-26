#!/usr/bin/env node
/**
 * Recompute the integrity identifiers for the published legal PDFs.
 *
 * Run after replacing either document:
 *   node scripts/hash-legal-docs.mjs           # print the new digests
 *   node scripts/hash-legal-docs.mjs --write   # rewrite documentIds.ts
 *
 * The page footer shows these digests, so a reader can confirm that the file
 * they downloaded is byte-identical to the file this repository publishes.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IDS_FILE = path.join(ROOT, 'frontend/content/legal/documentIds.ts');

const DOCS = [
  { key: 'terms', file: 'frontend/public/terms/TERMS.pdf', label: 'TERMS.PDF', href: '/terms/TERMS.pdf' },
  { key: 'privacy', file: 'frontend/public/privacy/PRIVACY.pdf', label: 'PRIVACY.PDF', href: '/privacy/PRIVACY.pdf' },
];

const results = [];
for (const doc of DOCS) {
  const abs = path.join(ROOT, doc.file);
  if (!existsSync(abs)) {
    console.error(`✗ missing ${doc.file}`);
    process.exit(1);
  }
  const bytes = readFileSync(abs);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  results.push({ ...doc, bytes: bytes.length, sha256 });
  console.log(`${doc.label.padEnd(13)} ${String(bytes.length).padStart(9)} bytes  ${sha256}`);
}

// Manifest digest: the pair, in document order (terms then privacy).
const manifest = createHash('sha256')
  .update(results.map((r) => r.sha256).join(''))
  .digest('hex');
console.log(`${'MANIFEST'.padEnd(13)} ${''.padStart(9)}         ${manifest}`);

if (process.argv.includes('--write')) {
  let src = readFileSync(IDS_FILE, 'utf8');
  for (const r of results) {
    const re = new RegExp(
      `(href: '${r.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}',\\n\\s*label: '${r.label}',\\n\\s*bytes: )\\d+(,\\n\\s*sha256: ')[0-9a-f]{64}(')`,
    );
    if (!re.test(src)) {
      console.error(`✗ could not find the ${r.label} entry in documentIds.ts`);
      process.exit(1);
    }
    src = src.replace(re, `$1${r.bytes}$2${r.sha256}$3`);
  }
  src = src.replace(/export const LEGAL_MANIFEST_SHA256 =\n  '[0-9a-f]{64}';/, `export const LEGAL_MANIFEST_SHA256 =\n  '${manifest}';`);
  writeFileSync(IDS_FILE, src);
  console.log(`✓ wrote ${path.relative(ROOT, IDS_FILE)}`);
  // The static landing/login footers embed the manifest digest as a literal.
  console.log('  remember: landing + login footers embed the manifest digest — update those literals too.');
} else {
  console.log('\n(dry run — pass --write to update documentIds.ts)');
}
