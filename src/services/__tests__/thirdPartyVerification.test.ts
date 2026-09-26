import { describe, it, expect, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

if (!(globalThis.crypto as Crypto | undefined)?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

import {
  VerificationClient,
  pwnedPasswordsVerifier,
  xposedOrNotVerifier,
  dnsDohVerifier,
  githubUserVerifier,
  hibpVerifier,
  summarizeVerification,
  domainFromEmail,
} from '../thirdPartyVerificationService';

const ctx = (fetchImpl: unknown) => ({
  fetchImpl: fetchImpl as typeof fetch,
  timeoutMs: 5000,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('input minimisation', () => {
  it('derives the domain from an email without sending the local part', () => {
    expect(domainFromEmail('Sovereign.User@Example.COM')).toBe('example.com');
    expect(domainFromEmail('no-at-sign')).toBe('');
  });

  it('sends only 5 hex characters of the credential hash (k-anonymity)', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 200 }));
    await pwnedPasswordsVerifier({ moduleId: 'password', value: 'correct horse battery staple' }, ctx(fetchImpl));

    const url = (fetchImpl as any).mock.calls[0][0] as string;
    expect(url).toMatch(/^https:\/\/api\.pwnedpasswords\.com\/range\/[0-9A-F]{5}$/);
    expect(url).not.toContain('correct');
    expect((fetchImpl as any).mock.calls[0][1].headers).toMatchObject({ 'Add-Padding': 'true' });
  });
});

describe('Pwned Passwords verifier', () => {
  const buildRange = async (password: string) => {
    const buf = await webcrypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const full = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return { suffix: full.slice(5) };
  };

  it('reports EXPOSED with the real occurrence count', async () => {
    const { suffix } = await buildRange('hunter2');
    const fetchImpl = vi.fn(async () => new Response(`${suffix}:17\nOTHERHASH:3`, { status: 200 }));
    const report = await pwnedPasswordsVerifier({ moduleId: 'password', value: 'hunter2' }, ctx(fetchImpl));

    expect(report.verified).toBe(true);
    expect(report.outcome).toBe('EXPOSED');
    expect(report.evidence).toContain('17');
    expect(report.facts?.occurrences).toBe(17);
  });

  it('reports CLEAN when the suffix is absent from the range', async () => {
    const fetchImpl = vi.fn(async () => new Response('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:2', { status: 200 }));
    const report = await pwnedPasswordsVerifier({ moduleId: 'password', value: 'a-unique-passphrase-9f3' }, ctx(fetchImpl));
    expect(report.outcome).toBe('CLEAN');
    expect(report.verified).toBe(true);
  });

  it('reports UNAVAILABLE rather than guessing on HTTP failure', async () => {
    const fetchImpl = vi.fn(async () => new Response('rate limited', { status: 429 }));
    const report = await pwnedPasswordsVerifier({ moduleId: 'password', value: 'hunter2' }, ctx(fetchImpl));
    expect(report.verified).toBe(false);
    expect(report.outcome).toBe('UNAVAILABLE');
    expect(report.httpStatus).toBe(429);
    expect(report.evidence).toContain('No result was inferred');
  });
});

describe('XposedOrNot verifier', () => {
  it('treats 404 as a verified clean result', async () => {
    const fetchImpl = vi.fn(async () => new Response('', { status: 404 }));
    const report = await xposedOrNotVerifier({ moduleId: 'email', value: 'clean@example.com' }, ctx(fetchImpl));
    expect(report.verified).toBe(true);
    expect(report.outcome).toBe('CLEAN');
    expect(report.facts?.breachCount).toBe(0);
  });

  it('lists the breach datasets returned by the index', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ breaches: [{ 'Adobe-2019': {}, 'LinkedIn-2012': {} }] }));
    const report = await xposedOrNotVerifier({ moduleId: 'email', value: 'breached@example.com' }, ctx(fetchImpl));
    expect(report.outcome).toBe('EXPOSED');
    expect(report.evidence).toContain('2 breach dataset');
  });

  it('refuses to run on a non-email value', async () => {
    const fetchImpl = vi.fn();
    const report = await xposedOrNotVerifier({ moduleId: 'email', value: 'not-an-email' }, ctx(fetchImpl));
    expect(report.outcome).toBe('NOT_APPLICABLE');
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('DNS-over-HTTPS verifier', () => {
  const dnsResponse = (answers: Array<{ data: string }>) => jsonResponse({ Answer: answers, Status: 0 });

  it('detects missing DMARC as a real weakness', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('type=MX')) return dnsResponse([{ data: '10 mail.example.com.' }]);
      if (url.includes('type=TXT') && url.includes('_dmarc')) return dnsResponse([]);
      if (url.includes('type=TXT')) return dnsResponse([{ data: '"v=spf1 include:_spf.google.com ~all"' }]);
      return dnsResponse([{ data: '93.184.216.34' }]);
    });

    const report = await dnsDohVerifier({ moduleId: 'email', value: 'user@example.com' }, ctx(fetchImpl));
    expect(report.verified).toBe(true);
    expect(report.outcome).toBe('EXPOSED');
    expect(report.evidence).toContain('no DMARC policy');
    expect(report.query).toBe('example.com');
  });

  it('reports CLEAN when mail authentication records are present', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('type=MX')) return dnsResponse([{ data: '10 mail.example.com.' }]);
      if (url.includes('type=TXT') && url.includes('_dmarc')) return dnsResponse([{ data: '"v=DMARC1; p=reject;"' }]);
      if (url.includes('type=TXT')) return dnsResponse([{ data: '"v=spf1 -all"' }]);
      return dnsResponse([{ data: '93.184.216.34' }]);
    });
    const report = await dnsDohVerifier({ moduleId: 'email', value: 'user@example.com' }, ctx(fetchImpl));
    expect(report.outcome).toBe('CLEAN');
  });
});

