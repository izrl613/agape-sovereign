# Legal Pages — Privacy Policy & Terms of Service

Public, unauthenticated pages served by the `frontend/` app at:

| Route | Document | Aliases |
|-------|----------|---------|
| `/privacy` | Privacy Policy (v1.0, effective 2026‑03‑11) | `/legal/privacy` |
| `/terms` | Terms of Service (v1.0, effective 2026‑03‑11) | `/legal/terms`, `/terms-of-service` |

Both pages must stay reachable **without signing in** — Google OAuth brand
verification, app review, and crawlers all fetch them anonymously.

## Signed PDFs + integrity

The signed source documents are published verbatim from `frontend/public/`:

| Path | Document | Size | SHA-256 |
|------|----------|------|---------|
| `/terms/TERMS.pdf` | Terms of Service v1.0 | 3.4 MB | `d0718ae0afd0…9734` |
| `/privacy/PRIVACY.pdf` | Privacy Policy v1.0 | 17 KB | `37948367c429…3e0` |

Static files in `public/` win over the `** → /index.html` rewrite, so these
resolve on Firebase Hosting without touching `firebase.json`.

Identifiers live in `frontend/content/legal/documentIds.ts`. The page footers
show the relevant digest, and the landing/login footers show the manifest digest
of the pair. After replacing a PDF:

```bash
node scripts/hash-legal-docs.mjs           # print the new digests
node scripts/hash-legal-docs.mjs --write   # rewrite documentIds.ts
```

Every PDF entry point carries `type="application/pdf"`, `target="_blank"`,
`rel="noopener noreferrer"`, a human-readable weight, and the digest in its
tooltip.

## Layout

Both documents share one shell so they can never drift apart visually:

```
frontend/
├── content/legal/
│   ├── types.ts              # block model (p, ul, note, allcaps, facts, …)
│   ├── privacyPolicy.ts      # Privacy Policy copy, 1:1 with the signed PDF
│   └── termsOfService.ts     # Terms of Service copy, 1:1 with the signed PDF
└── components/legal/
    ├── LegalDocumentPage.tsx # header, progress rail, left nav, article, print
    ├── LegalBlocks.tsx       # renders the block model
    ├── RichText.tsx          # **bold** / *italic* / [label](href) / auto-linked emails + URLs
    ├── PrivacyPolicyPage.tsx # /privacy
    └── TermsOfServicePage.tsx# /terms
```

### Colour rules

- **Neon blue** (`#00D4FF` family) is the only colour for navigation labels.
- **Orange** (`#FF7A18`) is reserved for position ("you are here") and PDF
  affordances.
- **The accent line** is exactly three colours, in this order:

  ```css
  linear-gradient(90deg, #FF2E9F 0%, #00D4FF 52%, #FF7A18 100%)
  ```

  It is defined once as `--legal-rainbow` and reused for the reading rail, the
  hero rule, heading underlines, the eyebrow tick, dividers, the footer rule,
  the landing-page footer border and the login-card divider. No other gradient
  belongs on a legal surface.

### The left nav (design spec)

- Long documents get a **sticky left table of contents**, generated from the
  content model — adding a section to the copy automatically adds the nav entry.
- Item labels are **neon blue** (`#00D4FF` family) on the near-black navy field.
- The clause the reader is currently inside is wrapped in an **orange box**:
  1px `#FF7A18` border, orange-tinted gradient fill, outer glow, and an orange
  section number. This is the only orange element in the nav, so it reads as
  "you are here" at a glance.
- Sections with subsections (e.g. Terms §3, §10, §15) expand their subsections
  **only while active**, keeping a 16-section document scannable.
- A progress rail at the top of the viewport plus a `SECTION 04 / 16 · 38 %`
  meter under the nav label give a second, numeric position signal.
- Below 1080px the panel collapses into a sticky one-line "on this page" bar
  (current section + progress) that expands into the full list on tap.
- The active entry auto-scrolls itself into view **inside the sidebar** without
  moving the page.

## Editing the copy

1. Edit `content/legal/privacyPolicy.ts` / `termsOfService.ts` — never the JSX.
2. Keep paragraph text 1:1 with the signed PDF. Supported inline markup:
   `**bold**`, `*italic*`, `[label](https://…)`, `https://…` and bare emails
   (auto-linked).
3. Bump `version` / `effectiveDate` in the document object — the hero chips, nav
   footer, meta tags, and print view all read from it.

Known corrections applied while transcribing the source PDFs:

- Terms §Document Details: the PDF prints the repository as
  `github.com/izrl613/agape-ai`; the live repository is
  `github.com/izrl613/agape-sovereign`, which is what the page links to.
- Privacy §2: the PDF lists `agape@sovereign.nyc` twice as administrator email;
  the page lists it once.

## Print / save as PDF

Both pages ship a `PRINT / SAVE AS PDF` action and a print stylesheet: the nav,
progress rail, and action buttons drop out, and the document renders as a clean
black-on-white legal document.

## Visual review

`docs/legal-pages-preview/index.html` is a self-contained gallery of screenshots
(desktop 1440, tablet 900, mobile 430, print emulation) captured from the running
dev server. Open it directly in a browser — no build step.

## Previewing locally

```bash
npm run dev-frontend        # or: cd frontend && npm run dev
# → http://localhost:5173/privacy
# → http://localhost:5173/terms
```
