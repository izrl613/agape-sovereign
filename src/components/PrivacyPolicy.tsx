import React from 'react';
import { NEON, NeonText } from './UI';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy = () => {
  return (
    <div style={{ minHeight: '100vh', background: NEON.bg, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Top gradient bar */}
      <div style={{ height: 3, background: 'linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%)', flexShrink: 0 }} />

      {/* Animated grid background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Header */}
      <header style={{ padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,212,255,0.1)', position: 'relative', zIndex: 1 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <svg viewBox="0 0 32 32" width="28" style={{ filter: `drop-shadow(0 0 6px ${NEON.blue})` }}>
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="none" stroke={NEON.blue} strokeWidth="1.5" />
            <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="none" stroke={NEON.magenta} strokeWidth="0.8" opacity="0.7" />
            <text x="16" y="20" textAnchor="middle" fill={NEON.blue} fontFamily="Orbitron" fontSize="8" fontWeight="900">AI</text>
          </svg>
          <div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.7rem', fontWeight: 700, color: NEON.blue, letterSpacing: '0.1em' }}>AGAPE SOVEREIGN</div>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>ARCHITECT AI 2026</div>
          </div>
        </Link>
        <Link to="/login" style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.75rem', color: NEON.blue, textDecoration: 'none', border: `1px solid ${NEON.blue}44`, padding: '6px 14px', borderRadius: 6 }}>
          ← Back to App
        </Link>
      </header>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '48px 24px', position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ maxWidth: 820, width: '100%' }}
        >
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Shield style={{ color: NEON.blue, width: 40, height: 40 }} />
            </div>
            <NeonText color={NEON.blue} size="2rem" weight={900}>Privacy Policy</NeonText>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.7rem', color: NEON.textMuted, marginTop: 8, letterSpacing: '0.1em' }}>
              AGAPE SOVEREIGN AI · Effective Date: January 1, 2026 · Last Updated: July 2026
            </div>
            <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #00D4FF, transparent)', marginTop: 24, opacity: 0.5 }} />
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              {
                title: '1. Overview',
                body: `Agape Sovereign AI ("we," "us," or "our") operates the Agape Sovereign platform accessible at sovereign.nyc. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our Digital Identity Federated Footprint (DIFF) service.

We are committed to zero-knowledge architecture — meaning your sensitive identity data is encrypted client-side before it ever leaves your device and is never readable by our servers.`,
              },
              {
                title: '2. Information We Collect',
                body: `Authentication Data: When you sign in with Google or a passkey, we receive your email address, display name, and profile photo from your identity provider. We do not receive or store your password.

Module Data: The 16 DIFF identity vectors you enter (email addresses, social handles, device information, etc.) are encrypted client-side using AES-256-GCM with a key derived from your user ID. The encrypted ciphertext is stored in Firebase Firestore. We cannot decrypt this data.

Usage Analytics: We collect anonymous usage events (e.g., module completion, scan initiation) through Firebase Analytics to improve the service. No personally identifiable information is attached to these events.

Audit Logs: When findings are recorded (NUKED, KNOXED, MONITORED statuses), a timestamped audit log entry is stored in your Firestore subcollection for a 2-year compliance retention period.`,
              },
              {
                title: '3. How We Use Your Information',
                body: `We use your information solely to provide and improve the Agape Sovereign service:
• To authenticate you and maintain your session
• To store and retrieve your encrypted identity vectors
• To calculate your Sovereign Score based on your DIFF analysis
• To generate your Identity Audit PDF report (processed entirely client-side)
• To comply with applicable privacy regulations (ECRA 2026, GDPR, CCPA)

We do not sell, rent, or broker your data to any third party. We do not use your data for advertising.`,
              },
              {
                title: '4. Data Storage and Security',
                body: `All identity vector data is encrypted with AES-256-GCM before transmission. Encryption keys are derived from your authenticated user ID and are never transmitted to or stored on our servers.

Data is stored on Google Firebase (Firestore) with strict security rules that only permit access by your authenticated user account. Firebase is SOC 2 Type II certified and GDPR compliant.

Audit logs are retained for 2 years per the ECRA 2026 Standard and then automatically purged.`,
              },
              {
                title: '5. Third-Party Services',
                body: `We use the following third-party services:
• Google Firebase (Authentication, Firestore, Hosting, Cloud Functions) — Google Privacy Policy: https://policies.google.com/privacy
• Google Analytics (Firebase Analytics) — anonymous usage tracking
• Google Sign-In — OAuth 2.0 identity delegation

We integrate optionally with privacy protection services (Polymer, Unosecur, Nymiz, PrivacyProctor, Prisma AIRS) as part of the 5-Pillar Shield Platform. These integrations only activate with your explicit consent and do not receive your raw identity data.`,
              },
              {
                title: '6. Your Rights',
                body: `You have the right to:
• Access your data: All your data is visible within the DIFF modules in the app
• Export your data: Use the Identity Audit PDF Compiler to export a full encrypted report
• Delete your data: Contact us at privacy@sovereign.nyc to request account and data deletion
• Opt out of analytics: Disable Firebase Analytics collection in your browser settings

California residents have additional rights under CCPA. EU residents have additional rights under GDPR. Contact us to exercise any of these rights.`,
              },
              {
                title: '7. Children\'s Privacy',
                body: `Agape Sovereign AI is not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately at privacy@sovereign.nyc.`,
              },
              {
                title: '8. Changes to This Policy',
                body: `We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date at the top of this page and, where appropriate, by sending an in-app notification. Your continued use of the service after changes constitutes acceptance of the updated policy.`,
              },
              {
                title: '9. Contact Us',
                body: `If you have questions about this Privacy Policy or your data, contact us at:

Agape Sovereign AI
Email: privacy@sovereign.nyc
Website: https://sovereign.nyc`,
              },
            ].map((section, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(0,212,255,0.08)',
                  borderRadius: 12,
                  padding: '24px 28px',
                }}
              >
                <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.9rem', fontWeight: 700, color: NEON.blue, marginBottom: 12, letterSpacing: '0.05em' }}>
                  {section.title}
                </h2>
                <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                  {section.body}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 48, textAlign: 'center', paddingTop: 24, borderTop: '1px solid rgba(0,212,255,0.1)' }}>
            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.65rem', color: NEON.textMuted }}>
              © 2026 Agape Sovereign AI · sovereign.nyc · privacy@sovereign.nyc
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 24 }}>
              <Link to="/login" style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.65rem', color: NEON.blue, textDecoration: 'none' }}>Home</Link>
              <a href="mailto:privacy@sovereign.nyc" style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.65rem', color: NEON.textMuted, textDecoration: 'none' }}>Contact</a>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom gradient bar */}
      <div style={{ height: 3, background: 'linear-gradient(135deg, #FF7A18 0%, #00D4FF 50%, #FF2E9F 100%)', flexShrink: 0 }} />
    </div>
  );
};
