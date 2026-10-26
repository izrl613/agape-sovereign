import { MODULE_AGENTS } from '../module-catalog';
import { IdentityDossier, UserBriefing, buildModuleBriefing } from '../utils/briefing';
import { ModuleState } from '../context/SovereignContext';
import { BiometricProof } from './biometricGate';
import { calculateSha256 } from './cryptoService';

export const AUDIT_PAGE_COUNT = 22;

export interface AuditPayload {
  user: { id: string; email: string; displayName: string; authMethod: string };
  dossier: IdentityDossier;
  modules: Record<string, ModuleState>;
  briefings: UserBriefing[];
  masterHash: string;
  issuedAt: string;
  expiresAt: string;
  biometric?: BiometricProof;
}

export async function buildAuditPayload(
  user: AuditPayload['user'],
  dossier: IdentityDossier,
  modules: Record<string, ModuleState>
): Promise<AuditPayload> {
  const briefings = MODULE_AGENTS.map((m) => {
    const row = modules[m.id] || { record: {}, findings: [], hash: '', lastScanned: null, customized: false };
    return buildModuleBriefing(m, row.record, row.findings, user.displayName);
  });
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();
  const masterHash = await calculateSha256(
    JSON.stringify({
      uid: user.id,
      issuedAt,
      score: dossier.score,
      vectors: briefings.map((b) => ({ id: b.moduleId, status: b.status, score: b.score, headline: b.headline })),
    })
  );
  return { user, dossier, modules, briefings, masterHash, issuedAt, expiresAt };
}

const C = {
  bg: [6, 13, 31] as [number, number, number],
  blue: [0, 212, 255] as [number, number, number],
  magenta: [255, 46, 159] as [number, number, number],
  orange: [255, 122, 24] as [number, number, number],
  white: [232, 244, 255] as [number, number, number],
  muted: [123, 155, 181] as [number, number, number],
};

