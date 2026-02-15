
import React from 'react';
import PrivacyDashboard from './PrivacyDashboard';
import './PrivacyDashboard.css';

const App: React.FC = () => {
  return (
    <div className="h-screen bg-[#020617] text-slate-200 flex overflow-hidden font-sans select-none relative">
      <div className="neon-atmosphere"></div>
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar px-16 pb-32">
          <PrivacyDashboard />
        </div>
      </main>
    </div>
  );
};

export default App;
