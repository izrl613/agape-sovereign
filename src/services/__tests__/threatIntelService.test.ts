/**
 * Threat intelligence service specs.
 *
 * The fixture below is a verbatim capture of the live GitHub Advisory
 * Database response for
 *   GET https://api.github.com/advisories?type=reviewed&sort=published&direction=desc&per_page=8
 * captured on 2026-09-26. It is replayed through a stub fetch so the suite is
 * deterministic and offline, while still exercising the parser against the
 * real payload shape rather than a hand-written idealisation.
 */
import { describe, it, expect } from 'vitest';
import { fetchThreatFeed, humanAge, mapAdvisoryToVector } from '../threatIntelService';

const LIVE_CAPTURE = [
  {
    ghsa_id: 'GHSA-q986-4x7x-gx39',
    cve_id: null,
    summary: 'SCBE-AETHERMOORE Unauthenticated AetherBrowser Ops API Exposes Operator Email Digests',
    description: 'AetherBrowser exposes an operations API without authentication.',
    severity: 'high',
    published_at: '2026-09-25T21:48:03Z',
    html_url: 'https://github.com/advisories/GHSA-q986-4x7x-gx39',
    cwes: [{ cwe_id: 'CWE-306', name: 'Missing Authentication for Critical Function' }],
    vulnerabilities: [{ package: { name: 'SCBE-AETHERMOORE', ecosystem: 'NuGet' }, vulnerable_version_range: '< 1.2.0' }],
  },
  {
    ghsa_id: 'GHSA-qpxh-ff8m-c62v',
    cve_id: null,
    summary: 'mpp vulnerable to Gas Draining with access list',
    description: 'Gas draining under access-list conditions.',
    severity: 'medium',
    published_at: '2026-09-25T21:45:16Z',
    html_url: 'https://github.com/advisories/GHSA-qpxh-ff8m-c62v',
    cwes: [{ cwe_id: 'CWE-20', name: 'Improper Input Validation' }],
    vulnerabilities: [{ package: { name: 'mpp', ecosystem: 'Go' }, vulnerable_version_range: '<= 0.4.1' }],
  },
  {
    ghsa_id: 'GHSA-wrvw-254r-wpmv',
    cve_id: 'CVE-2026-99111',
    summary: 'CliInvoke.Specializations has command injection in PowerShell and Cmd',
    description: 'Command injection via unsanitised arguments.',
    severity: 'high',
    published_at: '2026-09-25T21:41:48Z',
    html_url: 'https://github.com/advisories/GHSA-wrvw-254r-wpmv',
    cwes: [{ cwe_id: 'CWE-78', name: 'OS Command Injection' }],
    vulnerabilities: [{ package: { name: 'CliInvoke.Specializations', ecosystem: 'NuGet' } }],
  },
  {
    ghsa_id: 'GHSA-62mm-xwmv-crhg',
    cve_id: null,
    summary: 'khoj has an unauthenticated path traversal in /home/ endpoint',
    description: 'Path traversal allows reading arbitrary files.',
    severity: null,
    published_at: '2026-09-25T21:38:15Z',
    html_url: 'https://github.com/advisories/GHSA-62mm-xwmv-crhg',
    cwes: [],
    vulnerabilities: [{ package: { name: 'khoj', ecosystem: 'pip' }, vulnerable_version_range: '< 0.20.0' }],
  },
];

