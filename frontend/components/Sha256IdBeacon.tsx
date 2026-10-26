import React, { useState } from 'react';
import { Check, Copy, KeyRound, Lock, RefreshCw, ShieldCheck } from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { formatSha256Display, RETENTION_MONTHS } from '../services/sovereignCrypto';

interface Sha256IdBeaconProps {
  variant?: 'header' | 'banner';
}

export const Sha256IdBeacon: React.FC<Sha256IdBeaconProps> = ({ variant = 'header' }) => {
  const {
    sha256Id,
    sha256Lit,
    encryptedEnvelopeCount,
    rotateEnclaveSha256Id,
  } = useSovereign();

  const [copied, setCopied] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [rotating, setRotating] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sha256Id) return;
    try {
      await navigator.clipboard.writeText(sha256Id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard restricted
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      await rotateEnclaveSha256Id();
    } finally {
      setRotating(false);
    }
  };

  if (variant === 'banner') {
    return (
      <div className="sha256-lit-beacon rounded-2xl border border-emerald-400/80 bg-gradient-to-r from-emerald-950/80 via-[#081a24] to-cyan-950/75 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/70 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.55)]">
              <Lock className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-85" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full border border-emerald-950 bg-emerald-400" />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  SHA256 ID LIT · ZERO-KNOWLEDGE HARD PROTECTION ACTIVE
                </span>
                <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                  AES-256-GCM + PBKDF2-SHA256 (100k)
                </span>
                <span className="rounded-full border border-slate-600/70 bg-slate-900/70 px-2.5 py-0.5 text-[11px] text-slate-300">
                  {encryptedEnvelopeCount} Sealed Envelope{encryptedEnvelopeCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-1.5 font-mono-code text-xs sm:text-sm text-emerald-200 break-all">
                {sha256Lit ? `SHA256 ID: ${sha256Id}` : 'Deriving Web Crypto SHA-256 Enclave Key…'}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Every character entered across all 16 Identity Vector Modules passes through a client-side Module Agent sealed with this SHA256 ID. Zero plaintext ever touches external storage; zero data leaks by mathematical construction.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition"
              title="Copy full 64-character SHA256 ID"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy SHA256 ID'}
            </button>
            <button
              type="button"
              onClick={handleRotate}
              disabled={rotating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 transition disabled:opacity-50"
              title="Cryptographically rotate local enclave salt and derive a fresh SHA256 ID"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${rotating ? 'animate-spin' : ''}`} />
              Rotate Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setInspectOpen((o) => !o)}
        className="sha256-lit-beacon group flex items-center gap-2.5 rounded-xl border border-emerald-400/80 bg-emerald-950/75 px-3 py-1.5 text-left transition hover:bg-emerald-900/60"
        aria-label="Inspect active SHA256 ID Zero-Knowledge Protection"
      >
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-90" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
        </span>
        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-[10px] font-extrabold tracking-wider text-emerald-300 uppercase">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            ZK ENCLAVE LIT · NO LEAKS
          </span>
          <span className="font-mono-code text-[11px] font-semibold text-emerald-100">
            {formatSha256Display(sha256Id, true)}
          </span>
        </div>
      </button>

      {inspectOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[340px] sm:w-[420px] rounded-2xl border border-emerald-400/60 bg-[#071122] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.85)]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <KeyRound className="h-4 w-4" />
              Active SHA256 ID Zero-Knowledge Proof
            </div>
            <button
              type="button"
              onClick={() => setInspectOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                256-Bit Session SHA256 ID
              </div>
              <div className="mt-1 font-mono-code text-[11px] break-all text-emerald-100">
                {sha256Id}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                <div className="text-slate-400">AEAD Cipher</div>
                <div className="font-semibold text-cyan-300">AES-256-GCM (96b IV)</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                <div className="text-slate-400">Key Derivation</div>
                <div className="font-semibold text-cyan-300">PBKDF2-SHA256 (100k)</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                <div className="text-slate-400">Sealed Vectors</div>
                <div className="font-semibold text-emerald-300">{encryptedEnvelopeCount} / 16 Gated</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                <div className="text-slate-400">Audit Horizon</div>
                <div className="font-semibold text-emerald-300">{RETENTION_MONTHS}-Month Vault</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied Full Digest' : 'Copy Full Digest'}
              </button>
              <button
                type="button"
                onClick={handleRotate}
                disabled={rotating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${rotating ? 'animate-spin' : ''}`} />
                Rotate Enclave Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
