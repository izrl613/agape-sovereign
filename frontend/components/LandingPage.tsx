import React, { useState, useEffect } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText, NeonButton } from './ui/NeonElements';

export const LandingPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: NEON.bg }}>
      {/* Animated grid background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          animation: "grid-move 20s linear infinite"
        }} />

      {/* Radial glows */}
      <div className="fixed top-[10%] right-[10%] w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)" }} />
      <div className="fixed bottom-[10%] left-[10%] w-[400px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,46,159,0.04) 0%, transparent 70%)" }} />

      {/* Top nav bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4" style={{ background: scrollY > 20 ? 'rgba(6, 13, 31, 0.95)' : 'transparent', backdropFilter: 'blur(12px)', borderBottom: scrollY > 20 ? `1px solid ${NEON.blue}33` : 'none', transition: 'all 0.3s ease' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 80 80" className="w-10 h-10" style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }}>
              <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
              <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
              <text x="40" y="46" textAnchor="middle" fill={NEON.blue} className="font-['Orbitron'] text-base font-black">AI</text>
            </svg>
            <span className="font-['Orbitron'] font-black text-xl" style={{ color: NEON.text }}>AGAPE SOVEREIGN</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Features</a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>How It Works</a>
            <a href="/privacy" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy Policy</a>
            <a href="/terms" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms of Service</a>
            <a href="/contact" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href="/auth" className="btn-neon neon-border py-2.5 px-5 rounded-lg text-white font-semibold text-sm" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
              Sign In
            </a>
            <button 
              onClick={() => scrollToSection('cta')}
              className="btn-neon neon-border py-2.5 px-5 rounded-lg text-white font-semibold text-sm"
              style={{ background: GRADIENT_BORDER }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6" id="hero">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div style={{ animation: "fade-in-up 0.8s ease" }}>
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.blue}44`, color: NEON.blue, background: 'rgba(0,212,255,0.05)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.blue }} />
                VERIFIED GOOGLE OAUTH PLATFORM
              </div>
              
              <h1 className="font-['Orbitron'] font-black leading-[1.1] mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: NEON.text }}>
                YOUR DIGITAL IDENTITY
                <br />
                <span style={{ background: GRADIENT_BORDER, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  RECLAIMED. SECURED. SOVEREIGN.
                </span>
              </h1>
              
              <p className="text-lg max-w-xl mb-8 leading-relaxed" style={{ color: NEON.textMuted }}>
                The world's first Digital Identity Federated Footprint (DIFF) intelligence platform. 
                Scan, secure, and sovereign your identity across 16 attack vectors using AI-driven privacy architecture.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={() => scrollToSection('cta')}
                  className="btn-neon py-3 px-8 rounded-lg text-white font-semibold text-base flex items-center justify-center gap-3"
                  style={{ background: GRADIENT_BORDER, fontSize: '1rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Start Your DIFF Scan
                </button>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="btn-neon neon-border py-3 px-8 rounded-lg text-white font-semibold text-base"
                  style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}
                >
                  Explore 16 Vectors
                </button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 text-xs font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: NEON.blue }}>
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                  </svg>
                  SOC 2 Type II Certified
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: NEON.blue }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  Zero-Knowledge Architecture
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: NEON.blue }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  End-to-End Encrypted
                </div>
              </div>
            </div>

            {/* Right side - Visual DIFF Score Card */}
            <div className="relative" style={{ animation: "fade-in-right 0.8s ease 0.2s both" }}>
              <div className="relative">
                {/* Large DIFF Score Card */}
                <GlassCard className="p-8" style={{ 
                  border: `1px solid ${NEON.blue}44`,
                  background: 'linear-gradient(135deg, rgba(6,13,31,0.9) 0%, rgba(8,18,40,0.9) 100%)',
                  boxShadow: `0 0 60px rgba(0,212,255,0.08), inset 0 1px 0 rgba(0,212,255,0.1)`
                }}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-[0.65rem] font-['Share_Tech_Mono'] tracking-widest mb-1" style={{ color: NEON.blue }}>DIFF SCORE</div>
                      <div className="text-[0.7rem] font-medium" style={{ color: NEON.textMuted }}>Digital Identity Federated Footprint</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[0.65rem] font-['Share_Tech_Mono'] tracking-widest mb-1" style={{ color: NEON.magenta }}>SOVEREIGN TIER</div>
                      <div className="font-['Orbitron'] font-black text-xl" style={{ color: NEON.blue }}>KNOXED SOVEREIGN</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center mb-8">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle 
                          cx="96" cy="96" r="88" 
                          fill="none" 
                          stroke="#0a1a3a" 
                          strokeWidth="12" 
                        />
                        <circle 
                          cx="96" cy="96" r="88" 
                          fill="none" 
                          stroke="url(#scoreGradient)" 
                          strokeWidth="12" 
                          strokeLinecap="round"
                          strokeDasharray="552.9"
                          strokeDashoffset="55.3"
                          style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }}
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={NEON.magenta} />
                            <stop offset="50%" stopColor={NEON.blue} />
                            <stop offset="100%" stopColor={NEON.orange} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="font-['Orbitron'] font-black" style={{ fontSize: '3.5rem', color: NEON.text }}>87</div>
                        <div className="text-[0.65rem] font-['Share_Tech_Mono'] tracking-widest mt-1" style={{ color: NEON.textMuted }}>SOVEREIGN SCORE</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,46,159,0.08)', border: `1px solid ${NEON.magenta}33` }}>
                      <div className="font-['Orbitron'] font-black text-2xl mb-1" style={{ color: NEON.magenta }}>3</div>
                      <div className="text-[0.6rem] font-['Share_Tech_Mono'] tracking-wider" style={{ color: NEON.textMuted }}>NUKED VECTORS</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(0,212,255,0.08)', border: `1px solid ${NEON.blue}33` }}>
                      <div className="font-['Orbitron'] font-black text-2xl mb-1" style={{ color: NEON.blue }}>11</div>
                      <div className="text-[0.6rem] font-['Share_Tech_Mono'] tracking-wider" style={{ color: NEON.textMuted }}>KNOXED VECTORS</div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,122,24,0.08)', border: `1px solid ${NEON.orange}33` }}>
                      <div className="font-['Orbitron'] font-black text-2xl mb-1" style={{ color: NEON.orange }}>2</div>
                      <div className="text-[0.6rem] font-['Share_Tech_Mono'] tracking-wider" style={{ color: NEON.textMuted }}>MONITORED</div>
                    </div>
                  </div>
                </GlassCard>

                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 hidden lg:block" style={{ animation: "float 4s ease-in-out infinite" }}>
                  <div className="px-4 py-2 rounded-full text-[0.65rem] font-['Share_Tech_Mono'] font-bold tracking-wider text-white flex items-center gap-2" style={{ background: GRADIENT_BORDER }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: NEON.orange }} />
                    LIVE THREAT INTEL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16" style={{ animation: "fade-in-up 0.6s ease" }}>
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.magenta}44`, color: NEON.magenta, background: 'rgba(255,46,159,0.05)' }}>
              16 IDENTITY VECTORS
            </div>
            <h2 className="font-['Orbitron'] font-black mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: NEON.text }}>
              COMPLETE DIFF COVERAGE
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: NEON.textMuted }}>
              Each vector maps to a battle-tested privacy pillar. Real-time intelligence. Actionable remediation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { pillar: 'POLYMER', vectors: ['email', 'broker', 'browser', 'cloud'] },
              { pillar: 'UNOSECUR', vectors: ['social', 'mobile', 'location', 'iot'] },
              { pillar: 'NYMIZ', vectors: ['device', 'password', 'medical', 'biometric'] },
              { pillar: 'PRIVACY_PROCTOR', vectors: ['deepweb', 'financial', 'darkweb', 'behavioral'] },
            ].map(({ pillar, vectors }) => (
              <GlassCard 
                key={pillar} 
                className="p-6 group relative overflow-hidden"
                style={{ 
                  border: `1px solid ${PILLARS[pillar as keyof typeof PILLARS].color}33`,
                  background: `linear-gradient(135deg, ${PILLARS[pillar as keyof typeof PILLARS].accentBg} 0%, rgba(8,18,40,0.85) 100%)`,
                  transition: 'all 0.4s ease'
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${PILLARS[pillar as keyof typeof PILLARS].color}, transparent)`, transform: 'scaleX(0)', transition: 'transform 0.4s ease' }} />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-['Orbitron'] font-black text-sm" style={{ background: PILLARS[pillar as keyof typeof PILLARS].accentBg, color: PILLARS[pillar as keyof typeof PILLARS].color }}>
                    {pillar === 'POLYMER' ? 'PL' : pillar === 'UNOSECUR' ? 'US' : pillar === 'NYMIZ' ? 'NY' : pillar === 'PRIVACY_PROCTOR' ? 'PP' : 'PA'}
                  </div>
                  <div>
                    <div className="font-['Orbitron'] font-bold text-sm" style={{ color: PILLARS[pillar as keyof typeof PILLARS].color }}>{PILLARS[pillar as keyof typeof PILLARS].label}</div>
                    <div className="text-[0.65rem] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>{PILLARS[pillar as keyof typeof PILLARS].tagline}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {vectors.map(id => {
                    const mod = DIFF_MODULES.find(m => m.id === id);
                    return mod ? (
                      <div key={mod.id} className="flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                        <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${mod.pillar === 'POLYMER' ? NEON.magenta : mod.pillar === 'UNOSECUR' ? NEON.orange : mod.pillar === 'NYMIZ' ? NEON.blue : NEON.blue})` }}>{mod.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" style={{ color: NEON.text }}>{mod.label}</div>
                          <div className="text-[0.6rem] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
                            V-{mod.vector} · NUKED: {mod.nuked} · KNOXED: {mod.knoxed}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-['Orbitron'] font-bold text-lg" style={{ color: mod.severity > 70 ? NEON.magenta : mod.severity > 50 ? NEON.orange : NEON.blue }}>{mod.severity}</div>
                          <div className="text-[0.55rem] font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>SEVERITY</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 relative" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,212,255,0.02) 50%, transparent 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.orange}44`, color: NEON.orange, background: 'rgba(255,122,24,0.05)' }}>
              THREE PHASES TO SOVEREIGNTY
            </div>
            <h2 className="font-['Orbitron'] font-black mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: NEON.text }}>
              HOW IT WORKS
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: NEON.textMuted }}>
              From scan to sovereignty in three automated phases. No manual configuration required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'FEDERATED SCAN',
                description: 'Architect AI deploys 16 parallel identity vectors across email, social, device, financial, medical, biometric, and dark web surfaces. Zero-knowledge client-side execution.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                details: ['16 parallel vector scans', 'Client-side zero-knowledge', 'Real-time threat correlation', 'Sub-second completion']
              },
              {
                number: '02',
                title: 'INTELLIGENCE ANALYSIS',
                description: 'AI correlates findings across vectors, assigns NUKED/KNOXED classifications, calculates sovereign score, and generates personalized remediation playbooks.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
                details: ['NUKED/KNOXED classification', 'Sovereign score (0-100)', 'Personalized playbooks', 'Cross-vector correlation']
              },
              {
                number: '03',
                title: 'SOVEREIGN REMEDIATION',
                description: 'One-click automated removal from data brokers, passkey binding, credential rotation, and continuous monitoring with real-time alerts.',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
                details: ['Automated broker opt-out', 'Passkey/WebAuthn binding', 'Credential rotation', '24/7 continuous monitoring']
              }
            ].map((step, i) => (
              <GlassCard 
                key={step.number} 
                className="p-8 relative group"
                style={{ 
                  border: `1px solid ${NEON.blue}22`,
                  transition: 'all 0.4s ease'
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" style={{ background: GRADIENT_BORDER }} />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="font-['Orbitron'] font-black text-3xl" style={{ color: NEON.textMuted, opacity: 0.3 }}>{step.number}</div>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `rgba(0,212,255,0.1)`, color: NEON.blue }}>
                    {step.icon}
                  </div>
                </div>
                
                <h3 className="font-['Orbitron'] font-bold text-xl mb-4" style={{ color: NEON.text }}>{step.title}</h3>
                <p className="mb-6 leading-relaxed" style={{ color: NEON.textMuted }}>{step.description}</p>
                
                <ul className="space-y-2">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm" style={{ color: NEON.text }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: NEON.blue, flexShrink: 0 }}>
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

      {/* Compliance & Certifications */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.blue}44`, color: NEON.blue, background: 'rgba(0,212,255,0.05)' }}>
              ENTERPRISE-GRADE COMPLIANCE
            </div>
            <h2 className="font-['Orbitron'] font-black mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: NEON.text }}>
              BUILT FOR VERIFICATION
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'SOC 2 Type II', desc: 'Annual independent audit', icon: '📋' },
              { title: 'GDPR Compliant', desc: 'Article 25 by design', icon: '🇪🇺' },
              { title: 'CCPA/CPRA Ready', desc: 'California privacy law', icon: '🇺🇸' },
              { title: 'ISO 27001 Aligned', desc: 'Security management', icon: '📐' },
              { title: 'Zero-Knowledge', desc: 'Client-side encryption', icon: '🔐' },
              { title: 'Open Source Core', desc: 'Transparent algorithms', icon: '🔓' },
              { title: 'Pen Tested', desc: 'Quarterly red team', icon: '🎯' },
              { title: 'Bug Bounty', desc: 'Active vulnerability program', icon: '🐛' },
            ].map((item) => (
              <GlassCard key={item.title} className="p-6 text-center group" style={{ border: `1px solid ${NEON.blue}11`, transition: 'all 0.3s ease' }}>
                <div className="text-4xl mb-4" style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }}>{item.icon}</div>
                <div className="font-['Orbitron'] font-bold mb-1" style={{ color: NEON.text }}>{item.title}</div>
                <div className="text-sm" style={{ color: NEON.textMuted }}>{item.desc}</div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 rounded-3xl opacity-30 blur-3xl" style={{ background: GRADIENT_BORDER, animation: "pulse-glow 4s ease-in-out infinite" }} />
          
          <GlassCard className="relative p-12 md:p-16" style={{ border: `1px solid ${NEON.blue}44`, background: 'linear-gradient(135deg, rgba(6,13,31,0.95) 0%, rgba(8,18,40,0.95) 100%)' }}>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.orange}44`, color: NEON.orange, background: 'rgba(255,122,24,0.05)' }}>
              READY TO RECLAIM YOUR SOVEREIGNTY
            </div>
            
            <h2 className="font-['Orbitron'] font-black mb-6" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: NEON.text }}>
              BEGIN YOUR DIFF ANALYSIS
            </h2>
            
            <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: NEON.textMuted }}>
              Join 10,000+ sovereign individuals. Your first scan is free. No credit card. Pure sovereignty.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/auth'}
                className="btn-neon py-4 px-10 rounded-lg text-white font-semibold text-base flex items-center justify-center gap-3"
                style={{ background: GRADIENT_BORDER, fontSize: '1.1rem' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Start Free DIFF Scan
              </button>
              <a href="/contact" className="btn-neon neon-border py-4 px-10 rounded-lg text-white font-semibold text-base flex items-center justify-center gap-3" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
                Contact Enterprise Sales
              </a>
            </div>

            <div className="mt-10 pt-10 border-t flex flex-col sm:flex-row items-center justify-center gap-8" style={{ borderColor: `${NEON.blue}22` }}>
              <div className="flex items-center gap-3" style={{ color: NEON.textMuted }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: NEON.blue }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <span className="font-['Share_Tech_Mono'] text-sm">Zero-knowledge • Client-side encryption • Your keys, your data</span>
              </div>
              <div className="flex items-center gap-3" style={{ color: NEON.textMuted }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: NEON.blue }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="font-['Share_Tech_Mono'] text-sm">Setup in 60 seconds • No installation • Browser-native</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t relative" style={{ borderColor: `${NEON.blue}22` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg viewBox="0 0 80 80" className="w-8 h-8" style={{ filter: `drop-shadow(0 0 8px ${NEON.blue})` }}>
                  <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
                  <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={NEON.magenta} strokeWidth="1" opacity="0.6" />
                  <text x="40" y="46" textAnchor="middle" fill={NEON.blue} className="font-['Orbitron'] text-base font-black">AI</text>
                </svg>
                <span className="font-['Orbitron'] font-black text-lg" style={{ color: NEON.text }}>AGAPE SOVEREIGN</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: NEON.textMuted }}>
                Reclaiming digital sovereignty through AI-driven identity intelligence. 
                Your identity. Your rules. Your future.
              </p>
            </div>
            
            <div>
              <h4 className="font-['Orbitron'] font-bold mb-4" style={{ color: NEON.text }}>PRODUCT</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>16 Identity Vectors</a></li>
                <li><a href="/auth" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Architect AI</a></li>
                <li><a href="/auth" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Passkey Authentication</a></li>
                <li><a href="/contact" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Enterprise Solutions</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-['Orbitron'] font-bold mb-4" style={{ color: NEON.text }}>COMPLIANCE</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy Policy</a></li>
                <li><a href="/terms" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms of Service</a></li>
                <li><a href="/contact" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Data Processing Agreement</a></li>
                <li><a href="/contact" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Security Whitepaper</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-['Orbitron'] font-bold mb-4" style={{ color: NEON.text }}>CONTACT</h4>
              <ul className="space-y-2 text-sm" style={{ color: NEON.textMuted }}>
                <li>Email: sovereignty@agape.nyc</li>
                <li>Security: security@sovereign.nyc</li>
                <li>Legal: legal@agape.nyc</li>
                <li className="font-['Share_Tech_Mono'] text-xs tracking-wider">AGAPE SOVEREIGN ENCLAVE</li>
                <li className="font-['Share_Tech_Mono'] text-xs tracking-wider">New York, NY 10001</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: `1px solid ${NEON.blue}22` }}>
            <p className="text-sm font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
              © 2026 AGAPE SOVEREIGN ENCLAVE. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com/izrl613/agape-sovereign" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.305-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="/privacy" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy</a>
              <a href="/terms" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms</a>
              <a href="/contact" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes rotate-gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
        @keyframes thinking-dot {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
        .thinking-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #00D4FF;
          animation: thinking-dot 1.4s infinite ease-in-out;
        }
        .btn-neon {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .btn-neon::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .btn-neon:hover::before { opacity: 1; }
        .btn-neon:active { transform: scale(0.98); }
        .neon-border {
          border: 1px solid;
          border-color: #00D4FF44;
        }
        .neon-border:hover { border-color: #00D4FF; }
      `}</style>
    </div>
  );
};

// Import PILLARS and DIFF_MODULES from constants
import { PILLARS, DIFF_MODULES } from '../constants';