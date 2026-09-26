/**
 * THIRD-PARTY VERIFICATION SERVICE
 * ============================================================
 * Independent verification of Identity Vector Module (IVM) results.
 *
 * HARD RULES
 *  1. Every result in this platform is either (a) verified by an external
 *     third-party API, or (b) explicitly labelled UNVERIFIED with a factual
 *     statement of what was (and was not) measured.
 *  2. Fabricated, placeholder, mock or simulated findings are banned. If a
 *     source is unreachable, rate-limited, or not configured, the outcome is
 *     reported as UNAVAILABLE / NOT_CONFIGURED — never invented.
 *  3. Zero cost: only free, no-subscription endpoints are used. Paid APIs are
 *     opt-in via environment keys and degrade to NOT_CONFIGURED when absent.
 *  4. Zero knowledge: verifiers receive the minimum disclosure required.
 *     Password verification uses SHA-1 k-anonymity (5 hex chars leave device).
 *     Nothing is sent that is not strictly required by the source contract.
 * ============================================================
 */

export type VerificationSourceId =
  | 'pwnedpasswords'      // Have I Been Pwned — Pwned Passwords (k-anonymity, free, no key)
  | 'xposedornot'         // XposedOrNot breach index (free, no key)
  | 'dns-doh-google'      // Google DNS-over-HTTPS resolver (free, no key)
  | 'crt-sh'              // Certificate Transparency log search (free, no key)
  | 'github-user-api'     // GitHub public user API (free, no key)
  | 'mozilla-observatory' // Mozilla HTTP Observatory (free, no key)
  | 'nvd-cve'             // NIST National Vulnerability Database (free, no key)
  | 'urlhaus'             // abuse.ch URLhaus malware URL feed (free, no key)
  | 'haveibeenpwned'      // HIBP v3 breach search (paid key — opt-in)
  | 'local-attestation';  // Real on-device measurement (not a third party)

export type VerificationOutcome =
  | 'EXPOSED'        // third party confirmed exposure / weakness
  | 'CLEAN'          // third party confirmed no exposure for this query
  | 'INCONCLUSIVE'   // third party answered, but the answer is not decisive
  | 'UNAVAILABLE'    // network / CORS / rate-limit failure
  | 'NOT_CONFIGURED' // source requires credentials that are not present
  | 'NOT_APPLICABLE';// verifier does not apply to the supplied input

export interface VerificationReport {
  sourceId: VerificationSourceId;
  source: string;
  endpoint: string;
  /** Exactly what was transmitted to the third party (post-minimisation). */
  query: string;
  checkedAt: string;
  verified: boolean;
  outcome: VerificationOutcome;
  evidence: string;
  httpStatus?: number;
  error?: string;
  /** Machine-readable facts, for the audit trail and Architect AI grounding. */
  facts?: Record<string, string | number | boolean | string[]>;
}

export interface VerifyInput {
  /** Canonical module id, e.g. 'email' | 'password' | 'browser'. */
  moduleId: string;
  /** The user-entered value the module operates on. */
  value: string;
  /** Optional secondary value (e.g. domain extracted from an email). */
  secondaryValue?: string;
  signal?: AbortSignal;
}

export type Verifier = (input: VerifyInput, ctx: VerificationContext) => Promise<VerificationReport>;

export interface VerificationContext {
  fetchImpl: typeof fetch;
  timeoutMs: number;
  /** Optional key material for opt-in paid sources. */
  keys?: { hibpApiKey?: string };
}

const SOURCE_NAMES: Record<VerificationSourceId, string> = {
  pwnedpasswords: 'Have I Been Pwned — Pwned Passwords',
  xposedornot: 'XposedOrNot Breach Index',
  'dns-doh-google': 'Google Public DNS (DNS-over-HTTPS)',
  'crt-sh': 'crt.sh Certificate Transparency',
  'github-user-api': 'GitHub Public User API',
  'mozilla-observatory': 'Mozilla HTTP Observatory',
  'nvd-cve': 'NIST National Vulnerability Database',
  urlhaus: 'abuse.ch URLhaus',
  haveibeenpwned: 'Have I Been Pwned v3',
  'local-attestation': 'On-device attestation (no third party)',
};

