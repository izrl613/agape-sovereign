/**
 * ============================================================
 * Agape Sovereign — Exposure Probes
 * ============================================================
 *
 * A probe is the ONLY place a vector can produce findings. Probes must
 * inspect real, caller-supplied input. They must never fabricate results.
 *
 * If no probe is configured for a vector, the orchestrator records a
 * MONITORED "not configured" finding. This is deliberate:
 *   - No simulated NUKED/KNOXED findings are ever presented as real.
 *   - Operators can see exactly which vectors still need a data source.
 *
 * The three built-in probes below are deterministic, offline, local-only
 * checks over caller-supplied text. They never make network calls and
 * they redact every matched secret before returning a finding.
 */

import type { VectorDef } from './vectors.ts';

export type FindingStatus = 'NUKED' | 'KNOXED' | 'MONITORED';

export interface ProbeFinding {
  status: FindingStatus;
  label: string;
  detail: string;
  severity: number;
  remediation?: string;
  source?: string;
}

export interface ProbeContext {
  /** Raw user id. Probes must not echo it into findings. */
  userId: string;
  email?: string;
  /** Per-vector caller parameters. Avoid placing raw PII here when possible. */
  params?: Record<string, string>;
}

export interface ExposureProbe {
  id: string;
  moduleId: string;
  description: string;
  run(context: ProbeContext): Promise<ProbeFinding[]>;
}

// ── Registry ─────────────────────────────────────────────────────────────────

const registry = new Map<string, ExposureProbe>();

export function registerProbe(probe: ExposureProbe): void {
  if (!probe || typeof probe.moduleId !== 'string' || typeof probe.run !== 'function') {
    throw new Error('registerProbe: invalid probe');
  }
  registry.set(probe.moduleId, probe);
}

export function getProbe(moduleId: string): ExposureProbe | undefined {
  return registry.get(moduleId);
}

export function listProbes(): ExposureProbe[] {
  return Array.from(registry.values());
}

/** Honest placeholder for a vector with no configured data source. */
export function notConfiguredFinding(def: VectorDef): ProbeFinding {
  return {
    status: 'MONITORED',
    label: `${def.vector} probe not configured`,
    detail:
      `No verified probe is configured for ${def.label}. ` +
      `Findings are not fabricated. Connect a real source (${def.sources.join(', ')}) to enable this vector.`,
    severity: 0,
    source: 'not-configured',
  };
}

function clampSeverity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

// ── V-03: Local PII text probe (real, deterministic) ─────────────────────────

interface PiiPattern {
  id: string;
  label: string;
  severity: number;
  remediation: string;
  test: (text: string) => number;
}

/** Luhn check for 13–19 digit sequences (payment-card shaped). */
function countLuhnValid(text: string): number {
  const candidates = text.match(/\b(?:\d[ -]?){13,19}\b/g) ?? [];
  let count = 0;
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) continue;
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    if (sum % 10 === 0) count++;
  }
  return count;
}

const PII_PATTERNS: readonly PiiPattern[] = [
  {
    id: 'private-key',
    label: 'Private key material',
    severity: 100,
    remediation: 'Revoke and rotate the key, then move it into the encrypted enclave.',
    test: (t) => (t.match(/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g) ?? []).length,
  },
  {
    id: 'aws-access-key',
    label: 'AWS access key id',
    severity: 95,
    remediation: 'Disable the key in IAM and issue a scoped replacement.',
    test: (t) => (t.match(/\bAKIA[0-9A-Z]{16}\b/g) ?? []).length,
  },
  {
    id: 'ssn',
    label: 'US Social Security Number pattern',
    severity: 90,
    remediation: 'Remove the document from plaintext storage and store it in the enclave.',
    test: (t) => (t.match(/\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g) ?? []).length,
  },
  {
    id: 'credit-card',
    label: 'Payment card number (Luhn-valid)',
    severity: 85,
    remediation: 'Purge the plaintext card number and re-tokenize with the payment provider.',
    test: (t) => countLuhnValid(t),
  },
];

export class LocalPiiTextProbe implements ExposureProbe {
  readonly id = 'local-pii-text-v1';
  readonly moduleId = 'device-health';
  readonly description =
    'Deterministic offline scan of caller-supplied text for high-risk PII patterns.';

