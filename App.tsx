
import React, { useState, useEffect, useRef } from 'react';
import { AppView, RiskLevel, EmailProvider, PrivacyThreat, ChatMessage, PrivacyDefinition, VaultItem } from './types';
import { DEFAULT_CONFIG, PRIVACY_DEFINITIONS_DB, SCRIPTS } from './constants';
import { CodeBlock } from './components/CodeBlock';
import { getArchitectAdvice, fetchLatestDefinitions, simulateInboxFetch, validateLiveEmailBatch } from './services/geminiService';

// --- Components ---

const ZeroTrustBadge = () => (
  <div className="fixed top-0 left-0 w-full bg-[#020617]/95 border-b border-orange-500/20 backdrop-blur-md z-[1000] px-6 py-2 flex justify-between items-center shadow-lg shadow-orange-900/5">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-[pulse_3s_infinite]"></div>
      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500">Agape Sovereign Enclave</span>
    </div>
    <div className="flex items-center gap-4">
       <div className="flex items-center gap-1.5 opacity-40">
         <i className="fab fa-google text-[10px] text-slate-400"></i>
         <span className="text-[8px] font-mono text-slate-400 tracking-wider">BEYONDCORP</span>
       </div>
       <span className="text-[8px] font-mono text-orange-500/60 border-l border-white/5 pl-4 tracking-widest">ID: agape-sovereign</span>
    </div>
  </div>
);

const RiskIndicator = ({ level }: { level: RiskLevel }) => {
  const styles = {
    [RiskLevel.CRITICAL]: 'text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse',
    [RiskLevel.HIGH]: 'text-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
    [RiskLevel.MODERATE]: 'text-yellow-400',
    [RiskLevel.SAFE]: 'text-blue-400',
  };
  return <i className={`fas fa-circle text-[8px] ${styles[level]} rounded-full`}></i>;
};

