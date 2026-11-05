import React from 'react';
import styled from 'styled-components';
import { SOVEREIGN_PALETTE } from '../theme/tokens';

const SplashContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: ${SOVEREIGN_PALETTE.canvas};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
`;

const GlassCard = styled.div`
  background: rgba(17, 24, 48, 0.8);
  border: 2px solid ${SOVEREIGN_PALETTE.electricBlue};
  border-radius: 24px;
  padding: 40px;
  width: 500px;
  text-align: center;
  box-shadow: 0 0 30px ${SOVEREIGN_PALETTE.electricBlue};
`;

const ModuleTitle = styled.h2`
  color: ${SOVEREIGN_PALETTE.iceWhite};
  font-size: 2rem;
  margin-bottom: 20px;
`;

const HashBadge = styled.div`
  font-family: 'Courier New', monospace;
  background: #000;
  color: ${SOVEREIGN_PALETTE.electricBlue};
  padding: 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  word-break: break-all;
  border: 1px solid ${SOVEREIGN_PALETTE.electricBlue};
  margin: 20px 0;
`;

export const ModuleSplash: React.FC<{ 
  moduleName: string; 
  sha256Id: string; 
  onComplete: () => void 
}> = ({ moduleName, sha256Id, onComplete }) => {
  return (
    <SplashContainer>
      <GlassCard>
        <ModuleTitle>{moduleName}</ModuleTitle>
        <p style={{ color: SOVEREIGN_PALETTE.electricCyanOpacity }}>
          Cryptographic Handshake in Progress...
        </p>
        <HashBadge>{sha256Id}</HashBadge>
        <button 
          onClick={onComplete}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: SOVEREIGN_PALETTE.electricBlue,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Confirm Integrity
        </button>
      </GlassCard>
    </SplashContainer>
  );
};
