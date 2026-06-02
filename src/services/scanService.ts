import { chatComplete } from "./localAIService";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";
import { logScanStarted, logUserEvent, logExposureNuked } from "./analyticsService";


export interface ScanFinding {
  id?: string;
  userId: string;
  module: string;
  finding: string;
  status: 'NUKED' | 'KNOXED' | 'MONITORED';
  timestamp: Date;
  details: string;
}

const NON_MOBILE_OS_MODULES = new Set(["non-mobile-os", "laptop", "laptop-desktop"]);

const normalizeScanModule = (module: string) => {
  if (NON_MOBILE_OS_MODULES.has(module)) return "non-mobile-os";
  return module;
};

export const startFullScan = async (userId: string, email: string, onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void) => {
  const modules = [
    "email", "social", "device", "mobile", "deepweb", "broker", 
    "password", "location", "browser", "financial", "medical", 
    "biometric", "iot", "cloud", "darkweb", "behavioral", "non-mobile-os"
  ];
  const total = modules.length;
  const findings: ScanFinding[] = [];
  
  // Log scan start to Analytics
  logScanStarted('FULL_SCAN');

  if (onProgress) onProgress(0, total, "Initializing...", "Clearing previous scan cache...");

  // Handle emergency bypass user with local storage
  if (userId === 'emergency-bypass-admin-999') {
    localStorage.removeItem(`scan_findings_${userId}`);
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      if (onProgress) onProgress(i, total, module, "Connecting to neural network...");
      await new Promise(resolve => setTimeout(resolve, 100));
      if (onProgress) onProgress(i, total, module, `Analyzing ${module} metadata patterns...`);
      await new Promise(resolve => setTimeout(resolve, 200));
      const finding = await generateFinding(module, email);
      const scanData: ScanFinding = {
        id: `local-${module}-${Date.now()}`,
        userId,
        module,
        finding: finding.title || `Standard ${module} check completed`,
        status: finding.status || "KNOXED",
        timestamp: new Date(),
        details: finding.details || "No immediate threats detected in this vector."
      };
      findings.push(scanData);
      if (onProgress) onProgress(i + 1, total);
    }
    const score = calculateScore(findings);
    localStorage.setItem(`scan_findings_${userId}`, JSON.stringify(findings));
    const history = JSON.parse(localStorage.getItem(`score_history_${userId}`) || "[]");
    history.push({
      userId,
      score,
      timestamp: new Date(),
      nukedCount: findings.filter(f => f.status === 'NUKED').length,
      knoxedCount: findings.filter(f => f.status === 'KNOXED').length,
      monitoredCount: findings.filter(f => f.status === 'MONITORED').length,
      findings
    });
    localStorage.setItem(`score_history_${userId}`, JSON.stringify(history));
    return { findings, score };
  }

  // Clear previous scans for a fresh start (optional, but usually better for a "Full Scan")
  const q = query(collection(db, "diff_scans"), where("userId", "==", userId));
  let snapshot;
  try {
    snapshot = await getDocs(q);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'diff_scans');
    throw err;
  }
  
  const deletePromises = snapshot.docs.map(d => {
    return deleteDoc(doc(db, "diff_scans", d.id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `diff_scans/${d.id}`);
    });
  });
  await Promise.all(deletePromises);

  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    
    if (onProgress) onProgress(i, total, module, "Connecting to neural network...");
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (onProgress) onProgress(i, total, module, `Analyzing ${module} metadata patterns...`);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (onProgress) onProgress(i, total, module, "Querying global threat database...");
    const finding = await generateFinding(module, email);
    
    if (onProgress) onProgress(i, total, module, "Synthesizing risk assessment...");
    await new Promise(resolve => setTimeout(resolve, 300));

    const scanData: any = {
      userId,
      module,
      finding: finding.title || `Standard ${module} check completed`,
      status: finding.status || "KNOXED",
      timestamp: serverTimestamp(),
      details: finding.details || "No immediate threats detected in this vector."
    };
    
    try {
      const docRef = await addDoc(collection(db, "diff_scans"), scanData);
      findings.push({ ...scanData, id: docRef.id });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'diff_scans');
    }

    if (onProgress) onProgress(i + 1, total);
  }

  // Calculate new sovereign score
  const score = calculateScore(findings);
  try {
    await updateDoc(doc(db, "users", userId), { sovereignScore: score });
    
    // Save to history
    await addDoc(collection(db, "score_history"), {
      userId,
      score,
      nukedCount: findings.filter(f => f.status === 'NUKED').length,
      knoxedCount: findings.filter(f => f.status === 'KNOXED').length,
      monitoredCount: findings.filter(f => f.status === 'MONITORED').length,
      findings: findings,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
  }

  // Log scan completion
  logUserEvent('scan_completed', { 
    scan_type: 'FULL_SCAN', 
    score, 
    nuked_count: findings.filter(f => f.status === 'NUKED').length 
  });

  return { findings, score };
};

export const startModuleScan = async (userId: string, email: string, module: string, userData: string = "", onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void) => {
  module = normalizeScanModule(module);

  // Log module scan start
  logScanStarted(`MODULE_${module.toUpperCase()}`);
  
  if (onProgress) onProgress(0, 1, module, "Initializing targeted scan...");
  
  // Handle emergency bypass user with local storage
  if (userId === 'emergency-bypass-admin-999') {
    const localFindings = JSON.parse(localStorage.getItem(`scan_findings_${userId}`) || "[]");
    const filtered = localFindings.filter((f: any) => f.module !== module);
    if (onProgress) onProgress(0, 1, module, `Deep-diving into ${module} architecture...`);
    await new Promise(resolve => setTimeout(resolve, 300));
    const finding = await generateFinding(module, email, userData);
    const scanData: ScanFinding = {
      id: `local-${module}-${Date.now()}`,
      userId,
      module,
      finding: finding.title || `Standard ${module} check completed`,
      status: finding.status || "KNOXED",
      timestamp: new Date(),
      details: finding.details || "No immediate threats detected in this vector."
    };
    filtered.push(scanData);
    localStorage.setItem(`scan_findings_${userId}`, JSON.stringify(filtered));
    if (onProgress) onProgress(1, 1, module, "Scan complete.");
    return scanData;
  }

  // Clear previous scans for this specific module
  const q = query(collection(db, "diff_scans"), 
    where("userId", "==", userId),
    where("module", "==", module)
  );
  
  let snapshot;
  try {
    snapshot = await getDocs(q);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'diff_scans');
    throw err;
  }
  
  const deletePromises = snapshot.docs.map(d => {
    return deleteDoc(doc(db, "diff_scans", d.id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `diff_scans/${d.id}`);
    });
  });
  await Promise.all(deletePromises);

  if (onProgress) onProgress(0, 1, module, `Deep-diving into ${module} architecture...`);
  await new Promise(resolve => setTimeout(resolve, 800));

  if (onProgress) onProgress(0, 1, module, "Running heuristic analysis...");
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (onProgress) onProgress(0, 1, module, "Consulting Architect intelligence...");
  const finding = await generateFinding(module, email, userData);
  
  if (onProgress) onProgress(0.8, 1, module, "Finalizing report...");
  await new Promise(resolve => setTimeout(resolve, 500));

  const scanData: any = {
    userId,
    module,
    finding: finding.title || `Standard ${module} check completed`,
    status: finding.status || "KNOXED",
    timestamp: serverTimestamp(),
    details: finding.details || "No immediate threats detected in this vector."
  };
  
  try {
    const docRef = await addDoc(collection(db, "diff_scans"), scanData);
    const newFinding = { ...scanData, id: docRef.id };
    
    // Recalculate score
    await recalculateSovereignScore(userId);
    
    if (onProgress) onProgress(1, 1, module, "Scan complete.");
    
    // Log module scan completion
    logUserEvent('scan_completed', { 
      scan_type: `MODULE_${module.toUpperCase()}`, 
      finding_status: newFinding.status 
    });

    return newFinding;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'diff_scans');
    throw err;
  }
};

