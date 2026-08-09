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

export const PrivacyPolicy = () => (
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
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', color: '#fff' }}>Privacy Policy</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          Effective Date: March 11, 2026 · Version 1.0 · Platform: sovereign.nyc
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Contact: <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a></p>
      </div>

      <P>This Privacy Policy applies to all users of the Agape Sovereign – Architect AI platform. By using the platform, you agree to the data practices described below.</P>

      <Section title="1. Our Privacy Philosophy">
        <P>Agape Sovereign – Architect AI ("the Platform," "we," "us," or "our") is a privacy-first, security-intelligence web application operated by Israel David, doing business as Agape Sovereign, at sovereign.nyc. The Platform exists to help you understand, protect, and reclaim every dimension of your Digital Identity Federated Footprint (DIFF) — not to profit from it.</P>
        <P>We operate under a zero-knowledge architecture:</P>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <Li>Your sensitive identity data is encrypted client-side before it ever leaves your device.</Li>
          <Li>We cannot read, access, sell, share, or monetize the content you enter into the Platform.</Li>
          <Li>No advertising is served. No behavioral profiling is performed.</Li>
          <Li>The Platform administrator has access only to anonymized operational telemetry — never to your personal identity data.</Li>
        </ul>
        <Note>In Plain English: We cannot see what you put in. It is encrypted on your device before it is ever stored anywhere. Nobody — not us, not Google, not Apple — can read your private identity data.</Note>
      </Section>

      <Section title="2. Who We Are">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <Li><strong>Operator:</strong> Israel David, operating as Agape Sovereign</Li>
          <Li><strong>Platform URL:</strong> https://sovereign.nyc</Li>
          <Li><strong>GitHub:</strong> https://github.com/izrl613/agape-sovereign</Li>
          <Li><strong>Contact:</strong> <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a></Li>
        </ul>
      </Section>

      <Section title="3. Information We Collect">
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>3.1 Information You Provide Directly</h3>
        <P>When you create an account and use the Platform's sixteen (16) identity vector modules, you may provide email addresses, social media usernames, device information, file metadata patterns, security posture information, and answers to identity-mapping questions. All data is processed locally and encrypted using SHA-256 cryptographic standards before transmission or storage.</P>
        <Note>In Plain English: The information you type into each module is locked with a unique cryptographic key — like a personal lock on a safe — before it goes anywhere.</Note>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>3.2 Google OAuth Authentication Data</h3>
        <P>When you sign in using Google OAuth, we receive only: your display name, your email address (used solely for account identification), and a unique provider-issued user identifier (UID). This authentication data is never linked to or merged with the identity intelligence data you enter in the Platform's DIFF modules.</P>
        <Note>In Plain English: When you sign in with Google, we receive only your name, email, and a unique ID. We cannot see your Gmail, Drive, or any other Google data.</Note>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>3.3 Google OAuth Scopes Used</h3>
        <P>The Platform requests only the minimum OAuth scopes required to authenticate users:</P>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <Li><code style={{ color: NEON_BLUE }}>openid</code> — confirms your identity with Google.</Li>
          <Li><code style={{ color: NEON_BLUE }}>email</code> — retrieves your email address for account identification.</Li>
          <Li><code style={{ color: NEON_BLUE }}>profile</code> — retrieves your basic name and profile picture for your account display.</Li>
        </ul>
        <P>We do not request access to Gmail, Google Drive, Google Contacts, Google Calendar, or any other Google service.</P>
        <Note>In Plain English: We ask Google for only three things — who you are, your email, and your name. We do not access any of your other Google account data.</Note>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>3.4 WebAuthn Passkey Data</h3>
        <P>After initial sign-in, the Platform creates a WebAuthn passkey bound to your physical device. We store only the public-key component of your passkey credential. The private key never leaves your device and is never transmitted to our servers.</P>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>3.5 Operational and Technical Data</h3>
        <P>To maintain security, performance, and integrity, we collect limited technical data: authentication event logs, Firebase usage statistics (anonymized and aggregated), cloud infrastructure health metrics, and application error reports (no personal data included). This operational data is retained for no longer than ninety (90) days unless required by applicable law.</P>
        <Note>In Plain English: We keep basic system logs to make sure the system works and is not being abused. These logs do not contain your personal identity information.</Note>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '16px 0 8px' }}>3.6 Information We Do Not Collect</h3>
        <P>We do not collect: financial information, government IDs, biometric raw data, health records, location data beyond what is technically incidental to IP-based routing, third-party social account contents, or any data beyond what is described in this Policy.</P>
      </Section>

      <Section title="4. How We Use Your Information">
        <P>We use the information we collect exclusively to: provide, maintain, and improve the Platform; authenticate your identity and maintain your session; send security and service-related communications; comply with legal obligations; and protect the security and integrity of the Platform.</P>
        <P>We do not use your information for advertising, profiling, data brokering, or sale to third parties.</P>
      </Section>

      <Section title="5. Data Storage and Security">
        <P>All sensitive identity data you enter is encrypted client-side using AES-GCM 256-bit encryption before transmission. Encrypted data is stored in Google Firebase Firestore under security rules that prevent unauthorized access. We use Firebase Security Rules, Google Cloud IAM, and industry-standard HTTPS/TLS for all data in transit.</P>
        <Note>In Plain English: Your data is locked before it leaves your device. Even if someone broke into our servers, they would only find encrypted data they cannot read.</Note>
      </Section>

      <Section title="6. Data Retention">
        <P>Encrypted identity data you store in DIFF modules is retained until you delete your account or request deletion. Authentication tokens and session data are retained for the duration of your session plus a short rolling window for security purposes. Operational logs are retained for no longer than 90 days. You may request complete deletion of your data at any time by emailing <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a>.</P>
      </Section>

      <Section title="7. Third-Party Services">
        <P>The Platform uses the following third-party services subject to their own privacy policies:</P>
        <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <Li><strong>Google Firebase / Google Cloud Platform</strong> — hosting, authentication, and database infrastructure.</Li>
          <Li><strong>Google OAuth 2.0</strong> — user authentication only.</Li>
        </ul>
        <P>We do not share your personal data with any other third parties. We do not use third-party analytics, advertising networks, or tracking pixels.</P>
      </Section>

      <Section title="8. Your Rights">
        <P>You have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your account and associated data; withdraw consent for processing at any time; and file a complaint with your applicable data protection authority.</P>
        <P>To exercise any of these rights, contact us at <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a>.</P>
      </Section>

      <Section title="9. Children's Privacy">
        <P>The Platform is not directed to children under the age of 13. We do not knowingly collect personal data from children under 13. If you believe we have inadvertently collected such data, please contact us immediately at <a href="mailto:agape@sovereign.nyc" style={{ color: NEON_BLUE }}>agape@sovereign.nyc</a>.</P>
      </Section>

      <Section title="10. Changes to This Policy">
        <P>We may update this Privacy Policy from time to time. Material changes will be communicated via email or a prominent notice on the Platform. Your continued use of the Platform after the effective date of any update constitutes your acceptance of the revised Policy.</P>
      </Section>

      <Section title="11. Contact Us">
        <P>For questions, requests, or concerns about this Privacy Policy or our data practices:</P>
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
        <a href="/privacy" style={{ fontSize: 12, color: NEON_BLUE, textDecoration: 'none' }}>Privacy Policy</a>
        <a href="/terms" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms of Service</a>
      </div>
    </footer>
  </div>
);
