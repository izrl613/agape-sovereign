import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { DIFF_MODULES } from '../constants';

interface IVMData {
  [moduleId: string]: Record<string, any>;
}

interface ReportData {
  userId: string;
  userEmail: string;
  sovereignScore: number;
  tier: string;
  generatedAt: string;
  ivmData: IVMData;
  sha256Seal: string;
}

const SEVERITY_COLOR = {
  nuked: { r: 1, g: 0.18, b: 0.62 },
  knoxed: { r: 0, g: 0.83, b: 1 },
  monitored: { r: 1, g: 0.48, b: 0.09 },
};

async function loadFonts(pdfDoc: PDFDocument) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const obliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const boldObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  return { font, boldFont, obliqueFont, boldObliqueFont };
}

function drawGrid(page: any, margin: number, pageWidth: number, pageHeight: number) {
  const gridSize = 20;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(0.02, 0.05, 0.12),
  });

  for (let x = 0; x < pageWidth; x += gridSize) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: pageHeight },
      thickness: 0.15,
      color: rgb(0, 0.83, 1, 0.03),
    });
  }
  for (let y = 0; y < pageHeight; y += gridSize) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: pageWidth, y },
      thickness: 0.15,
      color: rgb(0, 0.83, 1, 0.03),
    });
  }
}

function drawGlowOrbs(page: any, pageWidth: number, pageHeight: number) {
  page.drawCircle({
    x: pageWidth * 0.15,
    y: pageHeight * 0.85,
    size: 120,
    color: rgb(0, 0.83, 1, 0.04),
    opacity: 0.5,
  });

  page.drawCircle({
    x: pageWidth * 0.85,
    y: pageHeight * 0.15,
    size: 100,
    color: rgb(1, 0.18, 0.62, 0.03),
    opacity: 0.5,
  });
}

async function drawCoverHeader(page: any, fonts: any, pageWidth: number, y: number, data: ReportData) {
  const { font, boldFont } = fonts;
  const centerX = pageWidth / 2;

  // Gradient top border
  for (let i = 0; i < 2; i++) {
    page.drawLine({
      start: { x: 40, y: y + i },
      end: { x: pageWidth - 40, y: y + i },
      thickness: 1,
      color: rgb(i === 0 ? 1 : 0, i === 0 ? 0.18 : 0.83, i === 0 ? 0.62 : 1),
      opacity: 1 - i * 0.3,
    });
  }

  // Logo
  page.drawText('AI', {
    x: centerX - 12,
    y: y + 15,
    size: 24,
    font: boldFont,
    color: rgb(0, 0.83, 1),
  });

  page.drawText('ARCHITECT AI', {
    x: centerX - 65,
    y: y - 15,
    size: 16,
    font: boldFont,
    color: rgb(0, 0.83, 1),
    characterSpacing: 4,
  });

  page.drawText('AGAPE SOVEREIGN ENCLAVE 2026', {
    x: centerX - 90,
    y: y - 35,
    size: 8,
    font: fonts.font,
    color: rgb(0.48, 0.61, 0.71),
    characterSpacing: 3,
  });

  page.drawText('ECRA 2026  ·  GDPR  ·  CCPA COMPLIANT', {
    x: centerX - 80,
    y: y - 50,
    size: 7,
    font: fonts.font,
    color: rgb(1, 0.48, 0.09),
    characterSpacing: 2,
  });

  return y - 70;
}

async function drawSovereignScore(page: any, fonts: any, pageWidth: number, y: number, score: number) {
  const { font, boldFont } = fonts;
  const centerX = pageWidth / 2;
  const r = 40;
  const cx = centerX;
  const cy = y - r - 10;
  const color = score > 75 ? rgb(0, 0.83, 1) : score > 50 ? rgb(1, 0.48, 0.09) : rgb(1, 0.18, 0.62);

  // Background circle
  page.drawCircle({
    x: cx,
    y: cy,
    size: r * 2,
    color: rgb(0.03, 0.07, 0.16),
    borderWidth: 1,
    borderColor: rgb(1, 1, 1, 0.05),
  });

  // Score text
  page.drawText(score.toString(), {
    x: cx - 12,
    y: cy + 8,
    size: 24,
    font: boldFont,
    color: rgb(1, 0.83, 0.48),
  });

  page.drawText('SOVEREIGN SCORE', {
    x: centerX - 40,
    y: cy - r - 30,
    size: 7,
    font: fonts.font,
    color: rgb(0.48, 0.61, 0.71),
    characterSpacing: 2,
  });

  return y - 100;
}