  async run(context: ProbeContext): Promise<ProbeFinding[]> {
    const text = context.params?.fileText;
    if (typeof text !== 'string' || text.length === 0) {
      return [
        {
          status: 'MONITORED',
          label: 'Local PII scan skipped',
          detail:
            'No file content was supplied. Provide params.fileText to run a real local PII scan.',
          severity: 0,
          source: 'local-pii-text',
        },
      ];
    }

    const findings: ProbeFinding[] = [];
    for (const pattern of PII_PATTERNS) {
      const matches = pattern.test(text);
      if (matches > 0) {
        findings.push({
          status: 'NUKED',
          label: `${pattern.label} detected`,
          // Deliberately counts only. The matched secret is never echoed.
          detail: `Detected ${matches} occurrence(s) of ${pattern.label.toLowerCase()} in the supplied file content. Value redacted.`,
          severity: clampSeverity(pattern.severity),
          remediation: pattern.remediation,
          source: 'local-pii-text',
        });
      }
    }

    if (findings.length === 0) {
      findings.push({
        status: 'KNOXED',
        label: 'No high-risk PII patterns detected',
        detail: 'The supplied file content contained no private keys, AWS keys, SSNs, or Luhn-valid card numbers.',
        severity: 0,
        source: 'local-pii-text',
      });
    }
    return findings;
  }
}

// ── V-12: Metadata / GPS probe (real, deterministic) ─────────────────────────

export class MetadataGpsProbe implements ExposureProbe {
  readonly id = 'metadata-gps-v1';
  readonly moduleId = 'metadata-purge';
  readonly description =
    'Detects EXIF GPS metadata markers in caller-supplied text or metadata dumps.';

  async run(context: ProbeContext): Promise<ProbeFinding[]> {
    const text = context.params?.fileText;
    if (typeof text !== 'string' || text.length === 0) {
      return [
        {
          status: 'MONITORED',
          label: 'Metadata scan skipped',
          detail:
            'No metadata dump was supplied. Provide params.fileText (e.g. exiftool output) to run a real scan.',
          severity: 0,
          source: 'metadata-gps',
        },
      ];
    }

    const gpsMarkers = /(GPSLatitude|GPSLongitude|GPS Position|exif:GPS|Composite:GPS)/i;
    if (gpsMarkers.test(text)) {
      return [
        {
          status: 'NUKED',
          label: 'GPS metadata present',
          detail:
            'The supplied metadata contains GPS latitude/longitude tags that can reveal precise physical location.',
          severity: 70,
          remediation: 'Strip EXIF/GPS tags before sharing; enable the metadata purge watchdog.',
          source: 'metadata-gps',
        },
      ];
    }
    return [
      {
        status: 'KNOXED',
        label: 'No GPS metadata markers found',
        detail: 'No EXIF GPS tags were found in the supplied metadata dump.',
        severity: 0,
        source: 'metadata-gps',
      },
    ];
  }
}

// ── V-01: Email hygiene probe (real, deterministic) ──────────────────────────

export class EmailHygieneProbe implements ExposureProbe {
  readonly id = 'email-hygiene-v1';
  readonly moduleId = 'email-scanner';
  readonly description =
    'Deterministic email-format and alias-hygiene check. Not a breach lookup.';

  async run(context: ProbeContext): Promise<ProbeFinding[]> {
    const email = context.email?.trim();
    if (!email) {
      return [
        {
          status: 'MONITORED',
          label: 'Email hygiene check skipped',
          detail: 'No email was supplied. Breach-database lookup is not configured.',
          severity: 0,
          source: 'email-hygiene',
        },
      ];
    }
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      return [
        {
          status: 'MONITORED',
          label: 'Email format not recognized',
          detail: 'The supplied identifier is not a valid email address, so hygiene checks were skipped.',
          severity: 0,
          source: 'email-hygiene',
        },
      ];
    }
    if (email.includes('+')) {
      return [
        {
          status: 'KNOXED',
          label: 'Alias-based email in use',
          detail: 'The address uses a plus-alias, which reduces cross-service correlation.',
          severity: 0,
          source: 'email-hygiene',
        },
      ];
    }
    return [
      {
        status: 'MONITORED',
        label: 'Single-address email in use',
        detail:
          'The address does not use an alias. Consider a unique alias per service to limit correlation. Breach lookup is not configured.',
        severity: 20,
        remediation: 'Enable per-service email aliases.',
        source: 'email-hygiene',
      },
    ];
  }
}

/** Probes shipped with the engine. Registration is explicit (no import side effects). */
export const BUILT_IN_PROBES: readonly ExposureProbe[] = [
  new EmailHygieneProbe(),
  new LocalPiiTextProbe(),
  new MetadataGpsProbe(),
];

/** Register the built-in probes if they are not already present. */
export function registerBuiltInProbes(): void {
  for (const probe of BUILT_IN_PROBES) {
    if (!registry.has(probe.moduleId)) registry.set(probe.moduleId, probe);
  }
}
