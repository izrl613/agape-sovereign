import { sha256 } from "../services/sovereignHashService";

export interface SealRecord {
  seal: string;
  sealType: "module" | "document" | "passport" | "integrity";
  moduleId?: string;
  dataHash: string;
  timestamp: number;
  app: string;
  revoked?: boolean;
  rotatedFrom?: string;
}

export interface ModuleSealInput {
  moduleId: string;
  userId: string;
  data: Record<string, unknown>;
}

export interface DocumentSealInput {
  docType: string;
  uid: string;
  content: Record<string, unknown>;
}

export interface PassportSealInput {
  userId: string;
  modules: { moduleId: string; score: number }[];
  score: number;
}

const APP_SECRET = (() => {
  try {
    const cfg = (await import("../../firebase-applet-config.json")).default;
    return (cfg as { appSecret?: string }).appSecret || "agape-sovereign-default-secret";
  } catch {
    return "agape-sovereign-default-secret";
  }
})();

const APP_NAME = "agape-sovereign";

const sealRegistry: Map<string, SealRecord[]> = new Map();

function canonicalize(input: unknown): string {
  return JSON.stringify(input, Object.keys(input as Record<string, unknown>).sort());
}

async function computeDataHash(data: Record<string, unknown>): Promise<string> {
  const canonical = canonicalize(data);
  return sha256(canonical);
}

function buildSealPayload(parts: { moduleId?: string; userId?: string; timestamp: number; dataHash: string }): string {
  const segment = (key: string, value: string | number | undefined): string => {
    if (value === undefined || value === null) return `${key}:`;
    return `${key}:${value}`;
  };
  return [
    segment("mod", parts.moduleId),
    segment("uid", parts.userId),
    segment("ts", parts.timestamp),
    segment("hash", parts.dataHash),
    segment("app", APP_NAME),
    segment("secret", APP_SECRET),
  ].join("|");
}

export class SovereignHashService {
  private static instance: SovereignHashService;
  private appSecret: string;
  private appName: string;

  private constructor() {
    this.appSecret = APP_SECRET;
    this.appName = APP_NAME;
  }

  static getInstance(): SovereignHashService {
    if (!SovereignHashService.instance) {
      SovereignHashService.instance = new SovereignHashService();
    }
    return SovereignHashService.instance;
  }

  getAppName(): string {
    return this.appName;
  }

  getAppSecret(): string {
    return this.appSecret;
  }

  async generateModuleSeal(moduleId: string, userId: string, data: Record<string, unknown>): Promise<SealRecord> {
    const timestamp = Date.now();
    const dataHash = await computeDataHash(data);
    const payload = buildSealPayload({ moduleId, userId, timestamp, dataHash });
    const seal = await sha256(payload);

    const record: SealRecord = {
      seal,
      sealType: "module",
      moduleId,
      dataHash,
      timestamp,
      app: this.appName,
    };

    this.registerSeal(userId, record);
    return record;
  }

  async verifyModuleSeal(
    moduleId: string,
    userId: string,
    data: Record<string, unknown>,
    seal: string,
    toleranceMs = 300_000,
  ): Promise<boolean> {
    const expected = await this.generateModuleSeal(moduleId, userId, data);
    if (expected.seal !== seal) return false;

    const userSeals = sealRegistry.get(userId) || [];
    const found = userSeals.find(
      (r) => r.seal === seal && r.moduleId === moduleId && !r.revoked,
    );
    if (!found) return false;

    return Math.abs(found.timestamp - Date.now()) <= toleranceMs;
  }

  async generateDocumentSeal(docType: string, uid: string, content: Record<string, unknown>): Promise<SealRecord> {
    const timestamp = Date.now();
    const dataHash = await computeDataHash(content);
    const payload = buildSealPayload({
      moduleId: docType,
      userId: uid,
      timestamp,
      dataHash,
    });
    const seal = await sha256(payload);

    const record: SealRecord = {
      seal,
      sealType: "document",
      moduleId: docType,
      dataHash,
      timestamp,
      app: this.appName,
    };

    this.registerSeal(uid, record);
    return record;
  }

