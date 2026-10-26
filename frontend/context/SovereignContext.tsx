import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  auth,
  authenticateWithGoogleFederated,
  authenticateWithPasskey,
  authenticateWithSovereignEmail,
  checkUserHasBoundPasskey,
  GoogleDriveAuditExportResult,
  hasGoogleProviderLinked,
  isAdminEmail,
  onAuthStateChanged,
  registerHardwarePasskeyForCurrentUser,
  save26MonthAuditPdfToFederatedGoogleAccount,
  signOutSovereign,
  syncZeroKnowledgeAuditSeal,
  User,
} from '../firebase';
import {
  executeModuleAgent,
  IDENTITY_VECTOR_MODULES,
  IdentityVectorDefinition,
  ModuleAgentExecutionResult,
} from '../services/moduleAgents';
import {
  deriveSessionSha256Id,
  rotateDeviceEnclaveSalt,
} from '../services/sovereignCrypto';
import {
  loadAllDecryptedModuleData,
  purgeUserVault,
  saveEncryptedModuleData,
} from '../services/localVault';
import {
  ArchitectMessage,
  askArchitectAI,
} from '../services/architectEngine';
import {
  compile26MonthIdentityAuditPdf,
  CompiledAuditPdfArtifact,
} from '../services/pdfAuditService';

export type ActiveWorkspaceView =
  | 'dashboard'
  | 'modules'
  | 'architect'
  | 'audit-pdf'
  | 'admin';

interface SovereignContextValue {
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  hasGoogleFederated: boolean;
  hasBoundPasskey: boolean;
  isDualSecured: boolean;
  sha256Id: string;
  sha256Lit: boolean;
  lastSealTimestampMs: number;
  encryptedEnvelopeCount: number;
  activeView: ActiveWorkspaceView;
  setActiveView: (v: ActiveWorkspaceView) => void;
  selectedModuleId: string;
  setSelectedModuleId: (id: string) => void;
  modules: readonly IdentityVectorDefinition[];
  resultsByModule: Record<string, ModuleAgentExecutionResult>;
  scanningModules: Record<string, boolean>;
  sweepRunning: boolean;
  sovereignScore: number;
  scannedVectorCount: number;
  architectMessages: ArchitectMessage[];
  architectThinking: boolean;
  lastCompiledAudit: CompiledAuditPdfArtifact | null;
  lastGoogleDriveExport: GoogleDriveAuditExportResult | null;
  runModuleScan: (
    moduleId: string,
    rawInput: string,
    localFile?: File | null
  ) => Promise<ModuleAgentExecutionResult>;
  runBaselineSovereignSweep: () => Promise<void>;
  sendArchitectInquiry: (question: string) => Promise<void>;
  signInWithGoogle: (opts?: { requestDriveScope?: boolean; linkToCurrentSession?: boolean }) => Promise<void>;
  signInWithPasskey: (email?: string) => Promise<void>;
  signInOrEnrollEmail: (email: string, password: string, mode: 'signin' | 'enroll') => Promise<void>;
  bindHardwarePasskey: () => Promise<string>;
  download26MonthAuditPdf: () => Promise<CompiledAuditPdfArtifact>;
  save26MonthAuditPdfToGoogleDrive: () => Promise<GoogleDriveAuditExportResult>;
  rotateEnclaveSha256Id: () => Promise<void>;
  purgeZeroKnowledgeVault: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SovereignContext = createContext<SovereignContextValue | null>(null);

export const SovereignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [hasBoundPasskey, setHasBoundPasskey] = useState<boolean>(false);
  const [sha256Id, setSha256Id] = useState<string>('');
  const [lastSealTimestampMs, setLastSealTimestampMs] = useState<number>(Date.now());
  const [activeView, setActiveView] = useState<ActiveWorkspaceView>('dashboard');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('V-01');
  const [resultsByModule, setResultsByModule] = useState<Record<string, ModuleAgentExecutionResult>>({});
  const [scanningModules, setScanningModules] = useState<Record<string, boolean>>({});
  const [sweepRunning, setSweepRunning] = useState<boolean>(false);
  const [architectThinking, setArchitectThinking] = useState<boolean>(false);
  const [lastCompiledAudit, setLastCompiledAudit] = useState<CompiledAuditPdfArtifact | null>(null);
  const [lastGoogleDriveExport, setLastGoogleDriveExport] = useState<GoogleDriveAuditExportResult | null>(null);

