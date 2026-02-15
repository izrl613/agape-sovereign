
import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import InfoPanel from './InfoPanel';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBackup = () => {
    setLoading(true);
    setMessage('');
    // Add logic to back up user settings
    setTimeout(() => {
      setLoading(false);
      setMessage('Your settings have been backed up.');
    }, 2000);
  };

  const handleRestore = () => {
    setLoading(true);
    setMessage('');
    // Add logic to restore user settings
    setTimeout(() => {
      setLoading(false);
      setMessage('Your settings have been restored.');
    }, 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-agape-sovereign-light to-agape-sovereign-dark">Settings</h1>
      <p className="text-universal-irony">Manage your application settings.</p>
      {loading ? (
        <LoadingSpinner />
      ) : message ? (
        <InfoPanel message={message} />
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <button
            className="p-8 bg-shield-glow/10 text-shield-glow border border-shield-glow/30 rounded-3xl flex items-center space-x-4"
            onClick={handleBackup}
          >
            <Save size={48} />
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Back Up Settings</h2>
              <p className="text-sm">Save your current settings for later use.</p>
            </div>
          </button>
          <button
            className="p-8 bg-omega-protocol/10 text-omega-protocol border border-omega-protocol/30 rounded-3xl flex items-center space-x-4"
            onClick={handleRestore}
          >
            <RefreshCw size={48} />
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Restore Settings</h2>
              <p className="text-sm">Restore your previously saved settings.</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
