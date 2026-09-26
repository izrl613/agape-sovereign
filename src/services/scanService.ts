/**
 * SCAN SERVICE — Identity Vector execution engine
 * ============================================================
 * Every vector result is produced by its Module Agent, which means it is
 * either:
 *   • THIRD-PARTY VERIFIED  — an external source answered the query, or
 *   • ON-DEVICE MEASURED    — a real browser/hardware signal was read, or
 *   • PENDING               — the module needs a sealed user input that has
 *                             not been provided yet.
 *
 * Fabricated, mock or simulated findings are banned: no vector ever invents a
 * status, a count, or an evidence string. When sources are unreachable the
 * result is reported as UNVERIFIED with the reason attached.
 * ============================================================
 */

import { collection, doc, getDoc, getDocs, query, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";
import { chatComplete } from "./localAIService";
import { decryptClientSide } from "../utils/crypto";
import {
  MODULE_AGENT_INDEX,
  MODULE_AGENTS,
  ModuleAgentResult,
  ModuleGateError,
  runModuleAgent,
} from "./moduleAgentService";

export interface ScanFinding {
  id?: string;
  userId: string;
  module: string;
  finding: string;
  status: "NUKED" | "KNOXED" | "MONITORED";
  timestamp: Date;
  details: string;
  severity?: number;
  remediation?: string;
  /** SHA-256 ID of the sealed input this finding was derived from. */
  sha256Id?: string;
  /** Integrity seal binding the finding to the session. */
  seal?: string;
  /** Provenance: how the result was established. */
  verification?: {
    thirdPartyVerified: boolean;
    statement: string;
    sources: Array<{ source: string; outcome: string; verified: boolean; checkedAt: string }>;
  };
}

export interface ScanSession {
  uid: string;
  email: string;
  /** Session SHA-256 identity hash — the gate key for every Module Agent. */
  sovereignHash: string;
}

export const CANONICAL_VECTORS = MODULE_AGENTS.map(spec => ({
  id: spec.moduleId,
  label: spec.label,
  vector: spec.vector,
}));

/**
 * Load the sealed (encrypted) value a user previously committed to a module
 * and decrypt it locally with the session identity hash. Returns null when no
 * value has been sealed — never a substitute value.
 */
async function loadSealedModuleValue(session: ScanSession, moduleId: string): Promise<{ value: string; sha256Id: string } | null> {
  try {
    const snap = await getDoc(doc(db, "users", session.uid, "module_data", "active"));
    if (!snap.exists()) return null;
    const data = snap.data();
    const cipher = data?.data?.[moduleId];
    if (!cipher) return null;
    const value = await decryptClientSide(cipher, session.sovereignHash);
    return { value, sha256Id: data?.hashes?.[`${moduleId}Hash`] || "" };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${session.uid}/module_data/active`);
    return null;
  }
}

/**
 * Build the PENDING finding used when a module requires a sealed input the
 * user has not provided. This is a factual state, not a simulated result.
 */
function pendingFinding(session: ScanSession, moduleId: string): ScanFinding {
  const spec = MODULE_AGENT_INDEX[moduleId];
  const label = spec?.label || moduleId;
  return {
    userId: session.uid,
    module: moduleId,
    finding: `${spec?.vector || moduleId} awaiting sealed input`,
    status: "MONITORED",
    timestamp: new Date(),
    details: `${label} requires "${spec?.inputLabel || "a value"}" before any evidence can be gathered. Nothing was queried and no result was assumed. Open the module and seal a value to run it.`,
    verification: {
      thirdPartyVerified: false,
      statement: "Not executed — required input is missing.",
      sources: [],
    },
  };
}

function toFinding(session: ScanSession, moduleId: string, result: ModuleAgentResult): ScanFinding {
  return {
    userId: session.uid,
    module: moduleId,
    finding: result.finding.finding,
    status: result.finding.status,
    timestamp: new Date(),
    details: result.finding.details,
    sha256Id: result.sha256Id,
    seal: result.seal,
    verification: {
      thirdPartyVerified: result.finding.thirdPartyVerified,
      statement: result.verification.statement,
      sources: result.verification.reports.map(r => ({
        source: r.source,
        outcome: r.outcome,
        verified: r.verified,
        checkedAt: r.checkedAt,
      })),
    },
  };
}

async function persistFinding(finding: ScanFinding): Promise<ScanFinding> {
  try {
    const docRef = await addDoc(collection(db, "diff_scans"), {
      ...finding,
      timestamp: serverTimestamp(),
    });
    finding.id = docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "diff_scans");
  }
  return finding;
}

/**
 * Execute one Identity Vector through its Module Agent.
 */
export async function startModuleScan(
  session: ScanSession,
  moduleId: string,
  onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void,
): Promise<ScanFinding> {
  const spec = MODULE_AGENT_INDEX[moduleId];
  if (!spec) {
    throw new Error(`Unknown identity vector "${moduleId}".`);
  }

  onProgress?.(0, 1, spec.label, `Gating ${spec.vector} through its Module Agent…`);

  // Resolve the value the agent will operate on.
  let value = "";
  if (moduleId === "email") {
    value = session.email || "";
  } else {
    const sealed = await loadSealedModuleValue(session, moduleId);
    value = sealed?.value || "";
  }

  if (spec.required && !value) {
    const finding = await persistFinding(pendingFinding(session, moduleId));
    onProgress?.(1, 1, spec.label, `${spec.vector} awaiting sealed input.`);
    return finding;
  }

  onProgress?.(0, 1, spec.label, `Querying registered third-party sources for ${spec.vector}…`);

  try {
    const result = await runModuleAgent({
      session: { user: { uid: session.uid, email: session.email }, sovereignHash: session.sovereignHash },
      moduleId,
      rawValue: value,
    });
    const finding = await persistFinding(toFinding(session, moduleId, result));
    onProgress?.(1, 1, spec.label, `${spec.vector} ${result.finding.thirdPartyVerified ? "third-party verified" : "reported UNVERIFIED"}.`);
    return finding;
  } catch (err) {
    if (err instanceof ModuleGateError) {
      const finding = await persistFinding({
        userId: session.uid,
        module: moduleId,
        finding: `${spec.vector} blocked by Module Agent gate`,
        status: "MONITORED",
        timestamp: new Date(),
        details: `Gate refused the run (${err.code}): ${err.message} No data was written and no result was generated.`,
        verification: { thirdPartyVerified: false, statement: `Gate refusal: ${err.code}`, sources: [] },
      });
      onProgress?.(1, 1, spec.label, `${spec.vector} gate refused.`);
      return finding;
    }
    throw err;
  }
}

/**
 * Execute every Identity Vector through its Module Agent.
 */
export async function startFullScan(
  session: ScanSession,
  onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void,
): Promise<ScanFinding[]> {
  const results: ScanFinding[] = [];
  const total = CANONICAL_VECTORS.length;

  for (let i = 0; i < total; i++) {
    const vec = CANONICAL_VECTORS[i];
    onProgress?.(i + 1, total, vec.label, `Vector ${vec.vector}: ${vec.label}`);
    try {
      results.push(await startModuleScan(session, vec.id));
    } catch (err) {
      console.error(`Vector ${vec.id} failed:`, err);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  onProgress?.(total, total, "DIFF finalized", `${results.length} of ${total} vectors sealed.`);
  return results;
}

export function calculateScore(findings: ScanFinding[]): number {
  if (findings.length === 0) return 0;
  const weights = { KNOXED: 10, MONITORED: 6, NUKED: 0 } as const;
  return Math.round(
    (findings.reduce((total, finding) => total + weights[finding.status], 0) /
      (findings.length * 10)) *
      100,
  );
}

export async function updateFindingStatus(
  findingId: string,
  status: ScanFinding["status"],
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "diff_scans", findingId), { status });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `diff_scans/${findingId}`);
    return false;
  }
}

export async function getScanFindings(userId: string): Promise<ScanFinding[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, "diff_scans"), where("userId", "==", userId)),
    );
    if (!snapshot.empty) {
      return snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() ?? new Date(),
        } as ScanFinding;
      });
    }
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "diff_scans");
    return [];
  }
}

export async function recalculateSovereignScore(userId: string): Promise<number> {
  return calculateScore(await getScanFindings(userId));
}

export async function generateSuspiciousReport(finding: ScanFinding): Promise<string> {
  const provenance = finding.verification
    ? `Verification: ${finding.verification.statement}\nSources: ${finding.verification.sources.map(s => `${s.source} [${s.outcome}]`).join(", ") || "none"}`
    : "Verification: provenance not recorded for this finding.";

  const { text, offline } = await chatComplete(
    `Analyze this identity security telemetry and produce a remediation plan.
Vector: ${finding.module}
Finding: ${finding.finding}
Status: ${finding.status}
Details: ${finding.details}
${provenance}

Rules: never invent facts that are not in the telemetry above. If the finding is marked UNVERIFIED, say so and recommend the verification step first.`,
    "You are the Agape Sovereign AI Orchestrator. Deliver zero-fluff, technical personal cybersecurity defence advice grounded strictly in the supplied telemetry. Never fabricate evidence.",
  );
  return offline
    ? "Local model unavailable — no report generated. The finding above is the only evidence on record; re-run the module to retry remediation guidance."
    : text;
}

/**
 * Weighted score. With no findings the score is 0 — an unmeasured identity is
 * not a protected identity.
 */
export function calculateEnhancedSovereignScore(findings: ScanFinding[]): number {
  if (findings.length === 0) return 0;
  const weights = { KNOXED: 10, MONITORED: 6, NUKED: 0 } as const;
  const baseScore = Math.round(
    (findings.reduce((total, f) => total + weights[f.status], 0) /
      (findings.length * 10)) *
      100,
  );
  // Bonus only for findings that an external source actually confirmed.
  const verifiedClean = findings.some(
    f => f.status === "KNOXED" && f.verification?.thirdPartyVerified === true,
  );
  return Math.min(100, verifiedClean ? baseScore + 5 : baseScore);
}

export function calculateSovereignScoreWithDetails(findings: ScanFinding[]): {
  score: number;
  classification: "SOVEREIGN" | "KNOXED" | "EXPOSED" | "UNMEASURED";
  thirdPartyVerified: number;
} {
  const score = calculateEnhancedSovereignScore(findings);
  const thirdPartyVerified = findings.filter(f => f.verification?.thirdPartyVerified === true).length;
  if (findings.length === 0) return { score: 0, classification: "UNMEASURED", thirdPartyVerified };
  const classification = score >= 90 ? "SOVEREIGN" : score >= 70 ? "KNOXED" : "EXPOSED";
  return { score, classification, thirdPartyVerified };
}

/**
 * IDENTITY_VECTORS — extended metadata consumed by Architect AI.
 */
export const IDENTITY_VECTORS = CANONICAL_VECTORS.map(v => {
  const spec = MODULE_AGENT_INDEX[v.id];
  return {
    id: v.vector,
    name: v.label,
    description: `${v.vector} ${v.label}: ${spec?.description || ""} Third-party chain: ${spec?.verificationChain.length ? spec.verificationChain.join(", ") : "none registered (UNVERIFIED results only)"}.`,
    moduleId: v.id,
  };
});
