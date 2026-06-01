import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../AuthContext';

// Premium glassmorphic step‑by‑step flow for setting up a Passkey
export const PasskeySetupFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { bindPasskey } = useAuth();
  const [step, setStep] = useState<'idle' | 'binding' | 'done'>('idle');
  const [loading, setLoading] = useState(false);

  const handleBind = async () => {
    setLoading(true);
    setStep('binding');
    try {
      await bindPasskey();
      toast.success('✅ Passkey setup complete!');
      setStep('done');
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error('❌ Passkey setup failed');
      setStep('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(14px) saturate(180%)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '480px',
        margin: 'auto',
        color: '#fff',
        fontFamily: '"Inter", sans-serif',
        textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
      }}
    >
      <h2>🔐 Set up your Universal Passkey</h2>
      <p>
        Your passkey replaces passwords with a cryptographic credential stored securely on your device.
        It works across browsers and platforms via the WebAuthn standard.
      </p>
      {step === 'idle' && (
        <button
          onClick={handleBind}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            border: 'none',
            background: '#4f46e5',
            color: '#fff',
            cursor: 'pointer',
            transition: 'background 0.2s',
            fontFamily: '"Inter", sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
          onMouseLeave={e => (e.currentTarget.style.background = '#4f46e5')}
        >
          {loading ? '🔄 Setting up…' : 'Start Passkey Setup'}
        </button>
      )}
      {step === 'binding' && <p>🔄 Creating your passkey, please follow the device prompt…</p>}
      {step === 'done' && <p>🎉 Your account is now secured with a Passkey.</p>}
    </div>
  );
};
