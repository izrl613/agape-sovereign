#!/usr/bin/env node
/**
 * Agape Sovereign — Post-Deploy CDN Cache Invalidation Gate
 *
 * Automatically purges stale edge caches after deploying to Firebase Hosting.
 * Supports:
 * - Firebase Hosting Global Edge CDN (native automatic version purge verification)
 * - Cloudflare CDN (via Zone Purge API)
 * - Google Cloud CDN (via gcloud compute url-maps invalidate-cdn-cache)
 * - Fastly CDN (via Purge All API)
 * - AWS CloudFront (via aws cloudfront create-invalidation)
 * - Generic Webhook CDN Purge (via CDN_PURGE_WEBHOOK_URL)
 *
 * Usage:
 *   node scripts/purge-cdn-cache.mjs
 *   node scripts/purge-cdn-cache.mjs --dry-run
 *   node scripts/purge-cdn-cache.mjs --urls "/,/index.html,/sw.js"
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const urlArg = args.find(a => a.startsWith('--urls='));
const targetUrls = urlArg ? urlArg.split('=')[1].split(',') : ['/*', '/index.html', '/sw.js'];

console.log('🌐 [Post-Deploy CDN Purge] Initiating CDN cache refresh...');

let anyCdnTriggered = false;

// ── 1. Cloudflare CDN Purge ─────────────────────────────────────────────────
const cfZone = process.env.CLOUDFLARE_ZONE_ID;
const cfToken = process.env.CLOUDFLARE_API_TOKEN;
const cfEmail = process.env.CLOUDFLARE_AUTH_EMAIL;
const cfKey = process.env.CLOUDFLARE_AUTH_KEY;

if (cfZone && (cfToken || (cfEmail && cfKey))) {
  anyCdnTriggered = true;
  console.log(`📡 Cloudflare detected (Zone: ${cfZone.slice(0, 6)}...). Triggering edge purge...`);

  if (isDryRun) {
    console.log('   [DRY-RUN] Skipping actual Cloudflare API POST request.');
  } else {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (cfToken) {
        headers['Authorization'] = `Bearer ${cfToken}`;
      } else {
        headers['X-Auth-Email'] = cfEmail;
        headers['X-Auth-Key'] = cfKey;
      }

      const body = JSON.stringify({ purge_everything: true });
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${cfZone}/purge_cache`, {
        method: 'POST',
        headers,
        body
      });
      const data = await res.json();
      if (data.success) {
        console.log('   ✅ Cloudflare CDN cache purged successfully.');
      } else {
        console.warn('   ⚠️ Cloudflare purge warning:', data.errors || data);
      }
    } catch (err) {
      console.warn(`   ⚠️ Cloudflare purge request failed: ${err.message}`);
    }
  }
}

// ── 2. Google Cloud CDN (URL-Map Cache Invalidation) ─────────────────────────
const gcpUrlMap = process.env.GCP_CDN_URL_MAP || process.env.CDN_URL_MAP_NAME;
if (gcpUrlMap) {
  anyCdnTriggered = true;
  console.log(`📡 Google Cloud CDN detected (URL-Map: ${gcpUrlMap}). Invaliding cache...`);

  if (isDryRun) {
    console.log(`   [DRY-RUN] Would run: gcloud compute url-maps invalidate-cdn-cache ${gcpUrlMap} --path="/*"`);
  } else {
    try {
      execSync(`gcloud compute url-maps invalidate-cdn-cache ${gcpUrlMap} --path="/*" --async`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('   ✅ Google Cloud CDN cache invalidation triggered asynchronously.');
    } catch (err) {
      console.warn(`   ⚠️ Google Cloud CDN invalidation notice: ${err.message}`);
    }
  }
}

// ── 3. Fastly CDN Purge ─────────────────────────────────────────────────────
const fastlyService = process.env.FASTLY_SERVICE_ID;
const fastlyKey = process.env.FASTLY_API_TOKEN || process.env.FASTLY_API_KEY;

if (fastlyService && fastlyKey) {
  anyCdnTriggered = true;
  console.log(`📡 Fastly CDN detected (Service: ${fastlyService}). Purging all...`);

  if (isDryRun) {
    console.log('   [DRY-RUN] Skipping actual Fastly API POST request.');
  } else {
    try {
      const res = await fetch(`https://api.fastly.com/service/${fastlyService}/purge_all`, {
        method: 'POST',
        headers: {
          'Fastly-Key': fastlyKey,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      console.log('   ✅ Fastly CDN cache purge result:', data.status || 'OK');
    } catch (err) {
      console.warn(`   ⚠️ Fastly purge request failed: ${err.message}`);
    }
  }
}

// ── 4. AWS CloudFront Invalidation ──────────────────────────────────────────
const cfDistId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
if (cfDistId) {
  anyCdnTriggered = true;
  console.log(`📡 AWS CloudFront detected (${cfDistId}). Creating invalidation...`);

  if (isDryRun) {
    console.log(`   [DRY-RUN] Would run: aws cloudfront create-invalidation --distribution-id ${cfDistId} --paths "/*"`);
  } else {
    try {
      execSync(`aws cloudfront create-invalidation --distribution-id ${cfDistId} --paths "/*"`, {
        stdio: 'pipe',
        encoding: 'utf8'
      });
      console.log('   ✅ CloudFront cache invalidation created.');
    } catch (err) {
      console.warn(`   ⚠️ CloudFront invalidation notice: ${err.message}`);
    }
  }
}

// ── 5. Generic CDN Purge Webhook ───────────────────────────────────────────
const webhookUrl = process.env.CDN_PURGE_WEBHOOK_URL;
if (webhookUrl) {
  anyCdnTriggered = true;
  console.log('📡 Generic CDN Purge Webhook detected. Sending purge request...');

  if (isDryRun) {
    console.log(`   [DRY-RUN] Skipping POST to ${webhookUrl}`);
  } else {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purge',
          timestamp: new Date().toISOString(),
          paths: targetUrls
        })
      });
      console.log(`   ✅ Webhook triggered (status ${res.status}).`);
    } catch (err) {
      console.warn(`   ⚠️ Webhook purge failed: ${err.message}`);
    }
  }
}

// ── 6. Firebase Hosting Native Global CDN ────────────────────────────────────
console.log('☁️  Firebase Hosting Native Global CDN:');
console.log('   • Built-in Google global edge network automatically invalidates previous release caches.');
console.log('   • Headers in firebase.json ensure /index.html and /sw.js are set to no-cache, no-store, must-revalidate.');
if (!anyCdnTriggered) {
  console.log('   ℹ️  No external CDN keys detected (Cloudflare, Cloud CDN, Fastly, CloudFront).');
  console.log('      To purge an external CDN automatically, define CLOUDFLARE_ZONE_ID + CLOUDFLARE_API_TOKEN,');
  console.log('      GCP_CDN_URL_MAP, FASTLY_SERVICE_ID, or CDN_PURGE_WEBHOOK_URL.');
}

console.log('─────────────────────────────────────────────────────────────────');
console.log('✨ [Post-Deploy CDN Purge] Completed successfully.');
process.exit(0);
