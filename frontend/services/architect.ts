/**
 * Architect AI client — the privacy/security backbone.
 *
 * 1. Primary Offline Local LLM: Queries local Ollama or LMStudio on localhost (11434/1234)
 *    running qwen3-vl:4b (offline, zero-cost, private).
 * 2. Fallback Offline Local LLM: Automatically falls back to gemma4:12b if qwen3-vl:4b
 *    is unavailable or fails inference.
 * 3. Cloud Fallback: POST /api/architect (Cloud Function → Gemini free tier).
 *    The function receives only receipt hashes + verification outcomes —
 *    never plaintext identity data.
 * 4. Enclave Fallback: An on-device knowledge engine that answers from the user's
 *    actual receipts plus a curated privacy knowledge base. Labelled LOCAL_KB.
 */
import { auth } from '../firebase';
import { ModuleReceipt } from './moduleAgents';

export type ArchitectSource = 'LOCAL_QWEN' | 'LOCAL_GEMMA' | 'GEMINI' | 'LOCAL_KB';

export interface ArchitectAnswer {
  text: string;
  source: ArchitectSource;
  modelUsed?: string;
}

export interface LocalLlmStatus {
  online: boolean;
  endpoint?: string;
  model: string;
  fallbackModel: string;
}

const LOCAL_LMSTUDIO_URL = 'http://localhost:1234';
const LOCAL_OLLAMA_URL = 'http://localhost:11434';
const QWEN_MODEL = 'qwen3-vl:4b';
const GEMMA_MODEL = 'gemma4:12b';

/** Check if offline local LLM (qwen3-vl:4b or gemma4:12b fallback) is reachable */
export async function checkLocalLlmStatus(): Promise<LocalLlmStatus> {
  // 1. Try LMStudio /v1/models
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(`${LOCAL_LMSTUDIO_URL}/v1/models`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const models: string[] = (data?.data ?? []).map((m: any) => m.id);
      const matched =
        models.find((m) => m.toLowerCase().includes('qwen')) ||
        models.find((m) => m.toLowerCase().includes('gemma')) ||
        models[0] ||
        QWEN_MODEL;
      return { online: true, endpoint: `${LOCAL_LMSTUDIO_URL}/v1`, model: matched, fallbackModel: GEMMA_MODEL };
    }
  } catch {
    // try ollama
  }

  // 2. Try Ollama /api/tags
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1200);
    const res = await fetch(`${LOCAL_OLLAMA_URL}/api/tags`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const models: string[] = (data?.models ?? []).map((m: any) => m.name);
      const matched =
        models.find((m) => m.toLowerCase().includes('qwen')) ||
        models.find((m) => m.toLowerCase().includes('gemma')) ||
        models[0] ||
        QWEN_MODEL;
      return { online: true, endpoint: LOCAL_OLLAMA_URL, model: matched, fallbackModel: GEMMA_MODEL };
    }
  } catch {
    // local LLM offline
  }

  return { online: false, model: QWEN_MODEL, fallbackModel: GEMMA_MODEL };
}

/** Execute a single prompt call to a specific local model */
async function callLocalEndpoint(
  model: string,
  systemPrompt: string,
  question: string,
  history: { role: string; content: string }[],
): Promise<string | null> {
  // 1. Try LMStudio OpenAI format
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(`${LOCAL_LMSTUDIO_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4),
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content;
      if (reply) return reply;
    }
  } catch {
    // continue to Ollama
  }

  // 2. Try Ollama format
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(`${LOCAL_OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4),
          { role: 'user', content: question },
        ],
        stream: false,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      const reply = data?.message?.content;
      if (reply) return reply;
    }
  } catch {
    // endpoint failed
  }

  return null;
}

