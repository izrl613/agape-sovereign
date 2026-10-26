# Dashboard preview — post-login shell

Screenshots captured from the Vite dev server (`http://127.0.0.1:5173`) in headless
Chromium after completing the guest / anonymous bypass on `/login`. Every frame was
taken with **zero page errors** — the shell renders on the first paint after the
redirect, with no empty state.

| Screen | Route | File |
|--------|-------|------|
| Diff Command Center | `/dashboard` | `dashboard.png` |
| Architect AI | `/architect` | `architect-ai.png` |
| Diff Report | `/report` | `diff-report.png` |
| Module splash (Health Identity) | `/modules/health` | `module-splash.png` |
| Module entry form | `/modules/health` → *Begin Vectorization* | `module-entry.png` |

## What the sequence proves

1. `/login` → **Guest / Anonymous Bypass** lands on `/dashboard` with the full shell
   (header, left nav, 16 vector modules) already mounted — this was previously a
   blank screen caused by a `undefined.reduce` crash in `DashboardView`.
2. `/dashboard`, `/architect`, `/report` and `/modules/:id` are addressable deep links;
   reloading any of them keeps the session (`sessionStorage['sovereign.session']`).
3. Module screens have a `← Dashboard` control and share the dark shell palette.
4. `SIGN OUT` (header) and the profile panel both return to `/login` and clear the
   session.

Regenerate with the recipe in `docs/dashboard-preview/` toolchain notes:
`@sparticuz/chromium` + `puppeteer-core`, `headless: 'shell'`,
`--no-sandbox --disable-gpu`, viewport 1440×900.
