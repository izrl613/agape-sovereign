import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";
import { chatComplete } from "./localAIService";

export interface ScanFinding {
  id?: string;
  userId: string;
  module: string;
  finding: string;
  status: "NUKED" | "KNOXED" | "MONITORED";
  timestamp: Date;
  details: string;
}

const EVIDENCE_REQUIRED =
  "A scan cannot run until you provide verifiable, consented evidence. Agape Sovereign does not fabricate findings, scrape third parties, or overwrite prior records.";

/**
 * Deliberately fails closed. Earlier versions generated plausible-sounding
 * findings from an email address alone. A future evidence-import workflow must
 * validate user consent and provenance before it can create a finding.
 */
export async function startFullScan(
  _userId: string,
  _email: string,
  onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void,
): Promise<never> {
  onProgress?.(0, 0, "Awaiting evidence", EVIDENCE_REQUIRED);
  throw new Error(EVIDENCE_REQUIRED);
}

/** See startFullScan. Targeted scans require the same evidence contract. */
export async function startModuleScan(
  _userId: string,
  _email: string,
  module: string,
  onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void,
): Promise<never> {
  onProgress?.(0, 0, module, EVIDENCE_REQUIRED);
  throw new Error(EVIDENCE_REQUIRED);
}

export function calculateScore(findings: ScanFinding[]): number {
  if (findings.length === 0) return 0;
  const weights = { KNOXED: 10, MONITORED: 5, NUKED: 0 } as const;
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
    return snapshot.docs.map((entry) => {
      const data = entry.data();
      return {
        id: entry.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() ?? new Date(0),
      } as ScanFinding;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "diff_scans");
    return [];
  }
}

export async function recalculateSovereignScore(userId: string): Promise<number> {
  return calculateScore(await getScanFindings(userId));
}

export async function generateSuspiciousReport(finding: ScanFinding): Promise<string> {
  const { text, offline } = await chatComplete(
    `Analyze only the evidence below. Do not infer or claim an external scan occurred.\n\nFinding: ${finding.finding}\nStatus: ${finding.status}\nDetails: ${finding.details}`,
    "You are an offline privacy and security analyst. State uncertainty plainly and provide remediation steps grounded only in the supplied evidence.",
  );
  return offline
    ? "Architect AI is unavailable locally. No data was transmitted and no report was fabricated."
    : text;
}
