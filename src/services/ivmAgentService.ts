/**
 * IVM AGENT SERVICE — Identity Vector Module Agent
 * ============================================================
 * OPERATION FRAMEWORK — Phase 2: Identity Data Collector
 *
 * Module 1 of the Sovereign Pipeline.
 * Retrieves the identity vector payload associated with a given
 * SHA-256 hash. Querying is HASH-DRIVEN ONLY — no raw PII keys.
 *
 * The 16 IVM vectors map to the DiffModules in the PWA:
 *  V-01 Email      V-02 Social    V-03 Device    V-04 System
 *  V-05 Laptop     V-06 DeepWeb   V-07 DataBroker V-08 Password
 *  V-09 Network    V-10 Cloud     V-11 Communication V-12 Financial
 *  V-13 Document   V-14 OAuth     V-15 Legal     V-16 Biometric
 * ============================================================
 */

import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { isValidSHA256 } from './sovereignHashService';

export interface IdentityVector {
  module: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: string[];
  lastScanned: string;
  metadata?: Record<string, unknown>;
}

export interface IVMPayload {
  sha256Id: string;
  vectors: Record<string, IdentityVector>;
  totalRiskScore: number;
  scanTimestamp: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

const IVM_MODULES = [
  'email', 'social', 'device', 'system', 'laptop', 'deepweb',
  'databroker', 'password', 'network', 'cloud', 'communication',
  'financial', 'document', 'oauth', 'legal', 'biometric',
] as const;

/**
 * Execute IVM data collection for a given SHA-256 identity hash.
 * All Firestore queries use the hash as the sole lookup key.
 */
export async function executeIVMAgent(sha256Id: string): Promise<IVMPayload> {
  if (!isValidSHA256(sha256Id)) {
    throw new Error('[IVM] Invalid SHA-256 hash supplied. Aborting.');
  }

  const scanTimestamp = new Date().toISOString();

  try {
    // Look up the user's scan data by hash
    const userRef = doc(db, 'sovereign_audits', sha256Id);
    const userSnap = await getDoc(userRef);

    const vectors: Record<string, IdentityVector> = {};
    let totalRisk = 0;

    if (userSnap.exists()) {
      const data = userSnap.data();
      for (const module of IVM_MODULES) {
        const v = data.vectors?.[module];
        if (v) {
          vectors[module] = v as IdentityVector;
          totalRisk += v.score ?? 0;
        }
      }
    }

    // If no stored audit exists yet, return empty vectors (first-scan state)
    const status: IVMPayload['status'] =
      Object.keys(vectors).length === IVM_MODULES.length
        ? 'SUCCESS'
        : Object.keys(vectors).length > 0
        ? 'PARTIAL'
        : 'FAILED';

    return {
      sha256Id,
      vectors,
      totalRiskScore: totalRisk,
      scanTimestamp,
      status,
    };
  } catch (err) {
    console.error('[IVM] Data retrieval failed:', err);
    throw new Error(`[IVM] Failed to retrieve identity vectors: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Persist a completed IVM scan result back to Firestore.
 * Keyed entirely by SHA-256 hash — no direct uid or email stored here.
 */
export async function persistIVMResult(payload: IVMPayload): Promise<void> {
  const { doc: fsDoc, setDoc, serverTimestamp } = await import('firebase/firestore');

  await setDoc(
    fsDoc(db, 'sovereign_audits', payload.sha256Id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
