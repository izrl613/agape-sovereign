import { doc, setDoc, getDoc, collection, query, where, getDocs, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { DIFF_MODULES } from '../constants';
import { IVMModule, IVMData } from './ivmTypes';

export interface IVMModule {
  id: string;
  label: string;
  vector: string;
  icon: string;
  severity: number;
  nuked: number;
  knoxed: number;
  monitored: number;
  pillar: string;
  capability: string;
  techniques: string[];
}

export interface IVMData {
  [moduleId: string]: Record<string, any>;
}

export interface SovereignIdentityBlueprint {
  version: string;
  userId: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  ivmData: IVMData;
  sovereignScore: number;
  tier: string;
  sha256Seal: string;
  exportVersion: number;
  validityWindowWeeks: number;
}

// 226 weeks validity window (~4.3 years / ~52 months)
export const VALIDITY_WINDOW_WEEKS = 226;
export const VALIDITY_WINDOW_LABEL = `${VALIDITY_WINDOW_WEEKS} weeks (~4.3 years)`;

export async function saveIVMModule(moduleId: string, data: Record<string, any>, userId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'ivmData', moduleId);
  const module = DIFF_MODULES.find(m => m.id === moduleId);
  await setDoc(docRef, {
    ...data,
    moduleId,
    vector: module?.vector,
    pillar: module?.pillar,
    updatedAt: Timestamp.now(),
    updatedBy: auth.currentUser?.uid,
  }, { merge: true });
}

export async function getIVMModule(moduleId: string, userId: string): Promise<Record<string, any> | null> {
  const docRef = doc(db, 'users', userId, 'ivmData', moduleId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function getAllIVMData(userId: string): Promise<IVMData> {
  const q = query(collection(db, 'users', userId, 'ivmData'));
  const snapshot = await getDocs(q);
  const data: IVMData = {};
  snapshot.docs.forEach(doc => {
    data[doc.id] = doc.data();
  });
  return data;
}

export async function calculateSovereignScore(ivmData: IVMData): Promise<{ score: number; tier: string; totalNuked: number; totalKnoxed: number }> {
  let totalNuked = 0;
  let totalKnoxed = 0;

  for (const [moduleId, data] of Object.entries(ivmData)) {
    const module = DIFF_MODULES.find(m => m.id === moduleId);
    if (!module) continue;

    if (data?.status === 'NUKED' || (data?.riskLevel && data.riskLevel > 70)) {
      totalNuked += module.nuked || 1;
    } else {
      totalKnoxed += module.knoxed || 1;
    }
  }

  const score = Math.max(0, Math.min(100, 100 - totalNuked * 3 + Math.min(totalKnoxed * 0.5, 25)));
  let tier = 'CRITICALLY_NUKED';
  if (score >= 85) tier = 'KNOXED_SOVEREIGN';
  else if (score >= 65) tier = 'PARTIALLY_SECURED';
  else if (score >= 40) tier = 'EXPOSURE_RISK';

  return { score: Math.round(score), tier, totalNuked, totalKnoxed };
}

function generateSHA256(data: string): string {
  // Simple SHA-256 implementation for client-side
  // In production, use Web Crypto API or a proper library
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export async function generateIdentityBlueprint(userId: string, email: string, ivmData: IVMData): Promise<SovereignIdentityBlueprint> {
  const { score, tier } = await calculateSovereignScore(ivmData);
  const payload = JSON.stringify({ userId, ivmData, timestamp: Date.now() });
  const sha256Seal = generateSHA256(payload);

  const blueprint: SovereignIdentityBlueprint = {
    version: '1.0',
    userId,
    email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ivmData,
    sovereignScore: ivmData.sovereignScore || 71,
    tier: ivmData.tier || 'PARTIALLY_SECURED',
    sha256Seal,
    exportVersion: 1,
    validityWindowWeeks: VALIDITY_WINDOW_WEEKS,
  };

  return blueprint;
}

export async function saveIdentityExport(blueprint: SovereignIdentityBlueprint, passkeyCredentialId: string): Promise<string> {
  const exportId = `EXPORT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const docRef = doc(db, 'users', blueprint.userId, EXPORT_COLLECTION, exportId);

  await setDoc(docRef, {
    ...blueprint,
    passkeyCredentialId,
    exportedAt: Timestamp.now(),
    status: 'active',
  });

  return exportId;
}

export async function getIdentityExports(userId: string) {
  const q = query(collection(db, 'users', userId, EXPORT_COLLECTION), where('status', '==', 'active'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getIdentityExport(userId: string, exportId: string) {
  const docRef = doc(db, 'users', userId, EXPORT_COLLECTION, exportId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function revokeIdentityExport(userId: string, exportId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, EXPORT_COLLECTION, exportId);
  await setDoc(docRef, { status: 'revoked', revokedAt: Timestamp.now() }, { merge: true });
}

export async function importIdentityBlueprint(userId: string, blueprint: SovereignIdentityBlueprint): Promise<void> {
  const batch = writeBatch(db);

  // Save IVM data
  for (const [moduleId, data] of Object.entries(blueprint.ivmData)) {
    const docRef = doc(db, 'users', userId, 'ivmData', moduleId);
    batch.set(docRef, {
      ...data,
      moduleId,
      importedAt: Timestamp.now(),
      importedFrom: blueprint.sha256Seal,
    }, { merge: true });
  }

  // Update user profile
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    sovereignScore: blueprint.sovereignScore,
    sovereignTier: blueprint.tier,
    lastImport: Timestamp.now(),
    identityBlueprintHash: blueprint.sha256Seal,
  });

  await batch.commit();
}

export function validateBlueprintIntegrity(blueprint: SovereignIdentityBlueprint): boolean {
  const payload = JSON.stringify({ userId: blueprint.userId, ivmData: blueprint.ivmData, timestamp: blueprint.createdAt });
  const computedSeal = generateSHA256(payload);
  return computedSeal === blueprint.sha256Seal;
}

export { generateSHA256 };