function env(key: string): string {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
    return meta.env?.[key] || '';
  } catch {
    return '';
  }
}

function report(
  sourceId: VerificationSourceId,
  endpoint: string,
  query: string,
  partial: Omit<VerificationReport, 'sourceId' | 'source' | 'endpoint' | 'query' | 'checkedAt'>,
): VerificationReport {
  return {
    sourceId,
    source: SOURCE_NAMES[sourceId],
    endpoint,
    query,
    checkedAt: new Date().toISOString(),
    ...partial,
  };
}

function unavailable(
  sourceId: VerificationSourceId,
  endpoint: string,
  query: string,
  error: unknown,
  httpStatus?: number,
): VerificationReport {
  const message = error instanceof Error ? error.message : String(error);
  return report(sourceId, endpoint, query, {
    verified: false,
    outcome: 'UNAVAILABLE',
    evidence: `Third-party source did not return a usable response. No result was inferred.`,
    error: message,
    httpStatus,
  });
}

async function timedFetch(
  ctx: VerificationContext,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ctx.timeoutMs);
  try {
    return await ctx.fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function domainFromEmail(email: string): string {
  const at = email.lastIndexOf('@');
  return at === -1 ? '' : email.slice(at + 1).toLowerCase();
}

function normalizeHost(value: string): string {
  let host = value.trim().toLowerCase();
  host = host.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return host.split(':')[0];
}

/* ────────────────────────────── verifiers ────────────────────────────── */

/**
 * Pwned Passwords range API — k-anonymity.
 * Only the first 5 hex characters of the SHA-1 digest leave the device.
 */
export const pwnedPasswordsVerifier: Verifier = async (input, ctx) => {
  const fullHash = await sha1Hex(input.value);
  const prefix = fullHash.slice(0, 5);
  const suffix = fullHash.slice(5);
  const endpoint = `https://api.pwnedpasswords.com/range/${prefix}`;

  try {
    const res = await timedFetch(ctx, endpoint, { headers: { 'Add-Padding': 'true' } });
    if (!res.ok) return unavailable('pwnedpasswords', endpoint, `SHA-1 prefix ${prefix}`, new Error(`HTTP ${res.status}`), res.status);

    const body = await res.text();
    let count = 0;
    for (const line of body.split('\n')) {
      const [hashSuffix, occurrences] = line.trim().split(':');
      if (hashSuffix?.toUpperCase() === suffix) {
        count = parseInt(occurrences || '0', 10) || 0;
        break;
      }
    }

    if (count > 0) {
      return report('pwnedpasswords', endpoint, `SHA-1 prefix ${prefix} (k-anonymity)`, {
        verified: true,
        outcome: 'EXPOSED',
        evidence: `Credential appears ${count.toLocaleString()} time(s) in the Pwned Passwords corpus.`,
        httpStatus: res.status,
        facts: { occurrences: count, kAnonymity: true, transmittedChars: 5 },
      });
    }
    return report('pwnedpasswords', endpoint, `SHA-1 prefix ${prefix} (k-anonymity)`, {
      verified: true,
      outcome: 'CLEAN',
      evidence: 'Credential not present in the Pwned Passwords corpus for this hash range.',
      httpStatus: res.status,
      facts: { occurrences: 0, kAnonymity: true, transmittedChars: 5 },
    });
  } catch (err) {
    return unavailable('pwnedpasswords', endpoint, `SHA-1 prefix ${prefix}`, err);
  }
};

/** XposedOrNot — email breach index (free, keyless). */
export const xposedOrNotVerifier: Verifier = async (input, ctx) => {
  const email = input.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const endpoint = 'https://api.xposedornot.com/v1/check-email/';
    return report('xposedornot', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'Value is not an email address; breach index lookup skipped.',
    });
  }

  const endpoint = `https://api.xposedornot.com/v1/check-email/${encodeURIComponent(email)}`;
  try {
    const res = await timedFetch(ctx, endpoint);
    if (res.status === 404) {
      return report('xposedornot', endpoint, email, {
        verified: true,
        outcome: 'CLEAN',
        evidence: 'XposedOrNot returned 404 — no breach records indexed for this address.',
        httpStatus: 404,
        facts: { breachCount: 0 },
      });
    }
    if (!res.ok) return unavailable('xposedornot', endpoint, email, new Error(`HTTP ${res.status}`), res.status);

    const data = await res.json() as { breaches?: unknown };
    const raw = data?.breaches;
    let breaches: string[] = [];
    if (Array.isArray(raw)) {
      breaches = raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null
        ? Object.keys(raw[0] as Record<string, unknown>)
        : raw.map(String);
    } else if (raw && typeof raw === 'object') {
      breaches = Object.keys(raw as Record<string, unknown>);
    }

    if (breaches.length > 0) {
      return report('xposedornot', endpoint, email, {
        verified: true,
        outcome: 'EXPOSED',
        evidence: `Address indexed in ${breaches.length} breach dataset(s): ${breaches.slice(0, 6).join(', ')}${breaches.length > 6 ? ', …' : ''}.`,
        httpStatus: res.status,
        facts: { breachCount: breaches.length, breaches: breaches.slice(0, 20) },
      });
    }
    return report('xposedornot', endpoint, email, {
      verified: true,
      outcome: 'CLEAN',
      evidence: 'XposedOrNot returned an empty breach set for this address.',
      httpStatus: res.status,
      facts: { breachCount: 0 },
    });
  } catch (err) {
    return unavailable('xposedornot', endpoint, email, err);
  }
};

