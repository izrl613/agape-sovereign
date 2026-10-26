import type { LegalDocument } from './types';
import { LEGAL_PDFS } from './documentIds';

const CONTACT = 'agape@sovereign.nyc';

/**
 * Agape Sovereign – Architect AI: Privacy Policy, Version 1.0.
 * Source: signed Privacy Policy PDF, effective March 11, 2026.
 * Copy is intentionally 1:1 with the source document — do not paraphrase.
 */
export const privacyPolicy: LegalDocument = {
  kind: 'privacy',
  shortLabel: 'PRIVACY',
  title: 'Privacy Policy',
  tagline:
    'Digital Identity Federated Footprint (DIFF) Intelligence Platform — how your data is collected, encrypted, and controlled.',
  eyebrow: 'LEGAL · SOVEREIGN.NYC',
  effectiveDate: 'March 11, 2026',
  version: '1.0',
  operator: 'Israel David, operating as Agape Sovereign',
  contactEmail: CONTACT,
  canonicalPath: '/privacy',
  pdf: LEGAL_PDFS.privacy,
  intro: [
    {
      type: 'lead',
      text: 'This Privacy Policy applies to all users of the Agape Sovereign – Architect AI platform. By using the platform, you agree to the data practices described below.',
    },
  ],
  sections: [
    {
      id: 'sec-1',
      number: '1',
      title: 'Our Privacy Philosophy',
      blocks: [
        {
          type: 'p',
          text: 'Agape Sovereign – Architect AI ("the Platform," "we," "us," or "our") is a privacy-first, security-intelligence web application operated by Israel David, doing business as Agape Sovereign, at sovereign.nyc. The Platform exists to help you understand, protect, and reclaim every dimension of your Digital Identity Federated Footprint (DIFF) — not to profit from it.',
        },
        { type: 'p', text: 'We operate under a zero-knowledge architecture:' },
        {
          type: 'ul',
          items: [
            'Your sensitive identity data is encrypted client-side before it ever leaves your device.',
            'We cannot read, access, sell, share, or monetize the content you enter into the Platform.',
            'No advertising is served. No behavioral profiling is performed.',
            'The Platform administrator has access only to anonymized operational telemetry — never to your personal identity data.',
          ],
        },
        {
          type: 'note',
          text: 'We cannot see what you put in. It is encrypted on your device before it is ever stored anywhere. Nobody — not us, not Google, not Apple — can read your private identity data.',
        },
      ],
    },
    {
      id: 'sec-2',
      number: '2',
      title: 'Who We Are',
      blocks: [
        {
          type: 'facts',
          rows: [
            { k: 'Operator', v: 'Israel David, operating as Agape Sovereign' },
            { k: 'Administrator Emails', v: 'agape@sovereign.nyc' },
            { k: 'Platform URL', v: 'https://sovereign.nyc' },
            { k: 'GitHub Repository', v: 'https://github.com/izrl613/agape-sovereign' },
          ],
        },
        {
          type: 'p',
          text: 'Contact us at agape@sovereign.nyc with any questions about this Privacy Policy.',
        },
      ],
    },
    {
      id: 'sec-3',
      number: '3',
      title: 'Information We Collect',
      blocks: [],
      subsections: [
        {
          id: 'sec-3-1',
          number: '3.1',
          title: 'Information You Provide Directly',
          blocks: [
            {
              type: 'p',
              text: 'When you create an account and use the Platform’s sixteen (16) identity vector modules, you may provide:',
            },
            {
              type: 'ul',
              items: [
                'Email addresses associated with your accounts.',
                'Social media usernames or profile identifiers.',
                'Information about devices you own or use.',
                'File metadata patterns (not file contents) from device scans.',
                'Security posture information (e.g., whether two-factor authentication is enabled).',
                'Answers to identity-mapping questions across the DIFF module framework.',
              ],
            },
            {
              type: 'p',
              text: 'All data you enter is processed locally within your browser session and encrypted using SHA-256 cryptographic standards before transmission or storage. Each of the sixteen modules generates a unique, session-specific SHA-256 key tied to your entered data.',
            },
            {
              type: 'note',
              text: 'The information you type into each module is locked with a unique cryptographic key — like a personal lock on a safe — before it goes anywhere.',
            },
          ],
        },
        {
          id: 'sec-3-2',
          number: '3.2',
          title: 'Google OAuth Authentication Data',
          blocks: [
            {
              type: 'p',
              text: 'When you sign in using Google OAuth (or Apple ID), we receive only the following from those providers:',
            },
            {
              type: 'ul',
              items: [
                'Your display name (as registered with Google or Apple).',
                'Your email address — used solely for account identification.',
                'A unique provider-issued user identifier (UID).',
              ],
            },
            {
              type: 'p',
              text: 'This authentication data is used exclusively to establish your account session. It is never linked to, merged with, or used to decrypt the identity intelligence data you enter in the Platform’s DIFF modules. We do not request or receive any additional Google account data beyond what is necessary to authenticate you.',
            },
            {
              type: 'note',
              text: 'When you sign in with Google, we receive only your name, email, and a unique ID. That’s it. We use it to log you in — nothing else. We cannot see your Gmail, Drive, or any other Google data.',
            },
          ],
        },
        {
          id: 'sec-3-3',
          number: '3.3',
          title: 'Google OAuth Scopes Used',
          blocks: [
            {
              type: 'p',
              text: 'The Platform requests only the minimum OAuth scopes required to authenticate users:',
            },
            {
              type: 'ul',
              items: [
                '**openid** — confirms your identity with Google.',
                '**email** — retrieves your email address for account identification.',
                '**profile** — retrieves your basic name and profile picture for your account display.',
              ],
            },
            {
              type: 'p',
              text: 'We do not request access to Gmail, Google Drive, Google Contacts, Google Calendar, or any other Google service. If you see additional scopes requested, please report this to agape@sovereign.nyc immediately.',
            },
            {
              type: 'note',
              text: 'We ask Google for only three things — who you are, your email, and your name. We do not access any of your other Google account data.',
            },
          ],
        },
        {
          id: 'sec-3-4',
          number: '3.4',
          title: 'WebAuthn Passkey Data',
          blocks: [
            {
              type: 'p',
              text: 'After initial sign-in, the Platform creates a WebAuthn passkey bound to your physical device. We store only the public-key component of your passkey credential. The private key never leaves your device and is never transmitted to our servers.',
            },
          ],
        },
        {
          id: 'sec-3-5',
          number: '3.5',
          title: 'Operational and Technical Data',
          blocks: [
            {
              type: 'p',
              text: 'To maintain the security, performance, and integrity of the Platform, we collect limited technical data:',
            },
            {
              type: 'ul',
              items: [
                'Authentication event logs (login timestamps, passkey verification events).',
                'Firebase usage statistics (anonymized and aggregated).',
                'Cloud infrastructure health metrics.',
                'Application error reports (no personal data included).',
              ],
            },
            {
              type: 'p',
              text: 'This operational data is retained for no longer than ninety (90) days unless required by applicable law.',
            },
            {
              type: 'note',
              text: 'We keep basic system logs to make sure the system works and is not being abused. These logs do not contain your personal identity information.',
            },
          ],
        },
        {
          id: 'sec-3-6',
          number: '3.6',
          title: 'Information We Do Not Collect',
          blocks: [
            { type: 'p', text: 'We explicitly do not collect:' },
            {
              type: 'ul',
              items: [
                'The plaintext contents of the identity data you enter into any module.',
                'File contents from device scans (only metadata patterns).',
                'Payment information (the Platform is currently free of charge).',
                'Behavioral tracking data, advertising identifiers, or third-party analytics.',
                'Any data from users under the age of 13.',
                'Any Google account data beyond name, email, and UID.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'sec-4',
      number: '4',
      title: 'How Your Data Is Protected',
      blocks: [],
      subsections: [
        {
          id: 'sec-4-1',
          number: '4.1',
          title: 'Client-Side Encryption',
          blocks: [
            {
              type: 'p',
              text: 'All sensitive identity data entered across the Platform’s sixteen DIFF modules is encrypted on your device using SHA-256 hashing with client-side cryptographic keys that are unique per module and per user session. This encrypted data is what gets transmitted to and stored in Firebase Firestore — never the plaintext.',
            },
          ],
        },
        {
          id: 'sec-4-2',
          number: '4.2',
          title: 'Firebase Security Infrastructure',
          blocks: [
            {
              type: 'p',
              text: 'The Platform’s backend is built entirely on Google Firebase free-tier services with the following security controls in place:',
            },
            {
              type: 'ul',
              items: [
                '**Firebase Authentication:** manages all federated sign-in sessions and secure token issuance.',
                '**Firestore Security Rules:** enforce strict role-based access so that only the authenticated account owner can read or write their own records.',
                '**Firebase App Check:** prevents unauthorized clients and bots from accessing backend services.',
                '**Firebase Storage:** stores exported PDF reports accessible only by the authenticated account owner.',
                '**Firebase Cloud Functions:** execute all server-side logic in isolated, stateless, ephemeral environments.',
              ],
            },
          ],
        },
        {
          id: 'sec-4-3',
          number: '4.3',
          title: 'Zero Plaintext Storage',
          blocks: [
            {
              type: 'p',
              text: 'The Platform is architected so that at no point is unencrypted sensitive identity data written to any persistent storage layer — including Firebase Firestore, Firebase Storage, browser localStorage, or server-side logs.',
            },
          ],
        },
        {
          id: 'sec-4-4',
          number: '4.4',
          title: 'Two-Factor Security via Passkey',
          blocks: [
            {
              type: 'p',
              text: 'After your first Google or Apple sign-in, you are required to register a WebAuthn passkey bound to your device. Every subsequent session requires both your federated identity credential and your device passkey, providing strong two-factor authentication without reliance on passwords.',
            },
          ],
        },
        {
          id: 'sec-4-5',
          number: '4.5',
          title: 'Data Retention',
          blocks: [
            {
              type: 'p',
              text: 'Your encrypted DIFF profile data is retained for up to two (2) years from the date of creation or most recent update, after which it is automatically purged from active storage. Exported PDF Identity Audit Reports stored in Firebase Storage remain accessible to your account for the same two-year period. You may permanently delete your data at any time through your user profile. Deletion is immediate and irreversible.',
            },
            {
              type: 'note',
              text: 'Your data stays encrypted, stored only in your account, and is deleted after two years — or sooner if you delete it yourself.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-5',
      number: '5',
      title: 'How We Share Your Information',
      blocks: [
        {
          type: 'p',
          text: 'We do not sell, rent, lease, or trade your personal information under any circumstances.',
        },
        {
          type: 'p',
          text: 'We share limited, non-personal operational data only in the following situations:',
        },
        {
          type: 'ul',
          items: [
            '**Google (Firebase / Google Cloud):** as our infrastructure provider, Google processes infrastructure-level operational data as a data processor subject to Google’s own terms of service and privacy policies. Google does not receive access to your encrypted DIFF data.',
            '**Apple:** when you authenticate using Apple ID, Apple processes your authentication data under Apple’s privacy policies. We receive only the limited information described in Section 3.2.',
            '**Law Enforcement:** only when legally compelled by a valid court order, subpoena, or equivalent legal instrument under applicable law. We will notify you of any such request to the extent we are legally permitted to do so.',
          ],
        },
        {
          type: 'note',
          text: 'We do not sell your data to anyone. The only parties involved are the cloud services that run this app, and even they cannot read your encrypted identity data.',
        },
      ],
    },
    {
      id: 'sec-6',
      number: '6',
      title: 'Your Rights and Controls',
      blocks: [],
      subsections: [
        {
          id: 'sec-6-1',
          number: '6.1',
          title: 'Right to Access',
          blocks: [
            {
              type: 'p',
              text: 'You may request a copy of the personal information we hold about your account. Because your DIFF module data is encrypted and we cannot decrypt it, the data provided will consist of account metadata and any operational records we hold in plaintext.',
            },
          ],
        },
        {
          id: 'sec-6-2',
          number: '6.2',
          title: 'Right to Deletion',
          blocks: [
            {
              type: 'p',
              text: 'You may delete your account and all associated data at any time through your user profile. Upon deletion, all Firestore records, Firebase Storage files, and Authentication credentials associated with your account are permanently and irreversibly removed.',
            },
          ],
        },
        {
          id: 'sec-6-3',
          number: '6.3',
          title: 'Right to Correction',
          blocks: [
            {
              type: 'p',
              text: 'You may update your account metadata (such as your profile email addresses) at any time within your user profile.',
            },
          ],
        },
        {
          id: 'sec-6-4',
          number: '6.4',
          title: 'Right to Data Portability',
          blocks: [
            {
              type: 'p',
              text: 'You may export your Identity Audit Report as a downloadable PDF at any time. This report is the compiled, human-readable summary of your DIFF intelligence data and serves as your portable personal privacy record.',
            },
          ],
        },
        {
          id: 'sec-6-5',
          number: '6.5',
          title: 'Right to Restrict Processing',
          blocks: [
            {
              type: 'p',
              text: 'You may stop using the Platform at any time. Because we do not perform advertising-based or behavioral data processing, no additional opt-out mechanism is required for those purposes.',
            },
          ],
        },
        {
          id: 'sec-6-6',
          number: '6.6',
          title: 'Revoking Google OAuth Access',
          blocks: [
            {
              type: 'p',
              text: 'You may revoke the Platform’s access to your Google account at any time by visiting your Google Account security settings at https://myaccount.google.com/permissions. Revoking access will sign you out of the Platform and prevent future Google-based sign-ins. Your encrypted DIFF data stored in Firebase will remain in your account until you separately delete it through your Platform user profile or submit a deletion request to agape@sovereign.nyc.',
            },
            {
              type: 'note',
              text: 'You can disconnect Google from this app at any time through your Google Account settings. Your Platform data is stored separately and will remain until you delete it.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-7',
      number: '7',
      title: 'Compliance with Privacy Standards',
      blocks: [
        {
          type: 'p',
          text: 'The Platform is designed in alignment with the following privacy frameworks and standards:',
        },
        {
          type: 'ul',
          items: [
            '**2026 Electronic Consumer Rights Act (ECRA 2026)** — conceptual framework governing digital data rights as of Platform launch.',
            '**General Data Protection Regulation (GDPR)** — data minimization, purpose limitation, user rights, and lawful basis for processing.',
            '**California Consumer Privacy Act (CCPA) / California Privacy Rights Act (CPRA)** — consumer rights over personal information.',
            '**Children’s Online Privacy Protection Act (COPPA)** — the Platform does not knowingly collect data from users under 13.',
            '**Google API Services User Data Policy** — the Platform’s use of Google OAuth data adheres to Google’s API Services User Data Policy, including the Limited Use requirements.',
          ],
        },
        {
          type: 'note',
          text: 'We follow the strictest applicable privacy laws and Google’s own data use policies. We only use Google sign-in data to log you in — nothing else.',
        },
      ],
    },
    {
      id: 'sec-8',
      number: '8',
      title: 'Cookies and Tracking',
      blocks: [
        {
          type: 'p',
          text: 'The Platform uses only technically necessary browser session mechanisms required for authentication and passkey management. These are cleared when you sign out.',
        },
        {
          type: 'p',
          text: 'We do not use: advertising cookies; cross-site tracking pixels; third-party analytics scripts; or any technology that transmits your data to external parties for marketing purposes.',
        },
        {
          type: 'note',
          text: 'We use the minimum required to keep you logged in. We do not track you across other websites.',
        },
      ],
    },
    {
      id: 'sec-9',
      number: '9',
      title: 'Children’s Privacy',
      blocks: [
        {
          type: 'p',
          text: 'The Platform is not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a user under 13 has created an account, we will immediately delete all associated data and terminate the account. Contact us at agape@sovereign.nyc if you believe a child under 13 has used the Platform.',
        },
      ],
    },
    {
      id: 'sec-10',
      number: '10',
      title: 'International Data Transfers',
      blocks: [
        {
          type: 'p',
          text: 'The Platform is built on Google Firebase, which may process and store data across multiple geographic regions operated by Google. By using the Platform, you acknowledge that your data may be processed in jurisdictions outside your country of residence, including the United States. Where required by applicable law, we rely on standard contractual clauses or equivalent transfer mechanisms as implemented by Google.',
        },
      ],
    },
    {
      id: 'sec-11',
      number: '11',
      title: 'Changes to This Privacy Policy',
      blocks: [
        {
          type: 'p',
          text: 'We may update this Privacy Policy from time to time. When we make material changes, we will notify you through an in-app notice and update the effective date at the top of this document. Your continued use of the Platform after the updated effective date constitutes acceptance of the revised policy. The current version is always available at https://github.com/izrl613/agape-sovereign and at https://sovereign.nyc/privacy.',
        },
      ],
    },
  ],
  documentDetails: [
    { k: 'Document', v: 'Agape Sovereign – Architect AI: Privacy Policy' },
    { k: 'Version', v: '1.0' },
    { k: 'Effective Date', v: 'March 11, 2026' },
    { k: 'Operator', v: 'Israel David, operating as Agape Sovereign' },
    { k: 'Contact', v: 'agape@sovereign.nyc' },
    { k: 'Platform URL', v: 'https://sovereign.nyc' },
    { k: 'GitHub', v: 'https://github.com/izrl613/agape-sovereign' },
    { k: 'OAuth Scopes Used', v: 'openid, email, profile' },
    { k: 'Google Policy Compliance', v: 'Google API Services User Data Policy — Limited Use' },
    { k: 'Compliance Frameworks', v: 'ECRA 2026 | GDPR | CCPA/CPRA | COPPA' },
  ],
  // Same closing sequence as the Terms of Service: details → signature → contact.
  signatureName: 'Israel David',
  signatureRole: 'Operator, Agape Sovereign',
  signatureContacts: ['agape@sovereign.nyc'],
};
