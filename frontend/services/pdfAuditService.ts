/**
 * Agape Sovereign — 26-Month Zero-Knowledge Identity Audit PDF Compiler (`jspdf@4.2.1`)
 *
 * Compiles verified Module Agent telemetry (V-01 .. V-16), Dual Security status,
 * third-party API verification proofs, and SHA-256 seals into an archival 26-month PDF
 * ready for local download or Federated Google Account (Google Drive) backup.
 */
import { jsPDF } from 'jspdf';
import {
  IDENTITY_VECTOR_MODULES,
  ModuleAgentExecutionResult,
} from './moduleAgents';
import {
  compute26MonthExpiryIso,
  RETENTION_MONTHS,
  sha256Hex,
} from './sovereignCrypto';

export interface CompiledAuditPdfArtifact {
  blob: Blob;
  fileName: string;
  auditSealSha256: string;
  generatedAtIso: string;
  retentionUntilIso: string;
  sovereignScore: number;
  scannedCount: number;
}

export interface AuditPdfBuildInput {
  userEmail: string;
  uid: string;
  sha256Id: string;
  hasGoogleFederated: boolean;
  hasBoundPasskey: boolean;
  resultsByModule: Record<string, ModuleAgentExecutionResult>;
}

export async function compile26MonthIdentityAuditPdf(
  input: AuditPdfBuildInput
): Promise<CompiledAuditPdfArtifact> {
  const now = new Date();
  const generatedAtIso = now.toISOString();
  const retentionUntilIso = compute26MonthExpiryIso(now);

  const scannedList = IDENTITY_VECTOR_MODULES
    .map((m) => input.resultsByModule[m.id])
    .filter((r): r is ModuleAgentExecutionResult => Boolean(r));

  const avgRisk =
    scannedList.length > 0
      ? Math.round(scannedList.reduce((acc, r) => acc + r.riskScore, 0) / scannedList.length)
      : 0;
  const sovereignScore = scannedList.length > 0 ? Math.max(0, 100 - avgRisk) : 100;

  const auditManifest = {
    schema: 'agape-sovereign-26m-identity-audit-v2',
    generatedAtIso,
    retentionMonths: RETENTION_MONTHS,
    retentionUntilIso,
    uidHash: await sha256Hex(input.uid),
    sha256Id: input.sha256Id,
    dualSecurity: {
      googleFederated: input.hasGoogleFederated,
      hardwarePasskey: input.hasBoundPasskey,
    },
    scannedCount: scannedList.length,
    sovereignScore,
    moduleSeals: scannedList.map((r) => ({
      moduleId: r.moduleId,
      status: r.status,
      riskScore: r.riskScore,
      resultSealSha256: r.resultSealSha256,
    })),
  };

  const auditSealSha256 = await sha256Hex(JSON.stringify(auditManifest));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (neededPt: number) => {
    if (y + neededPt > pageHeight - 54) {
      doc.addPage();
      doc.setFillColor(7, 12, 26);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      y = margin;
    }
  };

  // Dark Sovereign Background Page 1
  doc.setFillColor(7, 12, 26);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header Banner
  doc.setFillColor(12, 22, 46);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.2);
  doc.roundedRect(margin, y, contentWidth, 92, 8, 8, 'FD');

  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('AGAPE SOVEREIGN AI  |  ZERO-KNOWLEDGE ENCLAVE CERTIFICATE', margin + 16, y + 22);

  doc.setTextColor(232, 244, 255);
  doc.setFontSize(17);
  doc.text('26-MONTH DIGITAL IDENTITY & VECTOR AUDIT REPORT', margin + 16, y + 45);

  doc.setTextColor(148, 163, 184);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.text(`ACTIVE SHA256 ID: ${input.sha256Id}`, margin + 16, y + 64);
  doc.text(`MASTER AUDIT SEAL: ${auditSealSha256}`, margin + 16, y + 78);

  y += 108;

  // Metadata & Dual Security Summary Box
  doc.setFillColor(11, 18, 36);
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, y, contentWidth, 86, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248);
  doc.text('SOVEREIGN GOVERNANCE & DUAL SECURITY ATTESTATION', margin + 14, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  const dualLabel =
    input.hasGoogleFederated && input.hasBoundPasskey
      ? 'LEVEL 3 DUAL SECURITY (Passkey + Federated Google)'
      : input.hasGoogleFederated
        ? 'Federated Google Sign-In Active (Passkey Ready)'
        : input.hasBoundPasskey
          ? 'Hardware Passkey Active (Google Drive Link Ready)'
          : 'Authenticated Sovereign Session';

  doc.text(`Account Principal: ${input.userEmail || 'Sovereign Enclave Principal'}`, margin + 14, y + 36);
  doc.text(`Authentication Posture: ${dualLabel}`, margin + 14, y + 51);
  doc.text(`Generated (UTC): ${generatedAtIso}   |   26-Month Retention Valid Until: ${retentionUntilIso.slice(0, 10)}`, margin + 14, y + 66);
  doc.text(
    `Verified Modules: ${scannedList.length} / 16   |   Sovereign Posture Score: ${scannedList.length > 0 ? `${sovereignScore}/100` : 'Awaiting Scans'}`,
    margin + 14,
    y + 79
  );

  y += 104;

  // 16 Identity Vector Modules Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text('16 IDENTITY VECTOR MODULES (IVM V-01 THROUGH V-16) — VERIFIED TELEMETRY', margin, y);
  y += 14;

  for (const mod of IDENTITY_VECTOR_MODULES) {
    const res = input.resultsByModule[mod.id];
    const cardHeight = res ? 94 + Math.min(res.findings.length, 2) * 14 : 44;
    ensureSpace(cardHeight + 10);

    doc.setFillColor(11, 18, 36);
    if (!res) {
      doc.setDrawColor(51, 65, 85);
    } else if (res.status === 'EXPOSED') {
      doc.setDrawColor(239, 68, 68);
    } else if (res.status === 'ELEVATED_RISK') {
      doc.setDrawColor(245, 158, 11);
    } else {
      doc.setDrawColor(16, 185, 129);
    }
    doc.setLineWidth(0.75);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 5, 5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(241, 245, 249);
    doc.text(`${mod.id} (${mod.agentId}) — ${mod.name}`, margin + 12, y + 16);

    if (!res) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Status: NOT SCANNED IN THIS SESSION  |  Ready Verifiers: ${mod.thirdPartyApis.join(', ')}`,
        margin + 12,
        y + 32
      );
    } else {
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      if (res.status === 'EXPOSED') doc.setTextColor(248, 113, 113);
      else if (res.status === 'ELEVATED_RISK') doc.setTextColor(251, 191, 36);
      else doc.setTextColor(52, 211, 153);
      doc.text(`${res.status}  |  RISK ${res.riskScore}/100`, pageWidth - margin - 155, y + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `Target: ${res.sanitizedTargetLabel}   |   Verified At: ${res.verifiedAtIso}`,
        margin + 12,
        y + 31
      );

      const verifierText = res.verifications
        .map((v) => `${v.provider}: ${v.status} (${v.latencyMs}ms)`)
        .join('  •  ');
      doc.setTextColor(125, 211, 252);
      doc.text(doc.splitTextToSize(`APIs: ${verifierText}`, contentWidth - 24)[0] || '', margin + 12, y + 44);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Envelope Seal SHA-256: ${res.resultSealSha256}`, margin + 12, y + 57);
      doc.text(`AES-256-GCM Commitment: ${res.encryptedEnvelope.payloadCommitmentSha256}`, margin + 12, y + 68);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      let fy = y + 82;
      for (const finding of res.findings.slice(0, 2)) {
        const line = `[${finding.severity}] ${finding.title} — ${finding.detail}`;
        const clipped = doc.splitTextToSize(line, contentWidth - 24)[0] || line;
        doc.text(clipped, margin + 12, fy);
        fy += 13;
      }
    }

    y += cardHeight + 8;
  }

  // Footer attestation on final page
  ensureSpace(46);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `ZERO-KNOWLEDGE ATTESTATION: Encrypted with PBKDF2-SHA256 + AES-256-GCM bound to SHA256 ID. Retained 26 months until ${retentionUntilIso.slice(0, 10)}.`,
    margin,
    pageHeight - 28
  );

  const blob = doc.output('blob');
  const dateStamp = generatedAtIso.slice(0, 10);
  const fileName = `Agape-Sovereign-26M-Identity-Audit-${dateStamp}-${auditSealSha256.slice(0, 8)}.pdf`;

  return {
    blob,
    fileName,
    auditSealSha256,
    generatedAtIso,
    retentionUntilIso,
    sovereignScore,
    scannedCount: scannedList.length,
  };
}
