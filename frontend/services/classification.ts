/**
 * DIFF classification — the NUKED / KNOXED / MONITORED framework.
 *
 * Every sealed receipt's honest VerificationStatus maps to exactly one
 * sovereign classification. This is a pure relabel of real verification
 * outcomes — it never upgrades or invents a result:
 *
 *   NUKED      — exposure confirmed or a real check failed (action needed)
 *   KNOXED     — verified protected / contained / no exposure found
 *   MONITORED  — sealed but not third-party verifiable right now; reassess
 *
 * See docs/ARCHITECT_AI_CANONICAL_SPEC.md § "NUKED, KNOXED, and MONITORED".
 */
import { NEON } from '../theme';
import type { ModuleReceipt, VerificationStatus } from './moduleAgents';

export type DiffClassification = 'NUKED' | 'KNOXED' | 'MONITORED';

const NUKED_STATUSES: ReadonlySet<VerificationStatus> = new Set([
  'MATCH_FOUND', // third party confirmed exposure/presence
  'LOCAL_CHECK_FAILED', // real on-device check failed — weak config
]);

const KNOXED_STATUSES: ReadonlySet<VerificationStatus> = new Set([
  'VERIFIED',
  'CHECKED_NO_MATCH',
  'LOCAL_CHECK_PASSED',
  'ARTEFACT_GENERATED', // real user artefact produced (e.g. erasure letter)
]);

export function classifyVerification(status: VerificationStatus): DiffClassification {
  if (NUKED_STATUSES.has(status)) return 'NUKED';
  if (KNOXED_STATUSES.has(status)) return 'KNOXED';
  return 'MONITORED'; // SELF_ATTESTED, API_UNREACHABLE — honest pending states
}

export function classifyReceipt(receipt: ModuleReceipt): DiffClassification {
  return classifyVerification(receipt.verification.status);
}

export const CLASSIFICATION_META: Record<
  DiffClassification,
  { label: string; color: string; description: string }
> = {
  NUKED: {
    label: 'NUKED',
    color: NEON.magenta,
    description: 'Exposure confirmed or a real check failed — remediate now.',
  },
  KNOXED: {
    label: 'KNOXED',
    color: NEON.blue,
    description: 'Verified protected, contained, or no exposure found.',
  },
  MONITORED: {
    label: 'MONITORED',
    color: NEON.orange,
    description: 'Sealed but not third-party verifiable — reassess periodically.',
  },
};

export function classificationCounts(receipts: ModuleReceipt[]): Record<DiffClassification, number> {
  const counts: Record<DiffClassification, number> = { NUKED: 0, KNOXED: 0, MONITORED: 0 };
  for (const r of receipts) counts[classifyReceipt(r)] += 1;
  return counts;
}