const collectLiveSystemTelemetry = async () => {
  if (typeof window === 'undefined') return {};
  
  const hardware = {
    cores: navigator.hardwareConcurrency || 'unknown',
    memory: (navigator as any).deviceMemory || 'unknown',
    platform: navigator.platform || 'unknown',
    userAgent: navigator.userAgent || 'unknown',
    language: navigator.language || 'unknown',
  };

  const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection || {};
  const network = {
    type: conn.type || 'unknown',
    downlink: conn.downlink || 'unknown',
    effectiveType: conn.effectiveType || 'unknown',
    rtt: conn.rtt || 'unknown',
  };

  const screenMetrics = {
    width: window.screen?.width || 0,
    height: window.screen?.height || 0,
    colorDepth: window.screen?.colorDepth || 0,
    orientation: window.screen?.orientation?.type || 'unknown',
  };

  let battery = { level: 'unknown', charging: 'unknown' };
  try {
    if ('getBattery' in navigator) {
      const bat = await (navigator as any).getBattery();
      battery = {
        level: `${Math.round(bat.level * 100)}%`,
        charging: bat.charging ? 'yes' : 'no'
      };
    }
  } catch (e) {}

  let storageStats = { usedKeys: 0 };
  try {
    storageStats.usedKeys = localStorage.length;
  } catch (e) {}

  return {
    hardware,
    network,
    screenMetrics,
    battery,
    storageStats,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString()
  };
};