async function drawModuleGrid(page: any, fonts: any, margin: number, y: number, ivmData: any) {
  const { font, boldFont } = fonts;
  const pageWidth = 612;
  const colWidth = (pageWidth - 80) / 4;
  const rowHeight = 70;
  let yPos = y;
  let col = 0;

  for (const module of DIFF_MODULES) {
    if (col === 4) {
      col = 0;
      yPos -= rowHeight + 10;
    }

    const x = 40 + col * (colWidth + 5);
    const sev = module.severity;
    const sevColor = sev > 80 ? { r: 0, g: 0.83, b: 1 } : sev > 60 ? { r: 1, g: 0.48, b: 0.09 } : { r: 1, g: 0.18, b: 0.62 };

    // Card background
    page.drawRectangle({
      x,
      y: yPos,
      width: colWidth,
      height: rowHeight,
      color: rgb(0.03, 0.07, 0.16),
      borderWidth: 0.5,
      borderColor: rgb(0, 0.83, 1, 0.15),
    });

    // Icon
    page.drawText(DIFF_MODULES.find(m => m.id === module.id)?.icon || '⬡', {
      x: x + 8,
      y: yPos + rowHeight - 20,
      size: 14,
      color: rgb(sevColor.r, sevColor.g, sevColor.b),
    });

    // Label
    page.drawText(module.label, {
      x: x + 30,
      y: yPos + rowHeight - 18,
      size: 7,
      color: rgb(1, 1, 1),
    });

    // Progress bar
    const barWidth = colWidth - 40;
    page.drawRectangle({
      x: x + 8,
      y: yPos + 20,
      width: barWidth,
      height: 3,
      color: rgb(1, 1, 1, 0.06),
    });
    page.drawRectangle({
      x: x + 8,
      y: yPos + 20,
      width: barWidth * (module.severity / 100),
      height: 3,
      color: rgb(sevColor.r, sevColor.g, sevColor.b),
    });

    // Counts
    page.drawText(`🔥${module.nuked}  🛡️${module.knoxed}  👁️${module.monitored}`, {
      x: x + 8,
      y: yPos + 8,
      size: 6,
      color: rgb(1, 1, 1, 0.6),
    });

    // Severity %
    page.drawText(`${module.severity}%`, {
      x: x + colWidth - 20,
      y: yPos + rowHeight - 18,
      size: 8,
      color: rgb(sevColor.r, sevColor.g, sevColor.b),
    });

    col++;
  }

  return yPos - rowHeight - 20;
}

