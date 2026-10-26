/**
 * 26-Month Identity Audit PDF — generated entirely on-device from the
 * user's real sealed receipts. No template data, no invented history:
 * every line comes from a Module Agent receipt or is a date computed
 * from the audit start.
 *
 * The 26-month window: the audit opens today and carries a monthly
 * re-verification checkpoint schedule for 26 months, plus a document
 * expiry after which a fresh audit must be generated. (Breach-notification
 * practice commonly monitors for ~24 months; Agape adds a 2-month buffer.)
 *
 * Google users can save the PDF straight into their own Google Drive
 * (federated account) via the drive.file scope; everyone can download it.
 */
import { ModuleReceipt } from './moduleAgents';
import { sha256Hex } from './sha256Vault';

export interface AuditContext {
  email: string;
  method: string;
  sovereignId: string;
  receipts: ModuleReceipt[];
  /** Session plaintext (never persisted) — sensitive fields are masked here. */
  sessionEntries: Record<string, Record<string, string>>;
  sensitiveKeys: Set<string>;
}

export const AUDIT_MONTHS = 26;

export function auditExpiry(start = new Date()): Date {
  const d = new Date(start);
  d.setMonth(d.getMonth() + AUDIT_MONTHS);
  return d;
}

export function checkpointSchedule(start = new Date()): Date[] {
  return Array.from({ length: AUDIT_MONTHS }, (_, i) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i + 1);
    return d;
  });
}

export async function buildAuditPdf(ctx: AuditContext): Promise<{ blob: Blob; filename: string; documentHash: string }> {
  const start = new Date();
  const expiry = auditExpiry(start);
  const { jsPDF } = await import('jspdf'); // lazy: keeps the PDF engine out of the initial bundle
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  const line = (text: string, size = 10, bold = false, gap = 14) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    for (const wrapped of doc.splitTextToSize(text, W - M * 2)) {
      if (y > 780) { doc.addPage(); y = M; }
      doc.text(wrapped, M, y);
      y += gap;
    }
  };
  const rule = () => { doc.setDrawColor(0, 212, 255); doc.line(M, y, W - M, y); y += 16; };

  doc.setFillColor(6, 12, 26);
  doc.rect(0, 0, W, 110, 'F');
  doc.setTextColor(0, 212, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text('AGAPE SOVEREIGN AI', M, 48);
  doc.setTextColor(255, 255, 255); doc.setFontSize(13);
  doc.text('26-Month Identity Audit — Digital Identity Federated Footprint', M, 72);
  doc.setFontSize(9); doc.setTextColor(0, 255, 135);
  doc.text('ZERO-KNOWLEDGE · SHA-256 SEALED · GENERATED ON-DEVICE', M, 90);
  doc.setTextColor(30, 30, 30);
  y = 140;

  line('AUDIT IDENTITY', 12, true);
  line(`Sovereign SHA-256 ID: ${ctx.sovereignId}`);
  line(`Account: ${ctx.email || '(anonymous guest — no email on file)'} · Login method: ${ctx.method}`);
  line(`Audit opened: ${start.toISOString()} · Expires (26 months): ${expiry.toISOString().slice(0, 10)}`);
  line(`Modules sealed: ${new Set(ctx.receipts.map((r) => r.moduleId)).size} of 16 · Total sealed entries: ${ctx.receipts.length}`);
  rule();

  line('HOW TO READ THIS DOCUMENT', 12, true);
  line('Every entry below was hashed with SHA-256 and AES-256-GCM encrypted on the owner\'s device before anything was stored. Verification lines state exactly who checked what: a named free third-party API, a real on-device check, or SELF_ATTESTED where no honest free verification exists. Nothing in this report is simulated.');
  rule();

  line('SEALED IDENTITY VECTORS', 12, true);
  if (!ctx.receipts.length) {
    line('No modules have been sealed yet. Complete modules from the dashboard, then regenerate this audit.');
  }
  for (const r of ctx.receipts) {
    line(`${r.moduleName} — ${r.verification.status}`, 10, true);
    line(`SHA-256 ID: ${r.sha256Id}`, 8);
    line(`Sealed: ${r.sealedAt} · Storage: ${r.storage} · Fields sealed: ${r.fieldKeys.join(', ') || 'none'}`, 8);
    line(`Verified by: ${r.verification.source} (${r.verification.checkedAt})`, 8);
    line(r.verification.detail, 9);
    for (const f of r.verification.findings) line(`• ${f.label}: ${f.value}`, 9);
    const entry = ctx.sessionEntries[r.sha256Id];
    if (entry) {
      line('Owner copy of sealed values (this session only; sensitive values masked):', 8, true);
      for (const [k, val] of Object.entries(entry)) {
        line(`  ${k}: ${ctx.sensitiveKeys.has(k) ? '•••••• (hashed on-device, never printed)' : val}`, 8);
      }
    }
    y += 6;
  }
  rule();

  line('26-MONTH RE-VERIFICATION SCHEDULE', 12, true);
  line('Re-run each module agent at every checkpoint. A receipt older than 26 months must be treated as stale and the audit regenerated.');
  checkpointSchedule(start).forEach((d, i) => {
    line(`Month ${String(i + 1).padStart(2, '0')} — ${d.toISOString().slice(0, 10)} — re-verify all sealed modules; rotate any credential flagged MATCH_FOUND.`, 8, false, 11);
  });
  rule();

  const unsigned = doc.output('blob');
  const documentHash = await sha256Hex(`${ctx.sovereignId}::${start.toISOString()}::${ctx.receipts.map((r) => r.sha256Id).join(',')}`);
  line('DOCUMENT INTEGRITY', 12, true);
  line(`Audit integrity SHA-256 (sovereign ID + open date + receipt IDs): ${documentHash}`, 8);
  line('Verify any entry at any time: re-enter the same values in its module — the agent recomputes the SHA-256 ID on-device and it must match this document.');
  void unsigned;

  const filename = `agape-sovereign-26-month-identity-audit-${start.toISOString().slice(0, 10)}.pdf`;
  return { blob: doc.output('blob'), filename, documentHash };
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Save to the user's federated Google Drive (drive.file scope).
 * Real Drive v3 multipart upload; throws honest errors, returns file id.
 */
export async function savePdfToGoogleDrive(
  blob: Blob,
  filename: string,
  accessToken: string,
): Promise<{ id: string; webViewLink?: string }> {
  const boundary = `agape-${Date.now().toString(36)}`;
  const metadata = JSON.stringify({ name: filename, mimeType: 'application/pdf', description: 'Agape Sovereign AI — 26-Month Identity Audit (SHA-256 sealed, generated on-device).' });
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, blob, tail], { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });
  if (res.status === 401) throw new Error('DRIVE_TOKEN_EXPIRED');
  if (!res.ok) throw new Error(`Google Drive upload failed (HTTP ${res.status}). Download the PDF instead — nothing was saved to Drive.`);
  const data = await res.json();
  return { id: data.id, webViewLink: data.webViewLink };
}