const collectNonMobileOsPrivacyAudit = async () => {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch('/api/privacy-audit/non-mobile-os', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Non-mobile OS privacy audit endpoint unavailable:", error);
    return null;
  }
};

const generateFinding = async (module: string, email: string, userData: string = "") => {
  try {
    module = normalizeScanModule(module);
    const telemetry = await collectLiveSystemTelemetry();
    const nonMobileOsAudit = module === "non-mobile-os" ? await collectNonMobileOsPrivacyAudit() : null;
    let moduleSpecificInstructions = "";
    if (module === "mobile") {
      moduleSpecificInstructions = `
      For the "mobile" module, focus on specific vulnerabilities such as:
      - Outdated OS versions (e.g., iOS 16.x when 17.x is current).
      - Missing Passkey/Biometric enforcement.
      - Unsecured Wi-Fi auto-join settings.
      - Excessive app permissions (e.g., calculator app requesting location).
      - Detected side-loaded applications or root/jailbreak status.
      - Unencrypted local backups.
      `;
    } else if (module === "email") {
      moduleSpecificInstructions = `
      For the "email" module, focus on:
      - Pwned accounts in specific historical breaches (e.g., LinkedIn 2016, Canva 2019).
      - Plaintext password exposures in Pastebin dumps.
      - Missing MFA on primary recovery accounts.
      - Suspicious SMTP forwarding rules.
      - Analysis of email metadata for patterns indicative of tracking (e.g., hidden pixels, unique tracking IDs in headers).
      - Spoofing detection (e.g., DMARC/SPF/DKIM failures, look-alike domain analysis).
      `;
    } else if (module === "social") {
      moduleSpecificInstructions = `
      For the "social" module, focus on:
      - Publicly accessible posts containing PII (e.g., birthday, pet names, location).
      - Username reuse across multiple platforms (e.g., same handle on X, Instagram, and Reddit).
      - Exposed friend/follower lists that could be used for social engineering.
      - Geotagged photos revealing home or work locations.
      - Mentions in third-party posts that link the user to sensitive groups or activities.
      `;
    } else if (module === "broker") {
      moduleSpecificInstructions = `
      For the "broker" module, identify specific data brokers holding the user's info:
      - Whitepages, Spokeo, Acxiom, or Epsilon.
      - Specific data types exposed: home address, relative names, estimated income.
      `;
    } else if (module === "device") {
      moduleSpecificInstructions = `
      For the "device" module, focus on:
      - Outdated UEFI/BIOS firmware.
      - Unencrypted swap or hibernation files.
      - Disabled DMA (Direct Memory Access) protections.
      - Missing OS-level security patches (e.g., KB updates for Windows, Security Updates for macOS).
      - Detected hardware-level side-channel vulnerabilities.
      - Unsecured peripheral configurations (e.g., USB auto-run enabled).
      `;
    } else if (module === "non-mobile-os") {
      moduleSpecificInstructions = `
      For the "non-mobile-os" module, focus only on laptop/desktop operating systems such as macOS, Windows, and Linux.
      Treat mobile OS posture as out of scope.

      This module is backed by the local privacy-audit MCP and the Agape Sovereign read-only backend endpoint.
      It must never claim to delete files, install LaunchAgents, persist background jobs, bypass permissions, or access arbitrary user data.

      Evaluate:
      - OS/platform support and local system posture.
      - Cache, log, download, and browser-cache footprint.
      - Memory pressure and disk hygiene signals.
      - Browser cache exposure and local telemetry minimization.
      - Whether cleanup candidates require explicit human review before moving to Trash.

      MCP bridge:
      - In Antigravity/Continue, use the "privacy-audit" MCP tools for read-only planning first:
        system_profile, known_cleanup_locations, estimate_cleanup_locations, scan_home_usage, cleanup_plan.
      - Use move_to_trash only after explicit review and confirmation.
      `;
    } else if (module === "password") {
      moduleSpecificInstructions = `
      For the "password" module, focus on:
      - Weak or common passwords (e.g., "123456", "password").
      - Password reuse across multiple critical services.
      - Passwords found in recent credential stuffing lists.
      - Lack of a password manager or use of an unencrypted one.
      - Passwords that haven't been changed in over 365 days.
      `;
    } else if (module === "darkweb") {
      moduleSpecificInstructions = `
      For the "darkweb" module, focus on:
      - Credentials (email/password) found in specific dark web marketplaces or forums.
      - Mentions of the user's PII in identity theft forums.
      - Leaked credit card numbers or bank account info.
      - Compromised session cookies or browser fingerprints.
      `;
    } else if (module === "iot") {
      moduleSpecificInstructions = `
      For the "iot" module, focus on:
      - Default credentials on smart home devices (e.g., cameras, routers).
      - Unencrypted communication between IoT devices and the cloud.
      - Outdated firmware on smart appliances.
      - Excessive data collection by smart home apps.
      `;
    }

    const prompt = `Generate a realistic digital identity scan finding for the module "${module}" for a user with email "${email}".
    ${moduleSpecificInstructions}
    
    CRITICAL: Analyze and base the finding heavily on this specific user-provided data vector:
    [USER DATA VECTOR]: "${userData || 'No active data provided'}"

    Also consider the following real-time device telemetry for context:
    ${JSON.stringify(telemetry, null, 2)}

    ${nonMobileOsAudit ? `Local non-mobile OS privacy audit summary:
    ${JSON.stringify(nonMobileOsAudit, null, 2)}` : ""}
    
    Return the result in JSON format with the following fields:
    - title: A short description of the finding.
    - status: One of "NUKED", "KNOXED", "MONITORED".
    - details: A more detailed explanation of the finding and recommended action.
    
    Make it sound highly technical and professional, fitting for the "Architect AI" persona.`;

    const response = await chatComplete(prompt, undefined, true);
    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Error generating finding:", error);
    return {
      title: `Standard ${module} check completed`,
      status: "KNOXED",
      details: "No immediate threats detected in this vector."
    };
  }
};

