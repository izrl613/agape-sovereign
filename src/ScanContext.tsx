import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  startFullScan,
  startModuleScan,
  ScanFinding,
  ScanSession,
} from './services/scanService';
import { db } from './firebase';
import { logEvent, AuditLogType } from './services/auditService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { toast } from 'sonner';
import { MODULE_AGENTS } from './services/moduleAgentService';

interface VectorState {
  moduleId: string;
  vector: string;
  label: string;
  icon: string;
  nuked: number;
  knoxed: number;
  monitored: number;
  /** SHA-256 ID of the sealed input backing this vector, when one exists. */
  sha256Id: string | null;
  thirdPartyVerified: boolean;
  lastScanned: number | null;
}

interface ScanContextType {
  findings: ScanFinding[];
  vectors: VectorState[];
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: number;
  currentStep: number;
  totalSteps: number;
  currentModule: string | null;
  currentSubTask: string | null;
  lastScanDate: Date | null;
  error: string | null;
  triggerFullScan: () => Promise<void>;
  triggerModuleScan: (module: string) => Promise<void>;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

const VECTOR_ICONS: Record<string, string> = {
  email: '✉', social: '◈', device: '⬡', mobile: '◻', deepweb: '◉', broker: '⧫',
  password: '⬟', location: '◎', browser: '◯', financial: '⬡', medical: '⊕',
  biometric: '⊛', iot: '⊡', cloud: '⊞', darkweb: '◈', behavioral: '⊟',
};

/**
 * Vector state is derived exclusively from real findings. Nothing is
 * pre-populated: an unscanned vector shows zeroes and no hash.
 */
function deriveVectors(findings: ScanFinding[]): VectorState[] {
  return MODULE_AGENTS.map(spec => {
    const moduleFindings = findings.filter(f => f.module?.toLowerCase() === spec.moduleId);
    const latest = moduleFindings.reduce<ScanFinding | null>(
      (acc, f) => (!acc || f.timestamp > acc.timestamp ? f : acc),
      null,
    );
    return {
      moduleId: spec.moduleId,
      vector: spec.vector,
      label: spec.label,
      icon: VECTOR_ICONS[spec.moduleId] || '⬡',
      nuked: moduleFindings.filter(f => f.status === 'NUKED').length,
      knoxed: moduleFindings.filter(f => f.status === 'KNOXED').length,
      monitored: moduleFindings.filter(f => f.status === 'MONITORED').length,
      sha256Id: latest?.sha256Id || null,
      thirdPartyVerified: latest?.verification?.thirdPartyVerified === true,
      lastScanned: latest ? latest.timestamp.getTime() : null,
    };
  });
}

export const ScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, sovereignHash } = useAuth();
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentSubTask, setCurrentSubTask] = useState<string | null>(null);
  const [lastScanDate, setLastScanDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifiedFindingIds, setNotifiedFindingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFindings([]);
      setLastScanDate(null);
      setError(null);
      setIsLoading(false);
      setNotifiedFindingIds(new Set());
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, 'diff_scans'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newFindings = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate() || new Date(),
      } as ScanFinding));

      if (!isLoading) {
        newFindings.forEach(finding => {
          if (finding.status === 'NUKED' && finding.id && !notifiedFindingIds.has(finding.id)) {
            toast.error('CRITICAL EXPOSURE DETECTED', {
              description: `[${finding.module.toUpperCase()}] ${finding.finding}`,
              duration: 10000,
            });
            setNotifiedFindingIds(prev => new Set(prev).add(finding.id as string));
          }
        });
      } else {
        const initialNukedIds = new Set(
          newFindings.filter(f => f.status === 'NUKED' && f.id).map(f => f.id as string),
        );
        setNotifiedFindingIds(initialNukedIds);
      }

      setFindings(newFindings);
      setIsLoading(false);

      if (newFindings.length > 0) {
        const latest = newFindings.reduce((prev, current) =>
          prev.timestamp > current.timestamp ? prev : current,
        );
        setLastScanDate(latest.timestamp);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'diff_scans');
    });

    return () => unsubscribe();
  }, [user]);

  /**
   * A Module Agent refuses to run without a valid session SHA-256 identity
   * hash, so scans are blocked (not faked) until the Gatekeeper has issued one.
   */
  const requireSession = (): ScanSession | null => {
    if (!user) return null;
    if (!sovereignHash || !/^[0-9a-f]{64}$/.test(sovereignHash)) {
      setError('Session SHA-256 identity hash is not available. Sign in again to re-issue it.');
      toast.error('IDENTITY HASH MISSING', {
        description: 'Scans are gated on a valid SHA-256 session identity. Re-authenticate to continue.',
      });
      return null;
    }
    return { uid: user.uid, email: user.email || '', sovereignHash };
  };

  const triggerFullScan = React.useCallback(async () => {
    const session = requireSession();
    if (!session || !user) return;

    setIsScanning(true);
    setScanProgress(0);
    setCurrentStep(0);
    setTotalSteps(0);
    setCurrentModule(null);
    setCurrentSubTask(null);
    setError(null);
    logEvent(AuditLogType.SCAN_INITIATED, `Full DIFF scan initiated by ${user.email}`, user.uid, user.email || undefined);
    try {
      await startFullScan(session, (current, total, moduleName, subTask) => {
        setScanProgress(Math.round((current / total) * 100));
        setCurrentStep(current);
        setTotalSteps(total);
        if (moduleName) setCurrentModule(moduleName);
        if (subTask) setCurrentSubTask(subTask);
      });
      logEvent(AuditLogType.SCAN_COMPLETED, `Full DIFF scan completed for ${user.email}`, user.uid, user.email || undefined);
    } catch (err) {
      console.error('Scan failed:', err);
      setError(err instanceof Error ? err.message : 'Scan failed due to an unexpected error.');
    } finally {
      setIsScanning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sovereignHash]);

  const triggerModuleScan = React.useCallback(async (module: string) => {
    const session = requireSession();
    if (!session || !user) return;

    setIsScanning(true);
    setScanProgress(0);
    setCurrentStep(0);
    setTotalSteps(1);
    setCurrentModule(module);
    setCurrentSubTask('Initializing Module Agent…');
    setError(null);
    logEvent(AuditLogType.SCAN_INITIATED, `${module.toUpperCase()} scan initiated by ${user.email}`, user.uid, user.email || undefined);
    try {
      await startModuleScan(session, module, (_current, _total, _moduleName, subTask) => {
        setScanProgress(50);
        setCurrentStep(1);
        if (subTask) setCurrentSubTask(subTask);
      });
      setScanProgress(100);
      logEvent(AuditLogType.SCAN_COMPLETED, `${module.toUpperCase()} scan completed for ${user.email}`, user.uid, user.email || undefined);
      toast.success(`${module.toUpperCase()} MODULE AGENT COMPLETE`, {
        description: 'Result recorded with its SHA-256 ID and verification provenance.',
      });
    } catch (err) {
      console.error(`${module} scan failed:`, err);
      setError(err instanceof Error ? err.message : `${module} scan failed.`);
      toast.error(`${module.toUpperCase()} SCAN FAILED`, {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsScanning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sovereignHash]);

  const vectors = React.useMemo(() => deriveVectors(findings), [findings]);

  return (
    <ScanContext.Provider
      value={{
        findings,
        vectors,
        isLoading,
        isScanning,
        scanProgress,
        currentStep,
        totalSteps,
        currentModule,
        currentSubTask,
        lastScanDate,
        error,
        triggerFullScan,
        triggerModuleScan,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScan = () => {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScan must be used within a ScanProvider');
  }
  return context;
};