describe('GitHub footprint verifier', () => {
  it('reports a real public profile with its stats', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ login: 'torvalds', public_repos: 9, followers: 250000, created_at: '2008-09-04T00:00:00Z' }));
    const report = await githubUserVerifier({ moduleId: 'social', value: '@torvalds' }, ctx(fetchImpl));
    expect(report.outcome).toBe('EXPOSED');
    expect(report.evidence).toContain('torvalds');
    expect(report.facts?.followers).toBe(250000);
  });

  it('treats 404 as verified clean and 429 as unavailable', async () => {
    const missing = await githubUserVerifier({ moduleId: 'social', value: 'zzz-not-registered-xyz' }, ctx(vi.fn(async () => new Response('', { status: 404 }))));
    expect(missing.outcome).toBe('CLEAN');
    expect(missing.verified).toBe(true);

    const limited = await githubUserVerifier({ moduleId: 'social', value: 'torvalds' }, ctx(vi.fn(async () => new Response('', { status: 403 }))));
    expect(limited.outcome).toBe('UNAVAILABLE');
    expect(limited.verified).toBe(false);
  });
});

describe('paid sources are never simulated', () => {
  it('reports NOT_CONFIGURED when the HIBP key is absent', async () => {
    const fetchImpl = vi.fn();
    const report = await hibpVerifier({ moduleId: 'email', value: 'a@b.com' }, { fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 5000, keys: {} });
    expect(report.outcome).toBe('NOT_CONFIGURED');
    expect(report.verified).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('VerificationClient', () => {
  it('runs no third-party checks when no chain is registered', async () => {
    const fetchImpl = vi.fn();
    const client = new VerificationClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const summary = await client.verifyModule({ moduleId: 'email', value: 'a@b.com' });
    expect(summary.reports).toHaveLength(0);
    expect(summary.thirdPartyVerified).toBe(false);
    expect(summary.statement).toContain('No third-party source is registered');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('runs the registered chain and surfaces the worst verified outcome', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('pwnedpasswords')) return new Response('A'.repeat(35) + ':5', { status: 200 });
      return new Response('', { status: 500 });
    });
    const client = new VerificationClient({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      chains: { darkweb: ['pwnedpasswords', 'xposedornot'] },
    });
    const summary = await client.verifyModule({ moduleId: 'darkweb', value: 'user@example.com' });
    expect(summary.reports).toHaveLength(2);
    expect(summary.thirdPartyVerified).toBe(true);
    expect(summary.outcome).toBe('UNAVAILABLE'); // worst outcome wins over CLEAN
  });
});

describe('summarizeVerification honesty', () => {
  it('is not "third-party verified" when every source failed to answer', () => {
    const summary = summarizeVerification('email', [
      {
        sourceId: 'xposedornot', source: 'XposedOrNot Breach Index', endpoint: 'x', query: 'a@b.com',
        checkedAt: new Date().toISOString(), verified: false, outcome: 'UNAVAILABLE', evidence: 'no response',
      },
      {
        sourceId: 'haveibeenpwned', source: 'Have I Been Pwned v3', endpoint: 'x', query: 'a@b.com',
        checkedAt: new Date().toISOString(), verified: false, outcome: 'NOT_CONFIGURED', evidence: 'no key',
      },
    ]);
    expect(summary.thirdPartyVerified).toBe(false);
    expect(summary.statement).toContain('UNVERIFIED');
  });
});
