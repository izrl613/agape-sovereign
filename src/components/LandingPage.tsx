import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Eye, Cpu, Globe, ArrowRight, CheckCircle, Fingerprint, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

const NEON_BLUE = '#00D4FF';
const NEON_MAGENTA = '#FF2E9F';
const NEON_ORANGE = '#FF6B00';

const FEATURES = [
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Digital Identity Protection',
    desc: '16-vector identity scanning across email, social, device, financial, and dark web surfaces.',
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: 'Continuous Breach Monitoring',
    desc: 'Real-time surveillance of data broker listings, credential leaks, and public exposure.',
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Client-Side Encryption',
    desc: 'AES-GCM zero-knowledge encryption — your data is encrypted before it ever leaves your device.',
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'Architect AI',
    desc: 'Sovereign AI assistant that helps you understand, restore, and defend your digital identity.',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: '5-Pillar Shield Platform',
    desc: 'Integrated defense across Polymer, Unosecur, Nymiz, PrivacyProctor, and Prisma AIRS.',
  },
  {
    icon: <CheckCircle className="w-6 h-6" />,
    title: 'Erasure Engine',
    desc: 'Automated data broker opt-out and removal requests across major aggregators.',
  },
];

// ─── Google brand icon ───────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const LandingPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B1020',
        color: '#fff',
        fontFamily: 'Inter, Roboto, Arial, sans-serif',
        overflowX: 'hidden',
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          background: 'radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 48px',
          borderBottom: '1px solid rgba(0,212,255,0.1)',
          backdropFilter: 'blur(8px)',
          background: 'rgba(11,16,32,0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 40 40" width={36} height={36} style={{ filter: `drop-shadow(0 0 8px ${NEON_BLUE})` }}>
            <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={NEON_BLUE} strokeWidth="1.5" />
            <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="none" stroke={NEON_MAGENTA} strokeWidth="1" opacity="0.7" />
            <polygon points="20,14 26,18 26,22 20,26 14,22 14,18" fill={NEON_ORANGE} fillOpacity="0.8" stroke={NEON_ORANGE} strokeWidth="0.5" />
          </svg>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.12em', color: '#fff' }}>
              Agape Sovereign AI
            </div>
            <div style={{ fontSize: 9, color: NEON_BLUE, fontFamily: 'monospace', letterSpacing: '0.2em', opacity: 0.8 }}>
              DIGITAL IDENTITY DEFENSE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'rgba(0,212,255,0.07)',
              color: NEON_BLUE,
              border: `1px solid rgba(0,212,255,0.25)`,
              borderRadius: 10,
              padding: '9px 18px',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Fingerprint size={14} /> PASSKEY
          </button>
          <button
            onClick={async () => {
              setGoogleLoading(true);
              try { await login(); }
              catch { setGoogleLoading(false); navigate('/login'); }
            }}
            disabled={googleLoading}
            style={{
              background: `linear-gradient(135deg, ${NEON_MAGENTA}, ${NEON_BLUE})`,
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.08em',
              cursor: googleLoading ? 'wait' : 'pointer',
              boxShadow: `0 0 16px rgba(0,212,255,0.25)`,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {googleLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
            SIGN IN
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '100px 48px 80px',
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0,212,255,0.08)',
              border: `1px solid rgba(0,212,255,0.2)`,
              borderRadius: 100,
              padding: '6px 18px',
              fontSize: 11,
              letterSpacing: '0.25em',
              color: NEON_BLUE,
              fontFamily: 'monospace',
              marginBottom: 32,
            }}
          >
            SOVEREIGN DIGITAL IDENTITY PLATFORM
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: '0 0 24px',
              background: `linear-gradient(135deg, #fff 40%, ${NEON_BLUE})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            Agape Sovereign AI
          </h1>

          <p
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.7,
              maxWidth: 640,
              margin: '0 auto 48px',
            }}
          >
            Take back control of your digital life. Agape Sovereign AI is an advanced privacy and
            identity protection platform that scans, monitors, and defends your personal data across
            16 identity vectors — from email breaches and dark web exposure to data broker listings
            and AI biometric risks.
          </p>

          {/* ── Auth CTA panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 380, margin: '0 auto' }}>
            {/* Sign in with Google */}
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(66,133,244,0.55)' }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                setGoogleLoading(true);
                try { await login(); }
                catch { setGoogleLoading(false); navigate('/login'); }
              }}
              disabled={googleLoading}
              style={{
                width: '100%',
                padding: '15px 28px',
                background: 'rgba(66,133,244,0.1)',
                border: '1px solid rgba(66,133,244,0.3)',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.06em',
                cursor: googleLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 0 20px rgba(66,133,244,0.12)',
                transition: 'all 0.2s',
              }}
            >
              {googleLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
              {googleLoading ? 'Signing in…' : 'Sign in with Google'}
            </motion.button>

            {/* Login with Passkey */}
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(0,212,255,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '15px 28px',
                background: 'rgba(0,212,255,0.05)',
                border: `1px solid rgba(0,212,255,0.2)`,
                borderRadius: 12,
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s',
              }}
            >
              <Fingerprint size={18} color={NEON_BLUE} style={{ flexShrink: 0 }} />
              Login with Passkey
            </motion.button>

            <a
              href="#features"
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
                letterSpacing: '0.15em',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
              }}
            >
              LEARN MORE <ArrowRight size={12} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(0,212,255,0.08)',
          borderBottom: '1px solid rgba(0,212,255,0.08)',
          background: 'rgba(0,212,255,0.03)',
          padding: '32px 48px',
          display: 'flex',
          justifyContent: 'center',
          gap: 64,
          flexWrap: 'wrap',
        }}
      >
        {[
          { value: '16', label: 'Identity Vectors' },
          { value: '5', label: 'Shield Pillars' },
          { value: '256-bit', label: 'AES-GCM Encryption' },
          { value: '100%', label: 'Client-Side Privacy' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${NEON_ORANGE}, ${NEON_MAGENTA})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '80px 48px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.25em',
              color: NEON_BLUE,
              fontFamily: 'monospace',
              marginBottom: 16,
            }}
          >
            PLATFORM CAPABILITIES
          </div>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              margin: 0,
              color: '#fff',
            }}
          >
            Everything you need to reclaim your identity
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(0,212,255,0.12)',
                borderRadius: 16,
                padding: '28px 24px',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, rgba(255,46,159,0.2), rgba(0,212,255,0.2))`,
                  border: `1px solid rgba(0,212,255,0.2)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: NEON_BLUE,
                  marginBottom: 16,
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '80px 48px 100px',
          borderTop: '1px solid rgba(0,212,255,0.08)',
        }}
      >
        <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 16px' }}>
          Ready to take control?
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 40 }}>
          Sovereign identity protection starts now. No data is stored unencrypted.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={async () => {
              setGoogleLoading(true);
              try { await login(); }
              catch { setGoogleLoading(false); navigate('/login'); }
            }}
            disabled={googleLoading}
            style={{
              background: `linear-gradient(135deg, ${NEON_MAGENTA}, ${NEON_BLUE})`,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 36px',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              boxShadow: `0 0 28px rgba(0,212,255,0.3)`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {googleLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <GoogleIcon />}
            {googleLoading ? 'SIGNING IN…' : 'SIGN IN WITH GOOGLE'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              background: 'rgba(0,212,255,0.06)',
              color: '#fff',
              border: `1px solid rgba(0,212,255,0.25)`,
              borderRadius: 12,
              padding: '16px 28px',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Fingerprint size={16} color={NEON_BLUE} /> USE PASSKEY
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 1,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          backdropFilter: 'blur(8px)',
          background: 'rgba(6,12,26,0.5)',
        }}
      >
        {/* LEFT — Terms of Service in Blue */}
        <a
          href="/terms"
          id="footer-terms-link"
          style={{
            fontSize: 11,
            color: NEON_BLUE,
            textDecoration: 'none',
            letterSpacing: '0.18em',
            fontFamily: 'monospace',
            fontWeight: 700,
            textShadow: `0 0 10px ${NEON_BLUE}66`,
            transition: 'text-shadow 0.2s',
            flex: '1 1 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textShadow = `0 0 18px ${NEON_BLUE}`)}
          onMouseLeave={(e) => (e.currentTarget.style.textShadow = `0 0 10px ${NEON_BLUE}66`)}
        >
          TERMS OF SERVICE
        </a>

        {/* CENTER — Copyright in Magenta */}
        <span
          style={{
            fontSize: 11,
            color: NEON_MAGENTA,
            letterSpacing: '0.18em',
            fontFamily: 'monospace',
            fontWeight: 700,
            textShadow: `0 0 10px ${NEON_MAGENTA}66`,
            textAlign: 'center',
            flex: '1 1 0',
          }}
        >
          © {new Date().getFullYear()} AGAPE SOVEREIGN AI
        </span>

        {/* RIGHT — Privacy Policy in Orange */}
        <a
          href="/privacy"
          id="footer-privacy-link"
          style={{
            fontSize: 11,
            color: NEON_ORANGE,
            textDecoration: 'none',
            letterSpacing: '0.18em',
            fontFamily: 'monospace',
            fontWeight: 700,
            textShadow: `0 0 10px ${NEON_ORANGE}66`,
            transition: 'text-shadow 0.2s',
            textAlign: 'right',
            flex: '1 1 0',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textShadow = `0 0 18px ${NEON_ORANGE}`)}
          onMouseLeave={(e) => (e.currentTarget.style.textShadow = `0 0 10px ${NEON_ORANGE}66`)}
        >
          PRIVACY POLICY
        </a>
      </footer>
    </div>
  );
};
