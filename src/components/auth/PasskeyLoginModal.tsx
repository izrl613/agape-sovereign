import React, { useState } from 'react';
import { Dialog, DialogOverlay, DialogContent } from '@reach/dialog';
import '@reach/dialog/styles.css';
import { toast } from 'sonner';
import { useAuth } from '../../AuthContext';

// Premium glassmorphic modal for Passkey login
export const PasskeyLoginModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { loginWithPasskey } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithPasskey(email);
      toast.success('✅ Passkey login successful');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('❌ Passkey login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogOverlay isOpen={isOpen} onDismiss={onClose} style={{ background: 'rgba(0,0,0,0.5)' }}>
      <DialogContent
        aria-label="Passkey Login"
        style={{
          borderRadius: '1.2rem',
          padding: '2rem',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px) saturate(180%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#fff',
          maxWidth: '420px',
          margin: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0, fontFamily: '"Inter", sans-serif' }}>🔐 Sign in with Passkey</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontFamily: '"Inter", sans-serif',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: loading ? 'rgba(255,255,255,0.2)' : '#4f46e5',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: '"Inter", sans-serif',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#4338ca';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#4f46e5';
            }}
          >
            {loading ? '🔄 Signing in…' : 'Sign in'}
          </button>
        </form>
      </DialogContent>
    </DialogOverlay>
  );
};
