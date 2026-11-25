import { sha256Hex } from './sha256Vault';

export interface VaultReportMetadata {
  id: string;
  uid: string;
  kind: 'dpc_report' | 'rectification_cert';
  title: string;
  sovereignScore: number;
  hdiScore: number;
  sealedCount: number;
  verifiedCount: number;
  storageTarget: 'local' | 'drive' | 'download';
  createdAt: string;
  expiresAt: string;
  auditHash: string;
  /** Zero-PII JSON snapshot (hashes, verification statuses, and scores only). */
  payloadJson: string;
}

const DB_NAME = 'agape-sovereign-vault';
const DB_VERSION = 1;
const STORE_NAME = 'dpc_reports';
export const VAULT_RETENTION_MONTHS = 26;

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

export async function saveReportToVault(
  uid: string,
  report: Omit<VaultReportMetadata, 'id' | 'uid' | 'createdAt' | 'expiresAt' | 'auditHash'>,
): Promise<VaultReportMetadata> {
  const now = new Date();
  const expires = new Date(now);
  expires.setMonth(expires.getMonth() + VAULT_RETENTION_MONTHS);

  const auditHash = await sha256Hex(`${uid}:${now.toISOString()}:${report.payloadJson}`);
  const prefix = report.kind === 'rectification_cert' ? 'HDI' : 'DPC';
  const record: VaultReportMetadata = {
    ...report,
    id: `${prefix}-${now.getTime().toString(36).toUpperCase()}`,
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

export async function listVaultReports(
  uid: string,
  kind?: VaultReportMetadata['kind'],
): Promise<VaultReportMetadata[]> {
  const db = await openVaultDb();
  const all = await new Promise<VaultReportMetadata[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('uid');
    const req = index.getAll(uid);
    req.onsuccess = () => resolve((req.result as VaultReportMetadata[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  const filtered = kind ? all.filter((r) => (r.kind ?? 'dpc_report') === kind) : all;
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function pruneOldVaultReports(uid: string): Promise<number> {
  const reports = await listVaultReports(uid);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - VAULT_RETENTION_MONTHS);
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

/**
 * Generates and downloads a real on-device PDF from verified enclave records.
 * Lazy-loads jsPDF so the PDF engine stays out of the initial bundle.
 */
export async function downloadStructuredPdf(
  filename: string,
  title: string,
  subtitle: string,
  sections: { heading: string; lines: string[] }[],
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 44;
  let y = M;

  const writeLine = (text: string, size = 10, bold = false, gap = 14) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    for (const wrapped of doc.splitTextToSize(text, W - M * 2)) {
      if (y > 780) {
        doc.addPage();
        y = M;
      }
      doc.text(wrapped, M, y);
      y += gap;
    }
  };

  writeLine(title, 15, true, 20);
  writeLine(subtitle, 9, false, 18);

  for (const sec of sections) {
    y += 6;
    writeLine(sec.heading, 11, true, 16);
    for (const l of sec.lines) {
      writeLine(l, 9.5, false, 13);
    }
  }

  doc.save(filename);
}
