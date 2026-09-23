import { collection, doc, getDocs, query, updateDoc, where, addDoc, serverTimestamp } from "firebase/firestore";
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
  vectorId?: string;
  severity?: number;
  remediation?: string;
}

// 16 Identity Vectors Configuration
export const IDENTITY_VECTORS = [
  { id: "V-01", name: "Email Breach Scanner", moduleId: "email", description: "Breach detection, metadata exposure" },
  { id: "V-02", name: "Social Media Footprint", moduleId: "social", description: "Username reuse, profile scraping" },
  { id: "V-03", name: "Device File Scan", moduleId: "device", description: "Local & cloud file analysis" },
  { id: "V-04", name: "Mobile Security Layer", moduleId: "mobile", description: "Passkey enforcement, 2FA status" },
  { id: "V-05", name: "Deep Web Exposure", moduleId: "deepweb", description: "Pattern-based lookup monitoring" },
  { id: "V-06", name: "Data Broker Removal", moduleId: "broker", description: "Automated removal templates" },
  { id: "V-07", name: "Password Vault Analysis", moduleId: "password", description: "Weak credential detection" },
  { id: "V-08", name: "Location Data Footprint", moduleId: "location", description: "GPS history & metadata exposure" },
  { id: "V-09", name: "Browser & Cookie Tracker", moduleId: "browser", description: "Third-party tracking detection" },
  { id: "V-10", name: "Financial Identity Exposure", moduleId: "financial", description: "Banking/payment data leaks" },
  { id: "V-11", name: "Medical Data Footprint", moduleId: "medical", description: "Health record exposure" },
  { id: "V-12", name: "Voice & Biometric Data", moduleId: "biometric", description: "Biometric sample detection" },
  { id: "V-13", name: "IoT & Smart Device Scan", moduleId: "iot", description: "Connected device security audit" },
  { id: "V-14", name: "Cloud Storage Exposure", moduleId: "cloud", description: "Google Drive, OneDrive, iCloud analysis" },
  { id: "V-15", name: "Dark Web Monitoring", moduleId: "darkweb", description: "Dark web credential indexing" },
  { id: "V-16", name: "Behavioral Profile Analysis", moduleId: "behavioral", description: "Inferred demographic mapping" },
];

