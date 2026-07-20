/**
 * Agape Sovereign — Firebase Cloud Functions entry point
 *
 * Exports all function submodules. setGlobalOptions caps containers
 * for cost control. Each submodule initializes firebase-admin itself.
 */

import {setGlobalOptions} from "firebase-functions";

// Cost control: cap containers per function to limit runaway spend
setGlobalOptions({ maxInstances: 10 });

// Re-export all function submodules
export * from "./auth";
export * from "./architect-ai";
export * from "./bigquery";
export * from "./policyGenerator";
