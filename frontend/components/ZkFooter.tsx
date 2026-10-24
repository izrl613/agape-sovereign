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
      bottom: '20px',
      left: '0',
      right: '0',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#666',
      pointerEvents: 'none',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '4px 12px',
        borderRadius: '20px',
        border: '1px solid #ddd',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        ZK-PROOF: {zkHash}
      </div>
    </footer>
  );
};
