import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Eye, Cpu, Globe, ArrowRight,
  CheckCircle, Fingerprint, Loader2,
  Zap, Database, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../AuthContext';

// ── Brand palette ──────────────────────────────────────────────
const C = {
  blue:    '#00D4FF',
  magenta: '#FF2E9F',
  orange:  '#FF6B00',
  green:   '#00FF87',
  bg:      '#060C1A',
  surface: 'rgba(255,255,255,0.025)',
  border:  'rgba(0,212,255,0.12)',
} as const;

// ── Feature definitions ────────────────────────────────────────
const FEATURES = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Digital Identity Protection',
    desc: '16-vector identity scanning across email, social, device, financial, and dark web surfaces.',
    badge: 'ACTIVE', badgeColor: C.blue,
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: 'Continuous Breach Monitoring',
    desc: 'Real-time surveillance of data broker listings, credential leaks, and public exposure.',
    badge: 'LIVE', badgeColor: C.green,
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Client-Side Encryption',
    desc: 'AES-GCM zero-knowledge encryption — your data is encrypted before it ever leaves your device.',
    badge: 'ACTIVE', badgeColor: C.blue,
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'Architect AI',
    desc: 'Sovereign AI assistant that helps you understand, restore, and defend your digital identity.',
    badge: 'ACTIVE', badgeColor: C.blue,
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: '5-Pillar Shield Platform',
    desc: 'Integrated defense across Polymer, Unosecur, Nymiz, PrivacyProctor, and Prisma AIRS.',
    badge: 'ACTIVE', badgeColor: C.blue,
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Erasure Engine',
    desc: 'Automated data broker opt-out and removal requests across major aggregators.',
    badge: 'LIVE', badgeColor: C.green,
  },
];

const AUTHORITY_CARDS = [
  {
    icon: '🏛️',
    title: 'Enterprise-Grade Encryption',
    stat: 'AES-256-GCM',
    desc: 'Military-standard client-side encryption. Your data is encrypted before it ever leaves your device.',
  },
  {
    icon: '🔑',
    title: 'FIDO2 Passkey Auth',
    stat: 'Passwordless',
    desc: 'WebAuthn FIDO2 bound to your device. No passwords. No breach vectors. Pure biometric sovereignty.',
  },
  {
    icon: '⚡',
    title: 'Zero-Knowledge Architecture',
    stat: '0 Data Exposed',
    desc: 'We operate on a strict zero-knowledge model. Even our engineers cannot access your identity data.',
  },
  {
    icon: '🛡️',
    title: 'Google OAuth 2.0 Verified',
    stat: 'OAuth Secured',
    desc: 'Google-verified OAuth 2.0. Your Google credentials are never shared with or stored by us.',
  },
];

// ── Google brand button (official spec) ────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface GoogleBtnProps {
  onClick: () => void;
  loading?: boolean;
  fullWidth?: boolean;
  id?: string;
}

const GoogleSignInButton = ({ onClick, loading = false, fullWidth = false, id }: GoogleBtnProps) => (
  <motion.button
    id={id}
    whileHover={{ scale: 1.015, boxShadow: '0 6px 22px rgba(66,133,244,0.5)' }}
    whileTap={{ scale: 0.975 }}
    onClick={onClick}
    disabled={loading}
    style={{
      backgroundColor: '#4285F4',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      padding: '2px 20px 2px 2px',
      fontFamily: 'Roboto, Arial, sans-serif',
      fontWeight: 500,
      fontSize: 15,
      cursor: loading ? 'wait' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0,
      boxShadow: '0 4px 14px rgba(66,133,244,0.35)',
      transition: 'background-color 0.2s',
      width: fullWidth ? '100%' : undefined,
    }}
    aria-label={loading ? 'Signing in with Google…' : 'Sign in with Google'}
  >
    <div style={{
      background: '#fff', borderRadius: 4, padding: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginRight: 14, flexShrink: 0,
    }}>
      {loading
        ? <Loader2 size={18} color="#4285F4" style={{ animation: 'spin 1s linear infinite' }} />
        : <GoogleIcon />}
    </div>
    <span style={{ flex: 1, textAlign: 'left', paddingRight: 6, letterSpacing: '0.2px' }}>
      {loading ? 'Signing in…' : 'Sign in with Google'}
    </span>
  </motion.button>
);