/** Google DNS-over-HTTPS — MX / SPF / DMARC record verification. */
export const dnsDohVerifier: Verifier = async (input, ctx) => {
  const domain = normalizeHost(input.secondaryValue || domainFromEmail(input.value) || input.value);
  const endpoint = 'https://dns.google/resolve';
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return report('dns-doh-google', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'No hostname could be derived from the supplied value; DNS verification skipped.',
    });
  }

  const queries: Array<{ type: string; name: string }> = [
    { type: 'MX', name: domain },
    { type: 'TXT', name: domain },
    { type: 'TXT', name: `_dmarc.${domain}` },
    { type: 'A', name: domain },
  ];

  try {
    const results = await Promise.all(queries.map(async ({ type, name }) => {
      const url = `${endpoint}?name=${encodeURIComponent(name)}&type=${type}`;
      const res = await timedFetch(ctx, url, { headers: { accept: 'application/dns-json' } });
      if (!res.ok) throw new Error(`DNS ${type} HTTP ${res.status}`);
      const json = await res.json() as { Answer?: Array<{ data: string }>; Status?: number };
      return { type, name, answers: (json.Answer || []).map(a => a.data) };
    }));

    const mx = results.find(r => r.type === 'MX')?.answers || [];
    const txt = results.find(r => r.type === 'TXT' && r.name === domain)?.answers || [];
    const dmarc = results.find(r => r.type === 'TXT' && r.name.startsWith('_dmarc.'))?.answers || [];
    const a = results.find(r => r.type === 'A')?.answers || [];

    const spf = txt.filter(t => /v=spf1/i.test(t));
    const hasSpf = spf.length > 0;
    const hasDmarc = dmarc.some(t => /v=DMARC1/i.test(t));
    const hasMx = mx.length > 0;
    const resolves = a.length > 0 || hasMx;

    const facts = { mxCount: mx.length, spfCount: spf.length, dmarcCount: dmarc.length, aCount: a.length };
    const weaknesses: string[] = [];
    if (hasMx && !hasSpf) weaknesses.push('no SPF record');
    if (hasMx && !hasDmarc) weaknesses.push('no DMARC policy');
    if (!resolves) weaknesses.push('domain does not resolve');

    const evidence = [
      `MX: ${mx.length} record(s)`,
      `SPF: ${hasSpf ? spf[0].replace(/"/g, '').slice(0, 90) : 'absent'}`,
      `DMARC: ${hasDmarc ? 'published' : 'absent'}`,
      `A: ${a.length} record(s)`,
    ].join(' · ');

    return report('dns-doh-google', endpoint, domain, {
      verified: true,
      outcome: !resolves ? 'INCONCLUSIVE' : weaknesses.length > 0 ? 'EXPOSED' : 'CLEAN',
      evidence: weaknesses.length > 0 ? `${evidence} — weakness: ${weaknesses.join(', ')}.` : `${evidence} — mail authentication records present.`,
      httpStatus: 200,
      facts,
    });
  } catch (err) {
    return unavailable('dns-doh-google', endpoint, domain, err);
  }
};

