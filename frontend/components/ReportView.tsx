import React, { useMemo, useState } from 'react';
import { NEON, FONTS } from '../theme';
import { NeonText, GlassCard, NeonButton } from './DesignSystem';
import { MODULE_AGENTS } from '../module-catalog';
import { useSovereign } from '../context/SovereignContext';
import { buildModuleBriefing, statusColor } from '../utils/briefing';
import { confirmWithBiometrics } from '../services/biometricGate';
import { AUDIT_PAGE_COUNT, buildAuditPayload, downloadBlob, generateIdentityAuditPdf } from '../services/auditReportPdf';
import { getGoogleDriveAccessToken, uploadPdfToGoogleDrive } from '../services/driveExport';

type Phase = 'preview' | 'verifying' | 'saving' | 'done';

export const ReportView: React.FC = () => {
  const { modules, dossier, user } = useSovereign();
  const [phase, setPhase] = useState<Phase>('preview');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const cards = useMemo(
    () =>
      MODULE_AGENTS.map((m) => {
        const row = modules[m.id] || { record: {}, findings: [] };
        const briefing = buildModuleBriefing(m, row.record, row.findings, user?.displayName || 'You');
        return { m, briefing };
      }),
    [modules, user]
  );

  const compile = async (sink: 'device' | 'drive') => {
    if (!user) {
      setError('Sign in first.');
      return;
    }
    setError(null);
    setNotice(null);
    setDriveLink(null);
    setPhase('verifying');
    try {
      const payload = await buildAuditPayload(
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          authMethod: user.authMethod,
        },
        dossier,
        modules
      );
      setHash(payload.masterHash);
      const proof = await confirmWithBiometrics(payload.masterHash, {
        uid: user.id,
        email: user.email,
        name: user.displayName,
      });
      payload.biometric = proof;
      setPhase('saving');
      const pdf = await generateIdentityAuditPdf(payload);
      setFileName(pdf.fileName);
      if (sink === 'device') {
        downloadBlob(pdf.blob, pdf.fileName);
        setNotice(`Saved ${pdf.fileName} (${pdf.pages} pages) to this device.`);
      } else {
        const token = await getGoogleDriveAccessToken();
        const uploaded = await uploadPdfToGoogleDrive(pdf.blob, pdf.fileName, token);
        setDriveLink(uploaded.webViewLink);
        setNotice(`Uploaded ${pdf.fileName} to your Google Drive.`);
      }
      setPhase('done');
    } catch (err) {
      setPhase('preview');
      setError(err instanceof Error ? err.message : 'Handoff failed.');
    }
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%', animation: 'fade-in 0.35s ease' }}>
      <div style={{ fontFamily: FONTS.mono, fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.18em' }}>
        IDENTITY AUDIT · 16 MODULE AGENTS · {AUDIT_PAGE_COUNT}-PAGE HANDOFF
      </div>
      <NeonText color={NEON.blue} size="1.4rem" weight={900}>
        IDENTITY AUDIT REPORT
      </NeonText>
      <p style={{ fontFamily: FONTS.rajdhani, color: NEON.textMuted, maxWidth: 760, margin: '8px 0 20px', lineHeight: 1.55 }}>
        Preview the same 16 splash briefings the agents told you. Confirm with biometrics (Face ID, Touch ID, Windows Hello, or a security key). Then keep a real PDF on this device or in your federated Google account. Nothing is written until you verify.
      </p>

      <GlassCard style={{ padding: 18, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat label="Score" value={String(dossier.score)} color={NEON.blue} />
          <Stat label="Nuked" value={String(dossier.nuked)} color={NEON.magenta} />
          <Stat label="Knoxed" value={String(dossier.knoxed)} color={NEON.blue} />
          <Stat label="Pages" value={String(AUDIT_PAGE_COUNT)} color={NEON.orange} />
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: '0.62rem', color: NEON.textMuted, marginTop: 12 }}>
          Operator {user?.displayName} · {dossier.emailMasked} · {dossier.authLabel} · 16 splash screens compiled
        </div>
        {hash && (
          <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.blue, marginTop: 8, wordBreak: 'break-all' }}>
            SHA-256 · {hash}
          </div>
        )}
      </GlassCard>

      {error && (
        <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,122,24,0.35)', background: 'rgba(255,122,24,0.08)', color: '#ffaa66', fontFamily: FONTS.mono, fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}
      {notice && (
        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.08)', color: NEON.blue, fontFamily: FONTS.mono, fontSize: 12 }}>
          {notice}
          {driveLink && (
            <>
              {' '}
              <a href={driveLink} target="_blank" rel="noreferrer" style={{ color: NEON.orange }}>
                Open in Drive
              </a>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
        <NeonButton
          color={NEON.blue}
          disabled={phase === 'verifying' || phase === 'saving'}
          onClick={() => compile('device')}
        >
          {phase === 'verifying' ? 'VERIFY BIOMETRICS…' : phase === 'saving' ? 'WRITING PDF…' : '🔑 VERIFY · SAVE TO DEVICE'}
        </NeonButton>
        <NeonButton
          color={NEON.orange}
          disabled={phase === 'verifying' || phase === 'saving'}
          onClick={() => compile('drive')}
        >
          {phase === 'verifying' ? 'VERIFY BIOMETRICS…' : 'G VERIFY · SAVE TO GOOGLE'}
        </NeonButton>
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.textMuted, marginBottom: 18, letterSpacing: '0.06em' }}>
        Device download uses the browser file picker. Google Drive requests drive.file only after biometrics, never at login.
        {fileName ? ` Last file: ${fileName}` : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40 }}>
        {cards.map(({ m, briefing }) => {
          const c = statusColor(briefing.status);
          return (
            <GlassCard key={m.id} style={{ padding: 16, borderLeft: `4px solid ${c}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.orange }}>
                    {m.vector} · {m.icon} {m.name} · SPLASH {m.vector.replace('V-0', '').replace('V-', '')}/16
                  </div>
                  <div style={{ fontFamily: FONTS.orbitron, fontSize: '0.95rem', color: c, margin: '4px 0' }}>{briefing.headline}</div>
                  <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.9rem', color: NEON.text, lineHeight: 1.45 }}>{briefing.plainEnglish}</div>
                  <div style={{ fontFamily: FONTS.rajdhani, fontSize: '0.8rem', color: NEON.blue, marginTop: 6 }}>Next: {briefing.nextAction}</div>
                </div>
                <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.4rem', color: c, fontWeight: 800 }}>{briefing.score}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div>
    <div style={{ fontFamily: FONTS.mono, fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.1em' }}>{label.toUpperCase()}</div>
    <div style={{ fontFamily: FONTS.orbitron, fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
  </div>
);
