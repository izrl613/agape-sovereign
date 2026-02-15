
import React, { useState } from 'react';
import { MailWarning, MailCheck } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import InfoPanel from './InfoPanel';

const SubscriptionCleaner = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleNukeClick = () => {
    setLoading(true);
    setMessage('');
    // Add logic to unsubscribe from all selected emails
    setTimeout(() => {
      setLoading(false);
      setMessage('You have been unsubscribed from all selected emails.');
    }, 2000);
  };

  const handleKnoxClick = () => {
    setLoading(true);
    setMessage('');
    // Add logic to keep all selected email subscriptions
    setTimeout(() => {
      setLoading(false);
      setMessage('All selected email subscriptions will be kept.');
    }, 2000);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-agape-sovereign-light to-agape-sovereign-dark">Subscription Cleaner</h1>
      <p className="text-universal-irony">Clean up your inbox by unsubscribing from unwanted emails.</p>
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
            <MailWarning size={48} />
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">NUKED</h2>
              <p className="text-sm">Unsubscribe from all selected emails.</p>
            </div>
          </button>
          <button
            className="p-8 bg-shield-glow/10 text-shield-glow border border-shield-glow/30 rounded-3xl flex items-center space-x-4"
            onClick={handleKnoxClick}
          >
            <MailCheck size={48} />
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">KNOXED</h2>
              <p className="text-sm">Keep all selected email subscriptions.</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCleaner;
