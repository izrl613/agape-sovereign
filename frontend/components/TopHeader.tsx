import React, { useState } from 'react';
import {
  CheckCircle2,
  Fingerprint,
  LogIn,
  LogOut,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { Sha256IdBeacon } from './Sha256IdBeacon';

interface TopHeaderProps {
  onOpenLoginModal: () => void;
  onGoHome: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenLoginModal, onGoHome }) => {
  const {
    user,
    hasGoogleFederated,
    hasBoundPasskey,
    isDualSecured,
    signInWithGoogle,
    bindHardwarePasskey,
    signOut,
  } = useSovereign();

  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLinkGoogle = async () => {
    setBusy(true);
    setStatusNote(null);
    try {
      await signInWithGoogle({ requestDriveScope: true, linkToCurrentSession: Boolean(user) });
      setStatusNote('Federated Google Account linked (+ 26M PDF Drive scope ready).');
    } catch (err) {
      setStatusNote(err instanceof Error ? err.message : 'Google linking cancelled.');
    } finally {
      setBusy(false);
    }
  };

  const handleBindPasskey = async () => {
    setBusy(true);
    setStatusNote(null);
    try {
      await bindHardwarePasskey();
      setStatusNote('Hardware Passkey bound — Dual Security Protection active.');
    } catch (err) {
      setStatusNote(err instanceof Error ? err.message : 'Passkey setup requires deployed /api/auth RP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/15 bg-[#060d1d]/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-3 text-left group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-wide text-white group-hover:text-cyan-200 transition">
              AGAPE SOVEREIGN ENCLAVE
            </div>
            <div className="text-[11px] text-slate-400">
              16 Identity Vector Modules · Zero-Cost Verified · Zero-Knowledge
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lit SHA256 ID Zero-Knowledge Beacon */}
          <Sha256IdBeacon variant="header" />

          {/* Dual Security Protection Indicator & Upgrade Controls */}
          {user ? (
            <div className="flex items-center gap-2">
              {isDualSecured ? (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Dual Security Active
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  {!hasGoogleFederated && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleLinkGoogle}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 transition"
                      title="Link Sign-In With Google for Dual Security Protection & 26-month PDF Google Drive export"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-cyan-300" />
                      + Link Google (Dual Auth)
                    </button>
                  )}
                  {!hasBoundPasskey && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleBindPasskey}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition"
                      title="Bind a FIDO2 Hardware Passkey for Dual Security Protection"
                    >
                      <Fingerprint className="h-3.5 w-3.5 text-emerald-300" />
                      + Bind Passkey
                    </button>
                  )}
                </div>
              )}

              <div className="hidden xl:flex flex-col text-right px-1">
                <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                  {user.email || 'Sovereign Principal'}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {hasGoogleFederated ? 'Federated Google' : 'Enclave Auth'}
                  {hasBoundPasskey ? ' + Passkey' : ''}
                </span>
              </div>

              <button
                type="button"
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-500/50 hover:text-rose-200 transition"
                title="Sign out of Sovereign Enclave"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-cyan-500/15 px-3.5 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              Dual Security Sign In
            </button>
          )}
        </div>
      </div>

      {statusNote && (
        <div className="border-t border-cyan-500/20 bg-cyan-950/40 px-4 py-1.5 text-[11px] text-cyan-200 flex items-center justify-between">
          <span>{statusNote}</span>
          <button
            type="button"
            onClick={() => setStatusNote(null)}
            className="text-slate-400 hover:text-white ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
};
