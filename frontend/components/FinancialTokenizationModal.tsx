import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  DollarSign, 
  Send, 
  Hash, 
  Check, 
  Sparkles, 
  Plus, 
  Layers, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  KeyRound, 
  ShoppingBag,
  Terminal,
  Clock
} from 'lucide-react';
import { ExposedMerchantCard, VirtualMaskedCard, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface FinancialTokenizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_EXPOSED_CARDS: ExposedMerchantCard[] = [
  {
    id: 'crd-01',
    merchantName: 'FastFashion Global Cart',
    merchantCategory: 'E-Commerce Retailer',
    cardBrand: 'Visa',
    last4: '4192',
    vaultStorageType: 'RAW_PAN_RETAINED',
    status: 'EXPOSED_AT_REST',
    sha256Attestation: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'crd-02',
    merchantName: 'Cloud SaaS Subscription Portal',
    merchantCategory: 'Recurring Hosting Billing',
    cardBrand: 'Mastercard',
    last4: '8810',
    vaultStorageType: 'PCI_LEGACY_UNTOKENIZED',
    status: 'EXPOSED_AT_REST',
    sha256Attestation: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'crd-03',
    merchantName: 'Airline Rewards Online Booking',
    merchantCategory: 'Travel & Lodging Services',
    cardBrand: 'Amex',
    last4: '9002',
    vaultStorageType: 'RAW_PAN_RETAINED',
    status: 'EXPOSED_AT_REST',
    sha256Attestation: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  }
];

const INITIAL_VIRTUAL_CARDS: VirtualMaskedCard[] = [
  {
    id: 'vcrd-01',
    merchantBound: 'AWS Cloud Services',
    maskedCardNumber: '4890 •••• •••• 9104',
    expDate: '08/28',
    cvv: '•••',
    spendingLimitDollars: 250,
    isSingleUse: false,
    isEnclaveLocked: true,
    sha256Seal: '8c92fb381aa02c448bb9120de4568912ba0012c4781290bbfae09124cb11ef02',
  }
];

export const FinancialTokenizationModal: React.FC<FinancialTokenizationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [exposedCards, setExposedCards] = useState<ExposedMerchantCard[]>(INITIAL_EXPOSED_CARDS);
  const [virtualCards, setVirtualCards] = useState<VirtualMaskedCard[]>(INITIAL_VIRTUAL_CARDS);
  const [activeTab, setActiveTab] = useState<'EXPOSED_CARDS' | 'MASKED_GENERATOR' | 'AUDIT_LOGS'>('EXPOSED_CARDS');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  
  // New Virtual Card Form State
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newSpendLimit, setNewSpendLimit] = useState(100);
  const [isSingleUseOnly, setIsSingleUseOnly] = useState(true);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Counts
  const exposedCount = useMemo(() => exposedCards.filter(c => c.status === 'EXPOSED_AT_REST').length, [exposedCards]);
  const purgedCount = useMemo(() => exposedCards.filter(c => c.status === 'PURGE_REQUESTED').length, [exposedCards]);

  if (!isOpen) return null;

  // Issue Merchant Card Purge Request (NUKE)
  const handlePurgeMerchantCard = async (cardId: string) => {
    const target = exposedCards.find(c => c.id === cardId);
    if (!target) return;

    const receipt = await calculateSha256(`MERCHANT_CARD_PURGE::${target.merchantName}::${target.last4}::${Date.now()}`);
    const timeStr = new Date().toLocaleTimeString();

    setExposedCards(prev => prev.map(c => {
      if (c.id === cardId) {
        return {
          ...c,
          status: 'PURGE_REQUESTED',
          sha256Attestation: receipt,
        };
      }
      return c;
    }));

    const line = `[${timeStr}] 🔥 NUKED CARD STORAGE: Statutory deletion order dispatched to ${target.merchantName} to wipe Card •••• ${target.last4}. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-09', 'NUKED', `Merchant card purge requests issued across unencrypted e-commerce checkouts.`);
  };

  // Generate Single-Use Virtual Masked Card (KNOX)
  const handleGenerateVirtualCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchantName.trim()) return;

    setIsGeneratingCard(true);
    await new Promise(r => setTimeout(r, 600));

    const randomLast4 = Math.floor(Math.random() * 8999 + 1000).toString();
    const seal = await calculateSha256(`VIRTUAL_CARD::${newMerchantName}::${newSpendLimit}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    const created: VirtualMaskedCard = {
      id: `vcrd-${Date.now()}`,
      merchantBound: newMerchantName,
      maskedCardNumber: `4712 •••• •••• ${randomLast4}`,
      expDate: '12/29',
      cvv: Math.floor(Math.random() * 899 + 100).toString(),
      spendingLimitDollars: newSpendLimit,
      isSingleUse: isSingleUseOnly,
      isEnclaveLocked: true,
      sha256Seal: seal,
    };

    setVirtualCards(prev => [created, ...prev]);
    setIsGeneratingCard(false);
    setNewMerchantName('');

    const line = `[${timeStr}] 🛡️ KNOXED TOKENIZATION: Generated virtual masked card bound exclusively to "${created.merchantBound}" ($${created.spendingLimitDollars} limit). Seal: ${seal.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-09', 'KNOXED', `Active single-use virtual card tokenization enforced with hardware passkey authorization.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <CreditCard className="w-6 h-6 text-[#00D4FF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 9: Financial Footprint & Masked Tokenization Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    PCI-DSS • SINGLE-USE MASKING
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Merchant Vault Card Purging • Dynamic Virtual Cards • 2026 ECRA LTS Standard
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('EXPOSED_CARDS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'EXPOSED_CARDS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                1. Exposed Merchant Vaults ({exposedCards.length})
              </button>
              <button
                onClick={() => setActiveTab('MASKED_GENERATOR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'MASKED_GENERATOR'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>2. Virtual Masked Cards ({virtualCards.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('AUDIT_LOGS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'AUDIT_LOGS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>3. Financial Audit Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {exposedCount} EXPOSED IN CARTS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-[#00D4FF] border border-cyan-500/30 font-bold">
                {virtualCards.length} MASKED TOKENS ACTIVE
              </span>
            </div>
          </div>

          {/* TAB 1: EXPOSED MERCHANT VAULTS */}
          {activeTab === 'EXPOSED_CARDS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Eliminate Static Card Storage in Vulnerable Web Checkouts</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans">
                    E-commerce merchants frequently store full card numbers (PANs) on vulnerable cloud databases that get dumped during e-skimming attacks. Issue automated CCPA deletion demands (<strong className="text-[#FF2E9F]">NUKE</strong>) to scrub raw card records.
                  </p>
                </div>
              </div>

              {/* Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exposedCards.map((card) => {
                  return (
                    <div
                      key={card.id}
                      className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                        card.status === 'PURGE_REQUESTED'
                          ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                          : 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{card.merchantName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                              {card.merchantCategory}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Storage: {card.vaultStorageType}
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          card.status === 'PURGE_REQUESTED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                          'bg-orange-500/20 text-[#FF7A18] border border-orange-500/50 animate-pulse'
                        }`}>
                          {card.status === 'PURGE_REQUESTED' ? 'PURGE DISPATCHED (NUKED) ✓' : 'RAW CARD EXPOSED'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                        <div className="text-white font-bold flex items-center justify-between">
                          <span>{card.cardBrand} Card</span>
                          <span className="text-[#00D4FF]">•••• •••• •••• {card.last4}</span>
                        </div>
                      </div>

                      {/* SHA-256 Attestation */}
                      <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-[#00D4FF]" />
                          <span>Audit Digest:</span>
                        </span>
                        <span className="text-cyan-300 truncate max-w-[170px]" title={card.sha256Attestation}>
                          {card.sha256Attestation}
                        </span>
                      </div>

                      {/* Action Trigger */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {card.status === 'EXPOSED_AT_REST' ? (
                          <button
                            onClick={() => handlePurgeMerchantCard(card.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Dispatch Merchant Card Purge (Nuke)</span>
                          </button>
                        ) : (
                          <div className="text-[11px] font-mono text-[#FF2E9F] flex items-center gap-1 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Statutory Deletion Demand Dispatched to Merchant</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VIRTUAL MASKED CARDS GENERATOR */}
          {activeTab === 'MASKED_GENERATOR' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Creator Form */}
              <form onSubmit={handleGenerateVirtualCard} className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#00D4FF]" />
                  <span>Generate Single-Use Merchant-Bound Masked Card (Knox)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-cyan-200 uppercase mb-1">
                      Merchant Destination:
                    </label>
                    <input
                      type="text"
                      value={newMerchantName}
                      onChange={(e) => setNewMerchantName(e.target.value)}
                      placeholder="e.g. OpenAI / Spotify / Amazon"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-cyan-200 uppercase mb-1">
                      Spending Limit ($ USD):
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="5000"
                      value={newSpendLimit}
                      onChange={(e) => setNewSpendLimit(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isGeneratingCard || !newMerchantName.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                    >
                      {isGeneratingCard ? 'Generating Enclave Token...' : 'Create Masked Card'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Active Masked Cards Visuals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {virtualCards.map((vc) => (
                  <div 
                    key={vc.id}
                    className="p-5 rounded-3xl bg-gradient-to-br from-[#111A33] to-[#0B1020] border border-cyan-500/50 shadow-xl relative space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        SOVEREIGN ENCLAVE VIRTUAL
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF]">
                        ENCLAVE LOCKED
                      </span>
                    </div>

                    <div className="text-lg font-mono font-black tracking-widest text-white pt-2">
                      {vc.maskedCardNumber}
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-300 pt-2 border-t border-slate-800">
                      <div>
                        <span className="block text-[9px] text-slate-500">EXPIRES</span>
                        <span className="text-white font-bold">{vc.expDate}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500">LIMIT</span>
                        <span className="text-[#00D4FF] font-bold">${vc.spendingLimitDollars}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500">MERCHANT</span>
                        <span className="text-pink-300 font-bold truncate block">{vc.merchantBound}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Financial Vault Sanitization & Masking Audit Trail</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Recorded Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Execute a merchant card purge or generate a single-use virtual card to record verifiable cryptographic receipts.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5 font-mono text-xs space-y-2.5 shadow-inner">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="text-cyan-300 leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Zero-Knowledge Financial Shield & PCI-DSS Level 1 Enforced</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Engine
              </button>

              <button
                onClick={() => {
                  const finalStatus = purgedCount > 0 ? 'NUKED' : virtualCards.length > 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-09',
                    finalStatus,
                    `Module 9 Synchronized: ${purgedCount} merchant cards purged, ${virtualCards.length} virtual cards generated.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 9 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