const App: React.FC = () => {
  // --- State ---
  const [authStage, setAuthStage] = useState<'zerotrust' | 'passkey' | 'app'>('zerotrust');
  const [view, setView] = useState<AppView>(AppView.SOURCES);
  
  // App Logic State
  const [providers, setProviders] = useState<EmailProvider[]>([
    { id: 'gmail-1', name: 'Google Workspace', icon: 'fa-google', status: 'connected', lastScan: null },
    { id: 'outlook-1', name: 'Microsoft 365', icon: 'fa-microsoft', status: 'disconnected', lastScan: null },
    { id: 'icloud-1', name: 'iCloud Mail', icon: 'fa-apple', status: 'disconnected', lastScan: null },
  ]);
  
  const [threats, setThreats] = useState<PrivacyThreat[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([
    { id: 'v1', title: 'Sensitive Tax Documents 2024', origin: 'Gmail', timestamp: '2 days ago', type: 'document', encryption: 'AES-256-GCM' },
    { id: 'v2', title: 'Passport Scan (Zero Trust Auth)', origin: 'Manual Upload', timestamp: '5 days ago', type: 'image', encryption: 'AES-256-GCM' },
  ]);
  const [definitions, setDefinitions] = useState<PrivacyDefinition[]>(PRIVACY_DEFINITIONS_DB);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', role: 'assistant', content: 'Sovereign Architect standing by. How can I harden your enclave today?', timestamp: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Scanner Progress
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Initializing Enclave...');
  const [scanProgress, setScanProgress] = useState(0);
  const [nukedCount, setNukedCount] = useState(1402);
  const [knoxedCount, setKnoxedCount] = useState(56);
  const [isUpdatingDefs, setIsUpdatingDefs] = useState(false);

  // --- Effects ---

  useEffect(() => {
    if (authStage === 'zerotrust') {
      const timer = setTimeout(() => setAuthStage('passkey'), 2000);
      return () => clearTimeout(timer);
    }
  }, [authStage]);

  // --- Handlers ---

  const handlePasskeyAuth = async () => {
    const btn = document.getElementById('passkey-btn');
    if (btn) btn.classList.add('animate-ping');
    await new Promise(r => setTimeout(r, 1000));
    setAuthStage('app');
  };

  const toggleProvider = async (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (!provider) return;
    if (provider.status === 'connected') {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status: 'disconnected' } : p));
    } else {
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status: 'authorizing' } : p));
      await new Promise(r => setTimeout(r, 1500));
      setProviders(prev => prev.map(p => p.id === id ? { ...p, status: 'connected' } : p));
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: chatInput, timestamp: 'Now' };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    const context = `User is in ${view} view. Threats found: ${threats.length}. Vaulted items: ${vaultItems.length}.`;
    const response = await getArchitectAdvice(chatInput, context);
    
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: response || 'Error reaching architect.', timestamp: 'Now' };
    setChatMessages(prev => [...prev, aiMsg]);
    setIsChatting(false);
  };

  const startSovereignScan = async () => {
    const connectedProviders = providers.filter(p => p.status === 'connected');
    if (connectedProviders.length === 0) return;

    setIsScanning(true);
    setScanProgress(0);
    setView(AppView.SCANNER);
    setThreats([]);

    try {
      setScanStatusText("Establishing TLS 1.3 Handshake...");
      await new Promise(r => setTimeout(r, 600));
      setScanProgress(20);
      setScanStatusText("Fetching Headers (IMAP)...");
      const rawEmailJson = await simulateInboxFetch(connectedProviders[0].name);
      setScanProgress(50);
      setScanStatusText("Running Gemini Privacy Heuristics...");
      const analyzedResults = await validateLiveEmailBatch(rawEmailJson);
      setScanProgress(80);
      setScanStatusText("Correlating with Local DB...");
      await new Promise(r => setTimeout(r, 500));

      const newThreats: PrivacyThreat[] = analyzedResults
        .filter((item: any) => item.suggestedAction !== 'IGNORE')
        .map((item: any) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          source: item.sender,
          subject: item.subject,
          emailProviderId: connectedProviders[0].id,
          riskLevel: item.riskLevel as RiskLevel,
          detectedVia: 'Gemini Sovereign 3.0',
          timestamp: 'Just Now',
          suggestedAction: item.suggestedAction
        }));

      setThreats(newThreats);
      setScanProgress(100);
      setTimeout(() => setIsScanning(false), 500);
    } catch (e) {
      console.error(e);
      setIsScanning(false);
    }
  };

  const handleAction = (id: string, action: 'NUKE' | 'KNOX') => {
    const threat = threats.find(t => t.id === id);
    setThreats(prev => prev.filter(t => t.id !== id));
    if (action === 'NUKE') setNukedCount(c => c + 1);
    if (action === 'KNOX' && threat) {
      setKnoxedCount(c => c + 1);
      setVaultItems(prev => [...prev, {
        id: `v-${Date.now()}`,
        title: threat.subject,
        origin: threat.source,
        timestamp: 'Just Now',
        type: 'thread',
        encryption: 'AES-256-GCM'
      }]);
    }
  };

  const togglePin = (id: string) => {
    setChatMessages(prev => prev.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m));
  };

  // --- Views ---

  if (authStage === 'zerotrust') {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-mono">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-orange-500/10 blur-2xl rounded-full animate-pulse"></div>
          <i className="fas fa-shield-cat text-7xl text-orange-600 relative z-10"></i>
        </div>
        <h1 className="text-2xl text-slate-300 uppercase tracking-[0.2em] font-black mb-2">Agape Sovereign</h1>
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
           <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
           <p className="text-[10px] text-orange-400 font-mono tracking-widest uppercase">Initializing Zero Trust Tunnel</p>
        </div>
      </div>
    );
  }

  if (authStage === 'passkey') {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-inter relative overflow-hidden">
        <div className="glass-card p-12 rounded-[3rem] border-orange-500/10 text-center max-w-md w-full relative z-10 shadow-2xl shadow-orange-900/10">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-full flex items-center justify-center mx-auto mb-10 border border-orange-500/20 group">
            <i className="fas fa-fingerprint text-5xl text-orange-500 group-hover:scale-110 transition-transform duration-500"></i>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Identity Check</h2>
          <p className="text-orange-500/60 text-xs font-mono uppercase tracking-widest mb-10">Sign in to agape-sovereign</p>
          <button id="passkey-btn" onClick={handlePasskeyAuth} className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.2)]">Verify Passkey</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#020617] text-slate-200 font-inter flex overflow-hidden selection:bg-orange-500/30">
      <ZeroTrustBadge />
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 bg-[#020617]/50 backdrop-blur-xl flex flex-col pt-16 z-40">
        <div className="px-6 mb-10">
           <div className="flex items-center gap-3 mb-2">
              <i className="fas fa-eye text-orange-600 text-xl"></i>
              <span className="text-lg font-black uppercase tracking-tighter text-white">Sovereign</span>
           </div>
           <div className="h-1 w-full bg-orange-500/10 rounded-full overflow-hidden">
             <div className="h-full bg-orange-500 w-1/3 shadow-[0_0_10px_orange]"></div>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: AppView.SOURCES, icon: 'fa-link', label: 'Sources' },
            { id: AppView.SCANNER, icon: 'fa-radar', label: 'Scanner' },
            { id: AppView.MY_STUFF, icon: 'fa-vault', label: 'My Stuff' },
            { id: AppView.ENCLAVE, icon: 'fa-microchip', label: 'Enclave' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-orange-600 text-black shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              <i className={`fas ${item.icon} text-base`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Pinned Chats Section */}
        <div className="px-4 py-8 border-t border-white/5">
           <h3 className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center justify-between">
             Pinned Chats
             <i className="fas fa-thumbtack text-[8px]"></i>
           </h3>
           <div className="space-y-1">
             {chatMessages.filter(m => m.isPinned).map(m => (
               <button key={m.id} className="w-full text-left px-4 py-2 rounded-xl text-[10px] text-slate-400 hover:bg-white/5 truncate font-medium">
                  "{m.content}"
               </button>
             ))}
             {chatMessages.filter(m => m.isPinned).length === 0 && (
               <p className="px-4 text-[9px] text-slate-700 italic">No pinned architectural advice.</p>
             )}
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative pt-12 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* View: Sources */}
          {view === AppView.SOURCES && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-12">
                 <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Data Sources</h1>
                 <p className="text-slate-500 text-sm font-medium">Authorize your digital perimeter nodes.</p>
              </header>
              <div className="grid gap-4">
                 {providers.map(p => (
                   <div key={p.id} className="glass-card p-6 rounded-[2rem] flex items-center justify-between hover:border-orange-500/30 transition-all">
                     <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${p.status === 'connected' ? 'bg-white text-black' : 'bg-slate-800 text-slate-500'}`}>
                         <i className={`fab ${p.icon}`}></i>
                       </div>
                       <div>
                         <h3 className="font-bold text-lg text-white">{p.name}</h3>
                         <span className="text-[10px] text-orange-500/60 font-mono uppercase tracking-widest">{p.status}</span>
                       </div>
                     </div>
                     <button onClick={() => toggleProvider(p.id)} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-black uppercase tracking-widest">
                       {p.status === 'connected' ? 'Disconnect' : 'Connect'}
                     </button>
                   </div>
                 ))}
              </div>
              <button onClick={startSovereignScan} className="mt-12 w-full py-6 bg-orange-600 hover:bg-orange-500 text-black font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-orange-900/40 transition-all flex items-center justify-center gap-3">
                 <i className="fas fa-bolt"></i> Initiate Sovereign Scan
              </button>
            </div>
          )}

          {/* View: Scanner */}
          {view === AppView.SCANNER && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 text-center">
                   <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest block mb-2">Neutralized</span>
                   <span className="text-5xl font-black text-white tracking-tighter">{nukedCount}</span>
                </div>
                <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 text-center">
                   <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest block mb-2">Ft. Knox Vault</span>
                   <span className="text-5xl font-black text-white tracking-tighter">{knoxedCount}</span>
                </div>
              </div>
              
              {isScanning ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="w-64 h-64 relative flex items-center justify-center mb-8">
                     <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                     <span className="text-4xl font-black text-white">{scanProgress}%</span>
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-500 animate-pulse">{scanStatusText}</p>
                 </div>
              ) : threats.length > 0 ? (
                <div className="space-y-3 pb-32">
                  {threats.map(t => (
                    <div key={t.id} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-orange-500/20">
                       <div className="flex items-center gap-6">
                         <RiskIndicator level={t.riskLevel} />
                         <div>
                            <p className="text-white font-bold text-sm mb-1">{t.source}</p>
                            <p className="text-xs text-slate-500">{t.subject}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => handleAction(t.id, 'NUKE')} className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash"></i></button>
                         <button onClick={() => handleAction(t.id, 'KNOX')} className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"><i className="fas fa-shield-cat"></i></button>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
                   <i className="fas fa-shield-check text-7xl mb-6 opacity-20"></i>
                   <p className="text-xs font-black uppercase tracking-widest">Perimeter Secured</p>
                </div>
              )}
            </div>
          )}

          {/* View: My Stuff (Vault) */}
          {view === AppView.MY_STUFF && (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
               <header className="mb-12 flex items-center justify-between">
                 <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">My Stuff</h1>
                    <p className="text-slate-500 text-sm font-medium">ECPA-Hardened sovereign storage enclave.</p>
                 </div>
                 <div className="bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 flex items-center gap-3">
                   <i className="fas fa-lock text-blue-400"></i>
                   <span className="text-[10px] font-mono font-black text-blue-400 uppercase tracking-widest">AES-256-GCM Active</span>
                 </div>
               </header>

               <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                 {vaultItems.map(item => (
                   <div key={item.id} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] hover:border-blue-500/30 transition-all group">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl text-slate-400 mb-6 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                        <i className={`fas ${item.type === 'image' ? 'fa-image' : item.type === 'document' ? 'fa-file-lines' : 'fa-envelope-open-text'}`}></i>
                     </div>
                     <h3 className="text-white font-bold mb-1 leading-tight">{item.title}</h3>
                     <p className="text-[10px] text-slate-500 font-mono uppercase mb-6">{item.origin} • {item.timestamp}</p>
                     <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest transition-colors">Decrypt & Open</button>
                   </div>
                 ))}
                 <div className="border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 hover:border-white/10 transition-all cursor-pointer group">
                   <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     <i className="fas fa-plus text-slate-600"></i>
                   </div>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Secure Upload</span>
                 </div>
               </div>
            </div>
          )}

          {/* View: Enclave (Architect Chat) */}
          {view === AppView.ENCLAVE && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
               <div className="flex-1 bg-black/40 border border-white/5 rounded-[3rem] flex flex-col overflow-hidden">
                 <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                        <i className="fas fa-microchip text-orange-500"></i>
                     </div>
                     <div>
                        <span className="font-mono text-xs text-orange-500 font-bold uppercase tracking-widest block">System Architect</span>
                        <span className="text-[9px] text-slate-600 font-mono uppercase">V-3.0 PRO ACTIVE</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                   {chatMessages.map(msg => (
                     <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-orange-600 text-black font-medium' : 'bg-slate-800 text-slate-200'} relative group`}>
                           {msg.content}
                           {msg.role === 'assistant' && (
                             <button 
                               onClick={() => togglePin(msg.id)}
                               className={`absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[10px] transition-all opacity-0 group-hover:opacity-100 ${msg.isPinned ? 'bg-orange-600 text-black' : 'bg-white/10 text-slate-400 hover:text-white'}`}
                             >
                               <i className="fas fa-thumbtack"></i>
                             </button>
                           )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-700 mt-2 uppercase tracking-widest px-4">{msg.role} • {msg.timestamp}</span>
                     </div>
                   ))}
                   {isChatting && (
                     <div className="flex items-center gap-3 text-slate-600 font-mono text-[10px] animate-pulse px-6">
                        <i className="fas fa-circle-notch fa-spin"></i> ARCHITECT THINKING...
                     </div>
                   )}
                 </div>

                 <div className="p-8 bg-black/20 border-t border-white/5">
                   <div className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Inquire about enclave security..."
                        className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-5 px-6 pr-20 text-sm focus:outline-none focus:border-orange-500/40 transition-all font-medium"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={isChatting}
                        className="absolute right-3 top-3 bottom-3 px-6 bg-orange-600 hover:bg-orange-500 text-black rounded-xl transition-all active:scale-95 disabled:opacity-50"
                      >
                         <i className="fas fa-paper-plane"></i>
                      </button>
                   </div>
                 </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
