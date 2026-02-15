
import React from 'react';

interface DashboardProps {
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1400px] mx-auto space-y-16 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="glass-card p-12 rounded-[4rem] flex flex-col items-center text-center">
          <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-12">Data Removal</h3>
          <div className="relative w-56 h-56 mb-12">
            <i className="fas fa-shield-virus absolute inset-0 flex items-center justify-center text-5xl text-blue-500"></i>
            <div className="w-full h-full border-2 border-dashed border-blue-500/20 rounded-full animate-spin-slow"></div>
          </div>
          <button onClick={() => onNavigate('NUKED')} className="w-full py-5 bg-red-600 text-white rounded-3xl text-[10px] font-black uppercase shadow-2xl">NUKE DATA</button>
        </div>

        <div className="glass-card p-12 rounded-[4rem] border-emerald-500/20 flex flex-col items-center text-center">
          <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-12">Secure Accounts</h3>
          <div className="w-24 h-24 mb-10 flex items-center justify-center bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <i className="fas fa-lock text-5xl text-emerald-500"></i>
          </div>
          <p className="text-[11px] text-white font-black uppercase mb-4">ACCOUNTS KNOXED</p>
          <button onClick={() => onNavigate('KNOXED')} className="w-full py-5 bg-emerald-600 text-white rounded-3xl text-[10px] font-black uppercase shadow-2xl">MANAGE</button>
        </div>

        <div className="glass-card p-12 rounded-[4rem] border-orange-500/20 flex flex-col">
          <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest text-center mb-12">Scan History</h3>
          <div className="w-full h-full flex items-center justify-center">
            <i className="fas fa-clock-rotate-left text-9xl text-orange-500/50"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
