/**
 * Module Agents — the gate every identity-vector entry must pass.
 *
 * Pipeline (all real, all awaited, no simulated steps):
 *   1. VALIDATE  — field/format checks; invalid data is rejected.
 *   2. HASH      — SHA-256 ID computed on-device (see sha256Vault).
 *   3. ENCRYPT   — AES-256-GCM seal on-device. Plaintext never leaves.
 *   4. VERIFY    — a real third-party API where a FREE, keyless one
 *                  exists; a real on-device check where it doesn't.
 *                  Where neither exists the receipt honestly says
 *                  SELF_ATTESTED. Findings are never invented: an
 *                  unreachable API yields API_UNREACHABLE, not success.
 *   5. SEAL      — a receipt binding module + SHA-256 ID + verification.
 *
 * Sensitive fields (document numbers, policy IDs, passwords) are never
 * sent to any verification API. The optional password breach check uses
 * Have I Been Pwned k-anonymity: only 5 of 40 SHA-1 characters leave
 * the device, and the password is excluded from the sealed entry.
 */
import { MODULE_CONFIGS } from '../module-config';
import { sealEntry, sha256Hex } from './sha256Vault';

export type VerificationStatus =
  | 'MATCH_FOUND' // third party confirmed exposure/presence
  | 'VERIFIED' // third party / device confirmed the entry
  | 'CHECKED_NO_MATCH' // third party queried, nothing found
  | 'LOCAL_CHECK_PASSED' // real on-device check passed
  | 'LOCAL_CHECK_FAILED' // real on-device check failed
  | 'ARTEFACT_GENERATED' // agent produced a real user artefact (DSAR letter)
  | 'SELF_ATTESTED' // no free verification exists — stated honestly
  | 'API_UNREACHABLE'; // verification could not run — never faked

export interface Verification {
  status: VerificationStatus;
  /** Who/what verified it, e.g. "XposedOrNot + Cloudflare DoH (free, keyless)". */
  source: string;
  /** Human-readable, honest summary. Contains no sensitive plaintext. */
  detail: string;
  findings: { label: string; value: string }[];
  checkedAt: string;
}

export interface ModuleReceipt {
  moduleId: string;
  moduleName: string;
  /** The entry's lit-up SHA-256 ID (also the receipt id). */
  sha256Id: string;
  sovereignId: string;
  ciphertext: string;
  iv: string;
  /** Field keys present at seal time — never their values. */
  fieldKeys: string[];
  verification: Verification;
  sealedAt: string;
  /** Where the receipt is stored, reported honestly after save. */
  storage: 'FIRESTORE+LOCAL' | 'LOCAL_ONLY';
}

export type AgentStep = 'VALIDATE' | 'HASH' | 'ENCRYPT' | 'VERIFY' | 'SEAL';

export interface AgentRunResult {
  receipt: ModuleReceipt;
  /** Real artefact for the user (e.g. DSAR letter), when the agent makes one. */
  artefact?: { filename: string; text: string };
}

const now = () => new Date().toISOString();

