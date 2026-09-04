import React from 'react';

const NEON_BLUE = '#00D4FF';
const NEON_MAGENTA = '#FF2E9F';
const NEON_ORANGE = '#FF7A18';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: NEON_BLUE, marginBottom: 12, borderBottom: '1px solid rgba(0,212,255,0.15)', paddingBottom: 8 }}>
      {title}
    </h2>
    {children}
  </div>
);

const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: '0 0 12px', ...style }}>{children}</p>
);

export const ContactPage = () => (
  <div style={{ minHeight: '100vh', background: '#0B1020', color: '#fff', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: '1px solid rgba(0,212,255,0.1)',
      backdropFilter: 'blur(8px)', background: 'rgba(11,16,32,0.85)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg viewBox="0 0 40 40" width={28} height={28} style={{ filter: `drop-shadow(0 0 6px ${NEON_BLUE})` }}>
          <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={NEON_BLUE} strokeWidth="1.5" />
          <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="none" stroke={NEON_MAGENTA} strokeWidth="1" opacity="0.7" />
          <polygon points="20,14 26,18 26,22 20,26 14,22 14,18" fill={NEON_ORANGE} fillOpacity="0.8" stroke={NEON_ORANGE} strokeWidth="0.5" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Agape Sovereign AI</span>
      </a>
      <a href="/" style={{ fontSize: 12, color: NEON_BLUE, textDecoration: 'none', letterSpacing: '0.1em' }}>← Home</a>
    </nav>

    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px 100px' }}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.25em', color: NEON_BLUE, fontFamily: 'monospace', marginBottom: 12 }}>
          CONTACT
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', color: '#fff' }}>Contact Us</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Agape Sovereign AI · sovereign.nyc
        </p>
      </div>

      <Section title="General Inquiries">
        <P>For general questions about the platform, press inquiries, or partnership opportunities:</P>
        <P style={{ fontFamily: 'monospace', color: NEON_BLUE }}>agape@sovereign.nyc</P>
      </Section>

      <Section title="Data Protection Officer (DPO)">
        <P>For privacy-related requests, data access, deletion, or portability inquiries under GDPR, CPRA, or other privacy regulations:</P>
        <P style={{ fontFamily: 'monospace', color: NEON_BLUE }}>dpo@agape.nyc</P>
      </Section>

      <Section title="Security Team">
        <P>For responsible disclosure of security vulnerabilities, bug bounty submissions, or security-related concerns:</P>
        <P style={{ fontFamily: 'monospace', color: NEON_BLUE }}>security@sovereign.nyc</P>
      </Section>

      <Section title="Legal Department">
        <P>For legal inquiries, subpoenas, DMCA takedown notices, or compliance-related matters:</P>
        <P style={{ fontFamily: 'monospace', color: NEON_BLUE }}>legal@agape.nyc</P>
      </Section>

      <Section title="Enterprise Sales">
        <P>For enterprise licensing, white-label solutions, or custom deployment inquiries:</P>
        <P style={{ fontFamily: 'monospace', color: NEON_BLUE }}>sovereignty@agape.nyc</P>
      </Section>

      <Section title="Physical Address">
        <P style={{ fontFamily: 'monospace', color: '#fff', opacity: 0.6 }}>
          Agape Sovereign Enclave<br />
          New York, NY 10001<br />
          United States
        </P>
      </Section>

      <Section title="Response Time">
        <P>We aim to respond to all inquiries within 2 business days. For urgent security matters, please use the security email with "URGENT" in the subject line.</P>
      </Section>
    </div>
  </div>
);
