export interface VaultReport {
  id: string;
  uid: string;
  timestamp: number;
  pdfBlob: Blob;
  metadata: {
    score: number;
    sovereignHash: string;
    version: string;
  };
}

const DB_NAME = 'sovereign_vault';
const DB_VERSION = 1;
const STORE_NAME = 'reports';

// 26 months in milliseconds (approx)
const RETENTION_MS = 26 * 30 * 24 * 60 * 60 * 1000;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('uid', 'uid', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export const localVaultService = {
  async saveReport(uid: string, pdfBlob: Blob, metadata: any): Promise<string> {
    const db = await openDB();
    const id = `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();

    const report: VaultReport = {
      id,
      uid,
      timestamp,
      pdfBlob,
      metadata,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(report);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
      
      // Auto-prune on save
      transaction.oncomplete = () => {
        this.pruneOldReports(uid).catch(console.error);
      };
    });
  },

  async listReports(uid: string): Promise<VaultReport[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('uid');
      const request = index.getAll(uid);

      request.onsuccess = () => {
        const results = (request.result as VaultReport[])
          .sort((a, b) => b.timestamp - a.timestamp); // Newest first
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async pruneOldReports(uid: string): Promise<void> {
    const db = await openDB();
    const threshold = Date.now() - RETENTION_MS;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('uid');
      const request = index.getAll(uid);

      request.onsuccess = () => {
        const reports = request.result as VaultReport[];
        reports.forEach(report => {
          if (report.timestamp < threshold) {
            store.delete(report.id);
          }
        });
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
  
  async getReport(id: string): Promise<VaultReport | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
};