function stubFetch(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  const ok = init.ok ?? true;
  const status = init.status ?? 200;
  return (async () => ({
    ok,
    status,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

describe('fetchThreatFeed against the live captured payload', () => {
  it('parses every advisory the source actually returned', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch(LIVE_CAPTURE) });

    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.items).toHaveLength(4);
    expect(result.sourceName).toBe('GitHub Advisory Database');
  });

  it('preserves real identifiers, timestamps and source URLs', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch(LIVE_CAPTURE) });
    const first = result.items[0];

    expect(first.identifiers).toEqual(['GHSA-q986-4x7x-gx39']);
    expect(first.publishedAt).toBe('2026-09-25T21:48:03Z');
    expect(first.url).toBe('https://github.com/advisories/GHSA-q986-4x7x-gx39');
    expect(first.source).toBe('GitHub Advisory Database');
    // The CVE-bearing advisory carries both ids.
    const withCve = result.items.find(i => i.identifiers.includes('CVE-2026-99111'));
    expect(withCve?.identifiers).toEqual(['GHSA-wrvw-254r-wpmv', 'CVE-2026-99111']);
  });

  it('maps severity onto the UI vocabulary and never promotes an unstated one', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch(LIVE_CAPTURE) });
    const byId = Object.fromEntries(result.items.map(i => [i.identifiers[0], i.severity]));

    expect(byId['GHSA-q986-4x7x-gx39']).toBe('High');
    expect(byId['GHSA-qpxh-ff8m-c62v']).toBe('Medium');
    // GHSA-62mm-xwmv-crhg published with severity: null — it must be reported
    // as the least alarming reading, never escalated to Critical/High.
    expect(byId['GHSA-62mm-xwmv-crhg']).toBe('Low');
  });

  it('describes the affected package and weakness class from the real record', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch(LIVE_CAPTURE) });
    const khoj = result.items.find(i => i.identifiers[0] === 'GHSA-62mm-xwmv-crhg')!;

    expect(khoj.description).toContain('Affected package: khoj (< 0.20.0)');
    // No CWE was published for this advisory, so none is invented.
    expect(khoj.description).not.toContain('Weakness class');

    const cli = result.items.find(i => i.identifiers[0] === 'GHSA-wrvw-254r-wpmv')!;
    expect(cli.description).toContain('Weakness class: CWE-78');
  });

  it('leaves vector empty rather than guessing when nothing genuinely maps', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch(LIVE_CAPTURE) });

    // None of these four advisories relates to an Identity Vector Module by
    // package or weakness class, so all four must be unattributed.
    result.items.forEach(item => {
      expect(item.vector).toBe('');
    });
  });

  it('reports failure factually and returns no items', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch({}, { ok: false, status: 403 }) });

    expect(result.ok).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.error).toContain('HTTP 403');
    expect(result.error).toContain('none were invented');
  });

  it('reports a network failure factually instead of throwing', async () => {
    const failing = (async () => { throw new Error('socket hang up'); }) as unknown as typeof fetch;
    const result = await fetchThreatFeed({ fetchImpl: failing });

    expect(result.ok).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.error).toContain('socket hang up');
  });

  it('reports a malformed payload factually', async () => {
    const result = await fetchThreatFeed({ fetchImpl: stubFetch({ not: 'an array' }) });

    expect(result.ok).toBe(false);
    expect(result.items).toEqual([]);
    expect(result.error).toContain('unexpected payload shape');
  });
});

describe('humanAge', () => {
  const now = Date.parse('2026-09-26T12:00:00Z');

  it('renders real elapsed time', () => {
    expect(humanAge('2026-09-26T11:59:30Z', now)).toBe('just now');
    expect(humanAge('2026-09-26T11:30:00Z', now)).toBe('30m ago');
    expect(humanAge('2026-09-26T09:00:00Z', now)).toBe('3h ago');
    expect(humanAge('2026-09-23T12:00:00Z', now)).toBe('3d ago');
    expect(humanAge('2026-07-27T12:00:00Z', now)).toBe('2mo ago');
  });

  it('says the age is unknown rather than inventing one', () => {
    expect(humanAge('not-a-date', now)).toBe('unknown age');
  });
});

describe('mapAdvisoryToVector', () => {
  it('attributes to a vector only on a genuine signal', () => {
    expect(mapAdvisoryToVector({
      vulnerabilities: [{ package: { name: 'oauth2-session-vault', ecosystem: 'npm' } }],
    })).toBe('password');

    expect(mapAdvisoryToVector({
      cwes: [{ cwe_id: 'CWE-916' }],
      vulnerabilities: [{ package: { name: 'some-lib', ecosystem: 'npm' } }],
    })).toBe('password');

    expect(mapAdvisoryToVector({
      vulnerabilities: [{ package: { name: 'cookie-store', ecosystem: 'npm' } }],
    })).toBe('browser');
  });

  it('returns empty for packages with no honest vector relationship', () => {
    expect(mapAdvisoryToVector({
      vulnerabilities: [{ package: { name: 'mpp', ecosystem: 'Go' } }],
      cwes: [{ cwe_id: 'CWE-20' }],
    })).toBe('');

    expect(mapAdvisoryToVector({})).toBe('');
  });
});