/** crt.sh Certificate Transparency — certificate issuance history for a host. */
export const crtShVerifier: Verifier = async (input, ctx) => {
  const domain = normalizeHost(input.secondaryValue || domainFromEmail(input.value) || input.value);
  const endpoint = `https://crt.sh/?q=${encodeURIComponent(`%.${domain}`)}&output=json`;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return report('crt-sh', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'No hostname could be derived from the supplied value; CT lookup skipped.',
    });
  }

  try {
    const res = await timedFetch(ctx, endpoint);
    if (!res.ok) return unavailable('crt-sh', endpoint, domain, new Error(`HTTP ${res.status}`), res.status);

    const text = await res.text();
    let entries: Array<{ common_name?: string; not_before?: string; issuer_name?: string }> = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) entries = parsed;
    } catch {
      return report('crt-sh', endpoint, domain, {
        verified: false,
        outcome: 'UNAVAILABLE',
        evidence: 'crt.sh returned a non-JSON payload (service degraded). No result was inferred.',
        httpStatus: res.status,
      });
    }

    const unique = new Map<string, string>();
    for (const entry of entries) {
      const name = entry.common_name || '';
      if (name) unique.set(name, entry.not_before || '');
    }
    const names = Array.from(unique.keys());
    const subdomains = names.filter(n => n !== domain && n.endsWith(`.${domain}`));

    return report('crt-sh', endpoint, domain, {
      verified: true,
      outcome: entries.length > 0 ? 'INCONCLUSIVE' : 'CLEAN',
      evidence: entries.length > 0
        ? `${entries.length} CT log entr(ies); ${subdomains.length} subdomain name(s) ever issued: ${subdomains.slice(0, 6).join(', ')}${subdomains.length > 6 ? ', …' : ''}.`
        : 'No certificate transparency entries found for this domain.',
      httpStatus: res.status,
      facts: { ctEntries: entries.length, distinctNames: names.length, subdomains: subdomains.slice(0, 25) },
    });
  } catch (err) {
    return unavailable('crt-sh', endpoint, domain, err);
  }
};

/** GitHub public user API — real public-footprint check for a handle. */
export const githubUserVerifier: Verifier = async (input, ctx) => {
  const handle = input.value.trim().replace(/^@/, '');
  const endpoint = `https://api.github.com/users/${encodeURIComponent(handle)}`;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(handle)) {
    return report('github-user-api', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'Value is not a valid handle format; GitHub footprint check skipped.',
    });
  }

  try {
    const res = await timedFetch(ctx, endpoint, { headers: { accept: 'application/vnd.github+json' } });
    if (res.status === 404) {
      return report('github-user-api', endpoint, handle, {
        verified: true,
        outcome: 'CLEAN',
        evidence: `No GitHub account registered for "${handle}" (HTTP 404).`,
        httpStatus: 404,
        facts: { exists: false },
      });
    }
    if (res.status === 403 || res.status === 429) {
      return unavailable('github-user-api', endpoint, handle, new Error('rate limited (HTTP 403/429)'), res.status);
    }
    if (!res.ok) return unavailable('github-user-api', endpoint, handle, new Error(`HTTP ${res.status}`), res.status);

    const data = await res.json() as { login: string; public_repos?: number; followers?: number; created_at?: string; bio?: string | null };
    return report('github-user-api', endpoint, handle, {
      verified: true,
      outcome: 'EXPOSED',
      evidence: `Public account "${data.login}" exists — ${data.public_repos ?? 0} public repo(s), ${data.followers ?? 0} follower(s), created ${String(data.created_at || 'unknown').slice(0, 10)}.`,
      httpStatus: res.status,
      facts: { exists: true, publicRepos: data.public_repos ?? 0, followers: data.followers ?? 0, createdAt: data.created_at || '' },
    });
  } catch (err) {
    return unavailable('github-user-api', endpoint, handle, err);
  }
};

