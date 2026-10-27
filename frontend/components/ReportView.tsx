import React, { useMemo, useState } from 'react';
import { FileDown, FolderUp } from 'lucide-react';
import { NEON } from '../theme';
import { useSovereign } from '../context/SovereignContext';
import { MODULE_CONFIGS } from '../module-config';
import {
  AUDIT_MONTHS,
  auditExpiry,
  buildAuditPdf,
  checkpointSchedule,
  downloadPdf,
  savePdfToGoogleDrive,
} from '../services/auditPdf';
import { Sha256Badge } from './Sha256Badge';
import { GOOGLE_CANCELLED } from '../firebase';

/**
 * 26-Month Identity Audit. Generated on-device from real receipts.
 * Google (federated) users save it directly to their own Google Drive;
 * passkey/guest users download it, or attach Google for Drive saving.
 */
export const ReportView: React.FC = () => {
  const { user, sovereignId, receipts, sessionEntries, googleAccessToken, attachGoogle } = useSovereign();
  const [busy, setBusy] = useState<'DOWNLOAD' | 'DRIVE' | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [documentHash, setDocumentHash] = useState<string | null>(null);

  const sensitiveKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const mod of Object.values(MODULE_CONFIGS)) {
      for (const f of mod.dataFields) if (f.sensitive) keys.add(f.key);
    }
    return keys;
  }, []);

  const build = async () => {
    if (!user || !sovereignId) throw new Error('Not signed in.');
    return buildAuditPdf({
      email: user.email,
      method: user.method,
      sovereignId,
      receipts,
      sessionEntries,
      sensitiveKeys,
    });
  };

  const onDownload = async () => {
    setError(null); setStatus(null); setDriveLink(null); setBusy('DOWNLOAD');
    try {
      const { blob, filename, documentHash: hash } = await build();
      downloadPdf(blob, filename);
      setDocumentHash(hash);
      setStatus(`Audit downloaded: ${filename}. Keep it with your records — it is the owner copy of your sealed ledger.`);
    } catch (err: any) {
      setError(err?.message ?? 'Could not generate the PDF.');
    } finally { setBusy(null); }
  };

  const onDrive = async () => {
    setError(null); setStatus(null); setDriveLink(null); setBusy('DRIVE');
    try {
      let token = googleAccessToken;
      if (!token) {
        // Incremental drive.file consent — never requested at login.
        token = await attachGoogle();
      }
      if (!token) throw new Error('Google did not return a Drive access token (the drive.file scope may have been declined). Nothing was uploaded — download the PDF or retry and accept the Drive permission.');
      const { blob, filename, documentHash: hash } = await build();
      const saved = await savePdfToGoogleDrive(blob, filename, token);
      setDocumentHash(hash);
      if (saved.webViewLink) setDriveLink(saved.webViewLink);
      setStatus(`Saved to your Google Drive (file ${saved.id}). It lives in your federated Google account under your control — Agape keeps no copy of the PDF.`);
    } catch (err: any) {
      if (err?.message === GOOGLE_CANCELLED) setError('Google sign-in was cancelled — nothing was uploaded.');
      else if (err?.message === 'DRIVE_TOKEN_EXPIRED') setError('Your Google session token expired. Tap "Save to Google Drive" again to re-consent, then retry.');
      else setError(err?.message ?? 'Drive save failed. You can download the PDF instead — nothing was partially uploaded by this app.');
    } finally { setBusy(null); }
  };

  const expiry = auditExpiry();
  const checkpoints = checkpointSchedule();
  const isGoogle = user?.method === 'GOOGLE';

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', paddingBottom: 90 }}>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.18em' }}>
        IDENTITY AUDIT · {AUDIT_MONTHS}-MONTH WINDOW
      </div>
      <h1 style={{ margin: '6px 0 6px', fontFamily: "'Orbitron', sans-serif", fontSize: '1.5rem', fontWeight: 900, color: NEON.blue, textShadow: `0 0 14px ${NEON.blue}55` }}>
        26-MONTH IDENTITY AUDIT PDF
      </h1>
      <p style={{ color: NEON.textMuted, fontSize: '0.86rem', lineHeight: 1.6, maxWidth: 680 }}>
        Generated on this device from your <strong style={{ color: NEON.text }}>{receipts.length} real sealed receipt(s)</strong> across{' '}
        {new Set(receipts.map((r) => r.moduleId)).size} of 16 modules — every SHA-256 ID, every named verification
        source, and a monthly re-verification schedule until <strong style={{ color: NEON.green }}>{expiry.toISOString().slice(0, 10)}</strong>.
        Sensitive values are masked in the document; nothing is invented.
      </p>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '16px 0 22px' }}>
        {sovereignId && <Sha256Badge hash={sovereignId} label="AUDIT SOVEREIGN SHA-256" size="md" />}
        {documentHash && <Sha256Badge hash={documentHash} label="DOCUMENT SHA-256" size="md" />}
      </div>

      {receipts.length === 0 && (
        <div style={{ border: `1px dashed ${NEON.orange}77`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: '0.84rem', color: NEON.text }}>
          <strong style={{ color: NEON.orange }}>Honest empty state:</strong> you have no sealed modules yet, so this audit would
          contain only your Sovereign ID and the schedule. Seal at least the Communication module first for a meaningful report —
          we will not pad it with template findings.
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <button
          type="button" onClick={() => void onDownload()} disabled={busy !== null}
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '13px 22px', borderRadius: 10, border: `1px solid ${NEON.blue}`, background: 'rgba(0,212,255,0.1)', color: NEON.blue, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.72rem', fontWeight: 800, opacity: busy ? 0.6 : 1 }}
        >
          <FileDown size={15} /> {busy === 'DOWNLOAD' ? 'GENERATING…' : 'DOWNLOAD AUDIT PDF'}
        </button>
        <button
          type="button" onClick={() => void onDrive()} disabled={busy !== null}
          style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '13px 22px', borderRadius: 10, border: `1px solid ${NEON.green}`, background: 'rgba(0,255,135,0.09)', color: NEON.green, cursor: 'pointer', fontFamily: "'Orbitron', monospace", fontSize: '0.72rem', fontWeight: 800, boxShadow: '0 0 16px rgba(0,255,135,0.15)', opacity: busy ? 0.6 : 1 }}
        >
          <FolderUp size={15} /> {busy === 'DRIVE' ? 'SAVING TO DRIVE…' : isGoogle ? 'SAVE TO MY GOOGLE DRIVE' : 'ATTACH GOOGLE · SAVE TO DRIVE'}
        </button>
      </div>

      <p style={{ fontSize: '0.74rem', color: NEON.textMuted, lineHeight: 1.55, maxWidth: 680 }}>
        {isGoogle
          ? 'You are signed in with Google (federated). Saving uses the least-privilege drive.file scope: Agape can only create this file in your Drive; it cannot read the rest of it. That is the dual-protection path — Google account security around your long-term audit archive.'
          : user?.method === 'PASSKEY'
            ? 'Passkey sessions are maximally private but have no cloud archive. Attaching Google gives you dual protection (device passkey + federated Google account) and lets the audit PDF live in your own Drive. Your sealed receipts on this device are untouched either way.'
            : 'Guest sessions are ephemeral. Attach Google to upgrade this same account (your receipts carry over) and save the audit PDF to your federated Drive, or download it now before you close the session.'}
      </p>

      {status && <div role="status" style={{ marginTop: 14, border: `1px solid ${NEON.green}66`, background: 'rgba(0,255,135,0.06)', borderRadius: 10, padding: '11px 14px', fontSize: '0.8rem', color: NEON.text }}>{status} {driveLink && <a href={driveLink} target="_blank" rel="noreferrer" style={{ color: NEON.blue }}>Open in Google Drive →</a>}</div>}
      {error && <div role="alert" style={{ marginTop: 14, border: `1px solid ${NEON.magenta}66`, background: 'rgba(255,46,159,0.07)', borderRadius: 10, padding: '11px 14px', fontSize: '0.8rem', color: '#ffb3d9' }}>⚠ {error}</div>}

      <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.74rem', color: NEON.textMuted, letterSpacing: '0.1em', marginTop: 30 }}>
        RE-VERIFICATION CHECKPOINTS ({AUDIT_MONTHS})
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 7 }}>
        {checkpoints.map((d, i) => (
          <div key={d.toISOString()} style={{ border: '1px solid rgba(0,212,255,0.14)', borderRadius: 9, padding: '8px 11px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.62rem', color: NEON.textMuted }}>
            MONTH {String(i + 1).padStart(2, '0')} · <span style={{ color: NEON.text }}>{d.toISOString().slice(0, 10)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
