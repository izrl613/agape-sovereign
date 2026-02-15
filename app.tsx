
import React from 'react';
import PrivacyDashboard from './components/PrivacyDashboard';

const App = () => {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <header className="p-8 border-b border-white/10">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Agape Sovereign Enclave</h1>
        <p className="text-slate-400">ALPHA BUILD 0.5</p>
      </header>

      <main className="p-8">
        <PrivacyDashboard />
      </main>
    </div>
  );
};

export default App;
