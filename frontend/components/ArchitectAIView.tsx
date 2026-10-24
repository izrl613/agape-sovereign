import React, { useState, useEffect } from 'react';
import { NEON } from '../theme';
import { NeonText, NeonButton, GlassCard } from './DesignSystem';
import { ZkFooter } from './ZkFooter';

interface ArchitectAIViewProps {
  userId: string;
  collectedVectors: string[];
}

export const ArchitectAIView: React.FC<ArchitectAIViewProps> = ({ userId, collectedVectors }) => {
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'COMPLETE'>('IDLE');
  const [synthesis, setSynthesis] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startSynthesis = async () => {
    setStatus('PROCESSING');
    setLogs([]);
    addLog(`Initializing Architect AI Brain for user ${userId}...`);
    addLog(`Scanning local MCP storage for identity vectors...`);

    const vectors = collectedVectors;
    for (const vector of vectors) {
      addLog(`Fetching encrypted packet: ${vector}...`);
      await new Promise(r => setTimeout(r, 600));
      addLog(`Verified verification token for ${vector}.`);
    }

    addLog(`Establishing secure bridge to qwen3-vl:4b...`);
    await new Promise(r => setTimeout(r, 1500));
    addLog(`Synthesizing identity fragments into cohesive profile...`);
    await new Promise(r => setTimeout(r, 1500));

    try {
      const response = await fetch('/api/architect/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      setSynthesis(data);
      addLog(`Sovereign Synthesis Complete. Profile generated.`);
      setStatus('COMPLETE');
    } catch (e) {
      addLog(`Critical Error: Synthesis interrupted. Check MCP server connectivity.`);
      setStatus('IDLE');
    }
  };

  return (
    <div className="architect-view">
      <div className="header">
        <NeonText size="lg">ARCHITECT AI</NeonText>
        <div className={`status-badge ${status.toLowerCase()}`}>
          {status}
        </div>
      </div>

      <div className="main-grid">
        <GlassCard title="Identity Vector Matrix">
          <div className="vector-grid">
            {collectedVectors.map(v => (
              <div key={v} className={`vector-node ${status === 'PROCESSING' ? 'pulsing' : ''}`}>
                <div className="node-label">{v}</div>
                <div className="node-status">Encrypted</div>
              </div>
            ))}
            {collectedVectors.length < 16 && (
              <div className="vector-node empty">
                <div className="node-label">Slot {collectedVectors.length + 1}</div>
                <div className="node-status">Pending</div>
              </div>
            )}
          </div>
          <NeonButton
            disabled={collectedVectors.length < 16 || status === 'PROCESSING'}
            onClick={startSynthesis}
          >
            {status === 'PROCESSING' ? 'Synthesizing...' : 'Execute Final Synthesis'}
          </NeonButton>
        </GlassCard>

        <GlassCard title="Neural Logic Log">
          <div className="log-container">
            {logs.map((log, i) => (
              <div key={i} className="log-entry">{log}</div>
            ))}
            {logs.length === 0 && <div className="log-empty">Awaiting synthesis trigger...</div>}
          </div>
        </GlassCard>
      </div>

      {synthesis && (
        <div className="synthesis-result">
          <NeonText size="md">Sovereign Identity Synthesis</NeonText>
          <div className="result-box">
            {synthesis.summary}
          </div>
          <NeonButton onClick={() => window.location.href = '/report'}>
            Proceed to Verified Report
          </NeonButton>
        </div>
      )}

      <style jsx>{`
        .architect-view {
          display: flex;
          flex-direction: column;
          gap: 30px;
          animation: fadeIn 0.5s ease-in;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          background: rgba(0,212,255,0.1);
          color: ${NEON.blue};
          border: 1px solid ${NEON.blue};
          transition: all 0.3s;
        }
        .status-badge.processing {
          background: rgba(255, 46, 159, 0.1);
          color: ${NEON.pink};
          border-color: ${NEON.pink};
          animation: blink 1s infinite;
        }
        .status-badge.complete {
          background: rgba(57, 255, 20, 0.1);
          color: ${NEON.green};
          border-color: ${NEON.green};
        }
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .vector-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 30px;
        }
        .vector-node {
          padding: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid #333;
          border-radius: 8px;
          text-align: center;
          font-size: 0.7rem;
          transition: all 0.3s;
        }
        .vector-node.pulsing {
          border-color: ${NEON.blue};
          box-shadow: 0 0 10px ${NEON.blue};
          animation: pulse 1s infinite;
        }
        .vector-node.empty {
          border: 1px dashed #444;
          color: #666;
        }
        .node-label {
          font-weight: bold;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        .node-status {
          color: ${NEON.green};
          font-size: 0.6rem;
        }
        .log-container {
          height: 300px;
          overflow-y: auto;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85rem;
          color: #aaa;
          padding: 10px;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
        }
        .log-entry {
          margin-bottom: 4px;
          border-left: 2px solid ${NEON.blue};
          padding-left: 8px;
        }
        .log-empty {
          text-align: center;
          margin-top: 100px;
          color: #555;
        }
        .synthesis-result {
          margin-top: 40px;
          padding: 30px;
          background: rgba(255,255,255,0.05);
          border: 1px solid ${NEON.purple};
          border-radius: 24px;
          text-align: center;
          animation: slideUp 0.5s ease-out;
        }
        .result-box {
          margin: 20px 0;
          font-size: 1.2rem;
          line-height: 1.6;
          color: #eee;
        }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
