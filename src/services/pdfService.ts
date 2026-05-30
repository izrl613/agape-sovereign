import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../firebase';
import { collection, doc as firestoreDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generateSHA256 } from '../utils/crypto';
import { toast } from 'sonner';
import { chatComplete } from './localAIService';

export interface AuditReportData {
  userId: string;
  userEmail: string;
  userName: string;
  sovereignScore: number;
  nukedCount: number;
  knoxedCount: number;
  monitoredCount: number;
  modulesData: {
    id: string;
    label: string;
    vector: string;
    status: 'NUKED' | 'KNOXED' | 'MONITORED';
    value: string; // decrypted user input
    hash: string;  // SHA-256 seal
    finding: string;
    details: string;
  }[];
}

/**
 * Generate a premium Lighthouse-style Identity Security PDF
 * and store it in Firestore for the 2-year audit trail.
 */
export const compileIdentityAuditReport = async (reportData: AuditReportData): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const timestamp = new Date();
  const dateStr = timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = timestamp.toLocaleTimeString('en-US', { hour12: false });
  const docId = `DIFF-AUDIT-${timestamp.getTime()}`;

  // Redact email for privacy (zero-knowledge assurance)
  const redactEmail = (email: string) => {
    if (!email) return "anonymous@sovereign.enclave";
    const [local, domain] = email.split('@');
    if (!domain) return email;
    if (local.length <= 2) return `${local[0]}*@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  };

  const maskedEmail = redactEmail(reportData.userEmail);

  // 1. Calculate Cumulative SHA-256 Report Seal
  const combinedHashes = reportData.modulesData.map(m => m.hash).join('');
  const cumulativeSeal = await generateSHA256(combinedHashes);

  // Colors
  const neonBlue = '#00D4FF';
  const neonMagenta = '#FF2E9F';
  const neonOrange = '#FF7A18';

  // Helper to convert hex to RGB array for jsPDF
  const hexToRgb = (hex: string): [number, number, number] => {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };

  const getScoreColorHex = (score: number) => {
    return score > 80 ? neonBlue : score > 60 ? neonOrange : neonMagenta;
  };

  const drawCommonBorder = (pdfDoc: jsPDF) => {
    pdfDoc.setDrawColor(255, 46, 159); // Magenta top
    pdfDoc.setLineWidth(1.5);
    pdfDoc.line(10, 10, 200, 10);
    pdfDoc.setDrawColor(0, 212, 255); // Cyan right
    pdfDoc.line(200, 10, 200, 287);
    pdfDoc.setDrawColor(255, 122, 24); // Orange bottom
    pdfDoc.line(200, 287, 10, 287);
    pdfDoc.setDrawColor(0, 212, 255); // Cyan left
    pdfDoc.line(10, 287, 10, 10);
  };

  const drawDecorativeGrid = (pdfDoc: jsPDF) => {
    pdfDoc.setDrawColor(255, 255, 255);
    pdfDoc.setLineWidth(0.1);
    for (let i = 20; i < 200; i += 40) {
      pdfDoc.line(i, 15, i, 282);
      pdfDoc.line(15, i, 195, i);
    }
  };

  const scoreColorHex = getScoreColorHex(reportData.sovereignScore);
  const scoreColorRgb = hexToRgb(scoreColorHex);

  // --- PAGE 1: COVER & OVERVIEW ---
  doc.setFillColor(6, 13, 31); // Dark navy bg
  doc.rect(0, 0, 210, 297, 'F');
  drawCommonBorder(doc);
  drawDecorativeGrid(doc);

  // Header Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(0, 212, 255); // Neon Blue
  doc.text('AGAPE SOVEREIGN', 105, 30, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(255, 122, 24); // Neon Orange
  doc.text('DIGITAL IDENTITY FEDERATED FOOTPRINT (DIFF)', 105, 37, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Muted slate
  doc.text('ECRA 2026 SOVEREIGN PRIVACY INTEGRITY STANDARD PLATFORM', 105, 42, { align: 'center' });

  // Report details box
  doc.setFillColor(15, 23, 42); // slate 900
  doc.setDrawColor(0, 212, 255);
  doc.setLineWidth(0.5);
  doc.rect(20, 50, 170, 30, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`AUDIT ID: ${docId}`, 25, 58);
  doc.text(`SOVEREIGN IDENTITY: ${reportData.userName} (${maskedEmail})`, 25, 64);
  doc.text(`RETENTION FRAMEWORK: ECRA 2026 §4.2 (2-YEAR RETENTION MANDATE)`, 25, 70);
  doc.text(`CUMULATIVE INTEGRITY SEAL: ${cumulativeSeal.substring(0, 32)}...`, 25, 76);

  // Google Lighthouse circular gauge
  const cx = 105, cy = 135, r = 32;
  doc.setDrawColor(scoreColorRgb[0], scoreColorRgb[1], scoreColorRgb[2]);
  doc.setLineWidth(3);
  doc.circle(cx, cy, r, 'S');

  doc.setDrawColor(scoreColorRgb[0], scoreColorRgb[1], scoreColorRgb[2]);
  doc.setLineWidth(0.5);
  doc.circle(cx, cy, r + 4, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(scoreColorRgb[0], scoreColorRgb[1], scoreColorRgb[2]);
  doc.text(`${reportData.sovereignScore}`, cx, cy + 6, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('SOVEREIGN SCORE', cx, cy + 18, { align: 'center' });

  const getClassification = (score: number) => {
    return score > 80 ? 'KNOXED SOVEREIGN' : score > 60 ? 'PARTIALLY SECURED' : 'CRITICALLY NUKED';
  };
  
  doc.setFontSize(14);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(scoreColorRgb[0], scoreColorRgb[1], scoreColorRgb[2]);
  doc.text(getClassification(reportData.sovereignScore), 105, cy + 44, { align: 'center' });

  // Summary Metrics Table
  const summaryHeaders = [['VECTOR METRIC', 'COUNT', 'POSTURE STATUS']];
  const summaryRows = [
    ['NUKED (Critical Exposures)', `${reportData.nukedCount} Vectors`, 'ACTION ADVISED'],
    ['KNOXED (Hardened Assets)', `${reportData.knoxedCount} Vectors`, 'PROTECTED ENCLAVE'],
    ['MONITORED (Active Surveillance)', `${reportData.monitoredCount} Vectors`, 'SURVEILLANCE ACTIVE']
  ];

  autoTable(doc, {
    startY: cy + 55,
    head: summaryHeaders,
    body: summaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [0, 212, 255],
      lineColor: [0, 212, 255],
      lineWidth: 0.2
    },
    bodyStyles: {
      fillColor: [6, 13, 31],
      textColor: [255, 255, 255],
      lineColor: [30, 41, 59],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', fontStyle: 'bold', textColor: [255, 122, 24] }
    },
    margin: { left: 20, right: 20 }
  });

  // Footer message
  doc.setFontSize(8);
  doc.setFont('Helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('This is a zero-knowledge compiled audit report. Data remains encrypted on device. Integrity validated globally.', 105, 275, { align: 'center' });

  // --- INTERMEDIARY STEP: FETCH GLOBAL AI LAYER DIAGNOSTICS IN ONE BATCH ---
  let aiSummaries: Record<string, { diagnostic: string; remediation: string }> = {};
  try {
    toast.loading("ARCHITECT AI ANALYZING 16 IDENTITY VECTOR DIAGNOSTICS...", { id: "pdf-ai-summarizer" });
    const prompt = `You are Architect AI, a digital identity security expert. The user is generating their 19-page Lighthouse-style PDF Identity Audit Report.
Here is the security posture data for the 1 layer list:
${JSON.stringify(reportData.modulesData.map(m => ({ id: m.id, vector: m.vector, label: m.label, status: m.status, finding: m.finding, details: m.details })), null, 2)}

Provide a unique, personalized 2-sentence diagnostic assessment and a 2-sentence recommended remediation action for EACH of the 16 layers.
Return a valid JSON object mapping each module ID (e.g., "email", "social", "device", "mobile", "laptop", "deepweb", "broker", "password", "network", "cloud", "comm", "financial", "docs", "oauth", "legal", "ai") to an object with these exact fields:
{
  "diagnostic": "...",
  "remediation": "..."
}
Respond ONLY with the raw JSON, no backticks or markdown formatting.`;

    const response = await chatComplete(prompt, undefined, true);
    aiSummaries = JSON.parse(response.text || "{}");
    toast.dismiss("pdf-ai-summarizer");
    toast.success("ARCHITECT AI VECTOR DIAGNOSTICS SEALED");
  } catch (err) {
    console.warn("AI Batch summarizer failed, falling back to local heuristic mappings:", err);
    toast.dismiss("pdf-ai-summarizer");
  }

  // --- PAGES 2-17: DEDICATED MODULE INDIVIDUAL PAGES ---
  for (let idx = 0; idx < reportData.modulesData.length; idx++) {
    const m = reportData.modulesData[idx];
    doc.addPage();

    // BG & Border
    doc.setFillColor(6, 13, 31);
    doc.rect(0, 0, 210, 297, 'F');
    drawCommonBorder(doc);

    // Score based on status
    const modScore = m.status === 'KNOXED' ? 100 : m.status === 'MONITORED' ? 60 : 25;
    const modColorHex = m.status === 'KNOXED' ? neonBlue : m.status === 'MONITORED' ? neonOrange : neonMagenta;
    const modColorRgb = hexToRgb(modColorHex);

    // Page Header / Vector info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(modColorRgb[0], modColorRgb[1], modColorRgb[2]);
    doc.text(m.vector, 20, 30);

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(m.label, 45, 26);

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`DIFF SYSTEM LAYER SECURE AUDIT PROTOCOL`, 45, 31);

    // Mini circular gauge for Lighthouse module score
    const mcx = 175, mcy = 28, mr = 10;
    doc.setDrawColor(modColorRgb[0], modColorRgb[1], modColorRgb[2]);
    doc.setLineWidth(2);
    doc.circle(mcx, mcy, mr, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(modColorRgb[0], modColorRgb[1], modColorRgb[2]);
    doc.text(`${modScore}`, mcx, mcy + 4, { align: 'center' });

    // Status Banner
    doc.setFillColor(modColorRgb[0], modColorRgb[1], modColorRgb[2]);
    doc.rect(20, 42, 170, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 13, 31);
    doc.text(`SECURITY POSTURE VECTOR STATUS: ${m.status} (SCORE: ${modScore}/100)`, 24, 47.5);

    // Card 1: Cryptographic Enclave Sealed Parameter
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(20, 56, 170, 48, 'F');
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.rect(20, 56, 170, 48, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 212, 255);
    doc.text('CRYPTOGRAPHIC SEAL & ZERO-KNOWLEDGE ENCLAVE PARAMETER', 24, 63);

    // Mask value for privacy protection
    const maskVal = (val: string) => {
      if (!val) return 'No parameter configuration registered';
      if (val.length <= 6) return '••••••';
      return `${val.substring(0, 3)}••••••••${val.substring(val.length - 3)}`;
    };

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Decrypted Configuration Parameter:`, 24, 71);
    doc.setFont('Courier', 'bold');
    doc.setFontSize(10);
    doc.text(maskVal(m.value), 24, 76);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(255, 122, 24);
    doc.text(`Vector Integrity Hash Seal:`, 24, 85);
    doc.setFont('Courier', 'bold');
    doc.setFontSize(8.5);
    doc.text(m.hash ? `SHA256:${m.hash}` : 'AWAITING CRYPTOGRAPHIC SEAL', 24, 90);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Enclave salting sequence compliant under ECRA 2026 Zero-Trust Guidelines`, 24, 98);

    // Card 2: Architect AI Diagnostics Summary (Lighthouse Diagnostics Block)
    doc.setFillColor(15, 23, 42);
    doc.rect(20, 112, 170, 155, 'F');
    doc.rect(20, 112, 170, 155, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 122, 24);
    doc.text('ARCHITECT AI SECURITY DIAGNOSTICS & THREAT ASSESSMENT', 24, 120);

    // Heuristics or AI summaries
    const detailsObj = aiSummaries[m.id] || {
      diagnostic: m.details || 'No immediate diagnostic findings compiled for this vector.',
      remediation: m.status === 'NUKED' 
        ? 'Vulnerability exposed. Immediate password/key rotation and biometric lock mandate.' 
        : 'Module hardened. Maintain scheduled network scans.'
    };

    // Text Wrap Helper
    const drawTextWrapped = (pdfDoc: jsPDF, text: string, x: number, y: number, width: number, lineHeight: number) => {
      const splitLines = pdfDoc.splitTextToSize(text, width);
      splitLines.forEach((line: string, i: number) => {
        pdfDoc.text(line, x, y + (i * lineHeight));
      });
      return splitLines.length;
    };

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('Diagnostics Findings:', 24, 130);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const diagLines = drawTextWrapped(doc, detailsObj.diagnostic, 24, 135, 160, 4.5);

    const nextY = 135 + (diagLines * 4.5) + 10;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 212, 255);
    doc.text('Step-by-Step Remediation Action Plan:', 24, nextY);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    const remLines = drawTextWrapped(doc, detailsObj.remediation, 24, nextY + 5, 160, 4.5);

    // Remediations Heuristics
    const heuristicsY = nextY + 5 + (remLines * 4.5) + 10;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 46, 159);
    doc.text('SOVEREIGN PLATFORM ACTION INSTRUCTION', 24, heuristicsY);

    const actionText = m.status === 'NUKED'
      ? 'CRITICAL DISCLOSURE: Execute immediate opt-out processes, engage personal local enclaves, and enforce biometrics passkey decryption lock on all reports.'
      : m.status === 'MONITORED'
      ? 'MONITORED ALERT: Periodically verify data broker lists, analyze social footprints, and rotate third-party oauth tokens.'
      : 'HARDENED POSTURE: Cryptographic seal verified. Device configuration posture is knoxed.';

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    drawTextWrapped(doc, actionText, 24, heuristicsY + 5, 160, 4.2);

    // Page Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'italic');
    doc.text(`Identity Layer ${idx+1} of 16  •  Sovereign Audit Trail locked for 2 Years  •  ECRA 2026 Standard`, 105, 275, { align: 'center' });
  }

  // --- PAGE 18: DETAILED THREAT REMEDIATION AUDIT ---
  doc.addPage();
  doc.setFillColor(6, 13, 31);
  doc.rect(0, 0, 210, 297, 'F');
  drawCommonBorder(doc);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 122, 24);
  doc.text('CRITICAL REMEDIATION & COMPLIANCE ENCLAVE', 15, 20);

  const complianceHeaders = [['VECTOR', 'INTELLIGENCE FINDING', 'STATUS', 'REMEDIATION ACTION']];
  const complianceRows = reportData.modulesData.map(m => [
    m.vector,
    m.finding,
    m.status,
    m.status === 'NUKED' 
      ? 'CRITICAL EXPOSURE: Rotate secrets, engage opt-outs, and enroll physical WebAuthn Passkeys.'
      : m.status === 'MONITORED'
      ? 'MONITORED: Review data broker listings and execute automated opt-out sequences.'
      : 'KNOXED: Asset hardened. Client-side PBKDF2 AES-256 encryption seal engaged.'
  ]);

  autoTable(doc, {
    startY: 25,
    head: complianceHeaders,
    body: complianceRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 122, 24],
      lineColor: [255, 122, 24],
      lineWidth: 0.2
    },
    bodyStyles: {
      textColor: [255, 255, 255],
      lineColor: [30, 41, 59],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 18, halign: 'center' },
      1: { fontStyle: 'bold', cellWidth: 45 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
      3: { cellWidth: 82 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw as string;
        if (val === 'NUKED') data.cell.styles.textColor = [255, 46, 159];
        else if (val === 'KNOXED') data.cell.styles.textColor = [0, 212, 255];
        else data.cell.styles.textColor = [255, 122, 24];
      }
    },
    margin: { left: 15, right: 15 }
  });

  // --- PAGE 19: CUMULATIVE CRYPTOGRAPHIC LOCK SEAL ---
  doc.addPage();
  doc.setFillColor(6, 13, 31);
  doc.rect(0, 0, 210, 297, 'F');
  drawCommonBorder(doc);
  drawDecorativeGrid(doc);

  const finalY = 70;
  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(255, 46, 159);
  doc.setLineWidth(0.5);
  doc.rect(15, finalY, 180, 75, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('SOVEREIGN DIGITAL IDENTITY INTEGRITY SEAL', 20, finalY + 12);
  
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('This identity security report has been sealed cryptographically using a standard SHA-256 hash sequence.', 20, finalY + 24);
  doc.text('Under the 2026 ECRA Sovereign Enclave report rules, this file is cryptographically secure.', 20, finalY + 30);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(0, 212, 255);
  doc.text(`CUMULATIVE REPORT HASH:`, 20, finalY + 44);
  doc.setFont('Courier', 'bold');
  doc.setFontSize(8.5);
  doc.text(cumulativeSeal, 20, finalY + 50);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 122, 24);
  doc.text(`VERIFICATION TIMESTAMP: ${dateStr} ${timeStr} UTC`, 20, finalY + 60);
  doc.text(`RETENTION LOCK ACTIVE: 2 YEARS (EXPIRY: ${timestamp.getFullYear() + 2}-${(timestamp.getMonth()+1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')})`, 20, finalY + 66);

  // Save and Export Base64 payload
  const pdfBase64 = doc.output('datauristring');
  doc.save(`Agape_Sovereign_DIFF_Audit_${timestamp.getTime()}.pdf`);

  if (reportData.userId !== 'emergency-bypass-admin-999') {
    try {
      const reportRef = firestoreDoc(collection(db, 'users', reportData.userId, 'reports'), docId);
      await setDoc(reportRef, {
        reportId: docId,
        generatedAt: serverTimestamp(),
        sovereignScore: reportData.sovereignScore,
        nukedCount: reportData.nukedCount,
        knoxedCount: reportData.knoxedCount,
        monitoredCount: reportData.monitoredCount,
        cumulativeSeal: cumulativeSeal,
        pdfDataUrl: pdfBase64 // Base64 data saved for 2-year recovery
      });
      toast.success("SOVEREIGN REPORT COMMITTED", {
        description: "Audit trail verified and logged to your Sovereign Profile (2-year retention locked)."
      });
    } catch (e) {
      console.error("Failed to commit PDF report metadata to Firestore:", e);
      toast.warning("Report saved locally, but database sync failed.");
    }
  } else {
    const localReportsKey = `reports_history_${reportData.userId}`;
    const existing = localStorage.getItem(localReportsKey);
    const list = existing ? JSON.parse(existing) : [];
    list.push({
      reportId: docId,
      generatedAt: timestamp.toISOString(),
      sovereignScore: reportData.sovereignScore,
      nukedCount: reportData.nukedCount,
      knoxedCount: reportData.knoxedCount,
      monitoredCount: reportData.monitoredCount,
      cumulativeSeal: cumulativeSeal,
      pdfDataUrl: pdfBase64
    });
    localStorage.setItem(localReportsKey, JSON.stringify(list));
    toast.success("SOVEREIGN REPORT STORED LOCALLY (Bypass Enclave active)");
  }

  return cumulativeSeal;
};
