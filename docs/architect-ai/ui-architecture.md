# Architect AI — UI Component Architecture

## Shell and navigation

Reuse the current React/TypeScript/Vite frontend and its established theme/context conventions. Avoid a parallel app shell.

```text
App
└── SovereignProvider
    ├── GlobalStyles / SovereignTheme
    ├── AuthGate
    │   ├── SignInPage
    │   ├── PasskeyEnrollment / PasskeyChallenge
    │   └── SovereignShell
    │       ├── SidebarNavigation
    │       ├── TopIdentityBar
    │       ├── StatusFooter
    │       └── RouteOutlet
    │           ├── OverviewPage
    │           ├── SourcesPage
    │           ├── EmailBackScanPage
    │           ├── SocialFootprintPage
    │           ├── DeviceFilesPage
    │           ├── ExposureMonitorPage
    │           ├── RemediationPage
    │           ├── ArchitectAIPage
    │           ├── ReportsPage
    │           └── AdminPortal
    └── GlobalErrorBoundary
```

## Page composition

### OverviewPage
- `SovereignScoreCard` — score, scoring version, coverage and last scan.
- `ExposureSummary` — severity counts and source distribution.
- `RecentScanList` — scan state, source and timestamps.
- `RemediationQueue` — pending NUKED/KNOXED tasks.
- `ArchitectInsightPanel` — cited insights linked to findings.

### SourcesPage
- `SourceConnectionCard`, `ProviderConsentDialog`, `ScopeReview`,
  `ConnectionStatusBadge`, `RevokeSourceButton`.
- Show exactly which scopes are granted and when a source was last verified.
- Never display access/refresh tokens.

### Scanner pages
Shared building blocks:
- `ScanLaunchPanel`
- `ScanProgressTimeline`
- `CoverageDisclosure`
- `FindingTable`
- `FindingDetailDrawer`
- `EvidenceViewer` (redacted by default)
- `EmptyState` and `UnsupportedSourceNotice`

Email, social, and device scanners use provider adapters and explicit permissions. Device scanning is user-selected-file or companion-agent based; do not imply browser access to an entire device.

### RemediationPage
- `RemediationBoard`
- `NukedKnoxedStatus`
- `RemediationApprovalDialog`
- `VerificationEvidencePanel`
- `RemediationHistory`

The UI must distinguish pending requests from verified completion. Require confirmation before destructive or external account actions.

### ArchitectAIPage
- `ConversationList`
- `ChatTranscript`
- `ChatComposer`
- `ContextScopePicker`
- `FindingCitationChip`
- `SafetyDisclosure`
- `UsageMeter`

AI responses are advisory. The interface should show which user findings/public sources informed an answer and should not execute instructions from retrieved content.

### ReportsPage
- `ReportBuilder`
- `ReportCoverageSummary`
- `ReportHistoryTable`
- `SecureDownloadAction`

### AdminPortal
- `NodeHealthPanel`
- `FunctionHealthPanel`
- `QuotaAndBudgetPanel`
- `SecurityEventTable`
- `WebAuthnDiagnostics`

Admin pages require server-verified admin claims and step-up authentication. They show aggregate operational data, not unrestricted user records.

## Shared component and data layers

```text
src/
  app/
    routes/
    providers/
  components/
    shell/
    navigation/
    cards/
    charts/
    dialogs/
    forms/
    feedback/
  features/
    auth/
    passkeys/
    overview/
    sources/
    scans/
    findings/
    remediation/
    architect-ai/
    reports/
    admin/
  services/
    firebase/
    callable-functions/
    repositories/
  hooks/
  types/
  theme/
  utils/
```

Keep Firebase SDK access in service/repository modules. Components consume typed hooks and never construct arbitrary Firestore paths. All privileged mutations call authenticated Cloud Functions.

## Visual system

- Base canvas: deep navy `#070B1B` / `#0B1020`.
- Panels: elevated blue-black surfaces with subtle borders.
- Accent gradient: electric blue `#477BFF`, neon magenta `#D78BFF`, restrained orange `#FF9A45`.
- Status: green only for verified/healthy; amber for pending/attention; red for critical exposure.
- Use restrained glow, high contrast, visible focus rings, and readable typography.
- Responsive behavior: collapsible desktop sidebar; mobile drawer/bottom navigation; cards stack at narrow widths.
- Respect reduced-motion preferences and WCAG contrast targets.

## State and loading patterns

Every data view must define loading, empty, partial, error, and stale states. Display data freshness. Use optimistic updates only for reversible preferences; server-owned security states update after server confirmation. Cancel or deduplicate repeated scan requests.

## Accessibility and testing

- Keyboard-operable navigation and dialogs.
- Semantic headings, labels, live status announcements, and visible focus.
- Unit tests for score presentation and state transitions.
- Component tests for consent, confirmation, and empty/error states.
- Emulator-backed integration tests for auth, rules, and callable functions.
- End-to-end tests for sign-in → passkey → source consent → scan → finding → remediation → report.
