/**
 * Architect AI ↔ Third-Party Validator Agent handoff.
 * Architect reads the 16 vectors, ships a sealed payload to the validator,
 * receives receipts, then validates the compile before the Identity Audit Report.
 */

import { MODULE_AGENTS, ModuleFinding } from '../module-catalog';
import { buildModuleBriefing, worstStatus } from '../utils/briefing';
import { runLiveValidators, ValidatorNote } from './validators';
import { calculateSha256 } from './cryptoService';

type VectorState = {
  record: Record<string, string>;
  findings: ModuleFinding[];
  hash?: string;
  lastScanned?: string | null;
  customized?: boolean;
};

export type Verdict = 'NUKED' | 'KNOXED' | 'MONITORED' | 'EMPTY';

export interface ValidatorReceipt {
  moduleId: string;
  vector: string;
  name: string;
  consulted: ValidatorNote[];
  verdict: Verdict;
  findingPatches: ModuleFinding[];
  handedOffAt: string;
  returnedAt: string;
}

export interface ArchitectPipelineResult {
  startedAt: string;
  completedAt: string;
  logs: string[];
  receipts: ValidatorReceipt[];
  nuked: number;
  knoxed: number;
  monitored: number;
  compileHash: string;
  synthesis: string;
  valid: boolean;
  findingUpdates: Record<string, ModuleFinding[]>;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runArchitectPipeline(
  modules: Record<string, VectorState>,
  operator: { id: string; displayName: string },
  onLog?: (msg: string) => void
): Promise<ArchitectPipelineResult> {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    onLog?.(msg);
  };
  const startedAt = new Date().toISOString();
  log(`Architect AI waking for ${operator.displayName}…`);
  await delay(80);

  const receipts: ValidatorReceipt[] = [];
  const findingUpdates: Record<string, ModuleFinding[]> = {};

  for (const mod of MODULE_AGENTS) {
    const row = modules[mod.id] || { record: {}, findings: [], hash: '', lastScanned: null, customized: false };
    const briefing = buildModuleBriefing(mod, row.record, row.findings, operator.displayName);
    log(`Architect read ${mod.vector} ${mod.name} · ${briefing.status}`);
    await delay(40);

    const handedOffAt = new Date().toISOString();
    log(`Handoff ${mod.vector} → Third-Party Validator Agent (sealed fields only)`);
    let consulted: ValidatorNote[] = [];
    let patches: ModuleFinding[] = [];
    try {
      const live = await runLiveValidators(mod.id, row.record || {});
      consulted = live.consulted;
      patches = live.findingsHint;
      if (consulted.length) {
        log(`Validator ${mod.vector} consulted ${consulted.map((n) => n.source).join(', ')}`);
      } else {
        log(`Validator ${mod.vector} · no live source (heuristic only)`);
      }
    } catch {
      log(`Validator ${mod.vector} · live check skipped`);
    }

    const merged = [...(row.findings || [])];
    for (const p of patches) {
      if (!merged.some((f) => f.id === p.id)) merged.push(p);
    }
    findingUpdates[mod.id] = merged;
    const verdict = worstStatus(merged);
    const returnedAt = new Date().toISOString();
    receipts.push({
      moduleId: mod.id,
      vector: mod.vector,
      name: mod.name,
      consulted,
      verdict,
      findingPatches: patches,
      handedOffAt,
      returnedAt,
    });
    log(`Validator → Architect ${mod.vector} verdict ${verdict}`);
    await delay(30);
  }

  log('Architect validating compile — NUKED / KNOXED / MONITORED tallies…');
  await delay(120);

  const allFindings = Object.values(findingUpdates).flat();
  const nuked = allFindings.filter((f) => f.status === 'NUKED').length;
  const knoxed = allFindings.filter((f) => f.status === 'KNOXED').length;
  const monitored = allFindings.filter((f) => f.status === 'MONITORED').length;

  const compileHash = await calculateSha256(
    JSON.stringify({
      uid: operator.id,
      startedAt,
      receipts: receipts.map((r) => ({ v: r.vector, verdict: r.verdict, n: r.consulted.length })),
      nuked,
      knoxed,
      monitored,
    })
  );

  const valid = receipts.length === MODULE_AGENTS.length && compileHash.length === 64;
  const synthesis = valid
    ? `${operator.displayName}: ${nuked} NUKED, ${knoxed} KNOXED, ${monitored} MONITORED across 16 agents. ` +
      (nuked
        ? 'Start with every NUKED finding — nuke the exposure or knox the control — then re-seal so Architect can recompile.'
        : 'No live NUKED exposures. Keep KNOXED tiles sealed and re-run the validator after any account change.')
    : 'Compile failed. Re-run the validator handoff.';

  log(valid ? `Compile valid · SHA-256 ${compileHash.slice(0, 12)}…` : 'Compile INVALID');
  log('Identity Audit Report is ready to preview (22–30 pages by breadth).');

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    logs,
    receipts,
    nuked,
    knoxed,
    monitored,
    compileHash,
    synthesis,
    valid,
    findingUpdates,
  };
}

export function countStatuses(modules: Record<string, VectorState>) {
  const findings = Object.values(modules).flatMap((m) => m.findings || []);
  return {
    nuked: findings.filter((f) => f.status === 'NUKED').length,
    knoxed: findings.filter((f) => f.status === 'KNOXED').length,
    monitored: findings.filter((f) => f.status === 'MONITORED').length,
  };
}
