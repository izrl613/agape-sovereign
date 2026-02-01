import React, { useState, useEffect, useRef } from 'react';
import { AppView, RiskLevel, EmailProvider, PrivacyThreat, ChatMessage, PrivacyDefinition, VaultItem, ApiKey, PasskeyRecord } from './types';
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
  const base = { rawName, title: "Protocol Failure", message: err.message, tip: "Check system settings and retry." };
  
  if (err.name === 'NotAllowedError') {
    return { ...base, title: "Handshake Cancelled", message: "The registration request was interrupted or timed out.", tip: "Ensure your device is unlocked and respond to the system prompt quickly." };
  }
  if (err.name === 'InvalidStateError') {
    return { ...base, title: "Node Collision", message: "This hardware key is already bonded to this enclave hub.", tip: "Use a different physical key or manage your existing bindings below." };
  }
  if (err.name === 'SecurityError') {
    return { ...base, title: "Security Violation", message: "The enclave hub cannot establish a bond in this context.", tip: "Ensure you are using a secure connection (HTTPS) and a trusted browser." };
  }
  if (err.name === 'NotSupportedError') {
    return { ...base, title: "Incompatible Hardware", message: "Your browser or device does not support FIDO2/L3 standards.", tip: "Try updating your browser or using a dedicated YubiKey/Titan security key." };
  }
  if (err.name === 'AbortError') {
    return { ...base, title: "Handshake Aborted", message: "The operation was aborted by the enclave kernel.", tip: "Restart the naming process and ensure no other biometric requests are active." };
  }
  return base;
};

// --- Components ---

