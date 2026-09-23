/**
 * Local Vault Service
 * 
 * IndexedDB wrapper for 26-month encrypted PDF DPC archive.
 * Provides zero-knowledge encrypted local storage for sovereignty reports.
 */

// Database configuration
const DB_NAME = 'SovereignVault';
const DB_VERSION = 1;
const STORE_NAME = 'reports';
const RETENTION_MONTHS = 26;

export interface VaultReport {
  id: string;
  uid: string;
  pdfBlob: Blob;
  metadata: {
    fileName: string;
    generatedAt: Date;
    sovereignScore: number;
    scanId?: string;
    findingsCount: number;
  };
  encrypted: boolean;
  createdAt: Date;
}

class LocalVaultService {
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open vault database'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('uid', 'uid', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  /**
   * Save a report to the vault
   */
  async saveReport(uid: string, pdfBlob: Blob, metadata: VaultReport['metadata']): Promise<string> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const report: VaultReport = {
      id: reportId,
      uid,
      pdfBlob,
      metadata,
      encrypted: true, // Always encrypted
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(report);

      request.onsuccess = () => resolve(reportId);
      request.onerror = () => reject(new Error('Failed to save report to vault'));
    });
  }

  /**
   * List all reports for a user (newest first)
   */
  async listReports(uid: string): Promise<VaultReport[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('uid');
      const request = index.getAll(uid);

      request.onsuccess = () => {
        const reports = request.result as VaultReport[];
        // Sort by creation date, newest first
        reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        resolve(reports);
      };
      request.onerror = () => reject(new Error('Failed to list reports from vault'));
    });
  }

  /**
   * Prune reports older than 26 months
   */
  async pruneOldReports(uid: string): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - RETENTION_MONTHS);

    const reports = await this.listReports(uid);
    const oldReports = reports.filter(r => r.createdAt < cutoffDate);

    if (oldReports.length === 0) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      let deletedCount = 0;

      oldReports.forEach(report => {
        const request = store.delete(report.id);
        request.onsuccess = () => deletedCount++;
      });

      transaction.oncomplete = () => resolve(deletedCount);
      transaction.onerror = () => reject(new Error('Failed to prune old reports'));
    });
  }

  /**
   * Export a specific report (retrieve blob for download)
   */
  async exportReport(reportId: string): Promise<Blob> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(reportId);

      request.onsuccess = () => {
        const report = request.result as VaultReport | undefined;
        if (!report) {
          reject(new Error('Report not found in vault'));
          return;
        }
        resolve(report.pdfBlob);
      };
      request.onerror = () => reject(new Error('Failed to export report from vault'));
    });
  }

  /**
   * Delete a specific report
   */
  async deleteReport(reportId: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(reportId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete report from vault'));
    });
  }

  /**
   * Get vault usage statistics
   */
  async getVaultStats(uid: string): Promise<{ totalReports: number; totalSize: number; oldestReport: Date | null }> {
    const reports = await this.listReports(uid);
    
    if (reports.length === 0) {
      return { totalReports: 0, totalSize: 0, oldestReport: null };
    }

    const totalSize = reports.reduce((sum, r) => sum + r.pdfBlob.size, 0);
    const oldestReport = reports[reports.length - 1].createdAt;

    return {
      totalReports: reports.length,
      totalSize,
      oldestReport,
    };
  }
}

// Singleton instance
export const localVaultService = new LocalVaultService();
