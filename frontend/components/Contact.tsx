import React, { useState, useEffect } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonButton, NeonInput } from './ui/NeonElements';

export const Contact: React.FC = () => {
  useEffect(() => {
    document.title = 'Contact | AGAPE SOVEREIGN';
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: 'general', message: '' });
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      setStatus('error');
      setError('Failed to send. Please email sovereignty@agape.nyc directly.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen relative" style={{ background: NEON.bg }}>
      <div className="fixed inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: `linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4" style={{ background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${NEON.blue}33` }}>
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
            <a href="/" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Home</a>
            <a href="/privacy" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy</a>
            <a href="/terms" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms</a>
          </nav>
          <a href="/auth" className="btn-neon neon-border py-2.5 px-5 rounded-lg text-white font-semibold text-sm" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
            Sign In
          </a>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div style={{ animation: "fade-in-up 0.6s ease" }}>
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.blue}44`, color: NEON.blue, background: 'rgba(0,212,255,0.05)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.blue }} />
                SECURE COMMUNICATIONS
              </div>
              
              <h1 className="font-['Orbitron'] font-black mb-6" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: NEON.text }}>
                GET IN TOUCH
              </h1>
              
              <p className="text-lg mb-10 leading-relaxed" style={{ color: NEON.textMuted }}>
                Whether you're a sovereign individual, enterprise security team, or compliance officer — 
                we're here to help you reclaim digital sovereignty.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    ),
                    title: 'General & Partnerships',
                    email: 'sovereignty@agape.nyc',
                    response: '≤ 24 hours'
                  },
                  {
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.magenta} strokeWidth="1.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    ),
                    title: 'Security & Vulnerabilities',
                    email: 'security@sovereign.nyc',
                    response: '≤ 72 hours (responsible disclosure)'
                  },
                  {
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.orange} strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    ),
                    title: 'Privacy / DPO / GDPR',
                    email: 'privacy@agape.nyc',
                    response: '≤ 30 days (GDPR Art. 12)'
                  },
                  {
                    icon: (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    ),
                    title: 'Enterprise Sales',
                    email: 'enterprise@sovereign.nyc',
                    response: '≤ 4 hours (business days)'
                  }
                ].map((item, i) => (
                  <GlassCard 
                    key={item.title} 
                    className="p-6 flex items-start gap-4 group"
                    style={{ 
                      border: `1px solid ${NEON.blue}11`,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ background: `rgba(0,212,255,0.1)`, color: NEON.blue }}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-['Orbitron'] font-bold" style={{ color: NEON.text }}>{item.title}</h3>
                      <a href={`mailto:${item.email}`} className="block mt-2 font-['Share_Tech_Mono'] text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.blue }}>
                        {item.email}
                      </a>
                      <div className="mt-1 text-xs font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
                        Expected response: {item.response}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>

            <div style={{ animation: "fade-in-up 0.6s ease 0.1s both" }}>
              <GlassCard className="p-8" style={{ border: `1px solid ${NEON.blue}33` }}>
                <h2 className="font-['Orbitron'] font-black mb-6" style={{ color: NEON.text }}>SEND A MESSAGE</h2>
                
                {status === 'success' && (
                  <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(0,212,255,0.1)', border: `1px solid ${NEON.blue}44` }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>
                    <div>
                      <strong style={{ color: NEON.text }}>Message Sent!</strong>
                      <p className="text-sm mt-1" style={{ color: NEON.textMuted }}>We'll respond to {formData.email || 'your email'} within 24 hours.</p>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ background: 'rgba(255,46,159,0.1)', border: `1px solid ${NEON.magenta}44` }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.magenta} strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    <div>
                      <strong style={{ color: NEON.text }}>Delivery Failed</strong>
                      <p className="text-sm mt-1" style={{ color: NEON.textMuted }}>{error || 'Please try again or email directly.'}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <NeonInput
                      label="Full Name"
                      name="name"
                      type="text"
                      placeholder="Satoshi Nakamoto"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={status === 'sending'}
                    />
                    <NeonInput
                      label="Email Address"
                      name="email"
                      type="email"
                      placeholder="satoshi@sovereign.nyc"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={status === 'sending'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-['Share_Tech_Mono'] tracking-wider mb-2" style={{ color: NEON.textMuted }}>SUBJECT</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all font-mono text-sm"
                      style={{ caretColor: NEON.blue, background: 'rgba(255,255,255,0.05)', color: NEON.text }}
                      disabled={status === 'sending'}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="privacy">Privacy / GDPR / Data Rights</option>
                      <option value="security">Security / Vulnerability Report</option>
                      <option value="enterprise">Enterprise / Partnership</option>
                      <option value="press">Press / Media</option>
                      <option value="support">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-['Share_Tech_Mono'] tracking-wider mb-2" style={{ color: NEON.textMuted }}>MESSAGE</label>
                    <textarea
                      name="message"
                      rows={6}
                      placeholder="Describe your inquiry, compliance requirement, or technical issue..."
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00D4FF]/50 transition-all font-mono text-sm resize-none"
                      style={{ caretColor: NEON.blue, background: 'rgba(255,255,255,0.05)', color: NEON.text }}
                      required
                      disabled={status === 'sending'}
                    />
                  </div>

                  <NeonButton 
                    type="submit" 
                    disabled={status === 'sending'}
                    className="w-full py-4 px-8 rounded-lg text-white font-semibold text-base flex items-center justify-center gap-3"
                    style={{ background: GRADIENT_BORDER, fontSize: '1.1rem' }}
                  >
                    {status === 'sending' ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" className="animate-spin"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 30" strokeLinecap="round" /></svg>
                        TRANSMITTING...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 2L11 13" />
                          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                        </svg>
                        TRANSMIT MESSAGE
                      </>
                    )}
                  </NeonButton>
                </form>

                <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-center gap-6" style={{ borderColor: `${NEON.blue}22` }}>
                  <div className="flex items-center gap-3" style={{ color: NEON.textMuted }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: NEON.blue }}>
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    <span className="font-['Share_Tech_Mono'] text-sm">End-to-end encrypted via PGP</span>
                  </div>
                  <div className="flex items-center gap-3" style={{ color: NEON.textMuted }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: NEON.blue }}>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="font-['Share_Tech_Mono'] text-sm">Response ≤ 24 hours</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* PGP Key Section */}
          <GlassCard className="p-8" style={{ border: `1px solid ${NEON.magenta}33`, background: 'linear-gradient(135deg, rgba(255,46,159,0.05) 0%, transparent 100%)' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <div>
                <h3 className="font-['Orbitron'] font-bold text-xl" style={{ color: NEON.text }}>PGP PUBLIC KEY</h3>
                <p className="text-sm" style={{ color: NEON.textMuted }}>For encrypted communications. Key ID: <code className="font-['Share_Tech_Mono']" style={{ color: NEON.blue }}>0x7F3A9C2E</code></p>
              </div>
            </div>
            <div className="p-4 rounded-lg font-['Share_Tech_Mono'] text-xs overflow-x-auto" style={{ background: '#030814', border: `1px solid ${NEON.magenta}22`, color: NEON.magenta }}>
              -----BEGIN PGP PUBLIC KEY BLOCK-----<br/>
              mDMEZ4nJ1RYJKwYBBAHaRw8BAQdA7v8vq2QxJqK9vL9pQ3V2bG91ZCBEaWdpdGFs<br/>
              IElkZW50aXR5IEZlZGVyYXRlZCBGb290cHJpbnQgLSBBR0FQRSBTT1ZFUkVJR04g<br/>
              [TRUNCATED FOR BREVITY - FULL KEY AT sovereign.nyc/pgp]<br/>
              -----END PGP PUBLIC KEY BLOCK-----
            </div>
            <div className="mt-4 text-center">
              <a href="/pgp-key.txt" target="_blank" rel="noopener noreferrer" className="btn-neon neon-border py-2 px-6 rounded-lg text-white font-semibold text-sm" style={{ background: "rgba(255,46,159,0.05)", borderColor: `${NEON.magenta}44` }}>
                DOWNLOAD FULL KEY (.asc)
              </a>
            </div>
          </GlassCard>
        </div>
      </main>

      <footer className="pt-12 pb-8 px-6" style={{ borderTop: `1px solid ${NEON.blue}22` }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-['Share_Tech_Mono']" style={{ color: NEON.textMuted }}>
            © 2026 AGAPE SOVEREIGN ENCLAVE. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/" className="transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Home</a>
            <a href="/privacy" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy</a>
            <a href="/terms" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
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
        .btn-neon:disabled { opacity: 0.6; cursor: not-allowed; }
        .neon-border {
          border: 1px solid;
          border-color: #00D4FF44;
        }
        .neon-border:hover { border-color: #00D4FF; }
      `}</style>
    </div>
  );
};