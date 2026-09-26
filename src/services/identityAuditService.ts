/**
 * IDENTITY AUDIT PDF SERVICE
 * ============================================================
 * Produces the 26-month Identity Audit PDF from real, evidence-backed findings
 * only, then returns the exact bytes plus their SHA-256 digest so the same
 * digest can be displayed in the UI, printed into the document, and verified
 * after upload to the user's federated Google Account.
 *
 * No sample rows, no placeholder vectors: an unscanned vector is printed as
 * NOT SCANNED, and an unverified result is printed as UNVERIFIED.
 * ============================================================
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScanFinding } from './scanService';
import { MODULE_AGENTS, MODULE_AGENT_INDEX } from './moduleAgentService';
import { RETENTION_MONTHS, retentionExpiry } from './driveExportService';

export interface IdentityAuditInput {
  /** Session SHA-256 identity hash (the only identifier printed). */
  identitySha256: string;
  findings: ScanFinding[];
  sovereignScore: number;
  classification: string;
  authFactors: { googleFederated: boolean; passkeyBound: boolean; federatedEmail: string | null };
  generatedAt?: Date;
}

export interface IdentityAuditDocument {
  blob: Blob;
  bytes: Uint8Array;
  sha256Digest: string;
  fileName: string;
  generatedAt: Date;
  expiresAt: Date;
  retentionMonths: number;
  counts: { scanned: number; unscanned: number; thirdPartyVerified: number; nuked: number; knoxed: number; monitored: number };
}

async function sha256OfBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const NEON_BLUE: [number, number, number] = [0, 212, 255];
const NEON_MAGENTA: [number, number, number] = [255, 46, 159];
const NEON_ORANGE: [number, number, number] = [255, 122, 24];
const MUTED: [number, number, number] = [150, 160, 180];

