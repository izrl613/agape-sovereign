import { useEffect, useState } from 'react';
import { CheckCircle2, Fingerprint, KeyRound, Plus, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { useSovereign } from '../context/SovereignContext';

interface StoredPasskey {
  id: string;
  rawIdB64: string;
  label: string;
  createdAt: string;
  lastVerifiedAt?: string;
  transports?: string[];
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function PasskeyManager() {
  const { user } = useSovereign();
  const storageKey = `agape_passkeys_${user?.id || 'enclave'}`;

  const [passkeys, setPasskeys] = useState<StoredPasskey[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  });
  const [labelInput, setLabelInput] = useState('');
  const [platformAvailable, setPlatformAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const webAuthnSupported = typeof window !== 'undefined' && Boolean(window.PublicKeyCredential);

  useEffect(() => {
    if (!webAuthnSupported) {
      setPlatformAvailable(false);
      return;
    }
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
      .then((ok) => setPlatformAvailable(ok))
      .catch(() => setPlatformAvailable(false));
  }, [webAuthnSupported]);

  const savePasskeys = (next: StoredPasskey[]) => {
    setPasskeys(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const handleRegister = async () => {
    if (!webAuthnSupported) {
      setStatusMsg({ type: 'err', text: 'WebAuthn / Passkeys are not supported in this browser.' });
      return;
    }
    setBusy(true);
    setStatusMsg(null);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userIdBytes = new TextEncoder().encode(user?.id || 'sovereign-admin');
      const userName = user?.email || user?.id || 'admin@agape.nyc';

      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Agape Sovereign Enclave',
            id: window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      })) as PublicKeyCredential | null;

      if (!cred) {
        setStatusMsg({ type: 'err', text: 'Passkey registration was cancelled.' });
        return;
      }

      const response = cred.response as AuthenticatorAttestationResponse;
      const transports = typeof response.getTransports === 'function' ? response.getTransports() : undefined;
      const newEntry: StoredPasskey = {
        id: cred.id,
        rawIdB64: toBase64Url(cred.rawId),
        label: labelInput.trim() || `Enclave Passkey #${passkeys.length + 1}`,
        createdAt: new Date().toISOString(),
        transports,
      };

      savePasskeys([newEntry, ...passkeys]);
      setLabelInput('');
      setStatusMsg({ type: 'ok', text: `Registered passkey "${newEntry.label}" (${cred.id.slice(0, 12)}…).` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey registration failed.';
      setStatusMsg({ type: 'err', text: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (target?: StoredPasskey) => {
    if (!webAuthnSupported) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const allowCredentials: PublicKeyCredentialDescriptor[] | undefined = target
        ? [{ type: 'public-key', id: fromBase64Url(target.rawIdB64).buffer as ArrayBuffer }]
        : passkeys.length
        ? passkeys.map((p) => ({ type: 'public-key' as const, id: fromBase64Url(p.rawIdB64).buffer as ArrayBuffer }))
        : undefined;

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials,
          userVerification: 'preferred',
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) {
        setStatusMsg({ type: 'err', text: 'Passkey verification was cancelled.' });
        return;
      }

      const now = new Date().toISOString();
      const matched = passkeys.find((p) => p.id === assertion.id);
      if (matched) {
        savePasskeys(passkeys.map((p) => (p.id === assertion.id ? { ...p, lastVerifiedAt: now } : p)));
      }
      setStatusMsg({
        type: 'ok',
        text: `Verified passkey ${matched ? `"${matched.label}"` : assertion.id.slice(0, 12) + '…'} via WebAuthn assertion.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Passkey verification failed.';
      setStatusMsg({ type: 'err', text: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (id: string) => {
    savePasskeys(passkeys.filter((p) => p.id !== id));
    setStatusMsg({ type: 'ok', text: 'Passkey removed from local enclave registry.' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/80 p-4">
        <div className="flex items-center gap-3">
          <Fingerprint className="h-5 w-5 text-[#00D4FF]" />
          <div>
            <div className="font-orbitron text-xs font-bold tracking-wider text-[#F8FAFC]">
              WEBAUTHN / FIDO2 PASSKEYS
            </div>
            <div className="font-mono-tech text-[11px] text-[#7B9BB5]">
              RP ID: {typeof window !== 'undefined' ? window.location.hostname : 'localhost'} · Platform Authenticator:{' '}
              {platformAvailable === null ? 'checking…' : platformAvailable ? 'available' : 'unavailable / external key only'}
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={busy || !webAuthnSupported}
          onClick={() => handleVerify()}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#00D4FF]/40 bg-[#00D4FF]/15 px-3 py-1.5 text-xs font-bold text-[#00D4FF] hover:bg-[#00D4FF]/25 disabled:opacity-40"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Verify Passkey
        </button>
      </div>

      {!webAuthnSupported && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FF7A18]/40 bg-[#FF7A18]/10 px-4 py-3 text-xs text-[#FF7A18]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          WebAuthn (`PublicKeyCredential`) is not available in this browser context.
        </div>
      )}

      {statusMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs ${
            statusMsg.type === 'ok'
              ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
              : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
          }`}
        >
          {statusMsg.type === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/80 p-4">
        <div className="font-orbitron mb-2.5 text-[11px] font-bold tracking-wider text-[#00D4FF]">
          REGISTER NEW PASSKEY
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Passkey label (e.g. MacBook Touch ID, YubiKey 5C)"
            className="min-w-[240px] flex-1 rounded-md border border-[#00D4FF]/25 bg-[#0B1020] px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#7B9BB5]"
          />
          <button
            type="button"
            disabled={busy || !webAuthnSupported}
            onClick={handleRegister}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#FF2E9F]/50 bg-[#FF2E9F]/15 px-4 py-2 text-xs font-bold text-[#FF2E9F] hover:bg-[#FF2E9F]/25 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            {busy ? 'Waiting for authenticator…' : 'Register Passkey'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-orbitron text-[11px] font-bold tracking-wider text-[#7B9BB5]">
          REGISTERED PASSKEYS ({passkeys.length})
        </div>
        {passkeys.length === 0 ? (
          <div className="rounded-xl border border-[#00D4FF]/15 bg-[#060D1F]/60 p-6 text-center text-xs text-[#7B9BB5]">
            No passkeys registered yet. Click <strong>Register Passkey</strong> above to bind a FIDO2 credential.
          </div>
        ) : (
          passkeys.map((pk) => (
            <div
              key={pk.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#00D4FF]/20 bg-[#060D1F]/80 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-[#00D4FF]" />
                <div>
                  <div className="text-xs font-bold text-[#F8FAFC]">{pk.label}</div>
                  <div className="font-mono-tech text-[11px] text-[#7B9BB5]">
                    ID: {pk.id.slice(0, 18)}… · Created {new Date(pk.createdAt).toLocaleDateString()}
                    {pk.lastVerifiedAt ? ` · Verified ${new Date(pk.lastVerifiedAt).toLocaleTimeString()}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleVerify(pk)}
                  className="rounded border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-2.5 py-1 text-[11px] font-bold text-[#00D4FF] hover:bg-[#00D4FF]/20"
                >
                  Verify
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemove(pk.id)}
                  className="rounded border border-[#EF4444]/30 bg-[#EF4444]/10 p-1.5 text-[#EF4444] hover:bg-[#EF4444]/20"
                  aria-label={`Remove ${pk.label}`}
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