/** Mozilla HTTP Observatory — server-side security header scoring for a host. */
export const mozillaObservatoryVerifier: Verifier = async (input, ctx) => {
  const host = normalizeHost(input.value);
  const endpoint = `https://http-observatory.security.mozilla.org/api/v1/analyze?host=${encodeURIComponent(host)}`;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
    return report('mozilla-observatory', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'Value is not a hostname; Observatory scan skipped.',
    });
  }

  try {
    const res = await timedFetch(ctx, endpoint);
    if (!res.ok) return unavailable('mozilla-observatory', endpoint, host, new Error(`HTTP ${res.status}`), res.status);

    const data = await res.json() as { grade?: string; score?: number; tests_failed?: number; tests_passed?: number; state?: string };
    if (data.state && data.state !== 'FINISHED') {
      return report('mozilla-observatory', endpoint, host, {
        verified: false,
        outcome: 'UNAVAILABLE',
        evidence: `Observatory scan state is "${data.state}" — analysis not complete. No result was inferred.`,
        httpStatus: res.status,
      });
    }
    const grade = data.grade || 'unknown';
    const good = ['A+', 'A', 'A-', 'B+'].includes(grade);
    return report('mozilla-observatory', endpoint, host, {
      verified: true,
      outcome: good ? 'CLEAN' : 'EXPOSED',
      evidence: `Observatory grade ${grade} (score ${data.score ?? 'n/a'}); ${data.tests_passed ?? 0} test(s) passed, ${data.tests_failed ?? 0} failed.`,
      httpStatus: res.status,
      facts: { grade, score: data.score ?? -1, passed: data.tests_passed ?? 0, failed: data.tests_failed ?? 0 },
    });
  } catch (err) {
    return unavailable('mozilla-observatory', endpoint, host, err);
  }
};