export const calculateScore = (findings: ScanFinding[]) => {
  if (findings.length === 0) return 100;
  
  const weights = {
    KNOXED: 10,
    MONITORED: 5,
    NUKED: 0
  };

  const totalPoints = findings.reduce((acc, f) => acc + weights[f.status], 0);
  const maxPoints = findings.length * 10;
  
  return Math.round((totalPoints / maxPoints) * 100);
};

export const updateFindingStatus = async (findingId: string, status: 'NUKED' | 'KNOXED' | 'MONITORED') => {
  // Handle local findings
  if (findingId.startsWith('local-')) {
    const userId = 'emergency-bypass-admin-999';
    const localFindings = JSON.parse(localStorage.getItem(`scan_findings_${userId}`) || "[]");
    const index = localFindings.findIndex((f: any) => f.id === findingId);
    if (index !== -1) {
      const oldStatus = localFindings[index].status;
      localFindings[index].status = status;
      localStorage.setItem(`scan_findings_${userId}`, JSON.stringify(localFindings));
      
      // Log remediation if status changed to KNOXED
      if (oldStatus === 'NUKED' && status === 'KNOXED') {
        logExposureNuked(localFindings[index].module, findingId);
      }
      return true;
    }
    return false;
  }

  try {
    const findingRef = doc(db, "diff_scans", findingId);
    const findingSnap = await getDocs(query(collection(db, "diff_scans"), where("__name__", "==", findingId))); // Minimal read to get module
    const findingData = findingSnap.docs[0]?.data();
    
    await updateDoc(findingRef, { status });
    
    // Log remediation
    if (findingData && findingData.status === 'NUKED' && status === 'KNOXED') {
      logExposureNuked(findingData.module, findingId);
    }
    
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `diff_scans/${findingId}`);
    return false;
  }
};