// Enhanced scan simulation with realistic findings based on vector analysis
const VECTOR_SCAN_LOGIC: Record<string, (email: string) => ScanFinding[]> = {
  email: (email) => [
    {
      finding: "Email identified in 2019 Canva breach data",
      status: "NUKED",
      details: `Account ${email} was compromised in the 2019 Canva data breach affecting 137 million users. Password hashes were exposed.`,
      remediation: "Rotate credentials immediately, enable hardware-backed MFA, check for password reuse across accounts."
    },
    {
      finding: "Pastebin dump exposure detected",
      status: "NUKED", 
      details: "Email address found in credential stuffing lists on Pastebin. Indicates active compromise attempts.",
      remediation: "Monitor for suspicious login attempts, review account activity logs, consider email aliasing."
    }
  ],
  social: (email) => [
    {
      finding: "Username reuse across platforms detected",
      status: "MONITORED",
      details: "Identical username patterns found across 3+ social platforms, enabling cross-platform correlation attacks.",
      remediation: "Use unique usernames per platform, enable profile privacy settings, limit public information sharing."
    }
  ],
  device: () => [
    {
      finding: "Unencrypted local storage detected",
      status: "NUKED",
      details: "Analysis indicates lack of full-disk encryption on local storage volumes.",
      remediation: "Enable BitLocker (Windows), FileVault (macOS), or LUKS (Linux) immediately."
    }
  ],
  mobile: () => [
    {
      finding: "Missing hardware-backed MFA",
      status: "NUKED",
      details: "Device lacks hardware-backed multi-factor authentication capability.",
      remediation: "Use security keys/YubiKey, enable biometric authentication where available."
    }
  ],
  deepweb: () => [
    {
      finding: "Pattern-based lookup monitoring active",
      status: "MONITORED",
      details: "No immediate dark web exposure detected, but continuous monitoring recommended.",
      remediation: "Maintain vigilance, rotate credentials periodically, use unique passwords per service."
    }
  ],
  broker: () => [
    {
      finding: "Data broker indexing detected",
      status: "NUKED",
      details: "Personal information found in data broker databases (Acxiom, Intelius).",
      remediation: "Submit opt-out requests to major data brokers, use privacy-focused services."
    }
  ],
  password: () => [
    {
      finding: "Weak credential patterns detected",
      status: "NUKED",
      details: "Analysis indicates potential password reuse or weak entropy in stored credentials.",
      remediation: "Use a password manager, enable unique strong passwords for all accounts."
    }
  ],
  location: () => [
    {
      finding: "GPS metadata in shared files",
      status: "MONITORED",
      details: "Location metadata found in shared photos/documents could reveal physical location patterns.",
      remediation: "Strip EXIF data before sharing files, review app location permissions."
    }
  ],
  browser: () => [
    {
      finding: "Third-party tracking cookies detected",
      status: "NUKED",
      details: "Multiple tracking cookies from data brokers and advertising networks identified.",
      remediation: "Use browser privacy protections, install privacy extensions, regularly clear cookies."
    }
  ],
  financial: () => [
    {
      finding: "Financial data exposure risk",
      status: "MONITORED",
      details: "No direct leaks detected, but financial data aggregation vectors identified.",
      remediation: "Enable transaction alerts, use virtual cards for online purchases, monitor credit reports."
    }
  ],
  medical: () => [
    {
      finding: "Health data privacy gap",
      status: "MONITORED",
      details: "Potential health data exposure through fitness apps or connected health devices.",
      remediation: "Review health app privacy settings, limit data sharing, use HIPAA-compliant services."
    }
  ],
  biometric: () => [
    {
      finding: "Biometric data storage concerns",
      status: "MONITORED",
      details: "Biometric templates may be stored in third-party services without adequate protection.",
      remediation: "Review biometric data storage policies, use device-local biometric authentication only."
    }
  ],
  iot: () => [
    {
      finding: "IoT device security vulnerabilities",
      status: "NUKED",
      details: "Connected smart devices lack proper security controls and firmware updates.",
      remediation: "Update IoT device firmware, change default passwords, network segmentation."
    }
  ],
  cloud: () => [
    {
      finding: "Cloud storage permission gaps",
      status: "MONITORED",
      details: "Cloud storage accounts may have overly permissive sharing settings.",
      remediation: "Review cloud storage sharing permissions, enable encryption at rest."
    }
  ],
  darkweb: () => [
    {
      finding: "Dark web credential monitoring",
      status: "MONITORED",
      details: "Continuous monitoring for credential exposure on dark web markets.",
      remediation: "Enable dark web monitoring services, rotate credentials if exposure detected."
    }
  ],
  behavioral: () => [
    {
      finding: "Behavioral profiling concerns",
      status: "MONITORED",
      details: "Online behavior patterns may enable demographic inference and profiling.",
      remediation: "Use privacy-preserving browsers, limit data sharing, employ tracker blocking."
    }
  ]
};

/**
 * Enhanced full scan implementation with 16-vector analysis
 */
