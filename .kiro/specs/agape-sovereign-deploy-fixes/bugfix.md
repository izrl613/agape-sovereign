# Bugfix Requirements Document

## Introduction

The Agape Sovereign project has three deployment bugs that block or degrade Firebase deploys, plus a feature gap that prevents users from exploring the app while auth is being fixed. The bugs are: (1) a duplicate `"overrides"` key in `package.json` that silently discards all security pins, (2) a broken `"apphosting"` block in `firebase.json` that triggers a Cloud Build failure on every deploy, and (3) an ESLint `no-explicit-any` violation in `functions/src/auth.ts` that can block the functions predeploy hook. The feature addition is a time-limited Demo Bypass mode — a futuristic button on the Login page and a persistent banner — that lets users enter the dashboard without completing auth while these issues are being resolved.

---

## Bug Analysis

### Current Behavior (Defect)

**Bug 1 — Duplicate `overrides` key silently drops security pins**

1.1 WHEN `package.json` is parsed by any JSON-spec-compliant parser THEN the system discards the first `"overrides"` block (containing `tar`, `uuid`, `jsonwebtoken`, `protobufjs`, `@grpc/grpc-js`, `@grpc/proto-loader`, `@opentelemetry/core`, `brace-expansion` pins) because JSON does not allow duplicate keys and last-wins semantics apply.

1.2 WHEN Cloud Build or a local `npm install` runs THEN the system installs transitive dependencies using only the stub `{ "uuid": "^10.0.0" }` override, leaving all other packages unpinned.

1.3 WHEN `npm audit` runs THEN the system emits a "duplicate overrides key" warning indicating misconfiguration.

**Bug 2 — App Hosting Cloud Build fails on every deploy**

1.4 WHEN `firebase deploy` (or `firebase deploy --only hosting`) runs THEN the system also triggers the `apphosting` backend build, which attempts to detect an SSR framework entry point.

1.5 WHEN the App Hosting Cloud Build runs against this Vite SPA (no `server.js` SSR entry, no Next.js / Nuxt / Remix adapter) THEN the system fails with "Failed to build your app" and exits non-zero, blocking the overall deploy.

**Bug 3 — ESLint `no-explicit-any` blocks functions predeploy**

1.6 WHEN the functions predeploy hook runs `npm run lint` in `functions/` THEN the system encounters `body.response as any` on line 541 of `functions/src/auth.ts`.

1.7 WHEN the Google ESLint config is active and the rule `@typescript-eslint/no-explicit-any` is set to "warn" THEN the system may exit non-zero, silently preventing a functions deploy.

---

### Expected Behavior (Correct)

**Bug 1 fix — Merged, deduplicated `overrides` block**

2.1 WHEN `package.json` is parsed THEN the system SHALL contain exactly one `"overrides"` block with all intended pins: `tar`, `uuid`, `jsonwebtoken`, `protobufjs`, `@grpc/grpc-js`, `@grpc/proto-loader`, `@opentelemetry/core`, and `brace-expansion`.

2.2 WHEN Cloud Build or `npm install` runs THEN the system SHALL resolve transitive dependencies using the complete set of override pins, preventing downgraded or vulnerable package versions.

2.3 WHEN `npm audit` runs THEN the system SHALL NOT emit a "duplicate overrides key" warning.

**Bug 2 fix — Remove broken `apphosting` block**

2.4 WHEN `firebase.json` is read during a deploy THEN the system SHALL NOT contain an `"apphosting"` block, so no App Hosting Cloud Build is triggered.

2.5 WHEN `firebase deploy` runs THEN the system SHALL deploy only the static `"hosting"` (from `dist/`), `"functions"`, `"firestore"`, and `"storage"` targets without triggering a failing Cloud Build.

**Bug 3 fix — Suppress ESLint `no-explicit-any` at the cast site**

2.6 WHEN the functions predeploy lint step runs THEN the system SHALL pass without error or warning on `functions/src/auth.ts` line 541.

2.7 WHEN `body.response` is accessed THEN the system SHALL type it as `{ userHandle?: string }` (or suppress the rule inline) so the lint step exits zero.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `npm install` runs with the merged `overrides` block THEN the system SHALL CONTINUE TO install all project dependencies without error.

3.2 WHEN the static `"hosting"` block in `firebase.json` is left intact THEN the system SHALL CONTINUE TO serve the Vite SPA from `dist/` at the project's Firebase Hosting URL.

3.3 WHEN `firebase deploy --only functions` runs THEN the system SHALL CONTINUE TO build and deploy Cloud Functions with the existing TypeScript compilation step.

3.4 WHEN `body.response` is typed as `{ userHandle?: string }` in `auth.ts` THEN the system SHALL CONTINUE TO correctly extract `userHandle` from the authenticator assertion response.

3.5 WHEN all other `auth.ts` logic runs THEN the system SHALL CONTINUE TO handle passkey login, passkey registration, and custom-token sign-in without behavioral change.

---

## Feature: Demo Bypass Mode

### Current Behavior (Defect)

4.1 WHEN a user visits the Login page and Firebase auth is broken or unavailable THEN the system has no fallback path, leaving the user blocked with no way to explore the app.

