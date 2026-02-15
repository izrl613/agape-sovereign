
import React, { useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';

const Settings = () => {
  const [backedUp, setBackedUp] = useState(false);
  const [restored, setRestored] = useState(false);

  const handleBackup = () => {
    // Add logic to back up user settings
    setBackedUp(true);
    setRestored(false);
  };

  const handleRestore = () => {
    // Add logic to restore user settings
    setRestored(true);
    setBackedUp(false);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">Settings</h1>
      <p className="text-slate-400">Manage your application settings.</p>
      <div className="grid grid-cols-2 gap-8">
        <button
          className={`p-8 bg-blue-600/10 text-blue-400 border border-blue-500/30 rounded-3xl flex items-center space-x-4 ${backedUp ? 'bg-blue-600/50' : ''}`}
          onClick={handleBackup}
        >
          <Save size={48} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Back Up Settings</h2>
            <p className="text-sm">Save your current settings for later use.</p>
          </div>
        </button>
        <button
          className={`p-8 bg-green-600/10 text-green-400 border border-green-500/30 rounded-3xl flex items-center space-x-4 ${restored ? 'bg-green-600/50' : ''}`}
          onClick={handleRestore}
        >
          <RefreshCw size={48} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Restore Settings</h2>
            <p className="text-sm">Restore your previously saved settings.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Settings;
