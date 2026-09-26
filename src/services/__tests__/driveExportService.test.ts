import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from 'firebase/auth';

let federatedToken: string | null = null;
vi.mock('../../firebase', () => ({
  db: { __mock: 'firestore' },
  getFederatedDriveToken: () => federatedToken,
}));
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(async () => ({ id: 'export-1' })),
  collection: () => ({}),
  serverTimestamp: () => new Date(),
}));

import {
  driveExportService,
  describeFederatedAccount,
  isFederatedGoogleUser,
  RETENTION_MONTHS,
  DRIVE_SCOPE,
} from '../driveExportService';

const googleUser = {
  uid: 'uid-1',
  email: 'sovereign@gmail.com',
  providerData: [{ providerId: 'google.com', email: 'sovereign@gmail.com' }],
} as unknown as User;

const passkeyOnlyUser = {
  uid: 'uid-2',
  email: null,
  providerData: [{ providerId: 'password', email: null }],
} as unknown as User;

/** Method-aware Drive API stub. Keys are "METHOD url-fragment". */
function driveFetch(handlers: Record<string, (init?: RequestInit) => Response>) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const method = (init?.method || 'GET').toUpperCase();
    for (const [key, handler] of Object.entries(handlers)) {
      const [wantMethod, needle] = key.includes(' ') ? key.split(' ') : ['ANY', key];
      if (url.includes(needle) && (wantMethod === 'ANY' || wantMethod === method)) return handler(init);
    }
    return new Response('unhandled ' + method + ' ' + url, { status: 599 });
  });
}

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => {
  federatedToken = 'ya29.federated-token';
});

describe('federated Google detection', () => {
  it('is driven by the credential provider list, not by a guess', () => {
    expect(isFederatedGoogleUser(googleUser)).toBe(true);
    expect(isFederatedGoogleUser(passkeyOnlyUser)).toBe(false);
    expect(isFederatedGoogleUser(null)).toBe(false);
    expect(describeFederatedAccount(googleUser)).toEqual({
      federated: true,
      email: 'sovereign@gmail.com',
      providerIds: ['google.com'],
    });
  });
});

describe('Drive export of the 26-month Identity Audit PDF', () => {
  const pdfBlob = new Blob([new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55])], { type: 'application/pdf' });
  const request = {
    pdfBlob,
    fileName: 'Agape-Sovereign-Identity-Audit-2026-09-26-abcd1234.pdf',
    sha256Digest: 'a'.repeat(64),
    identitySha256: 'f'.repeat(64),
    sovereignScore: 74,
  };

  it('refuses non-federated accounts without calling Drive', async () => {
    const fetchImpl = vi.fn();
    (globalThis as any).fetch = fetchImpl;
    const result = await driveExportService.exportAuditPdf(passkeyOnlyUser, request);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not federated with Google');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('refuses when the session carries no federated access token', async () => {
    federatedToken = null;
    const fetchImpl = vi.fn();
    (globalThis as any).fetch = fetchImpl;
    const result = await driveExportService.exportAuditPdf(googleUser, request);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No federated Google access token');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('creates the app folder tree, uploads, and confirms the stored byte count', async () => {
    const createdFolders: string[] = [];
    const fetchImpl = driveFetch({
      'GET /files?q=': () => ok({ files: [] }),
      'PATCH /upload/drive/v3/files/': () => new Response('', { status: 200 }),
      'GET ?fields=': () => ok({ id: 'file-1', size: String(pdfBlob.size), webViewLink: 'https://drive.google.com/file/d/file-1/view' }),
      'POST /files': (init) => {
        const body = JSON.parse(String(init?.body)) as { name: string; parents?: string[] };
        createdFolders.push(body.name);
        if (body.name === 'Agape Sovereign') return ok({ id: 'folder-root' });
        if (body.name === 'Identity Audit Reports') return ok({ id: 'folder-reports' });
        return ok({ id: 'file-1' });
      },
    });
    (globalThis as any).fetch = fetchImpl;

    const result = await driveExportService.exportAuditPdf(googleUser, request);

    expect(result.success).toBe(true);
    expect(result.fileId).toBe('file-1');
    expect(result.storedBytes).toBe(pdfBlob.size);
    expect(result.webViewLink).toContain('file-1');
    expect(createdFolders).toEqual(['Agape Sovereign', 'Identity Audit Reports', request.fileName]);
    const expectedExpiry = new Date();
    expectedExpiry.setMonth(expectedExpiry.getMonth() + RETENTION_MONTHS);
    expect(result.expiresAt?.slice(0, 10)).toBe(expectedExpiry.toISOString().slice(0, 10));

    // The upload must carry the federated bearer token, never the Firebase API key.
    const uploadCall = fetchImpl.mock.calls.find(c => String(c[0]).includes('/upload/drive/v3'));
    expect((uploadCall?.[1] as RequestInit).headers).toMatchObject({ Authorization: 'Bearer ya29.federated-token' });

    // The file metadata must record the SHA-256 and the 26-month retention.
    const createCall = fetchImpl.mock.calls.find(c => {
      const init = c[1] as RequestInit;
      return String(c[0]).endsWith('/files') && init.method === 'POST' && String(init.body).includes('retentionMonths');
    });
    const metadata = JSON.parse(String((createCall?.[1] as RequestInit).body)) as Record<string, any>;
    expect(metadata.properties.sha256).toBe('a'.repeat(64));
    expect(metadata.properties.retentionMonths).toBe('26');
    expect(metadata.description).toContain(DRIVE_SCOPE ? 'Retention: 26 months' : '');
  });

  it('reuses an existing folder instead of creating duplicates', async () => {
    let listCount = 0;
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/files?q=')) {
        listCount += 1;
        return ok({ files: [{ id: listCount === 1 ? 'folder-root' : 'folder-reports' }] });
      }
      if (url.includes('/upload/drive/v3')) return new Response('', { status: 200 });
      if (url.includes('?fields=')) return ok({ size: String(pdfBlob.size) });
      if (init?.method === 'POST') return ok({ id: 'file-2' });
      return new Response('', { status: 404 });
    });
    (globalThis as any).fetch = fetchImpl;

    const result = await driveExportService.exportAuditPdf(googleUser, request);
    expect(result.success).toBe(true);
    expect(result.folderId).toBe('folder-reports');
    expect(fetchImpl.mock.calls.filter(c => (c[1] as RequestInit | undefined)?.method === 'POST')).toHaveLength(1);
  });

  it('fails the export when Drive stores a different byte count than was sent', async () => {
    const fetchImpl = driveFetch({
      'GET /files?q=': () => ok({ files: [{ id: 'folder-reports' }] }),
      'PATCH /upload/drive/v3/files/': () => new Response('', { status: 200 }),
      'GET ?fields=': () => ok({ id: 'file-3', size: String(pdfBlob.size + 12) }),
      'POST /files': () => ok({ id: 'file-3' }),
    });
    (globalThis as any).fetch = fetchImpl;

    const result = await driveExportService.exportAuditPdf(googleUser, request);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Integrity check failed');
  });

  it('surfaces a real Drive API error instead of claiming success', async () => {
    const fetchImpl = driveFetch({
      'GET /files?q=': () => ok({ files: [{ id: 'folder-reports' }] }),
      'POST /files': () => new Response('{"error":{"message":"Request had invalid authentication credentials"}}', { status: 401 }),
    });
    (globalThis as any).fetch = fetchImpl;

    const result = await driveExportService.exportAuditPdf(googleUser, request);
    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 401');
  });
});
