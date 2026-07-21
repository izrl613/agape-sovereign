import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonButton } from './ui/NeonElements';

const PILLARS: Record<string, { label: string; tagline: string; color: string; accentBg: string }> = {
  POLYMER: { label: 'POLYMER', tagline: 'Identity Exposure', color: '#FF2E9F', accentBg: 'rgba(255,46,159,0.06)' },
  UNOSECUR: { label: 'UNOSECUR', tagline: 'Social & Mobile', color: '#FF7A18', accentBg: 'rgba(255,122,24,0.06)' },
  NYMIZ: { label: 'NYMIZ', tagline: 'Personal Vectors', color: '#00D4FF', accentBg: 'rgba(0,212,255,0.06)' },
  PRIVACY_PROCTOR: { label: 'PRIVACY PROCTOR', tagline: 'Deep Web & Finance', color: '#A855F7', accentBg: 'rgba(168,85,247,0.06)' },
};

const DIFF_MODULES = [
  { id: 'email', vector: 'V-01', label: 'Email Exposure', icon: '📧', severity: 92, pillar: 'POLYMER', nuked: 3, knoxed: 1 },
  { id: 'broker', vector: 'V-02', label: 'Data Broker', icon: '📊', severity: 85, pillar: 'POLYMER', nuked: 2, knoxed: 2 },
  { id: 'browser', vector: 'V-03', label: 'Browser Fingerprint', icon: '🌐', severity: 78, pillar: 'POLYMER', nuked: 1, knoxed: 3 },
  { id: 'cloud', vector: 'V-04', label: 'Cloud Exposure', icon: '☁️', severity: 65, pillar: 'POLYMER', nuked: 0, knoxed: 4 },
  { id: 'social', vector: 'V-05', label: 'Social Media', icon: '👥', severity: 88, pillar: 'UNOSECUR', nuked: 4, knoxed: 0 },
  { id: 'mobile', vector: 'V-06', label: 'Mobile Identity', icon: '📱', severity: 72, pillar: 'UNOSECUR', nuked: 1, knoxed: 2 },
  { id: 'location', vector: 'V-07', label: 'Location History', icon: '📍', severity: 60, pillar: 'UNOSECUR', nuked: 0, knoxed: 3 },
  { id: 'iot', vector: 'V-08', label: 'IoT Exposure', icon: '🔌', severity: 55, pillar: 'UNOSECUR', nuked: 0, knoxed: 2 },
  { id: 'device', vector: 'V-09', label: 'Device Fingerprint', icon: '💻', severity: 70, pillar: 'NYMIZ', nuked: 1, knoxed: 2 },
  { id: 'password', vector: 'V-10', label: 'Credential Health', icon: '🔑', severity: 95, pillar: 'NYMIZ', nuked: 5, knoxed: 0 },
  { id: 'medical', vector: 'V-11', label: 'Medical Data', icon: '🏥', severity: 80, pillar: 'NYMIZ', nuked: 2, knoxed: 1 },
  { id: 'biometric', vector: 'V-12', label: 'Biometric Risk', icon: '👁️', severity: 90, pillar: 'NYMIZ', nuked: 3, knoxed: 1 },
  { id: 'deepweb', vector: 'V-13', label: 'Deep Web Scan', icon: '🌌', severity: 82, pillar: 'PRIVACY_PROCTOR', nuked: 3, knoxed: 2 },
  { id: 'financial', vector: 'V-14', label: 'Financial Exposure', icon: '💰', severity: 75, pillar: 'PRIVACY_PROCTOR', nuked: 1, knoxed: 3 },
  { id: 'darkweb', vector: 'V-15', label: 'Dark Web Alert', icon: '🕵️', severity: 97, pillar: 'PRIVACY_PROCTOR', nuked: 6, knoxed: 0 },
  { id: 'behavioral', vector: 'V-16', label: 'Behavioral Profile', icon: '🧬', severity: 68, pillar: 'PRIVACY_PROCTOR', nuked: 0, knoxed: 4 },
];

function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const stars: { x: number; y: number; z: number; size: number; speed: number }[] = [];
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.length = 0;
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 3,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.3 + 0.1,
        });
      }
    };
    init();
    window.addEventListener('resize', init);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const alpha = 0.3 + s.z * 0.25;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.fill();
        s.y -= s.speed;
        if (s.y < -5) { s.y = canvas.height + 5; s.x = Math.random() * canvas.width; }
      }
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', init); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      {children}
    </div>
  );
}

