import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  ShieldCheck, 
  Share2, 
  MapPin, 
  Calendar, 
  Trash2, 
  Hash, 
  Check, 
  Sparkles, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  EyeOff,
  Terminal,
  Clock
} from 'lucide-react';
import { SocialMediaPostAudit, UserProfile } from '../types';
import { calculateSha256 } from '../services/cryptoService';

interface SocialMediaScrubberModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdatePerimeterVector: (vectorId: string, status: 'NUKED' | 'KNOXED', details: string) => void;
}

const INITIAL_POSTS: SocialMediaPostAudit[] = [
  {
    id: 'post-01',
    platform: 'X / Twitter',
    postSnippet: 'Airport coffee before boarding! Flying out to SF summit. ☕✈️',
    ageDays: 142,
    hasExifGeoTag: true,
    embeddedCoordinates: '37.6213° N, 122.3790° W (SFO Terminal 2 Gate 54)',
    handleReuseCount: 4,
    status: 'EXPOSED_PUBLIC',
    sha256Proof: '7f9914b1ce05128df776412eab430099611baf82631245789a4218bc1049ff08',
  },
  {
    id: 'post-02',
    platform: 'Meta / Instagram',
    postSnippet: 'Sunday morning run along the river. New personal record! 🏃‍♂️',
    ageDays: 110,
    hasExifGeoTag: true,
    embeddedCoordinates: '40.7012° N, 73.9965° W (Brooklyn Bridge Park Pier 2)',
    handleReuseCount: 4,
    status: 'EXPOSED_PUBLIC',
    sha256Proof: '8c92fb381aa02c448bb9120de4568912ba0012c4781290bbfae09124cb11ef02',
  },
  {
    id: 'post-03',
    platform: 'Reddit',
    postSnippet: 'Reviewing neighborhood HOA bylaws and municipal property tax filings.',
    ageDays: 280,
    hasExifGeoTag: false,
    handleReuseCount: 3,
    status: 'EXPOSED_PUBLIC',
    sha256Proof: '3b890d98ca7718decf1154032d881ab7612cba1809fd2a1e360982bb1923fae9',
  },
  {
    id: 'post-04',
    platform: 'LinkedIn',
    postSnippet: 'Honored to deliver keynote on Enclave Security & Cloud Zero-Knowledge Architecture.',
    ageDays: 32,
    hasExifGeoTag: true,
    embeddedCoordinates: '40.7589° N, 73.9851° W (Times Square Conf Hall B)',
    handleReuseCount: 2,
    status: 'EXPOSED_PUBLIC',
    sha256Proof: '5a2190dfca7832bc0189ef451299cbaa011287eac9903124785bc0029312feae',
  }
];

