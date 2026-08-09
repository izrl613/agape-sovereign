import React from 'react';

const NEON_BLUE = '#00D4FF';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: NEON_BLUE, marginBottom: 12, borderBottom: '1px solid rgba(0,212,255,0.15)', paddingBottom: 8 }}>
      {title}
    </h2>
    {children}
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: '0 0 12px' }}>{children}</p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: 6 }}>{children}</li>
);

const Note = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: 'rgba(0,212,255,0.06)',
    border: '1px solid rgba(0,212,255,0.18)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: 'rgba(0,212,255,0.85)',
    lineHeight: 1.6,
    margin: '12px 0',
  }}>
    ℹ {children}
  </div>
);

export const TermsOfService = () => (
  <div style={{ minHeight: '100vh', background: '#0B1020', color: '#fff', fontFamily: 'Inter, Roboto, Arial, sans-serif' }}>
    {/* Nav strip */}
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: '1px solid rgba(0,212,255,0.1)',
      backdropFilter: 'blur(8px)', background: 'rgba(11,16,32,0.85)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <svg viewBox="0 0 40 40" width={28} height={28} style={{ filter: `drop-shadow(0 0 6px ${NEON_BLUE})` }}>
          <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke={NEON_BLUE} strokeWidth="1.5" />
          <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" fill="none" stroke="#FF2E9F" strokeWidth="1" opacity="0.7" />
          <polygon points="20,14 26,18 26,22 20,26 14,22 14,18" fill="#FF6B00" fillOpacity="0.8" stroke="#FF6B00" strokeWidth="0.5" />
        </svg>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Agape Sovereign AI</span>
      </a>
      <a href="/" style={{ fontSize: 12, color: NEON_BLUE, textDecoration: 'none', letterSpacing: '0.1em' }}>← Home</a>
    </nav>

    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px 100px' }}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.25em', color: NEON_BLUE, fontFamily: 'monospace', marginBottom: 12 }}>
          LEGAL
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', color: '#fff' }}>Terms of Service</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Effective Date: March 11, 2026 · Version 1.0 · Platform: sovereign.nyc
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Contact: <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a></p>
      </div>

      <P>By accessing or using the Platform, you agree to these Terms of Service. If you do not agree, you must not use the Platform.</P>

      <Section title="1. Acceptance of Terms">
        <P>By accessing, browsing, or using the Agape Sovereign – Architect AI Platform ("the Platform," "sovereign.nyc," "we," "us," or "our"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and all applicable laws and regulations. These Terms constitute a legally binding agreement between you and Agape Sovereign.</P>
        <P>If you are using the Platform on behalf of an organization, you represent and warrant that you have authority to bind that organization to these Terms.</P>
      </Section>

      <Section title="2. Eligibility">
        <P>To use the Platform you must:</P>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <Li>Be at least 13 years of age.</Li>
          <Li>Have the legal capacity to enter into a binding agreement under the laws of your jurisdiction.</Li>
          <Li>Not be prohibited from using the Platform under any applicable law, regulation, or court order.</Li>
          <Li>Provide accurate and truthful information when creating your account.</Li>
        </ul>
      </Section>

      <Section title="3. Description of Services">
        <P>Agape Sovereign AI is a privacy-first, security-intelligence web application that provides:</P>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <Li>A 16-vector Digital Identity Federated Footprint (DIFF) Intelligence Platform for mapping and protecting your digital identity.</Li>
          <Li>The Architect AI assistant for personalized identity defense guidance.</Li>
          <Li>The 5-Pillar Shield Platform integrating Polymer, Unosecur, Nymiz, PrivacyProctor, and Prisma AIRS.</Li>
          <Li>Client-side AES-GCM 256-bit encrypted data storage with zero-knowledge architecture.</Li>
          <Li>An Erasure Engine for data broker opt-out and removal request automation.</Li>
        </ul>
        <P>All features are subject to availability and may be modified, updated, or discontinued at our discretion.</P>
      </Section>

      <Section title="4. User Accounts">
        <P>You may authenticate using Google OAuth or a WebAuthn Passkey. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately at <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a> of any unauthorized use of your account.</P>
      </Section>

      <Section title="5. Acceptable Use">
        <P>You agree not to use the Platform to:</P>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <Li>Attempt to gain unauthorized access to any part of the Platform or its infrastructure.</Li>
          <Li>Reverse engineer, decompile, or disassemble any part of the Platform.</Li>
          <Li>Transmit malicious code, viruses, or any software intended to damage or interfere with the Platform.</Li>
          <Li>Use the Platform for any unlawful purpose or in violation of any applicable law or regulation.</Li>
          <Li>Scrape, harvest, or collect information about other users.</Li>
          <Li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</Li>
        </ul>
      </Section>

      <Section title="6. Administrator Access">
        <P>The Administrator Portal is accessible only to the designated Platform administrator (Israel David, using authorized administrator credentials). Any attempt to access the Administrator Portal by any other individual is strictly prohibited and may constitute a criminal offense under the Computer Fraud and Abuse Act (CFAA), 18 U.S.C. § 1030, and equivalent international statutes. Unauthorized access attempts will be logged and may be reported to law enforcement.</P>
        <Note>In Plain English: Only the designated administrator can access the backend. Do not attempt to access it if you are not the administrator.</Note>
      </Section>

      <Section title="7. Intellectual Property">
        <P>All content, features, and functionality of the Platform — including source code, design elements, trademarks, and documentation — are the exclusive property of Agape Sovereign and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Platform for your personal, non-commercial purposes in accordance with these Terms.</P>
      </Section>

      <Section title="8. Privacy">
        <P>Your use of the Platform is also governed by our <a href="/privacy" style={{ color: NEON_BLUE }}>Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Platform, you consent to the data practices described in our Privacy Policy.</P>
      </Section>

      <Section title="9. Disclaimer of Warranties">
        <P>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</P>
        <Note>In Plain English: We do our best to keep the Platform running and secure, but we cannot guarantee it will always be available or error-free.</Note>
      </Section>

      <Section title="10. Limitation of Liability">
        <P>TO THE FULLEST EXTENT PERMITTED BY LAW, AGAPE SOVEREIGN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF, OR INABILITY TO USE, THE PLATFORM. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM (OR $100 IF YOU HAVE NOT MADE ANY PAYMENTS).</P>
      </Section>

      <Section title="11. Indemnification">
        <P>You agree to indemnify, defend, and hold harmless Agape Sovereign and its affiliates, officers, agents, and licensors from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of your violation of these Terms or your misuse of the Platform.</P>
      </Section>

      <Section title="12. Modifications to Terms">
        <P>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or a prominent notice on the Platform. Your continued use of the Platform after the effective date of any modification constitutes your acceptance of the revised Terms.</P>
      </Section>

      <Section title="13. Termination">
        <P>We may suspend or terminate your access to the Platform at any time, with or without cause, with or without notice. Upon termination, your right to use the Platform will immediately cease. You may delete your account at any time by contacting us at <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a>.</P>
      </Section>

      <Section title="14. Governing Law">
        <P>These Terms shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in New York County, New York.</P>
      </Section>

      <Section title="15. Contact">
        <P>For questions about these Terms of Service:</P>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <Li><strong>Email:</strong> <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a></Li>
          <Li><strong>Platform:</strong> <a href="https://sovereign.nyc" style={{ color: NEON_BLUE }}>https://sovereign.nyc</a></Li>
        </ul>
      </Section>
    </div>

    {/* Footer */}
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '24px 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        © {new Date().getFullYear()} Agape Sovereign AI · sovereign.nyc
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <a href="/privacy" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 12, color: NEON_BLUE, textDecoration: 'none' }}>Terms of Service</a>
      </div>
    </footer>
  </div>
);
