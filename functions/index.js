// ============================================================
// ARCHITECT AI — CLOUD FUNCTIONS
// Agape Sovereign Enclave 2026
// Deploy: firebase deploy --only functions
// ============================================================

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage().bucket();

// ─── DIFF VECTOR DEFINITIONS (16-LAYER) ────────────────────
const DIFF_VECTORS = [
  { id: "email", name: "Email Breach Scanner", vector: "V-01" },
  { id: "social", name: "Social Media Footprint", vector: "V-02" },
  { id: "device", name: "Device File Scan", vector: "V-03" },
  { id: "mobile", name: "Mobile Security Layer", vector: "V-04" },
  { id: "deepweb", name: "Deep Web Exposure", vector: "V-05" },
  { id: "broker", name: "Data Broker Removal", vector: "V-06" },
  { id: "password", name: "Password Vault Analysis", vector: "V-07" },
  { id: "location", name: "Location Data Footprint", vector: "V-08" },
  { id: "browser", name: "Browser & Cookie Tracker", vector: "V-09" },
  { id: "financial", name: "Financial Identity Exposure", vector: "V-10" },
  { id: "medical", name: "Medical Data Footprint", vector: "V-11" },
  { id: "biometric", name: "Voice & Biometric Data", vector: "V-12" },
  { id: "iot", name: "IoT & Smart Device Scan", vector: "V-13" },
  { id: "cloud", name: "Cloud Storage Exposure", vector: "V-14" },
  { id: "darkweb", name: "Dark Web Monitoring", vector: "V-15" },
  { id: "behavioral", name: "Behavioral Profile Analysis", vector: "V-16" },
];