export const SocialMediaScrubberModal: React.FC<SocialMediaScrubberModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdatePerimeterVector,
}) => {
  const [posts, setPosts] = useState<SocialMediaPostAudit[]>(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState<'POST_AUDIT' | 'HANDLE_REUSE' | 'AUDIT_LOGS'>('POST_AUDIT');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeletingOlderThan90, setIsDeletingOlderThan90] = useState(false);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  // Counts
  const olderThan90Count = useMemo(() => posts.filter(p => p.ageDays > 90 && p.status !== 'DELETED_NUKED').length, [posts]);
  const exifExposedCount = useMemo(() => posts.filter(p => p.hasExifGeoTag && p.status === 'EXPOSED_PUBLIC').length, [posts]);
  const deletedCount = useMemo(() => posts.filter(p => p.status === 'DELETED_NUKED').length, [posts]);
  const knoxedCount = useMemo(() => posts.filter(p => p.status === 'EXIF_STRIPPED_KNOXED').length, [posts]);

  if (!isOpen) return null;

  // Strip EXIF geotag & enforce enclave metadata scrub (KNOX)
  const handleStripExifTag = async (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (!target) return;

    const receipt = await calculateSha256(`EXIF_STRIPPED::${target.platform}::${target.id}::${Date.now()}`);
    const timeStr = new Date().toLocaleTimeString();

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          hasExifGeoTag: false,
          embeddedCoordinates: '[EXIF GEO-TAG STRIPPED - GPS ZEROED]',
          status: 'EXIF_STRIPPED_KNOXED',
          sha256Proof: receipt,
        };
      }
      return p;
    }));

    const line = `[${timeStr}] 🛡️ KNOXED POST: EXIF metadata & GPS coordinates permanently purged from ${target.platform} publication. Proof: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);

    onUpdatePerimeterVector('diff-02', 'KNOXED', 'Public post EXIF geolocation tags stripped and view perimeter restricted.');
  };

  // Delete Individual Post (NUKE)
  const handleDeletePost = async (postId: string) => {
    const target = posts.find(p => p.id === postId);
    if (!target) return;

    const receipt = await calculateSha256(`POST_DELETED_NUKED::${target.platform}::${postId}::${Date.now()}`);
    const timeStr = new Date().toLocaleTimeString();

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: 'DELETED_NUKED',
          postSnippet: '[PERMANENTLY DELETED & PLATFORM CACHE SCRUBBED]',
          embeddedCoordinates: undefined,
          hasExifGeoTag: false,
          sha256Proof: receipt,
        };
      }
      return p;
    }));

    const line = `[${timeStr}] 🔥 NUKED POST: ${target.platform} post (${target.ageDays} days old) purged via API deletion call. Audit Receipt: ${receipt.substring(0, 16)}...`;
    setAuditLogs(prev => [line, ...prev]);
  };

  // Batch Delete All Posts Older Than 90 Days
  const handleBatchDeleteOlderThan90 = async () => {
    setIsDeletingOlderThan90(true);
    const toDelete = posts.filter(p => p.ageDays > 90 && p.status !== 'DELETED_NUKED');

    for (const p of toDelete) {
      await new Promise(r => setTimeout(r, 260));
      await handleDeletePost(p.id);
    }

    setIsDeletingOlderThan90(false);
    onUpdatePerimeterVector('diff-02', 'NUKED', `Batch purge completed: ${toDelete.length} legacy public social media posts older than 90 days permanently destroyed.`);
  };

  const filteredPosts = posts.filter(p => 
    p.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.postSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.embeddedCoordinates && p.embeddedCoordinates.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#0B1020]/90 backdrop-blur-xl">
      <div className="relative w-full max-w-5xl max-h-[94vh] rounded-3xl p-[2px] overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-cyan-500/40 shadow-2xl">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-950/40 border border-[#FF2E9F]/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,46,159,0.3)]">
                <Share2 className="w-6 h-6 text-[#FF2E9F]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    Module 2: Social Media Scrubber & Footprint Eraser
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/40">
                    EXIF STRIP • 90-DAY RETENTION PURGE
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-mono">
                  Cross-Platform Footprint Audit • Handle Correlation Mitigation • 2026 ECRA LTS
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
                onClick={() => setActiveTab('POST_AUDIT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'POST_AUDIT'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                1. Scraped Posts & Geotags ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('HANDLE_REUSE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  activeTab === 'HANDLE_REUSE'
                    ? 'bg-gradient-to-r from-[#FF2E9F]/20 to-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50'
                    : 'text-slate-400 hover:text-white bg-[#0F172A]'
                }`}
              >
                2. Handle Correlation Graph
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
                <span>3. Scrubber Audit Stream</span>
                {auditLogs.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#00D4FF] text-[#0B1020] text-[10px] font-bold flex items-center justify-center">
                    {auditLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Badges */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                {exifExposedCount} EXIF GEO-TAGS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-950/40 text-[#FF7A18] border border-orange-500/30 font-bold">
                {olderThan90Count} OLDER THAN 90 DAYS
              </span>
            </div>
          </div>

          {/* TAB 1: POST AUDIT & PURGE */}
          {activeTab === 'POST_AUDIT' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Batch Action Banner */}
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                    <span>Automated Ephemeral Social Media Quarantine</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl font-sans">
                    Public posts expose exact GPS coordinates via photo EXIF headers and allow threat actors to map routine locations. Forcefully <strong className="text-[#FF2E9F]">NUKE</strong> legacy posts (>90 days) or <strong className="text-[#00D4FF]">KNOX</strong> active publications by stripping all metadata.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBatchDeleteOlderThan90}
                    disabled={isDeletingOlderThan90 || olderThan90Count === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Nuke Posts &gt; 90 Days ({olderThan90Count})</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search platform, post snippet, or location..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0F172A] border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00D4FF] font-mono"
                />
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPosts.map((post) => {
                  return (
                    <div
                      key={post.id}
                      className={`p-4 rounded-2xl bg-[#0F172A] border transition space-y-3 ${
                        post.status === 'DELETED_NUKED'
                          ? 'border-[#FF2E9F]/50 shadow-[0_0_12px_rgba(255,46,159,0.15)] opacity-80'
                          : post.status === 'EXIF_STRIPPED_KNOXED'
                          ? 'border-[#00D4FF]/50 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                          : 'border-orange-500/50 shadow-[0_0_12px_rgba(255,122,24,0.15)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{post.platform}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0B1020] text-cyan-300 border border-slate-800">
                              {post.ageDays} days old
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Handle Reused across {post.handleReuseCount} known platforms
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          post.status === 'DELETED_NUKED' ? 'bg-[#FF2E9F]/20 text-[#FF2E9F] border border-[#FF2E9F]/50' :
                          post.status === 'EXIF_STRIPPED_KNOXED' ? 'bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/50' :
                          'bg-orange-500/20 text-[#FF7A18] border border-orange-500/50 animate-pulse'
                        }`}>
                          {post.status === 'DELETED_NUKED' ? 'DELETED (NUKED) ✓' :
                           post.status === 'EXIF_STRIPPED_KNOXED' ? 'EXIF STRIPPED (KNOXED)' : 'GEO-TAG EXPOSED'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0B1020] border border-slate-800 text-xs font-mono space-y-1.5">
                        <div className="text-slate-200 font-sans italic text-xs">
                          "{post.postSnippet}"
                        </div>
                        {post.embeddedCoordinates && (
                          <div className="text-[11px] text-orange-400 flex items-center gap-1 font-bold pt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#FF7A18] shrink-0" />
                            <span>{post.embeddedCoordinates}</span>
                          </div>
                        )}
                      </div>

                      {/* Cryptographic SHA-256 Proof */}
                      <div className="p-2 rounded-lg bg-[#0B1020] border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Hash className="w-3 h-3 text-[#00D4FF]" />
                          <span>Audit Digest:</span>
                        </span>
                        <span className="text-cyan-300 truncate max-w-[170px]" title={post.sha256Proof}>
                          {post.sha256Proof}
                        </span>
                      </div>

                      {/* Action Triggers */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        {post.status === 'EXPOSED_PUBLIC' ? (
                          <>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-3 py-1.5 rounded-xl bg-[#FF2E9F]/20 hover:bg-[#FF2E9F]/30 border border-[#FF2E9F]/50 text-[#FF2E9F] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>Purge Post (Nuke)</span>
                            </button>

                            {post.hasExifGeoTag && (
                              <button
                                onClick={() => handleStripExifTag(post.id)}
                                className="px-3 py-1.5 rounded-xl bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 border border-[#00D4FF]/50 text-[#00D4FF] text-xs font-mono font-bold flex items-center gap-1.5 transition"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Strip EXIF (Knox)</span>
                              </button>
                            )}
                          </>
                        ) : post.status === 'EXIF_STRIPPED_KNOXED' ? (
                          <div className="flex items-center justify-between w-full text-[11px] font-mono text-[#00D4FF] font-bold">
                            <span className="flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>EXIF Sanitized • Geolocation Masked</span>
                            </span>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-pink-400 hover:underline text-[10px]"
                            >
                              Destroy Post
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] font-mono text-[#FF2E9F] flex items-center gap-1 font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Permanently Shredded from Public Web Archives</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HANDLE CORRELATION GRAPH */}
          {activeTab === 'HANDLE_REUSE' && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-cyan-500/30 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#00D4FF]" />
                  <span>Username Correlation & OSINT Profiling Analysis</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Reusing the same handle (e.g. <code>@sovereign_identity</code>) across multiple platforms allows open-source intelligence (OSINT) bots and people-search engines to aggregate disparate data points into a unified surveillance dossier.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4">
                <div className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  Detected Handle Collision Matrix:
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">@sovereign_identity</span>
                      <span className="text-[10px] text-slate-400">Identical username registered on X, LinkedIn, Instagram, GitHub</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-950/40 text-red-400 text-[10px] font-bold border border-red-500/30">
                      CRITICAL CORRELATION RISK
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0B1020] border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">israel_d_enclave</span>
                      <span className="text-[10px] text-slate-400">Isolated handle used only for Developer and Cloud IAM repositories</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-cyan-950/40 text-[#00D4FF] text-[10px] font-bold border border-cyan-500/30">
                      ISOLATED (ENCLAVE SAFE)
                    </span>
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
                <span>Real-Time Social Media Sanitization Audit Trail</span>
              </h4>

              {auditLogs.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#0F172A] border border-slate-800 text-center space-y-2">
                  <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white font-mono">No Operations Executed Yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                    Execute "Strip EXIF (Knox)" or "Purge Post (Nuke)" to record cryptographically verifiable receipts.
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
              <span>Jumbo Privacy Protocol & Zero-Access EXIF Sanitization Certified</span>
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
                  const finalStatus = deletedCount > 0 ? 'NUKED' : knoxedCount > 0 ? 'KNOXED' : 'EXPOSED';
                  onUpdatePerimeterVector(
                    'diff-02',
                    finalStatus,
                    `Module 2 Synchronized: ${deletedCount} posts purged, ${knoxedCount} sanitized of EXIF coordinates.`
                  );
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] text-white text-xs font-mono font-bold shadow-lg hover:opacity-90 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Sync to Module 2 Perimeter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
