/**
 * ============================================================
 * ARCHITECT AI — Agent Registry & Orchestrator
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Central registry for all 16 identity vector agents.
 * Handles:
 *  - Agent registration and lookup
 *  - Full-scan orchestration (all 16 in parallel batches)
 *  - Single-module scan dispatch
 *  - Aggregate scoring for the Sovereign Score
 */

import {
  AgentResult,
  IIdentityAgent,
  ModuleId,
  MODULE_IDS,
  ScanProgressCallback,
} from './types';

export class AgentRegistry {
  private agents = new Map<ModuleId, IIdentityAgent>();
  private initialized = false;

  // ── Registration ─────────────────────────────────────────────────────────

  /**
   * Register an agent. Replaces any existing agent for the same moduleId.
   */
  register(agent: IIdentityAgent): void {
    this.agents.set(agent.config.moduleId, agent);
  }

  /**
   * Register multiple agents at once.
   */
  registerAll(agents: IIdentityAgent[]): void {
    for (const agent of agents) {
      this.register(agent);
    }
  }

  // ── Lookup ───────────────────────────────────────────────────────────────

  get(moduleId: ModuleId): IIdentityAgent | undefined {
    return this.agents.get(moduleId);
  }

  getAll(): IIdentityAgent[] {
    return Array.from(this.agents.values());
  }

  getRegisteredIds(): ModuleId[] {
    return Array.from(this.agents.keys());
  }

  get size(): number {
    return this.agents.size;
  }

  /**
   * Check if all 16 modules are registered.
   */
  isComplete(): boolean {
    return MODULE_IDS.every(id => this.agents.has(id));
  }

  /**
   * List modules that are NOT yet registered.
   */
  getMissingModules(): ModuleId[] {
    return MODULE_IDS.filter(id => !this.agents.has(id));
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Initialize all registered agents.
   */
  async initializeAll(): Promise<void> {
    if (this.initialized) return;

    const initPromises = this.getAll().map(async agent => {
      try {
        await agent.initialize();
      } catch (err) {
        console.error(`[AgentRegistry] Failed to initialize ${agent.config.moduleId}:`, err);
      }
    });

    await Promise.allSettled(initPromises);
    this.initialized = true;
  }

  /**
   * Shutdown all registered agents.
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = this.getAll().map(agent => agent.shutdown());
    await Promise.allSettled(shutdownPromises);
    this.initialized = false;
  }

  // ── Orchestration ────────────────────────────────────────────────────────

  /**
   * Execute ALL registered agents in parallel batches.
   *
   * @param userId      - Firebase UID
   * @param email       - User email
   * @param onProgress  - Progress callback (current, total, moduleId, subTask)
   * @param concurrency - Max concurrent agents (default 4 to avoid rate limits)
   */
  async executeAll(
    userId: string,
    email: string,
    onProgress?: ScanProgressCallback,
    concurrency = 4
  ): Promise<AgentResult[]> {
    if (!this.initialized) {
      await this.initializeAll();
    }

    const agents = this.getAll();
    const total = agents.length;
    const results: AgentResult[] = [];
    let completed = 0;

    // Process in batches to control concurrency
    for (let i = 0; i < agents.length; i += concurrency) {
      const batch = agents.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map(async agent => {
          onProgress?.(completed + 1, total, agent.config.moduleId, 'Scanning...');

          try {
            const result = await agent.execute(userId, email, undefined, (step, steps, modId, sub) => {
              onProgress?.(completed + 1, total, modId, sub);
            });
            return result;
          } finally {
            completed++;
            onProgress?.(completed, total, agent.config.moduleId, 'Complete');
          }
        })
      );

      for (const settled of batchResults) {
        if (settled.status === 'fulfilled') {
          results.push(settled.value);
        } else {
          console.error('[AgentRegistry] Agent failed:', settled.reason);
        }
      }
    }

    return results;
  }

  /**
   * Execute a single agent by module ID.
   */
  async executeOne(
    moduleId: ModuleId,
    userId: string,
    email: string,
    params?: Record<string, string>,
    onProgress?: ScanProgressCallback
  ): Promise<AgentResult> {
    const agent = this.agents.get(moduleId);
    if (!agent) {
      throw new Error(`[AgentRegistry] No agent registered for module: ${moduleId}`);
    }

    if (!this.initialized) {
      await agent.initialize();
    }

    return agent.execute(userId, email, params, onProgress);
  }

  // ── Scoring ──────────────────────────────────────────────────────────────

  /**
   * Calculate the aggregate Sovereign Score from individual agent results.
   * Uses each module's weight for a weighted average.
   */
  calculateSovereignScore(results: AgentResult[]): number {
    if (results.length === 0) return 0;

    let totalWeight = 0;
    let weightedScore = 0;

    for (const result of results) {
      const agent = this.agents.get(result.moduleId);
      const weight = agent?.config.weight ?? (1 / 16);
      totalWeight += weight;
      weightedScore += result.score * weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Generate reports for all results using each agent's AI reporter.
   */
  async generateAllReports(results: AgentResult[]): Promise<Map<ModuleId, string>> {
    const reports = new Map<ModuleId, string>();

    for (const result of results) {
      const agent = this.agents.get(result.moduleId);
      if (agent) {
        try {
          const report = await agent.generateReport(result.findings);
          reports.set(result.moduleId, report);
        } catch (err) {
          console.warn(`[AgentRegistry] Report generation failed for ${result.moduleId}:`, err);
          reports.set(result.moduleId, `Report generation failed for ${result.moduleId}.`);
        }
      }
    }

    return reports;
  }
}

import {
  EmailScannerAgent,
  SocialMapAgent,
  DeviceHealthAgent,
  SystemSecurityAgent,
  DeepWebAgent,
  BrokerRemovalAgent,
  NetworkVectorAgent,
  CloudEnclaveAgent,
  BiometricsAgent,
  CryptoAssetsAgent,
  SmartHomeAgent,
  MetadataPurgeAgent,
  KernelHealthAgent,
  BiosIntegrityAgent,
  SovereignIdAgent,
  ShadowPurgeAgent,
} from './implementations/vectorAgents';

let _registryInstance: AgentRegistry | null = null;

/**
 * Get or create the global AgentRegistry singleton pre-populated with all 16 agents.
 */
export function getAgentRegistry(): AgentRegistry {
  if (!_registryInstance) {
    _registryInstance = new AgentRegistry();
    _registryInstance.registerAll([
      new EmailScannerAgent(),
      new SocialMapAgent(),
      new DeviceHealthAgent(),
      new SystemSecurityAgent(),
      new DeepWebAgent(),
      new BrokerRemovalAgent(),
      new NetworkVectorAgent(),
      new CloudEnclaveAgent(),
      new BiometricsAgent(),
      new CryptoAssetsAgent(),
      new SmartHomeAgent(),
      new MetadataPurgeAgent(),
      new KernelHealthAgent(),
      new BiosIntegrityAgent(),
      new SovereignIdAgent(),
      new ShadowPurgeAgent(),
    ]);
  }
  return _registryInstance;
}

/**
 * Reset the global registry (useful for testing).
 */
export function resetAgentRegistry(): void {
  _registryInstance?.shutdownAll();
  _registryInstance = null;
}
