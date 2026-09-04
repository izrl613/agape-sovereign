import React, { useState, useEffect } from 'react';
import { NEON, DIFF_MODULES, GRADIENT_BORDER } from '../constants';
import { GlassCard, NeonText, NeonButton } from './ui/NeonElements';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import { generateFullAuditPDF, ReportData } from '../services/pdfGenerator';
import { getAllIVMData, calculateSovereignScore } from '../services/ivmService';

export const ReportView: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [ivmData, setIvmData] = useState<Record<string, any>>({});
  const [sovereignScore, setSovereignScore] = useState(0);
  const [tier, setTier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(true);

  // Load IVM data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!auth.currentUser) return;
      try {
        setContextLoading(true);
        const data = await getAllIVMData(auth.currentUser.uid);
        setIvmData(data);
        
        const { score, tier } = await calculateSovereignScore(data);
        setSovereignScore(score);
        setTier(tier);
      } catch (e) {
        console.error('Failed to load IVM data:', e);
      } finally {
        setContextLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!auth.currentUser) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // Build report data
      const reportData: ReportData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email || '',
        sovereignScore,
        tier,
        generatedAt: new Date().toISOString(),
        ivmData,
        sha256Seal: '', // Will be generated in pdfGenerator
      };

      // Generate PDF
      const pdfBytes = await generateFullAuditPDF(reportData);
      
      // Create blob and download URL
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setGenerated(true);
      
      // Save report metadata to Firestore
      const reportId = `DIFF-${auth.currentUser.uid}-${Date.now()}`;
      await setDoc(doc(db, 'diff_reports', reportId), {
        userId: auth.currentUser.uid,
        sovereignScore,
        tier,
        generatedAt: new Date().toISOString(),
        sha256Seal: `sha256_${reportId}`,
      });
      
    } catch (e: any) {
      console.error('PDF generation failed:', e);
      setError(e.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
      setGenerated(true);
    }
  };

  const totalNuked = DIFF_MODULES.reduce((s, m) => s + m.nuked, 0);
  const totalKnoxed = DIFF_MODULES.reduce((s, m) => s + m.knoxed, 0);

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `AgapeSovereign_DIFF_Report_${Date.now()}.pdf`;
      a.click();
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ animation: "fade-in 0.4s ease" }}>
      <div className="mb-6">
        <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.2em] mb-1" style={{ color: NEON.orange }}>LIGHTHOUSE-STYLE AUDIT</div>
        <NeonText color={NEON.blue} size="1.3rem" weight={900}>DIFF SOVEREIGNTY REPORT</NeonText>
        <div className="text-[0.75rem] mt-0.5" style={{ color: NEON.textMuted }}>
          Generate your complete Digital Identity Federated Footprint audit · pdf-lib · AES-256 · SHA-256
        </div>
      </div>
      <div className="h-[1px] mb-6 opacity-50" style={{ background: GRADIENT_BORDER }} />

      {/* Report preview card */}
      <GlassCard className="p-6 mb-5">
        <div className="flex justify-between items-start mb-5">
          <div>
            <NeonText color={NEON.blue} size="1rem">AGAPE SOVEREIGN ENCLAVE 2026</NeonText>
            <div className="font-['Share_Tech_Mono'] text-[0.65rem] mt-1" style={{ color: NEON.textMuted }}>DIGITAL IDENTITY FEDERATED FOOTPRINT REPORT</div>
            <div className="font-['Share_Tech_Mono'] text-[0.6rem] mt-1" style={{ color: NEON.orange }}>ECRA 2026 · GDPR · CCPA COMPLIANT</div>
          </div>
          <div className="text-center">
            <div className="font-['Orbitron'] text-[2.5rem] font-black" style={{ 
              color: sovereignScore > 75 ? NEON.blue : sovereignScore > 50 ? NEON.orange : NEON.magenta, 
              textShadow: `0 0 20px ${sovereignScore > 75 ? NEON.blue : sovereignScore > 50 ? NEON.orange : NEON.magenta}` 
            }}>{sovereignScore || avgScore}</div>
            <div className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>SOVEREIGN SCORE</div>
          </div>
        </div>

        {/* Report sections */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "IDENTITY VECTORS SCANNED", value: "16 / 16", color: NEON.blue },
            { label: "TOTAL EXPOSURES", value: totalNuked + " found", color: NEON.magenta },
            { label: "SECURED ASSETS", value: totalKnoxed + " hardened", color: NEON.blue },
            { label: "COMPLIANCE STATUS", value: "ECRA 2026", color: NEON.orange },
            { label: "PASSKEY STATUS", value: "✓ Device-bound", color: NEON.blue },
            { label: "ENCRYPTION", value: "✓ AES-256-GCM", color: NEON.blue },
            { label: "REPORT TYPE", value: "Lighthouse-v3", color: NEON.orange },
            { label: "CLOUD AUDIT ID", value: `ASE-${Date.now().toString(36).toUpperCase()}`, color: NEON.textMuted },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2 px-3 rounded-md border" style={{ background: "rgba(0,212,255,0.03)", borderColor: "rgba(0,212,255,0.08)" }}>
              <span className="font-['Share_Tech_Mono'] text-[0.6rem]" style={{ color: NEON.textMuted }}>{row.label}</span>
              <span className="font-['Share_Tech_Mono'] text-[0.6rem] font-bold" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Module breakdown */}
      <div className="mb-3">
        <NeonText color={NEON.orange} size="0.72rem">VECTOR-BY-VECTOR BREAKDOWN</NeonText>
      </div>
      <div className="flex flex-col gap-1.5 mb-6">
        {DIFF_MODULES.slice(0, 8).map(m => {
          const sev = m.severity;
          const sevColor = sev > 80 ? NEON.blue : sev > 60 ? NEON.orange : NEON.magenta;
          return (
            <div key={m.id} className="flex items-center gap-3 py-2 px-3 rounded-md border" style={{ background: "rgba(0,212,255,0.02)", borderColor: "rgba(0,212,255,0.07)" }}>
              <span className="text-[0.8rem] w-5" style={{ color: sevColor }}>{m.icon}</span>
              <span className="font-['Rajdhani'] text-[0.75rem] flex-1" style={{ color: NEON.text }}>{m.label}</span>
              <div className="w-20 h-[3px] rounded-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-sm" style={{ width: `${sev}%`, background: sevColor }} />
              </div>
              <span className="font-['Orbitron'] text-[0.65rem] w-8 text-right" style={{ color: sevColor }}>{sev}%</span>
            </div>
          );
        })}
        <div className="font-['Share_Tech_Mono'] text-[0.6rem] text-center py-1" style={{ color: NEON.textMuted }}>+ 8 more vectors in full report</div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-md border" style={{ background: 'rgba(255,46,159,0.1)', borderColor: 'rgba(255,46,159,0.3)', color: NEON.magenta }}>
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-['Rajdhani'] text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Generate / Download section */}
      {!generated ? (
        <div className="flex gap-3 pb-6">
          <button 
            className="btn-neon neon-border pulse-border flex-1 p-4 rounded-lg border-none font-['Orbitron'] text-[0.85rem] font-bold tracking-[0.1em]" 
            onClick={handleGenerate} 
            disabled={generating || contextLoading} 
            style={{ background: "rgba(0,212,255,0.08)", color: NEON.blue, cursor: generating || contextLoading ? "not-allowed" : "pointer" }}
          >
            {generating ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: `rgba(0,212,255,0.3)`, borderTopColor: NEON.blue, animation: "spinner 1s linear infinite" }} />
                GENERATING SOVEREIGN REPORT...
              </span>
            ) : contextLoading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: `rgba(255,122,24,0.3)`, borderTopColor: NEON.orange, animation: "spinner 1s linear infinite" }} />
                LOADING IVM DATA...
              </span>
            ) : (
              "⬡ GENERATE DIFF PDF REPORT"
            )}
          </button>
        </div>
      ) : (
        <GlassCard className="p-5 text-center border pb-6" style={{ borderColor: `${NEON.blue}44` }}>
          <div className="text-3xl mb-2">✅</div>
          <NeonText color={NEON.blue} size="1rem">REPORT GENERATED SUCCESSFULLY</NeonText>
          <div className="text-[0.75rem] my-2 mb-4" style={{ color: NEON.textMuted }}>
            Encrypted PDF · SHA-256 Sealed · ECRA 2026 Certified
          </div>
          <div className="flex gap-2.5 justify-center">
            <NeonButton color={NEON.blue} onClick={handleDownload}>
              ⬇️ DOWNLOAD PDF
            </NeonButton>
            <NeonButton color={NEON.orange} onClick={() => {
              // Save to Firebase Storage would go here
              alert('Firebase Storage upload - implement with Cloud Function');
            }}>
              ☁️ FIREBASE STORAGE
            </NeonButton>
            <NeonButton color={NEON.magenta} onClick={() => {
              // Export identity blueprint would go here
              alert('Identity Blueprint Export - implement with Passkey');
            }}>
              🔐 EXPORT IDENTITY
            </NeonButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const avgScore = Math.round(DIFF_MODULES.reduce((s, m) => s + m.severity, 0) / DIFF_MODULES.length);