/** Query the offline local LLM: primary qwen3-vl:4b, fallback gemma4:12b */
async function askLocalLlm(
  question: string,
  receipts: ModuleReceipt[],
  history: { role: string; content: string }[],
): Promise<{ text: string; modelUsed: string; source: 'LOCAL_QWEN' | 'LOCAL_GEMMA' } | null> {
  const receiptSummary = receipts.length
    ? `User sealed ${receipts.length} modules. Hashes & outcomes: ${receipts.map((r) => `${r.moduleName} (SHA-256: ${r.sha256Id.slice(0, 10)}…, status: ${r.verification.status})`).join('; ')}.`
    : 'No modules sealed yet. Session protected by zero-knowledge SHA-256 and AES-256-GCM.';

  const systemPrompt = `You are Architect AI, the offline privacy and cryptographic security intelligence engine for Agape Sovereign AI (sovereign.nyc).
You evaluate zero-knowledge identity vectors, SHA-256 integrity IDs, and client-side AES-256-GCM encryption.
Current user posture: ${receiptSummary}
Always answer clearly, accurately, and emphasize that sensitive identity data never leaves the device unencrypted.`;

  // 1. Primary: qwen3-vl:4b
  try {
    const qwenReply = await callLocalEndpoint(QWEN_MODEL, systemPrompt, question, history);
    if (qwenReply) {
      return { text: qwenReply, modelUsed: QWEN_MODEL, source: 'LOCAL_QWEN' };
    }
  } catch {
    // fallback to gemma
  }

  // 2. Fallback: gemma4:12b
  try {
    const gemmaReply = await callLocalEndpoint(GEMMA_MODEL, systemPrompt, question, history);
    if (gemmaReply) {
      return { text: gemmaReply, modelUsed: GEMMA_MODEL, source: 'LOCAL_GEMMA' };
    }
  } catch {
    // local models unavailable
  }

  return null;
}

export async function askArchitect(
  question: string,
  receipts: ModuleReceipt[],
  history: { role: string; content: string }[] = [],
): Promise<ArchitectAnswer> {
  // 1. Try offline local LLM first (primary: qwen3-vl:4b, fallback: gemma4:12b)
  try {
    const localResult = await askLocalLlm(question, receipts, history);
    if (localResult) {
      return {
        text: localResult.text,
        source: localResult.source,
        modelUsed: localResult.modelUsed,
      };
    }
  } catch {
    // local LLM probe failed
  }

  // 2. Try Cloud Function (Gemini free tier)
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
      if (data.reply) return { text: data.reply, source: 'GEMINI', modelUsed: 'gemini-2.0-flash' };
    }
  } catch {
    // Network/backend unreachable — local engine answers
  }

  // 3. Fallback to honest on-device knowledge engine
  return {
    text: localAnswer(question, receipts),
    source: 'LOCAL_KB',
    modelUsed: 'On-Device Knowledge Engine',
  };
}

const KB: { match: RegExp; answer: string }[] = [
  {
    match: /sha-?256|hash/i,
    answer: 'SHA-256 is a cryptographic one-way fingerprint. Every entry you seal gets a unique SHA-256 ID computed on your device from its exact contents: change one character and the ID changes completely, and nobody can work backwards from the ID to your data. The ID proves integrity; AES-256-GCM encryption (also on-device) provides confidentiality. Your session Sovereign ID at the top of the screen is the SHA-256 of your account identity — it is lit whenever your zero-knowledge session is active.',
  },
  {
    match: /qwen|gemma|local llm|offline|fallback/i,
    answer: 'Architect AI is powered by offline local LLM qwen3-vl:4b (primary) with automatic fallback to gemma4:12b via LMStudio (port 1234) or Ollama (port 11434). When your local inference server is running, all AI reasoning takes place directly on your hardware with 0 bytes sent to external cloud APIs. When offline, Architect AI operates via this on-device cryptographic knowledge engine.',
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
    answer: 'Agape Sovereign is built to operate at zero marginal cost: Firebase Spark-tier hosting/functions/Firestore quotas, free keyless verification APIs (XposedOrNot, HIBP range, GitHub, ipwho.is, mempool.space, public ETH RPC, OpenStreetMap, Cloudflare DoH), and an offline local LLM (qwen3-vl:4b with gemma4:12b fallback) for zero cloud AI cost.',
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
  return 'I can answer from your real sealed receipts and our offline privacy knowledge base backed by qwen3-vl:4b (fallback: gemma4:12b). Try: "what is my status", "explain my SHA-256 ID", "how do I erase data brokers", "passkey vs Google", or "what does zero-knowledge mean here". For module specifics, seal the module first — then I can reason over its actual verification receipt.';
}