  const [architectMessages, setArchitectMessages] = useState<ArchitectMessage[]>([
    {
      id: 'architect-welcome',
      role: 'architect',
      content:
        '### Architect AI Online — Zero-Knowledge Backbone Active\n' +
        'Your session is hard-protected by a live **SHA256 ID** zero-knowledge encryption key (`PBKDF2-SHA256` + `AES-256-GCM`).\n\n' +
        '- Ask me anything about **privacy**, **security hardening**, **Dual Security (Passkey + Sign-In With Google)**, or any of the **16 Identity Vector Modules (`V-01`..`V-16`)**.\n' +
        '- Mention any domain (e.g. `sovereign.nyc`) or run a module scan, and I will analyze your real third-party verified telemetry with zero data leakage.',
      timestampIso: new Date().toISOString(),
    },
  ]);

  // Listen to Firebase Auth state and derive deterministic zero-knowledge SHA256 ID
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      const anchor = nextUser?.uid || 'ephemeral-local-enclave';
      const derivedSha = await deriveSessionSha256Id(anchor);
      setSha256Id(derivedSha);
      setLastSealTimestampMs(Date.now());

      if (nextUser) {
        const passkeyBound = await checkUserHasBoundPasskey(nextUser.uid);
        setHasBoundPasskey(passkeyBound);
        try {
          const loaded = await loadAllDecryptedModuleData<Omit<ModuleAgentExecutionResult, 'encryptedEnvelope'>>(
            nextUser.uid,
            derivedSha
          );
          const hydrated: Record<string, ModuleAgentExecutionResult> = {};
          for (const [modId, item] of Object.entries(loaded)) {
            hydrated[modId] = {
              ...item.payload,
              encryptedEnvelope: item.envelope,
            };
          }
          setResultsByModule(hydrated);
        } catch {
          setResultsByModule({});
        }
      } else {
        setHasBoundPasskey(false);
        setResultsByModule({});
      }

      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  const hasGoogleFederated = useMemo(() => hasGoogleProviderLinked(user), [user]);
  const isDualSecured = Boolean(user && hasGoogleFederated && hasBoundPasskey);
  const isAdmin = useMemo(() => isAdminEmail(user?.email), [user]);
  const sha256Lit = sha256Id.length === 64;

  const scannedList = useMemo(() => Object.values(resultsByModule), [resultsByModule]);
  const scannedVectorCount = scannedList.length;
  const sovereignScore = useMemo(() => {
    if (scannedList.length === 0) return 100;
    const avgRisk = Math.round(
      scannedList.reduce((acc, r) => acc + r.riskScore, 0) / scannedList.length
    );
    return Math.max(0, 100 - avgRisk);
  }, [scannedList]);

  const encryptedEnvelopeCount = useMemo(
    () => Object.keys(resultsByModule).length,
    [resultsByModule]
  );

  const runModuleScan = useCallback(
    async (
      moduleId: string,
      rawInput: string,
      localFile?: File | null
    ): Promise<ModuleAgentExecutionResult> => {
      const activeSha = sha256Id || (await deriveSessionSha256Id(user?.uid || 'ephemeral-local-enclave'));
      if (!sha256Id) setSha256Id(activeSha);

      setScanningModules((prev) => ({ ...prev, [moduleId]: true }));
      try {
        const result = await executeModuleAgent({
          moduleId,
          rawInput,
          sha256Id: activeSha,
          localFile,
          dualAuthContext: {
            hasGoogleFederated,
            hasBoundPasskey,
          },
        });

        setResultsByModule((prev) => ({ ...prev, [moduleId]: result }));
        setLastSealTimestampMs(Date.now());

        const vaultUid = user?.uid || 'local-enclave';
        const { encryptedEnvelope: _env, ...plainPayload } = result;
        const savedEnvelope = await saveEncryptedModuleData(vaultUid, moduleId, activeSha, plainPayload);

        if (user) {
          try {
            await syncZeroKnowledgeAuditSeal(
              user.uid,
              activeSha,
              savedEnvelope,
              savedEnvelope.expiresAtIso
            );
          } catch {
            // Local encrypted vault remains authoritative if Firestore rule awaits token refresh
          }
        }

        return result;
      } finally {
        setScanningModules((prev) => ({ ...prev, [moduleId]: false }));
      }
    },
    [sha256Id, user, hasGoogleFederated, hasBoundPasskey]
  );

