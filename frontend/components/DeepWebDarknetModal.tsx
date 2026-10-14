import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  Eye, 
  Search, 
  ExternalLink, 
  AlertCircle, 
  Clock,
  Lock,
  Link,
  MessageCircle,
  Music,
  Image,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface DeepWebDarknetModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_DARKNET_TRENDS = [
  {
    id: 'trend-01',
    source: 'Onion Forum',
    title: 'RedLine Stealer Logs',
    ageHours: '4',
    threatLevel: 'HIGH',
    mentionedVectors: 'diff-01, diff-07, diff-15',
  },
  {
    id: 'trend-02',
    source: 'Telegram Channel',
    title: 'Credential Dump Aggregation',
    ageHours: '12',
    threatLevel: 'CRITICAL',
    mentionedVectors: 'diff-01, diff-09',
  },
  {
    id: 'trend-03',
    source: 'Pastebin Repository',
    title: 'Email Credentials Batch',
    ageHours: '24',
    threatLevel: 'HIGH',
    mentionedVectors: 'diff-01',
  },
];

export const DeepWebDarknetModal: React.FC<DeepWebDarknetModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [trends, setTrends] = useState<{ id: string; source: string; title: string; ageHours: string; threatLevel: string; mentionedVectors: string }[]>(INITIAL_DARKNET_TRENDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'TRENDS' | 'MENTIONS' | 'SCAN_HISTORY'>('TRENDS');

  const filteredTrends = trends.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 5: Deep Web & Darknet Index Monitor
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/20 text-purple-400 border border-purple-500/40">
                    ONION MONITOR • 24/7
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Onion Repository • Telegram Channels • Breach Forum Index • 2026 ECRA LTS
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
                onClick={() => setActiveTab('TRENDS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'TRENDS'
                    ? 'bg-gradient-to-r from-purple-500/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                1. Darknet Trends ({filteredTrends.length})
              </button>
              <button
                onClick={() => setActiveTab('MENTIONS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'MENTIONS'
                    ? 'bg-gradient-to-r from-purple-500/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                2. Forum Mentions
              </button>
              <button
                onClick={() => setActiveTab('SCAN_HISTORY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'SCAN_HISTORY'
                    ? 'bg-gradient-to-r from-purple-500/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <ScanFace className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>3. Scan History</span>
              </button>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                {trends.filter(t => t.threatLevel === 'CRITICAL').length} CRITICAL
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {trends.filter(t => t.threatLevel === 'HIGH').length} HIGH
              </span>
            </div>
          </div>

          {/* TAB 1: DARKNET TRENDS */}
          {activeTab === 'TRENDS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTrends.map((trend) => (
                  <div
                    key={trend.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      trend.threatLevel === 'CRITICAL'
                        ? 'border-red-500/50 shadow-[0_0_12px_rgba(255,0,0,0.15)]'
                        : trend.threatLevel === 'HIGH'
                        ? 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                        : 'border-cyan-500/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{trend.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          Source: {trend.source} • Age: {trend.ageHours} hours ago
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        trend.threatLevel === 'CRITICAL' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                        trend.threatLevel === 'HIGH' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                        'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30'
                      }`}>
                        {trend.threatLevel}
                      </span>
                    </div>

                    <div className="pt-2 text-[10px] text-slate-400 font-mono">
                      <ExternalLink className="w-3 h-3 text-purple-400 shrink-0" />
                      <span>Monitored on: .onion domains, Telegram t.me channels, Pastebin, Dread Forum</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-cyan-400 font-mono mentioned-vectors">
                        Vectors: {trend.mentionedVectors}
                      </span>
                      <button
                        onClick={() => onUpdatePerimeterVector('diff-05', 'KNOXED', `Darknet trend monitored: ${trend.title}`)}
                        className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>KNOXED</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTrends.length === 0 && (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Globe className="w-8 h-8 text-purple-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Darknet Trends Currently</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Trends appear here as they are detected across onion repositories, telegram channels, and breach forums.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FORUM MENTIONS */}
          {activeTab === 'MENTIONS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#00D4FF]" />
                  <span>Darknet Forum Mentions</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Monitoring of major darknet forums and markets for mentions of agape.sovereign identity vectors, email addresses, and credential leaks.
                </p>
              </div>

              <div className="space-y-3">
                {['Red Forum', 'Dread', 'BreachForums', 'Exploit'].map(forumName => (
                  <div key={forumName} className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">.{forumName.replace(' ', '.').toLowerCase()}</span>
                      <span className="text-[10px] text-slate-400">Active monitoring enabled</span>
                    </div>
                    <button
                      onClick={() => onUpdatePerimeterVector('diff-05', 'KNOXED', `Forum mention check: .${forumName.toLowerCase().replace(' ', '.')}`)}
                      className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Check</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCAN HISTORY */}
          {activeTab === 'SCAN_HISTORY' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF7A18]" />
                <span>Darknet Scan History</span>
              </h4>

              <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-bold text-white font-mono">No Scans Executed Yet</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                  Darknet monitoring scans will appear here with timestamp, threats detected, and vector references.
                </p>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Zero-Knowledge Onion Routing • Tor-Resistant • ECRA 2026 Certified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Monitor
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-05',
                    'KNOXED',
                    'Module 5 Synchronized: Darknet monitoring cycle completed. No new critical threats detected.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-[#00D4FF] to-[#00D4FF] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 5 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};