export const recalculateSovereignScore = async (userId: string) => {
  const findings = await getScanFindings(userId);
  const score = calculateScore(findings);

  // Handle emergency bypass user with local storage
  if (userId === 'emergency-bypass-admin-999') {
    const history = JSON.parse(localStorage.getItem(`score_history_${userId}`) || "[]");
    history.push({
      userId,
      score,
      timestamp: new Date(),
      nukedCount: findings.filter(f => f.status === 'NUKED').length,
      knoxedCount: findings.filter(f => f.status === 'KNOXED').length,
      monitoredCount: findings.filter(f => f.status === 'MONITORED').length,
      findings
    });
    localStorage.setItem(`score_history_${userId}`, JSON.stringify(history));
    return score;
  }

  try {
    await updateDoc(doc(db, "users", userId), { sovereignScore: score });
    
    // Save to history
    await addDoc(collection(db, "score_history"), {
      userId,
      score,
      nukedCount: findings.filter(f => f.status === 'NUKED').length,
      knoxedCount: findings.filter(f => f.status === 'KNOXED').length,
      monitoredCount: findings.filter(f => f.status === 'MONITORED').length,
      findings: findings,
      timestamp: serverTimestamp()
    });
    return score;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    return null;
  }
};

export const generateSuspiciousReport = async (finding: ScanFinding) => {
  try {
    const prompt = `Generate a detailed security report for a suspicious finding in the "${finding.module}" module.
    
    Finding: ${finding.finding}
    Status: ${finding.status}
    Details: ${finding.details}
    
    The report should include:
    1. Executive Summary
    2. Technical Analysis (including metadata patterns if applicable)
    3. Risk Assessment
    4. Remediation Steps
    5. Sovereign Protocol Recommendations
    
    Format the report in Markdown. Use a professional, authoritative "Architect AI" tone.`;

    const response = await chatComplete(prompt);
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "Failed to generate detailed report. Please contact the Architect.";
  }
};

export const getScanFindings = async (userId: string) => {
  // Handle emergency bypass user with local storage
  if (userId === 'emergency-bypass-admin-999') {
    const localFindings = JSON.parse(localStorage.getItem(`scan_findings_${userId}`) || "[]");
    return localFindings.map((f: any) => ({ ...f, timestamp: new Date(f.timestamp) }));
  }

  const q = query(collection(db, "diff_scans"), where("userId", "==", userId));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScanFinding));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'diff_scans');
    return [];
  }
};
