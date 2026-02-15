
import React from 'react';
import BreachReport from './BreachReport';
import FootprintFinder from './FootprintFinder';
import PrivacyGuardian from './PrivacyGuardian';
import SubscriptionCleaner from './SubscriptionCleaner';
import DataBrokerPurge from './DataBrokerPurge';

const PrivacyDashboard = () => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700">
      <BreachReport />
      <FootprintFinder />
      <PrivacyGuardian />
      <SubscriptionCleaner />
      <DataBrokerPurge />

      <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">Architect AI</h1>
        <p className="text-slate-400">Your personal AI assistant for navigating the complexities of digital privacy and security.</p>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">ECR-A (2026)</h1>
        <p className="text-slate-400">Secure your entire digital identity footprint in the Year of the Fire Horse.</p>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-magenta-400 to-blue-500">Admin</h1>
        <p className="text-slate-400">Manage your account and settings.</p>
      </div>
    </div>
  );
};

export default PrivacyDashboard;
