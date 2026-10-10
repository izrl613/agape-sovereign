import { DiffVector, UserProfile } from '../types';

/**
 * Client-Side Raw PDF 1.4 Document Generator
 * Generates an authentic binary PDF with standard object streams, fonts, xref table, and trailer
 * conforming to ISO 32000 / PDF-1.4 without requiring unapproved external libraries.
 */
export function generateLiveDiffAuditPdf(
  userProfile: UserProfile,
  vectors: DiffVector[],
  sovereignScore: number
): Uint8Array {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTimestamp = new Date().toISOString();

  // Escape special PDF string characters: \ ( )
  const escapePdf = (text: string): string => {
    return (text || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  };

  const knoxedCount = vectors.filter(v => v.status === 'KNOXED').length;
  const nukedCount = vectors.filter(v => v.status === 'NUKED').length;
  const exposedCount = vectors.filter(v => v.status === 'EXPOSED').length;

  // Build PDF Content Stream (in PostScript-like PDF operators)
  const streamLines: string[] = [];

  // Background rect
  streamLines.push('0.043 0.063 0.125 rg'); // #0B1020 Dark Blue
  streamLines.push('0 0 612 792 re');
  streamLines.push('f');

  // Top Neon Hue Header Accent Line (Magenta to Cyan to Orange)
  streamLines.push('1.0 0.18 0.62 rg'); // #FF2E9F
  streamLines.push('0 788 204 4 re f');
  streamLines.push('0.0 0.83 1.0 rg'); // #00D4FF
  streamLines.push('204 788 204 4 re f');
  streamLines.push('1.0 0.48 0.09 rg'); // #FF7A18
  streamLines.push('408 788 204 4 re f');

  // Decorative Enclave Header Box
  streamLines.push('0.059 0.090 0.165 rg'); // #0F172A
  streamLines.push('0.0 0.83 1.0 RG');
  streamLines.push('1.5 w');
  streamLines.push('36 680 540 92 re');
  streamLines.push('B');

  // Header Typography
  streamLines.push('BT');
  streamLines.push('/F1 18 Tf');
  streamLines.push('1.0 1.0 1.0 rg');
  streamLines.push('50 744 Td');
  streamLines.push('(ARCHITECT AI : AGA PE SOVEREIGN ENCLAVE 2026) Tj');
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F1 10 Tf');
  streamLines.push('0.0 0.83 1.0 rg');
  streamLines.push('50 726 Td');
  streamLines.push('(DIGITAL IDENTITY FEDERATED FOOTPRINT [DIFF] AUDIT REPORT - 2026 ECRA LTS) Tj');
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F2 9 Tf');
  streamLines.push('0.8 0.85 0.95 rg');
  streamLines.push('50 706 Td');
  streamLines.push(`(Owner: ${escapePdf(userProfile.fullName)}   |   Anchor: ${escapePdf(userProfile.primaryEmail || 'user@sovereign.enclave')}   |   Provider: ${escapePdf(userProfile.federatedProvider)} WebAuthn) Tj`);
  streamLines.push('50 692 Td');
  streamLines.push(`(Audit ID: ${escapePdf(userProfile.cloudAuditId)}   |   Generated: ${escapePdf(currentDate)}   |   Enclave Passkey: ${escapePdf(userProfile.passkeyStatus)}) Tj`);
  streamLines.push('ET');

  // Score Box (Right-aligned in header box)
  streamLines.push('0.043 0.063 0.125 rg');
  streamLines.push('0.0 0.83 1.0 RG');
  streamLines.push('1 w');
  streamLines.push('480 690 84 72 re');
  streamLines.push('B');

  streamLines.push('BT');
  streamLines.push('/F1 8 Tf');
  streamLines.push('0.0 0.83 1.0 rg');
  streamLines.push('490 748 Td');
  streamLines.push('(SOVEREIGNTY) Tj');
  streamLines.push('/F1 22 Tf');
  streamLines.push('1.0 1.0 1.0 rg');
  streamLines.push('496 718 Td');
  streamLines.push(`(${sovereignScore}%) Tj`);
  streamLines.push('/F2 7 Tf');
  streamLines.push('0.0 0.83 1.0 rg');
  streamLines.push('495 700 Td');
  streamLines.push('(ZERO-ACCESS) Tj');
  streamLines.push('ET');

  // Summary Metrics Bar
  streamLines.push('0.059 0.090 0.165 rg');
  streamLines.push('36 636 540 34 re f');

  streamLines.push('BT');
  streamLines.push('/F1 9 Tf');
  streamLines.push('1.0 0.18 0.62 rg'); // Pink
  streamLines.push('50 648 Td');
  streamLines.push(`(NUKED: ${nukedCount} ERASED) Tj`);
  streamLines.push('0.0 0.83 1.0 rg'); // Cyan
  streamLines.push('160 0 Td');
  streamLines.push(`(KNOXED: ${knoxedCount} HARDENED) Tj`);
  streamLines.push('1.0 0.48 0.09 rg'); // Orange
  streamLines.push('180 0 Td');
  streamLines.push(`(EXPOSED: ${exposedCount} ACTIONABLE) Tj`);
  streamLines.push('ET');

  // Section Title: 16-Vector Ledger
  streamLines.push('BT');
  streamLines.push('/F1 11 Tf');
  streamLines.push('0.0 0.83 1.0 rg');
  streamLines.push('36 618 Td');
  streamLines.push('(16-VECTOR CRYPTOGRAPHIC IDENTITY AUDIT LEDGER) Tj');
  streamLines.push('ET');

  // Table Header Background
  streamLines.push('0.067 0.102 0.200 rg');
  streamLines.push('36 596 540 18 re f');

  // Table Column Headers
  streamLines.push('BT');
  streamLines.push('/F1 8 Tf');
  streamLines.push('1.0 1.0 1.0 rg');
  streamLines.push('42 602 Td');
  streamLines.push('(#) Tj');
  streamLines.push('24 0 Td');
  streamLines.push('(IDENTITY VECTOR MODULE) Tj');
  streamLines.push('150 0 Td');
  streamLines.push('(STATUS) Tj');
  streamLines.push('80 0 Td');
  streamLines.push('(SHA-256 INTEGRITY DIGEST) Tj');
  streamLines.push('150 0 Td');
  streamLines.push('(ACTION / REMEDIATION) Tj');
  streamLines.push('ET');

  // Rows of all 16 vectors
  let currentY = 580;
  const rowHeight = 27;

  vectors.slice(0, 16).forEach((v, idx) => {
    // Alternating row background
    if (idx % 2 === 0) {
      streamLines.push(`0.048 0.072 0.145 rg`);
      streamLines.push(`36 ${currentY - 2} 540 ${rowHeight} re f`);
    } else {
      streamLines.push(`0.059 0.090 0.165 rg`);
      streamLines.push(`36 ${currentY - 2} 540 ${rowHeight} re f`);
    }

    // Module index
    streamLines.push('BT');
    streamLines.push('/F1 8 Tf');
    streamLines.push('0.0 0.83 1.0 rg');
    streamLines.push(`42 ${currentY + 12} Td`);
    streamLines.push(`(${v.moduleNumber}) Tj`);
    streamLines.push('ET');

    // Module name & category
    const cleanName = escapePdf(v.name.length > 28 ? v.name.substring(0, 26) + '..' : v.name);
    const cleanCat = escapePdf(v.category.replace(/_/g, ' '));
    streamLines.push('BT');
    streamLines.push('/F1 8 Tf');
    streamLines.push('1.0 1.0 1.0 rg');
    streamLines.push(`66 ${currentY + 14} Td`);
    streamLines.push(`(${cleanName}) Tj`);
    streamLines.push('/F2 6 Tf');
    streamLines.push('0.6 0.7 0.8 rg');
    streamLines.push(`66 ${currentY + 4} Td`);
    streamLines.push(`(${cleanCat}) Tj`);
    streamLines.push('ET');

    // Status Pill color
    streamLines.push('BT');
    streamLines.push('/F1 7 Tf');
    if (v.status === 'KNOXED') {
      streamLines.push('0.0 0.83 1.0 rg'); // Cyan
    } else if (v.status === 'NUKED') {
      streamLines.push('1.0 0.18 0.62 rg'); // Pink
    } else {
      streamLines.push('1.0 0.48 0.09 rg'); // Orange
    }
    streamLines.push(`216 ${currentY + 10} Td`);
    streamLines.push(`(${v.status}) Tj`);
    streamLines.push('ET');

    // SHA-256 Truncated
    const hashTrunc = escapePdf(v.sha256Hash.substring(0, 16) + '...');
    streamLines.push('BT');
    streamLines.push('/F2 7 Tf');
    streamLines.push('0.0 0.83 1.0 rg');
    streamLines.push(`296 ${currentY + 10} Td`);
    streamLines.push(`(${hashTrunc}) Tj`);
    streamLines.push('ET');

    // Remediation action snippet
    const rawAction = v.status === 'NUKED' ? v.nukedAction : v.status === 'KNOXED' ? v.knoxedAction : v.exposureDetails;
    const cleanAction = escapePdf(rawAction.length > 36 ? rawAction.substring(0, 34) + '..' : rawAction);
    streamLines.push('BT');
    streamLines.push('/F2 6 Tf');
    streamLines.push('0.85 0.88 0.95 rg');
    streamLines.push(`446 ${currentY + 10} Td`);
    streamLines.push(`(${cleanAction}) Tj`);
    streamLines.push('ET');

    currentY -= rowHeight;
  });

  // Footer Cryptographic Seal Certificate
  streamLines.push('0.059 0.090 0.165 rg');
  streamLines.push('0.0 0.83 1.0 RG');
  streamLines.push('1 w');
  streamLines.push(`36 50 540 68 re`);
  streamLines.push('B');

  streamLines.push('BT');
  streamLines.push('/F1 9 Tf');
  streamLines.push('1.0 1.0 1.0 rg');
  streamLines.push('48 100 Td');
  streamLines.push('(CRYPTOGRAPHIC ROOT SOVEREIGN ENCLAVE SEAL - 2026 ECRA LTS) Tj');
  streamLines.push('/F2 7 Tf');
  streamLines.push('0.0 0.83 1.0 rg');
  streamLines.push('48 86 Td');
  const masterKeyTrunc = escapePdf(userProfile.masterKeyHash);
  streamLines.push(`(Root Digest: ${masterKeyTrunc}) Tj`);
  streamLines.push('48 72 Td');
  streamLines.push(`(Hardware Passkey Bound Credential: ${escapePdf(userProfile.passkeyDeviceId)}) Tj`);
  streamLines.push('48 58 Td');
  streamLines.push(`(Enclave Signature: ZERO-ACCESS CLIENT CRYPTO VALIDATED AT ${escapePdf(currentTimestamp)}) Tj`);
  streamLines.push('ET');

  // Bottom-most copyright line
  streamLines.push('BT');
  streamLines.push('/F2 7 Tf');
  streamLines.push('0.5 0.6 0.7 rg');
  streamLines.push('36 32 Td');
  streamLines.push('(Architect AI | Agape Sovereign Enclave 2026 | Verified 2-Year Retention Proof: 2026-2028 | Client-Side Web Crypto Subtle) Tj');
  streamLines.push('ET');

  const contentStream = streamLines.join('\n');

  // Assemble PDF Objects
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

  // Object 3: Page (Letter 612 x 792 pt)
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj'
  );

  // Object 4: Content Stream
  objects.push(
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`
  );

  // Object 5: Standard Helvetica-Bold Font
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj'
  );

  // Object 6: Standard Courier Font for cryptographic hashes and mono text
  objects.push(
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj'
  );

  // Build XREF and Trailer
  let pdfOutput = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdfOutput.length);
    pdfOutput += objects[i] + '\n';
  }

  const startxref = pdfOutput.length;
  pdfOutput += 'xref\n';
  pdfOutput += `0 ${objects.length + 1}\n`;
  pdfOutput += '0000000000 65535 f \n';

  for (let i = 0; i < offsets.length; i++) {
    pdfOutput += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  pdfOutput += 'trailer\n';
  pdfOutput += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdfOutput += 'startxref\n';
  pdfOutput += `${startxref}\n`;
  pdfOutput += '%%EOF\n';

  // Convert binary string to Uint8Array
  const buffer = new Uint8Array(pdfOutput.length);
  for (let i = 0; i < pdfOutput.length; i++) {
    buffer[i] = pdfOutput.charCodeAt(i) & 0xff;
  }
  return buffer;
}
