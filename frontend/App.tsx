import React, { useState, useMemo } from 'react';
import { 
  INITIAL_16_DIFF_VECTORS, 
  INITIAL_ADMIN_TELEMETRY,
  ADMIN_AUTHORIZED_EMAILS 
} from './constants';
import { DiffVector, UserProfile, VectorCategory, AdminTelemetryState } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DiffModuleCard } from './components/DiffModuleCard';
import { ArchitectAIChat } from './components/ArchitectAIChat';
import { MultistepOnboardingSplash } from './components/MultistepOnboardingSplash';
import { PdfReportModal } from './components/PdfReportModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { UserProfileModal } from './components/UserProfileModal';
import { EmailBreachScannerModal } from './components/EmailBreachScannerModal';
import { DataBrokerDispatcherModal } from './components/DataBrokerDispatcherModal';
import { FileVaultShredderModal } from './components/FileVaultShredderModal';
import { HardwareEnclaveInspectorModal } from './components/HardwareEnclaveInspectorModal';
import { DeepWebDarknetModal } from './components/DeepWebDarknetModal';
import { DnsSurveillanceModal } from './components/DnsSurveillanceModal';
import { DarknetStealerScannerModal } from './components/DarknetStealerScannerModal';
import { BiometricDefenseModal } from './components/BiometricDefenseModal';
import { CloudBackupVerificationModal } from './components/CloudBackupVerificationModal';
import { IdentityDocumentMdlModal } from './components/IdentityDocumentMdlModal';
import { AdIdLocationScrubberModal } from './components/AdIdLocationScrubberModal';
import { SocialMediaScrubberModal } from './components/SocialMediaScrubberModal';
import { FinancialTokenizationModal } from './components/FinancialTokenizationModal';
import { SmartHomeTelemetryModal } from './components/SmartHomeTelemetryModal';
import { PasswordHashStrengthModal } from './components/PasswordHashStrengthModal';
import { calculateSha256 } from './services/cryptoService';
import { 
  initAuthSession, 
  subscribeToUserEnclave, 
  saveUserEnclaveData, 
  logLiveTelemetry, 
  subscribeToTelemetryLogs 
} from './services/firebase';
import { 
  ShieldCheck, 
  Flame, 
  Layers, 
  Radio, 
  Sparkles, 
  Filter, 
  Hash, 
  CheckCircle2, 
  UserPlus, 
  Send, 
  Lock, 
  Skull, 
  ScanFace,
  MapPin,
  Share2,
  CreditCard,
  Tv,
  Mail,
  Wifi,
  Cpu,
  FileText,
  KeyRound,
  Globe,
  Cloud
} from 'lucide-react';

export default function App() {
  const [vectors, setVectors] = useState<DiffVector[]>(INITIAL_16_DIFF_VECTORS);
  const [activeCategory, setActiveCategory] = useState<VectorCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXPOSED' | 'KNOXED' | 'NUKED'>('ALL');
  const [isScanning, setIsScanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state - Multistep onboarding is active by default to welcome user post-login
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEmailScannerOpen, setIsEmailScannerOpen] = useState(false);
  const [isSocialScrubberOpen, setIsSocialScrubberOpen] = useState(false);
  const [isFileVaultOpen, setIsFileVaultOpen] = useState(false);
  const [isHardwareEnclaveOpen, setIsHardwareEnclaveOpen] = useState(false);
  const [isDeepWebOpen, setIsDeepWebOpen] = useState(false);
  const [isBrokerDispatcherOpen, setIsBrokerDispatcherOpen] = useState(false);
  const [isDnsSurveillanceOpen, setIsDnsSurveillanceOpen] = useState(false);
  const [isFinancialTokenizationOpen, setIsFinancialTokenizationOpen] = useState(false);
  const [isBiometricDefenseOpen, setIsBiometricDefenseOpen] = useState(false);
  const [isCloudBackupOpen, setIsCloudBackupOpen] = useState(false);
  const [isIdentityMdlOpen, setIsIdentityMdlOpen] = useState(false);
  const [isSmartHomeTelemetryOpen, setIsSmartHomeTelemetryOpen] = useState(false);
  const [isLocationScrubberOpen, setIsLocationScrubberOpen] = useState(false);
  const [isStealerScannerOpen, setIsStealerScannerOpen] = useState(false);
  const [isPasswordStrengthOpen, setIsPasswordStrengthOpen] = useState(false);
  const [focusedVector, setFocusedVector] = useState<DiffVector | null>(null);

  // Admin telemetry
  const [adminTelemetry, setAdminTelemetry] = useState<AdminTelemetryState>(INITIAL_ADMIN_TELEMETRY);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: '',
    primaryEmail: '',
    backupEmails: [],
    federatedProvider: 'Google',
    passkeyStatus: 'BOUND',
    passkeyDeviceId: '',
    masterKeyHash: '',
    createdAt: '',
    sovereignScore: 0,
    cloudAuditId: ''
  });

  // Status filter handlers
  const handleFilterChange = (st: 'ALL' | 'EXPOSED' | 'KNOXED' | 'NUKED') => {
    setStatusFilter(st);
  };

  // Vector update handler
  const handleUpdatePerimeterVector = (id: string, status: string, vectorData?: any) => {
    setVectors(vectors.map(v => v.id === id ? { ...v, status } : v));
    showToast('Enclave perimeter vector updated successfully.');
  };

  // Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0B1020]">
      <section className="p-4 sm:p-5 md:p-6 bg-[#0F172A]">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            16 Perimeter Security Modules
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Identity security platform with 16 perimeter security modules
          </p>
        </div>
      </section>
      <main className="p-6 bg-[#0F172A] rounded-lg">
        <div className="text-sm text-slate-300">
          Showing {vectors.length} of 16 identity modules
        </div>
      </main>
      <footer className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-xs text-slate-300 font-mono">
            16 Perimeter Security Modules • 2026 ECRA LTS Certified
          </p>
        </div>
      </footer>
      <DeepWebDarknetModal
        isOpen={isDeepWebOpen}
        onClose={() => setIsDeepWebOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />
      <CloudBackupVerificationModal
        isOpen={isCloudBackupOpen}
        onClose={() => setIsCloudBackupOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />
      <PasswordHashStrengthModal
        isOpen={isPasswordStrengthOpen}
        onClose={() => setIsPasswordStrengthOpen(false)}
      />
      <SocialMediaScrubberModal
        isOpen={isSocialScrubberOpen}
        onClose={() => setIsSocialScrubberOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />
      <FinancialTokenizationModal
        isOpen={isFinancialTokenizationOpen}
        onClose={() => setIsFinancialTokenizationOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />
      <SmartHomeTelemetryModal
        isOpen={isSmartHomeTelemetryOpen}
        onClose={() => setIsSmartHomeTelemetryOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />
    </div>
  );
}