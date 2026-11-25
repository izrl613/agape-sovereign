export interface VaultReportMetadata {
  id: string;
  uid: string;
  title: string;
  sovereignScore: number;
  hdiScore: number;
  totalNuked: number;
  totalKnoxed: number;
  storageTarget: 'local' | 'drive' | 'download';
  createdAt: string;
  expiresAt: string;
  auditHash: string;
  payloadJson: string;
}

const DB_NAME = 'agape-sovereign-vault';
const DB_VERSION = 1;
const STORE_NAME = 'dpc_reports';
const RETENTION_MONTHS = 26;

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('uid', 'uid', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export async function saveReportToVault(
  uid: string,
  report: Omit<VaultReportMetadata, 'id' | 'uid' | 'createdAt' | 'expiresAt' | 'auditHash'>
): Promise<VaultReportMetadata> {
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + RETENTION_MONTHS);

  const auditHash = await sha256Hex(`${uid}:${now.toISOString()}:${report.payloadJson}`);
  const record: VaultReportMetadata = {
    ...report,
    id: `DPC-${now.getTime().toString(36).toUpperCase()}`,
    uid,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    auditHash,
  };

  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return record;
}

export async function listVaultReports(uid: string): Promise<VaultReportMetadata[]> {
  const db = await openVaultDb();
  const all = await new Promise<VaultReportMetadata[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('uid');
    const req = index.getAll(uid);
    req.onsuccess = () => resolve((req.result as VaultReportMetadata[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function pruneOldVaultReports(uid: string): Promise<number> {
  const reports = await listVaultReports(uid);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const expired = reports.filter((r) => new Date(r.createdAt) < cutoff);
  if (expired.length === 0) return 0;

  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    expired.forEach((item) => store.delete(item.id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return expired.length;
}

export async function deleteVaultReport(id: string): Promise<void> {
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function downloadTextArtifact(filename: string, content: string, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