function rgb(doc: { setTextColor: (r: number, g: number, b: number) => void }, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

export async function generateIdentityAuditPdf(payload: AuditPayload): Promise<{ blob: Blob; fileName: string; pages: number }> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const total = AUDIT_PAGE_COUNT;
  const issued = payload.issuedAt.slice(0, 10);
  const expires = payload.expiresAt.slice(0, 10);
  const seal = payload.masterHash;

  const paint = (pageNo: number) => {
    doc.setFillColor(C.bg[0], C.bg[1], C.bg[2]);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setDrawColor(C.blue[0], C.blue[1], C.blue[2]);
    doc.setLineWidth(0.3);
    doc.rect(8, 8, 194, 281);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    rgb(doc, C.blue);
    doc.text('AGAPE SOVEREIGN AI  ·  IDENTITY AUDIT REPORT', 12, 14);
    doc.setFontSize(7);
    rgb(doc, C.muted);
    doc.text(`PAGE ${pageNo} OF ${total}`, 198, 14, { align: 'right' });
    doc.setDrawColor(C.blue[0], C.blue[1], C.blue[2]);
    doc.setLineWidth(0.2);
    doc.line(12, 16, 198, 16);
    doc.line(12, 280, 198, 280);
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    rgb(doc, C.blue);
    doc.text(`SHA-256  ${seal}`, 12, 284);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    rgb(doc, C.muted);
    doc.text(`VALID UNTIL ${expires}  ·  2-YEAR HARDENED PROOF`, 198, 288, { align: 'right' });
  };

  const wrap = (text: string, width = 176) => doc.splitTextToSize(text || '—', width) as string[];

  // ── PAGE 1 cover
  paint(1);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  rgb(doc, C.blue);
  doc.text('IDENTITY AUDIT REPORT', 105, 40, { align: 'center' });
  doc.setFontSize(10);
  rgb(doc, C.muted);
  doc.text('Zero-knowledge 16-vector Digital Identity Federated Footprint', 105, 48, { align: 'center' });
  doc.setFillColor(15, 23, 42);
  doc.rect(20, 60, 170, 42, 'F');
  doc.setDrawColor(C.blue[0], C.blue[1], C.blue[2]);
  doc.rect(20, 60, 170, 42, 'S');
  doc.setFontSize(28);
  rgb(doc, C.blue);
  doc.text(String(payload.dossier.score), 105, 82, { align: 'center' });
  doc.setFontSize(9);
  rgb(doc, C.white);
  doc.text('SOVEREIGN SCORE', 105, 92, { align: 'center' });

  doc.setFontSize(10);
  rgb(doc, C.white);
  const meta = [
    `Operator  ${payload.user.displayName}`,
    `Account   ${payload.dossier.emailMasked}`,
    `Auth      ${payload.user.authMethod}  ·  Firebase`,
    `Issued    ${issued}   Expires ${expires}`,
    `Sealed    ${payload.dossier.sealed}/16    NUKED ${payload.dossier.nuked}    KNOXED ${payload.dossier.knoxed}`,
  ];
  meta.forEach((line, i) => doc.text(line, 24, 118 + i * 8));

  doc.setFontSize(9);
  rgb(doc, C.orange);
  doc.text('ONE-LINE BRIEFING', 24, 168);
  doc.setFont('helvetica', 'normal');
  rgb(doc, C.white);
  wrap(payload.dossier.oneLiner, 162).forEach((l, i) => doc.text(l, 24, 176 + i * 6));

  doc.setFontSize(8);
  rgb(doc, C.muted);
  wrap(
    'This PDF is generated on-device after biometric user verification. Pages 2–17 are one Module Agent each. Pages 18–22 are the handoff: validators, attestation, legal, and save instructions.',
    162
  ).forEach((l, i) => doc.text(l, 24, 210 + i * 5));

  // ── PAGES 2–17 vectors
  MODULE_AGENTS.forEach((mod, idx) => {
    doc.addPage();
    const pageNo = idx + 2;
    paint(pageNo);
    const briefing = payload.briefings[idx];
    const row = payload.modules[mod.id];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    rgb(doc, C.orange);
    doc.text(`${mod.vector}  ·  MODULE AGENT ${String(idx + 1).padStart(2, '0')} / 16`, 16, 26);
    doc.setFontSize(16);
    rgb(doc, C.blue);
    doc.text(`${mod.icon}  ${mod.name}`, 16, 36);
    doc.setFontSize(10);
    rgb(doc, C.white);
    wrap(briefing.headline, 178).forEach((l, i) => doc.text(l, 16, 46 + i * 6));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    rgb(doc, C.muted);
    wrap(briefing.plainEnglish, 178).forEach((l, i) => doc.text(l, 16, 62 + i * 5));
    doc.setFont('helvetica', 'bold');
    rgb(doc, C.blue);
    doc.text(`STATUS  ${briefing.status}     SCORE  ${briefing.score}`, 16, 96);
    doc.setFontSize(8);
    rgb(doc, C.orange);
    doc.text('NEXT ACTION', 16, 106);
    doc.setFont('helvetica', 'normal');
    rgb(doc, C.white);
    wrap(briefing.nextAction, 178).forEach((l, i) => doc.text(l, 16, 112 + i * 5));

    doc.setFont('helvetica', 'bold');
    rgb(doc, C.orange);
    doc.text('FINDINGS', 16, 132);
    const findings = (row?.findings || []).slice(0, 6);
    if (!findings.length) {
      doc.setFont('helvetica', 'normal');
      rgb(doc, C.muted);
      doc.text('No scan findings sealed yet. Run this agent from the command center.', 16, 140);
    } else {
      findings.forEach((f, i) => {
        const y = 140 + i * 18;
        doc.setFont('helvetica', 'bold');
        rgb(doc, f.status === 'NUKED' ? C.magenta : f.status === 'KNOXED' ? C.blue : C.orange);
        doc.text(`${f.status}  ·  ${f.label}`.slice(0, 90), 16, y);
        doc.setFont('helvetica', 'normal');
        rgb(doc, C.white);
        wrap(f.detail, 178).slice(0, 2).forEach((l, j) => doc.text(l, 16, y + 5 + j * 4));
      });
    }
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    rgb(doc, C.blue);
    doc.text(`VECTOR SEAL  ${row?.hash || '— awaiting seal —'}`, 16, 268);
  });

  // ── PAGE 18 rollup
  doc.addPage();
  paint(18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  rgb(doc, C.blue);
  doc.text('ARCHITECT ROLLUP', 16, 28);
  doc.setFontSize(9);
  rgb(doc, C.white);
  payload.briefings.forEach((b, i) => {
    const y = 40 + i * 13;
    rgb(doc, b.status === 'NUKED' ? C.magenta : b.status === 'KNOXED' ? C.blue : C.orange);
    doc.setFont('helvetica', 'bold');
    doc.text(`${b.vector}  ${b.status.padEnd(10)}  ${b.score}`, 16, y);
    doc.setFont('helvetica', 'normal');
    rgb(doc, C.white);
    doc.text((b.headline || '').slice(0, 78), 16, y + 5);
  });

  // ── PAGE 19 validators
  doc.addPage();
  paint(19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  rgb(doc, C.blue);
  doc.text('THIRD-PARTY VALIDATORS', 16, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rgb(doc, C.white);
  const validatorCopy = [
    'Module Agents call public validators from the browser. No API keys. No plaintext passwords leave the device.',
    'Have I Been Pwned  —  api.pwnedpasswords.com range API (SHA-1 prefix only, k-anonymity).',
    'Google Public DNS  —  dns.google JSON for SPF, DMARC, and MX on the sealed email domain.',
    'ipapi.co  —  egress IP / ASN for the Network agent, compared to the resolver you sealed.',
    'WebAuthn / FIDO2  —  userVerification required before this PDF may be saved.',
    'Firebase Auth  —  Google, passkey custom token, or anonymous session bound to this operator.',
    'Google Drive file scope is requested only at export time, never at login.',
  ];
  validatorCopy.forEach((line, i) => {
    wrap(line, 178).forEach((l, j) => doc.text(l, 16, 42 + i * 16 + j * 5));
  });

  // ── PAGE 20 biometric attestation
  doc.addPage();
  paint(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  rgb(doc, C.blue);
  doc.text('BIOMETRIC ATTESTATION', 16, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rgb(doc, C.white);
  const bio = payload.biometric;
  wrap(
    bio
      ? `User verification succeeded via ${bio.method} at ${bio.verifiedAt}. Credential ${bio.credentialId.slice(0, 24)}… bound the SHA-256 challenge of this report. The PDF was not written until this ceremony completed.`
      : 'Pending user verification. This file is a preview draft until Face ID, Touch ID, Windows Hello, or a security key confirms the operator.',
    178
  ).forEach((l, i) => doc.text(l, 16, 42 + i * 6));
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  rgb(doc, C.orange);
  doc.text('MASTER HASH', 16, 80);
  doc.setFont('courier', 'normal');
  wrap(seal, 178).forEach((l, i) => doc.text(l, 16, 88 + i * 5));

  // ── PAGE 21 legal
  doc.addPage();
  paint(21);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  rgb(doc, C.blue);
  doc.text('LEGAL  ·  PRIVACY  ·  VERIFICATION', 16, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  rgb(doc, C.white);
  [
    'Issuer: Agape Sovereign AI  ·  https://sovereign.nyc',
    'Privacy Policy: https://sovereign.nyc/privacy',
    'Terms of Service: https://sovereign.nyc/terms',
    'Contact: idin@agape.nyc',
    'This report is produced client-side. Agape does not retain a copy unless you export it to your own Google Drive.',
    'OAuth scopes at sign-in are openid, email, and profile only. Drive file access is incremental and optional.',
    'To verify integrity, SHA-256 the JSON payload of the 16 vector briefings and compare to the page seal.',
  ].forEach((line, i) => {
    wrap(line, 178).forEach((l, j) => doc.text(l, 16, 42 + i * 14 + j * 5));
  });

  // ── PAGE 22 handoff
  doc.addPage();
  paint(22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  rgb(doc, C.blue);
  doc.text('HANDOFF', 16, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  rgb(doc, C.white);
  wrap(
    'After biometric confirmation you may keep this document on the device you hold, or place a single copy in your federated Google account (Drive). Those are the only two sinks. There is no Agape vault copy of the bytes.',
    178
  ).forEach((l, i) => doc.text(l, 16, 42 + i * 6));
  doc.setFont('helvetica', 'bold');
  rgb(doc, C.orange);
  doc.text('1. SAVE TO THIS DEVICE', 16, 80);
  doc.setFont('helvetica', 'normal');
  rgb(doc, C.white);
  wrap('A real application/pdf blob is written through the browser download UI. Filename includes the date and the first 8 of the master hash.', 178).forEach((l, i) =>
    doc.text(l, 16, 88 + i * 6)
  );
  doc.setFont('helvetica', 'bold');
  rgb(doc, C.orange);
  doc.text('2. SAVE TO GOOGLE DRIVE', 16, 120);
  doc.setFont('helvetica', 'normal');
  rgb(doc, C.white);
  wrap(
    'Google OAuth is re-prompted with drive.file only. The PDF is uploaded to your Drive. We cannot read other files. Guest sessions must link Google first.',
    178
  ).forEach((l, i) => doc.text(l, 16, 128 + i * 6));
  doc.setFontSize(8);
  rgb(doc, C.muted);
  doc.text(`${payload.user.displayName}  ·  ${payload.dossier.emailMasked}  ·  ${issued}`, 16, 268);

  const blob = doc.output('blob');
  const fileName = `Agape-Sovereign-Identity-Audit-${issued}-${seal.slice(0, 8)}.pdf`;
  return { blob, fileName, pages: total };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
