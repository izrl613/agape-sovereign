import React, { useState, useEffect } from 'react';
import { Fingerprint, ArrowLeft, Shield, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { PasskeyService, AuthMethod } from '../auth/passkey-service';
import { useSovereign, type UserSession } from '../context/SovereignContext';

interface LoginPageProps {
  /**
   * Called once authentication succeeds. The shell performs the redirect to
   * /dashboard, so this must fire *after* the session object is final.
   */
  onSuccess?: (session: UserSession) => void;
  onNavigateHome?: () => void;
}

const C = {
  blue: '#00D4FF',
  magenta: '#FF2E9F',
  orange: '#FF7A18',
  green: '#00FF87',
  muted: 'rgba(180, 190, 220, 0.45)',
  surface: 'rgba(255, 255, 255, 0.03)',
  cardBg: 'rgba(6, 12, 26, 0.94)',
  border: 'rgba(0, 212, 255, 0.2)',
} as const;

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-label="Google" role="img">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FirebaseLogo = () => (
  <svg width="14" height="16" viewBox="0 0 32 48" aria-label="Firebase" role="img" fill="none">
    <path d="M1.05 35.96L8.98 2.41a.96.96 0 011.87.08l4.67 17.35 2.01-3.8a.86.86 0 011.55 0l12.9 24.37L1.05 35.96z" fill="#FFA000" />
    <path d="M18.08 22.48l-3.56-13.26a.96.96 0 00-1.87-.08L1.05 35.96l17.03-13.48z" fill="#F57C00" />
    <path d="M32 40.18L25.05 3.07a.9.9 0 00-1.65-.28L1.05 35.96 18.1 46.18a3.27 3.27 0 003.2 0L32 40.18z" fill="#FFCA28" />
  </svg>
);

const ShieldHexagon = () => (
  <div style={{ position: 'relative', width: 76, height: 76, margin: '0 auto 20px' }}>
    <div className="shield-glow-ring" />
    <svg viewBox="0 0 80 80" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 16px #00D4FF)' }}>
      <polygon points="40,4 76,24 76,56 40,76 4,56 4,24" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
      <polygon points="40,16 66,29 66,51 40,64 14,51 14,29" fill="none" stroke="#FF2E9F" strokeWidth="1" opacity="0.75" />
      <polygon points="40,28 52,36 52,44 40,52 28,44 28,36" fill="#FF7A18" fillOpacity="0.85" stroke="#FF7A18" strokeWidth="0.5" />
      <text x="40" y="45" textAnchor="middle" fill="#00D4FF" fontFamily="Orbitron, sans-serif" fontSize="13" fontWeight="900" letterSpacing="1">AI</text>
    </svg>
  </div>
);

const LOADING_STEPS = [
  'Establishing secure channel…',
  'Verifying identity enclave…',
  'Initializing Sovereign console…',
];

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onNavigateHome }) => {
  const { setUser } = useSovereign();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);

  useEffect(() => {
    // Detect incognito / private window gracefully
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(estimate => {
          if (estimate.quota && estimate.quota < 120000000) {
            setIsIncognito(true);
          }
        });
      }
    } catch {
      // Ignore detection errors
    }
  }, []);

  useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => {
        setLoadingStep(s => (s + 1) % LOADING_STEPS.length);
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleAuth = async (method: AuthMethod) => {
    setAuthError(null);
    setLoading(true);

    try {
      const result = await PasskeyService.authenticate(method, email);
      if (result.success || result.userId) {
        const provider =
          method === 'ANON' ? 'anonymous' : method === 'GOOGLE' ? 'google' : 'passkey';
        const identity = (result.email || email || '').trim();
        const session: UserSession = {
          id: result.userId || `user_${Date.now()}`,
          type: method === 'ANON' ? 'anonymous' : 'verified',
          email: identity || undefined,
          name: identity ? identity.split('@')[0] : undefined,
          provider,
          method,
        };

        setUser(session);
        // Release the spinner so the shell can take over immediately.
        setLoading(false);
        if (onSuccess) {
          onSuccess(session);
        }
      } else {
        throw new Error(result.error || 'Authentication ceremony was rejected.');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('NotAllowedError')) {
        setAuthError('Passkey prompt dismissed. Try again or use Google Sign-In.');
      } else {
        setAuthError(msg || 'Authentication failed. Please retry.');
      }
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="login-container">
      {/* Background Gradients */}
      <div className="login-bg-grid" />
      <div className="login-glow-top" />
      <div className="login-glow-bottom" />

      {/* Top Header Row */}
      <div className="login-top-bar">
        <a href="/" onClick={handleBack} className="back-link" id="login-back-link">
          <ArrowLeft size={14} /> SOVEREIGN.NYC
        </a>

        <div className="secure-pill">
          <span className="secure-dot" />
          SECURE CONNECTION ESTABLISHED
        </div>
      </div>

      {/* Login Card Container */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <ShieldHexagon />

          <h1 className="brand-title">Agape Sovereign AI</h1>
          <div className="brand-subtitle">DIGITAL IDENTITY DEFENSE</div>
          <div className="oauth-pill">FIDO2 · SECURE GOOGLE OAUTH 2.0</div>

          <div className="card-divider" />

          {/* Incognito Notice */}
          {isIncognito && (
            <div className="incognito-alert">
              <EyeOff size={14} color="#FFC107" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div className="incognito-title">PRIVATE BROWSING DETECTED</div>
                <div className="incognito-text">
                  Session will persist for this active browser window only.
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {authError && (
            <div className="error-alert">
              <span>⚠ {authError}</span>
            </div>
          )}

          {/* Loading View */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner-hex" />
              <div className="loading-step-text">{LOADING_STEPS[loadingStep]}</div>
              <div className="loading-subtext">Secured with AES-256-GCM · Zero-knowledge session</div>
            </div>
          ) : (
            <div className="auth-methods-group">
              <div className="auth-prompt-title">Digital Identity Federated Footprint</div>
              <p className="auth-prompt-desc">
                Authenticate to begin your <span style={{ color: C.magenta, fontWeight: 700 }}>DIFF</span> analysis. Your sovereignty begins here.
              </p>

              {/* Passkey Optional Email */}
              {showEmailInput && (
                <div className="email-input-wrap">
                  <input
                    type="email"
                    placeholder="Enter email to locate passkey..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="passkey-email-input"
                    autoFocus
                  />
                </div>
              )}

              {/* Option 1: Passkey / WebAuthn */}
              <button
                type="button"
                className="auth-row-btn passkey-btn"
                onClick={() => handleAuth('PASSKEY')}
                id="btn-login-passkey"
              >
                <div className="btn-icon-box passkey-icon-box">
                  <Fingerprint size={22} color={C.blue} />
                </div>
                <div className="btn-text-content">
                  <div className="btn-title">Passkey / WebAuthn</div>
                  <div className="btn-subtitle">Device-bound · Touch ID / Face ID / Windows Hello / YubiKey</div>
                </div>
              </button>

              <div className="passkey-toggle-link-row">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowEmailInput(!showEmailInput)}
                >
                  {showEmailInput ? 'Direct resident key mode' : 'Specify email for passkey →'}
                </button>
              </div>

              {/* Option 2: Continue with Google */}
              <button
                type="button"
                className="auth-row-btn google-btn"
                onClick={() => handleAuth('GOOGLE')}
                id="btn-login-google"
              >
                <div className="btn-icon-box google-icon-box">
                  <GoogleLogo />
                </div>
                <div className="btn-text-content">
                  <div className="btn-title">Continue with Google</div>
                  <div className="btn-subtitle">OAuth 2.0 · Verified Enclave Identity</div>
                </div>
              </button>

              {/* Option 3: Guest / Anonymous Bypass */}
              <button
                type="button"
                className="auth-row-btn anon-btn"
                onClick={() => handleAuth('ANON')}
                id="btn-login-anon"
              >
                <div className="btn-icon-box anon-icon-box">
                  <KeyRound size={20} color={C.green} />
                </div>
                <div className="btn-text-content">
                  <div className="btn-title">Guest / Anonymous Bypass</div>
                  <div className="btn-subtitle">Ephemeral zero-knowledge evaluation</div>
                </div>
              </button>
            </div>
          )}

          {/* Trust Logos Row */}
          <div className="trust-row">
            <div className="trust-pill"><GoogleLogo /> Google OAuth 2.0</div>
            <div className="trust-pill"><FirebaseLogo /> Firebase</div>
            <div className="trust-pill"><Shield size={12} color={C.blue} /> SHA-256</div>
            <div className="trust-pill"><Sparkles size={12} color={C.green} /> AES-256-GCM</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="login-footer">
        <div className="login-footer-links">
          <a href="/terms" className="footer-link">TERMS OF SERVICE</a>
          <span className="dot-sep">•</span>
          <a
            href="/terms/TERMS.pdf"
            className="footer-link is-pdf"
            type="application/pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="Terms of Service v1.0 — PDF, 3.4 MB"
          >
            TERMS.PDF ↓
          </a>
          <span className="dot-sep">•</span>
          <a href="/privacy" className="footer-link">PRIVACY POLICY</a>
          <span className="dot-sep">•</span>
          <a
            href="/privacy/PRIVACY.pdf"
            className="footer-link is-pdf"
            type="application/pdf"
            target="_blank"
            rel="noopener noreferrer"
            title="Privacy Policy v1.0 — PDF, 17 KB"
          >
            PRIVACY.PDF ↓
          </a>
          <span className="dot-sep">•</span>
          <a href="/contact" className="footer-link">CONTACT</a>
        </div>
        <div className="footer-copyright">
          © 2026 AGAPE SOVEREIGN AI • 2026 ECRA LTS CERTIFIED
        </div>
        <div className="footer-copyright" style={{ marginTop: 4, fontSize: 9 }}>
          SHA-256 {`e9773d658f25…251d`}
        </div>
      </footer>

      {/* Embedded Component Styles */}
      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100%;
          background: #060C1A;
          color: #E8F4FF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 24px 16px;
          position: relative;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .login-bg-grid {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image:
            linear-gradient(rgba(0, 212, 255, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.035) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .login-glow-top {
          position: fixed;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .login-glow-bottom {
          position: fixed;
          bottom: -15%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 46, 159, 0.06) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .login-top-bar {
          width: 100%;
          max-width: 960px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 10;
          margin-bottom: 20px;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45);
          text-decoration: none;
          letter-spacing: 0.12em;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #00D4FF;
        }

        .secure-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          color: #00FF87;
          border: 1px solid rgba(0, 255, 135, 0.2);
          border-radius: 999px;
          padding: 6px 14px;
          background: rgba(0, 255, 135, 0.04);
        }

        .secure-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00FF87;
          box-shadow: 0 0 8px #00FF87;
          animation: pulseDot 2s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.3); }
        }

        .shield-glow-ring {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          border: 1px solid rgba(0, 212, 255, 0.3);
          animation: ringPulse 2.8s infinite ease-in-out;
          pointer-events: none;
        }

        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }

        .login-card-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 1.5px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(255, 46, 159, 0.4) 0%, rgba(0, 212, 255, 0.4) 50%, rgba(255, 122, 24, 0.4) 100%);
          box-shadow: 0 0 50px rgba(0, 212, 255, 0.12), 0 32px 80px rgba(0, 0, 0, 0.7);
          margin: auto 0;
        }

        .login-card {
          background: rgba(6, 12, 26, 0.94);
          backdrop-filter: blur(24px);
          border-radius: 23px;
          padding: 36px 32px;
          text-align: center;
          box-sizing: border-box;
        }

        .brand-title {
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          color: #ffffff;
          margin: 0 0 4px 0;
          font-family: 'Orbitron', 'Inter', sans-serif;
        }

        .brand-subtitle {
          color: #00D4FF;
          font-size: 0.65rem;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.22em;
          margin-bottom: 6px;
        }

        .oauth-pill {
          display: inline-block;
          font-size: 9px;
          letter-spacing: 0.14em;
          color: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          padding: 4px 12px;
          font-family: 'Share Tech Mono', monospace;
          margin-bottom: 22px;
        }

        .card-divider {
          height: 2px;
          margin-bottom: 24px;
          border-radius: 2px;
          /* magenta → blue → orange: the house rule, three colours only */
          background: linear-gradient(90deg, #FF2E9F 0%, #00D4FF 52%, #FF7A18 100%);
          opacity: 0.75;
          mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent);
        }

        .incognito-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 18px;
          padding: 10px 14px;
          background: rgba(255, 193, 7, 0.06);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 10px;
          text-align: left;
        }

        .incognito-title {
          font-size: 10px;
          font-weight: 700;
          color: #FFC107;
          letter-spacing: 0.08em;
          font-family: 'Share Tech Mono', monospace;
          margin-bottom: 2px;
        }

        .incognito-text {
          font-size: 11px;
          color: rgba(255, 193, 7, 0.8);
          line-height: 1.4;
        }

        .error-alert {
          margin-bottom: 18px;
          padding: 10px 14px;
          background: rgba(255, 122, 24, 0.08);
          border: 1px solid rgba(255, 122, 24, 0.4);
          border-radius: 10px;
          color: #ffaa66;
          font-size: 12px;
          font-family: 'Share Tech Mono', monospace;
          text-align: left;
        }

        .auth-prompt-title {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .auth-prompt-desc {
          color: rgba(180, 190, 220, 0.6);
          font-size: 12px;
          line-height: 1.5;
          margin: 0 0 20px 0;
        }

        .email-input-wrap {
          margin-bottom: 12px;
        }

        .passkey-email-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 10px;
          color: #ffffff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .passkey-email-input:focus {
          border-color: #00D4FF;
          box-shadow: 0 0 12px rgba(0, 212, 255, 0.25);
        }

        .auth-methods-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .auth-row-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          cursor: pointer;
          text-align: left;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .auth-row-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .passkey-btn {
          background: rgba(0, 212, 255, 0.05);
          border-color: rgba(0, 212, 255, 0.25);
        }

        .passkey-btn:hover {
          border-color: #00D4FF;
          background: rgba(0, 212, 255, 0.1);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.25);
        }

        .google-btn {
          background: rgba(66, 133, 244, 0.06);
          border-color: rgba(66, 133, 244, 0.25);
        }

        .google-btn:hover {
          border-color: #4285F4;
          background: rgba(66, 133, 244, 0.12);
          box-shadow: 0 0 20px rgba(66, 133, 244, 0.25);
        }

        .anon-btn {
          background: rgba(0, 255, 135, 0.04);
          border-color: rgba(0, 255, 135, 0.2);
        }

        .anon-btn:hover {
          border-color: #00FF87;
          background: rgba(0, 255, 135, 0.09);
          box-shadow: 0 0 20px rgba(0, 255, 135, 0.2);
        }

        .btn-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .passkey-icon-box {
          background: rgba(0, 212, 255, 0.12);
          border: 1px solid rgba(0, 212, 255, 0.3);
        }

        .google-icon-box {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .anon-icon-box {
          background: rgba(0, 255, 135, 0.12);
          border: 1px solid rgba(0, 255, 135, 0.3);
        }

        .btn-text-content {
          flex: 1;
        }

        .btn-title {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 2px;
          letter-spacing: 0.02em;
        }

        .btn-subtitle {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.02em;
        }

        .passkey-toggle-link-row {
          text-align: right;
          margin-top: -6px;
          margin-bottom: 4px;
        }

        .link-btn {
          background: none;
          border: none;
          color: #00D4FF;
          font-size: 10px;
          font-family: 'Share Tech Mono', monospace;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s;
          padding: 0;
        }

        .link-btn:hover {
          opacity: 1;
          text-decoration: underline;
        }

        .loading-state {
          padding: 30px 10px;
          text-align: center;
        }

        .spinner-hex {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 212, 255, 0.15);
          border-top: 3px solid #00D4FF;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-step-text {
          color: #00D4FF;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .loading-subtext {
          color: rgba(180, 190, 220, 0.5);
          font-size: 11px;
        }

        .trust-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .trust-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 4px 8px;
          font-family: 'Share Tech Mono', monospace;
        }

        .login-footer {
          position: relative;
          z-index: 10;
          text-align: center;
          margin-top: 24px;
        }

        .login-footer-links {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .footer-link {
          font-size: 11px;
          font-family: 'Share Tech Mono', monospace;
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          letter-spacing: 0.08em;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: #00D4FF;
        }

        .footer-link.is-pdf {
          color: #FFB27A;
          border-bottom: 1px dotted rgba(255, 122, 24, 0.45);
        }

        .footer-link.is-pdf:hover {
          color: #FFD3B0;
          border-bottom-color: #FF7A18;
        }

        .dot-sep {
          color: rgba(255, 255, 255, 0.2);
          font-size: 10px;
        }

        .footer-copyright {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.25);
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
};
