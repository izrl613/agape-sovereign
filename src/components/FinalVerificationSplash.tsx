import React from 'react';
import styled from 'styled-components';
import { SOVEREIGN_PALETTE } from '../theme/tokens';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(11, 16, 32, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const VerificationCard = styled.div`
  background: ${SOVEREIGN_PALETTE.surface};
  border: 2px solid ${SOVEREIGN_PALETTE.electricBlue};
  border-radius: 24px;
  padding: 40px;
  width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 50px ${SOVEREIGN_PALETTE.electricBlue};
`;

const VectorRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid ${SOVEREIGN_PALETTE.electricCyanOpacity};
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
`;

export const FinalVerificationSplash: React.FC<{ 
  vectors: any[]; 
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ vectors, onConfirm, onCancel }) => {
  return (
    <ModalOverlay>
      <VerificationCard>
        <h2 style={{ color: SOVEREIGN_PALETTE.iceWhite, textAlign: 'center' }}>
          Final Integrity Verification
        </h2>
        <p style={{ color: SOVEREIGN_PALETTE.electricCyanOpacity, textAlign: 'center', marginBottom: '30px' }}>
          Review all 16 modules and their cryptographic hashes before locking.
        </p>
        
        <div style={{ marginBottom: '30px' }}>
          {vectors.map((v, i) => (
            <VectorRow key={i}>
              <span>{v.name}</span>
              <span style={{ color: SOVEREIGN_PALETTE.electricBlue }}>{v.sha256Id}</span>
            </VectorRow>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid white', background: 'transparent', color: 'white', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '10px 20px', borderRadius: '8px', background: SOVEREIGN_PALETTE.electricBlue, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Confirm & Lock Report
          </button>
        </div>
      </VerificationCard>
    </ModalOverlay>
  );
};