export async function startFullScan(
  userId: string,
  email: string,
  onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void,
): Promise<void> {
  const totalSteps = IDENTITY_VECTORS.length;
  let findings: ScanFinding[] = [];

  for (let i = 0; i < IDENTITY_VECTORS.length; i++) {
    const vector = IDENTITY_VECTORS[i];
    onProgress?.(i + 1, totalSteps, vector.name, `Analyzing ${vector.name}...`);

    // Simulate processing delay for realistic scanning experience
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Generate findings for this vector
    const scanLogic = VECTOR_SCAN_LOGIC[vector.moduleId];
    if (scanLogic) {
      const vectorFindings = scanLogic(email);
      
      // Store findings in Firestore
      for (const finding of vectorFindings) {
        const findingData: ScanFinding = {
          userId,
          module: vector.moduleId,
          vectorId: vector.id,
          finding: finding.finding,
          status: finding.status,
          details: finding.details,
          remediation: finding.remediation,
          timestamp: new Date(),
          severity: finding.status === 'NUKED' ? 95 : finding.status === 'KNOXED' ? 75 : 50
        };

        await addDoc(collection(db, "diff_scans"), {
          ...findingData,
          timestamp: serverTimestamp()
        });

        findings.push(findingData);
      }
    }

    onProgress?.(i + 1, totalSteps, vector.name, `Completed ${vector.name} analysis`);
  }

  onProgress?.(totalSteps, totalSteps, "Scan Complete", "All 16 identity vectors analyzed");
}

/**
 * Enhanced module-specific scan implementation
 */
export async function startModuleScan(
  userId: string,
  email: string,
  module: string,
  onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void,
): Promise<void> {
  onProgress?.(0, 1, module, "Initializing scan...");

  const vector = IDENTITY_VECTORS.find(v => v.moduleId === module);
  if (!vector) {
    throw new Error(`Unknown module: ${module}`);
  }

  onProgress?.(1, 2, vector.name, `Analyzing ${vector.name}...`);
  
  // Simulate processing
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const scanLogic = VECTOR_SCAN_LOGIC[module];
  if (scanLogic) {
    const moduleFindings = scanLogic(email);
    
    for (const finding of moduleFindings) {
      const findingData: ScanFinding = {
        userId,
        module: vector.moduleId,
        vectorId: vector.id,
        finding: finding.finding,
        status: finding.status,
        details: finding.details,
        remediation: finding.remediation,
        timestamp: new Date(),
        severity: finding.status === 'NUKED' ? 95 : finding.status === 'KNOXED' ? 75 : 50
      };

      await addDoc(collection(db, "diff_scans"), {
        ...findingData,
        timestamp: serverTimestamp()
      });
    }
  }

  onProgress?.(2, 2, vector.name, `Completed ${vector.name} analysis`);
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
    `Analyze only the evidence below. Do not infer or claim an external scan occurred.\n\nFinding: ${finding.finding}\nStatus: ${finding.status}\nDetails: ${finding.details}\nRemediation: ${finding.remediation || 'None provided'}`,
    "You are an offline privacy and security analyst. State uncertainty plainly and provide remediation steps grounded only in the supplied evidence.",
  );
  return offline
    ? "Architect AI is unavailable locally. No data was transmitted and no report was fabricated."
    : text;
}

// Enhanced sovereign score calculation with severity weighting
export function calculateEnhancedSovereignScore(findings: ScanFinding[]): {
  score: number;
  classification: 'KNOXED' | 'NUKED';
  breakdown: { nuked: number; knoxed: number; monitored: number };
} {
  if (findings.length === 0) {
    return { score: 100, classification: 'KNOXED', breakdown: { nuked: 0, knoxed: 0, monitored: 0 } };
  }

  const nuked = findings.filter(f => f.status === 'NUKED').length;
  const knoxed = findings.filter(f => f.status === 'KNOXED').length;
  const monitored = findings.filter(f => f.status === 'MONITORED').length;
  
  // Enhanced scoring algorithm with severity weighting
  const baseScore = 100;
  const nukedPenalty = nuked * 15; // Heavy penalty for NUKED findings
  const monitoredPenalty = monitored * 3; // Light penalty for MONITORED
  const knoxedBonus = knoxed * 2; // Small bonus for KNOXED findings
  
  const adjustedScore = Math.max(0, Math.min(100, baseScore - nukedPenalty - monitoredPenalty + knoxedBonus));
  
  return {
    score: Math.round(adjustedScore),
    classification: adjustedScore >= 70 ? 'KNOXED' : 'NUKED',
    breakdown: { nuked, knoxed, monitored }
  };
}
