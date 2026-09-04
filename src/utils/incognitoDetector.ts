/**
 * incognitoDetector.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Heuristic private-browsing (incognito) detection.
 *
 * We combine three independent signals because no single method is universal:
 *
 *  1. StorageManager quota — In Chrome/Edge incognito the storage quota is
 *     capped at ~120 MB regardless of device. In normal mode it scales with
 *     available disk space (typically > 1 GB).
 *
 *  2. FileSystem Access / webkitRequestFileSystem — blocked outright in
 *     Chrome's incognito mode (throws DOMException or calls error callback).
 *
 *  3. IndexedDB write probe — Safari's private mode throws when you try to
 *     open or write to IDB; Firefox private mode similarly restricts storage.
 *
 * Returns a best-effort confidence level: 'private' | 'normal' | 'unknown'.
 * Callers should treat 'unknown' like 'normal' for UX (don't block users).
 */

export type PrivacyMode = 'private' | 'normal' | 'unknown';

interface Detection {
  mode: PrivacyMode;
  confidence: number; // 0–1
  signals: Record<string, boolean | null>;
}

// ── Signal 1: StorageManager quota (Chrome/Edge) ─────────────────────────────
async function probeManagedStorageQuota(): Promise<boolean | null> {
  try {
    if (!navigator?.storage?.estimate) return null;
    const { quota } = await navigator.storage.estimate();
    // Normal mode: > 500 MB; Incognito Chrome: ≤ 120 MB
    return typeof quota === 'number' && quota < 125 * 1024 * 1024;
  } catch {
    return null;
  }
}

// ── Signal 2: FileSystem Access (Chrome ≤ 109 legacy API) ────────────────────
async function probeFileSystemAccess(): Promise<boolean | null> {
  return new Promise((resolve) => {
    if (!('webkitRequestFileSystem' in window)) {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 500);
    (window as any).webkitRequestFileSystem(
      (window as any).TEMPORARY,
      1,
      () => { clearTimeout(timer); resolve(false); },
      () => { clearTimeout(timer); resolve(true); }
    );
  });
}

// ── Signal 3: IndexedDB probe (Safari / Firefox private) ─────────────────────
async function probeIndexedDB(): Promise<boolean | null> {
  return new Promise((resolve) => {
    try {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      const dbName = `__sovereign_probe_${Date.now()}`;
      const timer = setTimeout(() => resolve(null), 800);
      const req = window.indexedDB.open(dbName, 1);

      req.onerror = () => {
        clearTimeout(timer);
        resolve(true); // blocked = private
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        req.result.close();
        // Clean up
        try { window.indexedDB.deleteDatabase(dbName); } catch { /* noop */ }
        resolve(false);
      };
    } catch {
      resolve(true);
    }
  });
}

// ── Signal 4: sessionStorage vs localStorage persistence gap ─────────────────
function probeLocalStoragePersistence(): boolean | null {
  try {
    const key = `__sovereign_ls_probe__`;
    localStorage.setItem(key, '1');
    const exists = localStorage.getItem(key) === '1';
    localStorage.removeItem(key);
    return !exists; // if can't write, probably private
  } catch {
    return true; // blocked = private (Safari strict mode)
  }
}

// ── Aggregate ─────────────────────────────────────────────────────────────────
export async function detectPrivacyMode(): Promise<Detection> {
  const [quota, fs, idb] = await Promise.all([
    probeManagedStorageQuota(),
    probeFileSystemAccess(),
    probeIndexedDB(),
  ]);
  const ls = probeLocalStoragePersistence();

  const signals = { smallQuota: quota, fileSystemBlocked: fs, idbBlocked: idb, localStorageBlocked: ls };

  // Count definitive positive signals
  const positives = Object.values(signals).filter(v => v === true).length;
  const measured  = Object.values(signals).filter(v => v !== null).length;

  if (measured === 0) {
    return { mode: 'unknown', confidence: 0, signals };
  }

  const ratio = positives / measured;

  if (positives >= 2 || ratio >= 0.5) {
    return { mode: 'private', confidence: Math.min(0.95, ratio + 0.1), signals };
  }
  if (positives === 0) {
    return { mode: 'normal', confidence: 0.9, signals };
  }
  return { mode: 'unknown', confidence: 0.5, signals };
}

// ── Quick boolean (cached) ────────────────────────────────────────────────────
let _cachedMode: PrivacyMode | null = null;

export async function isPrivateBrowsing(): Promise<boolean> {
  if (_cachedMode !== null) return _cachedMode === 'private';
  const result = await detectPrivacyMode();
  _cachedMode = result.mode;
  return result.mode === 'private';
}

export function resetCache() {
  _cachedMode = null;
}
