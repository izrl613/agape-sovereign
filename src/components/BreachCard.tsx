import React, { useState } from 'react';
import { Shield, ShieldAlert, KeyRound, MapPin, Phone, FileText, ChevronDown, ChevronUp, Bot, ExternalLink, Loader2 } from 'lucide-react';
import { NEON, StatusBadge, DataTag, NeonButton, AutomationCard, ProgressTimeline } from './UI';
import { ScanFinding } from '../services/scanService';
import { motion, AnimatePresence } from 'framer-motion';

interface BreachCardProps {
  finding: ScanFinding;
  moduleId: string;
  onGenerateReport: (finding: ScanFinding) => void;
  onAutomatedFix: () => void;
  isGeneratingReport: boolean;
}

export const BreachCard: React.FC<BreachCardProps> = ({
  finding,
  moduleId,
  onGenerateReport,
  onAutomatedFix,
  isGeneratingReport
}) => {
  const [expanded, setExpanded] = useState(false);

  const isNuked = finding.status === 'NUKED';
  const isKnoxed = finding.status === 'KNOXED';
  const isMonitored = finding.status === 'MONITORED';

  const borderColor = isNuked ? NEON.magenta : isKnoxed ? NEON.blue : NEON.orange;
  const bgColor = isNuked ? `${NEON.magenta}08` : isKnoxed ? `${NEON.blue}08` : `${NEON.orange}08`;

  // Determine what DataTags to show based on module and status
  const showDataTags = isNuked && (moduleId === 'email' || moduleId === 'social' || moduleId === 'broker' || moduleId === 'deepweb');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 mb-4"
    >
      <div 
        className="rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg"
        style={{ 
          borderColor: `${borderColor}40`,
          backgroundColor: bgColor,
          boxShadow: isNuked ? `0 4px 20px ${NEON.magenta}15` : 'none'
        }}
      >
        {/* Header Area */}
        <div 
          className="p-5 flex items-start gap-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-shrink-0 mt-1">
            <StatusBadge type={finding.status} />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-sans font-bold text-base text-white tracking-wide">{finding.finding}</h4>
                <p className="font-mono text-xs text-slate-400 mt-1 line-clamp-2">{finding.details}</p>
              </div>
              <div className="flex-shrink-0 text-slate-500">
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {/* Firefox Monitor-style data tags (always visible if applicable) */}
            {showDataTags && (
              <div className="flex gap-2 flex-wrap mt-3">
                <DataTag icon={<KeyRound size={12} />} label="Passwords" />
                <DataTag icon={<MapPin size={12} />} label="IP Addresses" />
                <DataTag icon={<Phone size={12} />} label="Phone Numbers" />
              </div>
            )}
          </div>
        </div>

        {/* Expanded Detail Area */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-2 border-t border-white/5">
                <div className="font-mono text-sm text-slate-300 leading-relaxed mb-4 p-4 bg-black/40 rounded-lg border border-white/5">
                  {finding.details}
                </div>

                {/* Optery-style removal tracker (only for broker modules if nuked/monitored) */}
                {moduleId === 'broker' && (isNuked || isMonitored) && (
                  <div className="mb-6 p-4 bg-slate-900/50 rounded-lg">
                    <h5 className="text-xs font-sans font-bold text-slate-400 uppercase tracking-widest mb-4">Removal Protocol Status</h5>
                    <ProgressTimeline steps={[
                      { label: 'Identified', status: 'complete' },
                      { label: 'Opt-Out Sent', status: 'active' },
                      { label: 'Verifying', status: 'pending' },
                      { label: 'Removed', status: 'pending' }
                    ]} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-end items-center mt-4 pt-4 border-t border-white/5">
                  {(isNuked || isMonitored) && (
                    <NeonButton 
                      size="sm" 
                      color={NEON.blue}
                      onClick={(e) => { e.stopPropagation(); onGenerateReport(finding); }}
                      disabled={isGeneratingReport}
                    >
                      {isGeneratingReport ? <Loader2 size={14} className="animate-spin mr-2 inline" /> : <FileText size={14} className="mr-2 inline" />}
                      GENERATE REPORT
                    </NeonButton>
                  )}
                  {isNuked && (
                    <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-mono text-[#00D4FF] hover:text-white transition-colors flex items-center gap-1 px-3">
                      <ExternalLink size={12} />
                      VIEW SOURCE
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Jumbo-style Automation Card (Outside the breach card to pop more) */}
      {(isNuked || isMonitored) && (
        <AutomationCard 
          icon={<Bot size={18} />}
          title={moduleId === 'broker' ? "Data Broker Removal Required" : "Automated Remediation Available"}
          description={`Architect AI can automatically execute the ${isNuked ? 'NUKE' : 'REVIEW'} protocol to secure this vector.`}
          actionLabel={moduleId === 'broker' ? "AUTOMATE REMOVAL" : "AUTO-FIX VULNERABILITY"}
          status="idle"
          onAction={onAutomatedFix}
        />
      )}
    </motion.div>
  );
};
