import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Radio, Cpu, Network, Database } from 'lucide-react';
import { NEON, GlassCard } from './UI';

export const DynamicTelemetry = ({ moduleId }: { moduleId: string }) => {
  const [dataPoints, setDataPoints] = useState<any[]>([]);

  useEffect(() => {
    // Generate some initial dynamic data based on moduleId
    const templates = [
      { label: "Network Packets", val: Math.floor(Math.random() * 1000) + 500, unit: "pkts/s" },
      { label: "Active Nodes", val: Math.floor(Math.random() * 50) + 10, unit: "nodes" },
      { label: "Entropy Pool", val: (Math.random() * 2 + 7).toFixed(2), unit: "bits" },
      { label: "Threat Anomalies", val: Math.floor(Math.random() * 5), unit: "flags" }
    ];
    setDataPoints(templates);

    const interval = setInterval(() => {
      setDataPoints(prev => prev.map(p => {
        // slightly fluctuate
        let newVal = typeof p.val === 'number' ? p.val + (Math.floor(Math.random() * 5) - 2) : parseFloat(p.val) + (Math.random() * 0.2 - 0.1);
        if (newVal < 0) newVal = 0;
        return { ...p, val: typeof p.val === 'number' ? newVal : newVal.toFixed(2) };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [moduleId]);

  return (
    <GlassCard className="p-5 mb-6 relative overflow-hidden" style={{ border: `1px solid ${NEON.blue}33` }}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Activity size={100} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-[#00D4FF] animate-pulse" />
          <h4 className="text-xs font-bold text-[#00D4FF] tracking-widest font-mono uppercase">Live Telemetry Data</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dataPoints.map((dp, idx) => (
            <div key={idx} className="p-3 bg-black/40 rounded-lg border border-white/5 flex flex-col">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest mb-1">{dp.label}</span>
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-bold text-white font-mono">{dp.val}</span>
                <span className="text-[10px] text-[#00D4FF] font-mono mb-1">{dp.unit}</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <motion.div 
                  className="h-full bg-[#00D4FF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.random() * 60 + 20}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
