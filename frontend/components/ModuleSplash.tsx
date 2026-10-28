import React, { useEffect, useState } from 'react';
import { Shield, Lock, ArrowRight, X } from 'lucide-react';
import { NEON, GRADIENT, FONTS } from '../theme';
import { ModuleConfig } from '../module-config';
import { sha256Hex } from '../services/sha256Vault';

interface ModuleSplashProps {
  module: ModuleConfig;
  sovereignId: string | null;
  onEnter: () => void;
  onClose?: () => void;
}

export const ModuleSplash: React.FC<ModuleSplashProps> = ({
  module,
  sovereignId,
  onEnter,
  onClose,
}) => {
  const [vectorHash, setVectorHash] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let active = true;
    const compute = async () => {
      const seed = `${sovereignId || 'guest-session'}::vector::${module.id}::enclave-2026`;
      const hash = await sha256Hex(seed);
      if (active) setVectorHash(hash);
    };
    compute();
    return () => {
      active = false;
    };
  }, [module.id, sovereignId]);

  useEffect(() => {
    const start = Date.now();
    const duration = 8000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const copyHash = async () => {
    if (!vectorHash) return;
    try {
      await navigator.clipboard.writeText(vectorHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard error
    }
  };

  const formattedHash = vectorHash
    ? vectorHash.match(/.{1,8}/g)?.join(' · ').toUpperCase()
    : 'COMPUTING SHA-256 VECTOR PROOF…';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 24, 0.94)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 680,
          background: 'rgba(8, 16, 36, 0.98)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: 18,
          boxShadow: '0 0 50px rgba(0, 212, 255, 0.2), inset 0 0 20px rgba(0, 212, 255, 0.05)',
          padding: 'clamp(22px, 4vw, 36px)',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Grid Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: GRADIENT,
          }}
        />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close splash"
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'none',
              border: 'none',
              color: NEON.textMuted,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.62rem',
              color: NEON.orange,
              letterSpacing: '0.18em',
              border: '1px solid rgba(255, 122, 24, 0.4)',
              background: 'rgba(255, 122, 24, 0.1)',
              borderRadius: 999,
              padding: '4px 12px',
            }}
          >
            IDENTITY VECTOR ENCLAVE
          </span>
          <span style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.green, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: NEON.green, boxShadow: `0 0 8px ${NEON.green}` }} />
            ZERO-KNOWLEDGE READY
          </span>
        </div>

        {/* Headline */}
        <h2
          style={{
            margin: '0 0 10px',
            fontFamily: FONTS.orbitron,
            fontSize: 'clamp(1.25rem, 3vw, 1.65rem)',
            fontWeight: 900,
            color: NEON.blue,
            textShadow: `0 0 16px ${NEON.blue}66`,
            letterSpacing: '0.04em',
          }}
        >
          {module.splash.headline}
        </h2>

        {/* Narrative */}
        <p
          style={{
            margin: '0 0 20px',
            fontFamily: FONTS.rajdhani,
            fontSize: '1rem',
            color: '#ccddee',
            lineHeight: 1.55,
          }}
        >
          {module.splash.narrative}
        </p>

        {/* Privacy Pledge Card */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(0, 212, 255, 0.04)',
            border: '1px solid rgba(0, 212, 255, 0.18)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Shield size={14} color={NEON.blue} />
            <span style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.blue, letterSpacing: '0.12em' }}>
              SOVEREIGN ENCLAVE PRIVACY PLEDGE
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: FONTS.rajdhani,
              fontSize: '0.85rem',
              color: NEON.textMuted,
              lineHeight: 1.5,
            }}
          >
            {module.splash.privacyPledge}
          </p>
        </div>

        {/* SHA-256 ID Enclave Hash Banner */}
        <div
          onClick={copyHash}
          title="Click to copy SHA-256 ID"
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(0, 255, 135, 0.06)',
            border: '1px solid rgba(0, 255, 135, 0.3)',
            cursor: 'pointer',
            marginBottom: 20,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: '0.58rem', color: NEON.green, letterSpacing: '0.14em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={11} color={NEON.green} />
              CRYPTOGRAPHIC VECTOR SHA-256 ID
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: '0.58rem', color: copied ? NEON.green : NEON.textMuted }}>
              {copied ? 'COPIED TO CLIPBOARD ✓' : 'CLICK TO COPY'}
            </span>
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: '0.68rem',
              color: NEON.green,
              letterSpacing: '0.08em',
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}
          >
            {formattedHash}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: GRADIENT,
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onEnter}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 24px',
            borderRadius: 12,
            border: `1px solid ${NEON.blue}`,
            background: 'rgba(0, 212, 255, 0.15)',
            color: '#ffffff',
            fontFamily: FONTS.orbitron,
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            cursor: 'pointer',
            boxShadow: `0 0 20px rgba(0, 212, 255, 0.25)`,
            transition: 'all 0.2s ease',
          }}
        >
          ENTER {module.name.toUpperCase()} AGENT <ArrowRight size={16} />
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};