export async function generateSovereignAuditPDF(data: ReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.Letter);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const fonts = await loadFonts(pdfDoc);

  // Background
  drawGrid(page, 40, pageWidth, pageHeight);
  drawGlowOrbs(page, pageWidth, pageHeight);

  let y = pageHeight - 40;

  // Header
  y = await drawCoverHeader(page, fonts, pageWidth, y, data);

  // Sovereign Score
  y = await drawSovereignScore(page, fonts, 612, y, data.sovereignScore);

  // Tier
  page.drawText(`TIER: ${data.tier}`, {
    x: 40,
    y: y - 10,
    size: 10,
    font: fonts.boldFont,
    color: data.sovereignScore > 75 ? rgb(0, 0.83, 1) : data.sovereignScore > 50 ? rgb(1, 0.48, 0.09) : rgb(1, 0.18, 0.62),
  });

  // Module Grid
  await drawModuleGrid(page, { font: pdfDoc.embedFont(StandardFonts.Helvetica), boldFont: pdfDoc.embedFont(StandardFonts.HelveticaBold) }, 40, y - 30, data.ivmData);

  // SHA256 Seal
  page.drawText(`SHA-256 SEAL: ${data.sha256Seal}`, {
    x: 40,
    y: 40,
    size: 6,
    font: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    color: rgb(0.48, 0.61, 0.71),
  });

  page.drawText(`Generated: ${data.generatedAt}`, {
    x: 400,
    y: 40,
    size: 6,
    font: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    color: rgb(0.48, 0.61, 0.71),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function drawModuleDetailPage(pdfDoc: any, module: any, ivmData: any, fonts: any): Promise<void> {
  const page = pdfDoc.addPage([612, 792]);
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const { font, boldFont } = fonts;

  // Background
  drawGrid(page, 40, page.getWidth(), page.getHeight());

  let y = page.getHeight() - 40;

  // Header
  page.drawText(`${module.icon}  ${module.label}  (${module.vector})`, {
    x: 40,
    y: y - 20,
    size: 14,
    font: fonts.boldFont,
    color: rgb(0, 0.83, 1),
  });

  page.drawText(`${module.capability}`, {
    x: 40,
    y: y - 45,
    size: 9,
    font: await page.doc.embedFont(StandardFonts.HelveticaOblique),
    color: rgb(0.48, 0.61, 0.71),
  });

  // Severity bar
  const sev = module.severity;
  const sevColor = sev > 80 ? { r: 0, g: 0.83, b: 1 } : sev > 60 ? { r: 1, g: 0.48, b: 0.09 } : { r: 1, g: 0.18, b: 0.62 };
  page.drawRectangle({
    x: 40,
    y: y - 70,
    width: 500 * (module.severity / 100),
    height: 8,
    color: rgb(sevColor.r, sevColor.g, sevColor.b),
  });
  page.drawText(`${module.severity}%`, {
    x: 550,
    y: y - 72,
    size: 8,
    color: rgb(sevColor.r, sevColor.g, sevColor.b),
  });

  // IVM Data
  const moduleData = ivmData[module.id] || {};
  if (Object.keys(moduleData).length > 0) {
    page.drawText('USER DATA ENTRY:', {
      x: 40,
      y: y - 90,
      size: 9,
      font: fonts.boldFont,
      color: rgb(1, 0.48, 0.09),
    });

    let dy = y - 110;
    for (const [key, value] of Object.entries(moduleData)) {
      if (key === 'updatedAt' || key === 'updatedBy' || key === 'moduleId') continue;
      page.drawText(`${key}:`, {
        x: 50,
        y: dy,
        size: 8,
        font: await page.doc.embedFont(StandardFonts.HelveticaBold),
        color: rgb(1, 0.48, 0.09),
      });
      page.drawText(String(value), {
        x: 200,
        y: dy,
        size: 8,
        color: rgb(1, 1, 1),
      });
      dy -= 18;
    }
  }

  // Techniques
  let dy = y - 200;
  page.drawText('TECHNIQUES:', {
    x: 40,
    y: dy,
    size: 8,
    font: pdfDoc.embedFont(StandardFonts.HelveticaBold),
    color: rgb(1, 0.48, 0.09),
  });
  module.techniques.forEach((t: string, i: number) => {
    dy -= 16;
    page.drawText(`• ${t}`, {
      x: 50,
      y: dy,
      size: 7,
      color: rgb(0.48, 0.61, 0.71),
    });
  });
}

export async function generateFullAuditPDF(data: ReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadFonts(pdfDoc);

  // Cover page
  await generateSovereignAuditPDF(data);

  // Module detail pages
  for (const module of DIFF_MODULES) {
    await drawModuleDetailPage(pdfDoc, module, data.ivmData, fonts);
  }

  // SHA256 Seal page
  const sealPage = pdfDoc.addPage([612, 792]);
  const { width: pageWidth, height: pageHeight } = sealPage.getSize();
  const sealFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const sealFontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  drawGrid(sealPage, 40, pageWidth, pageHeight);

  sealPage.drawText('SHA-256 INTEGRITY SEAL', {
    x: 40,
    y: pageHeight - 100,
    size: 18,
    font: sealFont,
    color: rgb(0, 0.83, 1),
  });

  sealPage.drawText(data.sha256Seal, {
    x: 40,
    y: pageHeight - 150,
    size: 10,
    font: sealFontMono,
    color: rgb(1, 1, 1),
  });

  sealPage.drawText(`Document: ${data.userId}-${Date.now()}`, {
    x: 40,
    y: pageHeight - 200,
    size: 10,
    font: sealFont,
    color: rgb(0.48, 0.61, 0.71),
  });

  sealPage.drawText(`Generated: ${new Date().toISOString()}`, {
    x: 40,
    y: pageHeight - 220,
    size: 10,
    color: rgb(0.48, 0.61, 0.71),
  });

  sealPage.drawText(`Sovereign Score: ${data.sovereignScore}/100`, {
    x: 40,
    y: pageHeight - 240,
    size: 10,
    color: rgb(1, 0.48, 0.09),
  });

  sealPage.drawText(`Tier: ${data.tier}`, {
    x: 40,
    y: pageHeight - 260,
    size: 10,
    color: rgb(0.48, 0.61, 0.71),
  });

  const finalBytes = await pdfDoc.save();
  return finalBytes;
}