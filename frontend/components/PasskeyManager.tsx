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
} from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';
import { PasskeyService, type RegisteredPasskey } from '../auth/passkey-service';
import { auth } from '../firebase';
import { NEON } from '../theme';
import { NeonButton } from './ui';

export function PasskeyManager() {
  const { user, registerPasskey, loginWithPasskey } = useSovereign();
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [labelInput, setLabelInput] = useState('');
  const [passkeys, setPasskeys] = useState<RegisteredPasskey[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<'register' | 'verify' | 'delete' | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

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
      setStatusMsg({ type: 'err', text: 'WebAuthn / Passkeys are not supported in this browser.' });
      return;
    }
    if (!normalizedEmail) {
      setStatusMsg({ type: 'err', text: 'Enter an account email to bind this passkey.' });
      return;
    }

    setBusy('register');
    setStatusMsg(null);
    try {
      const label = labelInput.trim() || `Enclave Passkey #${passkeys.length + 1}`;
      await registerPasskey(normalizedEmail, label);
      setLabelInput('');
      setStatusMsg({
        type: 'ok',
        text: `Passkey "${label}" registered and verified for ${normalizedEmail}.`,
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
      const targetEmail = (emailOverride ?? emailInput).trim().toLowerCase() || undefined;
      await loginWithPasskey(targetEmail);
      setStatusMsg({
        type: 'ok',
        text: `Passkey verified via FIDO2 assertion${targetEmail ? ` for ${targetEmail}` : ''}.`,
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
    setBusy('delete');
    setStatusMsg(null);
    try {
      const idToken = await currentUser.getIdToken();
      await PasskeyService.deletePasskey(pk.credentialID, idToken);
      setPasskeys((prev) => prev.filter((item) => item.credentialID !== pk.credentialID));
      setStatusMsg({ type: 'ok', text: `Revoked passkey "${pk.label}".` });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to revoke passkey.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00FF87]/25 bg-[#00FF87]/5 p-4">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-5 w-5 text-[#00FF87]" />
          <div>
            <div className="font-orbitron text-xs font-bold tracking-wider text-[#00FF87]">
              WEBAUTHN / FIDO2 PASSKEY MANAGEMENT
            </div>
            <div className="font-mono-tech text-[11px] text-[#7B9BB5]">
              RP ID: {typeof window !== 'undefined' ? window.location.hostname : 'sovereign.nyc'} · Platform Auth:{' '}
              {platformAvailable === null ? 'checking…' : platformAvailable ? 'available' : 'external key only'} · Session:{' '}
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

      {!webAuthnSupported && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FF7A18]/40 bg-[#FF7A18]/10 px-4 py-3 text-xs text-[#FF7A18]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          WebAuthn (PublicKeyCredential) is not available in this browser context.
        </div>
      )}

      {statusMsg && (
        <div
          className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs"
          style={{
            borderColor: statusMsg.type === 'ok' ? 'rgba(0,255,135,0.4)' : 'rgba(255,46,159,0.45)',
            background: statusMsg.type === 'ok' ? 'rgba(0,255,135,0.08)' : 'rgba(255,46,159,0.08)',
            color: statusMsg.type === 'ok' ? NEON.green : NEON.magenta,
          }}
        >
          {statusMsg.type === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="font-semibold">{statusMsg.text}</span>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/80 p-4">
        <div className="font-orbitron text-[11px] font-bold tracking-wider text-[#00D4FF]">
          REGISTER NEW FIDO2 PASSKEY
        </div>
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
            <Plus className="h-3.5 w-3.5" />
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
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-orbitron text-[11px] font-bold tracking-wider text-[#7B9BB5]">
            REGISTERED PASSKEYS ({passkeys.length})
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
          <div className="rounded-xl border border-[#00D4FF]/15 bg-[#060D1F]/60 p-6 text-center text-xs text-[#7B9BB5]">
            {loadingList
              ? 'Loading registered passkeys from enclave…'
              : 'No passkeys registered for this account yet. Click Register Passkey above to bind a FIDO2 credential.'}
          </div>
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.credentialID}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#00D4FF]/20 bg-[#060D1F]/80 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-[#00D4FF]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                    <span>{pk.label}</span>
                    {pk.credentialDeviceType !== 'unknown' && (
                      <span className="font-mono-tech rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-1.5 py-0.5 text-[10px] text-[#00D4FF]">
                        {pk.credentialDeviceType}
                      </span>
                    )}
                    {pk.credentialBackedUp && (
                      <span className="font-mono-tech rounded border border-[#00FF87]/30 bg-[#00FF87]/10 px-1.5 py-0.5 text-[10px] text-[#00FF87]">
                        synced
                      </span>
                    )}
                  </div>
                  <div className="font-mono-tech text-[11px] text-[#7B9BB5]">
                    ID: {pk.credentialID.slice(0, 18)}…
                    {pk.createdAt ? ` · Created ${new Date(pk.createdAt).toLocaleDateString()}` : ''}
                    {pk.lastUsedAt ? ` · Last verified ${new Date(pk.lastUsedAt).toLocaleString()}` : ''}
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
          ))
        )}
      </div>
    </div>
  );
}
