/**
 * CAPACITY SERVICE
 * ============================================================
 * OPERATION FRAMEWORK — Phase 1.5: Capacity & License Gate
 *
 * Architecture: GCP BeyondCorp Enterprise / Identity-Aware Proxy (IAP)
 * This gate fires AFTER successful identity hashing but BEFORE
 * any heavy internal module calls (IVM, Architect AI).
 *
 * Flow: GCP IAP → Auth(A/B) → [Capacity & Policy Check] → Dashboard
 * ============================================================
 */

import { db } from '../firebase';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

const CAPACITY_DOC = 'system/capacity';
const MAX_USERS = 10000; // GCP BeyondCorp Enterprise scalable capacity limit


export interface CapacityState {
  activeUsers: number;
  maxUsers: number;
  available: boolean;
  reservedAt?: string;
}

/**
 * Check current capacity and attempt to reserve a slot.
 * Uses a Firestore transaction to prevent race conditions.
 *
 * Returns { available: true } if slot reserved,
 * Returns { available: false, reason } if at capacity.
 */
export async function checkAndReserveCapacity(
  sha256Id: string
): Promise<{ available: boolean; reason?: string; state?: CapacityState }> {
  try {
    const capacityRef = doc(db, CAPACITY_DOC);

    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(capacityRef);
      const data = snap.exists() ? snap.data() : { activeUsers: 0 };
      const current: number = data.activeUsers ?? 0;

      if (current >= MAX_USERS) {
        return {
          available: false,
          reason: `Maximum capacity reached (${current}/${MAX_USERS} users). Please try again later or contact admin.`,
          state: { activeUsers: current, maxUsers: MAX_USERS, available: false },
        };
      }

      // Reserve slot transactionally
      tx.set(
        capacityRef,
        {
          activeUsers: increment(1),
          lastReservedAt: serverTimestamp(),
          lastReservedBy: sha256Id, // Only hash stored — never raw UID
        },
        { merge: true }
      );

      return {
        available: true,
        state: {
          activeUsers: current + 1,
          maxUsers: MAX_USERS,
          available: true,
          reservedAt: new Date().toISOString(),
        },
      };
    });

    return result;
  } catch (err) {
    console.error('[CAPACITY] Transaction failed:', err);
    // Fail open with a warning rather than blocking the user on network errors
    return {
      available: true,
      reason: 'Capacity check unavailable — proceeding with caution.',
    };
  }
}

/**
 * Release a capacity slot when a user logs out or session ends.
 */
export async function releaseCapacitySlot(): Promise<void> {
  try {
    const capacityRef = doc(db, CAPACITY_DOC);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(capacityRef);
      if (!snap.exists()) return;
      const current = snap.data().activeUsers ?? 0;
      tx.update(capacityRef, {
        activeUsers: Math.max(0, current - 1),
      });
    });
  } catch (err) {
    console.warn('[CAPACITY] Failed to release slot — will self-correct on next Firestore cleanup.');
  }
}

/**
 * Read current capacity state (admin view).
 */
export async function getCapacityState(): Promise<CapacityState> {
  try {
    const snap = await getDoc(doc(db, CAPACITY_DOC));
    if (!snap.exists()) return { activeUsers: 0, maxUsers: MAX_USERS, available: true };
    const d = snap.data();
    return {
      activeUsers: d.activeUsers ?? 0,
      maxUsers: MAX_USERS,
      available: (d.activeUsers ?? 0) < MAX_USERS,
    };
  } catch {
    return { activeUsers: 0, maxUsers: MAX_USERS, available: true };
  }
}
