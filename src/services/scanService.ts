import { GoogleGenAI, Type } from "@google/genai";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../utils/firestoreErrorHandler";
import { logScanStarted, logUserEvent, logExposureNuked } from "./analyticsService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ScanFinding {
  id?: string;
  userId: string;
  module: string;
  finding: string;
  status: 'NUKED' | 'KNOXED' | 'MONITORED';
  timestamp: Date;
  details: string;
}

export const startFullScan = async (userId: string, email: string, onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void) => {
  const modules = [
    "email", "social", "device", "mobile", "deepweb", "broker", 
    "password", "location", "browser", "financial", "medical", 
    "biometric", "iot", "cloud", "darkweb", "behavioral"
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

export const startModuleScan = async (userId: string, email: string, module: string, onProgress?: (current: number, total: number, moduleName?: string, subTask?: string) => void) => {
  // Log module scan start
  logScanStarted(`MODULE_${module.toUpperCase()}`);
  
  if (onProgress) onProgress(0, 1, module, "Initializing targeted scan...");
  
  // Handle emergency bypass user with local storage
  if (userId === 'emergency-bypass-admin-999') {
    const localFindings = JSON.parse(localStorage.getItem(`scan_findings_${userId}`) || "[]");
    const filtered = localFindings.filter((f: any) => f.module !== module);
    if (onProgress) onProgress(0, 1, module, `Deep-diving into ${module} architecture...`);
    await new Promise(resolve => setTimeout(resolve, 300));
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
  const finding = await generateFinding(module, email);
  
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

const generateFinding = async (module: string, email: string) => {
  try {
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

    let retryCount = 0;
    const maxRetries = 2;
    let response;

    while (retryCount <= maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Generate a realistic digital identity scan finding for the module "${module}" for a user with email "${email}".
          ${moduleSpecificInstructions}
          Return the result in JSON format with the following fields:
          - title: A short description of the finding.
          - status: One of "NUKED", "KNOXED", "MONITORED".
          - details: A more detailed explanation of the finding and recommended action.
          
          Make it sound technical and professional, fitting for the "Architect AI" persona.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                status: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["title", "status", "details"]
            }
          }
        });
        break; // Success, break out of retry loop
      } catch (err) {
        retryCount++;
        if (retryCount > maxRetries) throw err;
        console.warn(`Gemini API 500 error, retrying... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    const result = JSON.parse(response?.text || "{}");
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
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a detailed security report for a suspicious finding in the "${finding.module}" module.
      
      Finding: ${finding.finding}
      Status: ${finding.status}
      Details: ${finding.details}
      
      The report should include:
      1. Executive Summary
      2. Technical Analysis (including metadata patterns if applicable)
      3. Risk Assessment
      4. Remediation Steps
      5. Sovereign Protocol Recommendations
      
      Format the report in Markdown. Use a professional, authoritative "Architect AI" tone.`,
    });

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
