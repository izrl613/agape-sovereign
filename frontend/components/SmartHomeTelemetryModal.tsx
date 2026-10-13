import React, { useState, useMemo } from 'react';
import { 
  Tv, 
  ShieldCheck, 
  Flame, 
  ExternalLink, 
  AlertTriangle,
  MapPin,
  Clock,
  CheckCircle2,
  Filter,
  Zap,
} from 'lucide-react';
import { DiffVector } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface SmartHomeTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onUpdatePerimeterVector: (vectorId: string, status: string, details: string) => void;
}

const INITIAL_IOT_DATA = [
  {
    id: 'iot-01',
    device: 'Smart TV',
    type: 'Matter',
    beaconing: 'Active',
    server: 'Ad Attribution Corp',
    data: 'Viewing telemetry',
    risk: 'MODERATE',
  },
  {
    id: 'iot-02',
    device: 'Voice Assistant',
    type: 'Thread',
    beaconing: 'Active',
    server: 'Cloud Provider',
    data: 'Audio snippets',
    risk: 'HIGH',
  },
  {
    id: 'iot-03',
    device: 'Smart Bulb',
    type: 'Zigbee',
    beaconing: 'Passive',
    server: 'Local Hub',
    data: 'Brightness status',
    risk: 'LOW',
  },
];

export const SmartHomeTelemetryModal: React.FC<SmartHomeTelemetryModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [iotData, setIotData] = useState<{
    id: string; device: string; type: string; beaconing: string; server: string; data: string; risk: string;
  }[]>(INITIAL_IOT_DATA);
  const [isQuarantining, setIsQuarantining] = useState(false);

  if (!isOpen) return null;

  const handleQuarantineDevice = async (deviceId: string) => {
    const target = iotData.find(d => d.id === deviceId);
    if (!target) return;
    setIsQuarantining(true);
    await new Promise(r => setTimeout(r, 400));
    const receipt = await calculateSha256(`IOT_QUARANTINE::${deviceId}::${Date.now()}`);
    setIotData(prev => prev.map(d => d.id === deviceId ? { ...d, beaconing: 'Quarantined', risk: 'NUKED' } : d));
    onUpdatePerimeterVector('diff-13', 'NUKED', `IoT device quarantined and isolated: ${target.device} moved to air-gapped VLAN.`);
    setIsQuarantining(false);
    onClose();
  };

  const handleBatchQuarantine = async () => {
    const activeDevices = iotData.filter(d => d.beaconing === 'Active');
    setIsQuarantining(true);
    for (const device of activeDevices) {
      await new Promise(r => setTimeout(r, 300));
      await handleQuarantineDevice(device.id);
    }
    setIsQuarantining(false);
    onUpdatePerimeterVector('diff-13', 'NUKED', `Batch quarantine completed: ${activeDevices.length} IoT devices isolated to air-gapped VLAN.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0F172A] flex flex-col overflow-hidden border border-[#FF7A18]/50 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#FF7A18]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,24,0.3)]">
                <Tv className="w-6 h-6 text-[#FF7A18]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 13: Smart Home IoT Quarantine
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    IoT QUARANTINE
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Matter • Thread • Zigbee • ACR • 2026 ECRA LTS
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* IoT Device List */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>IoT Device Inventory</span>
            </h4>
            <div className="overflow-x-auto">
              <div className="shadow-sm">
                <table className="w-full text-sm text-left text-slate-500">
                  <thead className="text-xs text-slate-600 bg-[#0F172A] border border-slate-800/80">
                    <tr>
                      <th scope="col" className="p-3">Device</th>
                      <th scope="col" className="p-3">Type</th>
                      <th scope="col" className="p-3">Beaconing</th>
                      <th scope="col" className="p-3">Server</th>
                      <th scope="col" className="p-3">Data Type</th>
                      <th scope="col" className="p-3">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iotData.map((device) => (
                      <tr key={device.id} className="border-b border-slate-800/50 hover:bg-[#141D28]">
                        <td className="p-3 font-medium text-white">{device.device}</td>
                        <td className="p-3 text-[10px] text-slate-400">{device.type}</td>
                        <td className="p-3 text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            device.beaconing === 'Active' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            device.beaconing === 'Passive' ? 'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30' :
                            'bg-[#0F172A] text-slate-400'
                          }`}>
                            {device.beaconing}
                          </span>
                        </td>
                        <td className="p-3 text-[10px] text-slate-400">{device.server}</td>
                        <td className="p-3 text-[10px] text-slate-400">{device.data}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            device.risk === 'HIGH' ? 'bg-red-950/20 text-red-400 border border-red-500/30' :
                            device.risk === 'MODERATE' ? 'bg-orange-950/20 text-[#FF7A18] border border-orange-500/30' :
                            'bg-cyan-950/20 text-[#00D4FF] border border-cyan-500/30'
                          }`}>
                            {device.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 sm:px^6 py-3 bg-[#0B1020] border-t border-slate-800">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Quarantine Actions</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans">
              Isolate all IoT devices onto an air-gapped non-routable VLAN. ACR disabled.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleQuarantineDevice('iot-01')}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Tv className="w-3.5 h-3.5 text-white" /> Quarantine Smart TV
              </button>
              <button
                onClick={() => handleQuarantineDevice('iot-02')}
                className="w-full py-2 px^4 rounded-xl bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <Tv className="w-3.5 h-3.5 text-white" /> Quarantine Voice Assistant
              </button>
              <button
                onClick={handleBatchQuarantine}
                disabled={isQuarantining}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition ${
                  isQuarantining ? 'opacity-50' : ''
                }"
              >
                {isQuarantining ? 'Quarantining...' : `Quarantine ${iotData.filter(d => d.beaconing === 'Active').length} Active Devices`}
                <CheckCircle2 className="w-3.5 h-3.5 text-white ml-2" />
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Tv className="w-3.5 h-3.5 text-[#FF7A18]" />
              <span>Air-Gapped VLAN • ACR Disabled • ECRA 2026 Certified</span>
            </div>

            <div className="flex items-center gap^3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Quarantine
              </button>

              <button
                onClick={() => {
                  onUpdatePerimeterVector(
                    'diff-13',
                    'NUKED',
                    'Module 13 Synchronized: Smart home IoT quarantine cycle completed.'
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px^5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF7A18] via-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w^4 h^4 text-white" />
                <span>Sync to Module 13 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};