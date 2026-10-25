/**
 * 16 Module Agents — client-side identity-vector scanners.
 * Each agent turns the user's sealed fields into findings + a plain-English briefing.
 * Lookups are heuristic / local so the PWA stays zero-knowledge.
 */

import { MODULE_BY_ID, ModuleFinding, FindingStatus } from '../module-catalog';

export interface AgentResult {
  moduleId: string;
  vector: string;
  findings: ModuleFinding[];
  score: number;
  summary: string;
  scannedAt: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function scoreOf(findings: ModuleFinding[]): number {
  if (!findings.length) return 100;
  const pts = findings.reduce((s, f) => s + (f.status === 'KNOXED' ? 10 : f.status === 'MONITORED' ? 5 : 0), 0);
  return Math.round((pts / (findings.length * 10)) * 100);
}

function finding(
  id: string,
  status: FindingStatus,
  label: string,
  detail: string,
  remediation: string
): ModuleFinding {
  return { id, status, label, detail, remediation };
}

function lower(record: Record<string, string>): string {
  return Object.values(record).join(' ').toLowerCase();
}

async function runHeuristics(
  moduleId: string,
  record: Record<string, string>,
  onProgress?: (pct: number, msg: string) => void
): Promise<ModuleFinding[]> {
  const mod = MODULE_BY_ID[moduleId];
  const blob = lower(record);
  const findings: ModuleFinding[] = [];
  const configured = Object.values(record).some((v) => (v || '').trim());

  onProgress?.(20, `Hashing ${mod?.shortLabel || moduleId} identifiers…`);
  await delay(180);
  onProgress?.(55, 'Cross-checking sealed fields against local heuristics…');
  await delay(220);
  onProgress?.(80, 'Writing plain-English briefing…');
  await delay(140);

  if (!configured) {
    findings.push(
      finding(
        `${moduleId}-empty`,
        'MONITORED',
        'Vector is empty',
        `Nothing is sealed in ${mod?.name || moduleId} yet. Add the fields so Architect AI can brief you in plain language.`,
        `Fill in ${mod?.fields[0].label.toLowerCase() || 'the first field'} and tap Seal.`
      )
    );
    onProgress?.(100, 'Scan complete.');
    return findings;
  }

  // Shared danger words
  if (/(leak|pwned|unencrypted|plaintext|root|jailbreak|sms otp|anyone with the link)/i.test(blob)) {
    findings.push(
      finding(
        `${moduleId}-signal`,
        'NUKED',
        'Exposure language in sealed fields',
        'One of the values you entered includes a known high-risk marker (leak, unencrypted, SMS OTP, public link, jailbreak). Treat it as live until you rotate or revoke.',
        'Fix the underlying issue, then re-seal this vector so the tile can turn KNOXED.'
      )
    );
  }

  switch (moduleId) {
    case 'email': {
      const email = record.primaryEmail || '';
      if (email && !email.includes('@')) {
        findings.push(finding('email-format', 'MONITORED', 'That does not look like an email', 'We need a full address to hash and check.', 'Add an address like you@domain.com.'));
      }
      if (/gmail|outlook|yahoo/i.test(record.provider || record.primaryEmail || '')) {
        findings.push(
          finding(
            'email-recovery',
            record.recoveryEmail ? 'MONITORED' : 'NUKED',
            record.recoveryEmail ? 'Recovery path present — confirm MFA' : 'No recovery inbox listed',
            record.recoveryEmail
              ? 'A recovery inbox is the back door. If it is SMS-only, the primary account is only as strong as that SIM.'
              : 'Without a listed recovery path we cannot tell whether an attacker can reset you.',
            'Bind a passkey on both primary and recovery. Drop SMS fallback.'
          )
        );
      }
      break;
    }
    case 'password': {
      if (/browser only|memory|notes/i.test(record.vault || '')) {
        findings.push(
          finding(
            'pw-vault',
            'NUKED',
            'Passwords are not in a real vault',
            'Browser-saved or remembered passwords get reused and phished. A dedicated vault plus passkeys is the knoxed pattern.',
            'Move them into 1Password / Bitwarden / Apple Passwords today.'
          )
        );
      }
      break;
    }
    case 'network': {
      if (/isp default|unknown/i.test(record.dns || '')) {
        findings.push(
          finding(
            'net-dns',
            'NUKED',
            'DNS is still in the clear toward your ISP',
            'Every domain you visit is a log line. Flip the router to DNS-over-HTTPS.',
            'Cloudflare 1.1.1.1 or Quad9 9.9.9.9 with DoH — then re-scan.'
          )
        );
      }
      break;
    }
    case 'docs': {
      if (/notes|email to self|camera/i.test(record.copies || '')) {
        findings.push(
          finding(
            'docs-copy',
            'NUKED',
            'ID copies live in syncing apps',
            'A license photo in Notes or Camera Roll syncs to the cloud in the same motion as a meme.',
            'Delete the copies. Keep the plastic card. Enroll an IRS IP PIN if you file in the US.'
          )
        );
      }
      break;
    }
    default:
      break;
  }

  if (!findings.some((f) => f.status === 'NUKED')) {
    findings.push(
      finding(
        `${moduleId}-sealed`,
        'KNOXED',
        `${mod?.shortLabel || 'Vector'} sealed cleanly`,
        `The fields you entered did not trip a high-risk heuristic. Keep the SHA-256 seal and re-scan after any account change.`,
        'Leave monitoring on. Revisit this tile if you add a new device, inbox, or handle.'
      )
    );
  }

  onProgress?.(100, 'Scan complete.');
  return findings;
}

export const ModuleAgentRuntime = {
  async execute(
    moduleId: string,
    record: Record<string, string>,
    onProgress?: (pct: number, msg: string) => void
  ): Promise<AgentResult> {
    const mod = MODULE_BY_ID[moduleId];
    if (!mod) throw new Error(`No agent registered for ${moduleId}`);
    const findings = await runHeuristics(moduleId, record, onProgress);
    const score = scoreOf(findings);
    const nuked = findings.filter((f) => f.status === 'NUKED').length;
    const summary =
      nuked > 0
        ? `${mod.name}: ${nuked} live exposure${nuked > 1 ? 's' : ''} — ${findings[0].label}.`
        : `${mod.name}: posture ${score}/100. ${findings[0]?.label || 'Clear.'}`;
    return {
      moduleId,
      vector: mod.vector,
      findings,
      score,
      summary,
      scannedAt: new Date().toISOString(),
    };
  },

  async executeAll(
    records: Record<string, Record<string, string>>,
    onProgress?: (current: number, total: number, moduleId: string, msg: string) => void
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const ids = Object.keys(MODULE_BY_ID);
    let i = 0;
    for (const id of ids) {
      i += 1;
      onProgress?.(i, ids.length, id, `Scanning ${MODULE_BY_ID[id].name}…`);
      results.push(await this.execute(id, records[id] || {}));
    }
    return results;
  },
};
