
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, RiskLevel, ComplianceItem, EmailArtifact, LinkedAccount, HardwareNode } from './types';
import { simulateInboxFetch } from './services/geminiService';

const App: React.FC = () => {
  // --- Core State ---
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Enclave Security State ---
  const [isSecurityScanning, setIsSecurityScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ComplianceItem[]>([
    { id: '1', label: 'Hardware L3 Binding', status: 'pending', description: 'WebAuthn registration status on Secure Node.' },
    { id: '2', label: 'GCP IAP Tunnel', status: 'pending', description: 'Zero Trust Identity-Aware Proxy reachability.' },
    { id: '3', label: 'DLP Sensitive Audit', status: 'pending', description: 'Automated scan for PII leaks in system logs.' },
    { id: '4', label: 'Post-Quantum Sync', status: 'pending', description: 'CRYSTALS-Kyber key exchange health.' }
  ]);

  // --- Identity & Social State (2026 Feature) ---
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([
    { id: '1', platform: 'Google', handle: 'architect@sovereign.node', status: 'synced', lastSync: '2m ago' },
    { id: '2', platform: 'X', handle: '@agape_sovereign', status: 'synced', lastSync: '1h ago' },
    { id: '3', platform: 'GitHub', handle: 'agape-core', status: 'pending', lastSync: 'Never' }
  ]);

  const [hardwareNodes] = useState<HardwareNode[]>([
    { id: 'h1', model: 'Pixel 10a', os: 'Android 17', status: 'authenticated', lastHandshake: 'Now' },
    { id: 'h2', model: 'iPhone Air 2', os: 'iOS 20', status: 'attested', lastHandshake: '10m ago' },
    { id: 'h3', model: 'ThinkPad 2026', os: 'Windows 12 AI', status: 'standby', lastHandshake: 'Yesterday' }
  ]);

  const [isPqcEnabled, setIsPqcEnabled] = useState(true);
  const [pqcAlgorithm, setPqcAlgorithm] = useState('CRYSTALS-Kyber');

  // --- Data Reclamation State ---
  const [inboxStack, setInboxStack] = useState<EmailArtifact[]>([]);
  const [history, setHistory] = useState<{ id: string, action: 'KNOX' | 'NUKE', data: EmailArtifact }[]>([]);

  // --- Architect State ---
  const [executingCell, setExecutingCell] = useState<string | null>(null);
  const [cellOutputs, setCellOutputs] = useState<Record<string, string>>({});
  const [webAuthnDebugOutput, setWebAuthnDebugOutput] = useState<{ name: string; message: string; advice: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resolveWebAuthnError = useCallback((error: any) => {
    const errorName = error?.name || 'UnknownError';
    let message = "A cryptographic handshake failure occurred.";
    let advice = "Check system logs for L3 attestation details.";

    switch (errorName) {
      case 'NotAllowedError':
        message = "Handshake Declined. The request was refused by the hardware node.";
        advice = "Ensure your device (Pixel 10a / iPhone Air) is unlocked and biometric sensors are active.";
        break;
      case 'TimeoutError':
        message = "Authentication Timed Out. The Sovereign tunnel closed prematurely.";
        advice = "Provide biometrics within 30 seconds of triggering the scan. Keep the screen active.";
        break;
      case 'InvalidStateError':
        message = "Identity Conflict Detected. Node state is invalid for this request.";
        advice = "Credential likely exists. Reset node state in Browser Settings > Security Keys.";
        break;
      default:
        message = `Unexpected Cryptographic Error: ${errorName}`;
        advice = "Consult the Agape Sovereign Architect via the notebook.";
    }
    return { name: errorName, message, advice };
  }, []);

  const triggerSecurityScan = async () => {
    setIsSecurityScanning(true);
    setScanProgress(0);
    setScanResults(prev => prev.map(item => ({ ...item, status: 'pending' })));
    for (let i = 1; i <= 4; i++) {
      for (let p = 0; p < 25; p++) {
        setScanProgress(prev => prev + 1);
        await new Promise(r => setTimeout(r, 15));
      }
      setScanResults(prev => {
        const next = [...prev];
        next[i - 1].status = 'passed';
        return next;
      });
    }
    setIsSecurityScanning(false);
    showToast("Node Integrity Attested", "success");
  };

  const handleSwipe = (action: 'KNOX' | 'NUKE') => {
    if (inboxStack.length === 0) return;
    const item = inboxStack[0];
    setHistory([{ id: Date.now().toString(), action, data: item }, ...history]);
    setInboxStack(prev => prev.slice(1));
    showToast(action === 'KNOX' ? "Vaulted to Knox" : "Artifact Nuked", action === 'KNOX' ? 'info' : 'error');
  };

  const loadNextBatch = async () => {
    setInboxStack([]);
    await new Promise(r => setTimeout(r, 400));
    const raw = await simulateInboxFetch("Google Workspace");
    setInboxStack(JSON.parse(raw));
  };

  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans select-none relative">
      <div className="neon-atmosphere"></div>
      
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-white/5 bg-black/50 backdrop-blur-3xl flex flex-col z-50">
        <div className="p-12 flex items-center gap-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-white/10">
            <i className="fas fa-shield-cat text-white text-sm"></i>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Agape Enclave</h2>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5">v2026.5 Sovereign</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-3 mt-6">
          {[
            { id: AppView.DASHBOARD, icon: 'fa-layer-group', label: 'Overseer Core' },
            { id: AppView.SOURCES, icon: 'fa-fingerprint', label: 'Identity Vault' },
            { id: AppView.ARCHITECT, icon: 'fa-terminal', label: 'Architect' },
            { id: AppView.ENCLAVE, icon: 'fa-screwdriver-wrench', label: 'Admin Hub' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id)} 
              className={`w-full flex items-center gap-5 px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <i className={`fas ${item.icon} text-base w-6`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-white/5 bg-black/20">
           <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-loose">GCP Zone: us-central1<br/>Root: Pixel 10a L3</p>
           </div>
        </div>
      </aside>

      {/* MAIN CORE */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <header className="px-16 py-10 flex justify-between items-center z-40">
           <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/40 bg-blue-500/5 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.2)] diamond-glow">
                <i className="fab fa-google text-3xl text-blue-500"></i>
              </div>
              <div>
                <h1 className="text-4xl font-black sovereign-gradient-text uppercase tracking-tighter">Google Sovereign</h1>
                <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] mt-2">The Digital Overseer #2026</p>
              </div>
           </div>

           <div className="flex items-center gap-8 bg-black/40 border border-white/10 p-5 rounded-[2.5rem] backdrop-blur-3xl">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden shadow-inner">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aaron" alt="Architect" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Agape Love Active</p>
                <p className="text-[9px] text-emerald-500 font-black uppercase mt-1 tracking-widest animate-pulse">Status: ONLINE</p>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-16 pb-32">
          
          {view === AppView.DASHBOARD && (
            <div className="max-w-[1400px] mx-auto space-y-16 animate-in fade-in duration-1000">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="glass-card p-12 rounded-[4rem] flex flex-col items-center text-center">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-12">Identity Health</h3>
                    <div className="relative w-56 h-56 mb-12">
                       <i className="fas fa-fingerprint absolute inset-0 flex items-center justify-center text-5xl text-blue-500"></i>
                       <div className="w-full h-full border-2 border-dashed border-blue-500/20 rounded-full animate-spin-slow"></div>
                    </div>
                    <button onClick={() => setView(AppView.SOURCES)} className="w-full py-5 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase shadow-2xl">Vault New Account</button>
                  </div>

                  <div className="glass-card p-12 rounded-[4rem] border-emerald-500/20 flex flex-col items-center text-center">
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-12">Legal Status</h3>
                    <div className="w-24 h-24 mb-10 flex items-center justify-center bg-emerald-500/10 rounded-full border border-emerald-500/20">
                       <i className="fas fa-gavel text-5xl text-emerald-500"></i>
                    </div>
                    <p className="text-[11px] text-white font-black uppercase mb-4">ECRA 2026 Verified</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase">Pruning Active: 1,247 Requests</p>
                  </div>

                  <div className="glass-card p-12 rounded-[4rem] border-orange-500/20 flex flex-col">
                    <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest text-center mb-12">Hardware Nodes</h3>
                    <div className="space-y-6">
                       {hardwareNodes.map(node => (
                         <div key={node.id} className="flex justify-between items-center text-[10px] font-black uppercase">
                            <span className="text-slate-500">{node.model}</span>
                            <span className={node.status === 'authenticated' ? 'text-emerald-500' : 'text-blue-500'}>{node.status}</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {view === AppView.SOURCES && (
             <div className="max-w-[1400px] mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                <header className="flex justify-between items-end">
                   <div>
                     <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">Identity Vault</h1>
                     <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em]">Linking Social & Email Artifacts to L3 Root</p>
                   </div>
                   <button onClick={loadNextBatch} className="px-10 py-5 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Trigger Global Sync</button>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <section className="glass-card p-12 rounded-[4rem] border-white/10">
                      <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-10">Synced Environments</h3>
                      <div className="space-y-6">
                         {linkedAccounts.map(acc => (
                           <div key={acc.id} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] flex items-center justify-between group">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl text-white">
                                    <i className={`fab fa-${acc.platform.toLowerCase()}`}></i>
                                 </div>
                                 <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{acc.platform}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{acc.handle}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className={`text-[8px] font-black px-4 py-1.5 rounded-lg border ${acc.status === 'synced' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
                                    {acc.status.toUpperCase()}
                                 </span>
                                 <p className="text-[8px] text-slate-600 font-black mt-2">LAST SYNC: {acc.lastSync}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </section>

                   <section className="flex flex-col gap-10">
                      <div className="p-16 bg-blue-600/5 border border-blue-500/20 rounded-[4rem] relative overflow-hidden flex flex-col items-center justify-center text-center">
                         <div className="scan-overlay rounded-[4rem]"></div>
                         <i className="fas fa-link text-6xl text-blue-500 mb-8"></i>
                         <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Add New Identity Layer</h3>
                         <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-10">All metadata is encrypted via CRYSTALS-Kyber 1024</p>
                         <div className="flex gap-4">
                            <button className="px-8 py-4 bg-white text-black text-[10px] font-black uppercase rounded-2xl">Connect Social</button>
                            <button className="px-8 py-4 border border-white/10 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-white/5">Connect Email</button>
                         </div>
                      </div>
                   </section>
                </div>
             </div>
          )}

          {view === AppView.ENCLAVE && (
             <div className="max-w-[1400px] mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-6xl font-black text-white uppercase tracking-tighter mb-4">Enclave Admin</h1>
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em]">L3 Handshake Verification & PQC Control</p>
                  </div>
                  <button onClick={triggerSecurityScan} disabled={isSecurityScanning} className="px-12 py-5 bg-blue-600 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-2xl">
                    {isSecurityScanning ? 'Auditing Nodes...' : 'Trigger Deep Scan'}
                  </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <section className="glass-card p-12 rounded-[4rem] border-blue-500/10">
                      <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-10">Audit Compliance</h3>
                      <div className="space-y-5">
                         {scanResults.map(item => (
                           <div key={item.id} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                 <i className={`fas ${item.status === 'passed' ? 'fa-check-circle text-emerald-500' : 'fa-circle-notch fa-spin text-slate-700'} text-2xl`}></i>
                                 <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">{item.label}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">{item.description}</p>
                                 </div>
                              </div>
                              <span className="text-[9px] font-black uppercase px-4 py-1.5 rounded-lg bg-white/5 border border-white/10">{item.status.toUpperCase()}</span>
                           </div>
                         ))}
                      </div>
                   </section>

                   <section className="glass-card p-12 rounded-[4rem] border-orange-500/20 flex flex-col">
                      <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest mb-10">Sovereign Policy Hub</h3>
                      <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-8">
                         <div className="flex items-center justify-between">
                            <div>
                               <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Post-Quantum Cryptography</h4>
                               <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Lattice-based security layer</p>
                            </div>
                            <button onClick={() => setIsPqcEnabled(!isPqcEnabled)} className={`w-14 h-7 rounded-full relative transition-all ${isPqcEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
                               <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isPqcEnabled ? 'left-8' : 'left-1'}`}></div>
                            </button>
                         </div>
                         {isPqcEnabled && (
                            <div className="pt-4 border-t border-white/5">
                               <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-4">Algorithm Selection</label>
                               <div className="grid grid-cols-2 gap-4">
                                  {['CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'Falcon-512', 'SPHINCS+'].map(algo => (
                                     <button key={algo} onClick={() => setPqcAlgorithm(algo)} className={`p-4 rounded-2xl text-[9px] font-black uppercase border transition-all ${pqcAlgorithm === algo ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-black/20 border-white/5 text-slate-500'}`}>
                                        {algo}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   </section>
                </div>
             </div>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-16 right-16 z-[2000] animate-in slide-in-from-right-16">
             <div className="px-12 py-7 rounded-[3rem] bg-slate-900/90 border border-blue-500/30 text-blue-400 backdrop-blur-3xl shadow-2xl flex items-center gap-6">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]"></div>
                <span className="text-xs font-black uppercase text-white tracking-[0.3em]">{toast.message}</span>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