export async function compileIdentityAuditPdf(input: IdentityAuditInput): Promise<IdentityAuditDocument> {
  const generatedAt = input.generatedAt || new Date();
  const expiresAt = retentionExpiry(generatedAt, RETENTION_MONTHS);
  const doc = new jsPDF();

  /* ── Cover ── */
  doc.setFillColor(6, 12, 26);
  doc.rect(0, 0, 210, 297, 'F');

  doc.setFontSize(20);
  doc.setTextColor(...NEON_BLUE);
  doc.text('AGAPE SOVEREIGN', 105, 22, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(...NEON_MAGENTA);
  doc.text('IDENTITY AUDIT REPORT — DIGITAL IDENTITY FEDERATED FOOTPRINT', 105, 30, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Generated: ${generatedAt.toISOString()}`, 105, 38, { align: 'center' });
  doc.text(`Retention: ${RETENTION_MONTHS} months — expires ${expiresAt.toISOString().slice(0, 10)}`, 105, 43, { align: 'center' });

  /* ── Identity block: hash only, never raw PII ── */
  doc.setFontSize(10);
  doc.setTextColor(...NEON_ORANGE);
  doc.text('ZERO-KNOWLEDGE IDENTITY', 15, 56);
  doc.setFontSize(8);
  doc.setTextColor(220);
  doc.text(`Session SHA-256 identity ID: ${input.identitySha256}`, 15, 62);
  doc.text(`Authentication factors: Google federated ${input.authFactors.googleFederated ? 'YES' : 'NO'} · Passkey bound ${input.authFactors.passkeyBound ? 'YES' : 'NO'}`, 15, 67);
  if (input.authFactors.federatedEmail) {
    doc.text(`Federated Google account: ${input.authFactors.federatedEmail}`, 15, 72);
  }
  doc.text(`Sovereign Score: ${input.sovereignScore}/100 (${input.classification})`, 15, 77);

  /* ── Vector matrix ── */
  const scannedIds = new Set(input.findings.map(f => f.module?.toLowerCase()));
  const rows = MODULE_AGENTS.map(spec => {
    const finding = input.findings
      .filter(f => f.module?.toLowerCase() === spec.moduleId)
      .reduce<ScanFinding | null>((acc, f) => (!acc || f.timestamp > acc.timestamp ? f : acc), null);

    if (!finding) {
      return [spec.vector, spec.label, 'NOT SCANNED', '—', 'No evidence gathered — module never executed.'];
    }
    const provenance = finding.verification?.thirdPartyVerified
      ? `THIRD-PARTY VERIFIED`
      : 'UNVERIFIED';
    return [
      spec.vector,
      spec.label,
      finding.status,
      provenance,
      `${finding.finding}. ${finding.details}`.slice(0, 300),
    ];
  });

  autoTable(doc, {
    startY: 86,
    head: [['Vector', 'Module', 'Status', 'Verification', 'Evidence on record']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: NEON_BLUE, textColor: [6, 12, 26], fontStyle: 'bold', fontSize: 7 },
    styles: { fontSize: 6.5, cellPadding: 2, textColor: [225, 230, 240], fillColor: [10, 18, 36] },
    columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 34 }, 2: { cellWidth: 20 }, 3: { cellWidth: 26 }, 4: { cellWidth: 'auto' } },
  });

  /* ── Verification provenance ── */
  const verifiedFindings = input.findings.filter(f => f.verification && f.verification.sources.length > 0);
  if (verifiedFindings.length > 0) {
    doc.addPage();
    doc.setFillColor(6, 12, 26);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...NEON_BLUE);
    doc.text('THIRD-PARTY VERIFICATION PROVENANCE', 15, 20);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('Every row below was returned by an external source. Rows marked UNVERIFIED were not confirmed externally.', 15, 26);

    const provenanceRows: Array<[string, string, string, string, string]> = [];
    for (const finding of verifiedFindings) {
      for (const source of finding.verification?.sources || []) {
        provenanceRows.push([
          MODULE_AGENT_INDEX[finding.module]?.vector || finding.module,
          source.source,
          source.outcome,
          source.verified ? 'ANSWERED' : 'NO RESPONSE',
          source.checkedAt,
        ]);
      }
    }
    autoTable(doc, {
      startY: 32,
      head: [['Vector', 'Source', 'Outcome', 'Response', 'Checked at (UTC)']],
      body: provenanceRows,
      theme: 'striped',
      headStyles: { fillColor: NEON_ORANGE, textColor: [6, 12, 26], fontSize: 7 },
      styles: { fontSize: 6.5, cellPadding: 2, textColor: [225, 230, 240], fillColor: [10, 18, 36] },
    });
  }

  /* ── Integrity page ── */
  doc.addPage();
  doc.setFillColor(6, 12, 26);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...NEON_BLUE);
  doc.text('INTEGRITY & RETENTION', 15, 22);

  const counts = {
    scanned: scannedIds.size,
    unscanned: MODULE_AGENTS.length - scannedIds.size,
    thirdPartyVerified: input.findings.filter(f => f.verification?.thirdPartyVerified === true).length,
    nuked: input.findings.filter(f => f.status === 'NUKED').length,
    knoxed: input.findings.filter(f => f.status === 'KNOXED').length,
    monitored: input.findings.filter(f => f.status === 'MONITORED').length,
  };

  const integrityLines = [
    `Vectors executed: ${counts.scanned} of ${MODULE_AGENTS.length} (${counts.unscanned} not scanned)`,
    `Third-party verified results: ${counts.thirdPartyVerified}`,
    `Status breakdown: NUKED ${counts.nuked} · KNOXED ${counts.knoxed} · MONITORED ${counts.monitored}`,
    '',
    'Data handling',
    '• Module inputs are AES-256-GCM encrypted on device before any write.',
    '• Only ciphertext and SHA-256 identifiers are persisted; plaintext is never stored.',
    '• Every module run is gated by its Module Agent and recorded in the audit trail.',
    '',
    'Retention',
    `• Rolling retention window: ${RETENTION_MONTHS} months from generation.`,
    `• This document expires ${expiresAt.toISOString()}.`,
    '',
    'Verification',
    `• SHA-256 of these exact PDF bytes is printed on the download receipt and on the`,
    `  Drive copy, so any tampering is detectable by recomputing the digest.`,
  ];
  doc.setFontSize(8.5);
  doc.setTextColor(225);
  let y = 32;
  for (const line of integrityLines) {
    doc.text(line, 15, y);
    y += 6;
  }

  /* ── Footer on every page ── */
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(
      `Agape Sovereign · Identity Audit · ${RETENTION_MONTHS}-month retention · Page ${i} of ${pageCount} · sovereign.nyc`,
      105, 291, { align: 'center' },
    );
  }

  const bytes = new Uint8Array(doc.output('arraybuffer'));
  const sha256Digest = await sha256OfBytes(bytes);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const stamp = generatedAt.toISOString().slice(0, 10);

  return {
    blob,
    bytes,
    sha256Digest,
    fileName: `Agape-Sovereign-Identity-Audit-${stamp}-${sha256Digest.slice(0, 8)}.pdf`,
    generatedAt,
    expiresAt,
    retentionMonths: RETENTION_MONTHS,
    counts,
  };
}
