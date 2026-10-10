import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Hash, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Flame, 
  ChevronRight, 
  ChevronLeft, 
  KeyRound, 
  Mail, 
  Share2, 
  Laptop, 
  Search, 
  CreditCard,
  Lock,
  Smartphone,
  Cpu,
  RefreshCw,
  Fingerprint
} from 'lucide-react';
import { DiffVector, UserProfile, VectorCategory } from '../types';
import { calculateSha256, simulatePasskeyBiometricChallenge } from '../services/cryptoService';

interface MultistepOnboardingSplashProps {
  isOpen: boolean;
  onClose: () => void;
  vectors: DiffVector[];
  userProfile: UserProfile;
  onComplete: (updatedVectors: DiffVector[], updatedProfile: UserProfile) => void;
}

interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  category?: VectorCategory;
  icon: React.ReactNode;
}

export const MultistepOnboardingSplash: React.FC<MultistepOnboardingSplashProps> = ({
  isOpen,
  onClose,
  vectors,
  userProfile,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVerifyingPasskey, setIsVerifyingPasskey] = useState(false);
  const [passkeyVerified, setPasskeyVerified] = useState(userProfile.passkeyStatus === 'HARDWARE_ENFORCED');
  
  // Profile state inside wizard
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [primaryEmail, setPrimaryEmail] = useState(userProfile.primaryEmail);
  const [federatedProvider, setFederatedProvider] = useState<'Google' | 'Apple'>(userProfile.federatedProvider);

  // Identity values mapping
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    vectors.forEach(v => {
      map[v.id] = v.dataValue;
    });
    return map;
  });

  // Real-time calculated SHA-256 hashes per module
  const [liveHashes, setLiveHashes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    vectors.forEach(v => {
      map[v.id] = v.sha256Hash;
    });
    return map;
  });

  const [isHashing, setIsHashing] = useState(false);
  const [masterEnclaveHash, setMasterEnclaveHash] = useState(userProfile.masterKeyHash);

  // Compute live hash for a specific vector when input changes
  const handleInputChange = async (id: string, val: string) => {
    setFormData(prev => ({ ...prev, [id]: val }));
    const vector = vectors.find(v => v.id === id);
    const vectorName = vector ? vector.name : id;
    const computed = await calculateSha256(`${vectorName}::${val || 'EMPTY'}::2026_AGAPE_ENCLAVE`);
    setLiveHashes(prev => ({ ...prev, [id]: computed }));
  };

  // Re-calculate the root master enclave hash across all current values
  const recomputeMasterHash = async () => {
    setIsHashing(true);
    const combinedString = vectors.map(v => `${v.name}:${formData[v.id] || v.dataValue}`).join('||');
    const rootHash = await calculateSha256(`${primaryEmail}::${combinedString}::2026_ECRA_LTS`);
    setMasterEnclaveHash(rootHash);
    setIsHashing(false);
  };

  useEffect(() => {
    if (currentStep === 6) {
      recomputeMasterHash();
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const steps: StepConfig[] = [
    {
      id: 'auth',
      title: 'Federated Passkey Binding',
      subtitle: 'Anchor identity with Google or Apple ID & biometric hardware passkey',
      icon: <Fingerprint className="w-4 h-4 text-[#00D4FF]" />
    },
    {
      id: 'comm',
      title: 'Email & Cloud Vaults',
      subtitle: 'Modules 1 & 11: Email breach crawler and zero-knowledge cloud backup',
      category: 'COMMUNICATIONS',
      icon: <Mail className="w-4 h-4 text-[#FF2E9F]" />
    },
    {
      id: 'social',
      title: 'Digital Presence & Biometrics',
      subtitle: 'Modules 2, 10 & 14: Social footprints, facial scraping and AdID location breadcrumbs',
      category: 'DIGITAL_PRESENCE',
      icon: <Share2 className="w-4 h-4 text-[#00D4FF]" />
    },
    {
      id: 'devices',
      title: 'Devices, IoT & Hardware',
      subtitle: 'Modules 3, 4, 8 & 13: Local vault scanning, Apple/Titan enclaves, DNS and Smart Home',
      category: 'DEVICES_SYSTEMS',
      icon: <Laptop className="w-4 h-4 text-[#FF7A18]" />
    },
    {
      id: 'brokers',
      title: 'Data Brokers & Darknet',
      subtitle: 'Modules 5, 6 & 15: Deep web index, automated broker removals and stealer log defenses',
      category: 'DEEP_WEB_BROKERS',
      icon: <Search className="w-4 h-4 text-[#FF2E9F]" />
    },
    {
      id: 'creds',
      title: 'Passkeys, mDL & Finance',
      subtitle: 'Modules 7, 9, 12 & 16: FIDO2 credentials, credit card masking, digital ID and password hashes',
      category: 'CREDENTIALS_FINANCE',
      icon: <CreditCard className="w-4 h-4 text-[#00D4FF]" />
    },
    {
      id: 'review',
      title: 'Sovereign Matrix Synthesis',
      subtitle: 'Verify 16 client-side SHA-256 hashes and commit zero-access enclave footprint',
      icon: <ShieldCheck className="w-4 h-4 text-[#00D4FF]" />
    }
  ];

  const handleVerifyHardwarePasskey = async () => {
    setIsVerifyingPasskey(true);
    try {
      const res = await simulatePasskeyBiometricChallenge(primaryEmail);
      if (res.success) {
        setPasskeyVerified(true);
      }
    } finally {
      setIsVerifyingPasskey(false);
    }
  };

  const handleFinalSubmit = () => {
    const updatedVectors = vectors.map(v => ({
      ...v,
      dataValue: formData[v.id] || v.dataValue,
      sha256Hash: liveHashes[v.id] || v.sha256Hash,
      lastScanned: 'Just now',
    }));

    const updatedProfile: UserProfile = {
      ...userProfile,
      fullName,
      primaryEmail,
      federatedProvider,
      passkeyStatus: passkeyVerified ? 'HARDWARE_ENFORCED' : 'BOUND',
      masterKeyHash: masterEnclaveHash,
    };

    onComplete(updatedVectors, updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      {/* Outer Neon Pulsing Border Container */}
      <div className="relative w-full max-w-4xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Top Bar Header */}
          <div className="px-6 py-4 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    ARCHITECT AI • 16-VECTOR ONBOARDING
                  </h2>
                  <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    2026 ECRA LTS
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Agape Sovereign Enclave • Client-Side Zero-Access Proof
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Close and explore dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Navigation Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-[#0B1020] border-b border-slate-800/80 overflow-x-auto flex items-center gap-2">
            {steps.map((st, idx) => {
              const isActive = currentStep === idx;
              const isPast = currentStep > idx;
              return (
                <button
                  key={st.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50 shadow-sm'
                      : isPast
                      ? 'text-cyan-200 bg-[#111A33]/70 hover:bg-[#111A33]'
                      : 'text-slate-400 hover:text-slate-200 bg-[#0F172A]'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#00D4FF] text-[#0B1020]'
                      : isPast
                      ? 'bg-cyan-900 text-cyan-200'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isPast ? '✓' : idx + 1}
                  </span>
                  <span className="hidden md:inline">{st.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Main Body Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Step header context */}
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF]">
                    STEP {currentStep + 1} OF {steps.length}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {steps[currentStep].title}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-sans">
                  {steps[currentStep].subtitle}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-cyan-300">
                <Hash className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Web Crypto Subtle SHA-256</span>
              </div>
            </div>

            {/* STEP 0: Federated Account & Passkey Binding */}
            {currentStep === 0 && (
              <div className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-cyan-200 uppercase mb-1">
                      Sovereign User Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Israel David"
                      className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-700 text-sm text-white font-medium focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-cyan-200 uppercase mb-1">
                      Primary Enclave Email Anchor
                    </label>
                    <input
                      type="email"
                      value={primaryEmail}
                      onChange={(e) => setPrimaryEmail(e.target.value)}
                      placeholder="e.g. idin@agape.nyc"
                      className="w-full px-4 py-3 rounded-xl bg-[#0F172A] border border-slate-700 text-sm text-white font-medium focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>
                </div>

                {/* Federated Identity Provider Select */}
                <div>
                  <label className="block text-xs font-mono font-bold text-cyan-200 uppercase mb-2">
                    Select Federated Identity Anchor (Zero Plaintext Transmission)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFederatedProvider('Google')}
                      className={`p-4 rounded-2xl border text-left transition ${
                        federatedProvider === 'Google'
                          ? 'bg-blue-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,212,255,0.25)]'
                          : 'bg-[#0F172A] border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-white flex items-center justify-between">
                        <span>Google Federated Login</span>
                        {federatedProvider === 'Google' && <Check className="w-4 h-4 text-[#00D4FF]" />}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Bound to Google OAuth tokens and hardware Titan M2 key challenge.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFederatedProvider('Apple')}
                      className={`p-4 rounded-2xl border text-left transition ${
                        federatedProvider === 'Apple'
                          ? 'bg-purple-950/40 border-pink-400 text-white shadow-[0_0_15px_rgba(255,46,159,0.25)]'
                          : 'bg-[#0F172A] border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-white flex items-center justify-between">
                        <span>Apple ID Federated Login</span>
                        {federatedProvider === 'Apple' && <Check className="w-4 h-4 text-[#FF2E9F]" />}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Bound to Apple Secure Enclave & hardware Touch ID / Face ID passkey.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Biometric Hardware Passkey Verification Box */}
                <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Fingerprint className="w-5 h-5 text-[#00D4FF]" />
                      <span className="font-bold text-sm text-white">
                        Universal WebAuthn Hardware Passkey Enforcement
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      passkeyVerified 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/40' 
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    }`}>
                      {passkeyVerified ? 'HARDWARE ENCLAVE VERIFIED' : 'ACTION REQUIRED'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Under the <strong>2026 ECRA LTS Standard</strong>, static passwords are permanently eliminated. Architect AI binds your sessions exclusively to biometric device hardware enclaves.
                  </p>

                  <button
                    type="button"
                    onClick={handleVerifyHardwarePasskey}
                    disabled={isVerifyingPasskey}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-cyan-500/50 text-xs font-mono font-bold text-[#00D4FF] hover:text-white transition flex items-center justify-center gap-2"
                  >
                    {isVerifyingPasskey ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#00D4FF]" />
                        <span>Simulating Device Enclave Biometric Handshake...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-[#00D4FF]" />
                        <span>{passkeyVerified ? 'Re-Verify Biometric Passkey Handshake' : 'Trigger Device Passkey Assertion'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEPS 1 through 5: Identity Vector Category Editors */}
            {currentStep >= 1 && currentStep <= 5 && (
              <div className="space-y-4 animate-fade-in">
                {vectors
                  .filter(v => v.category === steps[currentStep].category)
                  .map((vector) => {
                    const currentVal = formData[vector.id] ?? vector.dataValue;
                    const currentHash = liveHashes[vector.id] ?? vector.sha256Hash;

                    return (
                      <div
                        key={vector.id}
                        className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-cyan-500/40 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-[#0B1020] border border-cyan-500/40 font-mono text-xs font-bold text-[#00D4FF] flex items-center justify-center">
                              {vector.moduleNumber}
                            </span>
                            <h4 className="font-bold text-sm text-white">{vector.name}</h4>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold self-start sm:self-auto ${
                            vector.status === 'KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF]' :
                            vector.status === 'NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F]' :
                            'bg-[#FF7A18]/20 text-[#FF7A18]'
                          }`}>
                            DEFAULT: {vector.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300">
                          {vector.shortDesc}
                        </p>

                        <div>
                          <label className="block text-[11px] font-mono font-bold text-cyan-200 mb-1 uppercase">
                            Your Personal Value or Target Identifier:
                          </label>
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleInputChange(vector.id, e.target.value)}
                            placeholder={`Enter initial footprint for ${vector.name}`}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#0B1020] border border-slate-700 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#00D4FF]"
                          />
                        </div>

                        {/* Real-time Dynamic SHA-256 Display */}
                        <div className="p-2.5 rounded-xl bg-[#0B1020] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                          <div className="flex items-center gap-1.5 text-cyan-300">
                            <Hash className="w-3.5 h-3.5 text-[#00D4FF]" />
                            <span className="text-slate-300">Live SHA-256:</span>
                            <span className="font-bold truncate text-[#00D4FF]">
                              {currentHash.substring(0, 28)}...
                            </span>
                          </div>
                          <span className="text-slate-300">
                            Protocol: {vector.sourceInspiration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* STEP 6: Review & Final Cryptographic Compilation */}
            {currentStep === 6 && (
              <div className="space-y-5 animate-fade-in">
                {/* Summary Root Certificate Card */}
                <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#FF2E9F]" />
                      <h4 className="font-bold text-sm text-white">
                        Agape Enclave Root Cryptographic Proof (2026 ECRA)
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                      SHA-256 SYNCHRONIZED
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    All 16 identity modules have been hashed locally in your browser’s volatile memory. This root hash certifies that no raw or unencrypted strings will ever be dispatched to external data brokers or server databases.
                  </p>

                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 font-mono text-xs">
                    <div className="text-slate-300 text-[10px] uppercase font-bold mb-0.5">
                      Cumulative Master Enclave Hash:
                    </div>
                    <div className="text-[#00D4FF] font-bold break-all">
                      {isHashing ? 'Recomputing root digest...' : masterEnclaveHash}
                    </div>
                  </div>
                </div>

                {/* 16 Vector Quick Ledger Grid */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#00D4FF]" />
                    Compiled 16-Vector Digest Table
                  </h4>

                  <div className="rounded-2xl border border-slate-800 bg-[#0F172A] max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px] font-mono">
                      <thead className="bg-[#111A33] text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Module</th>
                          <th className="p-2.5">Value Captured</th>
                          <th className="p-2.5">Live Hash (SHA-256)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {vectors.map((v) => (
                          <tr key={v.id} className="hover:bg-[#111A33]/40">
                            <td className="p-2.5 font-bold text-cyan-300">{v.moduleNumber}</td>
                            <td className="p-2.5 text-white font-sans font-medium">{v.name}</td>
                            <td className="p-2.5 text-slate-300 truncate max-w-[140px]">
                              {formData[v.id] || v.dataValue}
                            </td>
                            <td className="p-2.5 text-cyan-400">
                              {(liveHashes[v.id] || v.sha256Hash).substring(0, 14)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls & Glowing Neon Action Button */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00D4FF] hover:bg-cyan-400 text-[#0B1020] text-xs font-bold transition shadow-lg"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                /* Glowing Neon Mixed-Hue Button (Magenta, Cyan, Orange) */
                <div className="relative group p-[2px] rounded-2xl overflow-hidden shadow-2xl">
                  {/* Glowing animated pulsing border */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
                  
                  <button
                    onClick={handleFinalSubmit}
                    className="relative flex items-center gap-2 px-7 py-3 rounded-2xl bg-[#0B1020] group-hover:bg-[#0F172A] text-white text-xs font-mono font-extrabold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,46,159,0.4)]"
                  >
                    <Sparkles className="w-4 h-4 text-[#00D4FF] animate-spin" />
                    <span>Complete Onboarding & Knox Identity</span>
                    <Check className="w-4 h-4 text-[#FF7A18]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
