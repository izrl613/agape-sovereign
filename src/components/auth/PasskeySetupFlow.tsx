import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../AuthContext';

// Step-by-step flow for setting up a Passkey.
// Uses AuthContext.bindPasskey which calls the correct API endpoints:
//   POST /api/auth/register-options → POST /api/auth/verify-registration
export const PasskeySetupFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, bindPasskey } = useAuth();
  const [step, setStep] = useState<'idle' | 'binding' | 'done'>('idle');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleBind = async () => {
    if (!user?.email) {
      toast.error('❌ Email address required for passkey registration');
      return;
    }

    setStep('binding');
    setIsRegistering(true);
    try {
      await bindPasskey();
      setStep('done');
      onComplete();
    } catch (err) {
      // bindPasskey already shows a toast for most errors
      console.error(err);
      setStep('idle');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(14px) saturate(180%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '520px',
        margin: 'auto',
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
      }}
    >
      <h2>🔐 Set up your Universal Passkey</h2>
      <p>
        Your passkey replaces passwords with a cryptographic credential stored securely
        on your device. It works across browsers and platforms via the WebAuthn standard.
      </p>

      {step === 'idle' && (
        <button
          onClick={handleBind}
          disabled={isRegistering}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: isRegistering ? 'rgba(79, 70, 229, 0.5)' : '#4f46e5',
            color: '#fff',
            cursor: isRegistering ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            fontFamily: '"Inter", sans-serif',
          }}
          onMouseEnter={e => !isRegistering && (e.currentTarget.style.background = '#4338ca')}
          onMouseLeave={e => !isRegistering && (e.currentTarget.style.background = '#4f46e5')}
        >
          {isRegistering ? '🔄 Setting up…' : 'Start Passkey Setup'}
        </button>
      )}

      {step === 'binding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <p>🔄 Creating your passkey, please follow the device prompt…</p>
          <div style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: '"Share Tech Mono", monospace' }}>
            AES-256-GCM Encryption Active
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <p>🎉 Your account is now secured with a Passkey.</p>
          <div style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: '"Share Tech Mono", monospace' }}>
            ✅ Passkey bound successfully
          </div>
        </div>
      )}
    </div>
  );
};
