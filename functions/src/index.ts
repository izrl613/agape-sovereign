/**
 * Agape Sovereign — Firebase Cloud Functions
 *
 * Endpoints:
 *   sovereignPipelineStatus  — GET  check pipeline run status
 *   sovereignAuditRecord     — POST record audit event from client
 *   sovereignCleanupExpired  — scheduled purge runs older than 2 years
 *
 * Cost control: maxInstances=10 global, free-tier friendly.
 * All heavy processing (OCR, LLM inference) stays on the user device.
 * Functions handle metadata, audit trails, and Firestore writes only.
 */

import {setGlobalOptions, logger} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";
import * as crypto from "crypto";

// ─── Initialise ──────────────────────────────────────────────────────────────

initializeApp();
const db = getFirestore();

// Use Firebase App Hosting compute SA.
// (Compute Engine default SA not provisioned on this project.)
const RUNTIME_SA =
  "firebase-app-hosting-compute@" +
  "agape-sovereign.iam.gserviceaccount.com";
setGlobalOptions({
  maxInstances: 10,
  region: "us-east1" as string,
  serviceAccount: RUNTIME_SA,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipelineRunRecord {
  userId: string;
  runId: string;
  status: string;
  planSummary: string;
  integrityHash: string;
  auditStatus: string;
  issuesCount: number;
  technicalSchematics: string[];
  completedAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Function: sovereignPipelineStatus ───────────────────────────────────────
/**
 * Callable: get the status and summary of a pipeline run.
 * Auth required — users can only access their own runs.
 */
export const sovereignPipelineStatus = onCall(
  {maxInstances: 5},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const {runId} = request.data as { runId: string };
    if (!runId || typeof runId !== "string") {
      throw new HttpsError("invalid-argument", "runId is required.");
    }

    const runDoc = await db.collection("pipeline_runs").doc(runId).get();
    if (!runDoc.exists) {
      throw new HttpsError("not-found", `Pipeline run ${runId} not found.`);
    }

    const data = runDoc.data() as PipelineRunRecord;
    if (data.userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Access denied.");
    }

    return {
      runId: data.runId,
      status: data.status,
      planSummary: data.planSummary,
      integrityHash: data.integrityHash,
      auditStatus: data.auditStatus,
      issuesCount: data.issuesCount,
      completedAt: data.completedAt?.toMillis() ?? null,
    };
  }
);

// ─── Function: sovereignAuditRecord ──────────────────────────────────────────
/**
 * Callable: record a sovereign audit event.
 * Stores in audit_logs collection with server-side timestamp.
 */
export const sovereignAuditRecord = onCall(
  {maxInstances: 5},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const {eventType, metadata} = request.data as {
      eventType: string;
      metadata?: Record<string, unknown>;
    };

    if (!eventType) {
      throw new HttpsError("invalid-argument", "eventType is required.");
    }

    // Hash the userId for zero-knowledge audit trail
    const userIdHash = crypto
      .createHash("sha256")
      .update(request.auth.uid)
      .digest("hex");

    await db.collection("audit_logs").add({
      type: eventType,
      userIdHash,
      metadata: metadata ?? {},
      timestamp: FieldValue.serverTimestamp(),
      source: "cloud_function",
    });

    logger.info("[SovereignAudit] Event recorded", {eventType, userIdHash});
    return {status: "recorded"};
  }
);

// ─── Function: sovereignPipelineRegister ─────────────────────────────────────
/**
 * Callable: register a completed client-side pipeline run for audit trail.
 * The heavy processing happens on-device; this just persists the metadata.
 */
export const sovereignPipelineRegister = onCall(
  {maxInstances: 5},
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const payload = request.data as Partial<PipelineRunRecord>;
    const {
      runId,
      planSummary,
      integrityHash,
      auditStatus,
      issuesCount,
      technicalSchematics,
    } = payload;

    if (!runId || !integrityHash) {
      throw new HttpsError(
        "invalid-argument",
        "runId and integrityHash are required."
      );
    }

    // Verify integrity hash format (SHA-256 hex)
    if (!/^[0-9a-f]{64}$/.test(integrityHash)) {
      throw new HttpsError("invalid-argument", "Invalid integrityHash format.");
    }

    const record: PipelineRunRecord = {
      userId: request.auth.uid,
      runId,
      status: "completed",
      planSummary: planSummary ?? "Sovereign workflow",
      integrityHash,
      auditStatus: auditStatus ?? "clear",
      issuesCount: issuesCount ?? 0,
      technicalSchematics: technicalSchematics ?? [],
      completedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    await db.collection("pipeline_runs").doc(runId).set(record);
    logger.info("[SovereignPipeline] Run registered", {
      runId,
      userId: request.auth.uid,
    });

    return {status: "registered", runId};
  }
);

// ─── Scheduled: cleanupExpiredPipelineRuns ───────────────────────────────────
/**
 * ECRA 2026 §4.2 compliance: purge pipeline_runs older than 2 years.
 * Runs daily at 03:00 UTC.
 */
export const cleanupExpiredPipelineRuns = onSchedule(
  {schedule: "0 3 * * *", timeZone: "UTC", maxInstances: 1},
  async () => {
    const cutoff = Timestamp.fromDate(
      new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
    );

    const expired = await db
      .collection("pipeline_runs")
      .where("createdAt", "<", cutoff)
      .limit(500)
      .get();

    if (expired.empty) {
      logger.info("[SovereignCleanup] No expired pipeline runs found.");
      return;
    }

    const batch = db.batch();
    expired.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    logger.info(
      `[SovereignCleanup] Purged ${expired.size} expired runs (ECRA 2026 §4.2).`
    );
  }
);
