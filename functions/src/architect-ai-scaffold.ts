/**
 * Architect AI callable-function foundation.
 *
 * This module is intentionally provider-agnostic. Connect the Gemini gateway,
 * scanners, report renderer, and remediation providers only after secrets,
 * quotas, consent, and Emulator Suite tests are configured.
 */
import { initializeApp, getApps } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";

if (getApps().length === 0) initializeApp();

const db = getFirestore();
const REGION = "us-east1";
const MAX_PROMPT_CHARS = 8_000;

function requireUid(request: { auth?: { uid: string } | null }): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign-in is required.");
  return uid;
}

function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new HttpsError("invalid-argument", `${field} must be a non-empty string under ${maxLength} characters.`);
  }
  return value.trim();
}

/**
 * Create a user-owned scan request. A separate worker/trigger should claim
 * queued jobs, enforce provider-specific scopes, and write normalized findings.
 */
export const requestArchitectScan = onCall(
  { region: REGION, enforceAppCheck: true, maxInstances: 3 },
  async (request) => {
    const uid = requireUid(request);
    const sourceId = requireString(request.data?.sourceId, "sourceId", 128);
    const category = requireString(request.data?.category, "category", 40);

    const sourceRef = db.doc(`users/${uid}/sources/${sourceId}`);
    const source = await sourceRef.get();
    if (!source.exists || source.get("status") !== "CONNECTED") {
      throw new HttpsError("failed-precondition", "The selected source is not connected.");
    }

    const scanRef = db.collection(`users/${uid}/scans`).doc();
    await scanRef.create({
      sourceId,
      category,
      status: "QUEUED",
      requestedAt: FieldValue.serverTimestamp(),
      requestedBy: uid,
      findingCount: 0,
      scannerVersion: "scaffold-0.1",
    });

    logger.info("Architect scan queued", { uid, scanId: scanRef.id, category });
    return { scanId: scanRef.id, status: "QUEUED" };
  },
);

/**
 * Store a user message and return a safe placeholder until the server-side
 * Gemini adapter is configured. Never accept a model name, system prompt,
 * arbitrary Firestore path, or user-supplied authorization context from client.
 */
export const askArchitectAI = onCall(
  { region: REGION, enforceAppCheck: true, maxInstances: 2 },
  async (request) => {
    const uid = requireUid(request);
    const conversationId = requireString(request.data?.conversationId, "conversationId", 128);
    const prompt = requireString(request.data?.prompt, "prompt", MAX_PROMPT_CHARS);

    const conversationRef = db.doc(`users/${uid}/conversations/${conversationId}`);
    const conversation = await conversationRef.get();
    if (!conversation.exists) {
      throw new HttpsError("not-found", "Conversation not found.");
    }

    const messageRef = conversationRef.collection("messages").doc();
    await messageRef.create({
      role: "user",
      content: prompt,
      createdAt: FieldValue.serverTimestamp(),
      redactionStatus: "PENDING",
    });

    // TODO: redact PII/secrets; load only explicitly authorized finding IDs;
    // invoke Gemini using server-held credentials; enforce per-user quotas;
    // persist assistant response and safety metadata.
    logger.info("Architect AI message accepted", { uid, conversationId, messageId: messageRef.id });

    return {
      messageId: messageRef.id,
      status: "ACCEPTED",
      response: "Architect AI's model gateway is not configured yet. Your message was recorded for this development scaffold.",
    };
  },
);

/**
 * Create a report job. A worker should snapshot authorized data, render PDF,
 * upload to users/{uid}/reports/{reportId}.pdf, then update metadata.
 */
export const requestDiffReport = onCall(
  { region: REGION, enforceAppCheck: true, maxInstances: 2 },
  async (request) => {
    const uid = requireUid(request);
    const reportRef = db.collection(`users/${uid}/reports`).doc();
    await reportRef.create({
      status: "QUEUED",
      createdAt: FieldValue.serverTimestamp(),
      requestedBy: uid,
      schemaVersion: 1,
      scoringVersion: "1.0",
    });
    return { reportId: reportRef.id, status: "QUEUED" };
  },
);
