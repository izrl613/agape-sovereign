import { ArrowLeft, Shield, Lock, Mail } from 'lucide-react';
import { NEON } from '../theme';

export type LegalKind = 'TERMS' | 'PRIVACY' | 'CONTACT';

export function LegalPage({ kind, onBack }: { kind: LegalKind; onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#060c1a', color: NEON.text, padding: '32px 20px', fontFamily: "'Rajdhani', sans-serif" }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,212,255,0.08)',
            border: `1px solid ${NEON.blue}44`, color: NEON.blue, borderRadius: 8, padding: '7px 14px',
            cursor: 'pointer', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', marginBottom: 24,
          }}
        >
          <ArrowLeft size={14} /> BACK TO AGAPE SOVEREIGN
        </button>

        {kind === 'PRIVACY' && (
          <article style={{ background: NEON.bgCard, border: `1px solid ${NEON.blue}33`, borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Lock size={20} color={NEON.green} />
              <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '1.35rem', color: NEON.blue }}>
                PRIVACY POLICY · ZERO-KNOWLEDGE ENCLAVE
              </h1>
            </div>
            <p style={{ color: NEON.textMuted, lineHeight: 1.65 }}>
              Agape Sovereign AI operates on a strict client-side Zero-Knowledge architecture. Sensitive identity fields are hashed (SHA-256) and encrypted (AES-256-GCM) in your browser before any receipt is stored.
            </p>
            <ul style={{ color: NEON.text, lineHeight: 1.7, paddingLeft: 20 }}>
              <li><strong>Google OAuth &amp; Drive (`drive.file`):</strong> Used solely to authenticate your federated session and save your 26-Month Identity Audit PDF directly into your own Google Drive. Agape cannot read other files in your Drive.</li>
              <li><strong>Local Vault (IndexedDB):</strong> Audit snapshots and rectification proofs are stored locally on your device for a 26-month rolling window.</li>
              <li><strong>Third-Party Checks:</strong> Only explicit user-triggered checks (e.g. XposedOrNot, Have I Been Pwned k-anonymity 5-char hash prefix, Cloudflare DNS, ipwho.is) leave the device.</li>
            </ul>
          </article>
        )}

        {kind === 'TERMS' && (
          <article style={{ background: NEON.bgCard, border: `1px solid ${NEON.blue}33`, borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Shield size={20} color={NEON.orange} />
              <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '1.35rem', color: NEON.blue }}>
                TERMS OF SERVICE
              </h1>
            </div>
            <p style={{ color: NEON.textMuted, lineHeight: 1.65 }}>
              Agape Sovereign AI provides client-side cryptographic sealing, breach-check tooling, and statutory erasure/rectification document generation (GDPR Art. 16/17, CCPA, UDHR Art. 12).
            </p>
            <ul style={{ color: NEON.text, lineHeight: 1.7, paddingLeft: 20 }}>
              <li>You retain sole ownership of your Data Encryption Key (DEK), recovery code, and exported audit PDFs.</li>
              <li>Lost recovery codes or cleared browser storage without a Google Drive backup cannot be recovered by Agape, as we never hold your plaintext keys.</li>
              <li>Service is provided as-is under the 2026 ECRA Sovereign Enclave standard.</li>
            </ul>
          </article>
        )}

        {kind === 'CONTACT' && (
          <article style={{ background: NEON.bgCard, border: `1px solid ${NEON.blue}33`, borderRadius: 16, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Mail size={20} color={NEON.magenta} />
              <h1 style={{ margin: 0, fontFamily: "'Orbitron', sans-serif", fontSize: '1.35rem', color: NEON.blue }}>
                CONTACT &amp; DEVELOPER SUPPORT
              </h1>
            </div>
            <p style={{ color: NEON.textMuted, lineHeight: 1.65 }}>
              For security disclosures, Google OAuth inquiries, or data rectification questions, contact the maintainer directly:
            </p>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem', color: NEON.green }}>
              <a href="mailto:idin@agape.nyc" style={{ color: NEON.green }}>idin@agape.nyc</a>
            </p>
          </article>
        )}
      </div>
    </div>
  );
}
