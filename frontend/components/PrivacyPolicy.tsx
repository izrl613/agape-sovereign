import React, { useEffect } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText } from './ui/NeonElements';

export const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | AGAPE SOVEREIGN';
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
            <a href="/terms" className="text-sm font-medium transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms of Service</a>
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
              PRIVACY POLICY
            </h1>
            
            <div className="mb-12 p-6 rounded-xl" style={{ background: 'rgba(255,46,159,0.05)', border: `1px solid ${NEON.magenta}33` }}>
              <p className="text-lg leading-relaxed" style={{ color: NEON.text }}>
                <strong style={{ color: NEON.text }}>Last Updated:</strong> July 19, 2026<br />
                <strong style={{ color: NEON.text }}>Version:</strong> 1.0<br />
                <strong style={{ color: NEON.text }}>Data Controller:</strong> AGAPE SOVEREIGN ENCLAVE, New York, NY 10001<br />
                <strong style={{ color: NEON.text }}>Contact:</strong> privacy@agape.nyc
              </p>
            </div>

            <div className="space-y-8" style={{ animation: "fade-in-up 0.6s ease 0.1s both" }}>
              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>01</span>
                  DATA WE COLLECT
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    We collect only the minimum data necessary to provide the Digital Identity Federated Footprint (DIFF) analysis service. 
                    All processing occurs client-side where technically feasible.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>Account Data:</strong> Email, authentication credentials (Google OAuth, passkeys), display name
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>DIFF Scan Results:</strong> Vector scores (NUKED/KNOXED counts), severity assessments, sovereignty tier
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <div>
                        <strong style={{ color: NEON.text }}>Usage Analytics:</strong> Anonymous feature usage, performance metrics, error logs (no PII)
                      </div>
                    </li>
                  </ul>
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: `1px solid ${NEON.blue}33` }}>
                    <strong style={{ color: NEON.blue }}>Zero-Knowledge Commitment:</strong> Your raw identity data never leaves your device unencrypted. 
                    All DIFF vector analysis runs locally via WebAssembly modules. We cannot access your personal data.
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>02</span>
                  HOW WE USE YOUR DATA
                </h2>
                <div className="space-y-4 pl-11">
                  <ul className="space-y-3">
                    {[
                      'Provide DIFF sovereignty scoring across 16 identity vectors',
                      'Enable passkey-based authentication (WebAuthn/FIDO2)',
                      'Generate cryptographic SHA-256 audit seals for compliance',
                      'Deliver real-time threat intelligence and NUKED alerts',
                      'Maintain audit trails for regulatory compliance (GDPR, CCPA, ECRA 2026)',
                      'Improve platform security through anonymized threat correlation'
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
                  DATA SHARING & DISCLOSURE
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255,122,24,0.08)', border: `1px solid ${NEON.orange}33` }}>
                    <strong style={{ color: NEON.orange }}>We do not sell, rent, or trade your personal data.</strong>
                  </div>
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7, marginTop: '1rem' }}>
                    Data may only be disclosed in these limited circumstances:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Legal compliance: Valid court order, subpoena, or legal obligation (we will notify you unless prohibited by law)',
                      'Safety: To prevent imminent harm to you or others',
                      'Service providers: Sub-processors under strict DPAs (Cloudflare, Firebase, Google Cloud) - see Sub-processor List',
                      'Business transfer: In case of merger/acquisition, with notice and consent requirements'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.orange}11` }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.orange} strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        <span style={{ color: NEON.text, lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>04</span>
                  YOUR RIGHTS (GDPR, CCPA, ECRA 2026)
                </h2>
                <div className="space-y-4 pl-11">
                  <ul className="space-y-3">
                    {[
                      { right: 'Access', desc: 'Request a copy of all personal data we hold about you (Article 15 GDPR)' },
                      { right: 'Rectification', desc: 'Correct inaccurate or incomplete data (Article 16 GDPR)' },
                      { right: 'Erasure', desc: '"Right to be forgotten" - delete your data (Article 17 GDPR, ECRA 2026 §4.2)' },
                      { right: 'Portability', desc: 'Receive your data in structured, machine-readable format (Article 20 GDPR)' },
                      { right: 'Restriction', desc: 'Limit processing of your data (Article 18 GDPR)' },
                      { right: 'Objection', desc: 'Object to processing for direct marketing or legitimate interests (Article 21 GDPR)' },
                      { right: 'Automated Decision-Making', desc: 'Not be subject to solely automated decisions with legal effects (Article 22 GDPR)' },
                      { right: 'Withdraw Consent', desc: 'Withdraw consent at any time without affecting prior processing lawfulness' }
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-['Orbitron'] font-black text-xs shrink-0" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>{i + 1}</div>
                        <div>
                          <strong style={{ color: NEON.text }}>{item.right}</strong>
                          <p className="mt-1 text-sm" style={{ color: NEON.textMuted }}>{item.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: `1px solid ${NEON.blue}33` }}>
                    <strong style={{ color: NEON.blue }}>Exercise Your Rights:</strong> Email privacy@agape.nyc or use the in-app Sovereign Console. 
                    We respond within 30 days (GDPR) / 45 days (CCPA) / 15 days (ECRA 2026).
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>05</span>
                  DATA RETENTION
                </h2>
                <div className="space-y-4 pl-11">
                  <table className="w-full text-left" style={{ color: NEON.text }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${NEON.blue}33` }}>
                        <th className="pb-3 font-['Orbitron'] text-sm" style={{ color: NEON.magenta }}>DATA CATEGORY</th>
                        <th className="pb-3 font-['Orbitron'] text-sm" style={{ color: NEON.magenta }}>RETENTION PERIOD</th>
                        <th className="pb-3 font-['Orbitron'] text-sm" style={{ color: NEON.magenta }}>BASIS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Account & Auth Data', 'Duration of account + 90 days post-deletion', 'Contract performance'],
                        ['DIFF Scan Results', '2 years (rolling)', 'Legitimate interest / Service improvement'],
                        ['Audit Logs (SHA-256 seals)', '7 years', 'Legal compliance (ECRA 2026, SOX)'],
                        ['Analytics (anonymized)', '26 months', 'Legitimate interest'],
                        ['Security Logs', '1 year', 'Security / Legitimate interest'],
                        ['Support Communications', '3 years', 'Contract / Legal obligation']
                      ].map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${NEON.blue}11` }}>
                          <td className="py-3 font-medium" style={{ color: NEON.text }}>{row[0]}</td>
                          <td className="py-3 font-['Share_Tech_Mono'] text-sm" style={{ color: NEON.blue }}>{row[1]}</td>
                          <td className="py-3 text-sm" style={{ color: NEON.textMuted }}>{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>06</span>
                  SECURITY MEASURES
                </h2>
                <div className="space-y-4 pl-11">
                  <ul className="space-y-3">
                    {[
                      'End-to-end encryption: AES-256-GCM for data at rest, TLS 1.3 for data in transit',
                      'Client-side encryption: Your DIFF data encrypted before leaving your device (Web Crypto API)',
                      'Passkey authentication: FIDO2/WebAuthn with device-bound credentials (no passwords stored)',
                      'Zero-trust architecture: Firebase App Check, Cloudflare Zero Trust, VPC isolation',
                      'SOC 2 Type II certified infrastructure (Google Cloud, Firebase)',
                      'Regular penetration testing by third-party firms (annual + post-major-release)',
                      'Bug bounty program: security@sovereign.nyc',
                      'Incident response: < 4 hour detection, < 24 hour notification (GDPR Art. 33)'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${NEON.blue}11` }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mt-0.5 shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 6v6l4 2" /></svg>
                        <span style={{ color: NEON.text, lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,122,24,0.15)', color: NEON.orange }}>07</span>
                  INTERNATIONAL TRANSFERS
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    Our infrastructure is hosted on Google Cloud (us-central1, us-east1) and Cloudflare's global network. 
                    We rely on <strong style={{ color: NEON.text }}>Standard Contractual Clauses (SCCs)</strong> and 
                    the <strong style={{ color: NEON.text }}>EU-U.S. Data Privacy Framework</strong> for transfers to the United States.
                    You may request a copy of the SCCs by emailing privacy@agape.nyc.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,46,159,0.15)', color: NEON.magenta }}>08</span>
                  CHILDREN'S PRIVACY
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="p-4 rounded-lg" style={{ background: 'rgba(255,46,159,0.08)', border: `1px solid ${NEON.magenta}33` }}>
                    <p style={{ color: NEON.text, lineHeight: 1.7 }}>
                      Our service is not directed to individuals under 16 (EU) / 13 (US). 
                      We do not knowingly collect data from children. If you believe we have collected data from a minor, 
                      contact privacy@agape.nyc immediately for deletion.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(0,212,255,0.15)', color: NEON.blue }}>09</span>
                  CHANGES TO THIS POLICY
                </h2>
                <div className="space-y-4 pl-11">
                  <p style={{ color: NEON.textMuted, lineHeight: 1.7 }}>
                    We may update this policy to reflect regulatory changes or new features. 
                    Material changes will be notified via email and in-app banner 30 days prior to effectiveness. 
                    Continued use constitutes acceptance. Previous versions archived at <code style={{ color: NEON.blue }}>sovereign.nyc/privacy/archive</code>.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-['Orbitron'] font-bold text-xl mb-4 flex items-center gap-3" style={{ color: NEON.text }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center font-['Orbitron'] text-xs" style={{ background: 'rgba(255,122,24,0.15)', color: NEON.orange }}>10</span>
                  CONTACT US
                </h2>
                <div className="space-y-4 pl-11">
                  <div className="grid md:grid-cols-3 gap-4">
                    <GlassCard className="p-6 text-center" style={{ border: `1px solid ${NEON.blue}33` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.blue} strokeWidth="2" className="mx-auto mb-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                      <strong style={{ color: NEON.text }}>Data Protection Officer</strong>
                      <p className="mt-2" style={{ color: NEON.textMuted }}>privacy@agape.nyc</p>
                      <p className="text-sm mt-1" style={{ color: NEON.textMuted }}>Response: ≤ 30 days (GDPR)</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center" style={{ border: `1px solid ${NEON.magenta}33` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.magenta} strokeWidth="2" className="mx-auto mb-3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <strong style={{ color: NEON.text }}>Security Team</strong>
                      <p className="mt-2" style={{ color: NEON.textMuted }}>security@sovereign.nyc</p>
                      <p className="text-sm mt-1" style={{ color: NEON.textMuted }}>PGP Key: sovereign.nyc/pgp</p>
                    </GlassCard>
                    <GlassCard className="p-6 text-center" style={{ border: `1px solid ${NEON.orange}33` }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={NEON.orange} strokeWidth="2" className="mx-auto mb-3"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                      <strong style={{ color: NEON.text }}>Legal / Compliance</strong>
                      <p className="mt-2" style={{ color: NEON.textMuted }}>legal@agape.nyc</p>
                      <p className="text-sm mt-1" style={{ color: NEON.textMuted }}>ECRA 2026 / GDPR Rep.</p>
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
            <a href="/terms" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Terms</a>
            <a href="/contact" className="text-sm transition-colors hover:text-[${NEON.blue}]" style={{ color: NEON.textMuted }}>Contact</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
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