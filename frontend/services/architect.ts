/**
 * Architect AI client — the privacy/security backbone.
 *
 * Primary: POST /api/architect (Cloud Function → Gemini free tier).
 * The function receives only receipt hashes + verification outcomes —
 * never plaintext identity data.
 *
 * Fallback: an on-device knowledge engine that answers from the user's
 * actual receipts plus a curated privacy knowledge base. It is always
 * labelled LOCAL_KB so the user can tell a local answer from a model
 * answer. It never pretends to be a cloud model.
 */
import { auth } from '../firebase';
import { ModuleReceipt } from './moduleAgents';

export type ArchitectSource = 'GEMINI' | 'LOCAL_KB';

export interface ArchitectAnswer {
  text: string;
  source: ArchitectSource;
}

export async function askArchitect(
  question: string,
  receipts: ModuleReceipt[],
  history: { role: string; content: string }[] = [],
): Promise<ArchitectAnswer> {
  try {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    const res = await fetch('/api/architect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        message: question,
        history: history.slice(-8),
        receipts: receipts.map((r) => ({
          module: r.moduleName,
          sha256Id: r.sha256Id.slice(0, 16),
          status: r.verification.status,
          source: r.verification.source,
          sealedAt: r.sealedAt,
        })),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return { text: data.reply, source: 'GEMINI' };
    }
    // 501 = GEMINI_API_KEY secret not configured yet; any other failure
    // falls through to the honest local engine below.
  } catch {
    // Network/backend unreachable — local engine answers, labelled as such.
  }
  return { text: localAnswer(question, receipts), source: 'LOCAL_KB' };
}

const KB: { match: RegExp; answer: string }[] = [
  {
    match: /sha-?256|hash/i,
    answer: 'SHA-256 is a one-way fingerprint. Every entry you seal gets a SHA-256 ID computed on your device from its exact contents: change one character and the ID changes completely, and nobody can work backwards from the ID to your data. The ID proves integrity; AES-256-GCM encryption (also on-device) provides secrecy. Your session Sovereign ID at the top of the screen is the SHA-256 of your account identity — it is lit whenever your zero-knowledge session is active.',
  },
  {
    match: /zero.knowledge|who can see|can you (read|see)|stored where/i,
    answer: 'Zero-knowledge here is literal: your entries are hashed and AES-256-GCM encrypted in your browser before anything is stored. Servers (including Agape Firestore) only ever hold ciphertext plus the SHA-256 ID — there is no server-side key, so Agape staff cannot read your identity data. Sensitive fields (document/policy numbers, passwords) never leave the device at all. The trade-off is real: sealed values are only re-enterable by you, so keep your 26-month audit PDF.',
  },
  {
    match: /passkey|webauthn|fido/i,
    answer: 'A passkey is a FIDO2/WebAuthn credential bound to your device biometrics or a hardware key. It cannot be phished (it only works on the real origin), cannot be replayed (every login signs a fresh challenge), and there is no shared secret for a breach to steal. Passkey is sign-in method #1 here; Google is #2 and adds account recovery plus one-click Drive saving of your audit PDF.',
  },
  {
    match: /google|drive|federated/i,
    answer: 'Sign in with Google is the federated method: Google verifies you (with its own 2-Step/passkey protections), and Agape never sees your Google password. Dual protection comes from combining it with a device passkey. Google sign-in also grants the least-privilege drive.file scope so your 26-month Identity Audit PDF can be saved into your own Google Drive — Agape can only touch files it created, never your whole Drive.',
  },
  {
    match: /breach|pwned|leak/i,
    answer: 'The Communication module checks your email against the free XposedOrNot breach corpus and your domain MX via Cloudflare DNS. The optional password check uses Have I Been Pwned k-anonymity: only the first 5 of 40 hash characters leave your device. If a receipt says MATCH_FOUND, rotate that credential everywhere it was reused and prefer passkeys; treat "no match" as "not in that corpus", never as a guarantee.',
  },
  {
    match: /broker|opt.?out|erase|delet|gdpr|ccpa/i,
    answer: 'There is no free API that deletes you from data brokers — anyone claiming fully automatic deletion without your identity verification is misleading you. The Privacy Reclaim module generates a real statutory erasure letter (CCPA §1798.105 or GDPR Art. 17) on your device for you to send; brokers must answer within the statutory period (45 days CCPA, one month GDPR). Re-run monthly per your audit schedule because brokers re-list.',
  },
  {
    match: /26|audit|pdf|report/i,
    answer: 'Your Identity Audit PDF covers a 26-month window from the day it is generated: every sealed receipt with its SHA-256 ID and verification source, a monthly re-verification checkpoint schedule, and an expiry date after which receipts are stale. Generate it from the Report tab — download it anywhere, or (Google sign-in) save it directly to your Drive. Regenerate after sealing new modules so the document stays complete.',
  },
  {
    match: /score|risk|how (safe|secure) am i/i,
    answer: 'There is no invented score in this app. Your real posture is the receipt ledger: how many of the 16 vectors are sealed, how many are third-party VERIFIED versus SELF_ATTESTED, and — most important — whether any receipt says MATCH_FOUND. Ask me "what is my status" and I will summarise your actual receipts.',
  },
  {
    match: /vpn|tor|track/i,
    answer: 'Practical layering: a reputable VPN hides your traffic from your ISP/local network but shifts trust to the VPN provider; Tor adds anonymity at the cost of speed and some site breakage; neither fixes account-level tracking once you log in. Combine with passkeys, per-service email aliases, and the Network module to know what your public IP reveals (it uses real ipwho.is intelligence).',
  },
  {
    match: /cost|free|price|pay/i,
    answer: 'Agape Sovereign is built to operate at zero marginal cost: Firebase Spark-tier hosting/functions/Firestore quotas, free keyless verification APIs (XposedOrNot, HIBP range, GitHub, ipwho.is, mempool.space, public ETH RPC, OpenStreetMap, Cloudflare DoH), and Gemini free tier for Architect AI when the owner key is configured. Where only paid verification exists, receipts honestly say SELF_ATTESTED instead of faking a check.',
  },
];