/** NIST NVD — CVE lookup for a software/firmware identifier. */
export const nvdCveVerifier: Verifier = async (input, ctx) => {
  const keyword = input.value.trim();
  const endpoint = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=5`;
  if (keyword.length < 3) {
    return report('nvd-cve', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'Software identifier too short for a meaningful CVE lookup.',
    });
  }

  try {
    const res = await timedFetch(ctx, endpoint);
    if (!res.ok) return unavailable('nvd-cve', endpoint, keyword, new Error(`HTTP ${res.status}`), res.status);

    const data = await res.json() as {
      totalResults?: number;
      vulnerabilities?: Array<{ cve: { id: string; published?: string; descriptions?: Array<{ lang: string; value: string }> } }>;
    };
    const total = data.totalResults ?? 0;
    const ids = (data.vulnerabilities || []).map(v => v.cve.id);

    if (total === 0) {
      return report('nvd-cve', endpoint, keyword, {
        verified: true,
        outcome: 'CLEAN',
        evidence: `NVD returned 0 CVE matches for "${keyword}".`,
        httpStatus: res.status,
        facts: { cveCount: 0 },
      });
    }
    return report('nvd-cve', endpoint, keyword, {
      verified: true,
      outcome: 'EXPOSED',
      evidence: `NVD lists ${total} CVE match(es) for "${keyword}" — e.g. ${ids.slice(0, 5).join(', ')}.`,
      httpStatus: res.status,
      facts: { cveCount: total, cveIds: ids.slice(0, 10) },
    });
  } catch (err) {
    return unavailable('nvd-cve', endpoint, keyword, err);
  }
};

/** abuse.ch URLhaus — malware URL/host lookup. */
export const urlhausVerifier: Verifier = async (input, ctx) => {
  const host = normalizeHost(input.value);
  const endpoint = 'https://urlhaus-api.abuse.ch/v1/host/';
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
    return report('urlhaus', endpoint, '(rejected)', {
      verified: false,
      outcome: 'NOT_APPLICABLE',
      evidence: 'Value is not a hostname; URLhaus lookup skipped.',
    });
  }

  try {
    const res = await timedFetch(ctx, endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `host=${encodeURIComponent(host)}`,
    });
    if (!res.ok) return unavailable('urlhaus', endpoint, host, new Error(`HTTP ${res.status}`), res.status);

    const data = await res.json() as { query_status?: string; urls?: Array<{ url_status?: string; threat?: string }> };
    const status = data.query_status || 'unknown';
    const active = (data.urls || []).filter(u => u.url_status === 'online');

    return report('urlhaus', endpoint, host, {
      verified: true,
      outcome: active.length > 0 ? 'EXPOSED' : status === 'no_results' ? 'CLEAN' : 'INCONCLUSIVE',
      evidence: active.length > 0
        ? `URLhaus lists ${active.length} online malicious URL(s) on this host (threats: ${Array.from(new Set(active.map(u => u.threat || 'unknown'))).slice(0, 4).join(', ')}).`
        : `URLhaus query status: ${status}. No online malicious URLs listed.`,
      httpStatus: res.status,
      facts: { queryStatus: status, onlineMaliciousUrls: active.length },
    });
  } catch (err) {
    return unavailable('urlhaus', endpoint, host, err);
  }
};

/** HIBP v3 — opt-in (paid key). Never fabricates when the key is absent. */
export const hibpVerifier: Verifier = async (input, ctx) => {
  const account = input.value.trim();
  const endpoint = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(account)}`;
  const key = ctx.keys?.hibpApiKey || env('VITE_HIBP_API_KEY');
  if (!key) {
    return report('haveibeenpwned', endpoint, account, {
      verified: false,
      outcome: 'NOT_CONFIGURED',
      evidence: 'HIBP v3 requires an API key. VITE_HIBP_API_KEY is not set, so this source was not queried and nothing was assumed.',
    });
  }

  try {
    const res = await timedFetch(ctx, endpoint, { headers: { 'hibp-api-key': key, 'User-Agent': 'agape-sovereign' } });
    if (res.status === 404) {
      return report('haveibeenpwned', endpoint, account, {
        verified: true,
        outcome: 'CLEAN',
        evidence: 'HIBP v3 returned 404 — no breaches, pastes or spam-list entries for this account.',
        httpStatus: 404,
        facts: { breachCount: 0 },
      });
    }
    if (res.status === 429) return unavailable('haveibeenpwned', endpoint, account, new Error('rate limited (HTTP 429)'), 429);
    if (!res.ok) return unavailable('haveibeenpwned', endpoint, account, new Error(`HTTP ${res.status}`), res.status);

    const data = await res.json() as Array<{ Name?: string; Title?: string }>;
    const names = data.map(d => d.Title || d.Name || 'unknown');
    return report('haveibeenpwned', endpoint, account, {
      verified: true,
      outcome: names.length > 0 ? 'EXPOSED' : 'CLEAN',
      evidence: names.length > 0
        ? `HIBP v3 reports ${names.length} breach(es): ${names.slice(0, 6).join(', ')}${names.length > 6 ? ', …' : ''}.`
        : 'HIBP v3 returned an empty breach list.',
      httpStatus: res.status,
      facts: { breachCount: names.length, breaches: names.slice(0, 20) },
    });
  } catch (err) {
    return unavailable('haveibeenpwned', endpoint, account, err);
  }
};

/* ───────────────────────── registry ───────────────────────── */

/**
 * Module → third-party source chains are owned by the Module Agent registry
 * (src/services/moduleAgentService.ts) so there is exactly one definition.
 * A VerificationClient is constructed with that map; with no map supplied it
 * runs no third-party checks and every result is reported UNVERIFIED.
 */
export type VerificationChains = Record<string, VerificationSourceId[]>;

const VERIFIER_BY_ID: Record<VerificationSourceId, Verifier | null> = {
  pwnedpasswords: pwnedPasswordsVerifier,
  xposedornot: xposedOrNotVerifier,
  'dns-doh-google': dnsDohVerifier,
  'crt-sh': crtShVerifier,
  'github-user-api': githubUserVerifier,
  'mozilla-observatory': mozillaObservatoryVerifier,
  'nvd-cve': nvdCveVerifier,
  urlhaus: urlhausVerifier,
  haveibeenpwned: hibpVerifier,
  'local-attestation': null,
};

