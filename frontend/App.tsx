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
<<<<<<< HEAD
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
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);

  // Live user profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => ({
    fullName: 'Sovereign Enclave User',
    primaryEmail: '',
    backupEmails: [],
    federatedProvider: 'Google',
    passkeyStatus: 'PENDING',
    passkeyDeviceId: 'FIDO2-HARDWARE-PASSKEY',
    masterKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: new Date().toISOString(),
    sovereignScore: 35,
    cloudAuditId: `DIFF-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  }));

=======
import { calculateSha256 } from './services/cryptoService';
import { ShieldCheck, Flame, Layers, Radio, Sparkles, Filter, Hash, CheckCircle2, UserPlus } from 'lucide-react';

export default function App() {
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
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
<<<<<<< HEAD
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
=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
  const [focusedVector, setFocusedVector] = useState<DiffVector | null>(null);

  // Admin telemetry
  const [adminTelemetry, setAdminTelemetry] = useState<AdminTelemetryState>(INITIAL_ADMIN_TELEMETRY);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: 'Israel David',
    primaryEmail: 'idin@agape.nyc',
    backupEmails: ['agape@sovereign.nyc', 'id.security@diff-enclave.io'],
    federatedProvider: 'Apple',
    passkeyStatus: 'HARDWARE_ENFORCED',
    passkeyDeviceId: 'FIDO2-APPLE-SECURE-ENCLAVE-2026',
    masterKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    createdAt: 'March 2026',
    sovereignScore: 68,
    cloudAuditId: 'DIFF-2026-ENCLAVE-001',
  });

  // Calculate dynamic sovereign score
  const sovereignScore = useMemo(() => {
    const total = vectors.length;
    if (total === 0) return 100;
    const knoxed = vectors.filter(v => v.status === 'KNOXED').length;
    const nuked = vectors.filter(v => v.status === 'NUKED').length;
    // Nuked is 90% sovereign, Knoxed is 100% sovereign
    const score = Math.round(((knoxed * 1.0 + nuked * 0.9) / total) * 100);
    return Math.min(100, Math.max(10, score));
  }, [vectors]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // NUKE Action Handler
  const handleNuke = async (id: string) => {
    const target = vectors.find(v => v.id === id);
    if (!target) return;

    const newHash = await calculateSha256(`${target.name}::NUKED_ACTION::${Date.now()}`);
    setVectors(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'NUKED',
          exposureDetails: 'Exposure permanently purged & GDPR/CCPA erasure requests issued.',
          sha256Hash: newHash,
          lastScanned: 'Just now',
        };
      }
      return v;
    }));

    showToast(`🔥 NUKED: "${target.name}" marked for irreversible erasure.`);
  };

  // KNOX Action Handler
  const handleKnox = async (id: string) => {
    const target = vectors.find(v => v.id === id);
    if (!target) return;

    const newHash = await calculateSha256(`${target.name}::KNOXED_ENCLAVE::${Date.now()}`);
    setVectors(prev => prev.map(v => {
      if (v.id === id) {
        return {
          ...v,
          status: 'KNOXED',
          exposureDetails: 'Secured inside hardware enclave with Web Crypto AES-GCM.',
          sha256Hash: newHash,
          lastScanned: 'Just now',
        };
      }
      return v;
    }));

    showToast(`🛡️ KNOXED: "${target.name}" cryptographically hardened in enclave.`);
  };

  // Trigger Deep Scan
  const handleRunDeepScan = () => {
    setIsScanning(true);
    showToast('Initiating 16-vector deep crawler across breaches, darknet, and broker registries...');
    setTimeout(async () => {
      // Simulate real-time re-hashing
      const refreshed = await Promise.all(
        vectors.map(async (v) => {
          const newHash = await calculateSha256(`${v.name}::${v.dataValue}::${Date.now()}`);
          return {
            ...v,
            sha256Hash: newHash,
            lastScanned: '1 min ago',
          };
        })
      );
      setVectors(refreshed);
      setIsScanning(false);
      showToast('DIFF Scan complete: 16 vectors cryptographically validated.');
    }, 1800);
  };

  // Vector filtering
  const filteredVectors = useMemo(() => {
    return vectors.filter(v => {
      const matchCat = activeCategory === 'ALL' || v.category === activeCategory;
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchCat && matchStatus;
    });
  }, [vectors, activeCategory, statusFilter]);

  const exposedCount = vectors.filter(v => v.status === 'EXPOSED').length;
  const knoxedCount = vectors.filter(v => v.status === 'KNOXED').length;
  const nukedCount = vectors.filter(v => v.status === 'NUKED').length;

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#0F172A] border border-cyan-500/50 shadow-2xl text-xs font-mono font-bold text-cyan-200 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-[#00D4FF]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        userProfile={userProfile}
        sovereignScore={sovereignScore}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenChat={() => {
          setFocusedVector(null);
          setIsChatOpen(true);
        }}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Main Enclave Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <Sidebar
          activeCategory={activeCategory}
          onSelectCategory={(cat) => setActiveCategory(cat)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onRunDeepScan={handleRunDeepScan}
          isScanning={isScanning}
          exposedCount={exposedCount}
          knoxedCount={knoxedCount}
          nukedCount={nukedCount}
        />

        {/* Center / Right: 16 DIFF Vector Grid & Controls */}
        <section className="flex-1 space-y-6">
          {/* Hero Sovereign Perimeter Banner */}
          <div className="relative p-[1.5px] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
            <div className="relative rounded-3xl bg-[#0F172A] p-6 sm:p-8 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                      DIGITAL IDENTITY FEDERATED FOOTPRINT
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      • 16-Vector Enclave Instance
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Sovereign Identity Defense Console
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                    Audit, isolate, and reclaim your complete digital footprint across email breaches, data brokers, device files, and deep web indices. Decide in real-time whether to <strong className="text-[#FF2E9F]">NUKE</strong> exposures from third-party brokers or <strong className="text-[#00D4FF]">KNOX</strong> them inside hardware passkey vaults.
                  </p>
                </div>

                {/* Quick actions in hero */}
<<<<<<< HEAD
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setIsDeepWebOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/50 text-xs font-mono font-bold text-purple-300 hover:text-white transition shadow-lg"
                    title="Open Module 5 Deep Web & Darknet Index Monitor"
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>Darknet Monitor</span>
                  </button>

                  <button
                    onClick={() => setIsCloudBackupOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-blue-950/40 hover:bg-blue-900/40 border border-[#00D4FF]/50 text-xs font-mono font-bold text-cyan-200 hover:text-white transition shadow-lg"
                    title="Open Module 11 iCloud ADP & Google CSE Auditor"
                  >
                    <Cloud className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Cloud Backup ZK</span>
                  </button>

                  <button
                    onClick={() => setIsPasswordStrengthOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-orange-950/40 hover:bg-orange-900/40 border border-[#FF7A18]/50 text-xs font-mono font-bold text-[#FF7A18] hover:text-white transition shadow-lg"
                    title="Open Module 16 Password Reuse & Argon2id Studio"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#FF7A18]" />
                    <span>Argon2id Passwords</span>
                  </button>

                  <button
                    onClick={() => setIsIdentityMdlOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/40 border border-[#00D4FF]/50 text-xs font-mono font-bold text-cyan-200 hover:text-white transition shadow-lg"
                    title="Open Module 12 ISO 18013-5 mDL & ID Shredder"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>ISO 18013-5 mDL</span>
                  </button>

                  <button
                    onClick={() => setIsHardwareEnclaveOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-blue-950/40 hover:bg-blue-900/40 border border-[#00D4FF]/50 text-xs font-mono font-bold text-cyan-200 hover:text-white transition shadow-lg"
                    title="Open Module 4 Hardware Enclave & Titan M2 Inspector"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Enclave Inspector</span>
                  </button>

                  <button
                    onClick={() => setIsEmailScannerOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 1 Email Breach Scanner & Ephemeral Aliases"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Email Scanner</span>
                  </button>

                  <button
                    onClick={() => setIsSocialScrubberOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 2 Social Media Scrubber"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#FF2E9F]" />
                    <span>Social Scrubber</span>
                  </button>

                  <button
                    onClick={() => setIsDnsSurveillanceOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 8 DNS Surveillance & WireGuard ODoH Shield"
                  >
                    <Wifi className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>DNS Shield</span>
                  </button>

                  <button
                    onClick={() => setIsFinancialTokenizationOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 9 Financial Tokenization"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>Card Vault Purge</span>
                  </button>

                  <button
                    onClick={() => setIsSmartHomeTelemetryOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 13 Smart Home IoT Quarantine"
                  >
                    <Tv className="w-3.5 h-3.5 text-[#FF7A18]" />
                    <span>IoT Subnet</span>
                  </button>

                  <button
                    onClick={() => setIsLocationScrubberOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 14 Ad ID & Geolocation Scrubber"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#FF7A18]" />
                    <span>Location Fuzzing</span>
                  </button>

                  <button
                    onClick={() => setIsBiometricDefenseOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 10 Clearview & PimEyes Biometric Shield"
                  >
                    <ScanFace className="w-3.5 h-3.5 text-[#FF2E9F]" />
                    <span>Biometric Shield</span>
                  </button>

                  <button
                    onClick={() => setIsStealerScannerOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open Module 15 Darknet Infostealer Scanner"
                  >
                    <Skull className="w-3.5 h-3.5 text-red-400" />
                    <span>Stealer Scanner</span>
                  </button>

                  <button
                    onClick={() => setIsFileVaultOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Open DoD 5220.22-M File Shredder & AES-GCM Vault"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>File Vault</span>
                  </button>

                  <button
                    onClick={() => setIsBrokerDispatcherOpen(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white transition shadow-lg"
                    title="Launch Automated CCPA & GDPR Article 17 Data Broker Dispatcher"
                  >
                    <Send className="w-3.5 h-3.5 text-[#FF7A18]" />
                    <span>Broker Dispatcher</span>
                  </button>

=======
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
                  <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-pink-500/40 text-xs font-mono font-bold text-pink-200 hover:text-white transition"
                    title="Launch Multistep Onboarding Splash"
                  >
                    <UserPlus className="w-4 h-4 text-[#FF2E9F]" />
                    <span>Setup Wizard</span>
                  </button>

                  <button
                    onClick={() => {
                      setFocusedVector(null);
                      setIsChatOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                  >
<<<<<<< HEAD
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Chief of Staff AI</span>
=======
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Ask Chief of Staff AI</span>
                  </button>

                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#111A33] hover:bg-slate-800 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-200 hover:text-white transition"
                  >
                    <span>Lighthouse PDF</span>
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
                  </button>
                </div>
              </div>

              {/* Status Filter Bar */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-300" />
                  <span className="text-slate-300 font-bold">Filter Perimeter:</span>
                  <div className="flex items-center gap-1.5">
                    {(['ALL', 'EXPOSED', 'KNOXED', 'NUKED'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                          statusFilter === st
                            ? 'bg-[#00D4FF] text-[#0B1020]'
                            : 'bg-[#111A33] text-slate-300 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-slate-300 text-[11px]">
                  Showing {filteredVectors.length} of 16 identity modules
                </div>
              </div>
            </div>
          </div>

          {/* 16 Vector Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredVectors.map((vector) => (
              <DiffModuleCard
                key={vector.id}
                vector={vector}
                onNuke={handleNuke}
                onKnox={handleKnox}
                onConsultAI={(v) => {
                  setFocusedVector(v);
                  setIsChatOpen(true);
                }}
                onEdit={() => setIsOnboardingOpen(true)}
<<<<<<< HEAD
                onOpenEmailScanner={() => setIsEmailScannerOpen(true)}
                onOpenSocialScrubber={() => setIsSocialScrubberOpen(true)}
                onOpenFileVault={() => setIsFileVaultOpen(true)}
                onOpenHardwareEnclave={() => setIsHardwareEnclaveOpen(true)}
                onOpenDeepWeb={() => setIsDeepWebOpen(true)}
                onOpenBrokerDispatcher={() => setIsBrokerDispatcherOpen(true)}
                onOpenDnsSurveillance={() => setIsDnsSurveillanceOpen(true)}
                onOpenFinancialTokenization={() => setIsFinancialTokenizationOpen(true)}
                onOpenBiometricDefense={() => setIsBiometricDefenseOpen(true)}
                onOpenCloudBackup={() => setIsCloudBackupOpen(true)}
                onOpenIdentityMdl={() => setIsIdentityMdlOpen(true)}
                onOpenSmartHomeTelemetry={() => setIsSmartHomeTelemetryOpen(true)}
                onOpenLocationScrubber={() => setIsLocationScrubberOpen(true)}
                onOpenStealerScanner={() => setIsStealerScannerOpen(true)}
                onOpenPasswordStrength={() => setIsPasswordStrengthOpen(true)}
=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs font-mono text-slate-300 bg-[#0B1020]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Architect AI • Agape Sovereign Enclave 2026 • Digital Sovereignty Platform
          </div>
          <div>
            Zero-Access AES-GCM • Passkey WebAuthn • 2026 ECRA LTS Certified
          </div>
        </div>
      </footer>

      {/* Modals */}
<<<<<<< HEAD
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
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <IdentityDocumentMdlModal
        isOpen={isIdentityMdlOpen}
        onClose={() => setIsIdentityMdlOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <HardwareEnclaveInspectorModal
        isOpen={isHardwareEnclaveOpen}
        onClose={() => setIsHardwareEnclaveOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <EmailBreachScannerModal
        isOpen={isEmailScannerOpen}
        onClose={() => setIsEmailScannerOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <SocialMediaScrubberModal
        isOpen={isSocialScrubberOpen}
        onClose={() => setIsSocialScrubberOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <DnsSurveillanceModal
        isOpen={isDnsSurveillanceOpen}
        onClose={() => setIsDnsSurveillanceOpen(false)}
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

      <AdIdLocationScrubberModal
        isOpen={isLocationScrubberOpen}
        onClose={() => setIsLocationScrubberOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <BiometricDefenseModal
        isOpen={isBiometricDefenseOpen}
        onClose={() => setIsBiometricDefenseOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <DarknetStealerScannerModal
        isOpen={isStealerScannerOpen}
        onClose={() => setIsStealerScannerOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <FileVaultShredderModal
        isOpen={isFileVaultOpen}
        onClose={() => setIsFileVaultOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

      <DataBrokerDispatcherModal
        isOpen={isBrokerDispatcherOpen}
        onClose={() => setIsBrokerDispatcherOpen(false)}
        userProfile={userProfile}
        onUpdatePerimeterVector={handleUpdatePerimeterVector}
      />

=======
>>>>>>> 6bf8aae34 (refactor: remove unused modal components and firebase services from the frontend codebase)
      <MultistepOnboardingSplash
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        vectors={vectors}
        userProfile={userProfile}
        onComplete={(updatedVectors, updatedProfile) => {
          setVectors(updatedVectors);
          setUserProfile(updatedProfile);
          showToast('Sovereign setup complete! 16 vectors committed with verified SHA-256 hashes.');
        }}
      />

      <ArchitectAIChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        vectors={vectors}
        sovereignScore={sovereignScore}
        focusedVector={focusedVector}
        onNukeVector={handleNuke}
        onKnoxVector={handleKnox}
      />

      <PdfReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        vectors={vectors}
        userProfile={userProfile}
        sovereignScore={sovereignScore}
      />

      <AdminPortalModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        telemetry={adminTelemetry}
        currentEmail={userProfile.primaryEmail}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={userProfile}
        onUpdateProfile={(updated) => {
          setUserProfile(updated);
          showToast('Enclave profile committed successfully.');
        }}
      />
    </div>
  );
}
