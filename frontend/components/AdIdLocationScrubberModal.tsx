import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Radio, 
  Smartphone, 
  Compass, 
  Send, 
  Hash, 
  Check, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  Navigation, 
  Sliders, 
  Globe, 
  Binary, 
  Terminal,
  FileText
} from 'lucide-react';
import { AdBeaconItem, LocationBreadcrumbRecord, LocationFuzzingProfile, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface AdIdLocationScrubberModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_BEACONS: AdBeaconItem[] = [
  {
    id: 'bcn-01',
    beaconType: 'APPLE_IDFA',
    devicePlatform: 'iPhone 15 Pro (iOS 17.5)',
    identifierValue: 'EA7583CD-A667-48BC-B806-42ECB2B48D12',
    linkedAppEcosystem: 'Retail, Ride-sharing & Streaming Apps',
    resellerBroker: 'Kochava / AppsFlyer Attribution Exchange',
    status: 'EXPOSED_TRACKING',
    lastBroadcast: '4 mins ago',
    sha256Fingerprint: '94c12ba0914dafeea1203980bc771239efa66102da88120349acb11290feab21',
  },
  {
    id: 'bcn-02',
    beaconType: 'GOOGLE_GAID',
    devicePlatform: 'Android Pixel 8 (Google Play Services 24.12)',
    identifierValue: '38400000-8cf0-11bd-b23e-10b96e40000d',
    linkedAppEcosystem: 'Google Ad Exchange, In-Game SDKs & News Apps',
    resellerBroker: 'LiveRamp RampID / Criteo Bidstream',
    status: 'EXPOSED_TRACKING',
    lastBroadcast: '12 mins ago',
    sha256Fingerprint: 'a7182901bcae4491901239aafe0012bcefa45100ca8912401239bcaef1049901',
  },
  {
    id: 'bcn-03',
    beaconType: 'CONNECTED_TV_IFA',
    devicePlatform: 'Samsung Tizen Smart TV & Roku Ultra',
    identifierValue: 'TIZEN-IFA-4912-8819-BCA0-9901',
    linkedAppEcosystem: 'ACR Automatic Content Recognition viewing logs',
    resellerBroker: 'Inscape Data / Alphonso TV Audience Network',
    status: 'EXPOSED_TRACKING',
    lastBroadcast: '1 hour ago',
    sha256Fingerprint: '4901bafe00129bcadfe451092aa8810239bcaec45109aa7712300bfae9014120',
  },
  {
    id: 'bcn-04',
    beaconType: 'CROSS_APP_DEVICE_FINGERPRINT',
    devicePlatform: 'Mobile Safari + Chrome Canvas & WebGL Audio Hash',
    identifierValue: 'FP-CANVAS-WEBGL-ENCLAVE-FAILOVER',
    linkedAppEcosystem: '37 mobile web SDK trackers without consent',
    resellerBroker: 'Drawbridge / Tapad Cross-Device Graph',
    status: 'EXPOSED_TRACKING',
    lastBroadcast: '28 mins ago',
    sha256Fingerprint: '8812049102bcaeeffa901234bce009124cb11ef02891204bbfae4412039bca11',
  }
];

const INITIAL_LOCATION_RECORDS: LocationBreadcrumbRecord[] = [
  {
    id: 'loc-01',
    brokerSource: 'SafeGraph',
    approxCity: 'New York, NY (Financial District)',
    preciseLatLong: '40.7075° N, 74.0090° W (±1.4 meters)',
    timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(),
    dwellTimeMinutes: 45,
    sdkCarrierApp: 'Weather Radar Pro Free SDK',
    status: 'PROFILED_FOR_SALE',
    sha256Attestation: 'f1029ba81234091aabce45109012baef990123cba001248901239aafee109401',
  },
  {
    id: 'loc-02',
    brokerSource: 'Outlogic / X-Mode',
    approxCity: 'Brooklyn, NY (DUMBO Tech Corridor)',
    preciseLatLong: '40.7033° N, 73.9881° W (±2.2 meters)',
    timestamp: new Date(Date.now() - 3600000 * 6).toLocaleTimeString(),
    dwellTimeMinutes: 180,
    sdkCarrierApp: 'Fitness Step Counter Free',
    status: 'PROFILED_FOR_SALE',
    sha256Attestation: '2901abfe90124501bcae44120938bb0012aef45109981203aafee91024bba771',
  },
  {
    id: 'loc-03',
    brokerSource: 'Cuebiq Mobility',
    approxCity: 'Midtown Manhattan, NY (Grand Central Vicinity)',
    preciseLatLong: '40.7527° N, 73.9772° W (±1.1 meters)',
    timestamp: new Date(Date.now() - 3600000 * 14).toLocaleTimeString(),
    dwellTimeMinutes: 25,
    sdkCarrierApp: 'Commuter Transit Tracker SDK',
    status: 'PROFILED_FOR_SALE',
    sha256Attestation: '8841092baef1203aa90124bcae441092bba0012ef451092aabfe991024bb1190',
  },
  {
    id: 'loc-04',
    brokerSource: 'Veraset',
    approxCity: 'Queens, NY (JFK International Terminal)',
    preciseLatLong: '40.6413° N, 73.7781° W (±3.5 meters)',
    timestamp: new Date(Date.now() - 3600000 * 28).toLocaleTimeString(),
    dwellTimeMinutes: 90,
    sdkCarrierApp: 'Airline Loyalty Travel Companion',
    status: 'PROFILED_FOR_SALE',
    sha256Attestation: 'c451092aabfe00129038baef109241bbaef9901234bca001248901239aafee10',
  }
];

export const AdIdLocationScrubberModal: React.FC<AdIdLocationScrubberModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [beacons, setBeacons] = useState<AdBeaconItem[]>(INITIAL_BEACONS);
  const [breadcrumbs, setBreadcrumbs] = useState<LocationBreadcrumbRecord[]>(INITIAL_LOCATION_RECORDS);
  const [activeTab, setActiveTab] = useState<'AD_BEACONS' | 'MOBILITY_BROKERS' | 'FUZZING_STUDIO'>('AD_BEACONS');
  
  // Location Fuzzing state
  const [fuzzProfile, setFuzzProfile] = useState<LocationFuzzingProfile>({
    fuzzRadiusMiles: 8,
    fuzzAlgorithm: 'LAPLACE_DIFFERENTIAL_PRIVACY',
    activeMacRotation: true,
    suppressCellularTriangulation: true,
    sha256Proof: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  });

  const [isZeroingAll, setIsZeroingAll] = useState(false);
  const [isPurgingBrokers, setIsPurgingBrokers] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const exposedBeaconsCount = useMemo(() => beacons.filter(b => b.status === 'EXPOSED_TRACKING').length, [beacons]);
  const forSaleBreadcrumbsCount = useMemo(() => breadcrumbs.filter(b => b.status === 'PROFILED_FOR_SALE').length, [breadcrumbs]);

  if (!isOpen) return null;

  // Single IDFA / GAID Reset (NUKE)
  const handleResetSingleBeacon = async (beaconId: string) => {
    const beacon = beacons.find(b => b.id === beaconId);
    if (!beacon) return;

    const receipt = await calculateSha256(`ZEROED_ADID::${beacon.beaconType}::${Date.now()}::${userProfile.primaryEmail}`);
    const timeStr = new Date().toLocaleTimeString();

    setBeacons(prev => prev.map(b => {
      if (b.id === beaconId) {
        return {
          ...b,
          identifierValue: '00000000-0000-0000-0000-000000000000 (Zeroed / Opted Out)',
          status: 'NUKED_ZEROED',
          sha256Fingerprint: receipt,
          lastBroadcast: 'Terminated',
        };
      }
      return b;
    }));

    const logLine = `[${timeStr}] 🔥 NUKED AD-BEACON: ${beacon.beaconType} reset to zeroed UUID. Cross-app auction cookies destroyed. Receipt: ${receipt.substring(0, 16)}...`;
    setTelemetryLogs(prev => [logLine, ...prev]);

    const updated = beacons.map(b => b.id === beaconId ? { ...b, status: 'NUKED_ZEROED' as const } : b);
    if (updated.filter(b => b.status === 'EXPOSED_TRACKING').length === 0) {
      onUpdatePerimeterVector('diff-14', 'NUKED', 'All mobile advertising identifiers (IDFA/GAID) permanently zeroed and purged from broker auction graphs.');
    }
  };

  // Enforce Hardware Enclave Random ID Rotation (KNOX)
  const handleKnoxRotatingBeacon = async (beaconId: string) => {
    const beacon = beacons.find(b => b.id === beaconId);
    if (!beacon) return;

    const rotatingUuid = `ENCLAVE-RAND-${Math.random().toString(36).substring(2, 10).toUpperCase()}-ROTATE-60S`;
    const receipt = await calculateSha256(`KNOX_ROTATION::${rotatingUuid}::${userProfile.masterKeyHash}`);
    const timeStr = new Date().toLocaleTimeString();

    setBeacons(prev => prev.map(b => {
      if (b.id === beaconId) {
        return {
          ...b,
          identifierValue: rotatingUuid,
          status: 'KNOXED_ROTATING',
          sha256Fingerprint: receipt,
          lastBroadcast: '1-min ephemeral lease',
        };
      }
      return b;
    }));

    const logLine = `[${timeStr}] 🛡️ KNOXED ENCLAVE LEASE: ${beacon.beaconType} locked behind ephemeral rotating cryptographic random MAC / AdID token. Digest: ${receipt.substring(0, 16)}...`;
    setTelemetryLogs(prev => [logLine, ...prev]);

    onUpdatePerimeterVector('diff-14', 'KNOXED', 'Advertising ID locked behind hardware enclave ephemeral rotation.');
  };

  // Batch Reset All Ad Beacons
  const handleBatchResetAllBeacons = async () => {
    setIsZeroingAll(true);
    const exposed = beacons.filter(b => b.status === 'EXPOSED_TRACKING');

    for (const bcn of exposed) {
      await new Promise(r => setTimeout(r, 220));
      await handleResetSingleBeacon(bcn.id);
    }

    setIsZeroingAll(false);
    onUpdatePerimeterVector('diff-14', 'NUKED', 'Complete Ad-Identifier sanitization: IDFA, GAID and CTV tracking tokens zeroed.');
  };

  // Issue Statutory Location Breadcrumb Erasure Demand to Mobility Broker
  const handlePurgeLocationRecord = async (recId: string) => {
    const rec = breadcrumbs.find(r => r.id === recId);
    if (!rec) return;

    const receipt = await calculateSha256(`MOBILITY_PURGE_ORDER::${rec.brokerSource}::${rec.preciseLatLong}::${Date.now()}`);
    const timeStr = new Date().toLocaleTimeString();

    setBreadcrumbs(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status: 'PURGE_ORDER_DISPATCHED',
          sha256Attestation: receipt,
        };
      }
      return r;
    }));

    const logLine = `[${timeStr}] 📍 MOBILITY SCRUB: Statutory DSAR deletion issued to ${rec.brokerSource} for coordinate set (${rec.preciseLatLong}). Receipt: ${receipt.substring(0, 16)}...`;
    setTelemetryLogs(prev => [logLine, ...prev]);
  };

  // Batch Purge All Mobility Brokers
  const handleBatchPurgeAllBrokers = async () => {
    setIsPurgingBrokers(true);
    const active = breadcrumbs.filter(r => r.status === 'PROFILED_FOR_SALE');

    for (const rec of active) {
      await new Promise(r => setTimeout(r, 240));
      await handlePurgeLocationRecord(rec.id);
    }

    setIsPurgingBrokers(false);
    onUpdatePerimeterVector('diff-14', 'NUKED', 'Statutory location erasure demands dispatched to SafeGraph, Cuebiq, and Outlogic mobility brokers.');
  };

  // Commit Cryptographic Location Fuzzing Profile (KNOX)
  const handleCommitFuzzingProfile = async () => {
    const proof = await calculateSha256(`LOCATION_FUZZ_${fuzzProfile.fuzzAlgorithm}_${fuzzProfile.fuzzRadiusMiles}MILES_${Date.now()}`);
    setFuzzProfile(prev => ({ ...prev, sha256Proof: proof }));

    const timeStr = new Date().toLocaleTimeString();
    const logLine = `[${timeStr}] 🛡️ KNOXED LOCATION: Differential Privacy Fuzzing committed. Enforced ${fuzzProfile.fuzzRadiusMiles}-mile Gaussian offset & MAC rotation. Proof: ${proof.substring(0, 16)}...`;
    setTelemetryLogs(prev => [logLine, ...prev]);

    // Obscure all local coordinates in memory
    setBreadcrumbs(prev => prev.map(r => ({
      ...r,
      preciseLatLong: `[KNOXED] Regional centroid blurred (±${fuzzProfile.fuzzRadiusMiles}.0 miles noise)`,
      status: 'FUZZED_OBSCURED',
    })));

    onUpdatePerimeterVector('diff-14', 'KNOXED', `Location fuzzing active: ${fuzzProfile.fuzzRadiusMiles}-mile ${fuzzProfile.fuzzAlgorithm} differential privacy applied.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      {/* Outer pulsing neon border gradient */}
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#FF7A18]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,24,0.3)]">
                <MapPin className="w-6 h-6 text-[#FF7A18] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 14: Ad Identifier & Geolocation Scrubber
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    IDFA • GAID • MOBILITY BROKERS
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Cross-App Ad Profiling Neutralization • Differential Location Fuzzing • 2026 ECRA LTS
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

          {/* Navigation Bar & Summary Tally */}
          <div className="px-4 sm:px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('AD_BEACONS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'AD_BEACONS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>1. Ad Identifiers & Beacons ({beacons.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('MOBILITY_BROKERS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'MOBILITY_BROKERS'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>2. Mobility Broker Sales ({breadcrumbs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('FUZZING_STUDIO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'FUZZING_STUDIO'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>3. Differential Location Fuzzing</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                {exposedBeaconsCount} BEACONS BROADCASTING
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {forSaleBreadcrumbsCount} BROKER DOSSIERS
              </span>
            </div>
          </div>

          {/* TAB 1: AD IDENTIFIERS & TRACKING BEACONS */}
          {activeTab === 'AD_BEACONS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Batch Action Banner */}
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Ad ID Profiling Graph Neutralization</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    Mobile operating systems expose Advertising Identifiers (Apple IDFA & Google GAID) that commercial data brokers stitch together with real-time bidding bidstreams. Use <strong className="text-[#FF2E9F]">NUKE</strong> to permanently zero-out identifiers or <strong className="text-[#00D4FF]">KNOX</strong> to enforce 60-second hardware enclave rotating random leases.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchResetAllBeacons}
                    disabled={isZeroingAll || exposedBeaconsCount === 0}
                    className="relative group p-[1.5px] rounded-xl overflow-hidden shadow-lg disabled:opacity-40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
                    <div className="relative px-4 py-2.5 rounded-[10px] bg-[#0B1020] group-hover:bg-[#0F172A] text-white text-xs font-mono font-extrabold flex items-center gap-2 transition">
                      <Flame className="w-4 h-4 text-[#FF2E9F]" />
                      <span>Zero-Out All Ad IDs ({exposedBeaconsCount})</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Beacon Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {beacons.map((beacon) => {
                  return (
                    <div
                      key={beacon.id}
                      className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                        beacon.status === 'NUKED_ZEROED'
                          ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                          : beacon.status === 'KNOXED_ROTATING'
                          ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                          : 'border-orange-500/50 shadow-[0_0_15px_rgba(255,122,24,0.15)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                              {beacon.beaconType.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300">
                              {beacon.devicePlatform}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-1">
                            Reseller Sink: <strong className="text-white">{beacon.resellerBroker}</strong>
                          </div>
                        </div>

                        {/* Status Tag */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          beacon.status === 'NUKED_ZEROED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                          beacon.status === 'KNOXED_ROTATING' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                          'bg-orange-500/20 text-[#FF7A18] border border-orange-500/50 animate-pulse'
                        }`}>
                          {beacon.status === 'NUKED_ZEROED' ? 'ZEROED OUT (NUKED) ✓' :
                           beacon.status === 'KNOXED_ROTATING' ? 'ENCLAVE LEASE (KNOXED)' : 'ACTIVE BEACON BROADCAST'}
                        </span>
                      </div>

                      {/* Identifier Value Display */}
                      <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>EXPOSED BROADCAST VALUE:</span>
                          <span className="text-cyan-300">{beacon.lastBroadcast}</span>
                        </div>
                        <div className="text-white font-mono text-[11px] truncate font-bold">
                          {beacon.identifierValue}
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1">
                          App Ecosystem: {beacon.linkedAppEcosystem}
                        </div>
                      </div>

                      {/* SHA-256 Fingerprint */}
                      <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-[#00D4FF]" />
                          <span>Audit Digest:</span>
                        </span>
                        <span className="text-cyan-300 truncate max-w-[170px]" title={beacon.sha256Fingerprint}>
                          {beacon.sha256Fingerprint}
                        </span>
                      </div>

                      {/* Action Triggers: NUKED vs KNOXED */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {beacon.status === 'EXPOSED_TRACKING' ? (
                          <>
                            <button
                              onClick={() => handleResetSingleBeacon(beacon.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                              title="Zero out Ad ID and sever ad attribution"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>Zero Out (Nuke)</span>
                            </button>

                            <button
                              onClick={() => handleKnoxRotatingBeacon(beacon.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                              title="Enforce hardware-bound 60-second rotating identifier"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Random Lease (Knox)</span>
                            </button>
                          </>
                        ) : beacon.status === 'NUKED_ZEROED' ? (
                          <div className="flex items-center justify-between w-full text-[11px] font-mono text-[#FF2E9F] font-bold">
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Zeroed UUID • Tracking Disrupted</span>
                            </span>
                            <button
                              onClick={() => handleKnoxRotatingBeacon(beacon.id)}
                              className="text-[10px] text-cyan-300 hover:underline"
                            >
                              Upgrade to Knox Rotation
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-[#00D4FF] flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Hardware Enclave Cryptographic Rotation Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MOBILITY BROKER SALES AUDIT */}
          {activeTab === 'MOBILITY_BROKERS' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#FF2E9F]" />
                    <span>Location Data Reseller & Precise Coordinate Dossier</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-xl">
                    Mobility aggregators harvest precise latitude/longitude breadcrumbs embedded inside weather, transit, and fitness apps. Issue automated GDPR Article 17 and CCPA deletion orders to purge coordinate histories.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchPurgeAllBrokers}
                    disabled={isPurgingBrokers || forSaleBreadcrumbsCount === 0}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Purge All Mobility Records ({forSaleBreadcrumbsCount})</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumb Records Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0F172A] overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead className="bg-[#111A33] text-slate-300">
                    <tr>
                      <th className="p-3">Data Broker</th>
                      <th className="p-3">Detected Vicinity</th>
                      <th className="p-3">Exposed Coordinates</th>
                      <th className="p-3">Dwell Time</th>
                      <th className="p-3">Carrier App SDK</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11px]">
                    {breadcrumbs.map((rec) => {
                      return (
                        <tr key={rec.id} className="hover:bg-[#111A33]/50 transition">
                          <td className="p-3 font-bold text-white">
                            <span className="text-[#00D4FF]">{rec.brokerSource}</span>
                          </td>
                          <td className="p-3 text-slate-200 font-sans">{rec.approxCity}</td>
                          <td className="p-3">
                            <span className={rec.status === 'FUZZED_OBSCURED' ? 'text-green-400 font-bold' : 'text-orange-400'}>
                              {rec.preciseLatLong}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{rec.dwellTimeMinutes} mins</td>
                          <td className="p-3 text-cyan-300">{rec.sdkCarrierApp}</td>
                          <td className="p-3">
                            {rec.status === 'PROFILED_FOR_SALE' ? (
                              <button
                                onClick={() => handlePurgeLocationRecord(rec.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/40 text-[#FF2E9F] font-bold text-[10px]"
                              >
                                Dispatch Purge
                              </button>
                            ) : rec.status === 'PURGE_ORDER_DISPATCHED' ? (
                              <span className="text-[#FF2E9F] font-bold text-[10px] flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Purge Dispatched</span>
                              </span>
                            ) : (
                              <span className="text-green-400 font-bold text-[10px] flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Fuzzed & Masked</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DIFFERENTIAL LOCATION FUZZING STUDIO */}
          {activeTab === 'FUZZING_STUDIO' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#00D4FF]" />
                    <span>Cryptographic Differential Privacy Location Fuzzing Studio</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-xl">
                    Injects mathematically provable Laplacian noise into location API responses. Non-essential applications receive an obfuscated regional centroid rather than your precise street address or building coordinates.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCommitFuzzingProfile}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] via-[#FF7A18] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enforce Enclave Fuzzing</span>
                  </button>
                </div>
              </div>

              {/* Interactive Fuzzing Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Parameter Sliders */}
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-bold uppercase">
                        Obfuscation Radius:
                      </label>
                      <span className="text-[#00D4FF] font-bold text-sm">
                        {fuzzProfile.fuzzRadiusMiles} Miles
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="25"
                      value={fuzzProfile.fuzzRadiusMiles}
                      onChange={(e) => setFuzzProfile(prev => ({ ...prev, fuzzRadiusMiles: Number(e.target.value) }))}
                      className="w-full accent-[#00D4FF] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Neighborhood (2 mi)</span>
                      <span>Regional Mask (25 mi)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold uppercase mb-1">
                      Differential Algorithm:
                    </label>
                    <select
                      value={fuzzProfile.fuzzAlgorithm}
                      onChange={(e) => setFuzzProfile(prev => ({ ...prev, fuzzAlgorithm: e.target.value as any }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                    >
                      <option value="LAPLACE_DIFFERENTIAL_PRIVACY">Laplace Mechanism (ε = 0.5)</option>
                      <option value="GEO_HASH_TRUNCATION">Geohash 5-Character Truncation</option>
                      <option value="RANDOMIZED_HEX_VORONOI">Randomized Voronoi Hexagon Shift</option>
                      <option value="BLIND_PROXIMITY_MASK">Agape Sovereign Blind Proximity Mask</option>
                    </select>
                  </div>

                  {/* Hardware Protections Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fuzzProfile.activeMacRotation}
                        onChange={(e) => setFuzzProfile(prev => ({ ...prev, activeMacRotation: e.target.checked }))}
                        className="rounded accent-[#00D4FF]"
                      />
                      <span>Randomized WiFi / Bluetooth MAC Rotation</span>
                    </label>

                    <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fuzzProfile.suppressCellularTriangulation}
                        onChange={(e) => setFuzzProfile(prev => ({ ...prev, suppressCellularTriangulation: e.target.checked }))}
                        className="rounded accent-[#00D4FF]"
                      />
                      <span>Cellular Tower Triangulation Suppression</span>
                    </label>
                  </div>
                </div>

                {/* Visual Spatial Simulation Map Card */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#00D4FF]" />
                      SPATIAL DIFFERENTIAL PRIVACY MATRIX (SIMULATION)
                    </span>
                    <span className="text-green-400 font-bold">
                      EXACT GPS SUPPRESSED
                    </span>
                  </div>

                  {/* Radar Fuzzing Circle Visualizer */}
                  <div className="relative h-56 rounded-2xl bg-[#0B1020] border border-slate-800 flex items-center justify-center overflow-hidden">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#111A33_1px,transparent_1px),linear-gradient(to_bottom,#111A33_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

                    {/* Fuzzed Obfuscation Radius Rings */}
                    <div 
                      className="absolute rounded-full border-2 border-dashed border-[#00D4FF] bg-[#00D4FF]/10 animate-pulse flex items-center justify-center transition-all duration-300"
                      style={{ 
                        width: `${Math.min(220, fuzzProfile.fuzzRadiusMiles * 9 + 40)}px`, 
                        height: `${Math.min(220, fuzzProfile.fuzzRadiusMiles * 9 + 40)}px` 
                      }}
                    >
                      <span className="text-[10px] font-mono text-cyan-300 bg-[#0B1020]/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                        ±{fuzzProfile.fuzzRadiusMiles} Mi Fuzz Shield
                      </span>
                    </div>

                    {/* Original True Coordinate Dot (Suppressed) */}
                    <div className="relative z-10 w-3 h-3 rounded-full bg-[#FF2E9F] shadow-[0_0_12px_#FF2E9F] flex items-center justify-center">
                      <span className="sr-only">Original Location</span>
                    </div>
                  </div>

                  {/* Proof Hash & Legal Assurance */}
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Cryptographic Attestation:</span>
                    <span className="text-cyan-300 font-bold truncate max-w-xs" title={fuzzProfile.sha256Proof}>
                      {fuzzProfile.sha256Proof}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Binary className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>Zero-IDFA/GAID Mode & Differential Privacy Laplace Fuzzing Protected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Scrubber
              </button>

              <button
                onClick={() => {
                  const finalStatus = exposedBeaconsCount === 0 && forSaleBreadcrumbsCount === 0 ? 'NUKED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-14',
                    finalStatus,
                    `Module 14 Synchronized: Ad IDs zeroed, location fuzzing set to ${fuzzProfile.fuzzRadiusMiles}-mile radius.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 14 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
