/**
 * Firebase Cloud Functions entrypoint for Agape Sovereign.
 * All HTTP / callable exports must be re-exported from this file
 * so `firebase deploy --only functions` actually publishes them.
 */

import {setGlobalOptions} from "firebase-functions";

// Cost control: default max instances across Gen2 functions.
// Override per-function with onRequest({ maxInstances: N }, ...).
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
  serviceAccount: "compute-sa@agape-sovereign.iam.gserviceaccount.com",
});

// WebAuthn / Passkey Auth API (Hosting rewrite: /api/auth/**)
export {authApi} from "./auth";

// Architect AI HTTP endpoint
export {architectApi} from "./architect-ai";

// Policy document generator
export {generatePolicyDocument} from "./policyGenerator";

// Analytics / billing callable
export {fetchAnalyticsData} from "./bigquery";

// Identity Vector Pipeline — full backend pipeline:
//   16 IVM modules → Agent execution → Architect AI → PDF Export Agent
export {processIdentityVectors} from "./process-identity-vectors";
