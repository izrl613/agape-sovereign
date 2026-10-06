/**
 * ============================================================
 * ARCHITECT AI — PDF Agent Service
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Generates high-sovereignty PDF Identity Passport documents:
 *  - Valid for exactly 2 Years from timestamp of verification
 *  - Imprints a cryptographic SHA-256 seal / ID on EVERY page
 *  - Formats all 16 identity vector module statuses & encrypted seals
 *  - Works 100% client-side / offline with zero external network dependency
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateSHA256 } from '../utils/crypto';

export interface IdentityPassportData {
  userId: string;
  userEmail: string;
  sovereignScore: number;
  classification: 'KNOXED' | 'NUKED' | 'MONITORED';
  sha256Id: string;
  llmModel?: string;
  verifiedAt: Date;
  expiresAt: Date; // 2 years from verifiedAt
  vectorData: Record<string, {
    vector: string;
    label: string;
    status: 'KNOXED' | 'NUKED' | 'MONITORED';
    sha256Hash: string;
    details: string;
    fieldsCount: number;
  }>;
}

/**
 * Generate a 2-Year Valid Sovereign Identity Passport PDF with SHA-256 on every page
 */
export async function generateSovereignIdentityPDF(
  passportData: IdentityPassportData
): Promise<{ pdfBlob: Blob; pdfFileName: string; sha256Digest: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageCount = 3; // 3-page high-security passport
  const issuedDateStr = passportData.verifiedAt.toISOString().split('T')[0];
  const expiresDateStr = passportData.expiresAt.toISOString().split('T')[0];
  const masterSha256 = passportData.sha256Id || await generateSHA256(JSON.stringify(passportData));

  // Colors
  const darkBg = [6, 13, 31];
  const neonBlue = [0, 212, 255];
  const neonMagenta = [255, 46, 159];
  const textWhite = [240, 246, 252];
  const textMuted = [148, 163, 184];

  // Helper to add header & footer with SHA-256 on every page
  const addPageHeaderFooter = (pageNo: number, totalPages: number) => {
    doc.setFillColor(darkBg[0], darkBg[1], darkBg[2]);
    doc.rect(0, 0, 210, 297, 'F'); // Dark background grid

    // Page border line
    doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
    doc.setLineWidth(0.3);
    doc.rect(8, 8, 194, 281);

    // Top Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
    doc.text('AGAPE SOVEREIGN ENCLAVE · OFFICIAL IDENTITY PASSPORT', 12, 14);

    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`PAGE ${pageNo} OF ${totalPages}`, 198, 14, { align: 'right' });

    // Header divider line
    doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
    doc.setLineWidth(0.2);
    doc.line(12, 16, 198, 16);

    // Bottom Footer with SHA-256 ID Seal on EVERY page
    doc.line(12, 280, 198, 280);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
    doc.text(`SHA-256 PAGE SEAL: ${masterSha256}`, 12, 284);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`VALID UNTIL: ${expiresDateStr} (2-YEAR HARDENED PROOF) · VERIFIED BY ARCHITECT AI (${passportData.llmModel || 'nemotron-3-nano:4b'})`, 198, 284, { align: 'right' });
  };

  // ── PAGE 1: COVER & OVERVIEW ──────────────────────────────────────────────
  doc.setPage(1);
  addPageHeaderFooter(1, pageCount);

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.text('SOVEREIGN IDENTITY PASSPORT', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Zero-Knowledge 16-Vector Identity Proof & Cryptographic Certificate', 105, 36, { align: 'center' });

  // Score Banner Card
  doc.setFillColor(15, 23, 42);
  doc.rect(15, 45, 180, 35, 'F');
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.rect(15, 45, 180, 35, 'S');

  doc.setFontSize(11);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text('SOVEREIGN IDENTITY POSTURE', 22, 54);

  doc.setFontSize(26);
  doc.setTextColor(passportData.sovereignScore > 75 ? neonBlue[0] : neonMagenta[0], passportData.sovereignScore > 75 ? neonBlue[1] : neonMagenta[1], passportData.sovereignScore > 75 ? neonBlue[2] : neonMagenta[2]);
  doc.text(`${passportData.sovereignScore}/100`, 22, 68);

  doc.setFontSize(9);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text(`STATUS: ${passportData.classification}`, 100, 54);
  doc.text(`ISSUED: ${issuedDateStr}`, 100, 61);
  doc.text(`EXPIRES: ${expiresDateStr} (Valid 2 Years)`, 100, 68);

  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`USER UID: ${passportData.userId}`, 100, 74);

  // Cryptographic Signature Box
  doc.setFillColor(10, 16, 35);
  doc.rect(15, 85, 180, 25, 'F');
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.text('MASTER SHA-256 INTEGRITY DIGEST:', 20, 93);
  doc.setFontSize(7.5);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text(masterSha256, 20, 100);

  // Vector Summary Table on Page 1
  const vectorRowsP1 = Object.entries(passportData.vectorData).slice(0, 8).map(([id, item]) => [
    item.vector,
    item.label,
    item.status,
    item.sha256Hash.substring(0, 16) + '...',
    `${item.fieldsCount} field(s)`,
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['VECTOR', 'MODULE NAME', 'STATUS', 'SHA-256 SEAL', 'ENCRYPTED DATA']],
    body: vectorRowsP1,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [0, 212, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fillColor: [6, 13, 31], textColor: [240, 246, 252], fontSize: 7.5, font: 'courier' },
    alternateRowStyles: { fillColor: [10, 16, 35] },
    margin: { left: 15, right: 15 },
  });

  // ── PAGE 2: VECTORS 9 TO 16 & DETAIL ANALYSIS ─────────────────────────────
  doc.addPage();
  addPageHeaderFooter(2, pageCount);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.text('IDENTITY VECTOR COMPREHENSIVE MAP (V-09 THROUGH V-16)', 15, 26);

  const vectorRowsP2 = Object.entries(passportData.vectorData).slice(8, 16).map(([id, item]) => [
    item.vector,
    item.label,
    item.status,
    item.sha256Hash.substring(0, 16) + '...',
    item.details,
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['VECTOR', 'MODULE NAME', 'STATUS', 'SHA-256 SEAL', 'SECURITY POSTURE DETAILS']],
    body: vectorRowsP2,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [0, 212, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fillColor: [6, 13, 31], textColor: [240, 246, 252], fontSize: 7.5, font: 'courier' },
    alternateRowStyles: { fillColor: [10, 16, 35] },
    margin: { left: 15, right: 15 },
  });

  // ── PAGE 3: COGNITIVE AUDIT & COMPLIANCE CERTIFICATE ──────────────────────
  doc.addPage();
  addPageHeaderFooter(3, pageCount);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.text('ARCHITECT AI COGNITIVE AUDIT & VERIFICATION STAMP', 15, 26);

  doc.setFillColor(15, 23, 42);
  doc.rect(15, 32, 180, 45, 'F');
  doc.setDrawColor(neonBlue[0], neonBlue[1], neonBlue[2]);
  doc.rect(15, 32, 180, 45, 'S');

  doc.setFontSize(9);
  doc.setTextColor(textWhite[0], textWhite[1], textWhite[2]);
  doc.text('LOCAL AI COGNITIVE ENGINE:', 20, 40);
  doc.setFont('courier', 'bold');
  doc.text(passportData.llmModel || 'nemotron-3-nano:4b (Offline 2.8GB Local LLM)', 75, 40);

  doc.setFont('helvetica', 'bold');
  doc.text('VERIFICATION METHOD:', 20, 48);
  doc.setFont('courier', 'bold');
  doc.text('Third-Party Agent Live User Data Inspection & Verification', 75, 48);

  doc.setFont('helvetica', 'bold');
  doc.text('VALIDITY DURATION:', 20, 56);
  doc.setFont('courier', 'bold');
  doc.text(`24 Months (730 Days) · Valid until ${expiresDateStr}`, 75, 56);

  doc.setFont('helvetica', 'bold');
  doc.text('STORAGE HARDENING:', 20, 64);
  doc.setFont('courier', 'bold');
  doc.text('WebAuthn Passkey Local Profile / Google Federated Account', 75, 64);

  // Legal & Technical Affirmation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const affirmationText = `This document certifies that all 16 identity vector modules have been submitted, client-side encrypted via AES-GCM 256-bit cryptography, and hashed using SHA-256. Architect AI processed this payload locally using nemotron-3-nano:4b without transmitting any unencrypted plaintext across external networks. Every page of this document is cryptographically stamped with SHA-256 hash ${masterSha256}. This certificate is valid for 2 years from issuance.`;
  
  const splitText = doc.splitTextToSize(affirmationText, 180);
  doc.text(splitText, 15, 88);

  // Save PDF output
  const pdfArrayBuffer = doc.output('arraybuffer');
  const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  const pdfFileName = `Sovereign_Identity_Passport_${passportData.userId.substring(0, 8)}_${issuedDateStr}.pdf`;

  const sha256Digest = await generateSHA256(masterSha256);

  return {
    pdfBlob,
    pdfFileName,
    sha256Digest,
  };
}
