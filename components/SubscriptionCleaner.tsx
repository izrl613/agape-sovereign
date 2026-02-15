
import React, { useState } from 'react';
import { MailWarning, MailCheck } from 'lucide-react';

const SubscriptionCleaner = () => {
  const [nuked, setNuked] = useState(false);
  const [knoxed, setKnoxed] = useState(false);

  const handleNukeClick = () => {
    setNuked(true);
    setKnoxed(false);
    // Add logic to unsubscribe from all selected emails
  };

  const handleKnoxClick = () => {
    setKnoxed(true);
    setNuked(false);
    // Add logic to keep all selected email subscriptions
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">Subscription Cleaner</h1>
      <p className="text-slate-400">Clean up your inbox by unsubscribing from unwanted emails.</p>
      <div className="grid grid-cols-2 gap-8">
        <button
          className={`p-8 bg-orange-600/10 text-orange-400 border border-orange-500/30 rounded-3xl flex items-center space-x-4 ${nuked ? 'bg-orange-600/50' : ''}`}
          onClick={handleNukeClick}
        >
          <MailWarning size={48} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">NUKED</h2>
            <p className="text-sm">Unsubscribe from all selected emails.</p>
          </div>
        </button>
        <button
          className={`p-8 bg-blue-600/10 text-blue-400 border border-blue-500/30 rounded-3xl flex items-center space-x-4 ${knoxed ? 'bg-blue-600/50' : ''}`}
          onClick={handleKnoxClick}
        >
          <MailCheck size={48} />
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">KNOXED</h2>
            <p className="text-sm">Keep all selected email subscriptions.</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SubscriptionCleaner;