const ZeroTrustBadge = () => (
  <div className="fixed top-0 left-0 w-full bg-[#020617]/95 border-b border-orange-500/20 backdrop-blur-md z-[1000] px-6 py-2 flex justify-between items-center shadow-lg shadow-orange-900/5">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-[pulse_3s_infinite]"></div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500">Agape Sovereign Enclave 2026</span>
    </div>
    <div className="flex items-center gap-4">
       <div className="flex items-center gap-1.5 opacity-40">
         <i className="fab fa-google text-[10px] text-slate-400"></i>
         <span className="text-[8px] font-mono text-slate-400 tracking-wider">BEYONDCORP L3</span>
       </div>
       <span className="text-[8px] font-mono text-orange-500/60 border-l border-white/5 pl-4 tracking-widest">ENCLAVE_NODE: {window.location.hostname.toUpperCase()}</span>
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
  
  // Guided Registration State
  const [regFlowStep, setRegFlowStep] = useState<'idle' | 'naming' | 'preparing' | 'prompting' | 'verifying' | 'success' | 'error' | 'importing'>('idle');
  const [useSimulationMode, setUseSimulationMode] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [regDetails, setRegDetails] = useState<PasskeyRecord | null>(null);
  const [pendingPasskeyName, setPendingPasskeyName] = useState('');
  const [pendingRawId, setPendingRawId] = useState('');
  const [activeError, setActiveError] = useState<SovereignError | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // App Core State
  const [providers, setProviders] = useState<EmailProvider[]>([
    { id: 'gmail-1', name: 'Google Workspace', icon: 'fa-google', status: 'connected', lastScan: '2 hours ago' },
    { id: 'outlook-1', name: 'Microsoft 365', icon: 'fa-microsoft', status: 'disconnected', lastScan: null },
    { id: 'icloud-1', name: 'iCloud Mail', icon: 'fa-apple', status: 'disconnected', lastScan: null },
  ]);
  
  const [threats, setThreats] = useState<PrivacyThreat[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([
    { id: 'v1', title: '2026 Fiscal Strategy (Encrypted)', origin: 'Agape Sovereign', timestamp: '1 hour ago', type: 'document', encryption: 'AES-256-GCM' },
    { id: 'v2', title: 'Hardware Key Recovery Seed', origin: 'System Root', timestamp: 'Today', type: 'document', encryption: 'AES-256-GCM' },
  ]);
  
  const [identityLogs, setIdentityLogs] = useState<{id: string, event: string, timestamp: string, type: 'user' | 'system' | 'critical'}[]>([
    { id: `log-${Date.now()}`, event: 'KERNEL_INITIALIZED_2026', timestamp: new Date().toLocaleTimeString(), type: 'system' }
  ]);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: 'k1', name: 'Default Edge Node', key: 'sk_agape_' + Math.random().toString(36).substring(7), createdAt: '2026-02-01', expiresAt: getFutureDate(30), isVisible: false, status: 'active' }
  ]);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Passkeys array
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>(() => {
    const stored = localStorage.getItem('agape_passkeys_v2');
    if (stored) return JSON.parse(stored);
    
    const legacyId = localStorage.getItem('agape_credential_id');
    if (legacyId) {
      return [{
        id: 'legacy-root',
        rawId: legacyId,
        label: 'Legacy Hardware Root',
        type: 'public-key',
        algorithm: 'ES256',
        addedAt: new Date().toISOString(),
        lastUsedAt: localStorage.getItem('agape_last_verified'),
        status: 'active'
      }];
    }
    return [];
  });

  const [isHealthy, setIsHealthy] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', role: 'assistant', content: 'Sovereign Enclave L3 active. Identity verified. How can I protect your 2026 digital footprint today?', timestamp: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // --- Handlers ---

  const addIdentityLog = (event: string, type: 'user' | 'system' | 'critical' = 'system') => {
    setIdentityLogs(prev => [{ id: `log-${Date.now()}-${Math.random()}`, event, timestamp: new Date().toLocaleTimeString(), type }, ...prev].slice(0, 50));
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    localStorage.setItem('agape_passkeys_v2', JSON.stringify(passkeys));
  }, [passkeys]);

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

    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(7),
      name: newKeyName,
      key: 'sk_agape_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''),
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: getFutureDate(30),
      isVisible: false,
      status: 'active'
    };

    setApiKeys(prev => [newKey, ...prev]);
    addIdentityLog(`USER: Provisioned new Access Node [${newKeyName}]`, 'user');
    showToast(`Key provisioned for ${newKeyName}`, 'success');
    setNewKeyName('');
    setShowKeyForm(false);
  };

  const handleRevokeKey = (id: string) => {
    const key = apiKeys.find(k => k.id === id);
    if (!key) return;
    
    if (confirm(`Are you sure you want to revoke the Access Node [${key.name}]? This action is irreversible.`)) {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      addIdentityLog(`CRITICAL: Revoked API access for [${key.name}]`, 'critical');
      showToast(`Revoked ${key.name}`, 'error');
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isVisible: !k.isVisible } : k));
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addIdentityLog(`USER: Copied data to clipboard [ID: ${id}]`, 'user');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetIdentity = () => {
    if (confirm("Are you sure you want to wipe all hardware bindings? You will be locked out of the enclave.")) {
      localStorage.removeItem('agape_credential_id');
      localStorage.removeItem('agape_last_verified');
      localStorage.removeItem('agape_passkeys_v2');
      setPasskeys([]);
      setAuthStage('passkey');
      addIdentityLog('CRITICAL: All identity bindings purged by user request', 'critical');
      showToast("Identity bindings purged.", "error");
    }
  };

  const handleRevokePasskey = (id: string) => {
    if (confirm("Revoke this hardware credential? You will lose access to this device's root authority.")) {
      setPasskeys(prev => prev.filter(p => p.id !== id));
      addIdentityLog(`CRITICAL: Revoked hardware credential [${id}]`, 'critical');
      showToast("Credential revoked", "info");
    }
  };

  // --- Passkey / WebAuthn Logic ---

  const triggerRegistrationFlow = () => {
    setShowTechnicalDetails(false);
    setRegFlowStep('naming');
  };

  const triggerImportFlow = () => {
    setShowTechnicalDetails(false);
    setRegFlowStep('importing');
  };

  const handleManualImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPasskeyName.trim() || !pendingRawId.trim()) return;

    const newRecord: PasskeyRecord = {
      id: 'imp-' + Math.random().toString(36).substring(7),
      rawId: pendingRawId.trim(),
      label: pendingPasskeyName.trim(),
      type: 'public-key',
      algorithm: 'Imported (Manual Signature)',
      addedAt: new Date().toISOString(),
      lastUsedAt: null,
      status: 'active'
    };

    setPasskeys(prev => [newRecord, ...prev]);
    addIdentityLog(`USER: Manually imported credential [${newRecord.label}]`, 'user');
    showToast("Credential imported successfully", "success");
    setPendingPasskeyName('');
    setPendingRawId('');
    setRegFlowStep('idle');
  };

  const startGuidedRegistration = async (customLabel?: string) => {
    const finalLabel = customLabel || pendingPasskeyName || 'New Hardware Authenticator';
    
    setRegFlowStep('preparing');
    setActiveError(null);
    setIsAuthenticating(true);
    addIdentityLog(`AUTH: Initializing hardware attestation protocol for [${finalLabel}]`, 'system');

    try {
      if (!window.isSecureContext && !useSimulationMode) {
        throw new Error("WebAuthn requires a Secure Context (HTTPS/localhost). Use Simulation Mode for this environment.");
      }

      await new Promise(r => setTimeout(r, 1000));
      const challenge = generateChallenge();
      const userId = window.crypto.getRandomValues(new Uint8Array(16));
      
      setRegFlowStep('prompting');
      addIdentityLog('AUTH: Requesting platform authenticator signature');

      let credential;
      if (useSimulationMode || !window.PublicKeyCredential) {
        await new Promise(r => setTimeout(r, 2000));
        credential = { 
          id: 'SIMULATED-' + Math.random().toString(36).substr(2, 9), 
          rawId: new Uint8Array(32),
          type: 'public-key'
        };
      } else {
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
        addIdentityLog('AUTH: Verifying hardware credential block');
        await new Promise(r => setTimeout(r, 1500));

        const credId = 'rawId' in credential ? bufferToBase64(credential.rawId as ArrayBuffer) : (credential as any).id;
        
        const newRecord: PasskeyRecord = {
          id: Math.random().toString(36).substring(7),
          rawId: credId,
          label: finalLabel,
          type: credential.type,
          algorithm: 'ES256 (ECDSA w/ SHA-256)',
          addedAt: new Date().toISOString(),
          lastUsedAt: new Date().toLocaleString(),
          status: 'verified'
        };

        setPasskeys(prev => [newRecord, ...prev]);
        setRegDetails(newRecord);
        localStorage.setItem('agape_credential_id', credId);
        localStorage.setItem('agape_last_verified', newRecord.lastUsedAt || '');
        
        setRegFlowStep('success');
        addIdentityLog(`USER: Hardware identity [${finalLabel}] bonded successfully`, 'user');
        showToast(`Identity Vault secured via ${finalLabel}`, 'success');
        setPendingPasskeyName('');
        
        if (authStage === 'passkey') {
          setTimeout(() => setAuthStage('app'), 2500);
        }
      }
    } catch (err: any) {
      const sovError = resolveWebAuthnError(err);
      setRegFlowStep('error');
      setActiveError(sovError);
      addIdentityLog(`CRITICAL: Passkey error - ${sovError.rawName}: ${sovError.message}`, 'critical');
      showToast(sovError.message, "error");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    setActiveError(null);

    try {
      addIdentityLog('AUTH: Verifying existing biometric signature');
      if (passkeys.length === 0) throw new Error("No hardware binding found.");

      const primary = passkeys[0];

      if (useSimulationMode || !window.PublicKeyCredential) {
        await new Promise(r => setTimeout(r, 1000));
      } else {
        const challenge = generateChallenge();
        const getOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          allowCredentials: [{ id: base64ToBuffer(primary.rawId), type: "public-key" }],
          userVerification: "required",
          timeout: 60000
        };
        await navigator.credentials.get({ publicKey: getOptions });
      }

      const now = new Date().toLocaleString();
      setPasskeys(prev => prev.map(p => p.id === primary.id ? { ...p, lastUsedAt: now, status: 'verified' } : p));
      addIdentityLog('USER: Biometric assertion verified', 'user');
      setAuthStage('app');
    } catch (err: any) {
      const sovError = resolveWebAuthnError(err);
      addIdentityLog(`CRITICAL: Auth failure - ${sovError.message}`, 'critical');
      setActiveError(sovError);
      showToast(sovError.message, "error");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // --- Lifecycle ---

  useEffect(() => {
    if (authStage === 'zerotrust') {
      const timer = setTimeout(() => setAuthStage('passkey'), 1800);
      return () => clearTimeout(timer);
    }
  }, [authStage]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- View Handlers ---

  const startSovereignScan = async () => {
    const connected = providers.filter(p => p.status === 'connected');
    if (connected.length === 0) {
      showToast("Connect a data source first.", "info");
      return;
    }
    setIsScanning(true);
    setScanProgress(0);
    setView(AppView.SCANNER);
    addIdentityLog(`USER: Triggered deep packet audit for [${connected[0].name}]`, 'user');
    
    try {
      setScanStatusText("Tunneling via BeyondCorp L3...");
      await new Promise(r => setTimeout(r, 800));
      setScanProgress(20);
      
      setScanStatusText("Fetching Encrypted Metadata...");
      const raw = await simulateInboxFetch(connected[0].name);
      setScanProgress(50);

      setScanStatusText("Gemini 3.0 Heuristic Analysis...");
      const results = await validateLiveEmailBatch(raw);
      setScanProgress(90);

      setThreats(results.map((r: any) => ({
        id: r.id, source: r.sender, subject: r.subject, emailProviderId: connected[0].id,
        riskLevel: r.riskLevel, detectedVia: 'Sovereign Core', timestamp: 'Now', suggestedAction: r.suggestedAction
      })));
      
      setScanProgress(100);
      setScanStatusText("Audit Complete.");
      setTimeout(() => setIsScanning(false), 500);
    } catch (e) {
      setIsScanning(false);
      addIdentityLog('CRITICAL: Audit node timeout', 'critical');
    }
  };

  const handleAction = (id: string, action: 'NUKE' | 'KNOX') => {
    const threat = threats.find(t => t.id === id);
    setThreats(prev => prev.filter(t => t.id !== id));
    if (action === 'NUKE') {
      addIdentityLog(`USER: Purged record: ${threat?.subject}`, 'user');
      showToast("Identity artifact purged.", "success");
    } else {
      setVaultItems(prev => [{
        id: `v-${Date.now()}`, title: threat?.subject || 'Secured Item', origin: threat?.source || 'Scanner',
        timestamp: 'Now', type: 'thread', encryption: 'AES-256-GCM'
      }, ...prev]);
      addIdentityLog(`USER: Vaulted sensitive item: ${threat?.subject}`, 'user');
      showToast("Item hardened in Vault.", "success");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: msg, timestamp: 'Now' }]);
    setIsChatting(true);
    
    const advice = await getArchitectAdvice(msg, `Context: ${view}, KeyCount: ${apiKeys.length}`);
    setChatMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: advice || 'Buffer timeout.', timestamp: 'Now' }]);
    setIsChatting(false);
  };

  // --- Renderers ---

  if (authStage === 'zerotrust') return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-mono relative">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent"></div>
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full animate-pulse"></div>
        <i className="fas fa-shield-cat text-8xl text-orange-600 relative z-10 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]"></i>
      </div>
      <h1 className="text-3xl sovereign-gradient-text uppercase tracking-[0.4em] font-black mb-4">AGAPE SOVEREIGN</h1>
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full backdrop-blur-md">
         <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
         <span className="text-[10px] text-orange-400 font-bold tracking-[0.3em] uppercase">Booting Enclave L3</span>
      </div>
    </div>
  );

  if (authStage === 'passkey') return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-inter p-6 relative overflow-hidden">
      <div className="scan-overlay"></div>
      
      {regFlowStep === 'idle' ? (
        <div className="glass-card p-12 rounded-[4rem] border-orange-500/20 text-center max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)] group">
            <i className={`fas ${isAuthenticating ? 'fa-spinner fa-spin' : 'fa-fingerprint'} text-5xl text-orange-500 group-hover:scale-110 transition-transform duration-700`}></i>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Identity Verification</h2>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-12 leading-relaxed">
            {passkeys.length > 0 ? 'Hardware passkey required to unlock sovereign node.' : 'Establish a physical hardware binding for this device.'}
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => passkeys.length > 0 ? handlePasskeyAuth() : triggerRegistrationFlow()} 
              disabled={isAuthenticating} 
              className="w-full py-6 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-widest text-[11px] rounded-3xl transition-all shadow-[0_15px_40px_rgba(249,115,22,0.3)] disabled:opacity-50"
            >
              {isAuthenticating ? 'Validating...' : (passkeys.length > 0 ? 'Assertion Verification' : 'Initialize Passkey')}
            </button>
            
            <button 
              onClick={() => setUseSimulationMode(!useSimulationMode)} 
              className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${useSimulationMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-500 hover:text-white border border-transparent'}`}
            >
              {useSimulationMode ? 'Simulation Active (Sandboxed)' : 'Hardware Mode'}
            </button>
          </div>

          {activeError && <p className="mt-8 text-rose-500 text-[10px] font-mono uppercase bg-rose-500/10 py-4 px-6 rounded-2xl border border-rose-500/20 animate-in fade-in slide-in-from-top-2">{activeError.message}</p>}
        </div>
      ) : regFlowStep === 'importing' ? (
        <div className="max-w-md w-full relative z-10 glass-card p-12 rounded-[4rem] border-orange-500/20 animate-in fade-in slide-in-from-bottom-6">
           <ImportWizard 
             pendingPasskeyName={pendingPasskeyName}
             setPendingPasskeyName={setPendingPasskeyName}
             pendingRawId={pendingRawId}
             setPendingRawId={setPendingRawId}
             setRegFlowStep={setRegFlowStep}
             handleManualImport={handleManualImport}
           />
        </div>
      ) : (
        <div className="max-w-md w-full relative z-10 glass-card p-12 rounded-[4rem] border-orange-500/20 animate-in fade-in slide-in-from-bottom-6">
           <NamingWizard 
             regFlowStep={regFlowStep} 
             pendingPasskeyName={pendingPasskeyName} 
             setPendingPasskeyName={setPendingPasskeyName} 
             setRegFlowStep={setRegFlowStep} 
             startGuidedRegistration={startGuidedRegistration} 
           />
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden selection:bg-orange-500/30">
      <ZeroTrustBadge />
      
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-[#020617]/50 backdrop-blur-2xl flex flex-col pt-20 z-40 transition-all">
        <div className="px-8 mb-10">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-black shadow-[0_10px_20px_rgba(249,115,22,0.3)]">
                <i className="fas fa-cat text-xl"></i>
              </div>
              <div>
                <span className="text-xl font-black uppercase tracking-tighter text-white block">Sovereign</span>
                <span className="text-[9px] font-bold text-orange-500/60 uppercase tracking-widest">Enclave Node v3.0</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: AppView.SOURCES, icon: 'fa-link', label: 'Data Sources' },
            { id: AppView.SCANNER, icon: 'fa-radar', label: 'Privacy Scan' },
            { id: AppView.MY_STUFF, icon: 'fa-vault', label: 'The Vault' },
            { id: AppView.ENCLAVE, icon: 'fa-microchip', label: 'Enclave Admin' }
          ].map((item) => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === item.id ? 'bg-orange-600 text-black shadow-lg shadow-orange-900/40 translate-x-1' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <i className={`fas ${item.icon} text-lg w-6`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
           <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-xs shadow-inner">SJ</div>
              <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">sovereign_user</p>
                 <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] text-emerald-500/80 font-mono uppercase font-bold">Encrypted Session</span>
                 </div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative pt-16 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar border-l border-white/5">
          
          {view === AppView.SOURCES && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
              <header className="mb-16">
                <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Intelligence<br/>Connections</h1>
                <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] max-w-lg leading-relaxed">External data streams monitored for 2026 privacy compliance.</p>
              </header>

              <div className="grid gap-6">
                 {providers.map(p => (
                   <div key={p.id} className="glass-card p-8 rounded-[3rem] flex items-center justify-between group hover:border-orange-500/40 transition-all duration-500">
                     <div className="flex items-center gap-8">
                       <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl transition-all duration-700 ${p.status === 'connected' ? 'bg-white text-black scale-105' : 'bg-slate-800 text-slate-500'}`}>
                         <i className={`fab ${p.icon}`}></i>
                       </div>
                       <div>
                         <h3 className="font-black text-2xl text-white uppercase tracking-tighter mb-1">{p.name}</h3>
                         <div className="flex items-center gap-3">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-500'}`}>
                             {p.status}
                           </span>
                           {p.lastScan && <span className="text-[9px] font-mono text-slate-500 uppercase">Last Sync: <span className="text-orange-500">{p.lastScan}</span></span>}
                         </div>
                       </div>
                     </div>
                     <button onClick={() => toggleProvider(p.id)} className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${p.status === 'connected' ? 'bg-slate-800 border-white/10 hover:border-rose-500/40 hover:text-rose-500' : 'bg-orange-600 text-black border-transparent hover:scale-105 shadow-xl shadow-orange-900/30'}`}>
                       {p.status === 'connected' ? 'Revoke Access' : 'Link Source'}
                     </button>
                   </div>
                 ))}
              </div>

              <div className="mt-20 p-16 bg-orange-600/5 border border-dashed border-orange-500/20 rounded-[4rem] text-center relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Core Enclave Verification</h2>
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-12 max-w-sm mx-auto leading-loose">Audit your connected digital footprint against real-time 2026 data broker signatures.</p>
                 <button onClick={startSovereignScan} className="inline-flex items-center gap-4 px-14 py-6 bg-orange-600 hover:bg-orange-500 text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs transition-all shadow-[0_20px_60px_rgba(249,115,22,0.4)] group-hover:-translate-y-1">
                   <i className="fas fa-radar animate-pulse"></i>
                   Start Sovereign Scan
                 </button>
              </div>
            </div>
          )}

          {view === AppView.SCANNER && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="glass-card p-10 rounded-[3rem] border border-rose-500/20 text-center"><span className="text-[10px] font-black uppercase text-rose-500 tracking-widest block mb-4">Threats Neutralized</span><span className="text-6xl font-black text-white tracking-tighter tabular-nums">1,402</span></div>
                <div className="glass-card p-10 rounded-[3rem] border-orange-500/20 text-center"><span className="text-[10px] font-black uppercase text-orange-500 tracking-widest block mb-4">Hardened Items</span><span className="text-6xl font-black text-white tracking-tighter tabular-nums">{vaultItems.length}</span></div>
              </div>
              
              {isScanning ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-20 glass-card rounded-[4rem]">
                   <div className="w-80 h-80 relative flex items-center justify-center mb-12">
                     <div className="absolute inset-0 border-[6px] border-slate-800 rounded-full"></div>
                     <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                     <span className="text-6xl font-black text-white tracking-tighter">{scanProgress}%</span>
                   </div>
                   <p className="text-sm font-black uppercase tracking-[0.5em] text-orange-500 animate-pulse">{scanStatusText}</p>
                 </div>
              ) : threats.length > 0 ? (
                <div className="space-y-4 pb-32">
                  {threats.map(t => (
                    <div key={t.id} className="glass-card p-8 rounded-[2.5rem] flex items-center justify-between hover:border-orange-500/30 transition-all border border-white/5">
                       <div className="flex items-center gap-8">
                         <RiskIndicator level={t.riskLevel} />
                         <div>
                           <p className="text-white font-black text-lg uppercase tracking-tight mb-1">{t.source}</p>
                           <p className="text-xs text-slate-500 font-medium">{t.subject}</p>
                         </div>
                       </div>
                       <div className="flex gap-3">
                         <button onClick={() => handleAction(t.id, 'NUKE')} className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg hover:shadow-rose-900/40"><i className="fas fa-trash-alt text-xl"></i></button>
                         <button onClick={() => handleAction(t.id, 'KNOX')} className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-black transition-all shadow-lg hover:shadow-orange-900/40"><i className="fas fa-shield-cat text-xl"></i></button>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-20 border-4 border-dashed border-white/5 rounded-[4rem]">
                  <i className="fas fa-shield-check text-9xl mb-10 text-emerald-500/50"></i>
                  <p className="text-lg font-black uppercase tracking-[0.4em]">Perimeter Secured</p>
                </div>
              )}
            </div>
          )}

          {view === AppView.MY_STUFF && (
            <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
               <header className="mb-16 flex items-center justify-between">
                 <div>
                   <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">The Vault</h1>
                   <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">ECPA-Hardened sovereign storage enclave.</p>
                 </div>
                 <button className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Secure Upload</button>
               </header>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {vaultItems.map(item => (
                   <div key={item.id} className="glass-card p-10 rounded-[3.5rem] hover:border-orange-500/30 transition-all group relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className={`fas ${item.type === 'image' ? 'fa-image' : 'fa-file-shield'} text-7xl`}></i>
                     </div>
                     <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl text-slate-400 mb-8 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                       <i className={`fas ${item.type === 'image' ? 'fa-image' : 'fa-file-contract'}`}></i>
                     </div>
                     <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-2 leading-tight">{item.title}</h3>
                     <p className="text-[10px] text-slate-500 font-mono uppercase font-bold mb-8">{item.origin} • {item.timestamp}</p>
                     <div className="flex items-center justify-between border-t border-white/5 pt-6">
                        <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">AES-256-GCM Verified</span>
                        <button className="text-[9px] font-black uppercase text-orange-500 hover:text-white tracking-widest">Decrypt</button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {view === AppView.ENCLAVE && (
            <div className="max-w-7xl mx-auto h-full flex flex-col space-y-12 pb-32">
               {/* Identity Hub Section */}
               <section className="glass-card p-12 rounded-[4rem] border-orange-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                    <i className="fas fa-fingerprint text-[20rem] text-orange-500 -rotate-12 translate-x-20"></i>
                  </div>
                  
                  <header className="flex items-center justify-between mb-16 relative z-10">
                    <div className="flex items-center gap-8">
                       <div className="w-20 h-20 bg-orange-600/10 rounded-[2rem] flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-2xl shadow-orange-900/10">
                          <i className="fas fa-fingerprint text-4xl"></i>
                       </div>
                       <div>
                          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Identity Hub 2026</h2>
                          <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em] opacity-60">FIDO2 / WEBAUTHN HARDWARE SECURITY</p>
                       </div>
                    </div>
                    <div className={`px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${passkeys.length > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                       <div className={`w-2 h-2 rounded-full ${passkeys.length > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_emerald]' : 'bg-rose-500'}`}></div>
                       {passkeys.length > 0 ? `${passkeys.length} Hardware Binding${passkeys.length > 1 ? 's' : ''}` : 'Unlinked Node'}
                    </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                    <div className="lg:col-span-7">
                       {regFlowStep === 'idle' && passkeys.length > 0 ? (
                          <div className="space-y-8 animate-in fade-in zoom-in duration-700">
                             <div className="flex items-center justify-between px-2">
                               <h5 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Active Credentials</h5>
                               <div className="flex gap-4">
                                 <button onClick={triggerImportFlow} className="text-[9px] font-black uppercase text-slate-500 hover:text-white tracking-widest transition-all">Import Node</button>
                                 <button onClick={triggerRegistrationFlow} className="text-[9px] font-black uppercase text-orange-500 hover:text-white tracking-widest transition-all">Add Backup Key</button>
                               </div>
                             </div>
                             
                             <div className="bg-black/40 border border-white/5 rounded-[3rem] p-4 space-y-4">
                                {passkeys.map((p, idx) => (
                                  <React.Fragment key={p.id}>
                                     {idx > 0 && <div className="mx-8 h-px bg-white/5 shadow-[0_1px_0_rgba(255,255,255,0.02)]" />}
                                     <div className="group/card relative">
                                        <div className="p-8 relative overflow-hidden transition-all hover:bg-white/[0.02] rounded-[2.2rem]">
                                           <div className="flex justify-between items-start relative z-10">
                                              <div className="space-y-1">
                                                 <div className="flex items-center gap-3 mb-2">
                                                   <div className={`w-2 h-2 rounded-full ${p.status === 'verified' ? 'bg-emerald-500 shadow-[0_0_5px_emerald]' : 'bg-orange-500'}`}></div>
                                                   <span className="text-[10px] font-black text-white uppercase tracking-widest">{p.label}</span>
                                                 </div>
                                                 <h4 className="text-xl font-black text-orange-500/80 tracking-tighter uppercase">{p.algorithm}</h4>
                                              </div>
                                              <div className="flex gap-2">
                                                 <button onClick={() => handleRevokePasskey(p.id)} className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center group/btn shadow-lg">
                                                    <i className="fas fa-trash-can text-[11px] group-hover/btn:scale-110"></i>
                                                 </button>
                                              </div>
                                           </div>
                                           
                                           <div className="mt-8 mb-6">
                                              <div className="flex items-center gap-4 bg-[#020617] p-5 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-colors">
                                                 <code className="text-[10px] font-mono text-orange-500/80 flex-1 truncate tracking-widest font-bold">
                                                    {p.rawId.substring(0, 16)}••••{p.rawId.slice(-16)}
                                                 </code>
                                                 <button onClick={() => copyToClipboard(p.id, p.rawId)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 transition-all flex items-center justify-center shadow-inner">
                                                    <i className={`fas ${copiedId === p.id ? 'fa-check text-emerald-500' : 'fa-copy'} text-xs`}></i>
                                                 </button>
                                              </div>
                                           </div>

                                           <div className="flex justify-between items-center pt-4">
                                              <div className="flex gap-4">
                                                 <span className="text-[8px] font-black text-emerald-500/60 uppercase border border-emerald-500/20 px-3 py-1 rounded-full bg-emerald-500/5">L3 Hardware</span>
                                                 <span className="text-[8px] font-black text-blue-500/60 uppercase border border-blue-500/20 px-3 py-1 rounded-full bg-blue-500/5">{p.algorithm.includes('Imported') ? 'Manual Import' : 'Platform Auth'}</span>
                                              </div>
                                              <div className="text-right">
                                                 <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1">Status Archive</p>
                                                 <span className="text-[10px] font-mono text-slate-400 font-medium">{p.lastUsedAt || 'Pending Interaction'}</span>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  </React.Fragment>
                                ))}
                             </div>
                          </div>
                       ) : (
                          <div className="h-full min-h-[400px] border-2 border-dashed border-orange-500/20 rounded-[4rem] bg-orange-500/5 flex flex-col items-center justify-center p-12 text-center transition-all duration-700 overflow-hidden relative">
                             {regFlowStep === 'idle' && (
                                <div className="animate-in fade-in zoom-in duration-500">
                                   <div className="w-24 h-24 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-500 border border-orange-500/20 mb-10 shadow-inner">
                                      <i className="fas fa-link-slash text-4xl"></i>
                                   </div>
                                   <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">Unbonded Node</h4>
                                   <p className="text-slate-400 text-xs font-medium uppercase tracking-widest max-w-sm mx-auto leading-relaxed mb-12">Secure your digital sovereign enclave by binding a physical hardware passkey via FIDO2/L3 protocols.</p>
                                   <div className="flex gap-4">
                                      <button onClick={triggerImportFlow} className="px-10 py-6 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white font-black uppercase tracking-widest text-[11px] rounded-[2rem] transition-all">Import Existing Node</button>
                                      <button onClick={triggerRegistrationFlow} className="px-14 py-6 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-widest text-[11px] rounded-[2rem] transition-all shadow-2xl shadow-orange-900/50">Establish Hardware Binding</button>
                                   </div>
                                </div>
                             )}

                             {regFlowStep === 'naming' && (
                                <NamingWizard 
                                  regFlowStep={regFlowStep} 
                                  pendingPasskeyName={pendingPasskeyName} 
                                  setPendingPasskeyName={setPendingPasskeyName} 
                                  setRegFlowStep={setRegFlowStep} 
                                  startGuidedRegistration={startGuidedRegistration} 
                                />
                             )}

                             {regFlowStep === 'importing' && (
                                <ImportWizard 
                                  pendingPasskeyName={pendingPasskeyName}
                                  setPendingPasskeyName={setPendingPasskeyName}
                                  pendingRawId={pendingRawId}
                                  setPendingRawId={setPendingRawId}
                                  setRegFlowStep={setRegFlowStep}
                                  handleManualImport={handleManualImport}
                                />
                             )}

                             {regFlowStep === 'preparing' && (
                                <div className="flex flex-col items-center">
                                   <div className="w-20 h-20 border-[6px] border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-10"></div>
                                   <h4 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Core Preparation</h4>
                                   <p className="text-orange-500/60 text-[10px] font-mono uppercase tracking-[0.4em]">Entropy Collection & Challenge Generation...</p>
                                </div>
                             )}

                             {regFlowStep === 'prompting' && (
                                <div className="flex flex-col items-center animate-pulse">
                                   <div className="w-32 h-32 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 border border-orange-500/30 mb-10 shadow-3xl">
                                      <i className="fas fa-fingerprint text-6xl"></i>
                                   </div>
                                   <h4 className="text-3xl font-black text-white uppercase tracking-widest mb-6">Interaction Required</h4>
                                   <p className="text-slate-400 text-xs font-medium uppercase tracking-widest max-w-xs leading-relaxed">Respond to the platform authenticator prompt to complete the handshake.</p>
                                </div>
                             )}

                             {regFlowStep === 'verifying' && (
                                <div className="flex flex-col items-center">
                                   <div className="flex gap-3 mb-12">
                                      {[1,2,3].map(i => <div key={i} className="w-4 h-4 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}}></div>)}
                                   </div>
                                   <h4 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Attestation Verification</h4>
                                   <p className="text-orange-500/60 text-[10px] font-mono uppercase tracking-[0.4em]">Hardening Identity Artifacts...</p>
                                </div>
                             )}

                             {regFlowStep === 'error' && activeError && (
                                <div className="animate-in zoom-in duration-500 w-full max-w-md p-8">
                                   <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/20 mb-8 mx-auto shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                                      <i className="fas fa-triangle-exclamation text-3xl"></i>
                                   </div>
                                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 text-center">{activeError.title}</h4>
                                   <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 mb-8 text-center">
                                      <p className="text-rose-400 text-xs font-bold uppercase tracking-widest leading-relaxed mb-6">
                                         {activeError.message}
                                      </p>
                                      <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-2xl flex items-center gap-4 text-left">
                                         <i className="fas fa-lightbulb text-rose-300"></i>
                                         <div>
                                            <p className="text-[8px] font-black text-rose-300/60 uppercase tracking-widest">Resolution Tip</p>
                                            <p className="text-[10px] font-medium text-rose-300">{activeError.tip}</p>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="space-y-4">
                                      <div className="flex gap-4">
                                         <button onClick={() => setRegFlowStep('idle')} className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Abort</button>
                                         <button 
                                            onClick={() => setRegFlowStep('naming')} 
                                            className="flex-1 py-4 px-10 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                                         >
                                            Retry Protocol
                                         </button>
                                      </div>
                                      <button 
                                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                                        className="w-full text-[8px] font-mono text-slate-700 uppercase hover:text-slate-500 transition-colors"
                                      >
                                        {showTechnicalDetails ? 'Hide' : 'Show'} Technical Metadata
                                      </button>
                                      {showTechnicalDetails && (
                                         <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-left animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[8px] font-mono text-slate-500 uppercase">EXCEPTION: {activeError.rawName}</p>
                                            <p className="text-[8px] font-mono text-slate-500 uppercase mt-1">CONTEXT: Sovereign_Node_L3_Handshake</p>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             )}

                             {regFlowStep === 'success' && regDetails && (
                                <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
                                   <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/30 mb-8 shadow-inner">
                                      <i className="fas fa-check-double text-3xl"></i>
                                   </div>
                                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Bonding Manifest</h4>
                                   <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Hardware Handshake Complete</p>
                                   
                                   <div className="w-full glass-card p-6 rounded-[2rem] border-white/5 bg-black/40 text-left space-y-6 mb-10">
                                      <div className="flex justify-between items-center mb-2">
                                         <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{regDetails.label}</h5>
                                         <span className="text-[8px] font-mono text-slate-500">ID: {regDetails.id}</span>
                                      </div>
                                      <div>
                                         <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Public Credential ID</p>
                                         <div className="flex items-center gap-4 bg-[#020617] p-4 rounded-xl border border-white/5">
                                            <code className="text-[10px] font-mono text-orange-500 flex-1 truncate">{regDetails.rawId}</code>
                                            <button 
                                              onClick={() => copyToClipboard('cred_id', regDetails.rawId)}
                                              className="w-8 h-8 rounded-lg hover:bg-white/5 text-slate-500 transition-colors shrink-0"
                                            >
                                               <i className={`fas ${copiedId === 'cred_id' ? 'fa-check text-emerald-500' : 'fa-copy'} text-xs`}></i>
                                            </button>
                                         </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                         <div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Credential Type</p>
                                            <p className="text-[10px] font-mono text-white">{regDetails.type}</p>
                                         </div>
                                         <div>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Alg Signature</p>
                                            <p className="text-[10px] font-mono text-white">{regDetails.algorithm}</p>
                                         </div>
                                      </div>
                                      <div className="pt-4 border-t border-white/5">
                                         <p className="text-[9px] font-medium text-slate-400 italic text-center">Identity [#{regDetails.id}] is now rooted in hardware. Bonding verified.</p>
                                      </div>
                                   </div>

                                   <button 
                                      onClick={() => {
                                        setRegFlowStep('idle');
                                        setRegDetails(null);
                                      }} 
                                      className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                                   >
                                      Commit to Enclave
                                   </button>
                                </div>
                             )}
                          </div>
                       )}
                    </div>

                    <div className="lg:col-span-5 flex flex-col justify-between">
                       <div className="space-y-8">
                          <div className="p-8 bg-black/40 border border-white/5 rounded-[3rem] space-y-6">
                             <h5 className="text-[10px] font-black text-white uppercase tracking-[0.4em] border-b border-white/5 pb-6">Identity Operations</h5>
                             <div className="space-y-4">
                                {[
                                   { key: 'naming', label: 'Biometric Registration', icon: 'fa-fingerprint', active: regFlowStep === 'naming' || regFlowStep === 'preparing' || regFlowStep === 'prompting' || regFlowStep === 'verifying' },
                                   { key: 'importing', label: 'Manual Node Migration', icon: 'fa-file-import', active: regFlowStep === 'importing' },
                                   { key: 'idle', label: 'Kernel Authority Audit', icon: 'fa-microchip', active: regFlowStep === 'idle' },
                                   { key: 'success', label: 'Cryptographic Commit', icon: 'fa-circle-check', active: regFlowStep === 'success' }
                                ].map((step) => (
                                   <div key={step.key} className={`flex items-center gap-6 transition-all duration-500 ${step.active ? 'opacity-100 translate-x-3' : 'opacity-20'}`}>
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs border ${step.active ? 'bg-orange-600 border-orange-400 text-black shadow-[0_0_20px_orange]' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                                         <i className={`fas ${step.icon}`}></i>
                                      </div>
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-white' : 'text-slate-600'}`}>
                                         {step.label}
                                      </span>
                                   </div>
                                ))}
                             </div>
                          </div>

                          {passkeys.length > 0 && (
                             <div className="space-y-4">
                                <button onClick={handlePasskeyAuth} className="w-full py-6 bg-white/5 border border-white/10 hover:border-orange-500/40 text-slate-300 hover:text-white font-black uppercase tracking-widest text-[10px] rounded-[2rem] transition-all flex items-center justify-center gap-5 group">
                                   <i className="fas fa-shield-check text-orange-500 group-hover:scale-125 transition-transform"></i>
                                   Assertion Handshake
                                </button>
                                <button onClick={resetIdentity} className="w-full py-6 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-500 font-black uppercase tracking-widest text-[10px] rounded-[2rem] transition-all flex items-center justify-center gap-5 group">
                                   <i className="fas fa-skull-crossbones"></i>
                                   Wipe Identity Bindings
                                </button>
                             </div>
                          )}
                       </div>
                       
                       <div className="mt-12 p-6 bg-black/60 rounded-[2rem] border border-white/5">
                          <p className="text-[9px] font-mono text-slate-700 uppercase leading-relaxed font-bold">
                             COMPLIANCE: FIDO2 L3 / WEBAUTHN 2026 <br/>
                             ENVIRONMENT: {window.isSecureContext ? 'ENCLAVE_SECURE' : 'ENCLAVE_EMULATED'} <br/>
                             KERNEL: AGAPE_SOVEREIGN_CORE_022626
                          </p>
                       </div>
                    </div>
                  </div>
               </section>

               {/* API Key Management Section */}
               <section className="glass-card p-12 rounded-[4rem] border-white/5 relative overflow-hidden group">
                  <header className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Sovereign Access Nodes</h2>
                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em] opacity-60">Provision & Revoke API Infrastructure</p>
                     </div>
                     <button 
                        onClick={() => setShowKeyForm(!showKeyForm)} 
                        className={`px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 ${showKeyForm ? 'bg-slate-800 text-white' : 'bg-orange-600 text-black shadow-lg shadow-orange-900/40 hover:scale-105'}`}
                     >
                        <i className={`fas ${showKeyForm ? 'fa-times' : 'fa-plus'}`}></i>
                        {showKeyForm ? 'Abort' : 'Provision New Node'}
                     </button>
                  </header>

                  {showKeyForm && (
                     <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
                        <form onSubmit={handleGenerateKey} className="glass-card p-8 rounded-[3rem] border-orange-500/30 bg-orange-500/5 max-w-2xl">
                           <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6">New Node Specification</h3>
                           <div className="space-y-6">
                              <div>
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Node Label / Identifier</label>
                                 <input 
                                    required
                                    type="text" 
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g. BeyondCorp Edge Alpha"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-orange-500/40 transition-all"
                                 />
                              </div>
                              <div className="flex gap-4">
                                 <button type="submit" className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">
                                    Commit Provisioning
                                 </button>
                              </div>
                           </div>
                        </form>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {apiKeys.map(k => (
                        <div key={k.id} className={`glass-card p-8 rounded-[3.5rem] border border-white/5 group/node hover:border-orange-500/20 transition-all ${k.status === 'expired' ? 'opacity-50 grayscale' : ''}`}>
                           <div className="flex justify-between items-start mb-8">
                              <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${k.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                                    <i className="fas fa-key"></i>
                                 </div>
                                 <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1">{k.name}</h4>
                                    <span className="text-[9px] font-mono text-slate-500 uppercase">Created: {k.createdAt}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button 
                                    onClick={() => handleRevokeKey(k.id)} 
                                    className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                    title="Revoke Node Access"
                                 >
                                    <i className="fas fa-trash-alt text-xs"></i>
                                 </button>
                              </div>
                           </div>

                           <div className="bg-[#020617] p-5 rounded-[2rem] border border-white/5 flex items-center gap-4 group-hover/node:border-white/10 transition-colors">
                              <code className="text-xs font-mono text-orange-500/80 flex-1 truncate tracking-wider">
                                 {k.isVisible ? k.key : '••••••••••••••••••••••••'}
                              </code>
                              <div className="flex items-center gap-2">
                                 <button 
                                    onClick={() => toggleKeyVisibility(k.id)} 
                                    className="w-8 h-8 rounded-lg hover:bg-white/5 text-slate-500 transition-colors"
                                 >
                                    <i className={`fas ${k.isVisible ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                 </button>
                                 <button 
                                    onClick={() => copyToClipboard(k.id, k.key)} 
                                    className="w-8 h-8 rounded-lg hover:bg-white/5 text-slate-500 transition-colors"
                                 >
                                    <i className={`fas ${copiedId === k.id ? 'fa-check text-emerald-500' : 'fa-copy'} text-xs`}></i>
                                 </button>
                              </div>
                           </div>
                           
                           <div className="mt-6 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Node Healthy</span>
                              </div>
                              <span className="text-[8px] font-mono text-slate-700 uppercase">Expires: {k.expiresAt}</span>
                           </div>
                        </div>
                     ))}
                     {apiKeys.length === 0 && (
                        <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center opacity-30">
                           <i className="fas fa-key-skeleton text-6xl mb-6"></i>
                           <p className="text-sm font-black uppercase tracking-[0.3em]">No Access Nodes Provisioned</p>
                        </div>
                     )}
                  </div>
               </section>

               {/* System Logs & Audit Trail */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="glass-card p-12 rounded-[4rem] border border-white/5 flex flex-col h-[500px]">
                     <header className="mb-10 flex justify-between items-center">
                        <div>
                           <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Sovereign Audit</h4>
                           <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Enclave Kernel Operations</p>
                        </div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_emerald]"></div>
                     </header>
                     <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-4">
                        {identityLogs.map(log => (
                           <div key={log.id} className="flex gap-6 p-5 rounded-[2rem] bg-black/20 border border-white/5 items-start hover:bg-black/40 transition-colors">
                              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${log.type === 'user' ? 'bg-orange-500 shadow-[0_0_8px_orange]' : log.type === 'system' ? 'bg-blue-500' : 'bg-rose-500 animate-pulse shadow-[0_0_10px_rose]'}`}></div>
                              <div className="flex-1">
                                 <p className="text-[10px] font-mono text-slate-300 leading-relaxed font-bold">{log.event}</p>
                                 <span className="text-[8px] text-slate-700 font-mono mt-2 block uppercase tracking-widest">{log.timestamp}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="glass-card p-12 rounded-[4rem] border border-white/5 bg-orange-600/5 flex flex-col justify-center items-center text-center">
                     <div className="w-24 h-24 rounded-full bg-orange-600/10 flex items-center justify-center border border-orange-500/20 mb-8">
                        <i className="fas fa-shield-halved text-4xl text-orange-500"></i>
                     </div>
                     <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Hardening Active</h4>
                     <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em] max-w-sm mx-auto leading-relaxed mb-10">
                        The enclave kernel is monitoring all 2026 threats in real-time. Unauthorized nodes are automatically purged.
                     </p>
                     <div className="flex gap-4">
                        <div className="px-6 py-3 bg-black/40 border border-white/5 rounded-2xl text-[9px] font-black uppercase text-slate-400 tracking-widest">L3 Encryption Enforced</div>
                        <div className="px-6 py-3 bg-black/40 border border-white/5 rounded-2xl text-[9px] font-black uppercase text-slate-400 tracking-widest">Zero Trust Verified</div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Architect Chat (Floating) */}
        <div className={`fixed bottom-12 right-12 w-96 glass-card rounded-[3rem] border-orange-500/20 shadow-4xl flex flex-col transition-all duration-700 z-[100] ${isChatting ? 'scale-105 shadow-orange-900/40' : ''}`}>
           <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20 rounded-t-[3rem]">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20"><i className="fas fa-microchip"></i></div>
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">Sovereign Architect</span>
              </div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_emerald]"></div>
           </div>
           <div className="h-96 overflow-y-auto p-6 custom-scrollbar space-y-6">
              {chatMessages.map(m => (
                 <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-[2rem] text-xs leading-relaxed ${m.role === 'user' ? 'bg-orange-600 text-black font-black' : 'bg-slate-800 text-slate-200 shadow-xl'}`}>
                       {m.content}
                    </div>
                 </div>
              ))}
              {isChatting && (
                 <div className="flex items-center gap-3 px-4">
                    <div className="flex gap-1">
                       <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                       <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                    <span className="text-[9px] font-mono text-orange-500/60 uppercase font-black tracking-widest">Analyzing Sovereign Topology...</span>
                 </div>
              )}
           </div>
           <div className="p-6 bg-black/40 rounded-b-[3rem] border-t border-white/5">
              <div className="relative">
                 <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Inquire architect about enclave hardening..."
                    className="w-full bg-[#020617] border border-white/10 rounded-2xl py-4 px-6 pr-14 text-xs focus:outline-none focus:border-orange-500/40 transition-all text-white placeholder:text-slate-600 font-medium"
                 />
                 <button 
                    onClick={handleSendMessage} 
                    className="absolute right-2 top-2 bottom-2 w-10 bg-orange-600 hover:bg-orange-500 text-black rounded-xl transition-all shadow-lg active:scale-95"
                 >
                    <i className="fas fa-arrow-up text-xs font-black"></i>
                 </button>
              </div>
           </div>
        </div>
      </main>

      {/* Persistent Global Toast */}
      {toast && (
        <div className="fixed bottom-10 left-12 z-[2000] animate-in slide-in-from-left-10 duration-500 w-[400px]">
           <div className={`px-8 py-5 rounded-[2.5rem] border flex items-center gap-5 shadow-4xl backdrop-blur-2xl ${
             toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' :
             toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-400' :
             'bg-slate-900/90 border-orange-500/30 text-orange-400'
           }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500/20' : toast.type === 'error' ? 'bg-rose-500/20' : 'bg-orange-500/20'
              }`}>
                 <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-triangle-exclamation' : 'fa-info-circle'} text-xl`}></i>
              </div>
              <div className="flex-1">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-tight block">{toast.message}</span>
              </div>
              <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components for cleaned up flow ---

const NamingWizard: React.FC<{
  pendingPasskeyName: string;
  setPendingPasskeyName: (v: string) => void;
  setRegFlowStep: (s: any) => void;
  startGuidedRegistration: () => void;
  regFlowStep: string;
}> = ({ pendingPasskeyName, setPendingPasskeyName, setRegFlowStep, startGuidedRegistration }) => (
  <div className="animate-in slide-in-from-bottom-6 duration-500 w-full">
     <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-500 border border-orange-500/20 mb-8 mx-auto">
        <i className="fas fa-id-card-clip text-3xl"></i>
     </div>
     <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 text-center">Provisioning Alias</h4>
     <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10 text-center leading-relaxed">Assign a descriptive identifier to this physical hardware binding</p>
     
     <div className="space-y-6">
        <div className="relative">
           <input 
              type="text" 
              autoFocus
              value={pendingPasskeyName}
              onChange={(e) => setPendingPasskeyName(e.target.value)}
              placeholder="e.g. Pixel 9 Secure Element"
              onKeyDown={(e) => e.key === 'Enter' && pendingPasskeyName.trim() && startGuidedRegistration()}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-orange-500/40 transition-all font-bold placeholder:font-normal placeholder:opacity-30"
           />
           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-30">
              <i className="fas fa-shield-halved text-xs"></i>
              <span className="text-[8px] font-mono font-bold">L3_CTX</span>
           </div>
        </div>
        
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[9px] font-mono text-emerald-500/80 uppercase font-bold tracking-wider">Protocol Ready: FIDO2_WEBAUTHN_2026</span>
        </div>

        <div className="flex gap-4">
           <button onClick={() => setRegFlowStep('idle')} className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Abort</button>
           <button 
              onClick={() => startGuidedRegistration()} 
              disabled={!pendingPasskeyName.trim()}
              className="flex-[2] py-4 px-10 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-orange-900/30"
           >
              Initiate Handshake
           </button>
        </div>
     </div>
  </div>
);

const ImportWizard: React.FC<{
  pendingPasskeyName: string;
  setPendingPasskeyName: (v: string) => void;
  pendingRawId: string;
  setPendingRawId: (v: string) => void;
  setRegFlowStep: (s: any) => void;
  handleManualImport: (e: React.FormEvent) => void;
}> = ({ pendingPasskeyName, setPendingPasskeyName, pendingRawId, setPendingRawId, setRegFlowStep, handleManualImport }) => (
  <div className="animate-in slide-in-from-bottom-6 duration-500 w-full">
     <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-white/5 mb-8 mx-auto shadow-inner">
        <i className="fas fa-file-import text-3xl"></i>
     </div>
     <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 text-center">Node Migration</h4>
     <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] mb-10 text-center leading-relaxed">Sovereign Identifier Import Protocol</p>
     
     <form onSubmit={handleManualImport} className="space-y-6">
        <div>
           <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-2 px-1">Node Identifier Label</label>
           <input 
              required
              type="text" 
              autoFocus
              value={pendingPasskeyName}
              onChange={(e) => setPendingPasskeyName(e.target.value)}
              placeholder="e.g. Titan M2 Backup Root"
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-orange-500/40 transition-all font-bold placeholder:font-normal placeholder:opacity-30"
           />
        </div>

        <div>
           <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-2 px-1">Raw Credential Payload (Base64)</label>
           <textarea 
              required
              rows={3}
              value={pendingRawId}
              onChange={(e) => setPendingRawId(e.target.value)}
              placeholder="PASTE_ENCLAVE_BLOB_HERE..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs text-orange-500/80 focus:outline-none focus:border-orange-500/40 transition-all font-mono placeholder:font-normal placeholder:opacity-20 resize-none"
           />
        </div>
        
        <div className="flex gap-4 pt-4">
           <button type="button" onClick={() => setRegFlowStep('idle')} className="flex-1 py-4 rounded-2xl border border-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Abort</button>
           <button 
              type="submit"
              disabled={!pendingPasskeyName.trim() || !pendingRawId.trim()}
              className="flex-[2] py-4 px-10 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-orange-900/30"
           >
              Import Identity Artifact
           </button>
        </div>
     </form>
  </div>
);

export default App;
