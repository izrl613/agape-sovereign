/**
 * ============================================================
 * Agape Sovereign — Data Service (Firestore)
 * ============================================================
 * Drop-in replacement for Firebase Data Connect (Cloud SQL).
 * All operations use Cloud Firestore — always free on Spark plan.
 *
 * Collections:
 *   users/{uid}                   — user profile + sovereignScore
 *   identity_vectors/{id}         — identity vector metadata
 *   user_vector_statuses/{uid_vid} — per-user per-vector scan status
 *   findings/{id}                 — individual scan findings
 *   monitored_emails/{id}         — email addresses under monitoring
 * ============================================================
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ─── Shared Types ─────────────────────────────────────────────

export interface UserRecord {
  uid: string;
  name: string;
  email: string;
  provider?: string | null;
  sovereignScore?: number | null;
  lastLoginAt?: string | null;
}

export interface IdentityVector {
  id: string;
  name: string;
  icon: string;
  description?: string | null;
}

export interface UserVectorStatus {
  identityVector: IdentityVector;
  sovereigntyScore: number;
  nukedCount: number;
  knoxedCount: number;
  monitoredCount: number;
  lastScanAt: string;
  statusNotes?: string | null;
}

export interface Finding {
  id: string;
  type: string;
  label: string;
  detail: string;
  createdAt: string;
  action?: string | null;
  status?: string | null;
}

export interface MonitoredEmail {
  id: string;
  emailAddress: string;
  status: string;
  createdAt: string;
  lastCheckedAt?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────

const tsToISO = (ts: Timestamp | null | undefined): string =>
  ts ? ts.toDate().toISOString() : new Date().toISOString();

// ─── User ─────────────────────────────────────────────────────

/**
 * Upsert the authenticated user's profile.
 * Equivalent to: mutation UpsertUser
 */
export const upsertUser = async (
  uid: string,
  vars: { name: string; email: string; provider?: string | null }
): Promise<void> => {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      uid,
      name: vars.name,
      email: vars.email,
      provider: vars.provider ?? null,
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Fetch the authenticated user's profile.
 * Equivalent to: query GetUser
 */
export const getUser = async (uid: string): Promise<UserRecord | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid: d.uid ?? uid,
    name: d.name ?? d.displayName ?? "",
    email: d.email ?? "",
    provider: d.provider ?? null,
    sovereignScore: d.sovereignScore ?? null,
    lastLoginAt: d.lastLoginAt ? tsToISO(d.lastLoginAt as Timestamp) : null,
  };
};

/**
 * Update the authenticated user's sovereign score.
 * Equivalent to: mutation UpdateSovereignScore
 */
export const updateSovereignScore = async (
  uid: string,
  score: number
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), { sovereignScore: score });
};

// ─── Identity Vectors ─────────────────────────────────────────

/**
 * Seed or resolve the 16 DIFF identity vectors.
 * Vectors are shared across all users (read-only reference data).
 */
export const DEFAULT_IDENTITY_VECTORS: IdentityVector[] = [
  { id: "email", name: "Email", icon: "📧", description: "Email breach & exposure analysis" },
  { id: "social", name: "Social Media", icon: "📱", description: "Social platform footprint" },
  { id: "device", name: "Device Security", icon: "💻", description: "Hardware & OS posture" },
  { id: "mobile", name: "Mobile", icon: "📲", description: "Mobile device security" },
  { id: "deepweb", name: "Deep Web", icon: "🕸️", description: "Deep web exposure" },
  { id: "broker", name: "Data Broker", icon: "🗂️", description: "Data broker profile removal" },
  { id: "password", name: "Password", icon: "🔑", description: "Credential strength & leaks" },
  { id: "location", name: "Location", icon: "📍", description: "Geolocation privacy" },
  { id: "browser", name: "Browser", icon: "🌐", description: "Browser fingerprint & cookies" },
  { id: "financial", name: "Financial", icon: "💳", description: "Financial identity exposure" },
  { id: "medical", name: "Medical", icon: "🏥", description: "Medical record privacy" },
  { id: "biometric", name: "Biometric", icon: "🧬", description: "Biometric data exposure" },
  { id: "iot", name: "IoT", icon: "📡", description: "Smart device security" },
  { id: "cloud", name: "Cloud", icon: "☁️", description: "Cloud account audit" },
  { id: "darkweb", name: "Dark Web", icon: "🕵️", description: "Dark web credential monitoring" },
  { id: "behavioral", name: "Behavioral", icon: "🧠", description: "Behavioral profiling risk" },
];

