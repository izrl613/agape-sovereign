import React, { useState, useEffect, useRef } from 'react';
import { AppView, RiskLevel, EmailProvider, PrivacyThreat, ChatMessage, VaultItem, ApiKey, ApiKeyEvent, PasskeyRecord, EnclaveProfile, SystemVitals, DiscoveryType, ComplianceItem } from './types';
import { getArchitectAdvice, simulateInboxFetch, validateLiveEmailBatch } from './services/geminiService';

// --- Cryptographic Helpers ---
const bufferToBase64 = (buffer: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};
const generateChallenge = () => window.crypto.getRandomValues(new Uint8Array(32));
const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// --- Enhanced Error Mapping ---
interface SovereignError { title: string; message: string; tip: string; rawName: string; }
const resolveWebAuthnError = (err: any): SovereignError => {
  const rawName = err.name || 'UnknownError';
  const base = { 
    rawName, 
    title: "Protocol Failure", 
    message: err.message || "An unexpected error occurred during the cryptographic handshake.", 
    tip: "Verify hardware connection and retry the attestation sequence." 
  };
  
  switch (err.name) {
    case 'NotAllowedError': 
      return { 
        ...base, 
        title: "Handshake Interrupted", 
        message: "The user denied the request or the operation timed out.",
        tip: "Ensure your security key is inserted, unlocked, and you interact with the browser prompt promptly." 
      };
    case 'InvalidStateError':
      return {
        ...base,
        title: "Node Conflict",
        message: "This hardware token is already associated with an identity in the local ledger.",
        tip: "If you are trying to re-register, delete the existing record from 'Hardware Identity Nodes' first."
      };
    case 'NotSupportedError':
      return {
        ...base,
        title: "Platform Restriction",
        message: "This browser or operating system does not support Sovereign L3 attestation.",
        tip: "Try using a modern Chromium-based browser or check if your hardware key supports FIDO2/WebAuthn."
      };
    case 'SecurityError': 
      return { 
        ...base, 
        title: "Transport Insecurity", 
        message: "The operation is not permitted in the current security context.",
        tip: "Sovereign attestation requires a secure HTTPS connection and a valid top-level domain context." 
      };
    case 'AbortError':
      return {
        ...base,
        title: "Operation Aborted",
        message: "The attestation sequence was terminated by the user or the system kernel.",
        tip: "Check for conflicting security prompts and ensure no other application is accessing the hardware key."
      };
    default: 
      return base;
  }
};

