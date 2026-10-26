/**
 * Third-party validators used by the 16 Module Agents.
 * Browser-safe, no API keys. Failures are swallowed so a blocked CORS
 * origin never bricks a scan.
 */

export interface ValidatorNote {
  source: string;
  ok: boolean;
  detail: string;
}

async function getJson(url: string, timeoutMs = 4500): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function domainOf(email: string): string | null {
  const m = email.trim().toLowerCase().match(/@([^@\s]+)$/);
  return m ? m[1] : null;
}

/** Google Public DNS JSON API — SPF / DMARC / MX. */
export async function lookupDns(name: string, type: 'TXT' | 'MX' | 'A'): Promise<string[]> {
  const data = (await getJson(
    `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`
  )) as { Answer?: { data?: string }[] } | null;
  if (!data?.Answer) return [];
  return data.Answer.map((a) => String(a.data || '').replace(/^"|"$/g, '')).filter(Boolean);
}

export async function checkEmailDomain(email: string): Promise<{
  domain: string;
  spf: boolean;
  dmarc: boolean;
  mx: boolean;
  notes: ValidatorNote[];
} | null> {
  const domain = domainOf(email);
  if (!domain) return null;
  const [txt, dmarcTxt, mx] = await Promise.all([
    lookupDns(domain, 'TXT'),
    lookupDns(`_dmarc.${domain}`, 'TXT'),
    lookupDns(domain, 'MX'),
  ]);
  const spf = txt.some((t) => /v=spf1/i.test(t));
  const dmarc = dmarcTxt.some((t) => /v=DMARC1/i.test(t));
  const hasMx = mx.length > 0;
  const notes: ValidatorNote[] = [
    { source: 'dns.google TXT', ok: spf, detail: spf ? `SPF published for ${domain}` : `No SPF record on ${domain}` },
    { source: 'dns.google DMARC', ok: dmarc, detail: dmarc ? `DMARC published for ${domain}` : `No DMARC on ${domain}` },
    { source: 'dns.google MX', ok: hasMx, detail: hasMx ? `${mx.length} MX host(s)` : `No MX for ${domain}` },
  ];
  return { domain, spf, dmarc, mx: hasMx, notes };
}

/**
 * Have I Been Pwned k-anonymity range API.
 * Only the first 5 hex chars of SHA-1 leave the device.
 */
export async function checkPwnedPassword(password: string): Promise<{ count: number; notes: ValidatorNote[] } | null> {
  const trimmed = password.trim();
  if (trimmed.length < 6) return null;
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(trimmed));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4500);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: ctrl.signal,
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return null;
    const body = await res.text();
    const line = body.split('\n').find((row) => row.startsWith(suffix));
    const count = line ? parseInt(line.split(':')[1], 10) || 0 : 0;
    return {
      count,
      notes: [
        {
          source: 'api.pwnedpasswords.com',
          ok: count === 0,
          detail: count === 0 ? 'SHA-1 prefix not in HIBP range list' : `Prefix matched ${count.toLocaleString()} times`,
        },
      ],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** ipapi.co — egress IP / ASN for the Network agent. */
export async function checkEgressNetwork(): Promise<{
  ip: string;
  org: string;
  city: string;
  notes: ValidatorNote[];
} | null> {
  const data = (await getJson('https://ipapi.co/json/')) as {
    ip?: string;
    org?: string;
    city?: string;
    country_name?: string;
  } | null;
  if (!data?.ip) return null;
  const org = data.org || 'unknown ASN';
  const city = [data.city, data.country_name].filter(Boolean).join(', ');
  return {
    ip: data.ip,
    org,
    city,
    notes: [
      {
        source: 'ipapi.co',
        ok: true,
        detail: `Egress ${data.ip} · ${org} · ${city || 'geo withheld'}`,
      },
    ],
  };
}

export async function runLiveValidators(
  moduleId: string,
  record: Record<string, string>
): Promise<{ findingsHint: { id: string; status: 'NUKED' | 'KNOXED' | 'MONITORED'; label: string; detail: string; remediation: string }[]; consulted: ValidatorNote[] }> {
  const consulted: ValidatorNote[] = [];
  const findingsHint: { id: string; status: 'NUKED' | 'KNOXED' | 'MONITORED'; label: string; detail: string; remediation: string }[] = [];

  if (moduleId === 'email' && record.primaryEmail) {
    const dns = await checkEmailDomain(record.primaryEmail);
    if (dns) {
      consulted.push(...dns.notes);
      if (!dns.spf || !dns.dmarc) {
        findingsHint.push({
          id: 'email-dns-live',
          status: 'MONITORED',
          label: `Live DNS: ${!dns.spf && !dns.dmarc ? 'no SPF or DMARC' : !dns.spf ? 'no SPF' : 'no DMARC'}`,
          detail: `dns.google says ${dns.domain} is ${dns.mx ? 'mail-enabled' : 'missing MX'} with ${dns.spf ? 'SPF' : 'no SPF'} and ${dns.dmarc ? 'DMARC' : 'no DMARC'}. Spoofers love a naked domain.`,
          remediation: 'Publish SPF (~all) and a DMARC p=quarantine policy, then re-scan.',
        });
      } else {
        findingsHint.push({
          id: 'email-dns-live',
          status: 'KNOXED',
          label: 'Live DNS: SPF + DMARC present',
          detail: `${dns.domain} answers SPF and DMARC via Google Public DNS.`,
          remediation: 'Keep p=reject when you are ready. Monitor aggregate reports.',
        });
      }
    }
  }

  if (moduleId === 'password' && record.samplePassword) {
    const pwned = await checkPwnedPassword(record.samplePassword);
    if (pwned) {
      consulted.push(...pwned.notes);
      findingsHint.push({
        id: 'pw-hibp-live',
        status: pwned.count > 0 ? 'NUKED' : 'KNOXED',
        label: pwned.count > 0 ? `HIBP: seen ${pwned.count.toLocaleString()} times` : 'HIBP: not in range list',
        detail:
          pwned.count > 0
            ? 'Only a SHA-1 prefix left this device. The suffix matched Have I Been Pwned. Rotate it everywhere it was reused.'
            : 'k-anonymity check against api.pwnedpasswords.com returned no suffix hit.',
        remediation: pwned.count > 0 ? 'Unique 32+ char secret or a passkey. Then drop the old one.' : 'Keep it unique. Prefer a passkey anyway.',
      });
    }
  }

  if (moduleId === 'network') {
    const net = await checkEgressNetwork();
    if (net) {
      consulted.push(...net.notes);
      findingsHint.push({
        id: 'net-egress-live',
        status: 'MONITORED',
        label: `Egress ${net.ip}`,
        detail: `ipapi.co reports ${net.org} from ${net.city || 'an undisclosed city'}. Compare this to the DNS resolver you sealed.`,
        remediation: 'If this ASN is your ISP and DNS is still ISP-default, turn on DNS-over-HTTPS.',
      });
    }
  }

  return { findingsHint, consulted };
}
