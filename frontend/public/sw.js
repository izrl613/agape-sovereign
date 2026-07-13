/**
 * Agape Sovereign PWA — Service Worker
 *
 * Strategy:
 *   - Architect AI /api/mcp/** → NETWORK ONLY (never cached — SSE + AI responses change each call)
 *   - Local dev Ollama direct traffic → NETWORK ONLY
 *   - App shell + assets → Cache-First (offline PWA shell)
 *   - Firebase / GCP → Network-First with stale fallback
 */

const CACHE_NAME = "agape-sovereign-v2";
const OFFLINE_FALLBACK = "/index.html";

// Patterns that must never be cached (AI responses, SSE streams, local Ollama)
const NO_CACHE_PATTERNS = [
  "/api/mcp",          // Architect AI MCP server (prod: Cloud Run via Firebase rewrite)
  "127.0.0.1:3001",   // local dev MCP server
  "localhost:3001",
  "127.0.0.1:11434",  // Ollama direct (local dev only)
  "localhost:11434",
];

// App shell files to cache for offline support
const PRECACHE_URLS = [
  "/",
  "/index.html",
];

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

  // 3. Non-GET — network only
  if (request.method !== "GET") {
    event.respondWith(fetch(request));
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
