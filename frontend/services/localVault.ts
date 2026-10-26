/**
 * Agape Sovereign — 26-Month Zero-Knowledge Encrypted IndexedDB Vault
 *
 * Only AES-256-GCM encrypted envelopes bound to the user's SHA256 ID are stored.
 * Expired envelopes (>26 months) are pruned automatically upon enclave mount.
 */
import {
  EncryptedSovereignEnvelope,
  decryptWithSha256Id,
  encryptWithSha256Id,
} from './sovereignCrypto';

const DB_NAME = 'agape_sovereign_zk_vault_v2';
const DB_VERSION = 1;
const STORE_ENVELOPES = 'encrypted_envelopes';

export interface StoredVaultEntry {
  key: string; // `${uid}:${moduleId}`
  uid: string;
  moduleId: string;
  envelope: EncryptedSovereignEnvelope;
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_ENVELOPES)) {
        const store = db.createObjectStore(STORE_ENVELOPES, { keyPath: 'key' });
        store.createIndex('by_uid', 'uid', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB zero-knowledge vault'));
  });
}

export async function saveEncryptedModuleData<T>(
  uid: string,
  moduleId: string,
  sha256Id: string,
  payload: T
): Promise<EncryptedSovereignEnvelope> {
  const envelope = await encryptWithSha256Id(payload, sha256Id, moduleId);
  const db = await openVaultDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ENVELOPES, 'readwrite');
    const store = tx.objectStore(STORE_ENVELOPES);
    const entry: StoredVaultEntry = {
      key: `${uid}:${moduleId}`,
      uid,
      moduleId,
      envelope,
    };
    store.put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to persist encrypted module envelope'));
    };
  });
  return envelope;
}

export async function loadAllDecryptedModuleData<T>(
  uid: string,
  sha256Id: string
): Promise<Record<string, { payload: T; envelope: EncryptedSovereignEnvelope }>> {
  const db = await openVaultDb();
  const entries = await new Promise<StoredVaultEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE_ENVELOPES, 'readwrite');
    const store = tx.objectStore(STORE_ENVELOPES);
    const index = store.index('by_uid');
    const req = index.getAll(uid);
    const result: StoredVaultEntry[] = [];
    req.onsuccess = () => {
      const nowMs = Date.now();
      for (const item of req.result as StoredVaultEntry[]) {
        const expMs = Date.parse(item.envelope.expiresAtIso);
        if (!Number.isNaN(expMs) && expMs < nowMs) {
          // Enforce strict 26-month retention limit
          store.delete(item.key);
        } else {
          result.push(item);
        }
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to read zero-knowledge vault'));
    };
  });

  const out: Record<string, { payload: T; envelope: EncryptedSovereignEnvelope }> = {};
  for (const entry of entries) {
    if (entry.envelope.sha256Id !== sha256Id) continue;
    try {
      const payload = await decryptWithSha256Id<T>(entry.envelope, sha256Id);
      out[entry.moduleId] = { payload, envelope: entry.envelope };
    } catch {
      // Envelope bound to a prior rotated SHA256 ID remains unreadable by design
    }
  }
  return out;
}

export async function purgeUserVault(uid: string): Promise<number> {
  const db = await openVaultDb();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE_ENVELOPES, 'readwrite');
    const store = tx.objectStore(STORE_ENVELOPES);
    const index = store.index('by_uid');
    const req = index.getAllKeys(uid);
    let deleted = 0;
    req.onsuccess = () => {
      for (const key of req.result) {
        store.delete(key);
        deleted++;
      }
    };
    tx.oncomplete = () => {
      db.close();
      resolve(deleted);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to purge zero-knowledge vault'));
    };
  });
}
