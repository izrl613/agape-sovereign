import React, { useState } from 'react';
import { NEON } from '../theme';
import { NeonText, NeonButton, GlassCard } from './DesignSystem';
import { ZkFooter } from './ZkFooter';

interface ReportViewProps {
  userId: string;
}

export const ReportView: React.FC<ReportViewProps> = ({ userId }) => {
  const [status, setStatus] = useState<'LOCKED' | 'VERIFYING' | 'RELEASED'>('LOCKED');
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  const handleVerifyAndRelease = async () => {
    setStatus('VERIFYING');
    try {
      // Integration with Backend /api/architect/finalize
      const response = await fetch('/api/architect/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          authPayload: { mockToken: 'verified-passkey-gesture' } // In real app, this is the WebAuthn response
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setReportUrl(data.reportPath);
        setStatus('RELEASED');
      } else {
        throw new Error('Verification failed');
      }
    } catch (e) {
      alert('Passkey verification failed. Identity remains locked.');
      setStatus('LOCKED');
    }
  };

  return (
    <div className="report-view">
      <div className="report-container">
        <GlassCard title="Sovereign Identity Vault">
          <div className="vault-content">
            {status === 'LOCKED' && (
              <div className="locked-state">
                <div className="lock-icon">🔒</div>
                <NeonText size="md">Identity Report Encrypted</NeonText>
                <p>Your sovereign identity report is encrypted and locked. To release the document, a hardware-backed Passkey verification is required.</p>
                <NeonButton onClick={handleVerifyAndRelease}>
                  Verify Passkey & Release PDF
                </NeonButton>
              </div>
            )}

            {status === 'VERIFYING' && (
              <div className="verifying-state">
                <div className="spinner"></div>
                <NeonText size="md">Verifying Hardware Signature...</NeonText>
                <p>Establishing secure channel with Architect AI...</p>
              </div>
            )}

            {status === 'RELEASED' && (
              <div className="released-state">
                <div className="success-icon">✅</div>
                <NeonText size="md">Identity Released</NeonText>
                <p>Your verified sovereign report is now available for download.</p>
                <a href={reportUrl} download className="download-btn">
                  Download Sovereign Report (.pdf)
                </a>
                <NeonButton onClick={() => setStatus('LOCKED')} variant="secondary">
                  Relock Vault
                </NeonButton>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
      <ZkFooter pageId="report" />
      <style jsx>{`
        .report-view {
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #0a0a0a;
          color: white;
          font-family: 'Rajdhani', sans-serif;
        }
        .report-container {
          width: 600px;
          text-align: center;
        }
        .vault-content {
          padding: 40px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .locked-state, .verifying-state, .released-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .lock-icon, .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .download-btn {
          display: block;
          padding: 15px 30px;
          background: ${NEON.green};
          color: black;
          text-decoration: none;
          font-weight: bold;
          border-radius: 12px;
          margin-bottom: 20px;
          transition: transform 0.2s;
        }
        .download-btn:hover { transform: scale(1.05); }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(0,212,255,0.1);
          border-top: 4px solid ${NEON.blue};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