  async generatePassportSeal(input: PassportSealInput): Promise<SealRecord> {
    const timestamp = Date.now();
    const moduleSummary = input.modules
      .map((m) => `${m.moduleId}:${m.score}`)
      .sort()
      .join(";");
    const payloadData = {
      score: input.score,
      modules: moduleSummary,
    };
    const dataHash = await computeDataHash(payloadData);
    const payload = buildSealPayload({
      moduleId: "passport",
      userId: input.userId,
      timestamp,
      dataHash,
    });
    const seal = await sha256(payload);

    const record: SealRecord = {
      seal,
      sealType: "passport",
      moduleId: "passport",
      dataHash,
      timestamp,
      app: this.appName,
    };

    this.registerSeal(input.userId, record);
    return record;
  }

  async generateIntegritySeal(
    userId: string,
    moduleId: string,
    data: Record<string, unknown>,
  ): Promise<SealRecord> {
    return this.generateModuleSeal(moduleId, userId, data);
  }

  registerSeal(userId: string, record: SealRecord): void {
    const existing = sealRegistry.get(userId) || [];
    existing.push(record);
    sealRegistry.set(userId, existing);
  }

  getSealsForUser(userId: string): SealRecord[] {
    return sealRegistry.get(userId) || [];
  }

  getAllSealsForUser(userId: string): SealRecord[] {
    return this.getSealsForUser(userId);
  }

  async rotateSeal(userId: string, oldSeal: string): Promise<SealRecord | null> {
    const userSeals = sealRegistry.get(userId) || [];
    const target = userSeals.find((r) => r.seal === oldSeal && !r.revoked);
    if (!target) return null;

    target.revoked = true;
    target.rotatedFrom = oldSeal;

    const data = { rotatedFrom: oldSeal, timestamp: Date.now() };
    const dataHash = await computeDataHash(data);
    const timestamp = Date.now();
    const payload = buildSealPayload({
      moduleId: target.moduleId || "rotated",
      userId,
      timestamp,
      dataHash,
    });
    const newSeal = await sha256(payload);

    const newRecord: SealRecord = {
      seal: newSeal,
      sealType: target.sealType,
      moduleId: target.moduleId,
      dataHash,
      timestamp,
      app: this.appName,
      rotatedFrom: oldSeal,
    };

    this.registerSeal(userId, newRecord);
    return newRecord;
  }

  revokeSeal(userId: string, seal: string): boolean {
    const userSeals = sealRegistry.get(userId) || [];
    const target = userSeals.find((r) => r.seal === seal && !r.revoked);
    if (!target) return false;
    target.revoked = true;
    return true;
  }

  revokeAllSealsForUser(userId: string): number {
    const userSeals = sealRegistry.get(userId) || [];
    let count = 0;
    for (const record of userSeals) {
      if (!record.revoked) {
        record.revoked = true;
        count++;
      }
    }
    return count;
  }

  async exportSealsToFirestore(userId: string): Promise<SealRecord[]> {
    const { initializeApp, getApps, getFirestore, doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    const { getAuth } = await import("firebase/auth");

    const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp();
    const firestoreDb = getFirestore(firebaseApp);

    const userSeals = this.getSealsForUser(userId);
    const exportPromises = userSeals.map((record) => {
      const sealRef = doc(firestoreDb, "users", userId, "integritySeals", record.seal.slice(0, 32));
      return setDoc(
        sealRef,
        {
          seal: record.seal,
          sealType: record.sealType,
          moduleId: record.moduleId || null,
          dataHash: record.dataHash,
          timestamp: record.timestamp,
          app: record.app,
          revoked: record.revoked || false,
          rotatedFrom: record.rotatedFrom || null,
          exportedAt: serverTimestamp(),
        },
        { merge: true },
      );
    });

    await Promise.all(exportPromises);
    return userSeals;
  }

  async verifySealInRegistry(seal: string, userId: string): Promise<SealRecord | null> {
    const userSeals = sealRegistry.get(userId) || [];
    return userSeals.find((r) => r.seal === seal) || null;
  }
}

export function getSovereignHashService(): SovereignHashService {
  return SovereignHashService.getInstance();
}