  const runBaselineSovereignSweep = useCallback(async () => {
    if (sweepRunning) return;
    setSweepRunning(true);
    try {
      const userEmail = user?.email || 'idin@agape.nyc';
      const userDomain = userEmail.includes('@') ? userEmail.split('@')[1] : 'sovereign.nyc';

      const sweepPlan: Array<{ id: string; input: string }> = [
        { id: 'V-01', input: userEmail },
        { id: 'V-04', input: userDomain },
        { id: 'V-05', input: userDomain },
        { id: 'V-07', input: 'self' },
        { id: 'V-08', input: userDomain },
        { id: 'V-09', input: 'doubleclick.net' },
        { id: 'V-12', input: 'npm:jspdf@4.2.1' },
        { id: 'V-14', input: 'accounts.google.com' },
        { id: 'V-15', input: `https://${userDomain}` },
      ];

      // Run in controlled batches of 3 to respect public zero-cost API rate limits
      for (let i = 0; i < sweepPlan.length; i += 3) {
        const batch = sweepPlan.slice(i, i + 3);
        await Promise.allSettled(
          batch.map((item) => runModuleScan(item.id, item.input))
        );
      }
    } finally {
      setSweepRunning(false);
    }
  }, [sweepRunning, user, runModuleScan]);

  const sendArchitectInquiry = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      const userMsg: ArchitectMessage = {
        id: `usr-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestampIso: new Date().toISOString(),
      };
      setArchitectMessages((prev) => [...prev, userMsg]);
      setArchitectThinking(true);

      try {
        const activeSha = sha256Id || (await deriveSessionSha256Id(user?.uid || 'ephemeral-local-enclave'));
        const res = await askArchitectAI(trimmed, {
          sha256Id: activeSha,
          resultsByModule,
          hasGoogleFederated,
          hasBoundPasskey,
          userEmail: user?.email,
        });

        const replyMsg: ArchitectMessage = {
          id: `arc-${Date.now()}`,
          role: 'architect',
          content: res.reply,
          timestampIso: new Date().toISOString(),
          referencedModules: res.referencedModules,
          liveVerificationNote: res.liveVerificationNote,
        };
        setArchitectMessages((prev) => [...prev, replyMsg]);
      } finally {
        setArchitectThinking(false);
      }
    },
    [sha256Id, user, resultsByModule, hasGoogleFederated, hasBoundPasskey]
  );

  const signInWithGoogle = useCallback(
    async (opts?: { requestDriveScope?: boolean; linkToCurrentSession?: boolean }) => {
      const res = await authenticateWithGoogleFederated(opts);
      setUser(res.user);
      const passkeyBound = await checkUserHasBoundPasskey(res.user.uid);
      setHasBoundPasskey(passkeyBound);
    },
    []
  );

  const signInWithPasskey = useCallback(async (email?: string) => {
    const signedInUser = await authenticateWithPasskey(email);
    setUser(signedInUser);
    setHasBoundPasskey(true);
  }, []);

  const signInOrEnrollEmail = useCallback(
    async (email: string, password: string, mode: 'signin' | 'enroll') => {
      const signedInUser = await authenticateWithSovereignEmail(email, password, mode);
      setUser(signedInUser);
      const passkeyBound = await checkUserHasBoundPasskey(signedInUser.uid);
      setHasBoundPasskey(passkeyBound);
    },
    []
  );

  const bindHardwarePasskey = useCallback(async (): Promise<string> => {
    const res = await registerHardwarePasskeyForCurrentUser();
    setHasBoundPasskey(true);
    return res.credentialId;
  }, []);

  const download26MonthAuditPdf = useCallback(async (): Promise<CompiledAuditPdfArtifact> => {
    const activeSha = sha256Id || (await deriveSessionSha256Id(user?.uid || 'ephemeral-local-enclave'));
    const artifact = await compile26MonthIdentityAuditPdf({
      userEmail: user?.email || 'sovereign-local-enclave',
      uid: user?.uid || 'local-enclave',
      sha256Id: activeSha,
      hasGoogleFederated,
      hasBoundPasskey,
      resultsByModule,
    });
    setLastCompiledAudit(artifact);

    const url = URL.createObjectURL(artifact.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);

    return artifact;
  }, [sha256Id, user, hasGoogleFederated, hasBoundPasskey, resultsByModule]);

  const save26MonthAuditPdfToGoogleDrive = useCallback(async (): Promise<GoogleDriveAuditExportResult> => {
    const activeSha = sha256Id || (await deriveSessionSha256Id(user?.uid || 'ephemeral-local-enclave'));
    const artifact = await compile26MonthIdentityAuditPdf({
      userEmail: user?.email || 'Federated Google Sovereign Principal',
      uid: user?.uid || 'federated-google-principal',
      sha256Id: activeSha,
      hasGoogleFederated: true,
      hasBoundPasskey,
      resultsByModule,
    });
    setLastCompiledAudit(artifact);

    const exportRes = await save26MonthAuditPdfToFederatedGoogleAccount(
      artifact.blob,
      artifact.fileName,
      artifact.auditSealSha256,
      artifact.retentionUntilIso
    );
    setLastGoogleDriveExport(exportRes);
    return exportRes;
  }, [sha256Id, user, hasBoundPasskey, resultsByModule]);

  const rotateEnclaveSha256Id = useCallback(async () => {
    rotateDeviceEnclaveSalt();
    const anchor = user?.uid || 'ephemeral-local-enclave';
    const nextSha = await deriveSessionSha256Id(anchor);
    setSha256Id(nextSha);
    setResultsByModule({});
    setLastSealTimestampMs(Date.now());
  }, [user]);

  const purgeZeroKnowledgeVault = useCallback(async () => {
    const vaultUid = user?.uid || 'local-enclave';
    await purgeUserVault(vaultUid);
    setResultsByModule({});
    setLastCompiledAudit(null);
  }, [user]);

  const signOut = useCallback(async () => {
    await signOutSovereign();
    setResultsByModule({});
    setLastCompiledAudit(null);
    setLastGoogleDriveExport(null);
  }, []);

  const value = useMemo<SovereignContextValue>(
    () => ({
      user,
      authLoading,
      isAdmin,
      hasGoogleFederated,
      hasBoundPasskey,
      isDualSecured,
      sha256Id,
      sha256Lit,
      lastSealTimestampMs,
      encryptedEnvelopeCount,
      activeView,
      setActiveView,
      selectedModuleId,
      setSelectedModuleId,
      modules: IDENTITY_VECTOR_MODULES,
      resultsByModule,
      scanningModules,
      sweepRunning,
      sovereignScore,
      scannedVectorCount,
      architectMessages,
      architectThinking,
      lastCompiledAudit,
      lastGoogleDriveExport,
      runModuleScan,
      runBaselineSovereignSweep,
      sendArchitectInquiry,
      signInWithGoogle,
      signInWithPasskey,
      signInOrEnrollEmail,
      bindHardwarePasskey,
      download26MonthAuditPdf,
      save26MonthAuditPdfToGoogleDrive,
      rotateEnclaveSha256Id,
      purgeZeroKnowledgeVault,
      signOut,
    }),
    [
      user,
      authLoading,
      isAdmin,
      hasGoogleFederated,
      hasBoundPasskey,
      isDualSecured,
      sha256Id,
      sha256Lit,
      lastSealTimestampMs,
      encryptedEnvelopeCount,
      activeView,
      selectedModuleId,
      resultsByModule,
      scanningModules,
      sweepRunning,
      sovereignScore,
      scannedVectorCount,
      architectMessages,
      architectThinking,
      lastCompiledAudit,
      lastGoogleDriveExport,
      runModuleScan,
      runBaselineSovereignSweep,
      sendArchitectInquiry,
      signInWithGoogle,
      signInWithPasskey,
      signInOrEnrollEmail,
      bindHardwarePasskey,
      download26MonthAuditPdf,
      save26MonthAuditPdfToGoogleDrive,
      rotateEnclaveSha256Id,
      purgeZeroKnowledgeVault,
      signOut,
    ]
  );

  return <SovereignContext.Provider value={value}>{children}</SovereignContext.Provider>;
};

export function useSovereign(): SovereignContextValue {
  const ctx = useContext(SovereignContext);
  if (!ctx) {
    throw new Error('useSovereign must be used inside <SovereignProvider>');
  }
  return ctx;
}
