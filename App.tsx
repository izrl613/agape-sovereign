import React, { useState, useEffect, useRef } from 'react';
import { AppView, RiskLevel, EmailProvider, PrivacyThreat, ChatMessage, PrivacyDefinition, VaultItem, ApiKey, ApiKeyEvent, PasskeyRecord, EnclaveProfile, SystemVitals } from './types';
import { DEFAULT_CONFIG, PRIVACY_DEFINITIONS_DB, SCRIPTS } from './constants';
import { CodeBlock } from './components/CodeBlock';
import { getArchitectAdvice, fetchLatestDefinitions, simulateInboxFetch, validateLiveEmailBatch } from './services/geminiService';

// --- Cryptographic Helpers ---

const bufferToBase64 = (buffer: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
};

const base64ToBuffer = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const generateChallenge = () => {
  return window.crypto.getRandomValues(new Uint8Array(32));
};

const getFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// --- Error Mapping & Intelligence ---
interface SovereignError {
  title: string;
  message: string;
  tip: string;
  rawName: string;
}

const resolveWebAuthnError = (err: any): SovereignError => {
  const rawName = err.name || 'UnknownError';
  const base = { rawName, title: "Protocol Failure", message: err.message, tip: "Verify hardware connection and retry the attestation sequence." };
  
  switch (err.name) {
    case 'NotAllowedError':
      return { 
        ...base, 
        title: "Handshake Interrupted", 
        message: "The registration request was declined by the user or the session timed out.", 
        tip: "Keep your device unlocked and respond promptly to the system biometric prompt." 
      };
    case 'InvalidStateError':
      return { 
        ...base, 
        title: "Node Binding Conflict", 
        message: "This hardware authenticator is already associated with this enclave or is in an incompatible state.", 
        tip: "If you are trying to add a new key, ensure it hasn't been used here before, or manage existing keys in Enclave Admin." 
      };
    case 'SecurityError':
      return { 
        ...base, 
        title: "Transport Insecurity", 
        message: "The enclave hub requires a validated Secure Context (HTTPS/TLS) for cryptographic operations.", 
        tip: "Ensure you are accessing the node via an encrypted tunnel or localhost." 
      };
    case 'NotSupportedError':
      return { 
        ...base, 
        title: "Architecture Mismatch", 
        message: "The current platform or browser does not support FIDO2/L3 hardware attestation standards.", 
        tip: "Update your system firmware or switch to a browser with native WebAuthn support like Chrome or Safari." 
      };
    case 'AbortError':
      return { 
        ...base, 
        title: "Operation Aborted", 
        message: "The handshake was terminated by the enclave kernel or the hardware module.", 
        tip: "Refresh the session and ensure no other biometric processes are active on your device." 
      };
    case 'ConstraintError':
      return {
        ...base,
        title: "Hardware Constraint",
        message: "The authenticator failed to meet the security requirements of the Sovereign L3 policy.",
        tip: "Try using a different hardware key or check if your device's biometric sensor is clean."
      };
    default:
      return base;
  }
};

// --- Audit Logic Interface ---
interface AuditCheck {
  id: string;
  label: string;
  description: string;
  status: 'compliant' | 'failed' | 'pending';
  icon: string;
}

// --- Components ---

