import React from 'react';
import { generateZkHash } from '../utils/zk-crypto';

interface ZkFooterProps {
  pageId: string;
  sessionToken?: string;
}

export const ZkFooter: React.FC<ZkFooterProps> = ({ pageId, sessionToken }) => {
  const zkHash = generateZkHash(pageId, sessionToken);

  return (
    <footer style={{
      position: 'fixed',
      bottom: '8px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: '9px',
      color: '#00D4FF',
      pointerEvents: 'none',
      zIndex: 20
    }}>
      <div style={{
        backgroundColor: 'rgba(6,12,26,0.92)',
        opacity: 0.9,
        padding: '3px 12px',
        borderRadius: '20px',
        border: '1px solid rgba(0,212,255,0.22)',
        letterSpacing: '0.08em'
      }}>
        ZK-PROOF: {zkHash}
      </div>
    </footer>
  );
};
