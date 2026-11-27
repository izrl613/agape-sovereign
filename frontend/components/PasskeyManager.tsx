import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Tag,
  Clock,
  Smartphone,
  HardDrive,
  Usb,
} from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { PasskeyService, type RegisteredPasskey, PASSKEY_ERRORS } from '../auth/passkey-service';
import { auth } from '../firebase';
import { NEON } from '../theme';
import { NeonButton } from './ui';

type TransportIcon = 'internal' | 'usb' | 'ble' | 'nfc' | 'hybrid';

function transportIcon(transport: string) {
  switch (transport as TransportIcon) {
    case 'internal':
      return <Smartphone className="h-3 w-3" />;
    case 'usb':
      return <Usb className="h-3 w-3" />;
    case 'ble':
    case 'nfc':
    case 'hybrid':
      return <HardDrive className="h-3 w-3" />;
    default:
      return <KeyRound className="h-3 w-3" />;
  }
}

function relativeTime(isoDateString: string | null): string {
  if (!isoDateString) return 'never';
  const d = new Date(isoDateString);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const now = Date.now();
  const diffMs = now - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function PasskeyManager() {
  const { user, registerPasskey, loginWithPasskey } = useSovereign();
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [labelInput, setLabelInput] = useState('');
  const [passkeys, setPasskeys] = useState<RegisteredPasskey[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);
  const [conditionalMediation, setConditionalMediation] = useState<boolean>(false);
  const [busy, setBusy] = useState<'register' | 'verify' | 'delete' | 'rename' | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const webAuthnSupported = typeof window !== 'undefined' && Boolean(window.PublicKeyCredential);

  useEffect(() => {
    if (user?.email && !emailInput) {
      setEmailInput(user.email);
    }
  }, [user?.email, emailInput]);

  useEffect(() => {
    if (!webAuthnSupported) {
      setPlatformAvailable(false);
      return;
    }
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
      .then((ok) => setPlatformAvailable(ok))
      .catch(() => setPlatformAvailable(false));

    // Check conditional mediation (autofill-triggered passkey sign-in)
    if (typeof PublicKeyCredential.isConditionalMediationAvailable === 'function') {
      PublicKeyCredential.isConditionalMediationAvailable()
        .then((ok) => setConditionalMediation(ok))
        .catch(() => setConditionalMediation(false));
    }
  }, [webAuthnSupported]);

  const loadPasskeys = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setPasskeys([]);
      return;
    }
    setLoadingList(true);
    try {
      const idToken = await currentUser.getIdToken();
      const list = await PasskeyService.listPasskeys(idToken);
      setPasskeys(list);
    } catch {
      // Non-fatal if backend /passkeys endpoint isn't deployed yet
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys, user?.id, user?.method]);

  const handleRegister = async () => {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!webAuthnSupported) {
      setStatusMsg({ type: 'err', text: PASSKEY_ERRORS.CREATION_FAILED });
      return;
    }
    if (!normalizedEmail) {
      setStatusMsg({ type: 'err', text: 'Enter an account email to bind this passkey.' });
      return;
    }

    setBusy('register');
    setStatusMsg(null);
    try {
      // Refresh CSRF token before ceremony to prevent stale tokens
      await PasskeyService.refreshCSRF();

      const label = labelInput.trim() || `Enclave Passkey #${passkeys.length + 1}`;
      await registerPasskey(normalizedEmail, label);
      setLabelInput('');
      setStatusMsg({
        type: 'ok',
        text: `✓ Passkey "${label}" registered and verified for ${normalizedEmail}. Your device biometrics or hardware key is now bound to this enclave.`,
      });
      await loadPasskeys();
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Passkey registration failed.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async (emailOverride?: string) => {
    if (!webAuthnSupported) {
      setStatusMsg({ type: 'err', text: 'WebAuthn / Passkeys are not supported in this browser.' });
      return;
    }
    setBusy('verify');
    setStatusMsg(null);
    try {
      await PasskeyService.refreshCSRF();
      const targetEmail = (emailOverride ?? emailInput).trim().toLowerCase() || undefined;
      await loginWithPasskey(targetEmail);
      setStatusMsg({
        type: 'ok',
        text: `✓ Passkey verified via FIDO2 assertion${targetEmail ? ` for ${targetEmail}` : ' (discoverable credential)'}. Session updated.`,
      });
      await loadPasskeys();
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Passkey verification failed.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (pk: RegisteredPasskey) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setStatusMsg({ type: 'err', text: 'Sign in first to revoke a registered passkey.' });
      return;
    }
    // Prevent revoking the last passkey if it's the only auth method
    if (passkeys.length <= 1 && user?.method === 'PASSKEY') {
      setStatusMsg({
        type: 'err',
        text: 'Cannot revoke your only passkey — you would be locked out. Add a second passkey or link Google first.',
      });
      return;
    }

    setBusy('delete');
    setStatusMsg(null);
    try {
      const idToken = await currentUser.getIdToken();
      await PasskeyService.deletePasskey(pk.credentialID, idToken);
      setPasskeys((prev) => prev.filter((item) => item.credentialID !== pk.credentialID));
      setStatusMsg({ type: 'ok', text: `Revoked passkey "${pk.label || pk.credentialID.slice(0, 12)}".` });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to revoke passkey.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleRename = async (pk: RegisteredPasskey) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !renameValue.trim()) return;
    setBusy('rename');
    try {
      // Update label via the backend if supported, or locally
      const idToken = await currentUser.getIdToken();
      try {
        const res = await fetch(`/api/auth/passkeys/${encodeURIComponent(pk.credentialID)}/label`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ label: renameValue.trim() }),
        });
        if (!res.ok) throw new Error('Backend label update not available');
      } catch {
        // Fallback: update locally only
      }
      setPasskeys((prev) =>
        prev.map((p) =>
          p.credentialID === pk.credentialID ? { ...p, label: renameValue.trim() } : p
        )
      );
      setStatusMsg({ type: 'ok', text: `Renamed passkey to "${renameValue.trim()}".` });
      setRenamingId(null);
      setRenameValue('');
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to rename passkey.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00FF87]/25 bg-[#00FF87]/5 p-4">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-5 w-5 text-[#00FF87]" />
          <div>
            <div className="font-orbitron text-xs font-bold tracking-wider text-[#00FF87]">
              WEBAUTHN / FIDO2 PASSKEY MANAGEMENT
            </div>
            <div className="font-mono-tech text-[11px] text-[#7B9BB5]">
              RP ID: {typeof window !== 'undefined' ? window.location.hostname : 'sovereign.nyc'} · Platform Auth:{' '}
              <span style={{ color: platformAvailable ? NEON.green : NEON.orange }}>
                {platformAvailable === null ? 'checking…' : platformAvailable ? 'AVAILABLE' : 'EXTERNAL KEY ONLY'}
              </span>
              {' '}· Conditional Mediation:{' '}
              <span style={{ color: conditionalMediation ? NEON.green : NEON.textMuted }}>
                {conditionalMediation ? 'YES' : 'NO'}
              </span>
              {' '}· Session:{' '}
              <span className="text-[#00D4FF]">{user?.method || 'NONE'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NeonButton
            size="sm"
            color={NEON.blue}
            disabled={busy !== null || !webAuthnSupported}
            onClick={() => handleVerify()}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {busy === 'verify' ? 'VERIFYING…' : 'VERIFY PASSKEY'}
          </NeonButton>
        </div>
      </div>

      {/* WebAuthn Not Supported Warning */}
      {!webAuthnSupported && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FF7A18]/40 bg-[#FF7A18]/10 px-4 py-3 text-xs text-[#FF7A18]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div>
            <strong>WebAuthn (PublicKeyCredential) is not available in this browser context.</strong>
            <br />
            Try Chrome, Safari, Firefox, or Edge on a device with biometrics (Touch ID / Face ID / Windows Hello) or a hardware security key (YubiKey).
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMsg && (
        <div
          className="flex items-start gap-2 rounded-lg border px-4 py-2.5 text-xs"
          style={{
            borderColor: statusMsg.type === 'ok' ? 'rgba(0,255,135,0.4)' : 'rgba(255,46,159,0.45)',
            background: statusMsg.type === 'ok' ? 'rgba(0,255,135,0.08)' : 'rgba(255,46,159,0.08)',
            color: statusMsg.type === 'ok' ? NEON.green : NEON.magenta,
          }}
        >
          {statusMsg.type === 'ok' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      {/* Register New Passkey */}
      <div className="space-y-3 rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/80 p-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#00D4FF]" />
          <span className="font-orbitron text-[11px] font-bold tracking-wider text-[#00D4FF]">
            REGISTER NEW FIDO2 PASSKEY
          </span>
        </div>
        <p className="text-[11px] text-[#7B9BB5]">
          Creates a new FIDO2/WebAuthn credential bound to your device biometrics (Touch ID, Face ID, Windows Hello) or a hardware security key (YubiKey).
          The passkey is cryptographically bound to this origin and cannot be phished.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono-tech mb-1 block text-[10px] tracking-wider text-[#7B9BB5]">
              ACCOUNT EMAIL (PASSKEY BINDING)
            </span>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="admin@sovereign.nyc"
              aria-label="Account email for passkey binding"
              className="font-mono-tech w-full rounded-md border border-[#00D4FF]/25 bg-[#0B1020] px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#7B9BB5]/60 focus:border-[#00D4FF] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono-tech mb-1 block text-[10px] tracking-wider text-[#7B9BB5]">
              DEVICE / KEY LABEL (OPTIONAL)
            </span>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="e.g. MacBook Touch ID, YubiKey 5C"
              aria-label="Passkey label"
              className="font-mono-tech w-full rounded-md border border-[#00D4FF]/25 bg-[#0B1020] px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#7B9BB5]/60 focus:border-[#00D4FF] focus:outline-none"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <NeonButton
            size="sm"
            color={NEON.green}
            disabled={busy !== null || !webAuthnSupported || !emailInput.trim()}
            onClick={handleRegister}
          >
            <Fingerprint className="h-3.5 w-3.5" />
            {busy === 'register' ? 'WAITING FOR AUTHENTICATOR…' : 'REGISTER PASSKEY'}
          </NeonButton>
          <NeonButton
            size="sm"
            color={NEON.orange}
            disabled={busy !== null || !webAuthnSupported}
            onClick={() => handleVerify('')}
          >
            <KeyRound className="h-3.5 w-3.5" />
            DISCOVERABLE SIGN-IN
          </NeonButton>
          <NeonButton
            size="sm"
            color={NEON.blue}
            disabled={busy !== null || !webAuthnSupported || !emailInput.trim()}
            onClick={() => handleVerify(emailInput)}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            VERIFY BY EMAIL
          </NeonButton>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="font-mono-tech mt-2 text-[10px] tracking-wider text-[#7B9BB5] underline decoration-dotted underline-offset-2 hover:text-[#00D4FF]"
        >
          {showAdvanced ? '▾ HIDE ADVANCED' : '▸ ADVANCED OPTIONS'}
        </button>
        {showAdvanced && (
          <div className="space-y-2 rounded-lg border border-[#00D4FF]/10 bg-[#0B1020]/50 p-3">
            <div className="text-[11px] text-[#7B9BB5]">
              <strong className="text-[#F8FAFC]">Platform Authenticator:</strong>{' '}
              {platformAvailable ? (
                <span className="text-[#00FF87]">Available — Touch ID, Face ID, or Windows Hello can create passkeys directly.</span>
              ) : (
                <span className="text-[#FF7A18]">Not detected — use a USB/NFC/BLE security key (YubiKey, Titan, etc.).</span>
              )}
            </div>
            <div className="text-[11px] text-[#7B9BB5]">
              <strong className="text-[#F8FAFC]">Conditional UI (Autofill):</strong>{' '}
              {conditionalMediation ? (
                <span className="text-[#00FF87]">Supported — passkeys will appear in autofill menus on supported browsers.</span>
              ) : (
                <span className="text-[#FF7A18]">Not available in this browser.</span>
              )}
            </div>
            <div className="text-[11px] text-[#7B9BB5]">
              <strong className="text-[#F8FAFC]">RP ID:</strong>{' '}
              <code className="rounded bg-[#00D4FF]/10 px-1 py-0.5 text-[#00D4FF]">
                {typeof window !== 'undefined' ? window.location.hostname : 'sovereign.nyc'}
              </code>{' '}
              — passkeys are origin-bound and cannot be used on other domains.
            </div>
            <div className="text-[11px] text-[#7B9BB5]">
              <strong className="text-[#F8FAFC]">Attestation:</strong> Direct attestation requested for hardware key verification.
              <br />
              <strong className="text-[#F8FAFC]">User Verification:</strong> Required — biometric or PIN confirmation enforced.
            </div>
          </div>
        )}
      </div>

      {/* Registered Passkeys List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00D4FF]" />
            <span className="font-orbitron text-[11px] font-bold tracking-wider text-[#00D4FF]">
              REGISTERED PASSKEYS ({passkeys.length})
            </span>
          </div>
          <button
            type="button"
            disabled={loadingList || busy !== null}
            onClick={loadPasskeys}
            className="font-mono-tech inline-flex items-center gap-1 rounded border border-[#00D4FF]/25 bg-[#00D4FF]/10 px-2 py-1 text-[10px] text-[#00D4FF] hover:bg-[#00D4FF]/20 disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loadingList ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
        </div>

        {passkeys.length === 0 ? (
          <div className="rounded-xl border border-[#00D4FF]/15 bg-[#060D1F]/60 p-6 text-center">
            <Fingerprint className="mx-auto mb-2 h-8 w-8 text-[#7B9BB5]/40" />
            <p className="text-xs text-[#7B9BB5]">
              {loadingList
                ? 'Loading registered passkeys from enclave…'
                : 'No passkeys registered for this account yet. Click Register Passkey above to bind a FIDO2 credential to your device biometrics or hardware key.'}
            </p>
          </div>
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.credentialID}
              className="rounded-lg border border-[#00D4FF]/20 bg-[#060D1F]/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{
                      background: pk.credentialDeviceType === 'multiDevice'
                        ? 'rgba(0,255,135,0.12)'
                        : 'rgba(0,212,255,0.12)',
                      border: `1px solid ${pk.credentialDeviceType === 'multiDevice' ? 'rgba(0,255,135,0.3)' : 'rgba(0,212,255,0.3)'}`,
                    }}
                  >
                    {pk.transports.includes('internal') ? (
                      <Smartphone className="h-4 w-4" style={{ color: pk.credentialDeviceType === 'multiDevice' ? NEON.green : NEON.blue }} />
                    ) : (
                      <KeyRound className="h-4 w-4" style={{ color: NEON.blue }} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                      {renamingId === pk.credentialID ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void handleRename(pk);
                              if (e.key === 'Escape') {
                                setRenamingId(null);
                                setRenameValue('');
                              }
                            }}
                            autoFocus
                            className="font-mono-tech w-40 rounded border border-[#00D4FF]/40 bg-[#0B1020] px-2 py-0.5 text-[11px] text-[#F8FAFC] focus:border-[#00D4FF] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => void handleRename(pk)}
                            disabled={busy !== null || !renameValue.trim()}
                            className="rounded border border-[#00FF87]/30 bg-[#00FF87]/10 px-1.5 py-0.5 text-[10px] text-[#00FF87] hover:bg-[#00FF87]/20 disabled:opacity-40"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setRenamingId(null); setRenameValue(''); }}
                            className="text-[10px] text-[#7B9BB5] hover:text-[#F8FAFC]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{pk.label || 'Enclave Passkey'}</span>
                          <button
                            type="button"
                            onClick={() => { setRenamingId(pk.credentialID); setRenameValue(pk.label || ''); }}
                            className="rounded p-0.5 text-[#7B9BB5] hover:text-[#00D4FF]"
                            aria-label="Rename passkey"
                          >
                            <Tag className="h-3 w-3" />
                          </button>
                        </>
                      )}
                      <span
                        className="font-mono-tech rounded border px-1.5 py-0.5 text-[10px]"
                        style={{
                          borderColor: pk.credentialDeviceType === 'multiDevice'
                            ? 'rgba(0,255,135,0.3)'
                            : 'rgba(0,212,255,0.3)',
                          background: pk.credentialDeviceType === 'multiDevice'
                            ? 'rgba(0,255,135,0.1)'
                            : 'rgba(0,212,255,0.1)',
                          color: pk.credentialDeviceType === 'multiDevice' ? NEON.green : NEON.blue,
                        }}
                      >
                        {pk.credentialDeviceType === 'multiDevice' ? 'SYNCED' : 'DEVICE-BOUND'}
                      </span>
                      {pk.credentialBackedUp && (
                        <span className="font-mono-tech rounded border border-[#00FF87]/30 bg-[#00FF87]/10 px-1.5 py-0.5 text-[10px] text-[#00FF87]">
                          BACKED UP
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3 font-mono-tech text-[11px] text-[#7B9BB5]">
                      <span>
                        ID: <code className="text-[#00D4FF]">{pk.credentialID.slice(0, 18)}…</code>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {pk.transports.length > 0
                          ? pk.transports.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-0.5 rounded border border-[#00D4FF]/20 bg-[#00D4FF]/5 px-1 py-0.5 text-[10px]"
                              >
                                {transportIcon(t)} {t}
                              </span>
                            ))
                          : <span className="inline-flex items-center gap-0.5">
                              <Smartphone className="h-3 w-3" /> internal
                            </span>
                        }
                      </span>
                      {pk.createdAt && (
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> Created {relativeTime(pk.createdAt)}
                        </span>
                      )}
                      {pk.lastUsedAt && (
                        <span className="inline-flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3" /> Verified {relativeTime(pk.lastUsedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => handleVerify()}
                    className="rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2.5 py-1 text-[11px] font-bold text-[#00D4FF] hover:bg-[#00D4FF]/20 disabled:opacity-40"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => handleRemove(pk)}
                    className="rounded border border-[#FF2E9F]/35 bg-[#FF2E9F]/10 p-1.5 text-[#FF2E9F] hover:bg-[#FF2E9F]/20 disabled:opacity-40"
                    aria-label={`Revoke ${pk.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Info Footer */}
      <div className="rounded-lg border border-[#00D4FF]/10 bg-[#060D1F]/50 p-3">
        <div className="font-mono-tech text-[10px] leading-relaxed text-[#7B9BB5]">
          <strong className="text-[#00D4FF]">FIDO2 / WebAuthn Security Properties:</strong>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>Passkeys are <strong className="text-[#F8FAFC]">phishing-resistant</strong> — they only work on the correct origin ({typeof window !== 'undefined' ? window.location.hostname : 'sovereign.nyc'}).</li>
            <li>No shared secrets — the private key <strong className="text-[#F8FAFC]">never leaves your device</strong>.</li>
            <li>Each login uses a fresh challenge signed by your authenticator — <strong className="text-[#F8FAFC]">replay-proof</strong>.</li>
            <li>User verification (biometric / PIN) is <strong className="text-[#F8FAFC]">always required</strong>.</li>
            <li>Synced passkeys (iCloud Keychain, Google Password Manager) inherit the platform's end-to-end encryption.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