function ThreatTicker() {
  const threats = [
    '⚠️ Dark web credential leak detected — V-15 (Severity: Critical)',
    '🔍 Scanning data broker listings — 47 new exposures found',
    '🛡️ Passkey-bound identity shield activated — V-10 KNOXED',
    '📡 Deep web crawl complete — 12 breach correlates identified',
    '⚡ Real-time AI analysis — Sovereign Score recalibrating...',
    '🔐 Zero-knowledge proof verified — Client-side encryption active',
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % threats.length), 3000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-9 overflow-hidden border-t" style={{ background: 'rgba(6,13,31,0.92)', backdropFilter: 'blur(8px)', borderColor: `${NEON.blue}22` }}>
      <div className="max-w-7xl mx-auto h-full flex items-center px-6">
        <span className="font-['Share_Tech_Mono'] text-xs animate-pulse mr-3 shrink-0" style={{ color: NEON.orange }}>LIVE</span>
        <div className="h-full flex items-center overflow-hidden">
          <span key={idx} className="font-['Share_Tech_Mono'] text-xs animate-fade-in" style={{ color: NEON.textMuted, animation: 'fade-in 0.5s ease' }}>
            {threats[idx]}
          </span>
        </div>
      </div>
    </div>
  );
}

export const LandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: NEON.bg }}>
      <Starfield />

      <div className="fixed top-[15%] right-[5%] w-[600px] h-[600px] pointer-events-none z-[1]" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[15%] left-[5%] w-[500px] h-[500px] pointer-events-none z-[1]" style={{ background: "radial-gradient(circle, rgba(255,46,159,0.03) 0%, transparent 70%)" }} />
      <div className="fixed top-[40%] left-[40%] w-[400px] h-[400px] pointer-events-none z-[1]" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.03) 0%, transparent 70%)" }} />

      <ThreatTicker />

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 md:py-4" style={{ background: scrollY > 20 ? 'rgba(6, 13, 31, 0.95)' : 'transparent', backdropFilter: 'blur(12px)', borderBottom: scrollY > 20 ? `1px solid ${NEON.blue}33` : 'none', transition: 'all 0.3s ease' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 80 80" className="w-9 h-9 md:w-10 md:h-10" style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
              <text x="40" y="46" textAnchor="middle" fill={NEON.blue} className="font-['Orbitron'] text-base font-black">AI</text>
            </svg>
            <span className="font-['Orbitron'] font-black text-lg md:text-xl tracking-tight" style={{ color: NEON.text }}>AGAPE SOVEREIGN</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }} onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }} onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a>
            <a href="/privacy" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy Policy</a>
            <a href="/terms" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms of Service</a>
            <a href="/contact" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/auth" className="hidden sm:inline-flex btn-neon neon-border py-2 px-4 rounded-lg text-white font-semibold text-xs md:text-sm" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
              Sign In
            </a>
            <button onClick={() => scrollToSection('cta')} className="btn-neon py-2 px-4 rounded-lg text-white font-semibold text-xs md:text-sm" style={{ background: GRADIENT_BORDER }}>
              Get Started
            </button>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: NEON.text }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3" style={{ animation: 'slideDown 0.2s ease' }}>
            {[
              { label: 'Features', action: () => scrollToSection('features') },
              { label: 'How It Works', action: () => scrollToSection('how-it-works') },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Contact', href: '/contact' },
              { label: 'Sign In', href: '/auth', accent: true },
            ].map(link => (
              link.href
                ? <a key={link.label} href={link.href} className="block py-2 px-4 rounded-lg text-sm font-medium" style={{ color: link.accent ? NEON.blue : NEON.textMuted, background: link.accent ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)' }} onClick={() => setMobileMenuOpen(false)}>{link.label}</a>
                : <button key={link.label} onClick={link.action} className="block w-full text-left py-2 px-4 rounded-lg text-sm font-medium" style={{ color: NEON.textMuted, background: 'rgba(255,255,255,0.02)' }}>{link.label}</button>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 px-4 md:px-6 z-10" id="hero">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border text-[0.6rem] md:text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.blue}44`, color: NEON.blue, background: 'rgba(0,212,255,0.06)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.blue }} />
                VERIFIED GOOGLE OAUTH PLATFORM
              </div>

              <h1 className="font-['Orbitron'] font-black leading-[1.05] mb-5" style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', color: NEON.text }}>
                YOUR DIGITAL IDENTITY
                <br />
                <span style={{ background: GRADIENT_BORDER, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  RECLAIMED. SECURED. SOVEREIGN.
                </span>
              </h1>

              <p className="text-base md:text-lg max-w-xl mb-8 leading-relaxed" style={{ color: NEON.textMuted }}>
                The world's first Digital Identity Federated Footprint (DIFF) intelligence platform.
                Scan, secure, and sovereign your identity across 16 attack vectors using AI-driven privacy architecture.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button onClick={() => scrollToSection('cta')} className="btn-neon py-3 px-7 rounded-lg text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2" style={{ background: GRADIENT_BORDER }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Start Your DIFF Scan
                </button>
                <button onClick={() => scrollToSection('features')} className="btn-neon neon-border py-3 px-7 rounded-lg text-white font-semibold text-sm md:text-base" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
                  Explore 16 Vectors
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[0.6rem] md:text-xs font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
                {[
                  { icon: <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />, label: 'SOC 2 Type II Certified' },
                  { icon: <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />, label: 'Zero-Knowledge Architecture' },
                  { icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />, label: 'End-to-End Encrypted' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: NEON.blue }}>{item.icon}</svg>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* DIFF Score Card */}
            <div className="relative">
              <GlassCard className="p-5 md:p-8" style={{ border: `1px solid ${NEON.blue}44`, background: 'linear-gradient(135deg, rgba(6,13,31,0.92) 0%, rgba(8,18,40,0.92) 100%)', boxShadow: `0 0 80px rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.1)` }}>
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div>
                    <div className="text-[0.55rem] md:text-[0.65rem] font-['Share_Tech_Mono'] tracking-widest mb-1" style={{ color: NEON.blue }}>DIFF SCORE</div>
                    <div className="text-[0.6rem] md:text-[0.7rem] font-medium" style={{ color: NEON.textMuted }}>Digital Identity Federated Footprint</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[0.55rem] md:text-[0.65rem] font-['Share_Tech_Mono'] tracking-widest mb-1" style={{ color: NEON.magenta }}>SOVEREIGN TIER</div>
                    <div className="font-['Orbitron'] font-black text-base md:text-xl" style={{ color: NEON.blue }}>KNOXED SOVEREIGN</div>
                  </div>
                </div>

                <div className="flex items-center justify-center mb-6 md:mb-8">
                  <div className="relative w-36 h-36 md:w-48 md:h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={NEON.magenta} />
                          <stop offset="50%" stopColor={NEON.blue} />
                          <stop offset="100%" stopColor={NEON.orange} />
                        </linearGradient>
                      </defs>
                      <circle cx="50%" cy="50%" r="42%" fill="none" stroke="#0a1a3a" strokeWidth="12" />
                      <circle cx="50%" cy="50%" r="42%" fill="none" stroke="url(#scoreGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray="248" strokeDashoffset="25" style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="font-['Orbitron'] font-black" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: NEON.text }}>87</div>
                      <div className="text-[0.55rem] md:text-[0.65rem] font-['Share_Tech_Mono'] tracking-widest mt-0.5" style={{ color: NEON.textMuted }}>SOVEREIGN SCORE</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  {[
                    { label: 'NUKED', count: '3', color: NEON.magenta, border: `${NEON.magenta}33` },
                    { label: 'KNOXED', count: '11', color: NEON.blue, border: `${NEON.blue}33` },
                    { label: 'MONITORED', count: '2', color: NEON.orange, border: `${NEON.orange}33` },
                  ].map(s => (
                    <div key={s.label} className="p-2 md:p-3 rounded-lg text-center" style={{ background: `rgba(255,255,255,0.03)`, border: `1px solid ${s.border}` }}>
                      <div className="font-['Orbitron'] font-black text-lg md:text-2xl mb-0.5" style={{ color: s.color }}>{s.count}</div>
                      <div className="text-[0.5rem] md:text-[0.6rem] font-['Share_Tech_Mono'] tracking-wider" style={{ color: NEON.textMuted }}>{s.label} VECTORS</div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="absolute -top-3 -right-3 hidden lg:block" style={{ animation: 'float 4s ease-in-out infinite', zIndex: 2 }}>
                <div className="px-3 py-1.5 rounded-full text-[0.6rem] font-['Share_Tech_Mono'] font-bold tracking-wider text-white flex items-center gap-1.5" style={{ background: GRADIENT_BORDER }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.orange }} />
                  LIVE THREAT INTEL
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <SectionReveal>
        <section id="features" className="py-16 md:py-24 px-4 md:px-6 z-10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-[0.6rem] md:text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.magenta}44`, color: NEON.magenta, background: 'rgba(255,46,159,0.05)' }}>
                16 IDENTITY VECTORS · 4 PILLARS
              </div>
              <h2 className="font-['Orbitron'] font-black mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: NEON.text }}>
                COMPLETE DIFF COVERAGE
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: NEON.textMuted }}>
                Each vector maps to a battle-tested privacy pillar. Real-time intelligence. Actionable remediation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {Object.entries(PILLARS).map(([key, pillar]) => (
                <GlassCard key={key} className="p-4 md:p-6 group relative overflow-hidden" style={{ border: `1px solid ${pillar.color}33`, background: `linear-gradient(135deg, ${pillar.accentBg} 0%, rgba(8,18,40,0.85) 100%)`, transition: 'all 0.4s ease' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${pillar.color}, transparent)`, transform: 'scaleX(0)', transition: 'transform 0.4s ease' }} />
                  <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-['Orbitron'] font-black text-[0.6rem] md:text-sm" style={{ background: pillar.accentBg, color: pillar.color }}>
                      {key === 'POLYMER' ? 'PL' : key === 'UNOSECUR' ? 'US' : key === 'NYMIZ' ? 'NY' : 'PP'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-['Orbitron'] font-bold text-xs md:text-sm truncate" style={{ color: pillar.color }}>{pillar.label}</div>
                      <div className="text-[0.55rem] md:text-[0.65rem] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>{pillar.tagline}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {DIFF_MODULES.filter(m => m.pillar === key).map(mod => (
                      <div key={mod.id} className="flex items-center gap-2 p-2 md:p-3 rounded-lg transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                        <span className="text-base md:text-xl shrink-0" style={{ filter: `drop-shadow(0 0 4px ${pillar.color})` }}>{mod.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[0.65rem] md:text-sm truncate" style={{ color: NEON.text }}>{mod.label}</div>
                          <div className="text-[0.5rem] md:text-[0.6rem] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>{mod.vector} · NUKED: {mod.nuked} · KNOXED: {mod.knoxed}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-['Orbitron'] font-bold text-xs md:text-lg" style={{ color: mod.severity > 70 ? NEON.magenta : mod.severity > 50 ? NEON.orange : NEON.blue }}>{mod.severity}</div>
                          <div className="text-[0.45rem] md:text-[0.55rem] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>SEV</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* How It Works */}
      <SectionReveal>
        <section id="how-it-works" className="py-16 md:py-24 px-4 md:px-6 z-10 relative" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.015) 50%, transparent 100%)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-[0.6rem] md:text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.orange}44`, color: NEON.orange, background: 'rgba(255,122,24,0.05)' }}>
                THREE PHASES TO SOVEREIGNTY
              </div>
              <h2 className="font-['Orbitron'] font-black mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: NEON.text }}>
                HOW IT WORKS
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: NEON.textMuted }}>
                From scan to sovereignty in three automated phases. No manual configuration required.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {[
                { number: '01', title: 'FEDERATED SCAN', color: NEON.blue, description: 'Architect AI deploys 16 parallel identity vectors across email, social, device, financial, medical, biometric, and dark web surfaces. Zero-knowledge client-side execution.', details: ['16 parallel vector scans', 'Client-side zero-knowledge', 'Real-time threat correlation', 'Sub-second completion'] },
                { number: '02', title: 'INTELLIGENCE ANALYSIS', color: NEON.magenta, description: 'AI correlates findings across vectors, assigns NUKED/KNOXED classifications, calculates sovereign score, and generates personalized remediation playbooks.', details: ['NUKED/KNOXED classification', 'Sovereign score (0-100)', 'Personalized playbooks', 'Cross-vector correlation'] },
                { number: '03', title: 'SOVEREIGN REMEDIATION', color: NEON.orange, description: 'One-click automated removal from data brokers, passkey binding, credential rotation, and continuous monitoring with real-time alerts.', details: ['Automated broker opt-out', 'Passkey/WebAuthn binding', 'Credential rotation', '24/7 continuous monitoring'] },
              ].map((step) => (
                <GlassCard key={step.number} className="p-5 md:p-8 relative group" style={{ border: `1px solid ${NEON.blue}22`, transition: 'all 0.4s ease' }}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" style={{ background: GRADIENT_BORDER }} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="font-['Orbitron'] font-black text-2xl md:text-3xl" style={{ color: NEON.textMuted, opacity: 0.3 }}>{step.number}</div>
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center" style={{ background: `${step.color}15`, color: step.color }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 md:w-7 md:h-7">
                        {step.number === '01' ? <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /><circle cx="12" cy="12" r="3" /></> :
                         step.number === '02' ? <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></> :
                         <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>}
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-['Orbitron'] font-bold text-base md:text-xl mb-3" style={{ color: NEON.text }}>{step.title}</h3>
                  <p className="mb-4 md:mb-6 text-sm md:text-base leading-relaxed" style={{ color: NEON.textMuted }}>{step.description}</p>
                  <ul className="space-y-1.5 md:space-y-2">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs md:text-sm" style={{ color: NEON.text }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style={{ color: NEON.blue }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* Compliance */}
      <SectionReveal>
        <section className="py-16 md:py-24 px-4 md:px-6 z-10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border text-[0.6rem] md:text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.blue}44`, color: NEON.blue, background: 'rgba(0,212,255,0.05)' }}>
                ENTERPRISE-GRADE COMPLIANCE
              </div>
              <h2 className="font-['Orbitron'] font-black mb-3" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: NEON.text }}>
                BUILT FOR VERIFICATION
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { title: 'SOC 2 Type II', desc: 'Annual independent audit' },
                { title: 'GDPR Compliant', desc: 'Article 25 by design' },
                { title: 'CCPA/CPRA Ready', desc: 'California privacy law' },
                { title: 'ISO 27001 Aligned', desc: 'Security management' },
                { title: 'Zero-Knowledge', desc: 'Client-side encryption' },
                { title: 'Open Source Core', desc: 'Transparent algorithms' },
                { title: 'Pen Tested', desc: 'Quarterly red team' },
                { title: 'Bug Bounty', desc: 'Active vulnerability program' },
              ].map(item => (
                <GlassCard key={item.title} className="p-4 md:p-6 text-center group" style={{ border: `1px solid ${NEON.blue}11`, transition: 'all 0.3s ease' }}>
                  <div className="font-['Orbitron'] font-bold text-xs md:text-sm mb-1" style={{ color: NEON.text }}>{item.title}</div>
                  <div className="text-[0.6rem] md:text-sm" style={{ color: NEON.textMuted }}>{item.desc}</div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <SectionReveal>
        <section id="cta" className="py-16 md:py-24 px-4 md:px-6 z-10 relative">
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="absolute inset-0 rounded-3xl opacity-20 blur-3xl" style={{ background: GRADIENT_BORDER, animation: 'pulse-glow 4s ease-in-out infinite' }} />
            <GlassCard className="relative p-8 md:p-16" style={{ border: `1px solid ${NEON.blue}44`, background: 'linear-gradient(135deg, rgba(6,13,31,0.95) 0%, rgba(8,18,40,0.95) 100%)' }}>
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border text-[0.6rem] md:text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.orange}44`, color: NEON.orange, background: 'rgba(255,122,24,0.05)' }}>
                READY TO RECLAIM YOUR SOVEREIGNTY
              </div>
              <h2 className="font-['Orbitron'] font-black mb-5" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: NEON.text }}>
                BEGIN YOUR DIFF ANALYSIS
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto mb-8" style={{ color: NEON.textMuted }}>
                Join 10,000+ sovereign individuals. Your first scan is free. No credit card. Pure sovereignty.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => window.location.href = '/auth'} className="btn-neon py-3 md:py-4 px-8 md:px-10 rounded-lg text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2" style={{ background: GRADIENT_BORDER }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Start Free DIFF Scan
                </button>
                <a href="/contact" className="btn-neon neon-border py-3 md:py-4 px-8 md:px-10 rounded-lg text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
                  Contact Enterprise Sales
                </a>
              </div>
              <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8" style={{ borderColor: `${NEON.blue}22` }}>
                <div className="flex items-center gap-2 text-xs md:text-sm font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: NEON.blue }}>
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                  Zero-knowledge · Client-side encryption · Your keys, your data
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: NEON.blue }}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  Setup in 60 seconds · No installation · Browser-native
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </SectionReveal>

      {/* Footer */}
      <footer className="py-10 md:py-12 px-4 md:px-6 border-t z-10 relative" style={{ borderColor: `${NEON.blue}22` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 80 80" className="w-7 h-7 md:w-8 md:h-8" style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }}>
                  <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
                  <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
                  <text x="40" y="46" textAnchor="middle" fill={NEON.blue} className="font-['Orbitron'] text-base font-black">AI</text>
                </svg>
                <span className="font-['Orbitron'] font-black text-base md:text-lg" style={{ color: NEON.text }}>AGAPE SOVEREIGN</span>
              </div>
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: NEON.textMuted }}>
                Reclaiming digital sovereignty through AI-driven identity intelligence.
                Your identity. Your rules. Your future.
              </p>
              <p className="text-[0.6rem] md:text-xs font-['Share_Tech_Mono'] mt-4" style={{ color: NEON.textMuted }}>
                DPO: dpo@agape.nyc · Security: security@sovereign.nyc · Legal: legal@agape.nyc
              </p>
            </div>

            <div>
              <h4 className="font-['Orbitron'] font-bold mb-3 text-xs md:text-sm" style={{ color: NEON.text }}>PRODUCT</h4>
              <ul className="space-y-1.5 text-xs md:text-sm">
                {['16 Identity Vectors', 'Architect AI', 'Passkey Authentication', 'Enterprise Solutions'].map(l => (
                  <li key={l}><a href={l === 'Enterprise Solutions' ? '/contact' : l === '16 Identity Vectors' ? '#features' : '/auth'} className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-['Orbitron'] font-bold mb-3 text-xs md:text-sm" style={{ color: NEON.text }}>COMPLIANCE</h4>
              <ul className="space-y-1.5 text-xs md:text-sm">
                <li><a href="/privacy" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy Policy</a></li>
                <li><a href="/terms" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms of Service</a></li>
                <li><a href="/contact" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Data Processing Agreement</a></li>
                <li><a href="/contact" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Security Whitepaper</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-['Orbitron'] font-bold mb-3 text-xs md:text-sm" style={{ color: NEON.text }}>CONTACT</h4>
              <ul className="space-y-1.5 text-xs md:text-sm" style={{ color: NEON.textMuted }}>
                <li>sovereignty@agape.nyc</li>
                <li className="font-['Share_Tech_Mono'] text-[0.6rem] md:text-xs tracking-wider">AGAPE SOVEREIGN ENCLAVE</li>
                <li className="font-['Share_Tech_Mono'] text-[0.6rem] md:text-xs tracking-wider">New York, NY 10001</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${NEON.blue}22` }}>
            <p className="text-xs md:text-sm font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
              © 2026 AGAPE SOVEREIGN ENCLAVE. All rights reserved.
            </p>
            <div className="flex items-center gap-4 md:gap-6">
              <a href="https://github.com/izrl613/agape-sovereign" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
              </a>
              <a href="/privacy" className="text-xs md:text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy</a>
              <a href="/terms" className="text-xs md:text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms</a>
              <a href="/contact" className="text-xs md:text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes grid-move { 0% { transform: translate(0, 0); } 100% { transform: translate(40px, 40px); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-right { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.35; transform: scale(1.05); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .btn-neon { position: relative; overflow: hidden; transition: all 0.3s ease; }
        .btn-neon::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%); opacity: 0; transition: opacity 0.3s ease; }
        .btn-neon:hover::before { opacity: 1; }
        .btn-neon:active { transform: scale(0.98); }
        .neon-border { border: 1px solid; border-color: #00D4FF44; }
        .neon-border:hover { border-color: #00D4FF; }
      `}</style>
    </div>
  );
};
