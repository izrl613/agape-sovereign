
import React, { useState } from 'react';
import { ShieldOff, ShieldCheck } from 'lucide-react';

const PrivacyGuardian = () => {
  const [nuked, setNuked] = useState(false);
  const [knoxed, setKnoxed] = useState(false);

  const handleNukeClick = () => {
    setNuked(true);
    setKnoxed(false);
    // Add logic to maximize all privacy settings and delete all data
  };

  const handleKnoxClick = () => {
    setKnoxed(true);
    setNuked(false);
    // Add logic to keep all current privacy settings
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">Privacy Guardian</h1>
      <p className="text-slate-400">Manage your privacy settings across your social media accounts.</p>
      <div className="grid grid-cols-2 gap-8">
        <button
          className={`p-8 bg-orange-600/10 text-orange-400 border border-orange-500/30 rounded-3xl flex items-center space-x-4 ${nuked ? 'bg-orange-600/50' : ''}`}
          onClick={handleNukeClick}
        >
          <ShieldOff size={48} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">NUKED</h2>
            <p className="text-sm">Maximize all privacy settings and delete all data.</p>
          </div>
        </button>
        <button
          className={`p-8 bg-blue-600/10 text-blue-400 border border-blue-500/30 rounded-3xl flex items-center space-x-4 ${knoxed ? 'bg-blue-600/50' : ''}`}
          onClick={handleKnoxClick}
        >
          <ShieldCheck size={48} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">KNOXED</h2>
            <p className="text-sm">Keep all current privacy settings.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default PrivacyGuardian;
