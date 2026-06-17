import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { startFullScan, startModuleScan, getScanFindings, ScanFinding } from './services/scanService';
import { db } from './firebase';
import { logEvent, AuditLogType } from './services/auditService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';

interface ScanContextType {
  findings: ScanFinding[];
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: number; // 0 to 100
  currentStep: number;
  totalSteps: number;
  currentModule: string | null;
  currentSubTask: string | null;
  lastScanDate: Date | null;
  error: string | null;
  triggerFullScan: () => Promise<void>;
  triggerModuleScan: (module: string, userData?: string) => Promise<void>;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

import { toast } from 'sonner';

export const ScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
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

    // Handle emergency bypass user with local storage
    if (user.uid === 'emergency-bypass-admin-999') {
      setIsLoading(true);
      const localFindings = localStorage.getItem(`scan_findings_${user.uid}`);
      if (localFindings) {
        try {
          const parsed = JSON.parse(localFindings);
          const findingsWithDates = parsed.map((f: any) => ({
            ...f,
            timestamp: new Date(f.timestamp)
          }));
          setFindings(findingsWithDates);
          if (findingsWithDates.length > 0) {
            const latest = findingsWithDates.reduce((prev: any, current: any) => 
              (prev.timestamp > current.timestamp) ? prev : current
            );
            setLastScanDate(latest.timestamp);
          }
        } catch (e) {
          setFindings([]);
        }
      } else {
        setFindings([]);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, "diff_scans"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newFindings = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        timestamp: d.data().timestamp?.toDate() || new Date()
      } as ScanFinding));
      
      // Check for new NUKED findings to notify
      if (!isLoading) {
        newFindings.forEach(finding => {
          if (finding.status === 'NUKED' && finding.id && !notifiedFindingIds.has(finding.id)) {
            toast.error(`CRITICAL EXPOSURE DETECTED`, {
              description: `[${finding.module.toUpperCase()}] ${finding.finding}`,
              duration: 10000,
            });
            setNotifiedFindingIds(prev => new Set(prev).add(finding.id as string));
          }
        });
      } else {
        // Initial load: just mark existing NUKED as notified so we don't spam on login
        const initialNukedIds = new Set(newFindings.filter(f => f.status === 'NUKED' && f.id).map(f => f.id as string));
        setNotifiedFindingIds(initialNukedIds);
      }

      setFindings(newFindings);
      setIsLoading(false);
      
      if (newFindings.length > 0) {
        const latest = newFindings.reduce((prev, current) => 
          (prev.timestamp > current.timestamp) ? prev : current
        );
        setLastScanDate(latest.timestamp);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'diff_scans');
    });

    return () => unsubscribe();
  }, [user]);

  const triggerFullScan = React.useCallback(async () => {
    if (!user) return;
    setIsScanning(true);
    setScanProgress(0);
    setCurrentStep(0);
    setTotalSteps(0);
    setCurrentModule(null);
    setCurrentSubTask(null);
    setError(null);
    logEvent(AuditLogType.SCAN_INITIATED, `Full DIFF scan initiated by ${user.email}`, user.uid, user.email || undefined);
    try {
      await startFullScan(user.uid, user.email!, (current, total, moduleName, subTask) => {
        setScanProgress(Math.round((current / total) * 100));
        setCurrentStep(current);
        setTotalSteps(total);
        if (moduleName) setCurrentModule(moduleName);
        if (subTask) setCurrentSubTask(subTask);
      });
      logEvent(AuditLogType.SCAN_COMPLETED, `Full DIFF scan completed for ${user.email}`, user.uid, user.email || undefined);
    } catch (err) {
      console.error("Scan failed:", err);
      setError(err instanceof Error ? err.message : "Scan failed due to an unexpected error.");
    } finally {
      setIsScanning(false);
    }
  }, [user]);

  const triggerModuleScan = React.useCallback(async (module: string, userData: string = "") => {
    if (!user) return;
    setIsScanning(true);
    setScanProgress(0);
    setCurrentStep(0);
    setTotalSteps(1);
    setCurrentModule(module);
    setCurrentSubTask("Initializing...");
    setError(null);
    logEvent(AuditLogType.SCAN_INITIATED, `${module.toUpperCase()} scan initiated by ${user.email}`, user.uid, user.email || undefined);
    try {
      await startModuleScan(user.uid, user.email!, module, userData, (current, total, moduleName, subTask) => {
        setScanProgress(Math.round((current / total) * 100));
        setCurrentStep(current);
        setTotalSteps(total);
        if (subTask) setCurrentSubTask(subTask);
      });
      setScanProgress(100);
      setCurrentStep(1);
      logEvent(AuditLogType.SCAN_COMPLETED, `${module.toUpperCase()} scan completed for ${user.email}`, user.uid, user.email || undefined);
      toast.success(`${module.toUpperCase()} Scan Complete`, {
        description: `The Architect has finished analyzing your ${module} vector.`
      });
    } catch (err) {
      console.error(`${module} scan failed:`, err);
      setError(err instanceof Error ? err.message : `${module} scan failed.`);
      toast.error(`${module.toUpperCase()} Scan Failed`);
    } finally {
      setIsScanning(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || isLoading || isScanning) return;

    const now = new Date().getTime();
    const lastScanTime = lastScanDate ? lastScanDate.getTime() : 0;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - lastScanTime > twentyFourHours) {
      const timer = setTimeout(() => {
        triggerFullScan();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, lastScanDate, isScanning, triggerFullScan]);

  return (
    <ScanContext.Provider value={{ findings, isLoading, isScanning, scanProgress, currentStep, totalSteps, currentModule, currentSubTask, lastScanDate, error, triggerFullScan, triggerModuleScan }}>
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
