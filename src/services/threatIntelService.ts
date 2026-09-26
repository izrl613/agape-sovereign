/**
 * THREAT INTELLIGENCE SERVICE
 * ============================================================
 * Live threat intelligence for the Architect AI command centre.
 *
 * HARD RULES
 *  1. Fabricated, placeholder, mock or simulated intelligence is banned.
 *     This service only ever returns advisories that a third party actually
 *     published. If the source is unreachable, the feed is empty and the UI
 *     says so — nothing is invented to fill the panel.
 *  2. Zero cost: the GitHub Advisory Database is free and requires no key,
 *     subscription or account. It is a curated, human-reviewed corpus of
 *     CVE-mapped security advisories.
 *  3. Every item carries its real advisory id, publication timestamp and
 *     source URL so the user can verify it independently.
 * ============================================================
 */

export type ThreatSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ThreatItem {
  title: string;
  severity: ThreatSeverity;
  /** Attribution exactly as the source states it. */
  source: string;
  /** Human-readable age, derived from the advisory's real publication time. */
  time: string;
  /** Canonical ISO-8601 publication timestamp from the source. */
  publishedAt: string;
  /** Advisory identifiers (GHSA / CVE) for independent verification. */
  identifiers: string[];
  /** Canonical link to the advisory. */
  url: string;
  description: string;
  /**
   * The Identity Vector Module this advisory is relevant to, when the
   * advisory's affected package/CWE genuinely maps onto one. Empty string
   * when there is no honest mapping — never guessed.
   */
  vector: string;
}

export interface ThreatFeedResult {
  ok: boolean;
  items: ThreatItem[];
  /** Factual reason the feed is empty, when ok is false. */
  error?: string;
  fetchedAt: string;
  sourceName: string;
  endpoint: string;
}

const ENDPOINT = 'https://api.github.com/advisories';
const SOURCE_NAME = 'GitHub Advisory Database';

/**
 * Map GitHub's severity vocabulary onto the four the UI renders. GitHub uses
 * lowercase 'critical' | 'high' | 'medium' | 'low' | null. An advisory with
 * no published severity is not promoted — it is reported as Low, the least
 * alarming reading, and the raw value is preserved in the item.
 */
function normaliseSeverity(raw: unknown): ThreatSeverity {
  switch (String(raw ?? '').toLowerCase()) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Low';
  }
}