// ── Animated stat counter ──────────────────────────────────────
const AnimatedStat = ({ value, label }: { value: string; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: 34, fontWeight: 900,
          background: `linear-gradient(135deg, ${C.orange}, ${C.magenta})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}
      </motion.div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', marginTop: 4, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const LandingPage = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      await login();
    } catch {
      setGoogleLoading(false);
      navigate('/login');
    }
  };

  // Scroll-restoration for hash links
  useEffect(() => {
    if (window.location.hash === '#features') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: '#fff', fontFamily: 'Inter, Roboto, Arial, sans-serif', overflowX: 'hidden' }}>

      {/* ── Backgrounds ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(0,212,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.035) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
      }} />
      <div style={{
        position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
        width: 1000, height: 700, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: -200, right: -100,
        width: 600, height: 600, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(255,46,159,0.06) 0%, transparent 70%)',
      }} />

      {/* ── Nav ── */}
      <nav style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 48px',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        backdropFilter: 'blur(12px)',
        background: 'rgba(6,12,26,0.8)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg viewBox="0 0 40 40" width={36} height={36} style={{ filter: `drop-shadow(0 0 8px ${C.blue})`, flexShrink: 0 }} aria-hidden="true">
            <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={C.blue} strokeWidth="1.5" />
            <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="none" stroke={C.magenta} strokeWidth="1" opacity="0.7" />
            <polygon points="20,14 26,18 26,22 20,26 14,22 14,18" fill={C.orange} fillOpacity="0.85" stroke={C.orange} strokeWidth="0.5" />
          </svg>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.1em', color: '#fff' }}>Agape Sovereign AI</div>
            <div style={{ fontSize: 8, color: C.blue, fontFamily: 'monospace', letterSpacing: '0.25em', opacity: 0.8, marginTop: 2 }}>DIGITAL IDENTITY DEFENSE</div>
          </div>
        </div>

        {/* Secure badge — desktop only */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 9, color: 'rgba(0,212,255,0.7)', fontFamily: 'monospace',
            letterSpacing: '0.14em', border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 100, padding: '5px 12px',
            background: 'rgba(0,212,255,0.04)',
          }}
          className="hide-mobile"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue }}
          />
          SECURE CONNECTION
        </motion.div>

        {/* Nav actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              id="nav-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(0,212,255,0.07)', color: C.blue,
                border: `1px solid rgba(0,212,255,0.25)`, borderRadius: 10,
                padding: '9px 18px', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.12em', cursor: 'pointer',
              }}
            >
              GO TO DASHBOARD
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                id="nav-passkey-btn"
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(0,212,255,0.06)', color: C.blue,
                  border: `1px solid rgba(0,212,255,0.25)`, borderRadius: 10,
                  padding: '9px 18px', fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.12em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <Fingerprint size={13} /> PASSKEY
              </motion.button>
              <GoogleSignInButton
                id="nav-google-btn"
                onClick={handleGoogleSignIn}
                loading={googleLoading}
              />
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', zIndex: 1,
        textAlign: 'center', padding: '96px 32px 80px',
        maxWidth: 860, margin: '0 auto',
      }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

          {/* Eyebrow pill */}
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgba(0,212,255,0)', '0 0 16px rgba(0,212,255,0.25)', '0 0 0px rgba(0,212,255,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,212,255,0.06)', border: `1px solid rgba(0,212,255,0.2)`,
              borderRadius: 100, padding: '7px 20px',
              fontSize: 10, letterSpacing: '0.28em', color: C.blue,
              fontFamily: 'monospace', marginBottom: 36,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 5, height: 5, borderRadius: '50%', background: C.blue }}
            />
            SOVEREIGN DIGITAL IDENTITY PLATFORM
          </motion.div>

          {/* H1 */}
          <h1 style={{
            fontSize: 'clamp(38px, 6.5vw, 76px)',
            fontWeight: 900, lineHeight: 1.06,
            margin: '0 0 10px',
            background: `linear-gradient(135deg, #ffffff 35%, ${C.blue} 70%, ${C.magenta} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '-0.03em',
          }}>
            Agape Sovereign AI
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 'clamp(14px, 2vw, 19px)',
            color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
            maxWidth: 600, margin: '0 auto 24px',
          }}>
            Your digital identity is exposed across 16 attack surfaces. We scan, monitor, and defend every one — with zero-knowledge encryption and AI-powered sovereignty.
          </p>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 24, flexWrap: 'wrap',
              margin: '0 auto 48px', maxWidth: 640,
              padding: '14px 24px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, background: 'rgba(255,255,255,0.02)',
            }}
            aria-label="Security certifications"
          >
            {[
              { icon: '🔒', label: 'Zero-Knowledge' },
              { icon: '🛡️', label: 'AES-256-GCM' },
              { icon: '🔑', label: 'FIDO2 Passkey' },
              { icon: '☁️', label: 'Firebase Secured' },
            ].map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  {item.label}
                </div>
              </React.Fragment>
            ))}
          </motion.div>

          {/* Error */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                maxWidth: 360, margin: '0 auto 16px',
                padding: '10px 14px', background: 'rgba(255,107,0,0.08)',
                border: '1px solid rgba(255,107,0,0.3)', borderRadius: 10,
                color: '#ffaa66', fontSize: 12, fontFamily: 'monospace',
              }}
            >
              ⚠ {authError}
            </motion.div>
          )}

          {/* CTA group */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 360, margin: '0 auto' }}>
            {user ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                id="hero-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                style={{
                  width: '100%', padding: '15px 28px',
                  background: 'rgba(0,212,255,0.07)',
                  border: `1px solid rgba(0,212,255,0.3)`,
                  borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14,
                  letterSpacing: '0.06em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <Zap size={16} color={C.blue} /> Go to Dashboard
              </motion.button>
            ) : (
              <>
                {/* Primary: Google */}
                <GoogleSignInButton
                  id="hero-google-btn"
                  onClick={handleGoogleSignIn}
                  loading={googleLoading}
                  fullWidth
                />

                {/* Secondary: Passkey */}
                <motion.button
                  whileHover={{ scale: 1.015, borderColor: 'rgba(0,212,255,0.4)', background: 'rgba(0,212,255,0.07)' }}
                  whileTap={{ scale: 0.975 }}
                  id="hero-passkey-btn"
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%', padding: '14px 24px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid rgba(0,212,255,0.2)`,
                    borderRadius: 8, color: 'rgba(255,255,255,0.7)',
                    fontWeight: 600, fontSize: 13, letterSpacing: '0.04em',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  <Fingerprint size={16} color={C.blue} />
                  or use a Passkey →
                </motion.button>

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em', marginTop: 2 }}>
                  No credit card · No data stored unencrypted · Cancel anytime
                </p>
              </>
            )}

            <a
              href="#features"
              style={{
                fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none',
                letterSpacing: '0.16em', fontFamily: 'monospace',
                display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
              }}
            >
              LEARN MORE <ArrowRight size={11} />
            </a>
          </div>

        </motion.div>
      </section>

      {/* ── Authority Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid rgba(0,212,255,0.08)',
          borderBottom: '1px solid rgba(0,212,255,0.08)',
          background: 'rgba(0,212,255,0.02)',
          padding: '44px 48px',
        }}
      >
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {AUTHORITY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.45 }}
              style={{
                padding: '22px 20px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, rgba(0,212,255,0.12), rgba(255,46,159,0.1))`,
                border: `1px solid rgba(0,212,255,0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{card.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>{card.title}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.blue, letterSpacing: '-0.02em' }}>{card.stat}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{card.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Stats strip ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto',
        padding: '40px 48px',
        display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap',
      }}>
        {[
          { value: '16', label: 'Identity Vectors' },
          { value: '5', label: 'Shield Pillars' },
          { value: '256-bit', label: 'AES-GCM Encryption' },
          { value: '100%', label: 'Client-Side Privacy' },
        ].map((s) => <AnimatedStat key={s.label} value={s.value} label={s.label} />)}
      </div>

      {/* ── Features ── */}
      <section
        id="features"
        style={{
          position: 'relative', zIndex: 1,
          padding: '80px 48px', maxWidth: 1100, margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.28em', color: C.blue, fontFamily: 'monospace', marginBottom: 16 }}>
            PLATFORM CAPABILITIES
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, margin: 0, color: '#fff' }}>
            Everything you need to reclaim your identity
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderTop: `2px solid rgba(0,212,255,0.3)`,
                borderRadius: 16, padding: '26px 22px',
                transition: 'border-top-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderTopColor = C.blue; (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,212,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderTopColor = 'rgba(0,212,255,0.3)'; (e.currentTarget as HTMLDivElement).style.background = C.surface; }}
            >
              {/* Badge */}
              <div style={{
                display: 'inline-block', marginBottom: 14,
                fontSize: 8, letterSpacing: '0.2em', padding: '3px 8px',
                borderRadius: 4, fontFamily: 'monospace', fontWeight: 700,
                background: `${f.badgeColor}15`,
                color: f.badgeColor,
                border: `1px solid ${f.badgeColor}33`,
              }}>
                {f.badge}
              </div>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, rgba(255,46,159,0.18), rgba(0,212,255,0.18))`,
                border: `1px solid rgba(0,212,255,0.2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.blue, marginBottom: 14,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <motion.section
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        style={{
          position: 'relative', zIndex: 1,
          textAlign: 'center', padding: '90px 48px 110px',
          borderTop: '1px solid rgba(0,212,255,0.08)',
        }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,46,159,0.06)', border: '1px solid rgba(255,46,159,0.2)',
          borderRadius: 100, padding: '6px 16px',
          fontSize: 10, letterSpacing: '0.22em', color: C.magenta,
          fontFamily: 'monospace', marginBottom: 28,
        }}>
          <AlertTriangle size={10} /> YOUR DATA IS EXPOSED RIGHT NOW
        </div>

        <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, margin: '0 0 16px', color: '#fff', lineHeight: 1.15 }}>
          Your digital identity is exposed.<br />Let's fix that.
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 44, maxWidth: 440, margin: '0 auto 44px', lineHeight: 1.65 }}>
          Join thousands securing their digital sovereignty. Google sign-in takes 30 seconds. Your data stays yours — always encrypted, always sovereign.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          {user ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              id="cta-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'rgba(0,212,255,0.06)', color: '#fff',
                border: `1px solid rgba(0,212,255,0.25)`, borderRadius: 10,
                padding: '16px 32px', fontWeight: 700, fontSize: 14,
                letterSpacing: '0.1em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              GO TO DASHBOARD
            </motion.button>
          ) : (
            <>
              <GoogleSignInButton
                id="cta-google-btn"
                onClick={handleGoogleSignIn}
                loading={googleLoading}
              />
              <motion.button
                whileHover={{ scale: 1.03, borderColor: 'rgba(0,212,255,0.45)' }}
                whileTap={{ scale: 0.97 }}
                id="cta-passkey-btn"
                onClick={() => navigate('/login')}
                style={{
                  background: 'rgba(0,212,255,0.05)', color: '#fff',
                  border: `1px solid rgba(0,212,255,0.22)`, borderRadius: 10,
                  padding: '16px 28px', fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.08em', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Fingerprint size={16} color={C.blue} /> Use Passkey
              </motion.button>
            </>
          )}
        </div>
      </motion.section>

      {/* ── Footer (OAuth-compliant) ── */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '22px 48px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        backdropFilter: 'blur(12px)',
        background: 'rgba(4,8,18,0.6)',
      }}>
        {/* Links */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href="/terms"
            rel="terms-of-service"
            id="footer-terms-link"
            style={{
              fontSize: 10, color: C.blue, textDecoration: 'none',
              letterSpacing: '0.18em', fontFamily: 'monospace', fontWeight: 700,
              textShadow: `0 0 10px ${C.blue}66`, transition: 'text-shadow 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.textShadow = `0 0 18px ${C.blue}`)}
            onMouseLeave={e => (e.currentTarget.style.textShadow = `0 0 10px ${C.blue}66`)}
          >
            TERMS OF SERVICE
          </a>
          <a
            href="/privacy"
            rel="privacy-policy"
            id="footer-privacy-link"
            style={{
              fontSize: 10, color: C.orange, textDecoration: 'none',
              letterSpacing: '0.18em', fontFamily: 'monospace', fontWeight: 700,
              textShadow: `0 0 10px ${C.orange}66`, transition: 'text-shadow 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.textShadow = `0 0 18px ${C.orange}`)}
            onMouseLeave={e => (e.currentTarget.style.textShadow = `0 0 10px ${C.orange}66`)}
          >
            PRIVACY POLICY
          </a>
          <a
            href="/contact"
            id="footer-contact-link"
            style={{
              fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
              letterSpacing: '0.18em', fontFamily: 'monospace', fontWeight: 700,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            CONTACT
          </a>
        </div>

        {/* Copyright */}
        <span style={{
          fontSize: 10, color: C.magenta, letterSpacing: '0.18em',
          fontFamily: 'monospace', fontWeight: 700,
          textShadow: `0 0 10px ${C.magenta}66`,
        }}>
          © {new Date().getFullYear()} AGAPE SOVEREIGN AI
        </span>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hide-mobile { }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};
