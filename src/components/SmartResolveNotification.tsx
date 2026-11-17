import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, ShieldAlert, X, ChevronRight, ArrowRight, ShieldCheck } from 'lucide-react';
import { NEON } from './UI';
import { SmartResolveSummary } from '../services/smartResolveService';

interface Props {
  summary: SmartResolveSummary | null;
  onDismiss: () => void;
  onViewDetails?: (summary: SmartResolveSummary) => void;
}

export const SmartResolveNotification: React.FC<Props> = ({ summary, onDismiss, onViewDetails }) => {
  const [expanded, setExpanded] = useState(false);

  if (!summary) return null;

  const isSuccess = summary.status === 'COMPLETED';
  const isNoAction = summary.status === 'NO_ACTION_NEEDED';
  const isFailed = summary.status === 'FAILED';

  const accentColor = isSuccess ? NEON.blue : isNoAction ? NEON.orange : NEON.magenta;
  const glow = `${accentColor}25`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        style={{
          marginBottom: 20,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${accentColor}18 0%, rgba(11, 16, 32, 0.95) 100%)`,
          border: `1.5px solid ${accentColor}44`,
          boxShadow: `0 0 25px ${glow}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }} />

        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 12px ${accentColor}33`,
            }}>
              {isSuccess ? (
                <Sparkles size={20} color={accentColor} />
              ) : isNoAction ? (
                <ShieldCheck size={20} color={accentColor} />
              ) : (
                <ShieldAlert size={20} color={accentColor} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: accentColor,
                  letterSpacing: '0.1em',
                }}>
                  SMART-RESOLVE DAILY SCAN SUMMARY
                </span>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.6rem',
                  color: NEON.textMuted,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  {summary.runTrigger === 'AUTOMATIC_DAILY' ? 'AUTO-SCHEDULED' : 'MANUAL DISPATCH'}
                </span>
              </div>

              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '0.85rem',
                color: '#F8FAFC',
                marginTop: 3,
                lineHeight: 1.4,
              }}>
                {isSuccess && (
                  <>
                    Automatically evaluated <strong style={{ color: NEON.blue }}>{summary.totalScanned} vectors</strong> and applied Quick Fixes to <strong style={{ color: NEON.blue }}>{summary.resolvedCount} low-risk findings</strong>, elevating posture to KNOXED.
                  </>
                )}
                {isNoAction && (
                  <>
                    Daily scan verified <strong style={{ color: NEON.orange }}>{summary.totalScanned} vectors</strong>. All findings are already KNOXED or require manual elevation. Posture stable.
                  </>
                )}
                {isFailed && (
                  <>
                    Smart-Resolve job encountered an interruption: {summary.error}. Non-destructive rollback complete.
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {summary.resolvedFindings.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
                  fontFamily: "'Orbitron', monospace",
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  padding: '8px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {expanded ? 'COLLAPSE' : 'RECEIPTS'}
                <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </motion.button>
            )}

            <button
              onClick={onDismiss}
              aria-label="Dismiss Notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: NEON.textMuted,
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Expandable Receipts List */}
        <AnimatePresence>
          {expanded && summary.resolvedFindings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                borderTop: `1px solid ${accentColor}22`,
                background: 'rgba(6, 12, 26, 0.9)',
                padding: '14px 20px',
              }}
            >
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.65rem',
                color: NEON.textMuted,
                marginBottom: 10,
                letterSpacing: '0.08em',
              }}>
                SEALED VERIFICATION RECEIPTS (SHA-256 NON-REPUDIATION):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {summary.resolvedFindings.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      gap: 12,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: "'Orbitron', monospace",
                          fontSize: '0.6rem',
                          color: NEON.blue,
                          fontWeight: 700,
                        }}>
                          {item.module.toUpperCase()}
                        </span>
                        <span style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontSize: '0.8rem',
                          color: '#F8FAFC',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {item.finding}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: '0.58rem',
                        color: NEON.textMuted,
                        marginTop: 2,
                      }}>
                        ACTION: {item.remediationAction} · PREVIOUS: {item.previousStatus}
                      </div>
                    </div>

                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: '0.58rem',
                      color: NEON.orange,
                      background: `${NEON.orange}12`,
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: `1px solid ${NEON.orange}33`,
                      whiteSpace: 'nowrap',
                    }}>
                      SHA: {item.receiptHash.substring(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