export interface VerificationSummary {
  moduleId: string;
  reports: VerificationReport[];
  /** True only when at least one third party actually answered. */
  thirdPartyVerified: boolean;
  /** Worst-case outcome across answering sources. */
  outcome: VerificationOutcome;
  /** Factual, non-fabricated description of the verification state. */
  statement: string;
}

const OUTCOME_SEVERITY: Record<VerificationOutcome, number> = {
  EXPOSED: 5,
  INCONCLUSIVE: 3,
  UNAVAILABLE: 2,
  NOT_CONFIGURED: 1,
  NOT_APPLICABLE: 1,
  CLEAN: 0,
};

export function summarizeVerification(moduleId: string, reports: VerificationReport[]): VerificationSummary {
  const answering = reports.filter(r => r.verified);
  const thirdPartyVerified = answering.some(r => r.sourceId !== 'local-attestation');
  const worst = reports.reduce<VerificationOutcome>((acc, r) => {
    return OUTCOME_SEVERITY[r.outcome] > OUTCOME_SEVERITY[acc] ? r.outcome : acc;
  }, 'CLEAN');

  let statement: string;
  if (thirdPartyVerified) {
    const names = answering.filter(r => r.sourceId !== 'local-attestation').map(r => r.source);
    statement = `Third-party verified by ${names.join(' + ')}.`;
  } else if (reports.length === 0) {
    statement = 'No third-party source is registered for this vector — result is on-device attestation only (UNVERIFIED).';
  } else {
    const blocked = reports.filter(r => r.outcome === 'UNAVAILABLE' || r.outcome === 'NOT_CONFIGURED');
    statement = blocked.length > 0
      ? `Third-party verification did not complete (${blocked.map(r => `${r.source}: ${r.outcome}`).join('; ')}). Result is UNVERIFIED.`
      : 'Third-party sources were not applicable to this input — result is UNVERIFIED.';
  }

  return { moduleId, reports, thirdPartyVerified, outcome: thirdPartyVerified ? worst : 'INCONCLUSIVE', statement };
}

export interface VerificationClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  keys?: { hibpApiKey?: string };
  /** Module → source chains. Owned by the Module Agent registry. */
  chains?: VerificationChains;
}

export class VerificationClient {
  private ctx: VerificationContext;
  private chains: VerificationChains;

  constructor(options: VerificationClientOptions = {}) {
    this.ctx = {
      fetchImpl: options.fetchImpl || ((...args: Parameters<typeof fetch>) => fetch(...args)),
      timeoutMs: options.timeoutMs ?? 12000,
      keys: options.keys,
    };
    this.chains = options.chains || {};
  }

  withChains(chains: VerificationChains): VerificationClient {
    return new VerificationClient({
      fetchImpl: this.ctx.fetchImpl,
      timeoutMs: this.ctx.timeoutMs,
      keys: this.ctx.keys,
      chains,
    });
  }

  sourcesFor(moduleId: string): VerificationSourceId[] {
    return this.chains[moduleId] || [];
  }

  async verifySource(sourceId: VerificationSourceId, input: VerifyInput): Promise<VerificationReport> {
    const verifier = VERIFIER_BY_ID[sourceId];
    if (!verifier) {
      return report(sourceId, '(none)', input.value, {
        verified: false,
        outcome: 'NOT_APPLICABLE',
        evidence: 'No verifier implementation is registered for this source.',
      });
    }
    return verifier(input, this.ctx);
  }

  /** Run the full registered chain for a module. Failures never throw. */
  async verifyModule(input: VerifyInput): Promise<VerificationSummary> {
    const sources = this.sourcesFor(input.moduleId);
    const reports = await Promise.all(sources.map(id => this.verifySource(id, input)));
    return summarizeVerification(input.moduleId, reports);
  }
}

export const verificationClient = new VerificationClient();
