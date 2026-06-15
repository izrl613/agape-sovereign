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

import { onCall, HttpsError, CallableRequest } from "firebase-functions/https";
import { onDocumentWritten } from "firebase-functions/firestore";
import { onSchedule } from "firebase-functions/scheduler";
import * as logger from "firebase-functions/logger";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as crypto from "crypto";

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// ─── STAGE 1A1: PASSKEY REGISTRATION OPTIONS ──────────────
// Called when an authenticated user wants to bind a passkey to their account.
// Generates WebAuthn registration options and stores the challenge in Firestore.

export const registerPasskeyOptions = onCall(
  { region: "us-east1", maxInstances: 10 },
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const userId = request.auth.uid;
    const userEmail = request.data?.userEmail || request.auth.token.email || "anon@sovereign.nyc";
    const rpName = "Agape Sovereign Enclave";
    
    // Determine RP ID based on origin
    const origin = request.rawRequest.get("origin") || "http://localhost:5173";
    const rpId = new URL(origin).hostname;

    try {
      // Get existing credentials to exclude them from registration
      const credsSnap = await db
        .collection("users").doc(userId)
        .collection("passkeyCredentials").get();
        
      const excludeCredentials = credsSnap.docs.map((doc: any) => ({
        id: doc.id,
        type: "public-key" as const,
        transports: doc.data().transports as AuthenticatorTransportFuture[] | undefined,
      }));

      const options = await generateRegistrationOptions({
        rpName,
        rpID: rpId,
        userID: new Uint8Array(Buffer.from(userId)),
        userName: userEmail,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      // Store challenge in Firestore for verification step
      await db.collection("users").doc(userId).collection("passkeyChallenge").doc("current").set({
        challenge: options.challenge,
        createdAt: FieldValue.serverTimestamp(),
      });

      return options;
    } catch (error) {
      logger.error("Failed to generate registration options", { error });
      throw new HttpsError("internal", "Failed to generate passkey options");
    }
  }
);

// ─── STAGE 1A1: VERIFY PASSKEY REGISTRATION ───────────────
// Verifies the browser's attestation response against the stored challenge.
// On success, stores the credential in Firestore for future authentication.

export const verifyPasskeyRegistration = onCall(
  { region: "us-east1", maxInstances: 10 },
  async (request: CallableRequest) => {
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
          createdAt: FieldValue.serverTimestamp(),
        });

      // Mark passkey bound on user profile
      await db.collection("users").doc(userId).update({
        passkeyBound: true,
        passkeyBoundAt: FieldValue.serverTimestamp(),
      });

      // Audit log
      await db.collection("audit_logs").add({
        event: "PASSKEY_BOUND",
        userId,
        timestamp: FieldValue.serverTimestamp(),
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

export const loginPasskeyOptions = onCall(
  { region: "us-east1", maxInstances: 10 },
  async (request: CallableRequest) => {
    try {
      const { email } = request.data;
      if (!email) {
        throw new HttpsError("invalid-argument", "Missing email");
      }

      // Find user by email in Firestore
      const userSnap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (userSnap.empty) {
        throw new HttpsError("not-found", "User not found. Sign in with Google first.");
      }

      const userDoc = userSnap.docs[0];
      const userId = userDoc.id;

      // Get stored passkey credentials for this user
      const credsSnap = await userDoc.ref.collection("passkeyCredentials").get();
      if (credsSnap.empty) {
        throw new HttpsError("not-found", "No passkey found for this account. Bind a passkey first.");
      }

      const allowCredentials = credsSnap.docs.map((doc: any) => ({
        id: doc.id,
        type: "public-key" as const,
        transports: doc.data().transports as AuthenticatorTransportFuture[] | undefined,
      }));

      const origin = request.rawRequest.get("origin") || "http://localhost:5173";
      const rpId = new URL(origin).hostname;

      const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials,
        userVerification: "preferred",
      });

      // Store challenge in Firestore keyed by userId
      await db.collection("sessions").doc(userId).collection("loginChallenge").doc("current").set({
        challenge: options.challenge,
        createdAt: FieldValue.serverTimestamp(),
      });

      return { ...options, tempUserId: userId };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Login options failed", { error });
      throw new HttpsError("internal", "Internal server error");
    }
  }
);

// ─── STAGE 1A1: VERIFY PASSKEY LOGIN ──────────────────────
// Pre-authentication endpoint. Verifies the assertion and returns
// a Firebase Custom Token to sign in with.

export const verifyPasskeyLogin = onCall(
  { region: "us-east1", maxInstances: 10 },
  async (request: CallableRequest) => {
    try {
      const { tempUserId, response: body } = request.data;

      if (!tempUserId || !body) {
        throw new HttpsError("invalid-argument", "Missing userId or response");
      }

      // Read stored challenge
      const challengeDoc = await db
        .collection("sessions").doc(tempUserId)
        .collection("loginChallenge").doc("current").get();

      if (!challengeDoc.exists) {
        throw new HttpsError("failed-precondition", "Challenge expired or missing. Start login again.");
      }

      const expectedChallenge = challengeDoc.data()?.challenge;
      if (!expectedChallenge) {
        throw new HttpsError("failed-precondition", "Challenge not found");
      }

      // Clean up challenge
      await challengeDoc.ref.delete();

      // Get the stored credential
      const credentialId = body.id;
      const credDoc = await db
        .collection("users").doc(tempUserId)
        .collection("passkeyCredentials").doc(credentialId).get();

      if (!credDoc.exists) {
        throw new HttpsError("not-found", "Credential not found");
      }

      const credData = credDoc.data()!;

      const origin = request.rawRequest.get("origin") || "http://localhost:5173";
      const rpId = new URL(origin).hostname;

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
          lastUsedAt: FieldValue.serverTimestamp(),
        });

        // Generate Firebase Custom Token (free, no Identity Platform needed)
        const customToken = await getAuth().createCustomToken(tempUserId);

        // Audit log
        await db.collection("audit_logs").add({
          event: "PASSKEY_LOGIN",
          userId: tempUserId,
          timestamp: FieldValue.serverTimestamp(),
        });

        logger.info("Passkey login verified", { userId: tempUserId });
        return { verified: true, token: customToken };
      } else {
        throw new HttpsError("unauthenticated", "Authentication failed");
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Verify login failed", { error });
      throw new HttpsError("internal", "Internal server error");
    }
  }
);

