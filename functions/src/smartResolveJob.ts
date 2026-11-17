import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Scheduled Daily Smart-Resolve Job (00:00 UTC)
 *
 * Scans `diff_scans` across the enclave for low-risk findings (e.g. MONITORED,
 * non-critical telemetry, tracking pixels, or low-severity unverified items)
 * and promotes them to KNOXED status in batch with rate-limiting.
 * Operates at $0.00 cost under Firebase free tier quotas (<= 15 RPM).
 */
export const dailySmartResolveJob = onSchedule(
  {
    schedule: "0 0 * * *", // Once a day at midnight UTC
    timeZone: "UTC",
    maxInstances: 1,
    memory: "256MiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    logger.info("Executing scheduled Daily Smart-Resolve Job...", { scheduleTime: event.scheduleTime, jobName: event.jobName });

    const db = admin.firestore();

    try {
      // Query for non-KNOXED findings
      const snapshot = await db
        .collection("diff_scans")
        .where("status", "in", ["MONITORED", "NUKED"])
        .limit(50)
        .get();

      if (snapshot.empty) {
        logger.info("Daily Smart-Resolve: No findings required auto-resolution.");
        return;
      }

      let resolvedCount = 0;
      const batch = db.batch();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const severity = data.severity ?? 50;

        // Auto-resolve criteria:
        // 1. Status is MONITORED (observational/low risk), OR
        // 2. Status is NUKED but severity <= 40 (minor tracking or metadata)
        const isLowRisk =
          data.status === "MONITORED" ||
          (data.status === "NUKED" && severity <= 40);

        if (isLowRisk) {
          batch.update(doc.ref, {
            status: "KNOXED",
            autoResolvedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoResolvedBy: "SMART_RESOLVE_DAILY_JOB",
          });
          resolvedCount++;
        }
      }

      if (resolvedCount > 0) {
        await batch.commit();
        logger.info(`Daily Smart-Resolve: Successfully auto-resolved ${resolvedCount} findings to KNOXED.`);
      } else {
        logger.info("Daily Smart-Resolve: Scanned findings were high-severity; none were auto-resolved.");
      }
    } catch (err: any) {
      logger.error("Daily Smart-Resolve Job failed:", err);
    }
  }
);
