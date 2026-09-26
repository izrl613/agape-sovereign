import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CloudUpload, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { useScan } from '../ScanContext';
import { compileIdentityAuditPdf, IdentityAuditDocument } from '../services/identityAuditService';
import { RETENTION_MONTHS } from '../services/driveExportService';
import { federatedGoogleEmail, isFederatedGoogleUser } from '../services/driveExportService';
import { isValidSHA256 } from '../services/sovereignHashService';
import { NEON } from './UI';

/**
 * IdentityAuditExport
 * Generates the 26-month Identity Audit PDF from real findings and offers two
 * destinations: local download, or save into the user's federated Google
 * Account (available only to Google sign-in, which carries the drive.file
 * scope). The SHA-256 digest shown is computed from the exact bytes uploaded.
 */

type Phase = 'idle' | 'compiling' | 'ready' | 'uploading' | 'saved' | 'error';

export const IdentityAuditExport: React.FC = () => {
  const { user, sovereignHash, sovereignScore, exportAuditToDrive } = useAuth();
  const { findings } = useScan();
  const [phase, setPhase] = useState<Phase>('idle');
  const [doc, setDoc] = useState<IdentityAuditDocument | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const googleFederated = isFederatedGoogleUser(user);
  const federatedEmail = federatedGoogleEmail(user);
  const hashValid = !!sovereignHash && isValidSHA256(sovereignHash);

  const classification = useMemo(() => {
    const verified = findings.filter(f => f.verification?.thirdPartyVerified === true).length;
    if (findings.length === 0) return 'UNMEASURED';
    return verified > 0 ? 'VERIFIED' : 'UNVERIFIED';
  }, [findings]);

  const handleCompile = async () => {
    if (!user) {
      setError('Sign in to generate your audit.');
      setPhase('error');
      return;
    }
    if (!hashValid || !sovereignHash) {
      setError('A valid SHA-256 session identity is required before an audit can be sealed.');
      setPhase('error');
      return;
    }
    if (findings.length === 0) {
      setError('No vectors have been executed yet. Run the DIFF scan first — the audit only contains real results.');
      setPhase('error');
      return;
    }

    setPhase('compiling');
    setError(null);
    setDriveLink(null);
    try {
      const compiled = await compileIdentityAuditPdf({
        identitySha256: sovereignHash,
        findings,
        sovereignScore,
        classification,
        authFactors: {
          googleFederated,
          passkeyBound: (user.providerData || []).length > 1,
          federatedEmail,
        },
      });
      setDoc(compiled);
      setPhase('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compile the audit PDF.');
      setPhase('error');
    }
  };

  const handleDownload = () => {
    if (!doc) return;
    const url = URL.createObjectURL(doc.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success('AUDIT PDF DOWNLOADED', {
      description: `SHA-256 ${doc.sha256Digest.slice(0, 16)}…`,
    });
  };

  const handleSaveToGoogle = async () => {
    if (!doc) return;
    setPhase('uploading');
    setError(null);
    const result = await exportAuditToDrive({
      pdfBlob: doc.blob,
      fileName: doc.fileName,
      sha256Digest: doc.sha256Digest,
      sovereignScore,
    });
    if (result.success) {
      setDriveLink(result.webViewLink || null);
      setPhase('saved');
    } else {
      setError(result.error || 'Google Drive export failed.');
      setPhase('error');
    }
  };

  const btn = (color: string, disabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 16px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
    border: `1px solid ${color}55`, background: `${color}14`, color,
    fontFamily: "'Orbitron', monospace", fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em',
    opacity: disabled ? 0.45 : 1, flex: 1, minWidth: 200,
  });

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${googleFederated ? 'rgba(66,133,244,0.35)' : 'rgba(255,255,255,0.08)'}`,
      background: googleFederated
        ? 'linear-gradient(135deg, rgba(66,133,244,0.08) 0%, rgba(0,212,255,0.03) 100%)'
        : 'rgba(255,255,255,0.02)',
      padding: 18,
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'rgba(0,212,255,0.1)', border: `1px solid ${NEON.blue}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <FileText size={16} color={NEON.blue} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11.5, fontWeight: 800, letterSpacing: '0.12em', color: '#fff' }}>
            IDENTITY AUDIT PDF · {RETENTION_MONTHS}-MONTH RETENTION
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.08em', color: NEON.textMuted, marginTop: 3 }}>
            {googleFederated
              ? `SAVE TO YOUR FEDERATED GOOGLE ACCOUNT${federatedEmail ? ` · ${federatedEmail}` : ''}`
              : 'GOOGLE SIGN-IN REQUIRED TO SAVE TO A FEDERATED GOOGLE ACCOUNT'}
          </div>
        </div>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
          padding: '4px 10px', borderRadius: 100,
          border: `1px solid ${classification === 'VERIFIED' ? '#00FF8755' : classification === 'UNVERIFIED' ? '#FF7A1855' : 'rgba(255,255,255,0.1)'}`,
          color: classification === 'VERIFIED' ? '#00FF87' : classification === 'UNVERIFIED' ? NEON.orange : NEON.textMuted,
        }}>
          {findings.length} VECTOR{findings.length === 1 ? '' : 'S'} ON RECORD
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '10px 12px', borderRadius: 8, marginBottom: 12,
          background: 'rgba(255,46,159,0.07)', border: `1px solid ${NEON.magenta}33`,
          color: '#FFB3D9', fontSize: 11, lineHeight: 1.5,
        }}>
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} color={NEON.magenta} />
          {error}
        </div>
      )}

      {doc && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{
            padding: '12px 14px', borderRadius: 10, marginBottom: 14,
            background: 'rgba(0,0,0,0.35)', border: `1px solid ${NEON.blue}22`,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 10 }}>
            <Stat label="VECTORS EXECUTED" value={`${doc.counts.scanned}`} />
            <Stat label="THIRD-PARTY VERIFIED" value={`${doc.counts.thirdPartyVerified}`} />
            <Stat label="NOT SCANNED" value={`${doc.counts.unscanned}`} />
            <Stat label="EXPIRES" value={doc.expiresAt.toISOString().slice(0, 10)} />
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8.5, color: `${NEON.blue}99`, letterSpacing: '0.05em', marginBottom: 3 }}>
            SHA-256 OF THESE EXACT PDF BYTES
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9.5, color: '#E8FBFF', wordBreak: 'break-all', lineHeight: 1.6, textShadow: `0 0 8px ${NEON.blue}44` }}>
            {(doc.sha256Digest.match(/.{1,8}/g) || []).join(' ')}
          </div>
          {driveLink && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${NEON.blue}22` }}>
              <CheckCircle2 size={13} color="#00FF87" />
              <a
                href={driveLink} target="_blank" rel="noreferrer noopener"
                style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9.5, color: '#8AB4F8', textDecoration: 'none' }}
              >
                OPEN IN GOOGLE DRIVE ↗
              </a>
            </div>
          )}
        </motion.div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <motion.button
          whileHover={phase === 'compiling' ? {} : { scale: 1.01 }}
          whileTap={phase === 'compiling' ? {} : { scale: 0.99 }}
          onClick={handleCompile}
          disabled={phase === 'compiling'}
          style={btn(NEON.blue, phase === 'compiling')}
        >
          <FileText size={13} />
          {phase === 'compiling' ? 'COMPILING AUDIT…' : 'COMPILE AUDIT PDF'}
        </motion.button>

        <motion.button
          whileHover={!doc ? {} : { scale: 1.01 }}
          whileTap={!doc ? {} : { scale: 0.99 }}
          onClick={handleDownload}
          disabled={!doc}
          style={btn(NEON.orange, !doc)}
        >
          <Download size={13} />
          DOWNLOAD
        </motion.button>

        <motion.button
          whileHover={!doc || !googleFederated ? {} : { scale: 1.01 }}
          whileTap={!doc || !googleFederated ? {} : { scale: 0.99 }}
          onClick={handleSaveToGoogle}
          disabled={!doc || !googleFederated || phase === 'uploading'}
          style={btn('#4285F4', !doc || !googleFederated || phase === 'uploading')}
          title={googleFederated ? 'Save to your Google Account' : 'Sign in with Google to enable this'}
        >
          <CloudUpload size={13} />
          {phase === 'uploading' ? 'UPLOADING…' : phase === 'saved' ? 'SAVED TO GOOGLE' : 'SAVE TO GOOGLE ACCOUNT'}
        </motion.button>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: '0.12em', color: NEON.textMuted }}>
      {label}
    </div>
    <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 2 }}>
      {value}
    </div>
  </div>
);
