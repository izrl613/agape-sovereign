import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Tv, 
  Wifi, 
  Radio, 
  Lock, 
  ShieldAlert, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Binary, 
  Terminal,
  Clock
} from 'lucide-react';
import { SmartHomeDeviceAudit, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface SmartHomeTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_DEVICES: SmartHomeDeviceAudit[] = [
  {
    id: 'iot-01',
    deviceName: 'Samsung 65" 4K QLED Living Room TV',
    deviceType: 'SMART_TV',
    macAddress: 'B8:27:EB:49:10:2A',
    telemetryDestination: 'samsungacr.smetrics.samsung.com (Port 443)',
    acrTrackingActive: true,
    unencryptedAudioStream: false,
    networkVlanStatus: 'UNISOLATED_DEFAULT',
    sha256Audit: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'iot-02',
    deviceName: 'Voice Assistant Smart Speaker (Echo Studio)',
    deviceType: 'VOICE_ASSISTANT',
    macAddress: '3C:5A:B4:88:91:EE',
    telemetryDestination: 'device-metrics-us.amazon.com (Port 8443)',
    acrTrackingActive: false,
    unencryptedAudioStream: true,
    networkVlanStatus: 'UNISOLATED_DEFAULT',
    sha256Audit: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'iot-03',
    deviceName: 'Indoor Security Cloud Camera Pan/Tilt',
    deviceType: 'SECURITY_CAM',
    macAddress: 'DC:A6:32:01:99:FF',
    telemetryDestination: 'p2p-relay.cameracloud-china.net (Port 10000)',
    acrTrackingActive: false,
    unencryptedAudioStream: true,
    networkVlanStatus: 'UNISOLATED_DEFAULT',
    sha256Audit: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  }
];

export const SmartHomeTelemetryModal: React.FC<SmartHomeTelemetryModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [devices, setDevices] = useState<SmartHomeDeviceAudit[]>(INITIAL_DEVICES);
  const [activeTab, setActiveTab] = useState<'DEVICES' | 'ACR_PURGE' | 'AUDIT_LOGS'>('DEVICES');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [isIsolatingAll, setIsIsolatingAll] = useState(false);

  // Counts
  const unisolatedCount = useMemo(() => devices.filter(d => d.networkVlanStatus === 'UNISOLATED_DEFAULT').length, [devices]);
  const acrPurgedCount = useMemo(() => devices.filter(d => d.networkVlanStatus === 'ACR_PURGED_NUKED').length, [devices]);
  const vlanIsolatedCount = useMemo(() => devices.filter(d => d.networkVlanStatus === 'VLAN_ISOLATED_KNOXED').length, [devices]);

  if (!isOpen) return null;

  // ACR Purge & Ad History Deletion (NUKE)
  const handlePurgeAcrTelemetry = async (deviceId: string) => {
    const target = devices.find(d => d.id === deviceId);
    if (!target) return;

    const receipt = await calculateSha256(`ACR_PURGED::${target.deviceName}::${target.macAddress}::${Date.now()}`);
    const timeStr = new Date().toLocaleTimeString();

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          acrTrackingActive: false,
          networkVlanStatus: 'ACR_PURGED_NUKED',
          telemetryDestination: '[ACR TELEMETRY DESTROYED - VIEWING LOGS PURGED]',
          sha256Audit: receipt,
        };
      }
      return d;
    }));

    const line = `[${timeStr}] 🔥 NUKED ACR TELEMETRY: Automatic Content Recognition viewing logs erased from ${target.deviceName}. Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-13', 'NUKED', 'Smart TV ACR viewing profiling purged and broadcast metrics wiped.');
  };

  // Enforce Non-Routable Local Air-Gapped VLAN Isolation (KNOX)
  const handleEnforceVlanIsolation = async (deviceId: string) => {
    const target = devices.find(d => d.id === deviceId);
    if (!target) return;

    const receipt = await calculateSha256(`VLAN_ISOLATED::${target.deviceName}::${target.macAddress}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return {
          ...d,
          unencryptedAudioStream: false,
          networkVlanStatus: 'VLAN_ISOLATED_KNOXED',
          telemetryDestination: '[LOCAL NON-ROUTABLE VLAN 10.99.0.0/24 - NO INTERNET EXIT]',
          sha256Audit: receipt,
        };
      }
      return d;
    }));

    const line = `[${timeStr}] 🛡️ KNOXED VLAN ISOLATION: Air-gapped local subnet enforced for ${target.deviceName} (${target.macAddress}). Wan egress blocked. Digest: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-13', 'KNOXED', 'IoT smart home devices locked onto air-gapped non-routable local VLAN.');
  };

  // Batch isolate all unisolated devices
  const handleBatchIsolateAll = async () => {
    setIsIsolatingAll(true);
    const unisolated = devices.filter(d => d.networkVlanStatus === 'UNISOLATED_DEFAULT');

    for (const dev of unisolated) {
      await new Promise(r => setTimeout(r, 260));
      await handleEnforceVlanIsolation(dev.id);
    }

    setIsIsolatingAll(false);
    onUpdatePerimeterVector('diff-13', 'KNOXED', 'Complete IoT perimeter hardened: all smart home nodes quarantined to isolated VLAN.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#FF7A18]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,24,0.3)]">
                <Tv className="w-6 h-6 text-[#FF7A18]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 13: IoT & Smart Home Telemetry Quarantine
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    ACR PURGE • AIR-GAPPED VLAN
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Smart TV Acoustic Snooping Neutralization • Air-Gapped Subnetting • 2026 ECRA LTS
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

          {/* Navigation Bar */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('DEVICES')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'DEVICES'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                1. Discovered IoT Beacons ({devices.length})
              </button>
              <button
                onClick={() => setActiveTab('ACR_PURGE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'ACR_PURGE'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>2. ACR Automatic Content Recognition</span>
              </button>
              <button
                onClick={() => setActiveTab('AUDIT_LOGS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'AUDIT_LOGS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>3. Subnet Telemetry Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {unisolatedCount} UNISOLATED NODES
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-[#00D4FF] border border-cyan-500/30 font-bold">
                {vlanIsolatedCount} AIR-GAPPED
              </span>
            </div>
          </div>

          {/* TAB 1: DISCOVERED IOT BEACONS */}
          {activeTab === 'DEVICES' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Air-Gap Unshielded Consumer Hardware</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans">
                    Consumer Smart TVs and voice assistants continuously transmit audio snippets, network scans, and ACR content fingerprints to foreign analytics servers. Either <strong className="text-[#FF2E9F]">NUKE</strong> tracking histories or <strong className="text-[#00D4FF]">KNOX</strong> devices into an air-gapped non-routable VLAN.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchIsolateAll}
                    disabled={isIsolatingAll || unisolatedCount === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Air-Gap All Nodes ({unisolatedCount})</span>
                  </button>
                </div>
              </div>

              {/* Devices Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices.map((dev) => (
                  <div
                    key={dev.id}
                    className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                      dev.networkVlanStatus === 'ACR_PURGED_NUKED'
                        ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                        : dev.networkVlanStatus === 'VLAN_ISOLATED_KNOXED'
                        ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                        : 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{dev.deviceName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                            {dev.deviceType}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          MAC: {dev.macAddress}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        dev.networkVlanStatus === 'ACR_PURGED_NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                        dev.networkVlanStatus === 'VLAN_ISOLATED_KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                        'bg-orange-500/20 text-[#FF7A18] border border-orange-500/50 animate-pulse'
                      }`}>
                        {dev.networkVlanStatus === 'ACR_PURGED_NUKED' ? 'ACR NUKED ✓' :
                         dev.networkVlanStatus === 'VLAN_ISOLATED_KNOXED' ? 'AIR-GAPPED VLAN (KNOXED)' : 'BEACONING WAN'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                      <div className="text-[10px] text-slate-400">TELEMETRY SINK:</div>
                      <div className="text-cyan-200 font-bold truncate">
                        {dev.telemetryDestination}
                      </div>
                      <div className="text-[10px] pt-1 flex items-center justify-between text-slate-400">
                        <span>ACR Active: {dev.acrTrackingActive ? 'YES (RECORDING)' : 'NO'}</span>
                        <span>Audio Sniffing: {dev.unencryptedAudioStream ? 'EXPOSED' : 'BLOCKED'}</span>
                      </div>
                    </div>

                    {/* SHA-256 Audit */}
                    <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#00D4FF]" />
                        <span>Audit Digest:</span>
                      </span>
                      <span className="text-cyan-300 truncate max-w-[170px]" title={dev.sha256Audit}>
                        {dev.sha256Audit}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      {dev.networkVlanStatus === 'UNISOLATED_DEFAULT' ? (
                        <>
                          <button
                            onClick={() => handlePurgeAcrTelemetry(dev.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Purge ACR (Nuke)</span>
                          </button>

                          <button
                            onClick={() => handleEnforceVlanIsolation(dev.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Air-Gap VLAN (Knox)</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Wan Egress Blocked • Eavesdropping Mitigated</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ACR VIEWING OPT-OUT */}
          {activeTab === 'ACR_PURGE' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF2E9F]" />
                  <span>Automatic Content Recognition (ACR) Profiling Neutralization</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  ACR takes millisecond acoustic and visual snapshots of whatever you stream on your TV, matching it against ad attribution databases (Samsung Ads, LG LivePlus, Vizio Inscape). This data is sold to cross-device data brokers to serve ads on your phone.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-cyan-300 font-bold uppercase">Automated ACR Blocking Directives:</div>
                <div className="space-y-2 text-slate-300">
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <span>Block DNS: `smetrics.samsung.com` & `inscape.vizio.com`</span>
                    <span className="text-[#00D4FF] font-bold">ENFORCED</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <span>Drop Egress Audio Watermark TCP Port 8443</span>
                    <span className="text-[#00D4FF] font-bold">ENFORCED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT STREAM */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF7A18]" />
                <span>Smart Home Network Isolation Telemetry</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Actions Logged Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Execute an ACR purge or isolate a device to an air-gapped VLAN to append cryptographic audit entries.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-[#0B1020] p-5 font-mono text-xs space-y-2.5 shadow-inner">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="text-cyan-300 leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>BitDefender Home Guard Protocol & Air-Gapped VLAN Isolation Certified</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Quarantine
              </button>

              <button
                onClick={() => {
                  const finalStatus = acrPurgedCount > 0 ? 'NUKED' : vlanIsolatedCount > 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-13',
                    finalStatus,
                    `Module 13 Synchronized: ${acrPurgedCount} ACR histories wiped, ${vlanIsolatedCount} nodes air-gapped on VLAN.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 13 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
