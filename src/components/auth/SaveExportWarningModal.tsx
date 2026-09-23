import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, HardDrive, Cloud, Shield, AlertTriangle } from 'lucide-react';

interface SaveExportWarningModalProps {
  isOpen: boolean;
  authType: 'google' | 'passkey' | 'anonymous' | null;
  storageTarget: 'local' | 'drive' | 'download';
  onConfirm: (target: 'local' | 'drive' | 'download') => void;
  onCancel: () => void;
}

const C = {
  blue: '#00D4FF',
  magenta: '#FF2E9F',
  orange: '#FF7A18',
  green: '#00FF87',
  muted: 'rgba(180,190,220,0.45)',
  surface: 'rgba(255,255,255,0.025)',
} as const;

export const SaveExportWarningModal: React.FC<SaveExportWarningModalProps> = ({
  isOpen,
  authType,
  storageTarget,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isPasskeyUser = authType === 'passkey';
  const isGoogleUser = authType === 'google';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(6,12,26,0.96)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 20,
            padding: '40px',
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 0 60px rgba(0,212,255,0.15)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255,122,24,0.1)',
                border: '2px solid rgba(255,122,24,0.3)',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={28} color={C.orange} />
            </motion.div>
            
            <h2 style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: '0.05em',
            }}>
              Report Export Warning
            </h2>
            
            <p style={{
              color: C.muted,
              fontSize: 13,
              lineHeight: 1.6,
            }}>
              Before exporting your Digital Privacy Credential (DPC), please review where this file will be stored.
            </p>
          </div>

          {/* Storage Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {/* Local Vault Option */}
            <motion.button
              whileHover={{ scale: 1.02, borderColor: `rgba(0,255,135,0.4)` }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm('local')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px',
                background: isPasskeyUser ? 'rgba(0,255,135,0.08)' : 'rgba(255,255,255,0.03)',
                border: isPasskeyUser ? '2px solid rgba(0,255,135,0.3)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(0,255,135,0.15)',
                flexShrink: 0,
              }}>
                <HardDrive size={22} color={C.green} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Local Encrypted Vault
                </div>
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>
                  Stored in IndexedDB with AES-256-GCM encryption. 26-month rolling retention.
                </div>
              </div>

              {isPasskeyUser && (
                <div style={{
                  padding: '4px 10px',
                  background: 'rgba(0,255,135,0.2)',
                  borderRadius: 100,
                  fontSize: 10,
                  color: C.green,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                }}>
                  RECOMMENDED
                </div>
              )}
            </motion.button>

            {/* Google Drive Option */}
            {isGoogleUser && (
              <motion.button
                whileHover={{ scale: 1.02, borderColor: `rgba(66,133,244,0.4)` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConfirm('drive')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '20px',
                  background: 'rgba(66,133,244,0.08)',
                  border: '1px solid rgba(66,133,244,0.3)',
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'rgba(66,133,244,0.15)',
                  flexShrink: 0,
                }}>
                  <Cloud size={22} color="#4285F4" />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    Google Drive
                  </div>
                  <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>
                    Saved to your Google Drive in "Agape Sovereign/DPC Reports" folder.
                  </div>
                </div>
              </motion.button>
            )}

            {/* Direct Download Option */}
            <motion.button
              whileHover={{ scale: 1.02, borderColor: `rgba(0,212,255,0.4)` }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm('download')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px',
                background: 'rgba(0,212,255,0.04)',
                border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: 12,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(0,212,255,0.15)',
                flexShrink: 0,
              }}>
                <Download size={22} color={C.blue} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Direct Download
                </div>
                <div style={{ color: C.muted, fontSize: 11, lineHeight: 1.5 }}>
                  Download file directly to your device. No automatic backup.
                </div>
              </div>
            </motion.button>
          </div>

          {/* Privacy Notice */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '14px',
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 10,
            marginBottom: 20,
          }}>
            <Shield size={16} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
              <strong style={{ color: C.blue }}>Zero-Knowledge Privacy:</strong> Your report is encrypted client-side before storage. 
              No server-side decryption is possible. Your data remains sovereign.
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
