/**
 * identityRiskService.ts — Unosecur-inspired Identity Risk & Privilege Remediation
 *
 * Provides:
 *  - Discovery of human and non-human identities (users, service accounts, API tokens)
 *  - Over-privilege scoring and entitlement analysis
 *  - Remediation recommendations and one-click scope reduction
 *  - Persisted risk records in Firestore (collection: identity_risks)
 */

import { db } from '../firebase';
import {
  collection, addDoc, updateDoc, doc,
  query, where, orderBy, onSnapshot,
  serverTimestamp, Unsubscribe
} from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────────

export type IdentityType = 'HUMAN' | 'NON_HUMAN' | 'API_TOKEN' | 'SERVICE_ACCOUNT' | 'OAUTH_APP';
export type PrivilegeLevel = 'OVER_PRIVILEGED' | 'STANDARD' | 'MINIMAL';
export type RemediationAction = 'REVOKE' | 'RESTRICT' | 'MONITOR' | 'APPROVE' | 'ROTATE';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export interface IdentityRecord {
  id?: string;
  userId: string;         // owning user (sovereign userId)
  entityName: string;
  entityType: IdentityType;
  privilegeLevel: PrivilegeLevel;
  riskScore: number;      // 0–100 (higher = riskier)
  riskLevel: RiskLevel;
  exposedScopes: string[];
  lastActive?: Date;
  recommendedAction: RemediationAction;
  isRemediated: boolean;
  remediatedAt?: Date;
  notes?: string;
  timestamp: Date;
}

export interface PrivilegeFlag {
  scope: string;
  reason: string;         // Why it's overprivileged
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

// ── Risk Scoring ───────────────────────────────────────────────────────────────

const HIGH_RISK_SCOPES = [
  'admin', 'owner', 'editor', 'write', 'delete', 'manage',
  'iam.admin', 'storage.admin', 'firestore.admin', 'run.admin',
  'secretmanager', 'cloudkms', 'billing', 'resourcemanager',
];

const CRITICAL_SCOPES = [
  'iam.serviceAccountTokenCreator', 'iam.serviceAccountAdmin',
  'resourcemanager.projectIamAdmin', 'storage.objectAdmin',
  'allusers', 'allAuthenticatedUsers',
];

export function analyzePrivileges(scopes: string[]): {
  riskScore: number;
  riskLevel: RiskLevel;
  privilegeLevel: PrivilegeLevel;
  flags: PrivilegeFlag[];
} {
  const flags: PrivilegeFlag[] = [];
  let score = 0;

  for (const scope of scopes) {
    const lower = scope.toLowerCase();

    for (const critical of CRITICAL_SCOPES) {
      if (lower.includes(critical.toLowerCase())) {
        flags.push({ scope, reason: 'Critical/wildcard permission detected', severity: 'CRITICAL' });
        score += 30;
        break;
      }
    }

    for (const high of HIGH_RISK_SCOPES) {
      if (lower.includes(high.toLowerCase())) {
        flags.push({ scope, reason: 'Broad write or administrative access', severity: 'HIGH' });
        score += 15;
        break;
      }
    }
  }

  // Extra risk for non-human identities without scoped minimums
  const total = scopes.length;
  if (total > 10) score += (total - 10) * 2;

  const riskScore = Math.min(100, score);

  const riskLevel: RiskLevel =
    riskScore >= 80 ? 'CRITICAL' :
    riskScore >= 60 ? 'HIGH' :
    riskScore >= 40 ? 'MEDIUM' :
    riskScore >= 20 ? 'LOW' : 'SAFE';

  const privilegeLevel: PrivilegeLevel =
    flags.some(f => f.severity === 'CRITICAL') ? 'OVER_PRIVILEGED' :
    flags.some(f => f.severity === 'HIGH')     ? 'OVER_PRIVILEGED' :
    riskScore > 0                              ? 'STANDARD'        : 'MINIMAL';

  return { riskScore, riskLevel, privilegeLevel, flags };
}

export function recommendAction(
  entityType: IdentityType,
  privilegeLevel: PrivilegeLevel,
  riskLevel: RiskLevel
): RemediationAction {
  if (riskLevel === 'CRITICAL') return entityType === 'HUMAN' ? 'RESTRICT' : 'REVOKE';
  if (riskLevel === 'HIGH')     return entityType === 'API_TOKEN' ? 'ROTATE' : 'RESTRICT';
  if (privilegeLevel === 'OVER_PRIVILEGED') return 'RESTRICT';
  if (riskLevel === 'MEDIUM')   return 'MONITOR';
  return 'APPROVE';
}

// ── Firestore CRUD ─────────────────────────────────────────────────────────────

export const saveIdentityRisk = async (record: IdentityRecord): Promise<string> => {
  const ref = await addDoc(collection(db, 'identity_risks'), {
    ...record,
    exposedScopes: record.exposedScopes.join(','),
    timestamp: serverTimestamp(),
    lastActive: record.lastActive ?? null,
  });
  return ref.id;
};

export const remediateIdentity = async (recordId: string): Promise<void> => {
  await updateDoc(doc(db, 'identity_risks', recordId), {
    isRemediated: true,
    remediatedAt: serverTimestamp(),
    privilegeLevel: 'MINIMAL' as PrivilegeLevel,
    riskScore: 0,
    riskLevel: 'SAFE' as RiskLevel,
  });
};

export const subscribeIdentityRisks = (
  userId: string,
  onUpdate: (records: IdentityRecord[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'identity_risks'),
    where('userId', '==', userId),
    orderBy('riskScore', 'desc')
  );
  return onSnapshot(q, snap => {
    const records: IdentityRecord[] = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<IdentityRecord, 'id' | 'exposedScopes' | 'timestamp'>),
      exposedScopes: (d.data().exposedScopes as string)?.split(',').filter(Boolean) ?? [],
      timestamp: d.data().timestamp?.toDate() ?? new Date(),
      lastActive: d.data().lastActive?.toDate() ?? undefined,
      remediatedAt: d.data().remediatedAt?.toDate() ?? undefined,
    }));
    onUpdate(records);
  }, err => console.warn('[IdentityRisk] Snapshot error:', err));
};

