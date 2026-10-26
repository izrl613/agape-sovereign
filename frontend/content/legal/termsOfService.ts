import type { LegalDocument } from './types';

/**
 * Agape Sovereign – Architect AI: Terms of Service, Version 1.0.
 * Source: signed Terms of Service PDF (11 pages), effective March 11, 2026.
 * Copy is intentionally 1:1 with the source document — do not paraphrase.
 * (One correction: the source PDF prints the repository as
 *  github.com/izrl613/agape-ai — the live repository is agape-sovereign.)
 */
export const termsOfService: LegalDocument = {
  kind: 'terms',
  shortLabel: 'TERMS',
  title: 'Terms of Service',
  tagline:
    'The binding agreement between you and Agape Sovereign covering eligibility, acceptable use, liability, and dispute resolution.',
  eyebrow: 'LEGAL · SOVEREIGN.NYC',
  effectiveDate: 'March 11, 2026',
  version: '1.0',
  operator: 'Israel David, operating as Agape Sovereign',
  contactEmail: 'agape@sovereign.nyc',
  canonicalPath: '/terms',
  intro: [
    {
      type: 'lead',
      text: 'By accessing or using the Platform, you agree to these Terms of Service. If you do not agree, you must not use the Platform.',
    },
  ],
  sections: [
    {
      id: 'sec-1',
      number: '1',
      title: 'Acceptance of Terms',
      blocks: [
        {
          type: 'p',
          text: 'By accessing, browsing, or using the Agape Sovereign – Architect AI Platform (accessible at sovereign.nyc and related subdomains, collectively ‘the Platform’), you confirm that you have read, understood, and agree to be bound by these Terms of Service (‘Terms’) and our separate Privacy Policy, both of which govern your use of the Platform.',
        },
        {
          type: 'p',
          text: 'These Terms constitute a legally binding agreement between you (‘User’) and Israel David, operating as Agape Sovereign (‘Operator,’ ‘we,’ ‘us,’ or ‘our’).',
        },
        {
          type: 'facts',
          rows: [
            { k: 'Operator', v: 'Israel David, operating as Agape Sovereign' },
            { k: 'Contact', v: 'idin@agape.nyc | agape@sovereign.nyc' },
            { k: 'Platform', v: 'https://sovereign.nyc' },
            { k: 'Privacy Policy', v: 'https://sovereign.nyc/privacy | https://github.com/izrl613/agape-sovereign' },
          ],
        },
        {
          type: 'note',
          text: 'Using the app means you agree to these rules. If you do not agree, please do not use the app.',
        },
      ],
    },
    {
      id: 'sec-2',
      number: '2',
      title: 'Eligibility',
      blocks: [
        { type: 'p', text: 'To use the Platform you must:' },
        {
          type: 'ul',
          items: [
            'Be at least 13 years of age.',
            'Have the legal capacity to enter into a binding agreement under the laws of your jurisdiction.',
            'Not be prohibited from using the Platform under any applicable law, regulation, or court order.',
            'Provide accurate and truthful information when creating your account.',
          ],
        },
        {
          type: 'p',
          text: 'If you are using the Platform on behalf of an organization, you represent and warrant that you have authority to bind that organization to these Terms.',
        },
      ],
    },
    {
      id: 'sec-3',
      number: '3',
      title: 'Account Registration and Security',
      blocks: [],
      subsections: [
        {
          id: 'sec-3-1',
          number: '3.1',
          title: 'Google OAuth and Federated Authentication',
          blocks: [
            {
              type: 'p',
              text: 'Access to the Platform requires authentication through a supported federated identity provider: Google Account (via Google OAuth 2.0) or Apple ID. By signing in with Google, you authorize the Platform to receive limited account information — specifically your name, email address, and Google user ID — as described in our Privacy Policy. You remain subject to Google’s Terms of Service and Privacy Policy for your Google account.',
            },
            {
              type: 'p',
              text: 'The Platform requests only the minimum OAuth scopes necessary to authenticate you: **openid**, **email**, and **profile**. We do not request access to Gmail, Google Drive, Google Contacts, or any other Google services.',
            },
            {
              type: 'note',
              text: 'Signing in with Google gives us only your name, email, and ID. We cannot access your Gmail, Drive, or any other Google data.',
            },
          ],
        },
        {
          id: 'sec-3-2',
          number: '3.2',
          title: 'WebAuthn Passkey',
          blocks: [
            {
              type: 'p',
              text: 'After initial sign-in, you are required to register a WebAuthn passkey bound to your physical device. Every subsequent session requires both your federated identity credential and your device passkey, providing strong two-factor security. You are responsible for maintaining the physical security of your enrolled device. Notify us immediately at agape@sovereign.nyc if you believe your account or device has been compromised.',
            },
          ],
        },
        {
          id: 'sec-3-3',
          number: '3.3',
          title: 'Account Responsibility',
          blocks: [
            {
              type: 'p',
              text: 'You are solely responsible for all activity that occurs under your account. We are not liable for any loss or damage arising from unauthorized use of your account where such use results from your failure to maintain the security of your credentials or device.',
            },
          ],
        },
        {
          id: 'sec-3-4',
          number: '3.4',
          title: 'Administrator Portal — Restricted Access',
          blocks: [
            {
              type: 'p',
              text: 'The Platform includes a restricted Administrator Portal accessible only to the following verified administrator accounts:',
            },
            { type: 'ul', items: ['idin@agape.nyc', 'agape@sovereign.nyc'] },
            {
              type: 'p',
              text: 'Any attempt to access the Administrator Portal by any other individual is strictly prohibited and may constitute a criminal offense under the Computer Fraud and Abuse Act (CFAA), 18 U.S.C. § 1030, and equivalent international statutes. Unauthorized access attempts will be logged and may be reported to law enforcement.',
            },
            {
              type: 'note',
              text: 'Only Israel David, using those two admin emails, can access the backend. Do not attempt to access it if you are not that person.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-4',
      number: '4',
      title: 'Permitted and Prohibited Use',
      blocks: [],
      subsections: [
        {
          id: 'sec-4-1',
          number: '4.1',
          title: 'Permitted Use',
          blocks: [
            {
              type: 'p',
              text: 'You may use the Platform solely for its intended purpose: understanding, managing, and improving your own personal Digital Identity Federated Footprint (DIFF) for legitimate personal privacy and security purposes in compliance with all applicable laws.',
            },
          ],
        },
        {
          id: 'sec-4-2',
          number: '4.2',
          title: 'Prohibited Use',
          blocks: [
            { type: 'p', text: 'You must not use the Platform to:' },
            {
              type: 'ul',
              items: [
                'Provide false, misleading, or fraudulent identity information.',
                'Scan, monitor, or compile DIFF data on any person other than yourself without their explicit written consent.',
                'Attempt to reverse-engineer, decompile, or extract the Platform’s proprietary algorithms, cryptographic logic, or source code.',
                'Perform automated scraping, crawling, penetration testing, or load testing of the Platform’s infrastructure without prior written permission from the Operator.',
                'Circumvent, disable, or tamper with any security feature of the Platform, including authentication mechanisms, encryption systems, Firebase Security Rules, or App Check.',
                'Upload, transmit, or store malware, ransomware, spyware, or any code designed to damage or gain unauthorized access to systems.',
                'Use the Platform to facilitate stalking, harassment, unauthorized surveillance, or any other illegal activity targeting another individual.',
                'Violate any applicable local, state, federal, national, or international law or regulation.',
                'Impersonate any person or entity, including Platform administrators.',
                'Use the Platform for any commercial purpose without the Operator’s prior written consent.',
              ],
            },
            {
              type: 'p',
              text: 'Violation of these prohibitions may result in immediate account termination without notice, reporting to law enforcement, and civil or criminal legal action.',
            },
            {
              type: 'note',
              text: 'Use the app for yourself, legally. Do not try to spy on others, break the system, or use it for anything illegal or commercial.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-5',
      number: '5',
      title: 'The DIFF Intelligence System — Scope and Limitations',
      blocks: [],
      subsections: [
        {
          id: 'sec-5-1',
          number: '5.1',
          title: 'Nature of DIFF Analysis',
          blocks: [
            {
              type: 'p',
              text: 'The Platform provides privacy and security intelligence tools through its sixteen (16) identity vector modules. The NUKED and KNOXED classification system generates actionable recommendations based on the data you input and publicly available information. All classifications are informational in nature. They do not constitute legal advice, professional cybersecurity consultation, or a guarantee of any specific privacy or security outcome.',
            },
          ],
        },
        {
          id: 'sec-5-2',
          number: '5.2',
          title: 'Architect AI — AI-Generated Responses',
          blocks: [
            {
              type: 'p',
              text: 'The Architect AI conversational engine is powered by Google Gemini AI and provides responses about security and privacy topics for informational and educational purposes only. Architect AI responses do not constitute legal, financial, medical, or professional advice of any kind. You should consult qualified professionals for advice specific to your individual circumstances.',
            },
          ],
        },
        {
          id: 'sec-5-3',
          number: '5.3',
          title: 'NUKED Classifications',
          blocks: [
            {
              type: 'p',
              text: 'When the Platform classifies items as NUKED and recommends data removal actions, those recommendations are based on automated analysis. The Platform may assist you in generating data removal requests to third-party data brokers and platforms. The effectiveness of such requests depends entirely on the policies and compliance of those third parties, which are beyond our control. We make no warranty that NUKED actions will result in the complete or permanent removal of your data from any third-party system.',
            },
          ],
        },
        {
          id: 'sec-5-4',
          number: '5.4',
          title: 'KNOXED Classifications',
          blocks: [
            {
              type: 'p',
              text: 'When items are classified as KNOXED, this indicates that within the scope of the Platform’s analysis, the relevant item meets the Platform’s defined security benchmarks at the time of classification. KNOXED status is not a guarantee of absolute or permanent security. The digital threat landscape evolves continuously, and new vulnerabilities or exposures may emerge after a KNOXED classification is assigned.',
            },
            {
              type: 'note',
              text: 'NUKED and KNOXED are powerful guidance tools — not absolute guarantees. Use them alongside professional security advice and other protective measures.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-6',
      number: '6',
      title: 'The Sovereign Score',
      blocks: [
        {
          type: 'p',
          text: 'The Sovereign Score is a dynamic numeric indicator ranging from 0 to 100, calculated by the Platform based on aggregated factors including: breach exposure count, data broker footprint density, passkey enrollment status, two-factor authentication status, device encryption status, and overall DIFF module exposure density.',
        },
        {
          type: 'p',
          text: 'The Sovereign Score is a relative, time-sensitive indicator of your measured security posture. It is not a credit score, insurance rating, professional risk assessment, or representation of your absolute security. You should not rely solely on the Sovereign Score when making decisions about your digital security.',
        },
      ],
    },
    {
      id: 'sec-7',
      number: '7',
      title: 'PDF Identity Audit Report',
      blocks: [
        {
          type: 'p',
          text: 'The Platform generates a PDF Identity Audit Report (‘the Report’) summarizing your DIFF data and Sovereign Score in a human-readable format. The Report is:',
        },
        {
          type: 'ul',
          items: [
            'Generated on demand at your request only.',
            'Encrypted and stored in Firebase Storage under your authenticated account.',
            'Accessible and downloadable only by your authenticated account.',
            'Retained for up to two (2) years from the date of generation.',
            'Permanently deleted when you delete your account.',
          ],
        },
        {
          type: 'p',
          text: 'You may share the Report with trusted advisors at your discretion. We are not responsible for any consequences arising from your sharing the Report with third parties. The Report is intended for personal use only and does not constitute a certified security audit.',
        },
        {
          type: 'note',
          text: 'Your privacy report is yours alone. Only you can download it. It is stored securely and deleted automatically after two years or when you delete your account.',
        },
      ],
    },
    {
      id: 'sec-8',
      number: '8',
      title: 'Intellectual Property',
      blocks: [],
      subsections: [
        {
          id: 'sec-8-1',
          number: '8.1',
          title: 'Platform Ownership',
          blocks: [
            {
              type: 'p',
              text: 'All intellectual property rights in and to the Platform — including its software, source code, design, user interface, branding, the DIFF framework, the NUKED and KNOXED classification system, the Sovereign Score algorithm, and the Architect AI interface — are exclusively owned by Israel David, operating as Agape Sovereign, or are licensed to the Operator by third-party providers. All rights are reserved.',
            },
          ],
        },
        {
          id: 'sec-8-2',
          number: '8.2',
          title: 'License to Use',
          blocks: [
            {
              type: 'p',
              text: 'We grant you a limited, personal, non-exclusive, non-transferable, revocable license to access and use the Platform for your personal, non-commercial privacy and security management purposes in accordance with these Terms. This license does not include any right to: copy, reproduce, modify, or distribute any part of the Platform; create derivative works; sublicense access to others; or use any Platform trademarks, logos, or branding without prior written permission.',
            },
          ],
        },
        {
          id: 'sec-8-3',
          number: '8.3',
          title: 'Your Data',
          blocks: [
            {
              type: 'p',
              text: 'Because all data you enter is encrypted client-side and we cannot access its plaintext, you retain full ownership of all identity data you enter into the Platform. You grant us only the narrow, technical license necessary to store and process that encrypted data for the sole purpose of providing the Platform’s services to you.',
            },
            {
              type: 'note',
              text: 'Your data is yours. We own the app. You have a right to use the app; we do not have a right to use your data.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-9',
      number: '9',
      title: 'Third-Party Services',
      blocks: [
        {
          type: 'p',
          text: 'The Platform integrates with the following third-party services, each of which has its own terms and privacy policies independent of these Terms:',
        },
        {
          type: 'ul',
          items: [
            '**Google Firebase** — Authentication, Firestore, Hosting, Cloud Functions, Storage, App Check (Google LLC).',
            '**Google Gemini AI API** — powers the Architect AI conversational engine (Google LLC).',
            '**Google OAuth 2.0** — federated sign-in (Google LLC).',
            '**Apple Sign In** — federated sign-in (Apple Inc.).',
            '**WebAuthn Browser APIs** — device-bound passkey authentication (W3C standard, implemented by your browser).',
          ],
        },
        {
          type: 'p',
          text: 'We are not responsible for the availability, security, or practices of these third-party providers. Links or references to external websites or resources provided within the Platform are for informational purposes only and do not constitute endorsement.',
        },
      ],
    },
    {
      id: 'sec-10',
      number: '10',
      title: 'Disclaimers and Limitation of Liability',
      blocks: [],
      subsections: [
        {
          id: 'sec-10-1',
          number: '10.1',
          title: 'As-Is Disclaimer',
          blocks: [
            {
              type: 'allcaps',
              text: 'The Platform is provided ‘as is’ and ‘as available’ without warranties of any kind, express or implied, including but not limited to any implied warranties of merchantability, fitness for a particular purpose, non-infringement, accuracy, or security. We do not warrant that the Platform will be uninterrupted, error-free, virus-free, or that defects will be corrected.',
            },
          ],
        },
        {
          id: 'sec-10-2',
          number: '10.2',
          title: 'Limitation of Liability',
          blocks: [
            {
              type: 'allcaps',
              text: 'To the fullest extent permitted by applicable law, in no event shall Israel David, Agape Sovereign, or any of their respective affiliates, successors, assigns, officers, directors, employees, or agents be liable to you or any third party for any indirect, incidental, special, consequential, exemplary, punitive, or enhanced damages, including but not limited to loss of data, loss of profits, loss of business, loss of goodwill, or cost of procurement of substitute services, arising out of or in connection with your access to, use of, or inability to use the Platform, even if we have been advised of the possibility of such damages.',
            },
            {
              type: 'allcaps',
              text: 'Our total cumulative liability to you for all claims arising out of or relating to these Terms or the Platform, regardless of the form of action or the basis of the claim, shall not exceed one hundred United States dollars (USD $100.00), or the total fees paid by you to us in the twelve (12) months preceding the event giving rise to the claim, whichever is greater. Because the Platform is currently provided free of charge, this effectively limits our liability to USD $100.00.',
            },
            {
              type: 'note',
              text: 'We built this with care, but we cannot guarantee perfection. If something goes wrong, our legal liability is capped at $100. Use the Platform as a powerful tool — alongside professional security measures — not as your only line of defense.',
            },
          ],
        },
        {
          id: 'sec-10-3',
          number: '10.3',
          title: 'Indemnification',
          blocks: [
            {
              type: 'p',
              text: 'You agree to indemnify, defend, and hold harmless Israel David, Agape Sovereign, and any applicable successors, assigns, officers, directors, employees, and agents from and against any and all third-party claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys’ fees) arising out of or relating to: (a) your violation of these Terms; (b) your use or misuse of the Platform; (c) your violation of any applicable law or regulation; or (d) your violation of any rights of a third party.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-11',
      number: '11',
      title: 'Privacy of Other Individuals',
      blocks: [
        {
          type: 'p',
          text: 'The Platform’s scanning and analysis capabilities are intended exclusively for use with respect to your own digital identity. You must not use the Platform to collect, analyze, monitor, or build a DIFF intelligence profile on any other individual without their explicit, informed, written consent. Unauthorized use of the Platform to surveil, stalk, or gather intelligence on another individual is strictly prohibited and may violate:',
        },
        {
          type: 'ul',
          items: [
            'The Electronic Communications Privacy Act (ECPA), 18 U.S.C. § 2510 et seq.',
            'The Stored Communications Act (SCA), 18 U.S.C. § 2701 et seq.',
            'The Computer Fraud and Abuse Act (CFAA), 18 U.S.C. § 1030.',
            'Applicable state surveillance, wiretapping, and consumer protection statutes.',
          ],
        },
      ],
    },
    {
      id: 'sec-12',
      number: '12',
      title: 'Compliance with ECRA 2026 and Applicable Law',
      blocks: [
        {
          type: 'p',
          text: 'The Platform is designed in alignment with the principles of the Electronic Consumer Rights Act 2026 (ECRA 2026) as a conceptual framework governing individual digital data rights. We adopt the following ECRA-aligned commitments:',
        },
        {
          type: 'ul',
          items: [
            '**Transparency** — we clearly disclose what data we process and why.',
            '**Control** — we provide in-platform mechanisms for you to access, export, correct, and delete your data.',
            '**Security** — we apply current best-practice cryptographic and infrastructure security controls.',
            '**Minimization** — we collect only the data strictly necessary to provide the Platform’s services.',
            '**Consent** — we obtain your agreement to these Terms and our Privacy Policy before processing your identity data.',
          ],
        },
        {
          type: 'note',
          text: 'We built this app to respect your digital rights under the most current privacy standards, including emerging 2026 frameworks. As those standards evolve, we will evolve with them.',
        },
      ],
    },
    {
      id: 'sec-13',
      number: '13',
      title: 'Termination',
      blocks: [],
      subsections: [
        {
          id: 'sec-13-1',
          number: '13.1',
          title: 'Termination by You',
          blocks: [
            {
              type: 'p',
              text: 'You may terminate your account at any time by accessing your user profile and selecting the permanent account deletion option. All associated encrypted DIFF data, Firebase Storage files, and authentication credentials will be immediately and permanently deleted.',
            },
          ],
        },
        {
          id: 'sec-13-2',
          number: '13.2',
          title: 'Termination by Us',
          blocks: [
            {
              type: 'p',
              text: 'We reserve the right to suspend or permanently terminate your access to the Platform at any time, with or without prior notice, if we reasonably determine that you have: violated any provision of these Terms; engaged in fraudulent, abusive, or illegal activity; or taken actions that threaten the security, integrity, or availability of the Platform or its users.',
            },
          ],
        },
        {
          id: 'sec-13-3',
          number: '13.3',
          title: 'Effect of Termination',
          blocks: [
            {
              type: 'p',
              text: 'Upon termination, your license to access and use the Platform ceases immediately. The following Sections shall survive any termination of your account or these Terms: Section 8 (Intellectual Property), Section 10 (Disclaimers and Limitation of Liability), Section 11 (Privacy of Other Individuals), and Section 15 (Governing Law and Dispute Resolution).',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-14',
      number: '14',
      title: 'Modifications to These Terms',
      blocks: [
        {
          type: 'p',
          text: 'We reserve the right to modify these Terms at any time. When we make material changes, we will provide notice through an in-app notification and by updating the effective date at the top of this document. Your continued use of the Platform after the updated effective date constitutes your binding acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Platform. The current version of these Terms is always available at https://github.com/izrl613/agape-sovereign and at https://sovereign.nyc/terms.',
        },
      ],
    },
    {
      id: 'sec-15',
      number: '15',
      title: 'Governing Law and Dispute Resolution',
      blocks: [],
      subsections: [
        {
          id: 'sec-15-1',
          number: '15.1',
          title: 'Governing Law',
          blocks: [
            {
              type: 'p',
              text: 'These Terms and all disputes arising from or relating to your use of the Platform shall be governed by and construed in accordance with the laws of the State of New York, United States of America, without giving effect to any conflict of law provisions.',
            },
          ],
        },
        {
          id: 'sec-15-2',
          number: '15.2',
          title: 'Informal Resolution',
          blocks: [
            {
              type: 'p',
              text: 'Before initiating any formal legal proceeding, you agree to first attempt to resolve the dispute informally by contacting us at agape@sovereign.nyc with a written description of your claim. We will make a good-faith effort to resolve the dispute within thirty (30) calendar days of receiving your written notice.',
            },
          ],
        },
        {
          id: 'sec-15-3',
          number: '15.3',
          title: 'Binding Arbitration',
          blocks: [
            {
              type: 'p',
              text: 'If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or the Platform — including questions about the existence, validity, or termination of these Terms — shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, which are available at www.adr.org. Arbitration shall take place in New York County, New York, or by videoconference at the election of either party. The arbitrator’s award shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.',
            },
          ],
        },
        {
          id: 'sec-15-4',
          number: '15.4',
          title: 'Class Action Waiver',
          blocks: [
            {
              type: 'allcaps',
              text: 'To the fullest extent permitted by applicable law, you and Agape Sovereign each irrevocably waive the right to a jury trial and the right to participate as a plaintiff or class member in any purported class action lawsuit, class-wide arbitration, or representative proceeding. All disputes must be brought in an individual capacity only.',
            },
          ],
        },
        {
          id: 'sec-15-5',
          number: '15.5',
          title: 'Exception for Injunctive Relief',
          blocks: [
            {
              type: 'p',
              text: 'Notwithstanding the arbitration agreement above, either party may seek temporary or emergency injunctive or other equitable relief in a court of competent jurisdiction to protect intellectual property rights, prevent misappropriation of confidential information, or prevent irreparable harm pending the outcome of arbitration.',
            },
            {
              type: 'note',
              text: 'If there is ever a legal dispute, we first try to talk it out. If that fails, the dispute goes to arbitration in New York — not a class-action lawsuit.',
            },
          ],
        },
      ],
    },
    {
      id: 'sec-16',
      number: '16',
      title: 'Miscellaneous',
      blocks: [],
      subsections: [
        {
          id: 'sec-16-1',
          number: '16.1',
          title: 'Entire Agreement',
          blocks: [
            {
              type: 'p',
              text: 'These Terms, together with the Platform’s Privacy Policy (available separately at https://sovereign.nyc/privacy), constitute the entire and exclusive agreement between you and Agape Sovereign concerning the Platform and supersede all prior agreements, representations, warranties, and understandings, whether written or oral.',
            },
          ],
        },
        {
          id: 'sec-16-2',
          number: '16.2',
          title: 'Severability',
          blocks: [
            {
              type: 'p',
              text: 'If any provision of these Terms is found by a court of competent jurisdiction to be invalid, illegal, or unenforceable, that provision shall be modified to the minimum extent necessary to make it enforceable, or if not possible, shall be severed from these Terms. The remaining provisions shall continue in full force and effect.',
            },
          ],
        },
        {
          id: 'sec-16-3',
          number: '16.3',
          title: 'No Waiver',
          blocks: [
            {
              type: 'p',
              text: 'Our failure or delay in exercising any right, power, or privilege under these Terms shall not operate as a waiver of that right, power, or privilege. No waiver shall be effective unless made in writing and signed by an authorized representative of Agape Sovereign.',
            },
          ],
        },
        {
          id: 'sec-16-4',
          number: '16.4',
          title: 'Assignment',
          blocks: [
            {
              type: 'p',
              text: 'You may not assign, delegate, or transfer any of your rights or obligations under these Terms without our prior written consent. Any purported assignment in violation of this Section is null and void. We may assign our rights and obligations under these Terms without restriction, including in connection with a merger, acquisition, corporate reorganization, or sale of assets.',
            },
          ],
        },
        {
          id: 'sec-16-5',
          number: '16.5',
          title: 'Notices',
          blocks: [
            {
              type: 'p',
              text: 'All legal notices to Agape Sovereign must be delivered in writing to agape@sovereign.nyc. Electronic notices are effective upon confirmed receipt.',
            },
          ],
        },
        {
          id: 'sec-16-6',
          number: '16.6',
          title: 'Force Majeure',
          blocks: [
            {
              type: 'p',
              text: 'We are not liable for any delay or failure to perform any obligation under these Terms to the extent such delay or failure is caused by circumstances beyond our reasonable control, including but not limited to acts of God, natural disasters, pandemics, power outages, internet infrastructure failures, government actions, cyberattacks on third-party infrastructure providers, or labor disputes.',
            },
          ],
        },
        {
          id: 'sec-16-7',
          number: '16.7',
          title: 'Relationship of the Parties',
          blocks: [
            {
              type: 'p',
              text: 'Nothing in these Terms shall create or be deemed to create a partnership, joint venture, employment relationship, franchise, or agency relationship between you and Agape Sovereign. You are an independent user of the Platform.',
            },
          ],
        },
      ],
    },
  ],
  documentDetails: [
    { k: 'Document', v: 'Agape Sovereign – Architect AI: Terms of Service' },
    { k: 'Version', v: '1.0' },
    { k: 'Effective Date', v: 'March 11, 2026' },
    { k: 'Operator', v: 'Israel David, operating as Agape Sovereign' },
    { k: 'Contact', v: 'idin@agape.nyc | agape@sovereign.nyc' },
    { k: 'Platform URL', v: 'https://sovereign.nyc' },
    { k: 'Terms URL', v: 'https://sovereign.nyc/terms' },
    { k: 'Privacy Policy URL', v: 'https://sovereign.nyc/privacy' },
    { k: 'GitHub', v: 'https://github.com/izrl613/agape-sovereign' },
    { k: 'Governing Jurisdiction', v: 'State of New York, United States of America' },
    { k: 'Arbitration Body', v: 'American Arbitration Association (AAA) — Consumer Arbitration Rules' },
    { k: 'Auth Providers', v: 'Google OAuth 2.0 | Apple ID | WebAuthn Passkey' },
    { k: 'Compliance Frameworks', v: 'ECRA 2026 | GDPR | CCPA/CPRA | COPPA | CFAA' },
    { k: 'Core Identifiers', v: 'NUKED | KNOXED | DIFF | Sovereign Score' },
  ],
  signatureName: 'Israel David',
  signatureRole: 'Operator, Agape Sovereign',
  signatureContacts: ['idin@agape.nyc', 'agape@sovereign.nyc'],
};