4.2 WHEN a developer or tester wants to preview the dashboard without completing auth setup THEN the system has no mechanism to bypass the `ProtectedRoute` check.

### Expected Behavior (Correct)

**DemoBypassButton — Login page**

5.1 WHEN `import.meta.env.VITE_DEMO_MODE === 'true'` OR the URL contains `?demo=true` THEN the system SHALL render a `DemoBypassButton` below the existing auth options on the Login page, separated by an "OR" divider.

5.2 WHEN the Demo button is visible THEN the system SHALL display it with a neon orange (`#FF7A18`) color scheme, a pulsing border animation, and glitch-text on the label "ENTER AS GUEST // DEMO MODE" to visually distinguish it from real auth buttons.

5.3 WHEN the user clicks the Demo button THEN the system SHALL set `sessionStorage['sovereign_demo_mode'] = JSON.stringify({ active: true, expiresAt: Date.now() + 30 * 60 * 1000 })` and call `setDemoUser()` on `AuthContext`, injecting the synthetic user `{ uid: 'demo-user', email: 'demo@sovereign.nyc', displayName: 'Demo Explorer', isAnonymous: true }`.

5.4 WHEN `setDemoUser()` is called THEN the system SHALL set `demoMode: true` on the auth context and allow `ProtectedRoute` to pass the user through to the dashboard.

**DemoBanner — Persistent sticky banner**

5.5 WHEN `demoMode` is `true` THEN the system SHALL render a `DemoBanner` as a sticky element at the top of every page inside `<BrowserRouter>`.

5.6 WHEN `DemoBanner` is rendered THEN the system SHALL display the text "🔬 DEMO MODE — Sign in to save your data" and a "Sign In" link that navigates to `/login` and clears the demo flag and sessionStorage entry.

**Auto-expiry**

5.7 WHEN the app boots and `sessionStorage['sovereign_demo_mode']` exists THEN the system SHALL check whether `expiresAt` has passed; if expired, the system SHALL clear the flag and treat the user as unauthenticated.

5.8 WHEN the demo session expires mid-session THEN the system SHALL redirect the user to `/login`.

**Visibility gate**

5.9 WHEN `VITE_DEMO_MODE` is not `'true'` AND the URL does not contain `?demo=true` THEN the system SHALL NOT render the `DemoBypassButton`, keeping the login page unchanged for production.

### Unchanged Behavior (Regression Prevention)

6.1 WHEN `demoMode` is `false` THEN the system SHALL CONTINUE TO enforce `ProtectedRoute` for all unauthenticated users.

6.2 WHEN a real Firebase user is signed in THEN the system SHALL CONTINUE TO handle the normal auth flow without interference from demo-mode logic.

6.3 WHEN the Login page renders in production (neither env var nor query param set) THEN the system SHALL CONTINUE TO show only Google and Passkey auth options, with no demo button visible.

6.4 WHEN `AuthContext` is consumed by existing components THEN the system SHALL CONTINUE TO expose all existing context values (`user`, `userData`, `isAdmin`, `loading`, `login`, `loginWithPasskey`, `logout`, `bindPasskey`, `setSetupComplete`, `updateProfile`) without breaking changes.

---

## Bug Condition Pseudocode

```pascal
// Bug 1 — Duplicate overrides key
FUNCTION isBugCondition_1(packageJson)
  INPUT: packageJson as parsed JSON object
  OUTPUT: boolean
  RETURN COUNT(keys where key = "overrides") > 1
END FUNCTION

FOR ALL packageJson WHERE isBugCondition_1(packageJson) DO
  result ← parsePackageJson'(packageJson)
  ASSERT COUNT(result.overrides_keys) = 1
  ASSERT result.overrides CONTAINS { tar, uuid, jsonwebtoken, protobufjs, "@grpc/grpc-js", "@grpc/proto-loader", "@opentelemetry/core", brace-expansion }
END FOR

FOR ALL packageJson WHERE NOT isBugCondition_1(packageJson) DO
  ASSERT parsePackageJson(packageJson) = parsePackageJson'(packageJson)  // Preservation
END FOR


// Bug 2 — App Hosting block present
FUNCTION isBugCondition_2(firebaseJson)
  INPUT: firebaseJson as parsed JSON object
  OUTPUT: boolean
  RETURN "apphosting" IN firebaseJson.keys
END FUNCTION

FOR ALL firebaseJson WHERE isBugCondition_2(firebaseJson) DO
  result ← deployFirebase'(firebaseJson)
  ASSERT result.apphosting_build_triggered = false
  ASSERT result.static_hosting_deployed = true
END FOR


// Bug 3 — Untyped `as any` cast
FUNCTION isBugCondition_3(sourceLine)
  INPUT: sourceLine as string
  OUTPUT: boolean
  RETURN sourceLine CONTAINS "as any" AND eslint_rule_active("no-explicit-any")
END FUNCTION

FOR ALL sourceLine WHERE isBugCondition_3(sourceLine) DO
  result ← runLint'(sourceLine)
  ASSERT result.exit_code = 0
  ASSERT result.warnings = 0
END FOR
```