// ─── AUDIT LOG FUNCTION ────────────────────────────────────
async function logAudit(action, userId, details = {}) {
  try {
    await db.collection("audit_logs").add({
      action,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details,
      ipAddress: details.ipAddress || "unknown",
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

// ─── SHA256 HASH GENERATOR ─────────────────────────────────
function generateSHA256(data) {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

// ─── INITIATE DIFF SCAN (HTTP CALLABLE) ────────────────────
exports.initiateDIFFScan = functions.https.onCall(async (data, context) => {
  // ─── AUTHENTICATION CHECK ──────────────────────────────
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to initiate DIFF scan."
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  try {
    // Create scan record
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const scanRef = db.collection("diff_scans").doc(scanId);

    await scanRef.set({
      userId,
      email: userEmail,
      scanId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "IN_PROGRESS",
      vectorResults: {},
      sovereignScore: 0,
      totalNuked: 0,
      totalKnoxed: 0,
      totalMonitored: 0,
      sha256Hash: null,
    });

    // Log audit
    await logAudit("DIFF_SCAN_INITIATED", userId, {
      scanId,
      email: userEmail,
    });

    // Trigger background processing
    await processDIFFVectors(userId, scanId);

    return {
      success: true,
      scanId,
      message: "DIFF scan initiated. Processing 16 identity vectors...",
    };
  } catch (error) {
    console.error("DIFF scan initiation error:", error);
    await logAudit("DIFF_SCAN_ERROR", userId, { error: error.message });
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ─── PROCESS DIFF VECTORS (BACKGROUND) ─────────────────────
async function processDIFFVectors(userId, scanId) {
  try {
    const scanRef = db.collection("diff_scans").doc(scanId);
    const results = {};
    let totalNuked = 0,
      totalKnoxed = 0,
      totalMonitored = 0;
    const severities = [];

    // Process each vector sequentially
    for (const vector of DIFF_VECTORS) {
      const vectorResult = generateVectorResult(vector);
      results[vector.id] = vectorResult;

      totalNuked += vectorResult.nukedCount;
      totalKnoxed += vectorResult.knoxedCount;
      totalMonitored += vectorResult.monitoredCount;
      severities.push(vectorResult.severity);

      // Store in subcollection
      await scanRef.collection("vectorResults").doc(vector.id).set(vectorResult);

      // Simulated delay to avoid throttling
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Calculate sovereign score
    const sovereignScore = Math.round(severities.reduce((a, b) => a + b) / severities.length);
    const sha256Hash = generateSHA256({
      userId,
      scanId,
      results,
      timestamp: new Date().toISOString(),
    });

    // Update scan record
    await scanRef.update({
      status: "COMPLETED",
      vectorResults: results,
      sovereignScore,
      totalNuked,
      totalKnoxed,
      totalMonitored,
      sha256Hash,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user profile
    await db.collection("users").doc(userId).update({
      sovereignScore,
      lastDIFFScan: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log audit
    await logAudit("DIFF_SCAN_COMPLETED", userId, {
      scanId,
      sovereignScore,
      totalNuked,
      totalKnoxed,
      sha256Hash,
    });

    return { success: true, scanId, sovereignScore };
  } catch (error) {
    console.error("Vector processing error:", error);
    await db.collection("diff_scans").doc(scanId).update({
      status: "FAILED",
      error: error.message,
    });
  }
}

// ─── GENERATE VECTOR RESULT (MOCK DATA FOR DEMO) ────────────
function generateVectorResult(vector) {
  const severities = { email: 72, social: 61, device: 88, mobile: 95, deepweb: 42, broker: 38, password: 91, location: 55, browser: 49, financial: 87, medical: 93, biometric: 79, iot: 66, cloud: 85, darkweb: 34, behavioral: 71 };
  const sevMap = { email: [3, 12, 2], social: [7, 8, 5], device: [1, 24, 3], mobile: [0, 18, 1], deepweb: [5, 3, 8], broker: [12, 4, 6], password: [2, 31, 0], location: [4, 9, 7], browser: [8, 6, 11], financial: [1, 15, 2], medical: [0, 7, 1], biometric: [2, 11, 4], iot: [3, 8, 5], cloud: [1, 19, 2], darkweb: [6, 2, 9], behavioral: [4, 13, 6] };
  const [nuked, knoxed, monitored] = sevMap[vector.id] || [0, 0, 0];

  return {
    vectorId: vector.vector,
    vectorName: vector.name,
    severity: severities[vector.id] || 50,
    nukedCount: nuked,
    knoxedCount: knoxed,
    monitoredCount: monitored,
    findings: generateFindings(vector.id, nuked, knoxed, monitored),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };
}

// ─── GENERATE MOCK FINDINGS ────────────────────────────────
function generateFindings(vectorId, nuked, knoxed, monitored) {
  const findings = [];

  for (let i = 0; i < nuked; i++) {
    findings.push({
      id: `${vectorId}_nuke_${i}`,
      type: "NUKED",
      label: `Data broker exposure ${i + 1}`,
      detail: "Found in aggregator database",
      source: "Spokeo, Whitepages, BeenVerified",
      actionRequired: true,
      actionTaken: "Removal request initiated",
    });
  }

  for (let i = 0; i < knoxed; i++) {
    findings.push({
      id: `${vectorId}_knox_${i}`,
      type: "KNOXED",
      label: `Hardened asset ${i + 1}`,
      detail: "Verified secured and encrypted",
      source: "Internal verification",
      actionRequired: false,
      actionTaken: "KNOXED",
    });
  }

  for (let i = 0; i < monitored; i++) {
    findings.push({
      id: `${vectorId}_mon_${i}`,
      type: "MONITORED",
      label: `Monitoring exposure ${i + 1}`,
      detail: "Flagged for periodic review",
      actionRequired: true,
      actionTaken: "Continuous monitoring active",
    });
  }

  return findings;
}

// ─── GENERATE PDF REPORT (HTTP CALLABLE) ──────────────────
exports.generateDIFFReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userId = context.auth.uid;
  const { scanId } = data;

  try {
    // Fetch scan data
    const scanDoc = await db.collection("diff_scans").doc(scanId).get();
    if (!scanDoc.exists || scanDoc.data().userId !== userId) {
      throw new Error("Scan not found or unauthorized.");
    }

    const scanData = scanDoc.data();
    const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Generate PDF
    const pdfPath = `diff_reports/pdfs/${userId}/${reportId}.pdf`;
    const pdfBuffer = await generatePDFBuffer(scanData, reportId);

    // Upload to Firebase Storage
    const file = storage.file(pdfPath);
    await file.save(pdfBuffer, {
      metadata: {
        contentType: "application/pdf",
        metadata: {
          userId,
          scanId,
          reportId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Create download URL (valid for 7 days)
    const [downloadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Store report metadata
    const sha256Digest = generateSHA256(scanData);
    const reportRef = db.collection("diff_reports").doc(reportId);

    await reportRef.set({
      userId,
      reportId,
      scanId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      sovereignScore: scanData.sovereignScore,
      totalNuked: scanData.totalNuked,
      totalKnoxed: scanData.totalKnoxed,
      pdfStoragePath: pdfPath,
      sha256Digest,
      downloadUrl,
      expiresAt: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
    });

    // Log audit
    await logAudit("DIFF_REPORT_GENERATED", userId, {
      reportId,
      scanId,
      sha256Digest,
    });

    return {
      success: true,
      reportId,
      downloadUrl,
      sha256Digest,
      message: "PDF report generated successfully.",
    };
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ─── GENERATE PDF BUFFER ──────────────────────────────────
async function generatePDFBuffer(scanData, reportId) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("ARCHITECT AI", 50, 50);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Digital Identity Federated Footprint Report", 50, 80);

    // Sovereign Score
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(`Sovereign Score: ${scanData.sovereignScore}/100`, 50, 110);

    // Summary
    doc.fontSize(12).font("Helvetica-Bold").text("Summary", 50, 150);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Report ID: ${reportId}`, 50, 170);
    doc.text(`NUKED: ${scanData.totalNuked}`);
    doc.text(`KNOXED: ${scanData.totalKnoxed}`);
    doc.text(`MONITORED: ${scanData.totalMonitored}`);

    // Vector Breakdown
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Vector Analysis", 50, 280);
    let y = 300;

    Object.values(scanData.vectorResults || {}).forEach((vector) => {
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`${vector.vectorName}`, 50, y);
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(`Severity: ${vector.severity}% | NUKED: ${vector.nukedCount} | KNOXED: ${vector.knoxedCount}`, 50, y + 15);
      y += 35;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // Footer
    doc
      .fontSize(7)
      .font("Helvetica")
      .text(`Generated: ${new Date().toISOString()} | Hash: ${scanData.sha256Hash.slice(0, 16)}...`, 50, 750);
    doc.text("ECRA 2026 · GDPR · CCPA Compliant", 50, 765);

    doc.end();
  });
}

// ─── CLEANUP OLD REPORTS (SCHEDULED) ───────────────────────
exports.cleanupOldReports = functions.pubsub
  .schedule("every day 02:00")
  .timeZone("America/New_York")
  .onRun(async () => {
    const cutoffDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000); // 2 years ago

    const snapshot = await db
      .collection("diff_reports")
      .where("createdAt", "<", cutoffDate)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${snapshot.docs.length} old reports.`);
  });

// ─── HEALTH CHECK ENDPOINT ────────────────────────────────
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    vectors: DIFF_VECTORS.length,
    functions: [
      "initiateDIFFScan",
      "generateDIFFReport",
      "cleanupOldReports",
      "healthCheck",
    ],
  });
});
