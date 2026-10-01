/**
 * ARCHITECT AI — Modules Index
 * Re-exports agent types, base class, and registry.
 */

export type {
  IIdentityAgent,
  AgentConfig,
  AgentFinding,
  AgentResult,
  FindingStatus,
  ModuleId,
  ScanProgressCallback,
} from './agents/types';

export { MODULE_IDS, VECTOR_MAP } from './agents/types';
export { BaseAgent } from './agents/BaseAgent';
export { AgentRegistry, getAgentRegistry, resetAgentRegistry } from './agents/AgentRegistry';