const ZeroTrustBadge = ({ isProd }: { isProd: boolean }) => (
  <div className="fixed top-0 left-0 w-full bg-[#020617]/95 border-b border-blue-500/20 backdrop-blur-md z-[1000] px-6 py-2 flex justify-between items-center shadow-lg shadow-blue-900/5">
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-1.5 rounded-full ${isProd ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]'} animate-[pulse_3s_infinite]`}></div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500">Agape Sovereign Enclave 2026</span>
    </div>
    <div className="flex items-center gap-4">
       <div className={`px-3 py-1 rounded-md border text-[7px] font-black uppercase tracking-widest ${isProd ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
          {isProd ? 'Environment: Production' : 'Environment: Development'}
       </div>
       <div className="flex items-center gap-1.5 opacity-40">
         <i className="fab fa-google text-[10px] text-slate-400"></i>
         <span className="text-[8px] font-mono text-slate-400 tracking-wider">BEYONDCORP L3</span>
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
  
  const [regFlowStep, setRegFlowStep] = useState<'idle' | 'naming' | 'preparing' | 'prompting' | 'verifying' | 'success' | 'error' | 'importing'>('idle');
  const [useSimulationMode, setUseSimulationMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [regDetails, setRegDetails] = useState<PasskeyRecord | null>(null);
  const [pendingPasskeyName, setPendingPasskeyName] = useState('');
  const [activeError, setActiveError] = useState<SovereignError | null>(null);

  const [enclaveProfile, setEnclaveProfile] = useState<EnclaveProfile>({
    minInstances: 1,
    maxInstances: 10,
    concurrency: 80,
    cpuMode: 'always_on',
    postQuantumEnabled: true
  });

  const [vitals, setVitals] = useState<SystemVitals>({
    cpuUsage: 12,
    memoryUsage: 240,
    activeRequests: 0,
    uptime: '14d 02h 11m'
  });

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditResults, setAuditResults] = useState<AuditCheck[]>([
    { id: 'HW_ROOT', label: 'Hardware Root Bonding', description: 'Requires at least one physical passkey binding.', status: 'pending', icon: 'fa-fingerprint' },
    { id: 'API_HYGIENE', label: 'API Hygiene Standards', description: 'Checks for expired or orphaned access nodes.', status: 'pending', icon: 'fa-key' },
    { id: 'KEY_LEAK', label: 'Key Leak Prevention', description: 'Ensures no secret keys are in cleartext.', status: 'pending', icon: 'fa-eye-slash' },
    { id: 'L3_PROTOCOL', label: 'L3 Protocol Integrity', description: 'Verifies FIDO2/L3 security standards.', status: 'pending', icon: 'fa-shield-halved' },
  ]);

  const [providers, setProviders] = useState<EmailProvider[]>([
    { id: 'gmail-1', name: 'Google Workspace', icon: 'fa-google', status: 'connected', lastScan: '2 hours ago' },
    { id: 'outlook-1', name: 'Microsoft 365', icon: 'fa-microsoft', status: 'disconnected', lastScan: null },
    { id: 'icloud-1', name: 'iCloud Mail', icon: 'fa-apple', status: 'disconnected', lastScan: null },
  ]);
  
  const [threats, setThreats] = useState<PrivacyThreat[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([
    { id: 'v1', title: '2026 Fiscal Strategy (Encrypted)', origin: 'Agape Sovereign', timestamp: '1 hour ago', type: 'document', encryption: 'AES-256-GCM' },
    { id: 'v2', title: 'Hardware Key Recovery Seed', origin: 'System Root', timestamp: 'Today', type: 'document', encryption: 'AES-256-GCM' },
    { id: 'v3', title: 'Sovereign Node Identity Proof', origin: 'Kernel Root', timestamp: 'Yesterday', type: 'image', encryption: 'AES-256-GCM' },
  ]);
  
  const [identityLogs, setIdentityLogs] = useState<{id: string, event: string, timestamp: string, type: 'user' | 'system' | 'critical'}[]>([
    { id: `log-${Date.now()}`, event: 'KERNEL_INITIALIZED_2026', timestamp: new Date().toLocaleTimeString(), type: 'system' }
  ]);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { 
      id: 'k1', 
      name: 'Default Edge Node', 
      key: 'sk_agape_' + Math.random().toString(36).substring(7), 
      createdAt: '2026-02-01', 
      expiresAt: getFutureDate(30), 
      isVisible: false, 
      status: 'active',
      auditTrail: [{ id: 'ae1', type: 'provision', timestamp: new Date().toLocaleString(), details: 'Initial system node provisioned by Root Architect.' }]
    }
  ]);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);

  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>(() => {
    const stored = localStorage.getItem('agape_passkeys_v2');
    if (stored) return JSON.parse(stored);
    return [];
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', role: 'assistant', content: 'Sovereign Enclave L3 active. Production environment status: HARDENED. How can I facilitate your security oversight today?', timestamp: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const addIdentityLog = (event: string, type: 'user' | 'system' | 'critical' = 'system') => {
    setIdentityLogs(prev => [{ id: `log-${Date.now()}-${Math.random()}`, event, timestamp: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 100));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    localStorage.setItem('agape_passkeys_v2', JSON.stringify(passkeys));
  }, [passkeys]);

  useEffect(() => {
    if (authStage !== 'app') return;
    const interval = setInterval(() => {
       setVitals(v => ({
         ...v,
         cpuUsage: Math.max(5, Math.min(45, v.cpuUsage + (Math.random() * 4 - 2))),
         activeRequests: Math.floor(Math.random() * 12)
       }));
    }, 3000);
    return () => clearInterval(interval);
  }, [authStage]);

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => {
      if (p.id === id) {
        const newStatus = p.status === 'connected' ? 'disconnected' : 'connected';
        if (newStatus === 'connected') {
          addIdentityLog(`USER: Linked source [${p.name}]`, 'user');
          showToast(`Linked ${p.name}`, 'success');
        } else {
          addIdentityLog(`USER: Revoked source [${p.name}]`, 'user');
          showToast(`Revoked ${p.name}`, 'info');
        }
        return { ...p, status: newStatus as 'connected' | 'disconnected' };
      }
      return p;
    }));
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const timestamp = new Date().toLocaleString();
    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(7),
      name: newKeyName,
      key: 'sk_agape_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''),
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: getFutureDate(30),
      isVisible: false,
      status: 'active',
      auditTrail: [{ id: 'ae-' + Date.now(), type: 'provision', timestamp, details: `Access Node [${newKeyName}] provisioned by sovereign user.` }]
    };

    setApiKeys(prev => [newKey, ...prev]);
    addIdentityLog(`USER: Provisioned new Access Node [${newKeyName}]`, 'user');
    showToast(`Key provisioned for ${newKeyName}`, 'success');
    setNewKeyName('');
    setShowKeyForm(false);
  };

  const handleRevokeKey = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    
    if (confirm(`Are you sure you want to revoke the Access Node [${key.name}]? This action is irreversible.`)) {
      setApiKeys(prev => prev.map(k => {
        if (k.id === id) {
          const trail: ApiKeyEvent[] = [...k.auditTrail, { 
            id: 'ae-' + Date.now(), 
            type: 'revocation', 
            timestamp: new Date().toLocaleString(), 
            details: 'Node access revoked by manual kernel request. Hardware tokens invalidated.' 
          }];
          return { ...k, status: 'revoked', auditTrail: trail };
        }
        return k;
      }));
      addIdentityLog(`CRITICAL: Revoked API access for [${key.name}]`, 'critical');
      showToast(`Revoked ${key.name}`, 'error');
    }
  };

  const handleRevokePasskey = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pk = passkeys.find(p => p.id === id);
    if (!pk) return;

    if (confirm(`Sever hardware identity binding for [${pk.label}]? This may lock you out if no other keys exist.`)) {
      setPasskeys(prev => prev.filter(p => p.id !== id));
      addIdentityLog(`CRITICAL: Severed passkey binding [${pk.label}]`, 'critical');
      showToast(`Severed ${pk.label}`, 'error');
    }
  };

  const toggleKeyVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApiKeys(prev => prev.map(k => {
      if (k.id === id) {
        const newVisible = !k.isVisible;
        const trail: ApiKeyEvent[] = [...k.auditTrail, { 
          id: 'ae-' + Date.now(), 
          type: 'visibility_toggle', 
          timestamp: new Date().toLocaleString(), 
          details: `Cleartext visibility toggled to ${newVisible ? 'VISIBLE' : 'HIDDEN'} for diagnostic purposes.` 
        }];
        return { ...k, isVisible: newVisible, auditTrail: trail };
      }
      return k;
    }));
  };

  const copyToClipboard = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addIdentityLog(`USER: Copied data to clipboard [ID: ${id}]`, 'user');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerSecurityAudit = async () => {
    setIsAuditing(true);
    setAuditProgress(0);
    addIdentityLog('AUDIT: Initializing deep infrastructure scan', 'system');

    const auditSteps = [
      { id: 'HW_ROOT', check: () => passkeys.length > 0 ? 'compliant' : 'failed' },
      { id: 'API_HYGIENE', check: () => apiKeys.filter(k => k.status === 'active').length > 0 ? 'compliant' : 'failed' },
      { id: 'KEY_LEAK', check: () => apiKeys.every(k => !k.isVisible) ? 'compliant' : 'failed' },
      { id: 'L3_PROTOCOL', check: () => window.isSecureContext ? 'compliant' : 'failed' },
    ];

    for (let i = 0; i < auditSteps.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setAuditProgress(((i + 1) / auditSteps.length) * 100);
      setAuditResults(prev => prev.map(res => 
        res.id === auditSteps[i].id ? { ...res, status: auditSteps[i].check() as any } : res
      ));
    }

    setIsAuditing(false);
    showToast("Audit finalized.", "info");
  };

  const startGuidedRegistration = async (customLabel?: string) => {
    const finalLabel = customLabel || pendingPasskeyName || 'New Hardware Authenticator';
    setRegFlowStep('preparing');
    setActiveError(null);
    setIsAuthenticating(true);
    
    try {
      if (!window.isSecureContext && !useSimulationMode) {
        throw new Error("WebAuthn requires a Secure Context (HTTPS).");
      }
      await new Promise(r => setTimeout(r, 1000));
      setRegFlowStep('prompting');
      
      let credential;
      if (useSimulationMode) {
        await new Promise(r => setTimeout(r, 1500));
        credential = { id: 'SIM-' + Math.random().toString(36).substr(2, 9), rawId: new Uint8Array(32), type: 'public-key' };
      } else {
        const challenge = generateChallenge();
        const userId = window.crypto.getRandomValues(new Uint8Array(16));
        const createOptions: PublicKeyCredentialCreationOptions = {
          challenge,
          rp: { name: "Agape Sovereign", id: window.location.hostname },
          user: { id: userId, name: "sovereign_user", displayName: finalLabel },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000
        };
        credential = await navigator.credentials.create({ publicKey: createOptions });
      }

      if (credential) {
        setRegFlowStep('verifying');
        const credId = 'rawId' in credential ? bufferToBase64(credential.rawId as ArrayBuffer) : (credential as any).id;
        const newRecord: PasskeyRecord = {
          id: Math.random().toString(36).substring(7),
          rawId: credId,
          label: finalLabel,
          type: credential.type,
          algorithm: 'ES256', // Specified cryptographic algorithm
          addedAt: new Date().toISOString(),
          lastUsedAt: new Date().toLocaleString(),
          status: 'verified'
        };
        setPasskeys(prev => [newRecord, ...prev]);
        setRegFlowStep('success');
        showToast(`Passkey bonded: ${finalLabel}`, 'success');
        if (authStage === 'passkey') setTimeout(() => setAuthStage('app'), 2000);
      }
    } catch (err: any) {
      setActiveError(resolveWebAuthnError(err));
      setRegFlowStep('error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    try {
      if (passkeys.length === 0) throw new Error("No hardware binding.");
      if (useSimulationMode) { await new Promise(r => setTimeout(r, 1000)); } 
      else {
        const challenge = generateChallenge();
        const getOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          allowCredentials: [{ id: base64ToBuffer(passkeys[0].rawId), type: "public-key" }],
          userVerification: "required",
          timeout: 60000
        };
        await navigator.credentials.get({ publicKey: getOptions });
      }
      setAuthStage('app');
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg, timestamp: 'Now' }]);
    setIsChatting(true);
    const advice = await getArchitectAdvice(msg, `View: ${view}, Keys: ${apiKeys.length}`);
    setChatMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: advice || 'No response.', timestamp: 'Now' }]);
    setIsChatting(false);
  };

  const startSovereignScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setView(AppView.SCANNER);
    setScanStatusText("Tunneling...");
    await new Promise(r => setTimeout(r, 1000));
    setScanProgress(40);
    setScanStatusText("Analyzing...");
    const raw = await simulateInboxFetch('Google Workspace');
    const results = await validateLiveEmailBatch(raw);
    setThreats(results.map((r: any) => ({
      id: r.id, source: r.sender, subject: r.subject, emailProviderId: 'gmail-1',
      riskLevel: r.riskLevel, detectedVia: 'Sovereign Core', timestamp: 'Now', suggestedAction: r.suggestedAction
    })));
    setScanProgress(100);
    setIsScanning(false);
  };

  const handleAction = (id: string, action: 'NUKE' | 'FT_KNOX') => {
    setThreats(prev => prev.filter(t => t.id !== id));
    if (action === 'NUKE') {
      showToast("Threat neutralized.", "success");
    } else {
      setVaultItems(prev => [{
        id: `v-${Date.now()}`, title: 'Secured Threat Artifact', origin: 'Scanner',
        timestamp: 'Now', type: 'thread', encryption: 'AES-256-GCM'
      }, ...prev]);
      showToast("Vaulted for analysis.", "info");
    }
  };

  // --- Renderers ---

  if (authStage === 'zerotrust') return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-mono relative overflow-hidden">
      <div className="neon-atmosphere"></div>
      <i className="fas fa-shield-cat text-8xl text-orange-600 mb-8 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]"></i>
      <h1 className="text-3xl sovereign-gradient-text uppercase tracking-[0.4em] font-black mb-4">AGAPE SOVEREIGN</h1>
      <span className="text-[10px] text-blue-400 font-bold tracking-[0.3em] uppercase">Booting Enclave L3</span>
    </div>
  );

  if (authStage === 'passkey') return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-inter p-6 relative overflow-hidden">
      <div className="neon-atmosphere"></div>
      <div className="scan-overlay"></div>
      {regFlowStep === 'idle' ? (
        <div className="glass-card p-12 rounded-[4rem] border-blue-500/20 text-center max-w-md w-full relative z-10">
          <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <i className={`fas ${isAuthenticating ? 'fa-spinner fa-spin' : 'fa-fingerprint'} text-5xl text-blue-500`}></i>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Verification</h2>
          <div className="space-y-4">
            <button onClick={() => passkeys.length > 0 ? handlePasskeyAuth() : setRegFlowStep('naming')} disabled={isAuthenticating} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-3xl transition-all shadow-xl shadow-blue-900/40">
              {passkeys.length > 0 ? 'Authenticate' : 'Establish Binding'}
            </button>
            <button onClick={() => setUseSimulationMode(!useSimulationMode)} className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest ${useSimulationMode ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>
              {useSimulationMode ? 'Simulation Mode' : 'Hardware Mode'}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 rounded-[4rem] border-blue-500/20 max-w-md w-full relative z-10">
           {regFlowStep === 'naming' && (
             <div className="text-center">
               <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Node Alias</h4>
               <input type="text" value={pendingPasskeyName} onChange={e => setPendingPasskeyName(e.target.value)} placeholder="e.g. Master Key" className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white mb-8" />
               <div className="flex gap-4">
                 <button onClick={() => setRegFlowStep('idle')} className="flex-1 py-4 text-slate-500 uppercase font-black text-[10px]">Cancel</button>
                 <button onClick={() => startGuidedRegistration()} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px]">Initialize</button>
               </div>
             </div>
           )}
           {regFlowStep === 'error' && activeError && (
             <div className="text-center">
               <i className="fas fa-triangle-exclamation text-rose-500 text-5xl mb-6"></i>
               <h4 className="text-xl font-black text-white mb-2">{activeError.title}</h4>
               <p className="text-xs text-slate-400 mb-8">{activeError.message}</p>
               <div className="bg-rose-500/10 p-4 rounded-xl text-[10px] text-rose-400 mb-8 text-left border border-rose-500/20">
                 <strong>TIP:</strong> {activeError.tip}
               </div>
               <button onClick={() => setRegFlowStep('naming')} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px]">Retry Handshake</button>
             </div>
           )}
           {['preparing', 'prompting', 'verifying'].includes(regFlowStep) && (
             <div className="text-center">
               <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-8"></div>
               <h4 className="text-xl font-black text-white uppercase tracking-widest text-blue-500">{regFlowStep.toUpperCase()}</h4>
             </div>
           )}
           {regFlowStep === 'success' && (
             <div className="text-center">
               <i className="fas fa-check-double text-emerald-500 text-5xl mb-6"></i>
               <h4 className="text-xl font-black text-white mb-8">Bonding Complete</h4>
               <button onClick={() => setAuthStage('app')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px]">Enter Enclave</button>
             </div>
           )}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden selection:bg-orange-500/30">
      <div className="neon-atmosphere"></div>
      <ZeroTrustBadge isProd={passkeys.length > 0 && !useSimulationMode} />
      
      <aside className="w-72 border-r border-white/5 bg-[#020617]/50 backdrop-blur-2xl flex flex-col pt-20 z-40 transition-all">
        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: AppView.SOURCES, icon: 'fa-link', label: 'Data Sources' },
            { id: AppView.SCANNER, icon: 'fa-radar', label: 'Privacy Scan' },
            { id: AppView.MY_STUFF, icon: 'fa-vault', label: 'The Vault' },
            { id: AppView.ENCLAVE, icon: 'fa-microchip', label: 'Enclave Admin' }
          ].map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-orange-600 text-black shadow-lg shadow-orange-900/40' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <i className={`fas ${item.icon} text-lg w-6 ${view === item.id ? 'text-black' : 'text-blue-500'}`}></i>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col pt-16 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          
          {view === AppView.SOURCES && (
            <div className="max-w-4xl mx-auto">
              <header className="mb-16">
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter sovereign-gradient-text">Sources</h1>
              </header>
              <div className="grid gap-6">
                 {providers.map(p => (
                   <div key={p.id} className="glass-card p-8 rounded-[3rem] flex items-center justify-between">
                     <div className="flex items-center gap-8">
                       <i className={`fab ${p.icon} text-4xl text-blue-500`}></i>
                       <h3 className="font-black text-xl text-white uppercase">{p.name}</h3>
                     </div>
                     <button onClick={() => toggleProvider(p.id)} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${p.status === 'connected' ? 'bg-slate-800 border-white/10 text-white' : 'bg-orange-600 border-orange-500 text-black shadow-lg shadow-orange-900/20'}`}>
                       {p.status === 'connected' ? 'Disconnect' : 'Connect'}
                     </button>
                   </div>
                 ))}
              </div>
              <div className="mt-20 p-16 bg-blue-600/5 border border-dashed border-blue-500/20 rounded-[4rem] text-center">
                 <button onClick={startSovereignScan} className="px-14 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-900/40">Start Scan</button>
              </div>
            </div>
          )}

          {view === AppView.SCANNER && (
             <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center">
                {isScanning ? (
                  <div className="text-center">
                    <div className="w-48 h-48 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(37,99,235,0.1)]"></div>
                    <p className="text-sm font-black uppercase text-blue-500 tracking-[0.2em]">{scanStatusText}</p>
                  </div>
                ) : threats.length > 0 ? (
                  <div className="w-full space-y-4 pb-32">
                    {threats.map(t => (
                      <div key={t.id} className="glass-card p-6 rounded-3xl flex items-center justify-between border border-rose-500/20">
                         <div className="flex items-center gap-4">
                           <RiskIndicator level={t.riskLevel} />
                           <div>
                             <p className="text-white font-black text-lg">{t.source}</p>
                             <p className="text-xs text-slate-500">{t.subject}</p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => handleAction(t.id, 'NUKE')} className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20"><i className="fas fa-trash"></i></button>
                            <button onClick={() => handleAction(t.id, 'FT_KNOX')} className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20"><i className="fas fa-vault"></i></button>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 uppercase font-black tracking-widest">Scan Complete. No threats detected.</p>
                )}
             </div>
          )}

          {view === AppView.MY_STUFF && (
            <div className="max-w-6xl mx-auto">
               <header className="mb-16 flex items-center justify-between">
                 <div>
                   <h1 className="text-6xl font-black text-white uppercase tracking-tighter sovereign-gradient-text">The Vault</h1>
                   <p className="text-slate-500 uppercase font-black text-[10px] mt-2 tracking-[0.2em]">ECPA-Hardened Encryption Enclave</p>
                 </div>
                 <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-blue-900/20">Upload Securely</button>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                 {vaultItems.map(item => (
                   <div key={item.id} className="glass-card p-10 rounded-[3.5rem] group hover:border-blue-500/20 transition-all">
                     <div className="flex justify-between items-start mb-8">
                       <i className={`fas ${item.type === 'document' ? 'fa-file-shield' : item.type === 'image' ? 'fa-image' : 'fa-message'} text-4xl text-blue-500/60 group-hover:text-blue-500 transition-colors`}></i>
                       <span className="text-[8px] font-mono bg-white/5 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">{item.encryption}</span>
                     </div>
                     <h3 className="text-white font-black text-xl uppercase leading-tight mb-2">{item.title}</h3>
                     <p className="text-[10px] text-slate-500 uppercase font-bold mb-8">{item.origin} • {item.timestamp}</p>
                     <div className="flex items-center justify-between border-t border-white/5 pt-6">
                       <button className="text-[9px] font-black uppercase text-blue-500 hover:text-white transition-colors">Decrypt Node</button>
                       <button className="text-[9px] font-black uppercase text-slate-500 hover:text-rose-500 transition-colors">Wipe</button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {view === AppView.ENCLAVE && (
            <div className="max-w-7xl mx-auto space-y-12 pb-32">
               <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                     <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6">Kernel CPU Load</p>
                     <div className="flex items-end gap-3">
                        <span className="text-5xl font-black text-white tabular-nums">{Math.floor(vitals.cpuUsage)}%</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full mb-3 overflow-hidden">
                           <div className="h-full bg-blue-500 transition-all duration-700" style={{width: `${vitals.cpuUsage}%`}}></div>
                        </div>
                     </div>
                  </div>
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                     <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6">Hardened Memory</p>
                     <div className="flex items-center gap-4">
                        <span className="text-5xl font-black text-white tabular-nums text-blue-500">{vitals.memoryUsage}</span>
                        <span className="text-xl font-black text-slate-500">MB</span>
                     </div>
                  </div>
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                     <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6">Active Tunnels</p>
                     <div className="flex items-center gap-2">
                        <span className="text-5xl font-black text-white tabular-nums text-orange-500">{vitals.activeRequests}</span>
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse ml-2 shadow-[0_0_8px_orange]"></div>
                     </div>
                  </div>
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                     <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6">Node Uptime</p>
                     <span className="text-4xl font-black text-white tabular-nums">{vitals.uptime}</span>
                  </div>
               </section>

               <section className="glass-card p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 flex items-center gap-4">
                     {isAuditing && (
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-[8px] font-mono text-blue-500 uppercase font-black tracking-widest">Scanning Architecture... {Math.floor(auditProgress)}%</span>
                           <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${auditProgress}%` }}></div>
                           </div>
                        </div>
                     )}
                     <button 
                        onClick={triggerSecurityAudit} 
                        disabled={isAuditing}
                        className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] transition-all flex items-center gap-3 ${isAuditing ? 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-900/40'}`}
                     >
                        <i className={`fas ${isAuditing ? 'fa-spinner fa-spin' : 'fa-shield-heart'}`}></i>
                        {isAuditing ? 'Audit in Progress' : 'Start Security Audit'}
                     </button>
                  </div>
                  
                  <header className="mb-12">
                     <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Security Infrastructure Audit</h2>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Enclave Hardening Compliance Dashboard</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {auditResults.map((check) => (
                        <div key={check.id} className="p-8 bg-black/30 border border-white/5 rounded-[2.5rem] flex items-start gap-6 hover:border-white/10 transition-all">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                              check.status === 'compliant' ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 
                              check.status === 'failed' ? 'bg-rose-500/10 text-rose-500' : 
                              'bg-slate-800 text-slate-500'
                           }`}>
                              <i className={`fas ${check.icon}`}></i>
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                 <h4 className="text-lg font-black text-white uppercase tracking-tight">{check.label}</h4>
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    check.status === 'compliant' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                    check.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                                    'bg-slate-800 text-slate-500 border border-white/5'
                                 }`}>
                                    {check.status === 'compliant' ? 'Compliant' : check.status === 'failed' ? 'Critical Failure' : 'Awaiting Scan'}
                                 </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium uppercase leading-relaxed tracking-wider">{check.description}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>

               {/* --- Hardware Identity Nodes (Passkey) Section --- */}
               <section className="glass-card p-12 rounded-[3.5rem] relative overflow-hidden">
                  <header className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Hardware Identity Nodes</h2>
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Sovereign WebAuthn Authenticator Ledger</p>
                     </div>
                     <button onClick={() => setRegFlowStep('naming')} className="px-10 py-5 rounded-[1.5rem] bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] transition-all shadow-xl shadow-blue-900/40">
                       Establish New Binding
                     </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {passkeys.map(pk => (
                      <div key={pk.id} className="p-8 bg-black/30 border border-white/5 rounded-[2.5rem] group hover:border-blue-500/30 transition-all flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                              <i className="fas fa-fingerprint text-xl"></i>
                           </div>
                           <button onClick={e => handleRevokePasskey(pk.id, e)} className="text-rose-500/50 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><i className="fas fa-link-slash"></i></button>
                        </div>
                        <h4 className="text-lg font-black text-white uppercase mb-1">{pk.label}</h4>
                        <div className="flex flex-col gap-1 mb-6">
                           <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">ID: {pk.id}</span>
                           <div className="flex items-center gap-2 mt-2">
                             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Algorithm:</span>
                             <span className="px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 uppercase tracking-widest shadow-[0_0_10px_rgba(249,115,22,0.1)]">{pk.algorithm}</span>
                           </div>
                        </div>
                        <div className="mt-auto space-y-3 border-t border-white/5 pt-6">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Bonded</span>
                              <span className="text-[9px] font-mono text-slate-400">{new Date(pk.addedAt).toLocaleDateString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Last Auth</span>
                              <span className="text-[9px] font-mono text-slate-400">{pk.lastUsedAt || 'Never'}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Security Type</span>
                              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">FIDO2/L3</span>
                           </div>
                        </div>
                      </div>
                    ))}
                    {passkeys.length === 0 && (
                      <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-[2.5rem]">
                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">No hardware nodes bonded to this enclave.</p>
                      </div>
                    )}
                  </div>
               </section>

               <section className="glass-card p-12 rounded-[3.5rem] relative overflow-hidden">
                  <header className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Access Nodes</h2>
                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">Infrastructure Token Management & Audit</p>
                     </div>
                     <button onClick={() => setShowKeyForm(!showKeyForm)} className={`px-10 py-5 rounded-[1.5rem] font-black uppercase text-[10px] transition-all shadow-xl ${showKeyForm ? 'bg-slate-800 text-white' : 'bg-orange-600 text-black hover:bg-orange-500 shadow-orange-900/20'}`}>
                       {showKeyForm ? 'Abort Provisioning' : 'Provision Node'}
                     </button>
                  </header>
                  
                  {showKeyForm && (
                     <form onSubmit={handleGenerateKey} className="mb-12 p-10 bg-white/5 rounded-[2.5rem] max-w-2xl border border-orange-500/20 animate-in slide-in-from-top-4 duration-500">
                        <h3 className="text-lg font-black text-white uppercase mb-6">New Node Specification</h3>
                        <div className="flex gap-4">
                           <input required type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Node Identifier (e.g. Edge Alpha)" className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-orange-500/40 transition-all text-white" />
                           <button type="submit" className="px-10 py-4 bg-orange-600 text-black rounded-2xl font-black uppercase text-[10px] shadow-lg">Commit Token</button>
                        </div>
                     </form>
                  )}

                  <div className="grid gap-6">
                    {apiKeys.map(k => (
                      <div key={k.id} onClick={() => setExpandedKeyId(expandedKeyId === k.id ? null : k.id)} className={`glass-card p-8 rounded-[2.5rem] cursor-pointer hover:border-blue-500/20 transition-all border border-white/5 ${k.status === 'revoked' ? 'opacity-40 grayscale' : ''} ${expandedKeyId === k.id ? 'ring-2 ring-orange-500/30' : ''}`}>
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                 <i className="fas fa-key"></i>
                              </div>
                              <div>
                                 <h4 className="text-xl font-black text-white uppercase leading-none mb-1">{k.name}</h4>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">UID: {k.id}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{k.status}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-[8px] font-black uppercase text-slate-600 tracking-widest mr-2">{expandedKeyId === k.id ? 'Hide Audit Ledger' : 'View Audit Ledger'}</div>
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

                        {/* --- Immutable Audit Ledger --- */}
                        {expandedKeyId === k.id && (
                          <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em]">Immutable Node Audit Ledger</h5>
                                <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[8px] text-slate-500 uppercase font-black">Provision</span></div>
                                   <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[8px] text-slate-500 uppercase font-black">Security Toggle</span></div>
                                   <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div><span className="text-[8px] text-slate-500 uppercase font-black">Revocation</span></div>
                                </div>
                             </div>
                             <div className="space-y-4 pr-4">
                                {k.auditTrail.map(event => (
                                  <div key={event.id} className="flex gap-6 items-start p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                                       event.type === 'provision' ? 'bg-emerald-500/10 text-emerald-500' : 
                                       event.type === 'revocation' ? 'bg-rose-500/10 text-rose-500' : 
                                       'bg-blue-500/10 text-blue-500'
                                     }`}>
                                        <i className={`fas ${
                                          event.type === 'provision' ? 'fa-plus-circle' : 
                                          event.type === 'revocation' ? 'fa-ban' : 
                                          'fa-shield-halved'
                                        }`}></i>
                                     </div>
                                     <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                           <span className={`text-[9px] font-black uppercase tracking-wider ${
                                             event.type === 'provision' ? 'text-emerald-500' : 
                                             event.type === 'revocation' ? 'text-rose-500' : 
                                             'text-blue-500'
                                           }`}>{event.type.replace('_', ' ')}</span>
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

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                                 <p className="text-[11px] font-mono text-slate-300 leading-relaxed font-bold group-hover:text-white transition-colors">{log.event}</p>
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
                     <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Hardening Active</h4>
                     <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.1em] max-w-sm mx-auto leading-relaxed mb-12">The enclave kernel is monitoring all 2026 threat vectors in real-time. Unauthorized nodes are purged automatically.</p>
                     <div className="flex gap-4">
                        <div className="px-6 py-3 bg-blue-900/20 border border-blue-500/20 rounded-2xl text-[10px] font-black uppercase text-blue-400 tracking-widest">L3 Encryption Enforced</div>
                        <div className="px-6 py-3 bg-orange-900/20 border border-orange-500/20 rounded-2xl text-[10px] font-black uppercase text-orange-400 tracking-widest">Post-Quantum Ready</div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* --- Sovereign Architect Chat Interface --- */}
        <div className={`fixed bottom-12 right-12 w-96 glass-card rounded-[3rem] border-blue-500/20 shadow-4xl flex flex-col transition-all duration-700 z-[100] ${isChatting ? 'scale-105 shadow-blue-900/30' : ''}`}>
           <div className="p-6 bg-black/20 rounded-t-[3rem] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
                    <i className="fas fa-microchip"></i>
                 </div>
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">Sovereign Architect</span>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_emerald]"></div>
           </div>
           <div className="h-96 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {chatMessages.map(m => (
                 <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-[11px] leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-900/30' : 'bg-slate-800 text-slate-200 shadow-xl'}`}>
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
                    <span className="text-[9px] font-mono text-blue-500/60 uppercase font-black tracking-widest">Processing Query...</span>
                 </div>
              )}
           </div>
           <div className="p-6 bg-black/40 rounded-b-[3rem] border-t border-white/5">
              <div className="relative">
                 <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="w-full bg-[#020617] border border-white/10 rounded-2xl py-4 px-6 pr-14 text-xs focus:outline-none focus:border-blue-500/40 transition-all text-white placeholder:text-slate-600 font-medium" placeholder="Production optimization query..." />
                 <button onClick={handleSendMessage} className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center">
                    <i className="fas fa-arrow-up text-xs font-black"></i>
                 </button>
              </div>
           </div>
        </div>
      </main>

      {/* --- Global Toast Notifications --- */}
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