// ── Seed / Demo Identities ─────────────────────────────────────────────────────

export const DEMO_IDENTITIES: Omit<IdentityRecord, 'id' | 'userId' | 'timestamp'>[] = [
  {
    entityName: 'ci-deploy-bot',
    entityType: 'SERVICE_ACCOUNT',
    privilegeLevel: 'OVER_PRIVILEGED',
    riskScore: 85,
    riskLevel: 'CRITICAL',
    exposedScopes: ['storage.admin', 'iam.serviceAccountTokenCreator', 'run.admin'],
    recommendedAction: 'REVOKE',
    isRemediated: false,
    notes: 'CI bot has storage and IAM admin — should be restricted to deploy only.',
  },
  {
    entityName: 'firebase-admin-sdk',
    entityType: 'SERVICE_ACCOUNT',
    privilegeLevel: 'OVER_PRIVILEGED',
    riskScore: 72,
    riskLevel: 'HIGH',
    exposedScopes: ['firestore.admin', 'storage.objectAdmin', 'auth.admin'],
    recommendedAction: 'RESTRICT',
    isRemediated: false,
    notes: 'Remove storage.objectAdmin; auth operations only require auth.admin.',
  },
  {
    entityName: 'legacy-backup-script',
    entityType: 'SERVICE_ACCOUNT',
    privilegeLevel: 'OVER_PRIVILEGED',
    riskScore: 68,
    riskLevel: 'HIGH',
    exposedScopes: ['storage.admin', 'cloudsql.admin'],
    recommendedAction: 'REVOKE',
    isRemediated: false,
    notes: 'Script has not run in 90 days. Recommend full revocation.',
  },
  {
    entityName: 'openai-proxy-agent',
    entityType: 'API_TOKEN',
    privilegeLevel: 'OVER_PRIVILEGED',
    riskScore: 90,
    riskLevel: 'CRITICAL',
    exposedScopes: ['allusers', 'storage.admin', 'secretmanager'],
    recommendedAction: 'ROTATE',
    isRemediated: false,
    notes: 'AI inference SA with secret manager access — critical rotation needed.',
  },
  {
    entityName: 'analytics-reader',
    entityType: 'SERVICE_ACCOUNT',
    privilegeLevel: 'MINIMAL',
    riskScore: 5,
    riskLevel: 'SAFE',
    exposedScopes: ['bigquery.dataViewer', 'logging.viewer'],
    recommendedAction: 'APPROVE',
    isRemediated: true,
    notes: 'Well-scoped read-only analytics service account.',
  },
];
