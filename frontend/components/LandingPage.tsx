import React from 'react';
import {
  Bot,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Globe,
  Lock,
  Shield,
  Sparkles,
} from 'lucide-react';
import { IDENTITY_VECTOR_MODULES } from '../services/moduleAgents';
import { Sha256IdBeacon } from './Sha256IdBeacon';

interface LandingPageProps {
  onOpenLogin: () => void;
  onEnterWorkspacePreview: () => void;
  onSignInGoogleQuick: () => Promise<void>;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onEnterWorkspacePreview,
  onSignInGoogleQuick,
}) => {
  return (
    <div className="min-h-screen bg-[#050914] text-[#e8f4ff] flex flex-col">
      {/* Top Public Compliance & Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-cyan-500/15 bg-[#050914]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.35)]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wide text-white">
                AGAPE SOVEREIGN AI
              </div>
              <div className="text-[11px] text-cyan-300/90">
                Zero-Knowledge Digital Identity Enclave · sovereign.nyc
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#vectors" className="hover:text-cyan-300 transition">16 Identity Vectors</a>
            <a href="#dual-security" className="hover:text-cyan-300 transition">Dual Security</a>
            <a href="/privacy" className="hover:text-cyan-300 transition">Privacy Policy</a>
            <a href="/terms" className="hover:text-cyan-300 transition">Terms of Service</a>
            <a href="/contact" className="hover:text-cyan-300 transition">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Sha256IdBeacon variant="header" />
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25 transition"
            >
              Sign In / Enclave
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-14 space-y-14">
        {/* Hero Section */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Zero-Cost Real Third-Party Verification · Strict Zero-Knowledge Architecture
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Hard-Protected Digital Sovereignty Across{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                16 Identity Vector Modules
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Agape Sovereign AI gates every single identity check behind dedicated client-side{' '}
              <strong className="text-white">Module Agents (AG-01..AG-16)</strong> sealed with your lit{' '}
              <strong className="text-emerald-300">SHA256 ID</strong> (`AES-256-GCM`), backed by{' '}
              <strong className="text-cyan-300">Architect AI</strong>, verified against live zero-cost public security APIs, and protected by{' '}
              <strong className="text-white">Dual Security (Passkey + Sign-In With Google)</strong> with direct{' '}
              <strong className="text-emerald-300">26-month Identity Audit PDF</strong> export to your Federated Google Account.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                type="button"
                onClick={onSignInGoogleQuick}
                className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-100 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </button>

              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/60 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
              >
                <Fingerprint className="h-4 w-4 text-emerald-300" />
                Passkey &amp; Dual Security Login
              </button>

              <button
                type="button"
                onClick={onEnterWorkspacePreview}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 hover:border-cyan-400/50 hover:text-cyan-200 transition"
              >
                Open Live 16-Vector Enclave →
              </button>
            </div>
          </div>

          {/* Right Architectural Guarantees Card */}
          <div className="lg:col-span-5 space-y-4">
            <Sha256IdBeacon variant="banner" />
            <div
              id="dual-security"
              className="rounded-2xl border border-cyan-500/25 bg-[#091326] p-5 space-y-3.5"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Lock className="h-4 w-4" />
                Four Sovereign Security Pillars
              </div>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    <strong className="text-white">Dual Security Protection:</strong> Hardware Passkey (FIDO2/WebAuthn) + Federated Sign-In With Google linked onto one Sovereign UID.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    <strong className="text-white">26-Month Audit PDF to Google Drive:</strong> Seal verified 16-vector telemetry with SHA-256 and archive directly to your Federated Google Account (`drive.file`).
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Bot className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                  <span>
                    <strong className="text-white">Architect AI Backbone:</strong> Real-time zero-knowledge reasoning for privacy inquiries, remediation steps, and live DNS/OSV verification.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Globe className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                  <span>
                    <strong className="text-white">100% Real Third-Party Verifiers at Zero Cost:</strong> Cloudflare &amp; Google DoH, HIBP 5-char k-anonymity, Sectigo crt.sh, IANA RDAP, RIPEstat, NIH NPI, Google OSV.dev, and ROR.org.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 16 Identity Vector Modules Grid */}
        <section id="vectors" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                16 Identity Vector Modules Gated by Zero-Knowledge Module Agents
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Every module encrypts user input under your active SHA256 ID before executing live zero-cost third-party verification.
              </p>
            </div>
            <span className="text-xs font-mono-code text-emerald-300">
              AG-01 .. AG-16 ENCLAVE GATES READY
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {IDENTITY_VECTOR_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="rounded-xl border border-slate-800/90 bg-[#091224]/90 p-4 hover:border-cyan-400/40 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono-code">
                    <span className="rounded bg-cyan-500/15 px-2 py-0.5 font-bold text-cyan-300">
                      {mod.id}
                    </span>
                    <span className="text-emerald-400">{mod.agentId}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white">{mod.shortTitle}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                </div>
                <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                  <span className="text-slate-500">Verifiers:</span> {mod.thirdPartyApis.join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* OAuth Branding & Governance Footer (strictly aligned with repo compliance gates) */}
      <footer className="border-t border-slate-800/90 bg-[#040711] py-8 px-4 sm:px-6 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-bold text-slate-200">
              COMPLIANCE &amp; GOVERNANCE — AGAPE SOVEREIGN AI · <a href="/privacy" className="text-cyan-300 hover:underline">Privacy Policy</a> · <a href="/terms" className="text-cyan-300 hover:underline">Terms of Service</a> · <a href="/contact" className="text-cyan-300 hover:underline">Contact</a>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Official Governance Contacts: idin@agape.nyc · dpo@agape.nyc · security@sovereign.nyc · legal@agape.nyc
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <a href="/privacy" className="hover:text-cyan-300">Privacy Policy</a>
            <a href="/terms" className="hover:text-cyan-300">Terms of Service</a>
            <a href="/contact" className="hover:text-cyan-300">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
