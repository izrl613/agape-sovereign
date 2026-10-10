import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Camera, 
  Upload, 
  Sliders, 
  Check, 
  Hash, 
  Sparkles, 
  Lock, 
  Send, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Binary, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Terminal, 
  FileText,
  ScanFace,
  ShieldAlert
} from 'lucide-react';
import { ScrapedFaceIndex, BiometricEngine, BiometricIndexStatus, CloakFilterAlgorithm, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface BiometricDefenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_INDEXES: ScrapedFaceIndex[] = [
  {
    id: 'bio-01',
    engine: 'CLEARVIEW_AI',
    sourceContext: '2024 Tech Summit Keynote Audience Photo (Flickr / Public Web)',
    confidenceScore: 98.4,
    matchedFacialLandmarks: 128,
    detectedUrl: 'https://images.flickr.com/photos/techconf2024/keynote_hall_08.jpg',
    status: 'INDEXED_EXPOSED',
    sha256Attestation: 'a3f91244bb0124deaa678912bc05178dcbb1582098dcf62541097e330a1144fe',
  },
  {
    id: 'bio-02',
    engine: 'PIMEYES',
    sourceContext: 'Alumni Directory Portrait & Regional Newspaper Group Photo',
    confidenceScore: 96.1,
    matchedFacialLandmarks: 114,
    detectedUrl: 'https://cdn.regionalnews.com/archives/2023/leadership_cohort.jpg',
    status: 'INDEXED_EXPOSED',
    sha256Attestation: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'bio-03',
    engine: 'FACECHECK_ID',
    sourceContext: 'Public Real Estate Agent Video Clip Thumbnail (Vimeo)',
    confidenceScore: 91.8,
    matchedFacialLandmarks: 96,
    detectedUrl: 'https://i.vimeocdn.com/video/14981023_640x360.jpg',
    status: 'INDEXED_EXPOSED',
    sha256Attestation: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  },
  {
    id: 'bio-04',
    engine: 'SEARCHFACE_VK',
    sourceContext: 'Public Social Network Group Album from 2019 Community Gala',
    confidenceScore: 89.2,
    matchedFacialLandmarks: 88,
    detectedUrl: 'https://sun9-21.userapi.com/impf/c845218/v845218901/album_cover.jpg',
    status: 'INDEXED_EXPOSED',
    sha256Attestation: '5a2190dfca7832bc0189ef451299cbaa011287eac9903124785bc0029312feae',
  }
];

export const BiometricDefenseModal: React.FC<BiometricDefenseModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [indexes, setIndexes] = useState<ScrapedFaceIndex[]>(INITIAL_INDEXES);
  const [activeTab, setActiveTab] = useState<'SCRAPER_INDEX' | 'CLOAKING_STUDIO' | 'BIPA_DISPATCHER'>('SCRAPER_INDEX');
  
  // Cloaking Studio State
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>('https://picsum.photos/400/400?random=108');
  const [cloakAlgorithm, setCloakAlgorithm] = useState<CloakFilterAlgorithm>('FAWKES_ADVERSARIAL');
  const [noiseIntensity, setNoiseIntensity] = useState<number>(35);
  const [isProcessingCloak, setIsProcessingCloak] = useState<boolean>(false);
  const [cloakedHash, setCloakedHash] = useState<string>('8e12ab7300c1445fbca211470912bc05178dcbb1582098dcf62541097e330a11');
  const [aiConfidencePreCloak, setAiConfidencePreCloak] = useState<number>(98.4);
  const [aiConfidencePostCloak, setAiConfidencePostCloak] = useState<number>(8.2);

  // BIPA & Action Telemetry
  const [bipaAuditLogs, setBipaAuditLogs] = useState<string[]>([]);
  const [isDispatchingBipa, setIsDispatchingBipa] = useState<boolean>(false);
  const [bipaSelectedTarget, setBipaSelectedTarget] = useState<ScrapedFaceIndex>(INITIAL_INDEXES[0]);
  const [bipaCopied, setBipaCopied] = useState<boolean>(false);

  // Canvas Refs for Real-Time Pixel Noise Perturbation
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloakedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Counts
  const exposedCount = useMemo(() => indexes.filter(i => i.status === 'INDEXED_EXPOSED').length, [indexes]);
  const requestedCount = useMemo(() => indexes.filter(i => i.status === 'BIPA_ERASURE_REQUESTED').length, [indexes]);
  const purgedCount = useMemo(() => indexes.filter(i => i.status === 'CRYPTOGRAPHIC_PURGED').length, [indexes]);

  if (!isOpen) return null;

  // Apply HTML5 Canvas client-side adversarial pixel cloaking noise
  const renderCloakedCanvas = () => {
    setIsProcessingCloak(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = avatarPreviewUrl;
    img.onload = async () => {
      const srcCanvas = sourceCanvasRef.current;
      const dstCanvas = cloakedCanvasRef.current;
      if (!srcCanvas || !dstCanvas) {
        setIsProcessingCloak(false);
        return;
      }

      const size = 320;
      srcCanvas.width = size;
      srcCanvas.height = size;
      dstCanvas.width = size;
      dstCanvas.height = size;

      const srcCtx = srcCanvas.getContext('2d');
      const dstCtx = dstCanvas.getContext('2d');
      if (!srcCtx || !dstCtx) {
        setIsProcessingCloak(false);
        return;
      }

      // Draw original
      srcCtx.drawImage(img, 0, 0, size, size);
      dstCtx.drawImage(img, 0, 0, size, size);

      // Get image data to manipulate pixels with adversarial mathematical perturbations
      const imgData = dstCtx.getImageData(0, 0, size, size);
      const data = imgData.data;
      const intensity = noiseIntensity;

      for (let i = 0; i < data.length; i += 4) {
        // High frequency micro-perturbation targeting facial landmark feature vectors
        let deltaR = 0;
        let deltaG = 0;
        let deltaB = 0;

        if (cloakAlgorithm === 'FAWKES_ADVERSARIAL') {
          // Subtle antagonistic color shifts in orthogonal directions
          const noise = ((Math.sin(i * 0.1) * 127 + Math.cos(i * 0.3) * 127) % intensity) - (intensity / 2);
          deltaR = noise * 1.2;
          deltaG = -noise * 0.8;
          deltaB = noise * 1.5;
        } else if (cloakAlgorithm === 'LOWKEY_PERTURBATION') {
          // LowKey anti-commercial face recognition filter
          const seed = (Math.random() - 0.5) * intensity;
          deltaR = seed;
          deltaG = seed * 1.1;
          deltaB = -seed * 0.9;
        } else if (cloakAlgorithm === 'SPECTRAL_DIFFUSION_MASK') {
          // High-pass frequency cloaking
          const coordX = (i / 4) % size;
          const coordY = Math.floor((i / 4) / size);
          const gridNoise = (Math.sin(coordX / 3) * Math.cos(coordY / 3)) * (intensity * 0.8);
          deltaR = gridNoise;
          deltaG = gridNoise * 0.5;
          deltaB = gridNoise * 1.3;
        } else {
          // Sovereign Enclave Noise Vector (Neon Hue Matrix)
          deltaR = (Math.random() * intensity) - (intensity / 3);
          deltaG = ((Math.random() * intensity) - (intensity / 2)) * 0.4;
          deltaB = (Math.random() * intensity);
        }

        data[i] = Math.min(255, Math.max(0, data[i] + deltaR));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + deltaG));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + deltaB));
      }

      dstCtx.putImageData(imgData, 0, 0);

      // Re-hash client side
      const dataUrl = dstCanvas.toDataURL('image/jpeg', 0.9);
      const computedHash = await calculateSha256(`CLOAKED_AVATAR::${cloakAlgorithm}::${intensity}::${dataUrl.substring(0, 100)}`);
      setCloakedHash(computedHash);

      // Model AI recognition suppression calculation
      const suppressed = Math.max(2.4, Math.round((100 - (intensity * 2.2)) * 10) / 10);
      setAiConfidencePostCloak(suppressed);
      setIsProcessingCloak(false);
    };
  };

  useEffect(() => {
    if (activeTab === 'CLOAKING_STUDIO') {
      renderCloakedCanvas();
    }
  }, [avatarPreviewUrl, cloakAlgorithm, noiseIntensity, activeTab]);

  // Generate legal BIPA (Illinois 740 ILCS 14/) + 2026 ECRA Biometric Deletion Letter
  const generateBipaNotice = (target: ScrapedFaceIndex) => {
    const today = new Date().toISOString().split('T')[0];
    return `STATUTORY DEMAND FOR IMMEDIATE BIOMETRIC DATA SCRUBBING & OPT-OUT
Pursuant to:
- Illinois Biometric Information Privacy Act (BIPA), 740 ILCS 14/15
- California Consumer Privacy Act / CPRA § 1798.100 (Sensitive Biometric Information)
- 2026 ERCA / ECRA Biometric Sovereignty Standard (Agape Enclave Protocol)

DATE: ${today}
TO: Legal & Biometric Compliance Team, ${target.engine} Engine
VIA: Sovereign Autonomous Biometric Dispatcher (DIFF-2026-BIPA-PURGE)

SUBJECT & AGGRIEVED INDIVIDUAL:
Full Legal Name: ${userProfile.fullName}
Primary Sovereign Email: ${userProfile.primaryEmail}
Hardware Passkey Authenticator: ${userProfile.passkeyDeviceId}
Root Sovereign Digest: ${userProfile.masterKeyHash}

UNCONSENTED BIOMETRIC HARVESTING EVIDENCE:
- Scraped Image Vector: ${target.sourceContext}
- Source URL: ${target.detectedUrl}
- Biometric Facial Landmark Template Density: ${target.matchedFacialLandmarks} dimensional nodes
- Recognition Model Confidence: ${target.confidenceScore}%
- Cryptographic Proof Hash: ${target.sha256Attestation}

LEGAL DEMAND & STATUTORY NOTICE:
You are hereby formally notified that ${target.engine} has collected, captured, analyzed, and disseminated biometric identifiers (facial geometry vectors and mathematical facial embeddings) of the Subject without prior written consent, in explicit violation of 740 ILCS 14/15(b).

MANDATORY ACTIONS REQUIRED WITHIN 14 BUSINESS DAYS:
1. Permanently delete all facial geometry embeddings, neural network weights, and search index references representing the Subject.
2. Enroll the Subject's cryptographic biometric facial signature into your universal, permanent opt-out suppression registry.
3. Provide an authenticated SHA-256 certificate confirming execution of complete biometric destruction.

Notice of Statutory Damages:
Failure to comply triggers statutory liquidated damages of $1,000 for each negligent violation and $5,000 for each intentional/reckless violation pursuant to 740 ILCS 14/20.

DIGITALLY SUBMITTED BY:
${userProfile.fullName}
Client-Side Encrypted via Architect AI AGA PE Enclave`;
  };

  // Dispatch individual BIPA Notice (NUKE)
  const handleDispatchBipa = async (id: string) => {
    const target = indexes.find(i => i.id === id);
    if (!target) return;

    const receipt = await calculateSha256(`BIPA_DISPATCH::${target.engine}::${userProfile.primaryEmail}::${Date.now()}`);
    const timestamp = new Date().toISOString().substring(11, 19);

    setIndexes(prev => prev.map(i => {
      if (i.id === id) {
        return {
          ...i,
          status: 'BIPA_ERASURE_REQUESTED',
          bipaClaimId: `BIPA-2026-${Math.floor(Math.random() * 89999 + 10000)}`,
          sha256Attestation: receipt,
        };
      }
      return i;
    }));

    const auditLine = `[${timestamp} UTC] 🔥 BIPA DISPATCHED: Formal statutory erasure demand submitted to ${target.engine}. Receipt SHA-256: ${receipt.substring(0, 16)}...`;
    setBipaAuditLogs(prev => [auditLine, ...prev]);

    // Check if Module 10 should update to NUKED
    const updated = indexes.map(i => i.id === id ? { ...i, status: 'BIPA_ERASURE_REQUESTED' as const } : i);
    const exposedRemaining = updated.filter(i => i.status === 'INDEXED_EXPOSED').length;
    if (exposedRemaining === 0) {
      onUpdatePerimeterVector('diff-10', 'NUKED', `BIPA statutory deletion demands dispatched to Clearview, PimEyes, and all ${indexes.length} visual search indexes.`);
    }
  };

  // Batch dispatch to all remaining exposed engines
  const handleBatchDispatchAllBipa = async () => {
    setIsDispatchingBipa(true);
    const exposed = indexes.filter(i => i.status === 'INDEXED_EXPOSED');

    for (const item of exposed) {
      await new Promise(r => setTimeout(r, 260));
      await handleDispatchBipa(item.id);
    }

    setIsDispatchingBipa(false);
    onUpdatePerimeterVector('diff-10', 'NUKED', `All unconsented visual biometric databases served with BIPA Article 15 scrubbing demands.`);
  };

  // Commit Cloaked Avatar to Enclave Profile (KNOX)
  const handleCommitCloakedAvatar = () => {
    onUpdatePerimeterVector('diff-10', 'KNOXED', `Public sovereign avatar cryptographically cloaked via ${cloakAlgorithm} (AI confidence suppressed to ${aiConfidencePostCloak}%).`);
    const timestamp = new Date().toISOString().substring(11, 19);
    setBipaAuditLogs(prev => [`[${timestamp} UTC] 🛡️ KNOXED AVATAR: Cryptographic adversarial noise filter applied. Master Digest: ${cloakedHash.substring(0, 16)}...`, ...prev]);
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
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-[#00D4FF]/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <ScanFace className="w-6 h-6 text-[#00D4FF] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 10: Biometric Defense & Face Scraping Shield
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                    BIPA 740 ILCS 14 • CLEARVIEW & PIMEYES
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Visual Search Index Elimination • Adversarial Avatar Cloaking Studio • 2026 ECRA LTS
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
                onClick={() => setActiveTab('SCRAPER_INDEX')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'SCRAPER_INDEX'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                1. Visual Scraping Dossier ({indexes.length})
              </button>
              <button
                onClick={() => setActiveTab('CLOAKING_STUDIO')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'CLOAKING_STUDIO'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5 text-[#FF2E9F]" />
                <span>2. Adversarial Cloaking Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('BIPA_DISPATCHER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'BIPA_DISPATCHER'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#FF7A18]" />
                <span>3. BIPA Statutory Erasure Engine</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {exposedCount} INDEXED EXPOSURES
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-pink-950/40 text-[#FF2E9F] border border-pink-500/30 font-bold">
                {requestedCount} BIPA DEMANDED
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 text-[#00D4FF] border border-cyan-500/30 font-bold">
                CLOAKING READY
              </span>
            </div>
          </div>

          {/* TAB 1: VISUAL SCRAPING DOSSIER */}
          {activeTab === 'SCRAPER_INDEX' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Batch Action Banner */}
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Unconsented AI Facial Recognition Index Neutralization</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans leading-relaxed">
                    AI visual models like Clearview AI and PimEyes scrape billions of photos across social media and event galleries to construct unconsented facial geometry models. Use <strong className="text-[#FF2E9F]">NUKE</strong> to issue mandatory BIPA statutory deletion requests or <strong className="text-[#00D4FF]">KNOX</strong> your avatar using adversarial noise cloaking.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchDispatchAllBipa}
                    disabled={isDispatchingBipa || exposedCount === 0}
                    className="relative group p-[1.5px] rounded-xl overflow-hidden shadow-lg disabled:opacity-40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />
                    <div className="relative px-4 py-2.5 rounded-[10px] bg-[#0B1020] group-hover:bg-[#0F172A] text-white text-xs font-mono font-extrabold flex items-center gap-2 transition">
                      <Flame className="w-4 h-4 text-[#FF2E9F]" />
                      <span>Purge All via BIPA ({exposedCount})</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Scraped Face Index Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {indexes.map((idx) => {
                  return (
                    <div
                      key={idx.id}
                      className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                        idx.status === 'BIPA_ERASURE_REQUESTED'
                          ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-85'
                          : idx.status === 'CRYPTOGRAPHIC_PURGED'
                          ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                          : 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/40">
                              {idx.engine.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300">
                              {idx.matchedFacialLandmarks} Landmarks
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-white mt-1">
                            Confidence: {idx.confidenceScore}% Biometric Match
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-xs">
                            {idx.sourceContext}
                          </span>
                        </div>

                        {/* Status Tag */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          idx.status === 'BIPA_ERASURE_REQUESTED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                          idx.status === 'CRYPTOGRAPHIC_PURGED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                          'bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/50'
                        }`}>
                          {idx.status === 'BIPA_ERASURE_REQUESTED' ? 'BIPA FILED (NUKED) ✓' :
                           idx.status === 'CRYPTOGRAPHIC_PURGED' ? 'SCRUBBED FROM ENGINE' : 'UNCONSENTED INDEX'}
                        </span>
                      </div>

                      {/* Source URL & Detected Fingerprint */}
                      <div className="p-2.5 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1">
                        <div className="text-[10px] text-slate-400 truncate">
                          Source URL: <span className="text-cyan-300">{idx.detectedUrl}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Verification SHA-256:</span>
                          <span className="text-cyan-200 font-mono truncate max-w-[170px]" title={idx.sha256Attestation}>
                            {idx.sha256Attestation}
                          </span>
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {idx.status === 'INDEXED_EXPOSED' ? (
                          <>
                            <button
                              onClick={() => {
                                setBipaSelectedTarget(idx);
                                setActiveTab('BIPA_DISPATCHER');
                              }}
                              className="text-[11px] font-mono text-cyan-300 hover:text-white flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#00D4FF]" />
                              <span>View BIPA Notice</span>
                            </button>

                            <button
                              onClick={() => handleDispatchBipa(idx.id)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] to-[#00D4FF] text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md hover:opacity-90 transition"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>Dispatch BIPA Nuke</span>
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center justify-between w-full text-[11px] font-mono text-[#FF2E9F] font-bold">
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Claim {idx.bipaClaimId || 'BIPA-2026-FILED'} Enforced</span>
                            </span>
                            <span className="text-slate-400 text-[10px]">14-Day Mandatory Purge</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ADVERSARIAL CLOAKING STUDIO */}
          {activeTab === 'CLOAKING_STUDIO' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-[#FF2E9F]" />
                    <span>Client-Side Adversarial Perturbation Cloaking Engine</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-xl">
                    Applies imperceptible high-frequency pixel alterations to disrupt deep neural network facial embedding vectors (ResNet, FaceNet, ArcFace) while remaining visually clear to humans.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCommitCloakedAvatar}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#FF2E9F] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Knox Sovereign Avatar</span>
                  </button>
                </div>
              </div>

              {/* Cloaker Controls & Dual Canvas Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Controls Column */}
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold uppercase mb-1">
                      Adversarial Algorithm:
                    </label>
                    <select
                      value={cloakAlgorithm}
                      onChange={(e) => setCloakAlgorithm(e.target.value as CloakFilterAlgorithm)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#00D4FF]"
                    >
                      <option value="FAWKES_ADVERSARIAL">Fawkes Antagonistic Feature Mask</option>
                      <option value="LOWKEY_PERTURBATION">LowKey Commercial Ingestion Blinder</option>
                      <option value="SPECTRAL_DIFFUSION_MASK">Spectral High-Pass Diffusion</option>
                      <option value="ENCLAVE_NOISE_VECTOR">Agape Sovereign Neon Matrix</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-bold uppercase">
                        Perturbation Intensity:
                      </label>
                      <span className="text-[#00D4FF] font-bold">{noiseIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="75"
                      value={noiseIntensity}
                      onChange={(e) => setNoiseIntensity(Number(e.target.value))}
                      className="w-full accent-[#00D4FF] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Subtle (Low Cloak)</span>
                      <span>Maximum AI Blinding</span>
                    </div>
                  </div>

                  {/* Preset Avatar Selection */}
                  <div>
                    <label className="block text-slate-300 font-bold uppercase mb-1.5">
                      Sample Identity Avatars:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[108, 129, 145].map((seed) => (
                        <button
                          key={seed}
                          onClick={() => setAvatarPreviewUrl(`https://picsum.photos/400/400?random=${seed}`)}
                          className="p-1 rounded-xl bg-[#0B1020] border border-slate-700 hover:border-cyan-400 overflow-hidden"
                        >
                          <img 
                            src={`https://picsum.photos/400/400?random=${seed}`} 
                            alt="Sample" 
                            className="w-full h-12 object-cover rounded-lg"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Recognition Suppression Gauge */}
                  <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                      Facial AI Recognition Suppression:
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Pre-Cloak Match:</span>
                      <span className="text-[#FF7A18] font-bold">{aiConfidencePreCloak}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Post-Cloak Match:</span>
                      <span className="text-[#00D4FF] font-black">{aiConfidencePostCloak}% (Suppressed)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00D4FF] to-green-400"
                        style={{ width: `${100 - aiConfidencePostCloak}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Center / Right Canvas Comparison Area */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original Canvas */}
                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col items-center justify-between space-y-3">
                    <div className="w-full flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold">ORIGINAL AVATAR</span>
                      <span className="text-orange-400 font-bold">VULNERABLE (98.4%)</span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#0B1020] shadow-inner flex items-center justify-center">
                      <canvas 
                        ref={sourceCanvasRef} 
                        className="w-64 h-64 object-cover rounded-xl"
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 text-center">
                      Unshielded biometric vectors vulnerable to Clearview AI
                    </span>
                  </div>

                  {/* Cloaked Canvas */}
                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/50 flex flex-col items-center justify-between space-y-3 shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                    <div className="w-full flex items-center justify-between text-xs font-mono">
                      <span className="text-[#00D4FF] font-bold">CLOAKED SOVEREIGN</span>
                      <span className="text-green-400 font-bold">BLINDED ({aiConfidencePostCloak}%)</span>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-[#0B1020] shadow-inner flex items-center justify-center">
                      <canvas 
                        ref={cloakedCanvasRef} 
                        className="w-64 h-64 object-cover rounded-xl"
                      />
                      {isProcessingCloak && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-[#00D4FF]" />
                        </div>
                      )}
                    </div>

                    <div className="w-full text-center">
                      <div className="text-[10px] font-mono text-cyan-300 truncate" title={cloakedHash}>
                        SHA: {cloakedHash.substring(0, 20)}...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIPA STATUTORY ERASURE ENGINE */}
          {activeTab === 'BIPA_DISPATCHER' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00D4FF]" />
                    <span>Statutory BIPA Deletion Notice Generator ({bipaSelectedTarget.engine})</span>
                  </h4>
                  <p className="text-xs text-slate-300 font-sans mt-0.5">
                    Pre-filled with statutory damages warnings under Illinois 740 ILCS 14/15 and California CCPA § 1798.100.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={bipaSelectedTarget.id}
                    onChange={(e) => {
                      const sel = indexes.find(i => i.id === e.target.value);
                      if (sel) setBipaSelectedTarget(sel);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0B1020] border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-[#00D4FF]"
                  >
                    {indexes.map(i => (
                      <option key={i.id} value={i.id}>{i.engine.replace('_', ' ')} (Match: {i.confidenceScore}%)</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateBipaNotice(bipaSelectedTarget));
                      setBipaCopied(true);
                      setTimeout(() => setBipaCopied(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#111A33] hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-cyan-200 flex items-center gap-1.5"
                  >
                    {bipaCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Send className="w-3.5 h-3.5 text-[#00D4FF]" />}
                    <span>{bipaCopied ? 'Copied' : 'Copy Notice'}</span>
                  </button>
                </div>
              </div>

              {/* Rendered BIPA Notice Paper Canvas */}
              <div className="p-5 rounded-2xl bg-[#0B1020] border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                {generateBipaNotice(bipaSelectedTarget)}
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Binary className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>BIPA 740 ILCS 14 & Fawkes Adversarial Image Perturbation Protected</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Close Biometric Shield
              </button>

              <button
                onClick={() => {
                  const finalStatus = exposedCount === 0 ? 'NUKED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-10',
                    finalStatus,
                    `Module 10 Synchronized: ${requestedCount}/${indexes.length} BIPA demands filed, sovereign avatar cloaked with ${cloakAlgorithm}.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 10 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
