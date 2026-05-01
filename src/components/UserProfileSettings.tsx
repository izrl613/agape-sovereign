import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { NEON, GlassCard, NeonButton, NeonText } from './UI';
import { motion } from 'framer-motion';
import { User, Shield, History, Save, AlertTriangle, Key, Lock, Fingerprint } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const UserProfileSettings = () => {
  const { user, sovereignScore, updateProfile, isAnonymous } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchScoreHistory = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'score_history'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setScoreHistory(history);
      } catch (error) {
        console.error("Error fetching score history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchScoreHistory();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ displayName });
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#00D4FF]/10 rounded-lg border border-[#00D4FF]/20">
              <User className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <NeonText color={NEON.blue} size="1.5rem" weight={800}>SOVEREIGN PROFILE</NeonText>
          </div>
          <p className="text-slate-400 font-mono text-sm">Manage your digital identity parameters and security enclaves.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0B1020]/50 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1">Current Score</div>
            <div className="text-2xl font-black text-[#00D4FF] font-mono leading-none">{sovereignScore}</div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-[#00D4FF]/30 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF] border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
            <Shield className="w-6 h-6 text-[#00D4FF]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-[#FF2E9F]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Identity Parameters</h3>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/50 outline-none transition-all"
                    placeholder="Enter your sovereign alias..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sovereign Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-slate-500 font-mono text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 italic">Email is bound to your Google identity and cannot be changed.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <NeonButton 
                  type="submit" 
                  color={NEON.blue} 
                  disabled={isSaving || displayName === user?.displayName}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'SYNCHRONIZING...' : 'UPDATE IDENTITY'}
                </NeonButton>
              </div>
            </form>
          </GlassCard>

          {/* Security Preferences */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-[#FF7A18]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Security Enclaves</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#FF7A18]/10 rounded-lg group-hover:bg-[#FF7A18]/20 transition-colors">
                    <Key className="w-4 h-4 text-[#FF7A18]" />
                  </div>
                  <div className="font-bold text-sm text-white">Passkey Management</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Manage biometric and hardware security keys bound to your identity.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#00D4FF]/10 rounded-lg group-hover:bg-[#00D4FF]/20 transition-colors">
                    <Fingerprint className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                  <div className="font-bold text-sm text-white">Biometric Auth</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Enable face or fingerprint verification for high-risk DIFF operations.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#FF2E9F]/10 rounded-lg group-hover:bg-[#FF2E9F]/20 transition-colors">
                    <Lock className="w-4 h-4 text-[#FF2E9F]" />
                  </div>
                  <div className="font-bold text-sm text-white">Session Lockdown</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Configure automatic session termination and zero-knowledge clearing.</p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div className="font-bold text-sm text-white">Privacy Hardening</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Enable advanced obfuscation for your public metadata footprint.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Score History Sidebar */}
        <div className="space-y-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-5 h-5 text-[#00D4FF]" />
              <h3 className="text-lg font-bold text-white tracking-tight">Score History</h3>
            </div>

            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin" />
                </div>
              ) : scoreHistory.length > 0 ? (
                scoreHistory.map((entry, idx) => (
                  <div key={entry.id} className="relative pl-6 pb-4 border-l border-white/10 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
                    <div className="flex justify-between items-start mb-1">
                      <div className="text-xs font-bold text-white">{entry.score} SCORE</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {entry.timestamp?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{entry.reason || 'Periodic scan update'}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 font-mono">No score history recorded yet.</p>
                </div>
              )}
            </div>
          </GlassCard>

          {isAnonymous && (
            <div className="p-6 bg-[#FF7A18]/10 border border-[#FF7A18]/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-[#FF7A18]" />
                <h4 className="text-sm font-bold text-[#FF7A18] uppercase tracking-wider">Identity Risk</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                You are currently using an <span className="text-[#FF7A18] font-bold">Anonymous Enclave</span>. Your profile settings and score history will be purged once the session expires.
              </p>
              <NeonButton color={NEON.orange} size="sm" className="w-full">
                BIND IDENTITY
              </NeonButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
