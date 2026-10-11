import React, { useState } from 'react';
import { X, KeyRound, Check, ShieldCheck, Mail, Plus, Trash2, Smartphone, Laptop } from 'lucide-react';
import { UserProfile } from '../types';
import { simulatePasskeyBiometricChallenge } from '../services/cryptoService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [provider, setProvider] = useState<'Google' | 'Apple'>(profile.federatedProvider);
  const [backupEmails, setBackupEmails] = useState<string[]>(profile.backupEmails);
  const [newEmail, setNewEmail] = useState('');
  const [isBindingPasskey, setIsBindingPasskey] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmail = () => {
    if (newEmail && !backupEmails.includes(newEmail)) {
      setBackupEmails([...backupEmails, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (target: string) => {
    setBackupEmails(backupEmails.filter(e => e !== target));
  };

  const handleRebindPasskey = async () => {
    setIsBindingPasskey(true);
    setPasskeyNotice(null);
    try {
      const res = await simulatePasskeyBiometricChallenge(profile.primaryEmail);
      if (res.success) {
        setPasskeyNotice(`Universal Passkey Hardware Credential bound successfully (${res.deviceCredentialId})`);
      }
    } finally {
      setIsBindingPasskey(false);
    }
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      fullName,
      federatedProvider: provider,
      backupEmails,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl p-[2px] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#FF2E9F] flex items-center justify-center text-white font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Federated Identity & Universal Passkey Enclave
                </h3>
                <p className="text-xs text-cyan-300 font-mono">
                  Sovereign Account Binding
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

          {/* Form */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                SOVEREIGN USER ALIAS
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0F172A] border border-slate-700 text-sm text-white focus:outline-none focus:border-[#00D4FF]"
              />
            </div>

            {/* Federated Binding Option */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-2">
                FEDERATED ID ANCHOR (GOOGLE / APPLE)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('Google')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    provider === 'Google'
                      ? 'bg-blue-600/20 border-blue-500 text-cyan-300 shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                      : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Google Account Binding</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('Apple')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    provider === 'Apple'
                      ? 'bg-purple-600/20 border-purple-500 text-pink-300 shadow-[0_0_12px_rgba(255,46,159,0.3)]'
                      : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Apple ID Binding</span>
                </button>
              </div>
            </div>

            {/* Universal Passkey Hardware Anchor */}
            <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#00D4FF]" />
                  <span className="font-bold text-xs text-white">Universal Passkey Device Binding</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                  {profile.passkeyStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Every subsequent login requires biometric passkey authentication to the device hardware enclave (Apple Silicon / Pixel Titan). No passwords are sent to servers.
              </p>
              {passkeyNotice && (
                <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-500/50 text-[11px] font-mono text-green-300">
                  {passkeyNotice}
                </div>
              )}
              <button
                type="button"
                onClick={handleRebindPasskey}
                disabled={isBindingPasskey}
                className="w-full py-2 px-3 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-cyan-500/40 text-xs font-mono font-bold text-[#00D4FF] transition"
              >
                {isBindingPasskey ? 'Initiating Biometric Challenge...' : 'Re-verify Hardware Passkey Token'}
              </button>
            </div>

            {/* Backup Email Registry */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
                MONITORED BACKUP IDENTITY EMAILS
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. personal.alias@domain.com"
                  className="flex-1 px-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00D4FF]"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-4 py-2 rounded-xl bg-[#00D4FF] hover:bg-cyan-400 text-xs font-bold text-[#0B1020] transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {backupEmails.map((em) => (
                  <div key={em} className="flex items-center justify-between p-2 rounded-lg bg-[#0F172A] border border-slate-800 text-xs font-mono">
                    <span className="text-slate-200">{em}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(em)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#111A33] text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-bold shadow-lg hover:opacity-90 transition"
            >
              Commit Enclave Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
