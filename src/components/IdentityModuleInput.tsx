import React, { useState, useEffect } from 'react';
import { SovereignEncryption } from '../lib/encryption';
import { SOVEREIGN_PALETTE } from '../theme/tokens';

interface IdentityModuleInputProps {
  moduleId: string;
  label: string;
  initialValue?: string;
  onValueChange: (value: string, hash: string) => void;
}

export const IdentityModuleInput: React.FC<IdentityModuleInputProps> = ({
  moduleId,
  label,
  initialValue = '',
  onValueChange,
}) => {
  const [value, setValue] = useState(initialValue);
  const [hash, setHash] = useState('');

  useEffect(() => {
    async function updateHash() {
      // Use a stable user salt for this session
      const sessionSalt = 'session-stable-salt-2026';
      const newHash = await SovereignEncryption.generateIntegrityHash(moduleId, value, sessionSalt);
      setHash(newHash);
      onValueChange(value, newHash);
    }
    updateHash();
  }, [value]);

  return (
    <div className="mb-6 p-4 sovereign-border bg-[#111830] rounded-lg transition-all duration-300 hover:scale-[1.02]">
      <label className="block text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: SOVEREIGN_PALETTE.cyan }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full bg-transparent border-b-2 border-[#00D4FF] p-2 text-lg outline-none focus:border-[#FF2E9F] transition-colors"
        style={{ color: SOVEREIGN_PALETTE.ice }}
        placeholder="Enter sovereign data..."
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] font-mono opacity-60" style={{ color: SOVEREIGN_PALETTE.ice }}>
          Module ID: {moduleId}
        </span>
        <span className="text-[10px] font-mono px-2 py-1 bg-[#0B1020] rounded border border-[#00D4FF]" style={{ color: SOVEREIGN_PALETTE.cyan }}>
          Hash: {hash.substring(0, 12)}...
        </span>
      </div>
    </div>
  );
};
