import React, { useState } from 'react';
import { DIFF_VECTORS } from '../modules/diff/vectors';
import { DiffEngine, VectorStatus, SovereignState } from '../modules/diff/DiffEngine';
import { SovereignScore } from '../lib/SovereignScore';
import { SOVEREIGN_PALETTE } from '../theme/tokens';
import { motion } from 'framer-motion';

export const SovereignDashboard: React.FC = () => {
  const [vectorStatuses, setVectorStatuses] = useState<Record<string, VectorStatus>>({});
  const [activeVector, setActiveVector] = useState<string | null>(null);

  const score = SovereignScore.calculateScore(vectorStatuses);

  const handleProcessVector = async (vectorId: string, input: string) => {
    const status = await DiffEngine.processVector('user_123', vectorId, input, 'session-salt');
    setVectorStatuses(prev => ({ ...prev, [vectorId]: status }));
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: SOVEREIGN_PALETTE.canvas }}>
      {/* Left Navigation Bar */}
      <nav className="w-64 sovereign-border bg-[#111830] p-4 flex flex-col gap-2">
        <h2 className="text-xs font-bold mb-4 uppercase tracking-tighter" style={{ color: SOVEREIGN_PALETTE.cyan }}>
          Sovereign Enclave
        </h2>
        {DIFF_VECTORS.map(vector => (
          <button
            key={vector.id}
            onClick={() => setActiveVector(vector.id)}
            className={`p-2 text-left text-xs rounded transition-all ${activeVector === vector.id ? 'bg-[#00D4FF] text-[#0B1020]' : 'hover:bg-[#1a2440] text-white'}`}
          >
            {vector.label}
          </button>
        ))}
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold" style={{ color: SOVEREIGN_PALETTE.ice }}>Digital Identity Footprint</h1>
            <p className="text-sm" style={{ color: SOVEREIGN_PALETTE.cyan }}>Managing your sovereign cryptographic enclave.</p>
          </div>
          
          {/* Sovereign Score Gauge */}
          <div className="text-right">
            <div className="text-xs uppercase font-bold mb-1" style={{ color: SOVEREIGN_PALETTE.ice }}>Sovereign Score</div>
            <div className="text-5xl font-black" style={{ color: score > 80 ? SOVEREIGN_PALETTE.cyan : SOVEREIGN_PALETTE.magenta }}>
              {score}%
            </div>
          </div>
        </header>

        {activeVector ? (
          <div className="max-w-3xl p-6 sovereign-border bg-[#111830] rounded-xl">
            <h3 className="text-xl font-bold mb-4" style={{ color: SOVEREIGN_PALETTE.ice }}>
              {DIFF_VECTORS.find(v => v.id === activeVector)?.label}
            </h3>
            <div className="flex gap-4 mb-6">
              <input 
                type="text" 
                placeholder="Enter telemetry data..."
                className="flex-1 bg-transparent border-b border-[#00D4FF] p-2 outline-none"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    await handleProcessVector(activeVector, e.currentTarget.value);
                  }
                }}
              />
              <button 
                onClick={async () => {
                  // Trigger process using a dummy value if input is empty
                  await handleProcessVector(activeVector, "verified-data");
                }}
                className="px-4 py-2 rounded bg-gradient-to-r from-[#FF2E9F] to-[#00D4FF] text-black font-bold"
              >
                Verify
              </button>
            </div>

            {vectorStatuses[activeVector] && (
              <div className={`p-4 rounded-lg ${vectorStatuses[activeVector].state === 'KNOXED' ? 'state-knoxed' : 'state-nuked'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase">{vectorStatuses[activeVector].state}</span>
                  <span className="text-xs font-mono opacity-70">{vectorStatuses[activeVector].integrityHash.substring(0, 16)}...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-sm opacity-50" style={{ color: SOVEREIGN_PALETTE.ice }}>
            Select a vector from the navigation bar to begin sovereign auditing.
          </div>
        )}
      </main>
    </div>
  );
};