// ─── User Vector Statuses ─────────────────────────────────────

/**
 * Upsert a user's status for one identity vector.
 * Equivalent to: mutation UpsertUserVectorStatus
 */
export const upsertUserVectorStatus = async (
  uid: string,
  vars: {
    vectorId: string;
    sovereigntyScore: number;
    nukedCount: number;
    knoxedCount: number;
    monitoredCount: number;
    statusNotes?: string | null;
  }
): Promise<void> => {
  const docId = `${uid}_${vars.vectorId}`;
  await setDoc(
    doc(db, "user_vector_statuses", docId),
    {
      userUid: uid,
      vectorId: vars.vectorId,
      sovereigntyScore: vars.sovereigntyScore,
      nukedCount: vars.nukedCount,
      knoxedCount: vars.knoxedCount,
      monitoredCount: vars.monitoredCount,
      statusNotes: vars.statusNotes ?? null,
      lastScanAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Get all vector statuses for a user.
 * Equivalent to: query GetUserVectorStatuses
 */
export const getUserVectorStatuses = async (
  uid: string
): Promise<UserVectorStatus[]> => {
  const q = query(
    collection(db, "user_vector_statuses"),
    where("userUid", "==", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const vector =
      DEFAULT_IDENTITY_VECTORS.find((v) => v.id === data.vectorId) ?? {
        id: data.vectorId,
        name: data.vectorId,
        icon: "🔍",
      };
    return {
      identityVector: vector,
      sovereigntyScore: data.sovereigntyScore ?? 0,
      nukedCount: data.nukedCount ?? 0,
      knoxedCount: data.knoxedCount ?? 0,
      monitoredCount: data.monitoredCount ?? 0,
      lastScanAt: tsToISO(data.lastScanAt as Timestamp),
      statusNotes: data.statusNotes ?? null,
    };
  });
};

// ─── Findings ────────────────────────────────────────────────

/**
 * Add a finding for a user's identity vector.
 * Equivalent to: mutation AddFinding
 */
export const addFinding = async (
  uid: string,
  vars: {
    vectorId: string;
    type: string;
    label: string;
    detail: string;
    action?: string | null;
    status?: string | null;
  }
): Promise<string> => {
  const ref = await addDoc(collection(db, "findings"), {
    userUid: uid,
    vectorId: vars.vectorId,
    type: vars.type,
    label: vars.label,
    detail: vars.detail,
    action: vars.action ?? null,
    status: vars.status ?? "KNOXED",
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Get all findings for a user in a specific vector.
 * Equivalent to: query GetFindings
 */
export const getFindings = async (
  uid: string,
  vectorId: string
): Promise<Finding[]> => {
  const q = query(
    collection(db, "findings"),
    where("userUid", "==", uid),
    where("vectorId", "==", vectorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type,
      label: data.label,
      detail: data.detail,
      createdAt: tsToISO(data.createdAt as Timestamp),
      action: data.action ?? null,
      status: data.status ?? null,
    };
  });
};

// ─── Monitored Emails ─────────────────────────────────────────

/**
 * Add an email address to monitoring.
 * Equivalent to: mutation AddMonitoredEmail
 */
export const addMonitoredEmail = async (
  uid: string,
  emailAddress: string
): Promise<string> => {
  const ref = await addDoc(collection(db, "monitored_emails"), {
    userUid: uid,
    emailAddress,
    status: "MONITORED",
    createdAt: serverTimestamp(),
    lastCheckedAt: null,
  });
  return ref.id;
};

/**
 * Remove a monitored email by its document ID.
 * Equivalent to: mutation RemoveMonitoredEmail
 */
export const removeMonitoredEmail = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "monitored_emails", id));
};

/**
 * Get all monitored emails for a user.
 * Equivalent to: query GetMonitoredEmails
 */
export const getMonitoredEmails = async (
  uid: string
): Promise<MonitoredEmail[]> => {
  const q = query(
    collection(db, "monitored_emails"),
    where("userUid", "==", uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      emailAddress: data.emailAddress,
      status: data.status,
      createdAt: tsToISO(data.createdAt as Timestamp),
      lastCheckedAt: data.lastCheckedAt
        ? tsToISO(data.lastCheckedAt as Timestamp)
        : null,
    };
  });
};
