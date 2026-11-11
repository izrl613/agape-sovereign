/**
 * Agape Sovereign — Built-in Plugins
 *
 * Usage:
 *   const registry = new SovereignPluginRegistry();
 *   await loadBuiltInPlugins(registry);
 *   await registry.callTool('vectors.list');
 */

export * from './plugin-contract.ts';
export { zeroKnowledgePlugin } from './zero-knowledge/index.ts';
export { identityVectorsPlugin } from './identity-vectors/index.ts';
export { automationPlugin } from './automation/index.ts';

import { SovereignPluginRegistry, type SovereignPlugin } from './plugin-contract.ts';
import { zeroKnowledgePlugin } from './zero-knowledge/index.ts';
import { identityVectorsPlugin } from './identity-vectors/index.ts';
import { automationPlugin } from './automation/index.ts';

export const BUILT_IN_PLUGINS: readonly SovereignPlugin[] = [
  zeroKnowledgePlugin,
  identityVectorsPlugin,
  automationPlugin,
];

/** Activate all built-in plugins on the supplied registry. */
export async function loadBuiltInPlugins(
  registry: SovereignPluginRegistry,
): Promise<SovereignPluginRegistry> {
  for (const plugin of BUILT_IN_PLUGINS) {
    await registry.activate(plugin);
  }
  return registry;
}
