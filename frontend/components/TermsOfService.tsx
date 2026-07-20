import React, { useEffect } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard } from './ui/NeonElements';

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of Service | AGAPE SOVEREIGN';
  }, []);

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
            <a href="/privacy" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Privacy Policy</a>
            <a href="/contact" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
          </nav>
          <a href="/auth" className="btn-neon neon-border py-2.5 px-5 rounded-lg text-white font-semibold text-sm" style={{ background: "rgba(0,212,255,0.05)", borderColor: `${NEON.blue}44` }}>
            Sign In
          </a>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div style={{ animation: "fade-in-up 0.6s ease" }}>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border text-xs font-['Share_Tech_Mono'] tracking-wide" style={{ borderColor: `${NEON.magenta}44`, color: NEON.magenta, background: 'rgba(255,46,159,0.05)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: NEON.magenta }} />
              EFFECTIVE DATE: JULY 19, 2026
            </div>
            
            <h1 className="font-['Orbitron'] font-black mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: NEON.text }}>
              TERMS OF SERVICE
            </h1>
            
            <div className="mb-12 p-6 rounded-xl" style={{ background: 'rgba(255,46,159,0.05)', border: `1px solid ${NEON.magenta}33` }}>
              <p className="text-lg leading-relaxed" style={{ color: NEON.text }}>
                <strong style={{ color: NEON.text }}>Last Updated:</strong> July 19, 2026<br />
                <strong style={{ color: NEON.text }}>Version:</strong> 1.0<br />
                <strong style={{ color: NEON.text }}>Entity:</strong> AGAPE SOVEREIGN ENCLAVE, New York, NY 10001<br />
                <strong style={{ color: NEON.text }}>Contact:</strong> legal@agape.nyc
              </p>
            </div>

            <div className="space-y-8" style={{ animation: "fade-in-up 0.6s ease 0.1s both" }}>
              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>01</span>
                  ACCEPTANCE OF TERMS
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    By accessing or using the AGAPE SOVEREIGN platform ("Service"), including the Digital Identity 
                    Federated Footprint (DIFF) analysis, Architect AI, passkey authentication, and all related services, 
                    you agree to be bound by these Terms of Service ("Terms"), our Privacy Policy, and any applicable 
                    laws and regulations.
                  </p>
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: `1px solid ${NEON.blue}33` }}>
                    <strong style={{ color: NEON.blue }}>Important:</strong> If you do not agree to these Terms, 
                    do not use the Service. Continued use constitutes acceptance of any updates.
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>02</span>
                  SERVICE DESCRIPTION
                </h2>
                <div className="space-y-4 pl-11">
                  <ul className="space-y-3">
                    {[
                      'DIFF Analysis: Automated scanning of 16 identity vectors across email, social, device, financial, medical, biometric, dark web, and behavioral surfaces',
                      'Architect AI: Generative AI assistant for sovereignty remediation, compliance documentation, and threat intelligence',
                      'Passkey Authentication: FIDO2/WebAuthn-based passwordless authentication with device-bound credentials',
                      'Sovereign Console: Real-time dashboard showing NUKED/KNOXED classifications, sovereign score (0-100), and tier classification',
                      'Audit Seals: Cryptographic SHA-256 provenance seals for ECRA 2026, GDPR, and CCPA compliance documentation',
                      'Enterprise APIs: Programmatic access for organizational identity governance and compliance automation'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.magenta} strokeWidth="2" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        <span style={{ color: NEON.text, lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,122,24,0.15)', color: NEON.orange }}>03</span>
                  USER ELIGIBILITY & ACCOUNTS
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>3.1 Eligibility</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      You must be at least 16 years old (EU) or 13 years old (US/other jurisdictions) and have the legal 
                      capacity to enter into these Terms. By using the Service, you represent and warrant that you meet 
                      these requirements.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>3.2 Account Registration</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      You may register using Google OAuth or passkey (WebAuthn/FIDO2). You are responsible for maintaining 
                      the security of your credentials and for all activities under your account. Notify us immediately 
                      of any unauthorized use at security@sovereign.nyc.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>3.3 Account Termination</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      You may delete your account at any time via the Sovereign Console. We may suspend or terminate 
                      accounts for material breach of these Terms, including but not limited to: reverse engineering, 
                      automated scraping, interference with Service integrity, or violation of applicable laws.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>04</span>
                  SUBSCRIPTIONS & BILLING
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>4.1 Plans</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      The Service offers Free (individual), Pro, and Enterprise tiers. Features, limits, and pricing 
                      are detailed at sovereign.nyc/pricing. We reserve the right to modify plans with 30 days' notice.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>4.2 Billing</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      Paid subscriptions auto-renew unless cancelled. Refunds per our Refund Policy (available in Console). 
                      Taxes added where applicable. Failed payments may result in service suspension after 14 days' notice.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>4.3 Free Tier Limits</h3>
                    <ul className="space-y-2">
                      {['3 DIFF scans per month', '5 Architect AI queries per day', 'Basic threat intelligence', 'Community support only'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={NEON.orange} strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                          <span style={{ color: NEON.text }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>05</span>
                  INTELLECTUAL PROPERTY
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>5.1 Our IP</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      All rights in the Service (software, algorithms, DIFF methodology, Architect AI models, trademarks, 
                      trade dress, documentation) are owned by AGAPE SOVEREIGN ENCLAVE or our licensors. 
                      Protected by US and international copyright, trademark, and trade secret laws.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>5.2 Your Data</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      You retain all rights in your identity data, scan results, and generated content. 
                      You grant us a limited license to process your data solely to provide the Service.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>5.3 Feedback</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      Feedback, suggestions, or improvements you provide become our property and may be used without 
                      restriction or compensation.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>5.4 Open Source</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      Core DIFF algorithms and WebAuthn modules are open source under Apache 2.0 / MIT licenses. 
                      See github.com/izrl613/agape-sovereign for details.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>06</span>
                  ACCEPTABLE USE
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    You agree not to use the Service to:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Violate any applicable law, regulation, or third-party rights',
                      'Reverse engineer, decompile, or attempt to extract source code or models',
                      'Use automated tools to scrape, crawl, or index the Service',
                      'Interfere with Service integrity, availability, or security',
                      'Transmit malware, viruses, or harmful code',
                      'Impersonate any person or entity, or falsely state affiliation',
                      'Use DIFF results for discrimination, harassment, or illegal profiling',
                      'Resell or redistribute the Service without written authorization',
                      'Conduct security testing without our Bug Bounty program authorization'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.magenta}11` }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.magenta} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        <span style={{ color: NEON.text, lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,122,24,0.15)', color: NEON.orange }}>07</span>
                  DISCLAIMERS & LIMITATION OF LIABILITY
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255,122,24,0.08)', border: `1px solid ${NEON.orange}33` }}>
                    <strong style={{ color: NEON.orange }}>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong>
                  </div>
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7, marginTop: '1rem' }}>
                    We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) DIFF scans will 
                    detect all identity exposures; (c) remediation actions will succeed; (d) results will meet your 
                    specific requirements. You use the Service at your own risk.
                  </p>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>7.1 Liability Cap</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      To the maximum extent permitted by law, our aggregate liability shall not exceed the greater of 
                      (a) fees paid by you in the 12 months preceding the claim, or (b) $100 USD. 
                      This limitation applies to all claims (contract, tort, strict liability).
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>7.2 Exclusions</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      In no event shall we be liable for indirect, incidental, special, consequential, or punitive damages, 
                      including loss of data, profits, goodwill, or business opportunities, even if advised of the possibility.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-['Orbitron'] font-bold text-lg" style={{ color: NEON.text }}>7.3 DIFF Accuracy</h3>
                    <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                      DIFF scores and NUKED/KNOXED classifications are probabilistic assessments based on available data sources. 
                      They do not guarantee completeness or accuracy. No legal or financial decisions should rely solely on DIFF results.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>08</span>
                  INDEMNIFICATION
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    You agree to indemnify, defend, and hold harmless AGAPE SOVEREIGN ENCLAVE, its officers, directors, 
                    employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorneys' 
                    fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation 
                    of any third-party rights; (d) your DIFF scan results or actions taken based thereon.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>09</span>
                  TERMINATION
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    We may suspend or terminate your access immediately, without prior notice, for material breach, 
                    legal compliance, or protection of other users. Upon termination: (a) your license ends; 
                    (b) you must cease all use; (c) Sections 5, 7, 8, 9, 10, 11 survive.
                  </p>
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    You may terminate by deleting your account. We will delete your data per our Privacy Policy 
                    (90 days post-deletion, except where legally required).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>10</span>
                  GOVERNING LAW & DISPUTE RESOLUTION
                </h2>
                <div className="space-y-4 pl-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>Governing Law:</strong> State of New York, USA (excluding conflict of laws)
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>Venue:</strong> State and Federal courts in New York County, NY
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>Arbitration:</strong> Binding arbitration (AAA Rules) for disputes < $25,000. Class actions waived.
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>EU Users:</strong> May also invoke GDPR Art. 77 (supervisory authority) and Art. 79 (judicial remedy)
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,122,24,0.15)', color: NEON.orange }}>11</span>
                  GENERAL PROVISIONS
                </h2>
                <div className="space-y-4 pl-11">
                  <ul className="space-y-3">
                    {[
                      'Entire Agreement: These Terms, Privacy Policy, and any order forms constitute the entire agreement',
                      'Severability: Invalid provisions severed; remainder enforceable',
                      'No Waiver: Failure to enforce ≠ waiver of rights',
                      'Assignment: You may not assign; we may assign with notice',
                      'Force Majeure: Not liable for delays beyond reasonable control',
                      'Notices: Email to registered address or in-app banner (deemed received 24h after sending)',
                      'Language: English controls; translations for convenience only'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.orange}11` }}>
                        <span className="font-['Orbitron'] font-black text-sm shrink-0" style={{ color: NEON.orange }}>{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ color: NEON.text, lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>12</span>
                  CONTACT
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="grid md:grid-cols-3 gap-4">
                    <GlassCard className="p-6 text-center" style={{ border: `1px solid ${NEON.blue}33` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mx-auto mb-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <strong style={{ color: NEON.text }}>General & Legal</strong>
                      <p className="mt-2" style={{ color: NEON.textMuted }}>legal@agape.nyc</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center" style={{ border: `1px solid ${NEON.magenta}33` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.magenta} strokeWidth="2" className="mx-auto mb-3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <strong style={{ color: NEON.text }}>Security</strong>
                      <p className="mt-2" style={{ color: NEON.textMuted }}>security@sovereign.nyc</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center" style={{ border: `1px solid ${NEON.orange}33` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.orange} strokeWidth="2" className="mx-auto mb-3"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <strong style={{ color: NEON.text }}>Privacy / DPO</strong>
                      <p className="mt-2" style={{ color: NEON.textMuted }}>privacy@agape.nyc</p>
                    </GlassCard>
                  </div>
                </div>
              </section>
            </div>
          </div>
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
            <a href="/contact" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
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
        .neon-border {
          border: 1px solid;
          border-color: #00D4FF44;
        }
        .neon-border:hover { border-color: #00D4FF; }
      `}</style>
    </div>
  );
};