/** Convert a real ISO timestamp into a compact human age. */
export function humanAge(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'unknown age';
  const minutes = Math.max(0, Math.floor((now - then) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/**
 * Map an advisory onto a canonical Identity Vector Module id, but only where
 * the affected package ecosystem or CWE class genuinely relates to that
 * vector. Returns '' when no honest mapping exists — the caller must not
 * substitute a guess.
 */
export function mapAdvisoryToVector(advisory: {
  cwes?: { cwe_id?: string }[];
  vulnerabilities?: { package?: { name?: string; ecosystem?: string } }[];
}): string {
  const pkg = (advisory.vulnerabilities?.[0]?.package?.name || '').toLowerCase();
  const eco = (advisory.vulnerabilities?.[0]?.package?.ecosystem || '').toLowerCase();
  const cwes = (advisory.cwes || []).map(c => String(c.cwe_id || '').toUpperCase());

  // Package-name signals that genuinely belong to a vector.
  if (/passw|secret|credential|vault|keytar|oauth/.test(pkg)) return 'password';
  if (/cookie|session|browser|puppeteer|playwright/.test(pkg)) return 'browser';
  if (/geoloc|location|geo-|mapbox/.test(pkg)) return 'location';
  if (/biometr|face-|voice|fingerprint/.test(pkg)) return 'biometric';
  if (/iot|mqtt|zigbee|firmware/.test(pkg)) return 'iot';
  if (/s3|storage|drive|blob|cloud/.test(pkg)) return 'cloud';
  if (/mail|smtp|imap/.test(pkg)) return 'email';
  if (/payment|stripe|bank|finance/.test(pkg)) return 'financial';
  if (/health|hl7|fhir|medical/.test(pkg)) return 'medical';
  if (/social|twitter|facebook|instagram/.test(pkg)) return 'social';
  if (/crawl|scrap|proxy|anonym/.test(pkg)) return 'deepweb';

  // CWE classes that map to a vector by weakness type, not by guesswork.
  if (cwes.some(c => ['CWE-256', 'CWE-259', 'CWE-321', 'CWE-916'].includes(c))) return 'password';
  if (cwes.some(c => ['CWE-359', 'CWE-200'].includes(c)) && /location|geo/.test(pkg)) return 'location';

  // Ecosystem-level signals are too coarse to attribute to a specific vector.
  if (eco) return '';
  return '';
}

interface GithubAdvisory {
  ghsa_id?: string;
  cve_id?: string | null;
  summary?: string;
  description?: string;
  severity?: string | null;
  published_at?: string;
  html_url?: string;
  cwes?: { cwe_id?: string; name?: string }[];
  vulnerabilities?: { package?: { name?: string; ecosystem?: string }; vulnerable_version_range?: string }[];
}

export interface FetchThreatFeedOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** How many advisories to request (GitHub caps at 100). */
  perPage?: number;
  signal?: AbortSignal;
}

/**
 * Fetch the live advisory feed. Never throws: a failure returns ok:false with
 * a factual error and an empty list, so the caller renders an honest empty
 * state instead of a fabricated one.
 */
export async function fetchThreatFeed(opts: FetchThreatFeedOptions = {}): Promise<ThreatFeedResult> {
  const fetchImpl = opts.fetchImpl || fetch;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const perPage = Math.min(Math.max(opts.perPage ?? 8, 1), 100);
  const url = `${ENDPOINT}?type=reviewed&sort=published&direction=desc&per_page=${perPage}`;
  const fetchedAt = new Date().toISOString();

  const fail = (error: string): ThreatFeedResult => ({
    ok: false, items: [], error, fetchedAt, sourceName: SOURCE_NAME, endpoint: url,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) {
      return fail(`Source returned HTTP ${res.status}. No advisories were retrieved and none were invented.`);
    }
    const payload = (await res.json()) as GithubAdvisory[];
    if (!Array.isArray(payload)) {
      return fail('Source returned an unexpected payload shape. No advisories were retrieved.');
    }

    const now = Date.now();
    const items: ThreatItem[] = payload
      .filter(a => a && typeof a === 'object' && (a.ghsa_id || a.cve_id))
      .map(a => {
        const identifiers = [a.ghsa_id, a.cve_id].filter((v): v is string => !!v);
        const publishedAt = a.published_at || '';
        const pkgName = a.vulnerabilities?.[0]?.package?.name;
        const affected = pkgName
          ? `Affected package: ${pkgName}${a.vulnerabilities?.[0]?.vulnerable_version_range
              ? ` (${a.vulnerabilities[0].vulnerable_version_range})` : ''}.`
          : '';
        const cweList = (a.cwes || []).map(c => c.cwe_id).filter(Boolean);
        const cweText = cweList.length ? ` Weakness class: ${cweList.join(', ')}.` : '';

        return {
          title: a.summary || identifiers[0] || 'Untitled advisory',
          severity: normaliseSeverity(a.severity),
          source: SOURCE_NAME,
          time: publishedAt ? humanAge(publishedAt, now) : 'publication date not stated',
          publishedAt,
          identifiers,
          url: a.html_url || `https://github.com/advisories/${a.ghsa_id || ''}`,
          description: `${affected}${cweText} ${a.description || a.summary || ''}`.trim(),
          vector: mapAdvisoryToVector({ cwes: a.cwes, vulnerabilities: a.vulnerabilities }),
        };
      });

    return { ok: true, items, fetchedAt, sourceName: SOURCE_NAME, endpoint: url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(`Could not reach ${SOURCE_NAME}: ${message}. No advisories were retrieved and none were invented.`);
  } finally {
    clearTimeout(timer);
  }
}