async function fetchJson(url: string, init: RequestInit = {}, timeoutMs = 9000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (res.status === 404) return { __status: 404 };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url: string, timeoutMs = 9000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Validation (agent gate step 1) ─────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const BTC_RE = /^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
const ETH_RE = /^0x[a-fA-F0-9]{40}$/;

export function validateEntry(moduleId: string, values: Record<string, string>): string[] {
  const config = MODULE_CONFIGS[moduleId];
  const errors: string[] = [];
  if (!config) return [`Unknown module "${moduleId}".`];
  for (const field of config.dataFields) {
    const v = (values[field.key] ?? '').trim();
    if (!v) {
      if (!field.optional && field.type !== 'hidden') errors.push(`${field.label} is required.`);
      continue;
    }
    if (field.type === 'email' && !EMAIL_RE.test(v)) errors.push(`${field.label} is not a valid email address.`);
    if (field.options && !field.options.includes(v)) errors.push(`${field.label} must be one of: ${field.options.join(', ')}.`);
  }
  if (moduleId === 'network') {
    const ip = (values.ip ?? '').trim();
    if (ip && !IPV4_RE.test(ip) && !ip.includes(':')) errors.push('IP Address is not a valid IPv4/IPv6 address.');
    const mac = (values.mac ?? '').trim();
    if (mac && !/^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/.test(mac)) errors.push('MAC Address format should look like AA:BB:CC:DD:EE:FF.');
  }
  if (moduleId === 'cryptographic') {
    const addr = (values.address ?? '').trim();
    if (addr && !BTC_RE.test(addr) && !ETH_RE.test(addr)) {
      errors.push('Wallet Address is not a recognised BTC or ETH public address. Never enter a private key or seed phrase.');
    }
    if (/private|seed|mnemonic/i.test(JSON.stringify(values))) {
      errors.push('Refused: this looks like secret key material. Public addresses only.');
    }
  }
  if (moduleId === 'reputation') {
    const score = parseFloat(values.score ?? '');
    if (Number.isNaN(score) || score < 0 || score > 5) errors.push('Trust Score must be a number between 0 and 5.');
  }
  if (moduleId === 'educational' && values.year) {
    const y = new Date(values.year).getFullYear();
    if (Number.isNaN(y) || y < 1900 || y > new Date().getFullYear() + 1) errors.push('Graduation Year is out of range.');
  }
  return errors;
}

// ── Verification (agent gate step 4) ───────────────────────────────────────

async function verifyCommunication(v: Record<string, string>): Promise<Verification> {
  const findings: Verification['findings'] = [];
  let match = false;
  let answered = 0;
  const email = v.email.trim().toLowerCase();
  const domain = email.split('@')[1] ?? '';

  try {
    const mx = await fetchJson(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } },
    );
    answered++;
    const hasMx = Array.isArray(mx.Answer) && mx.Answer.length > 0;
    findings.push({ label: 'Mail (MX) records for domain', value: hasMx ? `Present (${mx.Answer.length})` : 'None found — domain cannot receive mail' });
  } catch { /* counted as unanswered below */ }

  try {
    const res = await fetchJson(`https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`);
    answered++;
    const breaches: string[] = res.breaches?.[0] ?? [];
    if (breaches.length) {
      match = true;
      findings.push({ label: 'Known breaches (XposedOrNot)', value: `${breaches.length}: ${breaches.slice(0, 8).join(', ')}${breaches.length > 8 ? '…' : ''}` });
    } else {
      findings.push({ label: 'Known breaches (XposedOrNot)', value: 'None found in the XposedOrNot corpus' });
    }
  } catch { /* unanswered */ }

  if (v.passwordCheck) {
    try {
      const sha1 = Array.from(new Uint8Array(
        await crypto.subtle.digest('SHA-1', new TextEncoder().encode(v.passwordCheck)),
      )).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const list = await fetchText(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`);
      answered++;
      const hit = list.split('\n').find((line) => line.startsWith(sha1.slice(5)));
      const count = hit ? parseInt(hit.split(':')[1] ?? '0', 10) : 0;
      if (count > 0) match = true;
      findings.push({
        label: 'Password exposure (HIBP k-anonymity)',
        value: count > 0 ? `Seen ${count.toLocaleString()} times in breach corpora — do not use this password` : 'Not found in the HIBP password corpus',
      });
    } catch { /* unanswered */ }
  }

  if (!answered) {
    return { status: 'API_UNREACHABLE', source: 'XposedOrNot · Cloudflare DoH · HIBP (free, keyless)', detail: 'No verification API answered (offline or blocked). Entry was still hashed and encrypted on-device; re-run to verify.', findings, checkedAt: now() };
  }
  return {
    status: match ? 'MATCH_FOUND' : 'CHECKED_NO_MATCH',
    source: 'XposedOrNot · Cloudflare DoH · Have I Been Pwned (free, keyless)',
    detail: match
      ? 'A third party reports exposure for this entry. Rotate affected credentials and enable passkeys/2FA.'
      : 'Free third-party sources answered and report no exposure for this entry. This is not a guarantee — corpora are incomplete.',
    findings,
    checkedAt: now(),
  };
}

async function verifySocial(v: Record<string, string>): Promise<Verification> {
  if (v.platform !== 'GitHub') {
    return { status: 'SELF_ATTESTED', source: 'None — no free verification API', detail: `${v.platform} offers no free, keyless API to verify a handle, so this entry is sealed as self-attested. GitHub handles get real API verification.`, findings: [], checkedAt: now() };
  }
  const handle = v.handle.trim().replace(/^@/, '').replace(/.*github\.com\//, '').replace(/\/$/, '');
  try {
    const user = await fetchJson(`https://api.github.com/users/${encodeURIComponent(handle)}`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (user.__status === 404) {
      return { status: 'CHECKED_NO_MATCH', source: 'GitHub REST API (free, keyless)', detail: `GitHub reports no public account for "${handle}".`, findings: [], checkedAt: now() };
    }
    return {
      status: 'VERIFIED',
      source: 'GitHub REST API (free, keyless)',
      detail: 'GitHub confirms this public account exists. This verifies existence, not that you own it — ownership requires an OAuth login.',
      findings: [
        { label: 'GitHub account', value: String(user.login) },
        { label: 'Account created', value: String(user.created_at ?? '').slice(0, 10) },
        { label: 'Public repos', value: String(user.public_repos ?? 0) },
        { label: '2FA note', value: 'Enable a passkey on GitHub: Settings → Password and authentication' },
      ],
      checkedAt: now(),
    };
  } catch {
    return { status: 'API_UNREACHABLE', source: 'GitHub REST API (free, keyless)', detail: 'GitHub API did not answer (offline or rate-limited). Entry sealed without verification — re-run later.', findings: [], checkedAt: now() };
  }
}

