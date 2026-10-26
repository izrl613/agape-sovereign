import { MODULE_AGENTS, ModuleAgentDef, ModuleFinding, FindingStatus } from '../module-catalog';

export interface BriefingFact {
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad' | 'info';
}

export interface UserBriefing {
  moduleId: string;
  vector: string;
  name: string;
  icon: string;
  who: string;
  headline: string;
  plainEnglish: string;
  nextAction: string;
  facts: BriefingFact[];
  status: FindingStatus | 'EMPTY';
  score: number;
  findingCount: number;
  configured: boolean;
}

export interface IdentityDossier {
  displayName: string;
  email: string;
  emailMasked: string;
  authLabel: string;
  locationHint: string;
  score: number;
  nuked: number;
  knoxed: number;
  monitored: number;
  sealed: number;
  total: number;
  oneLiner: string;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '—';
  const [user, domain] = email.split('@');
  const shown = user.slice(0, 1);
  return `${shown}${'•'.repeat(Math.max(2, Math.min(user.length - 1, 6)))}@${domain}`;
}

export function maskValue(value: string, keep = 4): string {
  if (!value) return '—';
  if (value.length <= keep) return value;
  return value.slice(0, keep) + '•'.repeat(Math.min(8, value.length - keep));
}

export function statusColor(status: FindingStatus | 'EMPTY'): string {
  if (status === 'NUKED') return '#FF2E9F';
  if (status === 'KNOXED') return '#00D4FF';
  if (status === 'MONITORED') return '#FF7A18';
  return '#7B9BB5';
}

export function scoreFromFindings(findings: ModuleFinding[]): number {
  if (!findings.length) return 100;
  const points = findings.reduce((s, f) => {
    if (f.status === 'KNOXED') return s + 10;
    if (f.status === 'MONITORED') return s + 5;
    return s;
  }, 0);
  return Math.round((points / (findings.length * 10)) * 100);
}

export function worstStatus(findings: ModuleFinding[]): FindingStatus | 'EMPTY' {
  if (!findings.length) return 'EMPTY';
  if (findings.some((f) => f.status === 'NUKED')) return 'NUKED';
  if (findings.some((f) => f.status === 'MONITORED')) return 'MONITORED';
  return 'KNOXED';
}

function factTone(status: FindingStatus | 'EMPTY'): BriefingFact['tone'] {
  if (status === 'NUKED') return 'bad';
  if (status === 'MONITORED') return 'warn';
  if (status === 'KNOXED') return 'ok';
  return 'info';
}

function recordFacts(mod: ModuleAgentDef, record: Record<string, string>): BriefingFact[] {
  return mod.fields
    .map((field) => {
      const raw = (record[field.key] || '').trim();
      if (!raw) return null;
      const value = field.type === 'email' ? maskEmail(raw) : raw.length > 64 ? `${raw.slice(0, 60)}…` : raw;
      return { label: field.label, value, tone: 'info' as const };
    })
    .filter(Boolean) as BriefingFact[];
}

export function buildModuleBriefing(
  mod: ModuleAgentDef,
  record: Record<string, string>,
  findings: ModuleFinding[],
  displayName: string
): UserBriefing {
  const configured = Object.values(record).some((v) => (v || '').trim().length > 0);
  const status = worstStatus(findings);
  const score = scoreFromFindings(findings);
  const facts: BriefingFact[] = [
    ...recordFacts(mod, record).slice(0, 3),
    ...findings.slice(0, 2).map((f) => ({
      label: f.status,
      value: f.label,
      tone: factTone(f.status),
    })),
  ].slice(0, 5);

  const who = record.primaryEmail
    ? maskEmail(record.primaryEmail)
    : record.legalName || record.handles || record.deviceName || record.phone || displayName || 'You';

  const top = findings[0];
  const plainEnglish = !configured
    ? `Nothing sealed in ${mod.shortLabel} yet. Add the fields on the right — we turn them into a briefing you can actually read, not a hash dump.`
    : top
      ? top.detail
      : `${mod.name} is sealed with no open findings. Keep it that way with a quick re-scan after any account change.`;

  const nextAction = !configured
    ? `Add your ${mod.fields[0].label.toLowerCase()} to start this vector.`
    : top?.remediation || 'Re-scan after you make the change so the tile can flip to KNOXED.';

  return {
    moduleId: mod.id,
    vector: mod.vector,
    name: mod.name,
    icon: mod.icon,
    who,
    headline: configured ? `${who} · ${status}` : 'Not configured yet',
    plainEnglish,
    nextAction,
    facts: facts.length ? facts : [{ label: 'Status', value: 'Awaiting your inputs', tone: 'info' }],
    status,
    score,
    findingCount: findings.length,
    configured,
  };
}

export function buildDossier(opts: {
  displayName: string;
  email: string;
  authMethod: string;
  modules: { id: string; findings: ModuleFinding[]; record: Record<string, string> }[];
}): IdentityDossier {
  let nuked = 0;
  let knoxed = 0;
  let monitored = 0;
  let sealed = 0;
  let weighted = 0;
  let weightSum = 0;

  for (const row of opts.modules) {
    const mod = MODULE_AGENTS.find((m) => m.id === row.id);
    const w = mod?.weight ?? 1 / 16;
    const score = scoreFromFindings(row.findings);
    weighted += score * w;
    weightSum += w;
    if (Object.values(row.record).some((v) => (v || '').trim())) sealed += 1;
    nuked += row.findings.filter((f) => f.status === 'NUKED').length;
    knoxed += row.findings.filter((f) => f.status === 'KNOXED').length;
    monitored += row.findings.filter((f) => f.status === 'MONITORED').length;
  }

  const score = weightSum ? Math.round(weighted / weightSum) : 100;
  const emailMasked = maskEmail(opts.email);
  const authLabel =
    opts.authMethod === 'PASSKEY' ? 'Passkey vault' : opts.authMethod === 'GOOGLE' ? 'Google' : 'Guest session';

  const hottest = opts.modules
    .map((row) => ({ row, n: row.findings.filter((f) => f.status === 'NUKED').length }))
    .sort((a, b) => b.n - a.n)[0];
  const hotMod = hottest?.n ? MODULE_AGENTS.find((m) => m.id === hottest.row.id) : null;

  const oneLiner = hotMod
    ? `${emailMasked} · Score ${score} · Start with ${hotMod.shortLabel}: ${hottest.row.findings.find((f) => f.status === 'NUKED')?.label}`
    : `${emailMasked} · Score ${score} · ${sealed}/16 vectors sealed · ${authLabel}`;

  return {
    displayName: opts.displayName,
    email: opts.email,
    emailMasked,
    authLabel,
    locationHint: 'New York, NY',
    score,
    nuked,
    knoxed,
    monitored,
    sealed,
    total: 16,
    oneLiner,
  };
}
