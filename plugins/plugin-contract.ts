/**
 * ============================================================
 * Agape Sovereign — Plugin Contract
 * ============================================================
 *
 * A minimal, security-first plugin system. Plugins register named tools
 * that can be invoked by the app, the automation runner, or an MCP bridge.
 *
 * Security rules enforced by the registry:
 *  - Tool names are namespaced (`domain.action`) and unique.
 *  - A plugin that declares `handlesPii: true` MUST declare `zeroKnowledge: true`.
 *  - A plugin that declares `requiresSecrets: true` is documented as handling
 *    secrets in-memory only; the registry never persists tool arguments.
 */

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown> | unknown;

export interface PluginSecurity {
  /** True only if the plugin keeps plaintext data client-side. */
  zeroKnowledge: boolean;
  /** True if the plugin may process PII. */
  handlesPii: boolean;
  /** True if the plugin needs passkey/recovery secrets at call time. */
  requiresSecrets: boolean;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  security: PluginSecurity;
  /** Relative entry file for documentation/tooling. */
  entry: string;
}

export interface PluginContext {
  registerTool(name: string, handler: ToolHandler): void;
  getTool(name: string): ToolHandler | undefined;
}

export interface SovereignPlugin {
  readonly manifest: PluginManifest;
  activate(context: PluginContext): Promise<void> | void;
  deactivate?(): Promise<void> | void;
}

const TOOL_NAME_RE = /^[a-z][a-zA-Z0-9_-]*(\.[a-z][a-zA-Z0-9_-]*)+$/;
const PLUGIN_ID_RE = /^[a-z][a-z0-9-]{1,31}$/;

export class PluginContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginContractError';
  }
}

function assertManifest(manifest: PluginManifest): void {
  if (!manifest || typeof manifest !== 'object') {
    throw new PluginContractError('Plugin manifest is required.');
  }
  if (!PLUGIN_ID_RE.test(manifest.id)) {
    throw new PluginContractError(
      `Invalid plugin id "${String(manifest.id)}": use lowercase letters, digits, and dashes (2–32 chars).`,
    );
  }
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    throw new PluginContractError(`Plugin "${manifest.id}" must declare at least one capability.`);
  }
  const security = manifest.security;
  if (!security || typeof security !== 'object') {
    throw new PluginContractError(`Plugin "${manifest.id}" must declare a security block.`);
  }
  if (security.handlesPii && !security.zeroKnowledge) {
    throw new PluginContractError(
      `Plugin "${manifest.id}" handles PII but is not zero-knowledge. This is forbidden.`,
    );
  }
}

export class SovereignPluginRegistry implements PluginContext {
  private tools = new Map<string, ToolHandler>();
  private plugins = new Map<string, SovereignPlugin>();

  registerTool(name: string, handler: ToolHandler): void {
    if (!TOOL_NAME_RE.test(name)) {
      throw new PluginContractError(
        `Invalid tool name "${name}". Use namespaced "domain.action" (e.g. "zk.encrypt").`,
      );
    }
    if (typeof handler !== 'function') {
      throw new PluginContractError(`Tool "${name}" handler must be a function.`);
    }
    if (this.tools.has(name)) {
      throw new PluginContractError(`Tool "${name}" is already registered.`);
    }
    this.tools.set(name, handler);
  }

  getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  listTools(): string[] {
    return Array.from(this.tools.keys()).sort();
  }

  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map((p) => p.manifest);
  }

  async activate(plugin: SovereignPlugin): Promise<void> {
    assertManifest(plugin.manifest);
    if (this.plugins.has(plugin.manifest.id)) {
      throw new PluginContractError(`Plugin "${plugin.manifest.id}" is already activated.`);
    }
    await plugin.activate(this);
    this.plugins.set(plugin.manifest.id, plugin);
  }

  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    await plugin.deactivate?.();
    this.plugins.delete(pluginId);
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const handler = this.tools.get(name);
    if (!handler) throw new PluginContractError(`Unknown tool "${name}".`);
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw new PluginContractError('Tool arguments must be a plain object.');
    }
    return handler(args);
  }
}
