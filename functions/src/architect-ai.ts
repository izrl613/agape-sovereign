/**
 * ============================================================
 * ARCHITECT AI — Cloud Functions (Firebase v2)
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Deploy with: firebase deploy --only functions:default
 */

import { onCall, HttpsError } from 'firebase-functions/https';
import { onDocumentWritten } from 'firebase-functions/firestore';
import { onSchedule } from 'firebase-functions/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage().bucket();

// ─── GENERATE DIFF PDF REPORT ───────────────────────────────

export const generateDiffReport = onCall(
  { region: 'us-east1', maxInstances: 5 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || 'user@agape.nyc';

    try {
      logger.info('PDF generation started', { userId });

      // Fetch user profile
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as any;
      const reportId = `DIFF-${userId}-${Date.now()}`;

      // Create report metadata
      const reportData = {
        userId,
        userEmail,
        reportId,
        sovereignScore: userData.sovereignScore || 71,
        tier: userData.sovereignTier || 'EXPOSURE_RISK',
        generatedAt: new Date().toISOString(),
      };

      // Generate SHA-256 seal
      const crypto = require('crypto');
      const seal = crypto
        .createHash('sha256')
        .update(JSON.stringify(reportData))
        .digest('hex');

      // Store in Firestore
      await db.collection('diff_reports').doc(reportId).set({
        userId,
        userEmail,
        sovereignScore: reportData.sovereignScore,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sha256Seal: seal,
      });

      // Audit log
      await db.collection('audit_logs').add({
        event: 'PDF_GENERATED',
        userId,
        reportId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('PDF metadata stored', { reportId });

      return {
        success: true,
        reportId,
        sovereignScore: reportData.sovereignScore,
        sha256Seal: seal,
      };
    } catch (error) {
      logger.error('PDF generation failed', { error });
      throw new HttpsError('internal', 'Failed to generate report');
    }
  }
);

// ─── RECALCULATE SOVEREIGN SCORE ────────────────────────────

export const recalculateSovereignScore = onDocumentWritten(
  {
    document: 'diff_scans/{scanId}/vectorResults/{vectorId}',
    region: 'us-east1',
  },
  async (event) => {
    const after = event.data?.after.data() as any;
    const userId = after?.userId;

    if (!userId) return;

    try {
      // Calculate from all vectors
      const scans = await db
        .collection('diff_scans')
        .where('userId', '==', userId)
        .get();

      let totalNuked = 0;
      let totalKnoxed = 0;

      for (const scan of scans.docs) {
        const vectors = await scan.ref.collection('vectorResults').get();
        vectors.forEach((v) => {
          const data = v.data();
          totalNuked += data.nukedCount || 0;
          totalKnoxed += data.knoxedCount || 0;
        });
      }

      // Score calculation
      const sovereignScore = Math.max(
        0,
        Math.min(100, 100 - totalNuked * 3 + Math.min(totalKnoxed * 0.5, 25))
      );

      const tier =
        sovereignScore >= 85
          ? 'KNOXED_SOVEREIGN'
          : sovereignScore >= 65
            ? 'PARTIALLY_SECURED'
            : sovereignScore >= 40
              ? 'EXPOSURE_RISK'
              : 'CRITICALLY_NUKED';

      await db.collection('users').doc(userId).update({
        sovereignScore: Math.round(sovereignScore),
        sovereignTier: tier,
        lastScoreUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Score updated', { userId, score: sovereignScore });
    } catch (error) {
      logger.error('Recalculation failed', { error });
    }
  }
);

// ─── PASSKEY CHALLENGE ──────────────────────────────────────

export const generatePasskeyChallenge = onCall(
  { region: 'us-east1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const crypto = require('crypto');
    const challenge = crypto.randomBytes(32).toString('base64');

    try {
      await db.collection('sessions').doc(request.auth.uid).set(
        {
          passkeyChallenge: challenge,
          challengeExpiresAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { challenge };
    } catch (error) {
      throw new HttpsError('internal', 'Challenge generation failed');
    }
  }
);

// ─── AUDIT LOG CLEANUP (Monthly) ────────────────────────────

export const cleanupAuditLogs = onSchedule(
  { region: 'us-east1', schedule: 'every 30 days' },
  async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const logs = await db
        .collection('audit_logs')
        .where('timestamp', '<', thirtyDaysAgo)
        .limit(100)
        .get();

      let deleted = 0;
      const batch = db.batch();
      logs.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deleted++;
      });

      if (deleted > 0) await batch.commit();
      logger.info('Audit cleanup', { deleted });
    } catch (error) {
      logger.error('Cleanup failed', { error });
    }
  }
);

// ─── GENERATE ECRA OPT-OUT ──────────────────────────────────

export const generateECRAOptOut = onCall(
  { region: 'us-east1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    const { dataBrokerId, userName, userEmail } = request.data;

    const template = `ECRA 2026 DATA SUBJECT REMOVAL REQUEST

From: ${userName}
Email: ${userEmail}
Date: ${new Date().toISOString()}

To Whom It May Concern:

Pursuant to ECRA 2026 § 4.2, I request immediate deletion of all personal data held on file.

Respectfully,
${userName}`;

    return { optOutTemplate: template };
  }
);
