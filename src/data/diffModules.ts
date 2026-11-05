import { DIFF_MODULES } from "../lib/diffModules";
import type { DiffModule } from "../types/diff.ts";

/**
 * Base modules for the identity engine.
 * Now synchronized with the Sovereign Enclave 2026 Specification.
 */
export const BASE_MODULES: DiffModule[] = DIFF_MODULES;

export const DEFAULT_MODULE_DATA = BASE_MODULES.map(m => ({ ...m }));

export const ADMIN_EMAILS = ["idin@agape.nyc", "agape@sovereign.nyc"];
