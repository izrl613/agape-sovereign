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
  mnemonicPhrase: string;
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
 * BIP-39 inspired word list (subset of 256 words for a 12-word phrase).
 * Full BIP-39 list would be 2048 words. This is a deterministic demo subset.
 */
const WORD_LIST = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'action', 'actor', 'actual', 'adapt', 'add',
  'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic',
  'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim',
  'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien',
  'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'alter',
  'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor',
  'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual',
  'another', 'antenna', 'antique', 'anxiety', 'apart', 'apology', 'appear', 'april',
  'arcade', 'arctic', 'area', 'arena', 'argue', 'arm', 'armor', 'army',
  'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist',
  'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma',
  'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit',
  'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid',
  'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby',
  'balance', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel',
  'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because',
  'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below',
  'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond',
  'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter',
  'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind',
  'blood', 'blossom', 'blouse', 'blue', 'blur', 'board', 'boat', 'body',
  'bomb', 'bone', 'bonus', 'book', 'border', 'boring', 'borrow', 'boss',
  'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brave',
  'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broad',
  'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy',
  'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker',
  'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer',
  'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call',
];

/**
 * Generate a deterministic 12-word mnemonic from entropy bytes.
 * Using SHA-256 of (sha256Id + timestamp) as the entropy source.
 */
async function generateMnemonic(sha256Id: string, timestamp: string): Promise<string> {
  const entropy = await sha256(`${sha256Id}::mnemonic::${timestamp}`);
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    // Take 2 hex chars at a time = 1 byte = 0-255 index
    const byte = parseInt(entropy.slice(i * 2, i * 2 + 2), 16);
    const idx = byte % WORD_LIST.length;
    words.push(WORD_LIST[idx]);
  }
  return words.join(' ');
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
      mnemonicPhrase: '',
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
      mnemonicPhrase: '',
      publicFingerprint: '',
      manifestFile: '',
      instructions: '',
      reason: `Export limit exceeded. Your 2-year sovereign export window opened on ${limitCheck.lastExport}. Contact admin to reset.`,
    };
  }

  const exportTimestamp = new Date().toISOString();

  // 2. Generate cryptographic artifacts
  const mnemonic = await generateMnemonic(sha256Id, exportTimestamp);
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
      'The bearer of the Mnemonic Phrase recovers this identity. Handle with absolute privacy.',
    instructions:
      '1. Write your 12-word Mnemonic Phrase on paper — do NOT store digitally.\n' +
      '2. Store in a physically secure location separate from this document.\n' +
      '3. This passportManifest.json + Mnemonic Phrase together form your complete recovery kit.\n' +
      '4. You have 2 years from first export to regenerate. After that, request an admin reset.\n' +
      '5. Agape Sovereign — One Love.',
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
    mnemonicPhrase: mnemonic,
    publicFingerprint,
    manifestFile: manifestFilename,
    instructions:
      'CRITICAL: Write your Mnemonic Phrase on paper NOW. ' +
      'This phrase is your sole recovery key — it will not be shown again.',
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
