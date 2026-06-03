/**
 * ============================================================
 * ARCHITECT AI — Cloud Functions (Firebase v2)
 * Agape Sovereign Enclave 2026
 *
 * Stage 1A1: Passkey Setup and Authentication
 * WebAuthn/FIDO2 passkey registration and authentication
 * using Firebase Custom Tokens (zero-cost, no Identity Platform)
 * ============================================================
 *
 * Deploy with: firebase deploy --only functions
 */

import { onCall, HttpsError, onRequest } from "firebase-functions/https";
import { onDocumentWritten } from "firebase-functions/firestore";
import { onSchedule } from "firebase-functions/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const RP_NAME = "Agape Sovereign";

// ─── STAGE 1A1: PASSKEY REGISTRATION OPTIONS ──────────────
// Called when an authenticated user wants to bind a passkey to their account.
// Generates WebAuthn registration options and stores the challenge in Firestore.


// ─── STAGE 1A1: VERIFY PASSKEY REGISTRATION ───────────────
// Verifies the browser's attestation response against the stored challenge.
// On success, stores the credential in Firestore for future authentication.

export const verifyPasskeyRegistration = onCall(
  { region: "us-east1", maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const { response } = request.data;

    if (!response) {
      throw new HttpsError("invalid-argument", "Missing attestation response");
    }

    try {
      // Read the stored challenge
      const challengeDoc = await db
        .collection("users").doc(userId)
        .collection("passkeyChallenge").doc("current").get();

      if (!challengeDoc.exists) {
        throw new HttpsError("failed-precondition", "Challenge expired. Please try again.");
      }

      const expectedChallenge = challengeDoc.data()?.challenge;
      if (!expectedChallenge) {
        throw new HttpsError("failed-precondition", "Challenge not found");
      }

      // Determine origin and RP ID from request
      const origin = request.rawRequest.get("origin") || "http://localhost:5173";
      const rpId = new URL(origin).hostname;

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
      });

      // Clean up the challenge
      await challengeDoc.ref.delete();

      if (!verification.verified || !verification.registrationInfo) {
        throw new HttpsError("unauthenticated", "Passkey verification failed");
      }

      const { credential } = verification.registrationInfo;

      await db
        .collection("users").doc(userId)
        .collection("passkeyCredentials").doc(credential.id)
        .set({
          publicKey: Buffer.from(credential.publicKey).toString("base64url"),
          credentialID: credential.id,
          counter: credential.counter,
          transports: response.response?.transports || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Mark passkey bound on user profile
      await db.collection("users").doc(userId).update({
        passkeyBound: true,
        passkeyBoundAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Audit log
      await db.collection("audit_logs").add({
        event: "PASSKEY_BOUND",
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Passkey registered successfully", { userId });
      return { verified: true };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Verify registration failed", { error });
      throw new HttpsError("internal", "Failed to verify passkey registration");
    }
  }
);

// ─── STAGE 1A1: PASSKEY LOGIN OPTIONS ─────────────────────
// Pre-authentication endpoint. User is NOT signed in yet.
// Uses onRequest (not onCall) so no Firebase Auth required.
// Generates authentication options and stores challenge in Firestore.

export const loginPasskeyOptions = onRequest(
  { region: "us-east1", maxInstances: 10, cors: true },
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Missing email" });
        return;
      }

      // Find user by email in Firestore
      const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (userSnap.empty) {
        res.status(404).json({ error: "User not found. Sign in with Google first." });
        return;
      }

      const userDoc = userSnap.docs[0];
      const userId = userDoc.id;

      // Get stored passkey credentials for this user
      const credsSnap = await userDoc.ref.collection("passkeyCredentials").get();
      if (credsSnap.empty) {
        res.status(404).json({ error: "No passkey found for this account. Bind a passkey first." });
        return;
      }

      const allowCredentials = credsSnap.docs.map((doc) => ({
        id: doc.id,
        type: "public-key" as const,
        transports: doc.data().transports as AuthenticatorTransportFuture[] | undefined,
      }));

      const host = req.get("host")?.split(":")[0] || "localhost";
      const rpId = host === "127.0.0.1" ? "localhost" : host;

      const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials,
        userVerification: "preferred",
      });

      // Store challenge in Firestore keyed by userId
      // Also store the userId in the response so the client can pass it to verify
      await db.collection("sessions").doc(userId).collection("loginChallenge").doc("current").set({
        challenge: options.challenge,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ ...options, tempUserId: userId });
    } catch (error) {
      logger.error("Login options failed", { error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── STAGE 1A1: VERIFY PASSKEY LOGIN ──────────────────────
// Pre-authentication endpoint. Verifies the assertion and returns
// a Firebase Custom Token to sign in with.

export const verifyPasskeyLogin = onRequest(
  { region: "us-east1", maxInstances: 10, cors: true },
  async (req, res) => {
    try {
      const { body } = req;
      const { tempUserId } = req.body;

      if (!tempUserId) {
        res.status(400).json({ error: "Missing userId" });
        return;
      }

      // Read stored challenge
      const challengeDoc = await db
        .collection("sessions").doc(tempUserId)
        .collection("loginChallenge").doc("current").get();

      if (!challengeDoc.exists) {
        res.status(400).json({ error: "Challenge expired or missing. Start login again." });
        return;
      }

      const expectedChallenge = challengeDoc.data()?.challenge;
      if (!expectedChallenge) {
        res.status(400).json({ error: "Challenge not found" });
        return;
      }

      // Clean up challenge
      await challengeDoc.ref.delete();

      // Get the stored credential
      const credentialId = body.id;
      const credDoc = await db
        .collection("users").doc(tempUserId)
        .collection("passkeyCredentials").doc(credentialId).get();

      if (!credDoc.exists) {
        res.status(400).json({ error: "Credential not found" });
        return;
      }

      const credData = credDoc.data()!;

      const host = req.get("host")?.split(":")[0] || "localhost";
      const rpId = host === "127.0.0.1" ? "localhost" : host;
      const origin = `${req.protocol}://${req.get("host")}`;

      const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpId,
        credential: {
          id: credData.credentialID,
          publicKey: new Uint8Array(Buffer.from(credData.publicKey, "base64url")),
          counter: credData.counter,
        },
      });

      if (verification.verified) {
        // Update credential counter
        await credDoc.ref.update({
          counter: verification.authenticationInfo.newCounter,
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Generate Firebase Custom Token (free, no Identity Platform needed)
        const customToken = await admin.auth().createCustomToken(tempUserId);

        // Audit log
        await db.collection("audit_logs").add({
          event: "PASSKEY_LOGIN",
          userId: tempUserId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info("Passkey login verified", { userId: tempUserId });
        res.json({ verified: true, token: customToken });
      } else {
        res.status(400).json({ verified: false, error: "Authentication failed" });
      }
    } catch (error) {
      logger.error("Verify login failed", { error });
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── GENERATE DIFF PDF REPORT ───────────────────────────────

export const generateDiffReport = onCall(
  { region: "us-east1", maxInstances: 5 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const userEmail = request.auth.token.email || "user@agape.nyc";

    try {
      logger.info("PDF generation started", { userId });

      // Fetch user profile
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data() as any;
      const reportId = `DIFF-${userId}-${Date.now()}`;

      // Create report metadata
      const reportData = {
        userId,
        userEmail,
        reportId,
        sovereignScore: userData.sovereignScore || 71,
        tier: userData.sovereignTier || "EXPOSURE_RISK",
        generatedAt: new Date().toISOString(),
      };

      // Generate SHA-256 seal
      const crypto = import("crypto");
      const seal = crypto
        .createHash("sha256")
        .update(JSON.stringify(reportData))
        .digest("hex");

      // Store in Firestore
      await db.collection("diff_reports").doc(reportId).set({
        userId,
        userEmail,
        sovereignScore: reportData.sovereignScore,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sha256Seal: seal,
      });

      // Audit log
      await db.collection("audit_logs").add({
        event: "PDF_GENERATED",
        userId,
        reportId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("PDF metadata stored", { reportId });

      return {
        success: true,
        reportId,
        sovereignScore: reportData.sovereignScore,
        sha256Seal: seal,
      };
    } catch (error) {
      logger.error("PDF generation failed", { error });
      throw new HttpsError("internal", "Failed to generate report");
    }
  }
);

// ─── RECALCULATE SOVEREIGN SCORE ────────────────────────────

export const recalculateSovereignScore = onDocumentWritten(
  {
    document: "diff_scans/{scanId}/vectorResults/{vectorId}",
    region: "us-east1",
  },
  async (event) => {
    const after = event.data?.after.data() as any;
    const userId = after?.userId;

    if (!userId) return;

    try {
      // Calculate from all vectors
      const scans = await db
        .collection("diff_scans")
        .where("userId", "==", userId)
        .get();

      let totalNuked = 0;
      let totalKnoxed = 0;

      for (const scan of scans.docs) {
        const vectors = await scan.ref.collection("vectorResults").get();
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
        sovereignScore >= 85 ?
          "KNOXED_SOVEREIGN" :
          sovereignScore >= 65 ?
            "PARTIALLY_SECURED" :
            sovereignScore >= 40 ?
              "EXPOSURE_RISK" :
              "CRITICALLY_NUKED";

      await db.collection("users").doc(userId).update({
        sovereignScore: Math.round(sovereignScore),
        sovereignTier: tier,
        lastScoreUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info("Score updated", { userId, score: sovereignScore });
    } catch (error) {
      logger.error("Recalculation failed", { error });
    }
  }
);

// ─── PASSKEY CHALLENGE ──────────────────────────────────────

export const generatePasskeyChallenge = onCall(
  { region: "us-east1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const crypto = require("crypto");
    const challenge = crypto.randomBytes(32).toString("base64");

    try {
      await db.collection("sessions").doc(request.auth.uid).set(
        {
          passkeyChallenge: challenge,
          challengeExpiresAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return { challenge };
    } catch (error) {
      throw new HttpsError("internal", "Challenge generation failed");
    }
  }
);

// ─── AUDIT LOG CLEANUP (Monthly) ────────────────────────────

export const cleanupAuditLogs = onSchedule(
  { region: "us-east1", schedule: "every 30 days" },
  async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const logs = await db
        .collection("audit_logs")
        .where("timestamp", "<", thirtyDaysAgo)
        .limit(100)
        .get();

      let deleted = 0;
      const batch = db.batch();
      logs.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deleted++;
      });

      if (deleted > 0) await batch.commit();
      logger.info("Audit cleanup", { deleted });
    } catch (error) {
      logger.error("Cleanup failed", { error });
    }
  }
);

// ─── GENERATE ECRA OPT-OUT ──────────────────────────────────

export const generateECRAOptOut = onCall(
  { region: "us-east1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const { userName, userEmail } = request.data;

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
