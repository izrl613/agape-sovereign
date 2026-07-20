/**
 * Agape Sovereign PWA — Service Worker
 *
 * Strategy:
 *   - Architect AI /api/mcp/** → NETWORK ONLY (never cached — SSE + AI responses change each call)
 *   - Local dev Ollama direct traffic → NETWORK ONLY
 *   - LM Studio API (localhost:1234) → NETWORK ONLY
 *   - App shell + assets → Cache-First (offline PWA shell)
 *   - Firebase / GCP → Network-First with stale fallback
 *   - Background Sync → queue failed POST requests for replay on reconnect
 *
 * Offline mandate (Operation Framework §41):
 *   "All Agents must persist their execution state to a local cache-first
 *    layer, allowing the session to resume gracefully upon re-connection."
 */

const CACHE_VERSION = "3";
const CACHE_NAME = `agape-sovereign-v${CACHE_VERSION}`;
const OFFLINE_FALLBACK = "/index.html";
const SYNC_TAG = "agape-pipeline-sync";

// Patterns that must never be cached (AI responses, SSE streams, local LLM APIs)
const NO_CACHE_PATTERNS = [
  "/api/mcp",          // Architect AI MCP server (prod: Cloud Run via Firebase rewrite)
  "127.0.0.1:3001",   // local dev MCP server
  "localhost:3001",
  "127.0.0.1:11434",  // Ollama direct (local dev only)
  "localhost:11434",
  "127.0.0.1:1234",   // LM Studio local API server
  "localhost:1234",
];

// App shell files to cache for offline support
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// IndexedDB helper — persists pipeline job queue for background sync
const DB_NAME = "agape-sovereign-sync";
const DB_STORE = "pending-jobs";

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(DB_STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function enqueueJob(job) {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const req = tx.objectStore(DB_STORE).add({ ...job, queuedAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dequeueAllJobs() {
  const db = await openSyncDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const all = store.getAll();
    all.onsuccess = () => {
      store.clear();
      resolve(all.result);
    };
    all.onerror = () => reject(all.error);
  });
}

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Architect AI / local Ollama — always go to network, never cache
  const isAiTraffic = NO_CACHE_PATTERNS.some(
    (p) => request.url.includes(p)
  );
  if (isAiTraffic) {
    event.respondWith(fetch(request));
    return;
  }

  // 2. SSE streams — network only (caching SSE breaks the stream)
  if (request.headers.get("Accept")?.includes("text/event-stream")) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Non-GET — network only, queue for background sync on failure
  if (request.method !== "GET") {
    event.respondWith(
      fetch(request).catch(async (err) => {
        // Queue pipeline POSTs for background sync replay when back online
        if (
          request.url.includes("/api/pipeline") ||
          request.url.includes("/sovereignPipeline")
        ) {
          try {
            const body = await request.clone().text();
            await enqueueJob({ url: request.url, method: request.method, body });
            self.registration.sync?.register(SYNC_TAG).catch(() => {});
          } catch (_) {}
          return new Response(
            JSON.stringify({ queued: true, message: "Job queued for background sync" }),
            { status: 202, headers: { "Content-Type": "application/json" } }
          );
        }
        throw err;
      })
    );
    return;
  }

  // 4. Navigation requests (HTML pages) — network-first, fallback to shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_FALLBACK).then(
          (r) => r ?? new Response("Offline", { status: 503 })
        )
      )
    );
    return;
  }

  // 5. Static assets (JS/CSS/fonts/images) — cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const toCache = response.clone();
              caches.open(CACHE_NAME).then((c) => c.put(request, toCache));
            }
            return response;
          })
      )
    );
    return;
  }

  // 6. Everything else — network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then(
      (r) => r ?? new Response("Offline", { status: 503 })
    ))
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueuedJobs());
  }
});

async function replayQueuedJobs() {
  let jobs;
  try {
    jobs = await dequeueAllJobs();
  } catch (_) {
    return;
  }
  const failed = [];
  for (const job of jobs) {
    try {
      const resp = await fetch(job.url, {
        method: job.method,
        headers: { "Content-Type": "application/json" },
        body: job.body,
      });
      if (!resp.ok) failed.push(job);
    } catch (_) {
      failed.push(job);
    }
  }
  // Re-queue any that still failed
  if (failed.length > 0) {
    const db = await openSyncDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    for (const job of failed) store.add(job);
  }
}

// ── Message handler — client-requested cache clear ────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_CACHE") {
    caches.delete(CACHE_NAME);
  }
});
