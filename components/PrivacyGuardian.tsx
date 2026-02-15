
import React, { useState } from 'react';
import { ShieldOff, ShieldCheck } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import InfoPanel from './InfoPanel';

const PrivacyGuardian = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleNukeClick = () => {
    setLoading(true);
    setMessage('');
    // Add logic to maximize all privacy settings and delete all data
    setTimeout(() => {
      setLoading(false);
      setMessage('All privacy settings have been maximized and data has been deleted.');
    }, 2000);
  };

  const handleKnoxClick = () => {
    setLoading(true);
    setMessage('');
    // Add logic to keep all current privacy settings
    setTimeout(() => {
      setLoading(false);
      setMessage('All current privacy settings will be kept.');
    }, 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-agape-sovereign-light to-agape-sovereign-dark">Privacy Guardian</h1>
      <p className="text-universal-irony">Manage your privacy settings across your social media accounts.</p>
      {loading ? (
        <LoadingSpinner />
      ) : message ? (
        <InfoPanel message={message} />
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <button
            className="p-8 bg-fire-horse/10 text-fire-horse border border-fire-horse/30 rounded-3xl flex items-center space-x-4"
            onClick={handleNukeClick}
          >
            <ShieldOff size={48} />
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">NUKED</h2>
              <p className="text-sm">Maximize all privacy settings and delete all data.</p>
            </div>
          </button>
          <button
            className="p-8 bg-shield-glow/10 text-shield-glow border border-shield-glow/30 rounded-3xl flex items-center space-x-4"
            onClick={handleKnoxClick}
          >
            <ShieldCheck size={48} />
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">KNOXED</h2>
              <p className="text-sm">Keep all current privacy settings.</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default PrivacyGuardian;
