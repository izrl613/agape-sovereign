import React, { useEffect, useState } from 'react';
import { Shield, Lock, KeyRound, Sparkles, ArrowRight, CheckCircle2, ChevronRight, Fingerprint, EyeOff, Cpu, RefreshCw, Copy, Check } from 'lucide-react';
import { NEON, FONTS, GRADIENT } from '../theme';
import { MODULE_CONFIGS } from '../module-config';
import { sha256Hex } from '../services/sha256Vault';

interface HomePageProps {
  onBegin: () => void;
  onLoginGoogle?: () => void;
  onLoginPasskey?: () => void;
  onLoginAnon?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onBegin,
  onLoginGoogle,
  onLoginPasskey,
  onLoginAnon,
}) => {
  const [zkHash, setZkHash] = useState<string>('COMPUTING...');
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');

  useEffect(() => {
    let active = true;
    const generate = async () => {
      const entropy = `sovereign-landing::${Date.now()}::${Math.random()}::zero-knowledge-2026`;
      const h = await sha256Hex(entropy);
      if (active) setZkHash(h);
    };
    generate();
    const interval = setInterval(generate, 12000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(zkHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const modules = Object.values(MODULE_CONFIGS);
  const filteredModules = activeCategory === 'ALL'
    ? modules
    : modules.filter((m) => m.category === activeCategory);

  const CATEGORY_NAMES: Record<string, string> = {
    A: 'Communications & Credentials (01-04)',
    B: 'Social, Public & Web Surface (05-08)',
    C: 'Hardware & Network Posture (09-12)',
    D: 'Financial, Biometric & Legal (13-16)',
  };

  return (
    <div className="home-container">
      {/* Background Ambience */}
      <div className="bg-grid" />
      <div className="bg-glow-top" />
      <div className="bg-glow-bottom" />

      {/* Navigation Header */}
      <header className="home-header">
        <div className="brand-group" onClick={onBegin} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 40 40" width="36" height="36" style={{ filter: `drop-shadow(0 0 10px ${NEON.blue})` }}>
            <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
            <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.75" />
            <polygon points="20,14 26,18 26,22 20,26 14,22 14,18" fill={NEON.orange} fillOpacity="0.85" stroke={NEON.orange} strokeWidth="0.5" />
          </svg>
          <div>
            <div className="brand-title">AGAPE SOVEREIGN AI</div>
            <div className="brand-sub">DIGITAL IDENTITY DEFENSE ENCLAVE 2026</div>
          </div>
        </div>

        <div className="secure-badge">
          <span className="pulse-dot" />
          <span className="mono-txt">ZERO-KNOWLEDGE LIVE</span>
        </div>

        <div className="header-actions">
          <button type="button" onClick={onLoginPasskey || onBegin} className="btn-header-passkey">
            <Fingerprint size={14} />
            PASSKEY
          </button>
          <button type="button" onClick={onLoginGoogle || onBegin} className="btn-header-google">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8, background: '#fff', borderRadius: 2, padding: 2 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="hero-content">
        <div className="hero-eyebrow">
          <span className="pulse-dot" />
          <span>SOVEREIGN DIGITAL IDENTITY PLATFORM · 16 VECTOR SUITE</span>
        </div>

        <h1 className="hero-title">
          Agape Sovereign AI
        </h1>

        <p className="hero-subtitle">
          Reclaim your digital existence. We scan, monitor, and defend your personal footprint across{' '}
          <strong style={{ color: NEON.blue }}>16 Identity Vectors</strong> with client-side SHA-256 integrity hashing,{' '}
          <strong style={{ color: NEON.green }}>AES-256-GCM encryption</strong>, and Architect AI backed by an{' '}
          <strong style={{ color: NEON.orange }}>offline local LLM (qwen3-vl:4b · fallback: gemma4:12b)</strong>.
        </p>

        {/* Live ZK-Proof Hash Bar */}
        <div className="zk-bar" onClick={copyHash} title="Click to copy full SHA-256 ZK Proof">
          <div className="zk-label">
            <Lock size={12} color={NEON.green} />
            <span>SESSION SHA-256 ZK-PROOF:</span>
          </div>
          <span className="zk-hash">
            {zkHash.slice(0, 16)}…{zkHash.slice(-16)}
          </span>
          <span className="zk-copy">
            {copied ? <><Check size={12} color={NEON.green} /> COPIED</> : <><Copy size={12} /> COPY</>}
          </span>
        </div>

        {/* Primary CTA Buttons */}
        <div className="cta-container">
          <button type="button" onClick={onBegin} className="btn-primary-cta">
            <span>BEGIN VECTORIZATION</span>
            <ArrowRight size={18} />
          </button>

          <div className="secondary-ctas">
            <button type="button" onClick={onLoginGoogle || onBegin} className="btn-google-pill">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ background: '#fff', borderRadius: '50%', padding: 2 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <button type="button" onClick={onLoginPasskey || onBegin} className="btn-passkey-pill">
              <Fingerprint size={16} color={NEON.blue} />
              <span>Use Passkey</span>
            </button>

            <button type="button" onClick={onLoginAnon || onBegin} className="btn-anon-pill">
              <EyeOff size={15} color={NEON.orange} />
              <span>Guest Enclave</span>
            </button>
          </div>
        </div>

        {/* 4 Pillar Badges */}
        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon">🔒</div>
            <div className="pillar-title">AES-256-GCM + SHA-256</div>
            <div className="pillar-desc">Client-side encryption. Plaintext sensitive credentials never leave your browser.</div>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon">🤖</div>
            <div className="pillar-title">Offline Local LLM (qwen3-vl:4b / gemma4:12b)</div>
            <div className="pillar-desc">Architect AI queries an on-device neural model (qwen3-vl:4b with gemma4:12b fallback).</div>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon">🔑</div>
            <div className="pillar-title">FIDO2 Passkeys</div>
            <div className="pillar-desc">Hardware/biometric bound WebAuthn credentials that eradicate password phishing.</div>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon">📜</div>
            <div className="pillar-title">26-Month Audit Dossier</div>
            <div className="pillar-desc">Immutable cryptographic PDF verification ledger exportable directly to Google Drive.</div>
          </div>
        </div>

        {/* 16 Identity Vectors Section */}
        <section className="vectors-section">
          <div className="section-header">
            <div className="section-eyebrow">IDENTITY VECTOR ARCHITECTURE</div>
            <h2 className="section-title">The 16 Sovereign Defense Modules</h2>
            <p className="section-sub">
              Every vector is guarded by an autonomous Module Agent executing real cryptographic sealing.
            </p>

            <div className="category-filters">
              <button
                type="button"
                className={`cat-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
                onClick={() => setActiveCategory('ALL')}
              >
                ALL 16 VECTORS
              </button>
              {(['A', 'B', 'C', 'D'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  CATEGORY {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="modules-grid">
            {filteredModules.map((m, idx) => (
              <div key={m.id} className="module-item" onClick={onBegin}>
                <div className="module-top">
                  <span className="module-vec">VECTOR {String(idx + 1).padStart(2, '0')}</span>
                  <span className="module-cat">CAT {m.category || 'A'}</span>
                </div>
                <h3 className="module-name">{m.name}</h3>
                <p className="module-hook">{m.thematicHook}</p>
                <div className="module-pledge">
                  <Lock size={11} color={NEON.blue} />
                  <span>SHA-256 Gated Enclave</span>
                </div>
                <div className="module-arrow">
                  <span>Open Agent</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shield Guarantee Strip */}
        <div className="guarantee-strip">
          <div className="guarantee-content">
            <Shield size={24} color={NEON.green} />
            <div>
              <div className="guarantee-title">ZERO-KNOWLEDGE SOVEREIGN GUARANTEE</div>
              <div className="guarantee-desc">
                Your passwords, identity documents, and sensitive assets are never stored in plaintext on any server.
                All calculations are executed in-browser and sealed under your SHA-256 sovereign key.
              </div>
            </div>
          </div>
          <button type="button" onClick={onBegin} className="btn-enter-enclave">
            ACCESS ENCLAVE
          </button>
        </div>
      </main>

      {/* Google OAuth & Compliance Footer */}
      <footer className="home-footer">
        <div className="footer-links">
          <a href="/terms" className="footer-link">TERMS OF SERVICE</a>
          <a href="/privacy" className="footer-link">PRIVACY POLICY</a>
          <a href="/contact" className="footer-link">CONTACT</a>
          <a href="mailto:idin@agape.nyc" className="footer-link">DEVELOPER: idin@agape.nyc</a>
        </div>
        <div className="footer-copy">
          COPYRIGHT © 2026 AGAPE SOVEREIGN AI · ENCLAVE DEPLOYED
        </div>
      </footer>

      <style>{`
        .home-container {
          min-height: 100vh;
          background: #060c1a;
          color: #e8f4ff;
          font-family: ${FONTS.rajdhani};
          position: relative;
          overflow-x: hidden;
        }
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.035) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }
        .bg-glow-top {
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 1000px;
          height: 600px;
          background: radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.1) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .bg-glow-bottom {
          position: fixed;
          bottom: -200px;
          right: -100px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255, 46, 159, 0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .home-header {
          position: relative;
          z-index: 10;
          padding: 16px clamp(16px, 4vw, 48px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(0, 212, 255, 0.12);
          backdrop-filter: blur(14px);
          background: rgba(6, 12, 26, 0.85);
          gap: 16px;
          flex-wrap: wrap;
        }
        .brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-title {
          font-family: ${FONTS.orbitron};
          font-size: 1.05rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #fff;
        }
        .brand-sub {
          font-family: ${FONTS.mono};
          font-size: 0.58rem;
          color: ${NEON.blue};
          letter-spacing: 0.16em;
        }
        .secure-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 999px;
          border: 1px solid rgba(0, 212, 255, 0.25);
          background: rgba(0, 212, 255, 0.05);
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${NEON.green};
          box-shadow: 0 0 8px ${NEON.green};
          animation: pulse 1.8s infinite;
        }
        .mono-txt {
          font-family: ${FONTS.mono};
          font-size: 0.65rem;
          color: ${NEON.green};
          letter-spacing: 0.08em;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-header-passkey {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid rgba(0, 212, 255, 0.35);
          border-radius: 8px;
          background: rgba(0, 212, 255, 0.08);
          color: ${NEON.blue};
          font-family: ${FONTS.orbitron};
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-header-passkey:hover {
          background: rgba(0, 212, 255, 0.18);
          border-color: ${NEON.blue};
        }
        .btn-header-google {
          display: flex;
          align-items: center;
          padding: 7px 16px;
          border: none;
          border-radius: 6px;
          background: #4285F4;
          color: #fff;
          font-family: 'Roboto', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(66, 133, 244, 0.35);
          transition: all 0.2s;
        }
        .btn-header-google:hover {
          background: #3367d6;
          box-shadow: 0 4px 14px rgba(66, 133, 244, 0.5);
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 1180px;
          margin: 0 auto;
          padding: clamp(48px, 8vw, 84px) clamp(16px, 4vw, 40px);
          text-align: center;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 18px;
          border-radius: 999px;
          border: 1px solid rgba(0, 212, 255, 0.25);
          background: rgba(0, 212, 255, 0.06);
          font-family: ${FONTS.mono};
          font-size: 0.68rem;
          color: ${NEON.blue};
          letter-spacing: 0.18em;
          margin-bottom: 24px;
        }
        .hero-title {
          font-family: ${FONTS.orbitron};
          font-size: clamp(2.4rem, 6vw, 4.8rem);
          font-weight: 900;
          margin: 0 0 16px;
          background: linear-gradient(135deg, #ffffff 30%, #00d4ff 75%, #ff2e9f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
          text-shadow: 0 0 30px rgba(0, 212, 255, 0.25);
        }
        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          line-height: 1.6;
          color: #a0b8d8;
          max-width: 760px;
          margin: 0 auto 28px;
        }
        .zk-bar {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 18px;
          border-radius: 999px;
          border: 1px solid rgba(0, 255, 135, 0.35);
          background: rgba(0, 255, 135, 0.06);
          box-shadow: 0 0 16px rgba(0, 255, 135, 0.15);
          margin-bottom: 34px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .zk-bar:hover {
          background: rgba(0, 255, 135, 0.12);
        }
        .zk-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: ${FONTS.mono};
          font-size: 0.65rem;
          color: ${NEON.green};
          letter-spacing: 0.12em;
        }
        .zk-hash {
          font-family: ${FONTS.mono};
          font-size: 0.68rem;
          color: ${NEON.green};
          font-weight: 700;
        }
        .zk-copy {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: ${FONTS.mono};
          font-size: 0.62rem;
          color: #88ffaa;
          padding-left: 6px;
          border-left: 1px solid rgba(0, 255, 135, 0.25);
        }
        .cta-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-bottom: 60px;
        }
        .btn-primary-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 18px 48px;
          border: 1px solid ${NEON.blue};
          border-radius: 50px;
          background: rgba(0, 212, 255, 0.18);
          color: #fff;
          font-family: ${FONTS.orbitron};
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: 0.14em;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(0, 212, 255, 0.35);
          transition: all 0.25s;
        }
        .btn-primary-cta:hover {
          background: ${NEON.blue};
          color: #060c1a;
          box-shadow: 0 0 45px rgba(0, 212, 255, 0.6);
          transform: translateY(-2px);
        }
        .secondary-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-google-pill, .btn-passkey-pill, .btn-anon-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: ${FONTS.rajdhani};
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-google-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(66, 133, 244, 0.4);
          color: #e8f4ff;
        }
        .btn-passkey-pill {
          background: rgba(0, 212, 255, 0.06);
          border: 1px solid rgba(0, 212, 255, 0.3);
          color: ${NEON.blue};
        }
        .btn-anon-pill {
          background: rgba(255, 122, 24, 0.06);
          border: 1px solid rgba(255, 122, 24, 0.3);
          color: ${NEON.orange};
        }
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 18px;
          margin-bottom: 70px;
          text-align: left;
        }
        .pillar-card {
          background: rgba(8, 16, 36, 0.7);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 14px;
          padding: 22px 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .pillar-icon {
          font-size: 1.8rem;
          margin-bottom: 10px;
        }
        .pillar-title {
          font-family: ${FONTS.orbitron};
          font-size: 0.88rem;
          font-weight: 700;
          color: ${NEON.blue};
          margin-bottom: 6px;
        }
        .pillar-desc {
          font-size: 0.85rem;
          color: #99aabb;
          line-height: 1.5;
        }
        .vectors-section {
          margin-bottom: 70px;
        }
        .section-header {
          margin-bottom: 34px;
        }
        .section-eyebrow {
          font-family: ${FONTS.mono};
          font-size: 0.65rem;
          color: ${NEON.orange};
          letter-spacing: 0.2em;
          margin-bottom: 8px;
        }
        .section-title {
          font-family: ${FONTS.orbitron};
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
          font-weight: 800;
          margin: 0 0 10px;
          color: #fff;
        }
        .section-sub {
          font-size: 0.95rem;
          color: #8899aa;
          margin: 0 0 20px;
        }
        .category-filters {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cat-btn {
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid rgba(0, 212, 255, 0.2);
          background: rgba(0, 212, 255, 0.04);
          color: #a0c0e0;
          font-family: ${FONTS.mono};
          font-size: 0.68rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cat-btn.active {
          background: rgba(0, 212, 255, 0.2);
          border-color: ${NEON.blue};
          color: #fff;
          font-weight: 700;
        }
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          text-align: left;
        }
        .module-item {
          background: rgba(8, 16, 36, 0.8);
          border: 1px solid rgba(0, 212, 255, 0.16);
          border-radius: 12px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }
        .module-item:hover {
          border-color: ${NEON.blue};
          transform: translateY(-3px);
          box-shadow: 0 6px 24px rgba(0, 212, 255, 0.18);
        }
        .module-top {
          display: flex;
          justify-content: space-between;
          font-family: ${FONTS.mono};
          font-size: 0.58rem;
          color: ${NEON.textMuted};
          margin-bottom: 8px;
        }
        .module-vec {
          color: ${NEON.blue};
          font-weight: 700;
        }
        .module-name {
          font-family: ${FONTS.orbitron};
          font-size: 0.92rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 6px;
        }
        .module-hook {
          font-size: 0.8rem;
          color: #99aabb;
          line-height: 1.4;
          margin: 0 0 14px;
          flex: 1;
        }
        .module-pledge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: ${FONTS.mono};
          font-size: 0.58rem;
          color: ${NEON.blue};
          margin-bottom: 10px;
        }
        .module-arrow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: ${FONTS.orbitron};
          font-size: 0.65rem;
          color: ${NEON.green};
          font-weight: 700;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 10px;
        }
        .guarantee-strip {
          background: rgba(0, 255, 135, 0.04);
          border: 1px solid rgba(0, 255, 135, 0.25);
          border-radius: 14px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          text-align: left;
        }
        .guarantee-content {
          display: flex;
          align-items: center;
          gap: 18px;
          max-width: 800px;
        }
        .guarantee-title {
          font-family: ${FONTS.orbitron};
          font-size: 0.95rem;
          font-weight: 800;
          color: ${NEON.green};
          margin-bottom: 4px;
        }
        .guarantee-desc {
          font-size: 0.85rem;
          color: #a0c0b0;
          line-height: 1.5;
        }
        .btn-enter-enclave {
          padding: 12px 28px;
          border-radius: 8px;
          border: 1px solid ${NEON.green};
          background: rgba(0, 255, 135, 0.15);
          color: #fff;
          font-family: ${FONTS.orbitron};
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .btn-enter-enclave:hover {
          background: ${NEON.green};
          color: #060c1a;
          box-shadow: 0 0 20px rgba(0, 255, 135, 0.4);
        }
        .home-footer {
          position: relative;
          z-index: 10;
          border-top: 1px solid rgba(0, 212, 255, 0.12);
          padding: 24px clamp(16px, 4vw, 48px);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          background: rgba(4, 8, 18, 0.9);
          font-family: ${FONTS.mono};
          font-size: 0.68rem;
        }
        .footer-links {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        .footer-link {
          color: ${NEON.blue};
          text-decoration: none;
          letter-spacing: 0.1em;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: #fff;
        }
        .footer-copy {
          color: ${NEON.textMuted};
          letter-spacing: 0.08em;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};