async function verifyNetwork(v: Record<string, string>): Promise<Verification> {
  const ip = v.ip.trim();
  const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|::1$|fe80:)/.test(ip);
  if (isPrivate) {
    return { status: 'LOCAL_CHECK_PASSED', source: 'On-device range check', detail: 'This is a private (LAN) address: not routable on the public internet, so no remote lookup applies. MAC/UUID cannot be verified remotely and are self-attested.', findings: [{ label: 'Address class', value: 'Private / non-routable' }], checkedAt: now() };
  }
  try {
    const info = await fetchJson(`https://ipwho.is/${encodeURIComponent(ip)}`);
    if (info.success === false) throw new Error('lookup failed');
    return {
      status: 'VERIFIED',
      source: 'ipwho.is IP intelligence (free, keyless)',
      detail: 'Public IP resolved by a third party. Country/ISP only are recorded on the receipt — no precise location is kept.',
      findings: [
        { label: 'Country', value: String(info.country ?? 'unknown') },
        { label: 'ISP / ASN org', value: String(info.connection?.isp ?? 'unknown') },
        { label: 'Connection type', value: String(info.type ?? 'unknown') },
      ],
      checkedAt: now(),
    };
  } catch {
    return { status: 'API_UNREACHABLE', source: 'ipwho.is (free, keyless)', detail: 'IP intelligence API did not answer. Entry sealed without verification — re-run later.', findings: [], checkedAt: now() };
  }
}

async function verifyCryptographic(v: Record<string, string>): Promise<Verification> {
  const addr = v.address.trim();
  try {
    if (BTC_RE.test(addr)) {
      const info = await fetchJson(`https://mempool.space/api/address/${addr}`);
      const stats = info.chain_stats ?? {};
      return {
        status: 'VERIFIED', source: 'mempool.space (free, keyless)',
        detail: 'Bitcoin address confirmed on-chain by a third party. Public-chain data only; ownership would require a wallet signature, which this app never asks for.',
        findings: [
          { label: 'Chain', value: 'Bitcoin' },
          { label: 'Confirmed transactions', value: String(stats.tx_count ?? 0) },
          { label: 'Ever funded', value: (stats.funded_txo_sum ?? 0) > 0 ? 'Yes' : 'No' },
        ],
        checkedAt: now(),
      };
    }
    if (ETH_RE.test(addr)) {
      const rpc = async (method: string, params: unknown[]) => {
        const res = await fetchJson('https://eth.llamarpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        if (res.error) throw new Error('rpc error');
        return res.result as string;
      };
      const balanceWei = BigInt(await rpc('eth_getBalance', [addr, 'latest']));
      const nonce = parseInt(await rpc('eth_getTransactionCount', [addr, 'latest']), 16);
      return {
        status: 'VERIFIED', source: 'Public Ethereum JSON-RPC — eth.llamarpc.com (free, keyless)',
        detail: 'Ethereum address read directly from a public node. Ownership would require a wallet signature, which this app never asks for.',
        findings: [
          { label: 'Chain', value: 'Ethereum' },
          { label: 'Balance', value: `${(Number(balanceWei) / 1e18).toFixed(6)} ETH` },
          { label: 'Outgoing transactions (nonce)', value: String(nonce) },
        ],
        checkedAt: now(),
      };
    }
  } catch {
    return { status: 'API_UNREACHABLE', source: 'mempool.space / eth.llamarpc.com (free, keyless)', detail: 'Chain lookup did not answer. Entry sealed without verification — re-run later.', findings: [], checkedAt: now() };
  }
  return { status: 'SELF_ATTESTED', source: 'None', detail: 'Address format was validated locally but no chain lookup applied.', findings: [], checkedAt: now() };
}

async function verifyBiometric(v: Record<string, string>): Promise<Verification> {
  let platform = false;
  try {
    platform = !!(window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()));
  } catch { platform = false; }
  return {
    status: platform ? 'LOCAL_CHECK_PASSED' : 'LOCAL_CHECK_FAILED',
    source: 'WebAuthn API on this device (real capability check)',
    detail: platform
      ? `This device reports a user-verifying platform authenticator (Face ID / Touch ID / Windows Hello class) — the hardware behind your ${v.type} selection exists here. Raw biometrics are never readable by web apps, by design.`
      : 'This device/browser reports NO user-verifying platform authenticator. Enrol a passkey on a device with biometrics or use a hardware security key.',
    findings: [{ label: 'Platform authenticator', value: platform ? 'Available' : 'Not available' }],
    checkedAt: now(),
  };
}