// ─── GENERATE DIFF PDF REPORT ───────────────────────────────

export const generateDiffReport = onCall(
  { region: "us-east1", maxInstances: 5 },
  async (request: CallableRequest) => {
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
      const seal = crypto
        .createHash("sha256")
        .update(JSON.stringify(reportData))
        .digest("hex");

      // Store in Firestore
      await db.collection("diff_reports").doc(reportId).set({
        userId,
        userEmail,
        sovereignScore: reportData.sovereignScore,
        generatedAt: FieldValue.serverTimestamp(),
        sha256Seal: seal,
      });

      // Audit log
      await db.collection("audit_logs").add({
        event: "PDF_GENERATED",
        userId,
        reportId,
        timestamp: FieldValue.serverTimestamp(),
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
  async (event: any) => {
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
        vectors.forEach((v: any) => {
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
        lastScoreUpdate: FieldValue.serverTimestamp(),
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
  async (request: CallableRequest) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be authenticated");
    }

    const challenge = crypto.randomBytes(32).toString("base64");

    try {
      await db.collection("sessions").doc(request.auth.uid).set(
        {
          passkeyChallenge: challenge,
          challengeExpiresAt: FieldValue.serverTimestamp(),
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
      logs.docs.forEach((doc: any) => {
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
  async (request: CallableRequest) => {
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