export function localAnswer(question: string, receipts: ModuleReceipt[]): string {
  const q = question.toLowerCase();
  if (/status|my (data|result|receipt|module)|what.*(done|sealed)/.test(q)) {
    if (!receipts.length) {
      return 'You have no sealed modules yet, so I have no real results to analyse — and I will not invent any. Open a module from the dashboard (start with Communication for a real breach check), pass the Module Agent gate, and your receipt will appear here with its SHA-256 ID.';
    }
    const byStatus = receipts.reduce<Record<string, number>>((acc, r) => {
      acc[r.verification.status] = (acc[r.verification.status] ?? 0) + 1;
      return acc;
    }, {});
    const modules = new Set(receipts.map((r) => r.moduleId)).size;
    const matches = receipts.filter((r) => r.verification.status === 'MATCH_FOUND');
    let out = `Your real ledger: ${receipts.length} sealed entr${receipts.length === 1 ? 'y' : 'ies'} across ${modules} of 16 modules. Outcomes: ${Object.entries(byStatus).map(([k, v]) => `${k} ×${v}`).join(', ')}.`;
    if (matches.length) {
      out += `\n\n⚠ Action needed — third parties reported exposure in: ${matches.map((r) => `${r.moduleName} (${r.verification.findings[0]?.value ?? 'see receipt'})`).join('; ')}. Rotate those credentials and move the accounts to passkeys.`;
    }
    const staleCutoff = Date.now() - 30 * 86_400_000;
    const stale = receipts.filter((r) => new Date(r.sealedAt).getTime() < staleCutoff);
    if (stale.length) out += `\n\n${stale.length} receipt(s) are 30+ days old — re-run those module agents at your next monthly checkpoint.`;
    out += '\n\nGenerate the 26-month audit from the Report tab to freeze this state into a SHA-256-sealed PDF.';
    return out;
  }
  for (const item of KB) if (item.match.test(q)) return item.answer;
  return 'I can answer from your real sealed receipts and our privacy knowledge base (the cloud model is not configured on this deployment, so you are getting the honest local engine). Try: "what is my status", "explain my SHA-256 ID", "how do I erase data brokers", "passkey vs Google", or "what does zero-knowledge mean here". For module specifics, seal the module first — then I can reason over its actual verification receipt.';
}