async function verifyLocation(v: Record<string, string>): Promise<Verification> {
  try {
    const results = await fetchJson(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(v.address)}`,
    );
    const hit = Array.isArray(results) ? results[0] : null;
    if (!hit) {
      return { status: 'CHECKED_NO_MATCH', source: 'OpenStreetMap Nominatim (free)', detail: 'The address text did not resolve to a known place. Check spelling, or use city + country only.', findings: [], checkedAt: now() };
    }
    return {
      status: 'VERIFIED', source: 'OpenStreetMap Nominatim (free)',
      detail: 'Address resolves to a real place. Only place type and country are recorded on the receipt — never the street address.',
      findings: [
        { label: 'Place type', value: `${hit.class ?? ''}/${hit.type ?? ''}` },
        { label: 'Country', value: String(hit.address?.country ?? 'unknown') },
      ],
      checkedAt: now(),
    };
  } catch {
    return { status: 'API_UNREACHABLE', source: 'OpenStreetMap Nominatim (free)', detail: 'Geocoding did not answer. Entry sealed without verification — re-run later.', findings: [], checkedAt: now() };
  }
}

function selfAttested(reason: string, source = 'None — no free verification API'): Verification {
  return { status: 'SELF_ATTESTED', source, detail: reason, findings: [], checkedAt: now() };
}

async function verify(
  moduleId: string,
  v: Record<string, string>,
): Promise<{ verification: Verification; artefact?: AgentRunResult['artefact'] }> {
  switch (moduleId) {
    case 'communication': return { verification: await verifyCommunication(v) };
    case 'social': return { verification: await verifySocial(v) };
    case 'network': return { verification: await verifyNetwork(v) };
    case 'cryptographic': return { verification: await verifyCryptographic(v) };
    case 'biometric': return { verification: await verifyBiometric(v) };
    case 'location': return { verification: await verifyLocation(v) };
    case 'privacy_reclaim': {
      const letter = [
        `DATA ERASURE / OPT-OUT REQUEST`,
        `To: ${v.institution} (Privacy Officer)`,
        `Date: ${new Date().toDateString()}`,
        `Jurisdiction: ${v.jurisdiction}`,
        `Account type referenced: ${v.accountType}`,
        ``,
        `Under ${v.jurisdiction.includes('GDPR') ? 'GDPR Article 17 (Right to Erasure)' : 'the California Consumer Privacy Act as amended by the CPRA (§1798.105, Right to Delete)'},`,
        `I request that you delete all personal information you hold about me,`,
        `confirm deletion in writing, and instruct any service providers or`,
        `contractors to do the same. I am the data subject / consumer named in`,
        `my account with you and can verify my identity through your normal`,
        `authenticated channels. Please respond within the statutory period.`,
        ``,
        `[Add your legal name and account email before sending. This letter was`,
        ` generated on-device by Agape Sovereign; nothing was sent automatically.]`,
      ].join('\n');
      const letterHash = await sha256Hex(letter);
      return {
        verification: {
          status: 'ARTEFACT_GENERATED',
          source: 'On-device document generation',
          detail: 'A real statutory erasure-request letter was generated for you to send. Nothing is submitted automatically — brokers require your own identity verification, and any service claiming otherwise is misleading you.',
          findings: [{ label: 'Letter SHA-256', value: letterHash.slice(0, 32) + '…' }],
          checkedAt: now(),
        },
        artefact: { filename: `erasure-request-${v.institution.replace(/\W+/g, '-').toLowerCase()}.txt`, text: letter },
      };
    }
    case 'legal': {
      const doc = (v.docNumber ?? '').trim();
      const formatOk =
        v.idType === 'Passport' ? /^[A-Z0-9]{6,12}$/i.test(doc) : doc.length >= 5;
      return {
        verification: {
          status: formatOk ? 'LOCAL_CHECK_PASSED' : 'LOCAL_CHECK_FAILED',
          source: 'On-device format check only',
          detail: formatOk
            ? 'Document number format is plausible for the selected type. No government database was queried — none offers a free public verification API — and the number never left this device.'
            : 'Document number format looks unusual for the selected type. Double-check it; the sealed hash binds whatever was entered.',
          findings: [{ label: 'ID type', value: v.idType }],
          checkedAt: now(),
        },
      };
    }
    case 'permissions': {
      const expiry = new Date(v.expiry);
      const days = Math.ceil((expiry.getTime() - Date.now()) / 86_400_000);
      const ok = !Number.isNaN(expiry.getTime()) && days > 0;
      return {
        verification: {
          status: ok ? 'LOCAL_CHECK_PASSED' : 'LOCAL_CHECK_FAILED',
          source: 'On-device consent-ledger check',
          detail: ok
            ? `Consent grant is time-boxed and expires in ${days} day(s). Time-boxed grants are the correct pattern — perpetual "Full" access is the risk to avoid.`
            : 'This grant is already expired or the date is invalid. Expired grants should be revoked at the provider, not just recorded here.',
          findings: [{ label: 'Access level', value: v.access }, { label: 'Days remaining', value: String(days) }],
          checkedAt: now(),
        },
      };
    }
    case 'health':
      return { verification: selfAttested('Health records cannot be verified by any free public API (FHIR endpoints require provider-issued credentials). The policy ID never left this device; entry is sealed as self-attested.') };
    case 'professional':
      return { verification: selfAttested('Employer/certification verification (Truework, clearinghouses) is paid and credentialed — there is no free keyless API. Entry sealed as self-attested; the licence number never left this device.') };
    case 'educational':
      return { verification: selfAttested('Degree verification via the National Student Clearinghouse is a paid, consent-gated service with no free API. Entry sealed as self-attested; the student ID never left this device.') };
    case 'reputation':
      return { verification: selfAttested('Marketplace reputation scores are only available through partner APIs requiring platform approval. Score sanity was checked on-device (0–5); entry sealed as self-attested.') };
    case 'subscription':
      return { verification: selfAttested('Subscription status sits behind each provider login; no free keyless API can confirm it. Entry sealed as self-attested so you can audit and cancel deliberately.') };
    case 'behavioral':
      return { verification: selfAttested('Ad-interest categories are visible only inside each platform account (e.g. Google My Ad Center). Entry sealed as self-attested — compare it against the platform own ad-preferences page.') };
    case 'membership':
      return { verification: selfAttested('Membership registries are private to each organisation; no free public lookup exists. Entry sealed as self-attested.') };
    default:
      return { verification: selfAttested('No verification route is defined for this module; entry sealed as self-attested.') };
  }
}

// ── The gate ────────────────────────────────────────────────────────────────

export async function runModuleAgent(
  moduleId: string,
  values: Record<string, string>,
  uid: string,
  sovereignId: string,
  onStep?: (step: AgentStep, state: 'RUNNING' | 'DONE' | 'FAILED') => void,
): Promise<AgentRunResult> {
  const config = MODULE_CONFIGS[moduleId];
  if (!config) throw new Error(`Unknown module "${moduleId}".`);

  onStep?.('VALIDATE', 'RUNNING');
  const errors = validateEntry(moduleId, values);
  if (errors.length) {
    onStep?.('VALIDATE', 'FAILED');
    throw new Error(errors.join(' '));
  }
  onStep?.('VALIDATE', 'DONE');

  // Password checks are verified but never sealed/stored.
  const sealValues = { ...values };
  delete sealValues.passwordCheck;
  for (const k of Object.keys(sealValues)) if (!sealValues[k]?.trim()) delete sealValues[k];

  onStep?.('HASH', 'RUNNING');
  onStep?.('ENCRYPT', 'RUNNING');
  const sealed = await sealEntry(uid, moduleId, sealValues);
  onStep?.('HASH', 'DONE');
  onStep?.('ENCRYPT', 'DONE');

  onStep?.('VERIFY', 'RUNNING');
  const { verification, artefact } = await verify(moduleId, values);
  onStep?.('VERIFY', verification.status === 'API_UNREACHABLE' ? 'FAILED' : 'DONE');

  onStep?.('SEAL', 'RUNNING');
  const receipt: ModuleReceipt = {
    moduleId,
    moduleName: config.name,
    sha256Id: sealed.sha256Id,
    sovereignId,
    ciphertext: sealed.ciphertext,
    iv: sealed.iv,
    fieldKeys: Object.keys(sealValues),
    verification,
    sealedAt: sealed.sealedAt,
    storage: 'LOCAL_ONLY', // upgraded honestly by the caller if Firestore write succeeds
  };
  onStep?.('SEAL', 'DONE');
  return { receipt, artefact };
}