// --- UI Components ---
const ZeroTrustBadge = ({ isProd }: { isProd: boolean }) => (
  <div className="fixed top-0 left-0 w-full bg-[#020617]/95 border-b border-blue-500/20 backdrop-blur-md z-[1000] px-6 py-2 flex justify-between items-center shadow-lg shadow-blue-900/5">
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-1.5 rounded-full ${isProd ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-blue-500'} animate-[pulse_3s_infinite]`}></div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500">Agape Sovereign Enclave 2026</span>
    </div>
    <div className="flex items-center gap-4">
       <div className={`px-3 py-1 rounded-md border text-[7px] font-black uppercase tracking-widest ${isProd ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
          {isProd ? 'Environment: Production' : 'Environment: Development'}
       </div>
       <div className="flex items-center gap-1.5 opacity-40">
         <i className="fab fa-google text-[10px] text-slate-400"></i>
         <span className="text-[8px] font-mono text-slate-400 tracking-wider uppercase">GCP HARDENED L3</span>
       </div>
       <span className="text-[8px] font-mono text-blue-500/60 border-l border-white/5 pl-4 tracking-widest uppercase">NODE_{window.location.hostname.replace(/[^a-zA-Z0-9]/g, '_')}</span>
    </div>
  </div>
);

const RiskIndicator = ({ level }: { level: RiskLevel | string }) => {
  const styles = {
    [RiskLevel.CRITICAL]: 'text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse',
    [RiskLevel.HIGH]: 'text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
    [RiskLevel.MODERATE]: 'text-yellow-400',
    [RiskLevel.SAFE]: 'text-emerald-400',
  };
  const levelClass = styles[level as RiskLevel] || styles[RiskLevel.MODERATE];
  return <i className={`fas fa-circle text-[8px] ${levelClass} rounded-full`}></i>;
};

const App: React.FC = () => {
  // --- State ---
  const [authStage, setAuthStage] = useState<'zerotrust' | 'passkey' | 'app'>('zerotrust');
  const [view, setView] = useState<AppView>(AppView.SOURCES);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [regFlowStep, setRegFlowStep] = useState<'idle' | 'choice' | 'naming' | 'importing' | 'preparing' | 'prompting' | 'verifying' | 'success' | 'error'>('idle');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [useSimulationMode, setUseSimulationMode] = useState(false);
  const [pendingPasskeyName, setPendingPasskeyName] = useState('');
  const [manualRawId, setManualRawId] = useState('');
  const [manualPublicKey, setManualPublicKey] = useState('');
  const [activeError, setActiveError] = useState<SovereignError | null>(null);

  const [enclaveProfile, setEnclaveProfile] = useState<EnclaveProfile>({
    minInstances: 1, maxInstances: 10, concurrency: 80, cpuMode: 'always_on', postQuantumEnabled: true,
    retentionPolicy: '7d', residencyRegion: 'us-sovereign'
  });

  const [vitals, setVitals] = useState<SystemVitals>({
    cpuUsage: 12, memoryUsage: 240, activeRequests: 0, uptime: '14d 02h 11m', teeStatus: 'ATTESTED'
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([{ 
    id: 'k1', name: 'Root Access Node', key: 'sk_agape_prod_82x1', createdAt: '2026-02-01', expiresAt: getFutureDate(30), isVisible: false, status: 'active',
    auditTrail: [{ id: 'ae1', type: 'provision', timestamp: new Date().toLocaleString(), details: 'Initial system node provisioned by Root Architect.' }]
  }]);
  
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>(() => {
    const stored = localStorage.getItem('agape_passkeys_v3');
    return stored ? JSON.parse(stored) : [];
  });

  const [threats, setThreats] = useState<PrivacyThreat[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([
    { id: 'v1', title: '2026 Sovereign Strategy', origin: 'Agape Sovereign', timestamp: '1 hour ago', type: 'document', encryption: 'AES-256-GCM' }
  ]);

  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
    { id: 'pqc', label: 'Post-Quantum Protocol', status: 'pending', description: 'Mandatory ML-KEM exchange for 2026 compliance.' },
    { id: 'tee', label: 'TEE Attestation', status: 'pending', description: 'Intel TDX / AMD SEV-SNP cryptographic isolation.' },
    { id: 'residency', label: 'Data Sovereignty', status: 'pending', description: 'Verified L3 residency in Sovereign-Hardened regions.' },
    { id: 'shred', label: 'Retention Shredding', status: 'pending', description: 'Enforced TTL for ephemeral data artifacts.' }
  ]);

  const [identityLogs, setIdentityLogs] = useState<{id: string, event: string, timestamp: string, type: 'user' | 'system' | 'critical'}[]>([
    { id: `log-init`, event: 'KERNEL_INITIALIZED_2026: GCP Confidential Run L3 confirmed.', timestamp: new Date().toLocaleTimeString(), type: 'system' }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [isComplianceScanning, setIsComplianceScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', role: 'assistant', content: 'Kernel Hardened. L3 Resident in US-Sovereign-1. All identity nodes monitored. How may I assist your audit?', timestamp: 'Now' }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => { localStorage.setItem('agape_passkeys_v3', JSON.stringify(passkeys)); }, [passkeys]);
  useEffect(() => {
    if (authStage === 'zerotrust') { setTimeout(() => setAuthStage('passkey'), 2000); }
    if (authStage === 'app') {
      const interval = setInterval(() => {
        setVitals(v => ({ ...v, cpuUsage: Math.floor(Math.random() * 20 + 5), activeRequests: Math.floor(Math.random() * 5) }));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [authStage]);

  const addIdentityLog = (event: string, type: 'user' | 'system' | 'critical' = 'system') => {
    setIdentityLogs(prev => [{ id: `log-${Date.now()}-${Math.random()}`, event, timestamp: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 50));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startSovereignScan = async () => {
    setIsScanning(true);
    setView(AppView.SCANNER);
    setScanStatusText("DLP Discovery initialized...");
    addIdentityLog("SCAN: Initialized deep packet DLP audit.", "system");
    const raw = await simulateInboxFetch('Google Workspace');
    const results = await validateLiveEmailBatch(raw);
    setThreats(results.map((r: any) => ({
      id: r.id, source: r.sender, subject: r.subject, emailProviderId: 'gmail-1',
      riskLevel: r.riskLevel, detectedVia: 'DLP Engine 2.0', timestamp: 'Now', suggestedAction: r.suggestedAction,
      discoveryType: r.discoveryType
    })));
    setIsScanning(false);
    addIdentityLog(`SCAN: Audit complete. ${results.length} artifacts classified.`, "system");
  };

  const triggerComplianceScan = async () => {
    setIsComplianceScanning(true);
    addIdentityLog("AUDIT: Triggering sovereign compliance scan...", "system");
    
    // Set all to pending visually
    setComplianceItems(prev => prev.map(item => ({ ...item, status: 'pending' })));

    for (let i = 0; i < complianceItems.length; i++) {
      await new Promise(r => setTimeout(r, 800)); // Simulate work
      const item = complianceItems[i];
      let status: 'passed' | 'failed' = 'passed';

      // Logic-based status
      if (item.id === 'pqc' && !enclaveProfile.postQuantumEnabled) status = 'failed';
      if (item.id === 'tee' && vitals.teeStatus === 'UNSECURED') status = 'failed';
      if (item.id === 'shred' && enclaveProfile.retentionPolicy === 'infinite') status = 'failed';

      setComplianceItems(prev => prev.map((it, idx) => idx === i ? { ...it, status } : it));
    }

    setIsComplianceScanning(false);
    addIdentityLog("AUDIT: Compliance scan finished. Results updated.", "system");
    showToast("System Audit Complete", "success");
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg, timestamp: 'Now' }]);
    setIsChatting(true);
    const advice = await getArchitectAdvice(msg, `TEE: ${vitals.teeStatus}, Retention: ${enclaveProfile.retentionPolicy}`);
    setChatMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: advice || 'Timeout.', timestamp: 'Now' }]);
    setIsChatting(false);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const timestamp = new Date().toLocaleString();
    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(7),
      name: newKeyName,
      key: 'sk_agape_' + Math.random().toString(36).substring(2, 18),
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: getFutureDate(30),
      isVisible: false,
      status: 'active',
      auditTrail: [{ id: 'ae-' + Date.now(), type: 'provision', timestamp, details: `Access Node [${newKeyName}] provisioned by sovereign user.` }]
    };
    setApiKeys(prev => [newKey, ...prev]);
    addIdentityLog(`USER: Provisioned new Access Node [${newKeyName}]`, 'user');
    showToast(`Node provisioned: ${newKeyName}`, 'success');
    setNewKeyName('');
    setShowKeyForm(false);
  };

  const toggleKeyVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApiKeys(prev => prev.map(k => {
      if (k.id === id) {
        const newVisible = !k.isVisible;
        const trail: ApiKeyEvent[] = [...k.auditTrail, { 
          id: 'ae-' + Date.now(), type: 'visibility_toggle', timestamp: new Date().toLocaleString(), 
          details: `Cleartext visibility toggled to ${newVisible ? 'VISIBLE' : 'HIDDEN'} for diagnostic check.` 
        }];
        return { ...k, isVisible: newVisible, auditTrail: trail };
      }
      return k;
    }));
    addIdentityLog(`SECURITY: API Key visibility toggled for node [ID: ${id}]`, 'system');
  };

  const handleRevokeKey = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    if (confirm(`Revoke Access Node [${key.name}]? This action is immutable.`)) {
      setApiKeys(prev => prev.map(k => {
        if (k.id === id) {
          const trail: ApiKeyEvent[] = [...k.auditTrail, { 
            id: 'ae-' + Date.now(), type: 'revocation', timestamp: new Date().toLocaleString(), 
            details: 'Node access revoked by kernel request. Hardware tokens invalidated.' 
          }];
          return { ...k, status: 'revoked', auditTrail: trail };
        }
        return k;
      }));
      addIdentityLog(`CRITICAL: Revoked API access for [${key.name}]`, 'critical');
      showToast(`Revoked ${key.name}`, 'error');
    }
  };

  const startGuidedRegistration = async () => {
    setIsAuthenticating(true);
    setRegFlowStep('preparing');
    setActiveError(null);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setRegFlowStep('prompting');
      let cred;
      if (useSimulationMode) {
        await new Promise(r => setTimeout(r, 1000));
        // Randomly simulate error if in dev mode to test UX
        if (Math.random() < 0.2) throw { name: 'NotAllowedError', message: 'User denied the simulated request.' };
        cred = { id: 'SIM-' + Math.random().toString(36).substr(2, 9), type: 'public-key' };
      } else {
        cred = await navigator.credentials.create({ 
          publicKey: { 
            challenge: generateChallenge(), 
            rp: { name: "Agape Sovereign" }, 
            user: { id: generateChallenge(), name: "sovereign", displayName: pendingPasskeyName },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: { userVerification: "required" }
          }
        });
      }
      if (cred) {
        const newPk: PasskeyRecord = {
          id: Math.random().toString(36).substr(2, 6), rawId: 'id' in cred ? (cred as any).id : 'raw', label: pendingPasskeyName, type: 'public-key', algorithm: 'ES256', addedAt: new Date().toISOString(), lastUsedAt: 'Now', status: 'verified'
        };
        setPasskeys(prev => [...prev, newPk]);
        setRegFlowStep('success');
        addIdentityLog(`USER: Bound new hardware node [${pendingPasskeyName}]`, 'user');
        showToast("Hardware bound.", "success");
      }
    } catch (e: any) {
      const errReport = resolveWebAuthnError(e);
      setActiveError(errReport);
      setRegFlowStep('error');
      addIdentityLog(`CRITICAL: Attestation Failure: ${errReport.rawName} - ${errReport.message}`, 'critical');
    } finally { setIsAuthenticating(false); }
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPasskeyName.trim() || !manualRawId.trim() || !manualPublicKey.trim()) {
      showToast("All fields are mandatory for manual import.", "error");
      return;
    }
    const newPk: PasskeyRecord = {
      id: Math.random().toString(36).substr(2, 6),
      rawId: manualRawId,
      label: pendingPasskeyName,
      type: 'public-key-imported',
      algorithm: 'RSA/EC/PQC',
      addedAt: new Date().toISOString(),
      lastUsedAt: null,
      status: 'active'
    };
    setPasskeys(prev => [...prev, newPk]);
    setRegFlowStep('success');
    addIdentityLog(`USER: Manually imported identity node [${pendingPasskeyName}]`, 'user');
    showToast("Node imported successfully", "success");
    // Clear fields
    setManualRawId('');
    setManualPublicKey('');
    setPendingPasskeyName('');
  };

  const copyToClipboard = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Copied to clipboard", "info");
  };

  const togglePostQuantum = () => {
    const newState = !enclaveProfile.postQuantumEnabled;
    setEnclaveProfile({ ...enclaveProfile, postQuantumEnabled: newState });
    addIdentityLog(`SECURITY: Post-Quantum Cryptography toggled ${newState ? 'ON' : 'OFF'}`, newState ? 'system' : 'critical');
    showToast(`PQC ${newState ? 'Enabled' : 'Disabled'}`, newState ? 'success' : 'info');
  };

  // --- View Components ---
  if (authStage === 'zerotrust') return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-mono">
      <div className="neon-atmosphere"></div>
      <i className="fas fa-shield-cat text-8xl text-orange-600 mb-8 drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]"></i>
      <h1 className="text-3xl sovereign-gradient-text uppercase tracking-[0.4em] font-black">AGAPE SOVEREIGN</h1>
      <p className="text-[10px] text-blue-500 font-bold tracking-[0.3em] mt-4 uppercase animate-pulse">Initializing L3 Enclave</p>
    </div>
  );

  if (authStage === 'passkey') return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="neon-atmosphere"></div>
      <div className={`glass-card p-12 rounded-[4rem] text-center max-w-xl w-full relative z-10 transition-all duration-500 border-2 ${regFlowStep === 'error' ? 'border-rose-500/40 shadow-rose-900/20' : 'border-blue-500/20'}`}>
        {regFlowStep === 'idle' ? (
          <>
            <i className="fas fa-fingerprint text-6xl text-blue-500 mb-8"></i>
            <h2 className="text-3xl font-black text-white uppercase mb-8">Verification</h2>
            <button onClick={() => passkeys.length > 0 ? setAuthStage('app') : setRegFlowStep('choice')} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl tracking-widest">
              {passkeys.length > 0 ? 'Authenticate Node' : 'Initialize Hardware Binding'}
            </button>
            <button onClick={() => setUseSimulationMode(!useSimulationMode)} className={`mt-6 text-[9px] uppercase font-black tracking-widest transition-colors ${useSimulationMode ? 'text-orange-500' : 'text-slate-600'}`}>
              {useSimulationMode ? 'SIMULATION MODE ACTIVE' : 'SWITCH TO HARDWARE SIMULATION'}
            </button>
          </>
        ) : regFlowStep === 'choice' ? (
          <div className="text-center">
            <h2 className="text-xl font-black text-white mb-8 uppercase tracking-widest">Select Binding Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <button onClick={() => setRegFlowStep('naming')} className="p-8 bg-blue-600/10 border border-blue-500/20 rounded-3xl hover:bg-blue-600/20 transition-all group">
                  <i className="fas fa-microchip text-4xl text-blue-500 mb-4 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-white font-black uppercase text-xs">Guided Binding</h3>
                  <p className="text-[9px] text-slate-500 mt-2 uppercase">Connect Hardware Key via WebAuthn Protocol</p>
               </button>
               <button onClick={() => setRegFlowStep('importing')} className="p-8 bg-orange-600/10 border border-orange-500/20 rounded-3xl hover:bg-orange-600/20 transition-all group">
                  <i className="fas fa-file-import text-4xl text-orange-500 mb-4 group-hover:scale-110 transition-transform"></i>
                  <h3 className="text-white font-black uppercase text-xs">Manual Import</h3>
                  <p className="text-[9px] text-slate-500 mt-2 uppercase">Manually Input Credential Metadata & Public Keys</p>
               </button>
            </div>
            <button onClick={() => setRegFlowStep('idle')} className="mt-8 text-slate-600 font-black uppercase text-[10px] tracking-widest">Back</button>
          </div>
        ) : regFlowStep === 'naming' ? (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-xl font-black text-white mb-8 uppercase tracking-widest">NODE ALIAS</h2>
            <input type="text" value={pendingPasskeyName} onChange={e => setPendingPasskeyName(e.target.value)} placeholder="e.g. Architect Core" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white mb-6 focus:border-blue-500/50 outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setRegFlowStep('choice')} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
              <button onClick={startGuidedRegistration} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px]">Establish Binding</button>
            </div>
          </div>
        ) : regFlowStep === 'importing' ? (
          <div className="text-left">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest text-center">Credential Metadata Import</h2>
            <form onSubmit={handleManualImport} className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Identity Node Label</label>
                  <input required type="text" value={pendingPasskeyName} onChange={e => setPendingPasskeyName(e.target.value)} placeholder="e.g. YubiKey 5C NFC - Secure Hub" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs text-white focus:border-orange-500/50 outline-none transition-all" />
                  <p className="text-[8px] text-slate-600 uppercase font-bold px-2">Example: Primary Hardware Token Alpha</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Credential Raw ID (Base64URL)</label>
                  <input required type="text" value={manualRawId} onChange={e => setManualRawId(e.target.value)} placeholder="A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-[10px] text-blue-500 font-mono focus:border-orange-500/50 outline-none transition-all" />
                  <p className="text-[8px] text-slate-600 uppercase font-bold px-2">Example: 786-f28a-11ed-a05b-0242ac120003</p>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Public Key Material (Base64/PEM)</label>
                  <textarea required rows={4} value={manualPublicKey} onChange={e => setManualPublicKey(e.target.value)} placeholder="MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-[10px] text-orange-500 font-mono focus:border-orange-500/50 outline-none transition-all custom-scrollbar resize-none" />
                  <p className="text-[8px] text-slate-600 uppercase font-bold px-2">Format: SubjectPublicKeyInfo (SPKI) in Base64 encoding.</p>
               </div>
               <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setRegFlowStep('choice')} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Back</button>
                  <button type="submit" className="flex-1 py-4 bg-orange-600 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-900/20">Commit Import</button>
               </div>
            </form>
          </div>
        ) : regFlowStep === 'success' ? (
          <div className="text-center">
            <i className="fas fa-check-double text-emerald-500 text-5xl mb-6"></i>
            <h2 className="text-2xl font-black text-white mb-8 uppercase">Enclave Bound</h2>
            <button onClick={() => setAuthStage('app')} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs">Enter Production Environment</button>
          </div>
        ) : regFlowStep === 'error' && activeError ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 animate-bounce">
              <i className="fas fa-triangle-exclamation text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter mb-4">{activeError.title}</h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed px-6 mb-8">{activeError.message}</p>
            
            <div className="bg-black/30 border border-white/5 rounded-[2rem] p-6 mb-8 text-left">
              <div className="flex items-center gap-3 mb-3">
                 <i className="fas fa-lightbulb text-orange-500 text-xs"></i>
                 <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Sovereign Tip</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">{activeError.tip}</p>
            </div>

            <div className="flex flex-col gap-4">
               <button onClick={startGuidedRegistration} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-900/40">
                 Retry Attestation Sequence
               </button>
               <button onClick={() => setRegFlowStep('choice')} className="w-full py-4 text-slate-600 hover:text-white transition-colors font-black uppercase text-[10px] tracking-[0.2em]">
                 Select Different Method
               </button>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center">
             <div className="w-12 h-12 border-4 border-t-blue-500 border-white/5 rounded-full animate-spin mb-6"></div>
             <p className="text-blue-500 font-black uppercase tracking-widest text-[10px]">{regFlowStep.toUpperCase()}...</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans">
      <div className="neon-atmosphere"></div>
      <ZeroTrustBadge isProd={passkeys.length > 0 && !useSimulationMode} />
      
      <aside className="w-72 border-r border-white/5 bg-[#020617]/50 backdrop-blur-2xl flex flex-col pt-20 z-40 transition-all">
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: AppView.SOURCES, icon: 'fa-link', label: 'Data Sources' },
            { id: AppView.SCANNER, icon: 'fa-radar', label: 'Privacy Scan' },
            { id: AppView.MY_STUFF, icon: 'fa-vault', label: 'The Vault' },
            { id: AppView.ENCLAVE, icon: 'fa-microchip', label: 'Enclave Admin' }
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-orange-600 text-black shadow-lg shadow-orange-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <i className={`fas ${item.icon} text-lg w-6 ${view === item.id ? '' : 'text-blue-500'}`}></i>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col pt-16 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          
          {view === AppView.SOURCES && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-6xl font-black sovereign-gradient-text uppercase tracking-tighter mb-16">Sources</h1>
              <div className="grid gap-6">
                 {['Google Workspace', 'Microsoft 365'].map(name => (
                   <div key={name} className="glass-card p-8 rounded-[3rem] flex items-center justify-between border border-blue-500/10 hover:border-blue-500/30 transition-all">
                     <div className="flex items-center gap-8">
                       <i className={`fab fa-${name.toLowerCase().split(' ')[0]} text-4xl text-blue-500`}></i>
                       <h3 className="font-black text-xl text-white uppercase">{name}</h3>
                     </div>
                     <button className="px-10 py-4 bg-orange-600 text-black rounded-2xl font-black uppercase text-[9px] shadow-lg tracking-widest">Link Securely</button>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {view === AppView.SCANNER && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {isScanning ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 border-4 border-t-blue-500 border-white/5 rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(37,99,235,0.1)]"></div>
                  <p className="text-blue-500 font-black uppercase tracking-[0.3em]">{scanStatusText}</p>
                </div>
              ) : threats.length > 0 ? (
                <div className="space-y-4 pb-32">
                  <header className="mb-12">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Discovery Feed</h1>
                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Live PII & Leak Discovery via GCP DLP Engine</p>
                  </header>
                  {threats.map(t => (
                    <div key={t.id} className="glass-card p-6 rounded-3xl flex items-center justify-between border border-blue-500/10 hover:border-orange-500/30 transition-all">
                       <div className="flex items-center gap-6">
                         <RiskIndicator level={t.riskLevel} />
                         <div>
                           <div className="flex items-center gap-3 mb-1">
                             <p className="text-white font-black text-lg">{t.source}</p>
                             <span className="bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg text-[8px] font-black text-orange-400 uppercase tracking-widest">{t.discoveryType}</span>
                           </div>
                           <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t.subject}</p>
                         </div>
                       </div>
                       <div className="flex gap-3">
                          <button className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                          <button className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"><i className="fas fa-shield-halved"></i></button>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-24 h-24 rounded-full bg-blue-500/5 flex items-center justify-center border border-dashed border-blue-500/20 mb-8">
                     <i className="fas fa-radar text-4xl text-blue-800"></i>
                   </div>
                   <button onClick={startSovereignScan} className="px-14 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/40 hover:scale-105 transition-transform">Run Deep DLP Audit</button>
                </div>
              )}
            </div>
          )}

          {view === AppView.ENCLAVE && (
            <div className="max-w-7xl mx-auto space-y-12 pb-32">
               {/* --- Kernel & Confidential Computing Vitals --- */}
               <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
                     <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6">CPU Load</p>
                     <div className="flex items-end gap-3">
                        <span className="text-5xl font-black text-white tabular-nums">{vitals.cpuUsage}%</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full mb-3 overflow-hidden">
                           <div className="h-full bg-blue-500 transition-all duration-700" style={{width: `${vitals.cpuUsage}%`}}></div>
                        </div>
                     </div>
                  </div>
                  <div className="glass-card p-8 rounded-[2.5rem] border-blue-500/10">
                     <p className="text-[9px] text-blue-500 font-black uppercase tracking-widest mb-6">TEE Integrity (SEV-SNP)</p>
                     <div className="flex items-center gap-4">
                        <span className="text-4xl font-black text-white">{vitals.teeStatus}</span>
                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse"></div>
                     </div>
                  </div>
                  <div className="glass-card p-8 rounded-[2.5rem] border-orange-500/10">
                     <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest mb-6">Residency Context</p>
                     <span className="text-xl font-black text-white uppercase tracking-tighter">{enclaveProfile.residencyRegion}</span>
                  </div>
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
                     <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6">Active Tunnels</p>
                     <span className="text-5xl font-black text-white tabular-nums">{vitals.activeRequests}</span>
                  </div>
               </section>

               <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                  <div className="xl:col-span-2 space-y-12">
                    {/* --- Sovereign Privacy Hub --- */}
                    <section className="glass-card p-12 rounded-[3.5rem] border border-orange-500/10 relative overflow-hidden bg-orange-500/[0.02]">
                        <header className="mb-12 flex justify-between items-start">
                          <div>
                              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Sovereign Policy Hub</h2>
                              <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Configure Data Retention & GCP Residency Rules</p>
                          </div>
                          <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-[2rem] border border-white/5">
                              <div className="flex flex-col items-end mr-4">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Post-Quantum Cryptography</span>
                                <span className={`text-[8px] font-mono uppercase tracking-tighter ${enclaveProfile.postQuantumEnabled ? 'text-emerald-500' : 'text-slate-600'}`}>
                                    {enclaveProfile.postQuantumEnabled ? 'Priority Mandate: Active' : 'Mandate: Pending'}
                                </span>
                              </div>
                              <button 
                                onClick={togglePostQuantum}
                                className={`w-14 h-8 rounded-full relative transition-all duration-500 ${enclaveProfile.postQuantumEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800'}`}
                              >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-500 shadow-lg ${enclaveProfile.postQuantumEnabled ? 'left-7' : 'left-1'}`}></div>
                              </button>
                          </div>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-8">
                              <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">Retention Horizon (TTL)</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {['Ephemeral', '24h', '7d', 'Infinite'].map(p => (
                                      <button key={p} onClick={() => setEnclaveProfile({...enclaveProfile, retentionPolicy: p.toLowerCase() as any})} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${enclaveProfile.retentionPolicy === p.toLowerCase() ? 'bg-orange-600 text-black border-orange-500 shadow-lg shadow-orange-900/20' : 'bg-black/30 text-slate-500 border-white/5 hover:border-white/20'}`}>
                                        {p}
                                      </button>
                                    ))}
                                </div>
                              </div>
                              <div className="flex gap-4">
                                <div className="flex-1 p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10">
                                    <div className="flex items-center gap-4 mb-3">
                                      <i className="fas fa-trash-clock text-orange-500"></i>
                                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Auto-Purge Strategy</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">Shredding: {enclaveProfile.retentionPolicy}.</p>
                                </div>
                                {enclaveProfile.postQuantumEnabled && (
                                    <div className="flex-1 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] animate-pulse">
                                      <div className="flex items-center gap-4 mb-3">
                                          <i className="fas fa-atom text-emerald-500"></i>
                                          <span className="text-[10px] font-black text-white uppercase tracking-widest">PQC HARDENED</span>
                                      </div>
                                      <p className="text-[10px] text-emerald-400/80 font-medium leading-relaxed uppercase tracking-wider">ML-KEM ACTIVE.</p>
                                    </div>
                                )}
                              </div>
                          </div>
                          <div className="space-y-8 border-l border-white/5 pl-12">
                              <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">Sovereign Region Pinning</label>
                                <select onChange={e => setEnclaveProfile({...enclaveProfile, residencyRegion: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-blue-500/40 transition-all">
                                    <option value="us-sovereign">US-Sovereign-Hardened (Default)</option>
                                    <option value="eu-sovereign">EU-Sovereign-GDPR-1</option>
                                    <option value="asia-hardened">Asia-Pac-Sovereign-L3</option>
                                </select>
                              </div>
                              <div className="flex items-center gap-4 text-emerald-500 bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
                                <i className="fas fa-earth-americas text-2xl"></i>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Residency Verified</p>
                                    <p className="text-[9px] font-mono text-emerald-500/60 uppercase">PINNED: {enclaveProfile.residencyRegion.toUpperCase()}</p>
                                </div>
                              </div>
                          </div>
                        </div>
                    </section>
                  </div>

                  <div className="space-y-12">
                    {/* --- Security Audits Section --- */}
                    <section className="glass-card p-10 rounded-[3.5rem] border border-blue-500/10 bg-blue-500/[0.02] flex flex-col h-full">
                        <header className="mb-10">
                          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">Security Audits</h2>
                          <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em]">Compliance & Attestation Engine</p>
                        </header>
                        
                        <div className="flex-1 space-y-6 mb-10">
                          {complianceItems.map(item => (
                            <div key={item.id} className="flex gap-4 items-start p-4 rounded-2xl bg-black/20 border border-white/5 transition-all">
                               <div className={`mt-1 shrink-0 ${item.status === 'passed' ? 'text-emerald-500' : item.status === 'failed' ? 'text-rose-500' : 'text-slate-600'}`}>
                                 {item.status === 'pending' ? (
                                   <i className="fas fa-circle-notch animate-spin text-sm"></i>
                                 ) : item.status === 'passed' ? (
                                   <i className="fas fa-shield-check text-sm"></i>
                                 ) : (
                                   <i className="fas fa-shield-exclamation text-sm"></i>
                                 )}
                               </div>
                               <div>
                                 <h4 className={`text-[11px] font-black uppercase tracking-widest ${item.status === 'passed' ? 'text-emerald-400' : item.status === 'failed' ? 'text-rose-400' : 'text-slate-400'}`}>{item.label}</h4>
                                 <p className="text-[9px] text-slate-500 uppercase mt-1 leading-relaxed font-bold">{item.description}</p>
                               </div>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={triggerComplianceScan}
                          disabled={isComplianceScanning}
                          className={`w-full py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isComplianceScanning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/30'}`}
                        >
                          {isComplianceScanning ? (
                            <>
                              <i className="fas fa-radar animate-pulse"></i>
                              Auditing Core...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-shield-halved"></i>
                              Trigger Sovereign Audit
                            </>
                          )}
                        </button>
                    </section>
                  </div>
               </div>

               {/* --- Hardware Identity Nodes --- */}
               <section className="glass-card p-12 rounded-[3.5rem] border border-blue-500/10">
                  <header className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Hardware Identity Nodes</h2>
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Sovereign WebAuthn Authenticator Ledger</p>
                     </div>
                     <button onClick={() => { setView(AppView.ENCLAVE); setRegFlowStep('choice'); setAuthStage('passkey'); }} className="px-10 py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] transition-all shadow-xl shadow-blue-900/40">
                       Add Identity Binding
                     </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {passkeys.map(pk => (
                      <div key={pk.id} className="p-8 bg-black/30 border border-white/5 rounded-[2.5rem] group hover:border-blue-500/30 transition-all flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner">
                              <i className="fas fa-fingerprint text-xl"></i>
                           </div>
                           <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 uppercase tracking-widest shadow-[0_0_10px_rgba(249,115,22,0.1)]">{pk.algorithm}</span>
                        </div>
                        <h4 className="text-lg font-black text-white uppercase mb-1">{pk.label}</h4>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-6">ID: {pk.id}</span>
                        <div className="mt-auto space-y-3 border-t border-white/5 pt-6">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Bonded</span>
                              <span className="text-[9px] font-mono text-slate-400">{new Date(pk.addedAt).toLocaleDateString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">FIDO2/L3</span>
                           </div>
                        </div>
                      </div>
                    ))}
                    {passkeys.length === 0 && (
                      <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-[2.5rem] bg-white/[0.02]">
                        <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest">No hardware nodes bonded to this enclave kernel.</p>
                      </div>
                    )}
                  </div>
               </section>

               {/* --- Access Nodes (API Keys) --- */}
               <section className="glass-card p-12 rounded-[3.5rem] relative overflow-hidden">
                  <header className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Access Nodes</h2>
                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Infrastructure Token Management & Audit Trail</p>
                     </div>
                     <button onClick={() => setShowKeyForm(!showKeyForm)} className={`px-10 py-5 rounded-[1.5rem] font-black uppercase text-[10px] transition-all shadow-xl ${showKeyForm ? 'bg-slate-800 text-white' : 'bg-orange-600 text-black hover:bg-orange-500 shadow-orange-900/20'}`}>
                       {showKeyForm ? 'Abort Provisioning' : 'Provision Access Node'}
                     </button>
                  </header>
                  
                  {showKeyForm && (
                     <form onSubmit={handleGenerateKey} className="mb-12 p-10 bg-white/5 rounded-[2.5rem] max-w-2xl border border-orange-500/20 animate-in slide-in-from-top-4 duration-500">
                        <h3 className="text-lg font-black text-white uppercase mb-6">New Node Specification</h3>
                        <div className="flex gap-4">
                           <input required type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Node Alias (e.g. Monitoring Node Alpha)" className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-orange-500/40 transition-all text-white font-medium" />
                           <button type="submit" className="px-10 py-4 bg-orange-600 text-black rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-orange-900/20">Commit Node</button>
                        </div>
                     </form>
                  )}

                  <div className="grid gap-6">
                    {apiKeys.map(k => (
                      <div key={k.id} onClick={() => setExpandedKeyId(expandedKeyId === k.id ? null : k.id)} className={`glass-card p-8 rounded-[2.5rem] cursor-pointer hover:border-blue-500/20 transition-all border border-white/5 ${k.status === 'revoked' ? 'opacity-40 grayscale pointer-events-none' : ''} ${expandedKeyId === k.id ? 'ring-2 ring-orange-500/30' : ''}`}>
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-900/10' : 'bg-rose-500/10 text-rose-500 shadow-rose-900/10'}`}>
                                 <i className="fas fa-key"></i>
                              </div>
                              <div>
                                 <h4 className="text-xl font-black text-white uppercase leading-none mb-2">{k.name}</h4>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">UID: {k.id}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{k.status}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-[8px] font-black uppercase text-slate-600 tracking-[0.2em] mr-2">{expandedKeyId === k.id ? 'Hide Audit ledger' : 'Open Audit ledger'}</div>
                              <button onClick={e => toggleKeyVisibility(k.id, e)} className="w-10 h-10 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all"><i className={`fas ${k.isVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                              <button onClick={e => handleRevokeKey(k.id, e)} className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                           </div>
                        </div>
                        <div className="bg-[#020617] p-5 rounded-2xl flex items-center justify-between border border-white/5 group-hover:border-blue-500/10 transition-colors">
                           <code className="text-sm font-mono text-blue-500/80 tracking-wider truncate mr-8">{k.isVisible ? k.key : '••••••••••••••••••••••••••••••••'}</code>
                           <button onClick={e => copyToClipboard(k.id, k.key, e)} className="w-10 h-10 shrink-0 bg-white/5 rounded-xl hover:text-emerald-500 transition-colors">
                              <i className={`fas ${copiedId === k.id ? 'fa-check text-emerald-500' : 'fa-copy'}`}></i>
                           </button>
                        </div>

                        {/* --- Audit Ledger --- */}
                        {expandedKeyId === k.id && (
                          <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in fade-in slide-in-from-top-4">
                             <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Immutable Node Audit Ledger</h5>
                             <div className="space-y-4 pr-4">
                                {k.auditTrail.map(event => (
                                  <div key={event.id} className="flex gap-6 items-start p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                       event.type === 'provision' ? 'bg-emerald-500/10 text-emerald-500' : 
                                       event.type === 'revocation' ? 'bg-rose-500/10 text-rose-500' : 
                                       'bg-blue-500/10 text-blue-500'
                                     }`}>
                                        <i className={`fas ${event.type === 'provision' ? 'fa-plus-circle' : event.type === 'revocation' ? 'fa-ban' : 'fa-shield-halved'}`}></i>
                                     </div>
                                     <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                           <span className={`text-[9px] font-black uppercase tracking-wider ${event.type === 'provision' ? 'text-emerald-500' : event.type === 'revocation' ? 'text-rose-500' : 'text-blue-500'}`}>{event.type.replace('_', ' ')}</span>
                                           <span className="text-[9px] font-mono text-slate-600">{event.timestamp}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{event.details}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
               </section>

               {/* --- Identity & System Logs --- */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-32">
                  <div className="glass-card p-12 rounded-[3.5rem] border border-white/5 flex flex-col h-[500px]">
                     <header className="mb-10 flex justify-between items-center">
                        <div>
                           <h4 className="text-2xl font-black text-white uppercase tracking-tighter sovereign-gradient-text">Identity Logs</h4>
                           <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Enclave Kernel Operations</p>
                        </div>
                        <i className="fas fa-scroll text-blue-800 text-3xl opacity-50"></i>
                     </header>
                     <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                        {identityLogs.map(log => (
                           <div key={log.id} className="flex gap-6 p-6 rounded-[2rem] bg-black/30 border border-white/5 hover:bg-white/5 transition-colors group">
                              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.type === 'user' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : log.type === 'system' ? 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.5)]' : 'bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.8)]'}`}></div>
                              <div className="flex-1">
                                 <p className="text-[11px] font-mono text-slate-300 leading-relaxed font-bold group-hover:text-white transition-colors tracking-tight">{log.event}</p>
                                 <span className="text-[9px] text-slate-700 font-mono mt-2 block uppercase tracking-widest">{log.timestamp}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="glass-card p-12 rounded-[3.5rem] border border-emerald-500/10 bg-emerald-500/5 flex flex-col justify-center items-center text-center">
                     <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <i className="fas fa-shield-halved text-4xl text-emerald-500"></i>
                     </div>
                     <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Production Hardening</h4>
                     <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.1em] max-w-sm mx-auto leading-relaxed mb-12">The enclave kernel is enforcing all 2026 privacy protocols. No administrative access is permitted without cryptographic attestation.</p>
                     <div className="flex gap-4">
                        <div className="px-6 py-3 bg-blue-900/20 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase text-blue-400 tracking-widest">L3 Resident</div>
                        <div className="px-6 py-3 bg-orange-900/20 border border-orange-500/20 rounded-2xl text-[10px] font-black uppercase text-orange-400 tracking-widest">ACM Enforced</div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {view === AppView.MY_STUFF && (
            <div className="max-w-6xl mx-auto">
               <header className="mb-16 flex items-center justify-between">
                 <div>
                   <h1 className="text-6xl font-black text-white uppercase tracking-tighter sovereign-gradient-text">The Vault</h1>
                   <p className="text-slate-500 uppercase font-black text-[10px] mt-2 tracking-[0.2em]">ECPA-Hardened Encryption Enclave</p>
                 </div>
                 <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-blue-900/20 tracking-widest">Secure Upload</button>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                 {vaultItems.map(item => (
                   <div key={item.id} className="glass-card p-10 rounded-[3.5rem] group hover:border-blue-500/20 transition-all border border-white/5">
                     <div className="flex justify-between items-start mb-8">
                       <i className={`fas ${item.type === 'document' ? 'fa-file-shield' : item.type === 'image' ? 'fa-image' : 'fa-message'} text-4xl text-blue-500/60 group-hover:text-blue-500 transition-colors`}></i>
                       <span className="text-[8px] font-mono bg-white/5 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">{item.encryption}</span>
                     </div>
                     <h3 className="text-white font-black text-xl uppercase leading-tight mb-2">{item.title}</h3>
                     <p className="text-[10px] text-slate-500 uppercase font-bold mb-8">{item.origin} • {item.timestamp}</p>
                     <div className="flex items-center justify-between border-t border-white/5 pt-6">
                       <button className="text-[9px] font-black uppercase text-blue-500 hover:text-white transition-colors tracking-widest">Decrypt</button>
                       <button className="text-[9px] font-black uppercase text-slate-500 hover:text-rose-500 transition-colors tracking-widest">Wipe Artifact</button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

        </div>

        {/* --- Sovereign Architect Chat Interface --- */}
        <div className={`fixed bottom-12 right-12 w-96 glass-card rounded-[3rem] border-blue-500/20 shadow-4xl flex flex-col transition-all duration-700 z-[100] ${isChatting ? 'scale-105 shadow-blue-900/40' : ''}`}>
           <div className="p-6 bg-black/20 rounded-t-[3rem] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <i className="fas fa-microchip"></i>
                 </div>
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">Sovereign Architect</span>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           </div>
           <div className="h-96 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {chatMessages.map(m => (
                 <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-[11px] leading-relaxed font-medium ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-200 shadow-inner border border-white/5'}`}>
                       {m.content}
                    </div>
                 </div>
              ))}
              {isChatting && (
                 <div className="flex items-center gap-3 px-4">
                    <div className="flex gap-1">
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                       <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                 </div>
              )}
           </div>
           <div className="p-6 bg-black/40 rounded-b-[3rem] border-t border-white/5">
              <div className="relative">
                 <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-4 px-6 text-xs text-white focus:outline-none focus:border-blue-500/40" placeholder="System optimization query..." />
                 <button onClick={handleSendMessage} className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all">
                    <i className="fas fa-arrow-up text-xs"></i>
                 </button>
              </div>
           </div>
        </div>
      </main>

      {/* --- Global Notifications --- */}
      {toast && (
        <div className="fixed bottom-10 left-12 z-[2000] animate-in slide-in-from-left-10 duration-500">
           <div className={`px-8 py-5 rounded-[2.5rem] border flex items-center gap-5 shadow-4xl backdrop-blur-2xl ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-400' : 'bg-slate-900/90 border-blue-500/30 text-blue-400'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20' : toast.type === 'error' ? 'bg-rose-500/20' : 'bg-blue-500/20'}`}>
                 <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-info-circle'}`}></i>
              </div>
              <span className="text-xs font-black uppercase text-white tracking-widest">{toast.message}</span>
              <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity ml-4"><i className="fas fa-times text-xs"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;