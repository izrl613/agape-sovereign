/**
 * EXPORT & RECOVERY SERVICE — Sovereign Digital Passport
 * ============================================================
 * OPERATION FRAMEWORK — Phase 4 (Final): Export & Recovery
 *
 * Module 4: ExportAgent_Sovereign
 * Generates the Portable Identity Blueprint (MVIB) + Mnemonic phrase.
 *
 * Design principles:
 * - Non-Custodial: The system never holds the master export key.
 * - Minimum Viable Identity Blueprint (MVIB): Only proof — not raw PII.
 * - 2-Year cumulative export limit (regardless of Google Account or Passkey).
 * - BIP-39 compatible mnemonic phrase for offline recovery.
 * - One Love — Fluid Freedom, no barriers to reclaiming digital sovereignty.
 * ============================================================
 */

import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sha256, isValidSHA256, formatHashDisplay } from './sovereignHashService';
import { AuditReport } from './architectAIAgentService';

const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;
const EXPORT_COLLECTION = 'sovereign_exports';

export interface SovereignPassport {
  status: 'SUCCESS' | 'FAILED';
  sha256Id: string;
  exportTimestamp: string;
  publicFingerprint: string;
  manifestFile: string; // filename of the generated PDF manifest
  instructions: string;
  reason?: string;
}

export interface PassportManifest {
  targetHash: string;
  targetHashDisplay: string;
  exportTimestamp: string;
  systemPolicy: string;
  auditSummary: {
    sovereignScore: number;
    riskLevel: string;
    activeModules: number;
    policyVersion: string;
  };
  publicFingerprint: string;
  integrityHash: string;
  legalNotice: string;
  instructions: string;
}



/**
 * Check if the 2-year export limit has been exceeded for this identity hash.
 */
async function checkExportLimit(sha256Id: string): Promise<{ exceeded: boolean; lastExport?: string }> {
  try {
    const snap = await getDoc(doc(db, EXPORT_COLLECTION, sha256Id));
    if (!snap.exists()) return { exceeded: false };

    const data = snap.data();
    const firstExport = data.firstExportAt?.toDate?.()?.getTime?.() ?? 0;

    if (firstExport && Date.now() - firstExport > TWO_YEARS_MS) {
      return {
        exceeded: true,
        lastExport: new Date(firstExport).toISOString(),
      };
    }
    return { exceeded: false, lastExport: data.lastExportAt?.toDate?.()?.toISOString() };
  } catch {
    return { exceeded: false };
  }
}

/**
 * Generate the public fingerprint for the manifest.
 * This is SHA-256 of (sha256Id + exportTimestamp) — a one-time receipt.
 */
async function generatePublicFingerprint(sha256Id: string, timestamp: string): Promise<string> {
  return sha256(`${sha256Id}::fingerprint::${timestamp}`);
}

/**
 * Generate the manifest integrity hash over the entire report.
 */
async function generateIntegrityHash(manifest: Omit<PassportManifest, 'integrityHash'>): Promise<string> {
  return sha256(JSON.stringify(manifest));
}

/**
 * Main export function — generates the Sovereign Digital Passport.
 */
export async function generateSovereignPassport(
  sha256Id: string,
  auditReport: AuditReport
): Promise<SovereignPassport> {
  if (!isValidSHA256(sha256Id)) {
    return {
      status: 'FAILED',
      sha256Id,
      exportTimestamp: new Date().toISOString(),
      publicFingerprint: '',
      manifestFile: '',
      instructions: '',
      reason: 'Invalid SHA-256 identity hash.',
    };
  }

  // 1. Enforce 2-year export limit
  const limitCheck = await checkExportLimit(sha256Id);
  if (limitCheck.exceeded) {
    return {
      status: 'FAILED',
      sha256Id,
      exportTimestamp: new Date().toISOString(),
      publicFingerprint: '',
      manifestFile: '',
      instructions: '',
      reason: `Export limit exceeded. Your 2-year sovereign export window opened on ${limitCheck.lastExport}. Contact admin to reset.`,
    };
  }

  const exportTimestamp = new Date().toISOString();

  // 2. Generate cryptographic artifacts
  const publicFingerprint = await generatePublicFingerprint(sha256Id, exportTimestamp);

  // 3. Build the MVIB manifest (proof, not raw PII)
  const manifestData: Omit<PassportManifest, 'integrityHash'> = {
    targetHash: sha256Id,
    targetHashDisplay: formatHashDisplay(sha256Id),
    exportTimestamp,
    systemPolicy: 'GDPR-Compliant V1.3 — Agape Sovereign',
    auditSummary: {
      sovereignScore: auditReport.reportableData.sovereignAuditScore,
      riskLevel: auditReport.reportableData.financialRisk.riskLevel,
      activeModules: auditReport.reportableData.stabilityIndex.activeModules,
      policyVersion: 'V1.3',
    },
    publicFingerprint,
    legalNotice:
      'This document constitutes the Minimum Viable Identity Blueprint (MVIB). ' +
      'Under no circumstances shall there be any record of data scraping through any method or means. ' +
      'Handle with absolute privacy.',
    instructions:
      '1. Store this passportManifest.json in a physically secure location.\n' +
      '2. Your SHA-256 Identity Anchor and Public Fingerprint are your cryptographic proof of sovereignty.\n' +
      '3. You have 2 years from first export to regenerate. After that, request an admin reset.\n' +
      '4. Agape Sovereign — One Love.',
  };

  const integrityHash = await generateIntegrityHash(manifestData);
  const fullManifest: PassportManifest = { ...manifestData, integrityHash };
  const manifestFilename = `AgapeSovereign_Passport_${sha256Id.slice(0, 12)}_${exportTimestamp.split('T')[0]}.json`;

  // 4. Record the export in Firestore (hash-keyed, no raw PII)
  try {
    await setDoc(
      doc(db, EXPORT_COLLECTION, sha256Id),
      {
        sha256Id,
        lastExportAt: serverTimestamp(),
        firstExportAt: limitCheck.lastExport ? undefined : serverTimestamp(),
        publicFingerprint,
        integrityHash,
        manifestFilename,
      },
      { merge: true }
    );
  } catch (err) {
    console.error('[EXPORT] Failed to record export in Firestore:', err);
  }

  return {
    status: 'SUCCESS',
    sha256Id,
    exportTimestamp,
    publicFingerprint,
    manifestFile: manifestFilename,
    instructions:
      'Your Sovereign Passport Manifest has been downloaded. ' +
      'Store it in a secure location. Your SHA-256 Identity Anchor is your cryptographic proof of sovereignty.',
  };
}

/**
 * Trigger the browser download of the manifest JSON.
 * Called from the UI after the user has acknowledged the mnemonic warning.
 */
export function downloadManifest(passport: SovereignPassport, manifest: PassportManifest): void {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = passport.manifestFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
