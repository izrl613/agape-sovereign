/**
 * Styles for the public legal pages (/privacy, /terms).
 *
 * Shares the sovereign.nyc design language — deep navy field, neon-blue type,
 * orange position marker, Orbitron headings, Share Tech Mono labels — and keeps
 * everything scoped under `.legal-*` so it can never leak into the app shell.
 *
 * The one non-negotiable rule from the brief: TOC labels are always blue, and
 * the reader's current position is wrapped in an orange box.
 */
export const LEGAL_CSS = `
  .legal-root {
    --legal-bg: #060C1A;
    --legal-ink: #E8F4FF;
    --legal-blue: #00D4FF;
    --legal-blue-soft: rgba(126, 224, 255, 0.62);
    --legal-blue-bright: #8DEEFF;
    --legal-orange: #FF7A18;
    --legal-magenta: #FF2E9F;
    --legal-line: rgba(0, 212, 255, 0.13);
    --legal-panel: rgba(7, 14, 28, 0.92);
    /* The house accent line. Exactly three colours — magenta, blue, orange —
       in brand order. Every rule/rail/underline in this stylesheet uses it. */
    --legal-rainbow: linear-gradient(90deg, #FF2E9F 0%, #00D4FF 52%, #FF7A18 100%);
    --legal-pink: #FF2E9F;

    position: relative;
    min-height: 100vh;
    background: var(--legal-bg);
    color: var(--legal-ink);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    /* NB: must NOT be overflow-x:hidden — that turns this element into a
       scroll container and silently breaks position:sticky for the header
       and the left nav; clip trims overflow without creating one. */
    overflow-x: clip;
  }

  /* ── Atmosphere ─────────────────────────────────────────── */
  .legal-atmos {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(0, 212, 255, 0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.028) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at 50% 0%, #000 10%, transparent 78%);
    -webkit-mask-image: radial-gradient(ellipse at 50% 0%, #000 10%, transparent 78%);
  }
  .legal-atmos::before,
  .legal-atmos::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(10px);
  }
  .legal-atmos::before {
    top: -280px; left: 50%; transform: translateX(-50%);
    width: 1080px; height: 620px;
    background: radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.10) 0%, transparent 70%);
  }
  .legal-atmos::after {
    bottom: -300px; right: -180px;
    width: 720px; height: 720px;
    background: radial-gradient(circle, rgba(255, 122, 24, 0.07) 0%, transparent 68%);
  }

  /* ── Reading progress rail ──────────────────────────────── */
  .legal-progress {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    z-index: 60;
    background: var(--legal-rainbow);
    transform-origin: 0 50%;
    transition: transform 0.12s linear;
    box-shadow: 0 0 12px rgba(255, 122, 24, 0.5);
  }

  /* ── Header ─────────────────────────────────────────────── */
  .legal-header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 32px;
    background: rgba(6, 12, 26, 0.94);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--legal-line);
  }
  .legal-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    min-width: 0;
  }
  .legal-brand svg {
    flex-shrink: 0;
    filter: drop-shadow(0 0 7px rgba(0, 212, 255, 0.65));
  }
  .legal-brand-main {
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #fff;
    white-space: nowrap;
  }
  .legal-brand-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: 8.5px;
    letter-spacing: 0.26em;
    color: var(--legal-blue);
    opacity: 0.75;
    margin-top: 3px;
    white-space: nowrap;
  }
  .legal-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .legal-nav-link {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-decoration: none;
    color: var(--legal-blue-soft);
    padding: 7px 12px;
    border: 1px solid transparent;
    border-radius: 6px;
    transition: color 0.18s, border-color 0.18s, background 0.18s;
  }
  .legal-nav-link:hover {
    color: var(--legal-blue-bright);
    border-color: rgba(0, 212, 255, 0.24);
    background: rgba(0, 212, 255, 0.05);
  }
  .legal-nav-link[aria-current='page'] {
    color: var(--legal-blue-bright);
    border-color: rgba(255, 122, 24, 0.75);
    background: rgba(255, 122, 24, 0.08);
    box-shadow: 0 0 14px rgba(255, 122, 24, 0.16);
  }
  .legal-nav-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-decoration: none;
    color: var(--legal-ink);
    padding: 7px 13px;
    border: 1px solid rgba(0, 212, 255, 0.26);
    border-radius: 6px;
    background: rgba(0, 212, 255, 0.06);
    transition: background 0.18s, border-color 0.18s;
  }
  .legal-nav-cta:hover {
    background: rgba(0, 212, 255, 0.13);
    border-color: rgba(0, 212, 255, 0.5);
  }

  /* ── Layout ─────────────────────────────────────────────── */
  .legal-layout {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 286px minmax(0, 1fr);
    gap: 56px;
    max-width: 1240px;
    margin: 0 auto;
    padding: 40px 32px 120px;
    align-items: start;
  }

  /* ── Left nav / table of contents ───────────────────────── */
  .legal-aside {
    position: sticky;
    top: 88px;
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: calc(100vh - 112px);
    padding: 16px 14px;
    border: 1px solid rgba(0, 212, 255, 0.16);
    border-radius: 14px;
    background: linear-gradient(180deg, rgba(9, 18, 34, 0.985), rgba(6, 12, 26, 0.97));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 48px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .legal-aside::before {
    content: '';
    position: absolute;
    top: 14px; bottom: 14px; left: 0;
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(0, 212, 255, 0.5), transparent);
  }
  .legal-toc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.12);
  }
  .legal-toc-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.24em;
    color: var(--legal-orange);
    text-shadow: 0 0 12px rgba(255, 122, 24, 0.4);
  }
  .legal-toc-eyebrow::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--legal-orange);
    box-shadow: 0 0 8px var(--legal-orange);
    animation: legal-pulse 2.4s ease-in-out infinite;
  }
  @keyframes legal-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.72); }
  }
  .legal-toc-current {
    display: none;
    min-width: 0;
    flex: 1 1 auto;
    font-family: 'Rajdhani', sans-serif;
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--legal-blue-bright);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .legal-toc-current b {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10.5px;
    font-weight: 400;
    color: var(--legal-orange);
    letter-spacing: 0.06em;
    margin-right: 7px;
  }
  .legal-toc-toggle {
    display: none;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.14em;
    color: var(--legal-blue);
    background: rgba(0, 212, 255, 0.07);
    border: 1px solid rgba(0, 212, 255, 0.28);
    border-radius: 6px;
    padding: 5px 9px;
    cursor: pointer;
  }

  /* position meter */
  .legal-meter {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 2px 2px 6px;
  }
  .legal-meter-bar {
    position: relative;
    height: 3px;
    border-radius: 2px;
    background: rgba(0, 212, 255, 0.14);
    overflow: hidden;
  }
  .legal-meter-bar > span {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 2px;
    background: var(--legal-rainbow);
    box-shadow: 0 0 10px rgba(255, 46, 159, 0.35);
    transition: width 0.15s linear;
  }
  .legal-meter-note {
    display: flex;
    justify-content: space-between;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: rgba(180, 205, 230, 0.5);
  }
  .legal-meter-note b {
    color: var(--legal-blue-bright);
    font-weight: 400;
  }

  .legal-toc {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 2px 4px 4px 2px;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 212, 255, 0.4) transparent;
  }
  .legal-toc::-webkit-scrollbar { width: 3px; }
  .legal-toc::-webkit-scrollbar-thumb {
    background: rgba(0, 212, 255, 0.4);
    border-radius: 3px;
  }

  /* TOC item — blue label, orange wrap when active */
  .legal-toc-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 7px 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    text-decoration: none;
    color: var(--legal-blue-soft);
    font-size: 12.4px;
    line-height: 1.35;
    letter-spacing: 0.015em;
    transition: color 0.16s, background 0.16s, border-color 0.16s, box-shadow 0.16s;
  }
  .legal-toc-item:hover {
    color: var(--legal-blue-bright);
    background: rgba(0, 212, 255, 0.055);
    border-color: rgba(0, 212, 255, 0.22);
  }
  .legal-toc-item:focus-visible {
    outline: 2px solid var(--legal-blue);
    outline-offset: 2px;
  }
  .legal-toc-num {
    flex-shrink: 0;
    min-width: 20px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10.5px;
    letter-spacing: 0.06em;
    color: rgba(0, 212, 255, 0.42);
    padding-top: 1px;
    transition: color 0.16s;
  }
  .legal-toc-label {
    min-width: 0;
  }
  .legal-toc-item.is-active {
    color: var(--legal-blue-bright);
    font-weight: 600;
    background: linear-gradient(90deg, rgba(255, 122, 24, 0.17), rgba(255, 122, 24, 0.035));
    border-color: var(--legal-orange);
    box-shadow:
      0 0 0 1px rgba(255, 122, 24, 0.18),
      0 0 16px rgba(255, 122, 24, 0.22),
      inset 0 0 14px rgba(255, 122, 24, 0.07);
    text-shadow: 0 0 14px rgba(141, 238, 255, 0.35);
  }
  .legal-toc-item.is-active .legal-toc-num {
    color: var(--legal-orange);
    text-shadow: 0 0 10px rgba(255, 122, 24, 0.55);
  }

  .legal-toc-sub {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 3px 0 5px 14px;
    padding-left: 10px;
    border-left: 1px dashed rgba(0, 212, 255, 0.2);
    animation: legal-reveal 0.22s ease-out;
  }
  @keyframes legal-reveal {
    from { opacity: 0; transform: translateY(-3px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .legal-toc-sub .legal-toc-item {
    font-size: 11.6px;
    padding: 5px 8px;
    color: rgba(126, 224, 255, 0.55);
  }
  .legal-toc-sub .legal-toc-num {
    font-size: 9.6px;
    min-width: 24px;
  }

  .legal-toc-foot {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: auto;
    padding-top: 11px;
    border-top: 1px solid rgba(0, 212, 255, 0.12);
  }
  .legal-legend {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 8.6px;
    letter-spacing: 0.1em;
    color: rgba(180, 205, 230, 0.45);
    line-height: 1.4;
  }
  .legal-legend-swatch {
    flex-shrink: 0;
    width: 16px;
    height: 11px;
    border: 1.5px solid var(--legal-orange);
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(255, 122, 24, 0.5);
  }
  .legal-toc-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.12em;
    text-decoration: none;
    color: var(--legal-blue);
    background: rgba(0, 212, 255, 0.05);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 6px;
    padding: 7px 9px;
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .legal-toc-action:hover {
    background: rgba(0, 212, 255, 0.11);
    border-color: rgba(0, 212, 255, 0.42);
    color: var(--legal-blue-bright);
  }

  /* ── Article ────────────────────────────────────────────── */
  .legal-main { min-width: 0; }
  .legal-doc { max-width: 780px; }

  .legal-hero { margin-bottom: 34px; }
  .legal-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.26em;
    color: var(--legal-orange);
    margin-bottom: 16px;
  }
  .legal-eyebrow::before {
    content: '';
    width: 26px; height: 2px;
    border-radius: 2px;
    background: var(--legal-rainbow);
  }
  .legal-h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(32px, 4.6vw, 50px);
    font-weight: 900;
    line-height: 1.06;
    letter-spacing: -0.02em;
    margin: 0 0 14px;
    background: linear-gradient(125deg, #ffffff 22%, #9BE9FF 58%, #FF9A48 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .legal-tagline {
    font-size: 15.5px;
    line-height: 1.65;
    color: rgba(214, 232, 248, 0.66);
    max-width: 620px;
    margin: 0 0 20px;
  }
  .legal-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  .legal-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: rgba(214, 232, 248, 0.72);
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(0, 212, 255, 0.16);
    border-radius: 100px;
    padding: 5px 12px;
    text-decoration: none;
    transition: border-color 0.18s, background 0.18s;
  }
  .legal-chip b {
    font-weight: 400;
    color: var(--legal-blue);
    letter-spacing: 0.16em;
    font-size: 9px;
  }
  a.legal-chip:hover {
    border-color: rgba(255, 122, 24, 0.5);
    background: rgba(255, 122, 24, 0.06);
  }
  .legal-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
    margin-top: 4px;
  }
  .legal-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-decoration: none;
    padding: 8px 14px;
    border-radius: 7px;
    border: 1px solid rgba(0, 212, 255, 0.28);
    background: rgba(0, 212, 255, 0.06);
    color: var(--legal-blue);
    cursor: pointer;
    transition: background 0.18s, border-color 0.18s, color 0.18s;
  }
  .legal-action:hover {
    background: rgba(0, 212, 255, 0.13);
    border-color: rgba(0, 212, 255, 0.5);
    color: var(--legal-blue-bright);
  }
  .legal-action.is-orange {
    border-color: rgba(255, 122, 24, 0.4);
    background: rgba(255, 122, 24, 0.07);
    color: #FFB27A;
  }
  .legal-action.is-orange:hover {
    background: rgba(255, 122, 24, 0.14);
    border-color: rgba(255, 122, 24, 0.7);
    color: #FFCEA6;
  }
  .legal-action.is-pdf {
    border-color: rgba(255, 46, 159, 0.32);
    background: rgba(255, 46, 159, 0.06);
    color: #FF8FC8;
  }
  .legal-action.is-pdf:hover {
    background: rgba(255, 46, 159, 0.13);
    border-color: rgba(255, 46, 159, 0.6);
    color: #FFC2DF;
  }
  .legal-action .legal-pdf-size {
    font-size: 8.5px;
    letter-spacing: 0.08em;
    color: rgba(180, 205, 230, 0.5);
  }

  .legal-hero-rule {
    height: 2px;
    margin: 26px 0 4px;
    border-radius: 2px;
    background: var(--legal-rainbow);
    box-shadow: 0 0 16px rgba(255, 46, 159, 0.22);
    mask-image: linear-gradient(90deg, #000 0%, #000 92%, transparent 100%);
    -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 92%, transparent 100%);
  }

  /* Section chrome */
  .legal-section {
    padding-top: 30px;
    scroll-margin-top: 104px;
  }
  .legal-section + .legal-section { border-top: 1px solid rgba(0, 212, 255, 0.08); }
  .legal-section-head {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 14px;
  }
  .legal-section-num {
    flex-shrink: 0;
    font-family: 'Orbitron', sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
    color: rgba(255, 122, 24, 0.18);
    -webkit-text-stroke: 0.9px rgba(255, 122, 24, 0.72);
    padding-top: 3px;
    min-width: 34px;
  }
  .legal-section-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.24em;
    color: rgba(0, 212, 255, 0.5);
    margin-bottom: 5px;
  }
  .legal-section-eyebrow::before {
    content: '';
    display: inline-block;
    width: 14px; height: 1px;
    margin-right: 7px;
    vertical-align: 3px;
    background: var(--legal-rainbow);
  }
  .legal-h2 {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(18px, 2.3vw, 23px);
    font-weight: 700;
    line-height: 1.28;
    letter-spacing: -0.01em;
    color: #fff;
    margin: 0;
  }
  .legal-h2::after {
    content: '';
    display: block;
    width: 54px;
    height: 2px;
    margin-top: 11px;
    background: var(--legal-rainbow);
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(255, 46, 159, 0.2);
  }

  .legal-subsection {
    padding-top: 20px;
    scroll-margin-top: 104px;
  }
  .legal-h3 {
    display: flex;
    align-items: baseline;
    gap: 9px;
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: 0.005em;
    color: #86E7FF;
    margin: 0 0 9px;
    padding-left: 11px;
    border-left: 2px solid rgba(255, 122, 24, 0.55);
  }
  .legal-h3-num {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11.5px;
    font-weight: 400;
    color: var(--legal-orange);
    letter-spacing: 0.06em;
  }

  /* Body copy */
  .legal-p {
    font-size: 14.8px;
    line-height: 1.82;
    color: rgba(226, 240, 252, 0.78);
    margin: 0 0 13px;
  }
  .legal-p strong { color: #fff; font-weight: 600; }
  .legal-p em { color: rgba(226, 240, 252, 0.9); }
  .legal-p a, .legal-li a, .legal-fact-v a, .legal-note a {
    color: var(--legal-blue);
    text-decoration: none;
    border-bottom: 1px dotted rgba(0, 212, 255, 0.45);
    transition: color 0.15s, border-color 0.15s;
  }
  .legal-p a:hover, .legal-li a:hover, .legal-fact-v a:hover, .legal-note a:hover {
    color: #fff;
    border-bottom-color: var(--legal-orange);
  }

  .legal-lead {
    font-size: 16.6px;
    line-height: 1.75;
    color: rgba(238, 246, 255, 0.9);
    margin: 0 0 22px;
    padding-left: 14px;
    border-left: 2px solid rgba(0, 212, 255, 0.45);
  }

  .legal-ul, .legal-ol {
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .legal-li {
    position: relative;
    font-size: 14.4px;
    line-height: 1.72;
    color: rgba(226, 240, 252, 0.76);
    padding-left: 20px;
  }
  .legal-ul > .legal-li::before {
    content: '';
    position: absolute;
    left: 3px;
    top: 9px;
    width: 6px;
    height: 6px;
    border: 1px solid var(--legal-orange);
    transform: rotate(45deg);
    background: rgba(255, 122, 24, 0.25);
  }
  .legal-ol { counter-reset: legal-counter; }
  .legal-ol > .legal-li { padding-left: 26px; }
  .legal-ol > .legal-li::before {
    counter-increment: legal-counter;
    content: counter(legal-counter) '.';
    position: absolute;
    left: 0;
    top: 0;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: var(--legal-orange);
  }

  /* "In Plain English" callout */
  .legal-note {
    position: relative;
    margin: 14px 0 18px;
    padding: 13px 16px 13px 18px;
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-left: 3px solid var(--legal-orange);
    border-radius: 9px;
    background:
      linear-gradient(100deg, rgba(0, 212, 255, 0.075), rgba(0, 212, 255, 0.02));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }
  .legal-note-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.22em;
    color: var(--legal-orange);
    margin-bottom: 6px;
  }
  .legal-note-label span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1px solid rgba(255, 122, 24, 0.7);
    font-size: 8px;
    color: var(--legal-orange);
  }
  .legal-note-text {
    font-size: 13.6px;
    line-height: 1.68;
    color: rgba(191, 238, 255, 0.9);
    font-style: italic;
    margin: 0;
  }

  /* ALL-CAPS clause block */
  .legal-clause {
    margin: 0 0 14px;
    padding: 15px 16px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.022);
    font-size: 12.2px;
    line-height: 1.74;
    letter-spacing: 0.045em;
    color: rgba(230, 240, 250, 0.74);
    text-transform: uppercase;
  }

  /* Fact grid */
  .legal-facts {
    display: grid;
    grid-template-columns: minmax(120px, max-content) minmax(0, 1fr);
    gap: 0;
    margin: 0 0 16px;
    border-top: 1px solid rgba(0, 212, 255, 0.12);
    border-bottom: 1px solid rgba(0, 212, 255, 0.12);
    border-radius: 2px;
  }
  .legal-fact-k, .legal-fact-v {
    padding: 9px 10px;
    font-size: 12.8px;
    line-height: 1.55;
    border-bottom: 1px solid rgba(0, 212, 255, 0.07);
    word-break: break-word;
  }
  .legal-facts > .legal-fact-k:last-of-type,
  .legal-facts > .legal-fact-v:last-of-type { border-bottom: none; }
  .legal-fact-k {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: rgba(0, 212, 255, 0.62);
    background: rgba(0, 212, 255, 0.03);
  }
  .legal-fact-v { color: rgba(232, 244, 255, 0.84); }

  .legal-divider {
    height: 1px;
    margin: 26px 0;
    background: var(--legal-rainbow);
    opacity: 0.4;
    mask-image: linear-gradient(90deg, #000 0%, #000 55%, transparent 100%);
    -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 55%, transparent 100%);
  }

  /* Signature */
  .legal-signature {
    margin: 22px 0 8px;
    padding: 20px;
    border: 1px solid rgba(255, 122, 24, 0.32);
    border-radius: 12px;
    background: linear-gradient(140deg, rgba(255, 122, 24, 0.07), rgba(0, 212, 255, 0.03));
  }
  .legal-signature-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 8.6px;
    letter-spacing: 0.22em;
    color: var(--legal-orange);
    border: 1px solid rgba(255, 122, 24, 0.45);
    border-radius: 100px;
    padding: 4px 10px;
    margin-bottom: 14px;
  }
  .legal-signature-name {
    font-family: 'Orbitron', sans-serif;
    font-size: 19px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.01em;
    margin-bottom: 6px;
  }
  .legal-signature-role {
    font-size: 13px;
    color: rgba(226, 240, 252, 0.7);
    margin-bottom: 10px;
  }
  .legal-signature-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10.5px;
    color: rgba(0, 212, 255, 0.7);
  }

  /* Contact card at the end of the document */
  .legal-contact-card {
    margin-top: 34px;
    padding: 22px;
    border: 1px solid rgba(0, 212, 255, 0.22);
    border-radius: 13px;
    background: linear-gradient(150deg, rgba(0, 212, 255, 0.07), rgba(6, 12, 26, 0.4));
  }
  .legal-contact-card h3 {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px;
    letter-spacing: 0.01em;
  }
  .legal-contact-card p {
    font-size: 13.4px;
    line-height: 1.7;
    color: rgba(226, 240, 252, 0.66);
    margin: 0 0 14px;
  }

  /* ── Footer: links · copyright + SHA-256 ID · links ─────── */
  .legal-foot {
    position: relative;
    max-width: 780px;
    margin-top: 44px;
    padding-top: 22px;
    border-top: 1px solid rgba(0, 212, 255, 0.12);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 16px 14px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9.5px;
    letter-spacing: 0.14em;
    color: rgba(180, 205, 230, 0.42);
  }
  .legal-foot::before {
    content: '';
    position: absolute;
    top: -1px; left: 0;
    width: 96px; height: 2px;
    border-radius: 2px;
    background: var(--legal-rainbow);
  }
  .legal-foot-links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
  }
  .legal-foot-links.is-end { justify-content: flex-end; }
  .legal-foot a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: rgba(126, 224, 255, 0.7);
    text-decoration: none;
    transition: color 0.16s;
  }
  .legal-foot a:hover { color: var(--legal-blue-bright); }
  .legal-foot a:focus-visible { outline: 2px solid var(--legal-blue); outline-offset: 3px; }

  /* PDF download link: icon + filename + weight */
  .legal-foot-pdf {
    white-space: nowrap;
    padding: 5px 9px;
    border: 1px solid rgba(255, 122, 24, 0.26);
    border-radius: 6px;
    background: rgba(255, 122, 24, 0.05);
    color: #FFB27A !important;
  }
  .legal-foot-pdf:hover {
    border-color: rgba(255, 122, 24, 0.6);
    background: rgba(255, 122, 24, 0.12);
    color: #FFD3B0 !important;
  }
  .legal-foot-pdf .legal-pdf-icon { color: var(--legal-orange); font-size: 10px; }
  .legal-foot-pdf .legal-pdf-size {
    color: rgba(180, 205, 230, 0.45);
    font-size: 8.5px;
    letter-spacing: 0.08em;
  }

  /* Centre lock-up */
  .legal-foot-mark { text-align: center; }
  .legal-foot-copy {
    color: rgba(214, 232, 248, 0.62);
    letter-spacing: 0.18em;
    font-size: 9.5px;
    white-space: nowrap;
  }
  .legal-foot-copy b { color: #fff; font-weight: 400; }
  .legal-foot-sha {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 5px;
    font-size: 8.5px;
    letter-spacing: 0.06em;
    color: rgba(126, 224, 255, 0.5);
    cursor: help;
  }
  .legal-foot-sha .legal-shag-key {
    color: var(--legal-pink);
    letter-spacing: 0.16em;
    font-size: 8px;
  }
  .legal-foot-sha code {
    font-family: inherit;
    color: rgba(214, 232, 248, 0.72);
    letter-spacing: 0.02em;
  }

  /* Floating back-to-top (mobile friendly) */
  .legal-top-btn {
    position: fixed;
    right: 18px;
    bottom: 18px;
    z-index: 55;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    border: 1px solid rgba(255, 122, 24, 0.5);
    background: rgba(9, 18, 34, 0.92);
    color: var(--legal-orange);
    font-size: 15px;
    cursor: pointer;
    box-shadow: 0 0 18px rgba(255, 122, 24, 0.24);
    opacity: 0;
    pointer-events: none;
    transform: translateY(8px);
    transition: opacity 0.22s, transform 0.22s;
  }
  .legal-top-btn.is-visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .legal-top-btn:hover { background: rgba(255, 122, 24, 0.14); }

  /* ── Responsive ─────────────────────────────────────────── */
  @media (max-width: 1080px) {
    .legal-layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 22px;
      padding: 22px 20px 110px;
    }
    /* Compact, sticky "where am I" bar above the document on small screens. */
    .legal-aside {
      position: sticky;
      top: 52px;
      z-index: 30;
      max-height: none;
      padding: 10px 12px 12px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 12px 32px rgba(0, 0, 0, 0.5);
    }
    .legal-toc-toggle { display: inline-flex; }
    .legal-toc-current { display: block; }
    .legal-toc-head { gap: 6px; padding-bottom: 8px; }
    .legal-toc-eyebrow { white-space: nowrap; font-size: 9px; letter-spacing: 0.16em; }
    .legal-meter { display: none; }
    .legal-aside[data-open='true'] .legal-meter { display: flex; }
    .legal-aside[data-open='true'] .legal-toc-current { display: none; }
    .legal-toc { display: none; max-height: 44vh; }
    .legal-aside[data-open='true'] .legal-toc { display: flex; }
    .legal-aside[data-open='false'] .legal-toc-foot { display: none; }
    .legal-aside[data-open='true'] .legal-toc-foot {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }
    .legal-aside[data-open='true'] .legal-toc-foot .legal-legend { flex: 1 1 100%; }
    .legal-aside[data-open='true'] .legal-toc-foot .legal-toc-action { flex: 1 1 auto; justify-content: center; }
    .legal-doc, .legal-foot { max-width: none; }
    .legal-foot {
      grid-template-columns: minmax(0, 1fr);
      justify-items: center;
      text-align: center;
      gap: 14px;
    }
    .legal-foot-links, .legal-foot-links.is-end { justify-content: center; }
    .legal-section, .legal-subsection { scroll-margin-top: 128px; }
    .legal-header { padding: 12px 16px; }
    .legal-brand-sub { display: none; }
    .legal-h1 { font-size: clamp(29px, 8vw, 40px); }
  }
  @media (max-width: 620px) {
    .legal-header { padding: 10px 12px; }
    .legal-header-actions .legal-nav-link { display: none; }
    .legal-brand-main { font-size: 10.5px; letter-spacing: 0.12em; }
    .legal-h2 { font-size: 18px; }
    .legal-section-num { font-size: 18px; min-width: 28px; }
    .legal-facts { grid-template-columns: minmax(0, 1fr); }
    .legal-fact-k { border-bottom: none; padding-bottom: 0; padding-top: 11px; }
    .legal-fact-v { padding-top: 2px; }
    .legal-p { font-size: 14.2px; line-height: 1.78; }
    .legal-li { font-size: 13.9px; }
    .legal-clause { font-size: 11.4px; letter-spacing: 0.035em; }
  }

  @media (prefers-reduced-motion: reduce) {
    .legal-root * { animation: none !important; transition: none !important; }
  }

  /* ── Print / Save-as-PDF ──────────────────────────────────
     Flatten everything to ink-on-white: the overlay UI disappears and every
     colour token is overridden so nothing renders as pale grey on paper. */
  @media print {
    @page { margin: 16mm 14mm; }

    html, body { background: #fff !important; color: #111 !important; }
    .legal-root { background: #fff !important; color: #111 !important; }
    .legal-atmos, .legal-progress, .legal-aside, .legal-top-btn,
    .legal-hero-actions, .legal-header-actions { display: none !important; }

    .legal-header {
      position: static;
      border-bottom: 1px solid #bbb;
      background: #fff;
      padding: 0 0 8px;
    }
    .legal-layout { display: block; padding: 0; max-width: none; }
    .legal-hero, .legal-doc, .legal-foot { max-width: none; }
    .legal-foot {
      margin-top: 18pt;
      border-top: 1px solid #ddd;
      grid-template-columns: minmax(0, 1fr);
      justify-items: center;
      gap: 6pt;
    }
    .legal-foot::before { display: none; }
    .legal-foot-pdf { border-color: #bbb !important; background: #fff !important; }

    .legal-h1 {
      background: none !important;
      -webkit-background-clip: border-box;
      -webkit-text-fill-color: #111 !important;
      color: #111 !important;
      font-size: 24pt;
      margin-top: 12pt;
    }

    /* Every body-content element renders as solid ink. */
    .legal-p, .legal-li, .legal-lead, .legal-p a, .legal-li a, .legal-note a,
    .legal-note-text, .legal-fact-k, .legal-fact-v, .legal-fact-v a,
    .legal-signature-role, .legal-signature-meta, .legal-signature-meta a,
    .legal-contact-card p, .legal-foot, .legal-foot a, .legal-foot-pdf,
    .legal-foot-pdf .legal-pdf-size, .legal-foot-copy, .legal-foot-copy b,
    .legal-foot-sha, .legal-foot-sha code, .legal-foot-sha .legal-shag-key,
    .legal-section-eyebrow, .legal-h3-num, .legal-eyebrow,
    .legal-brand-main, .legal-brand-sub, .legal-tagline {
      color: #111 !important;
      -webkit-text-fill-color: #111 !important;
    }
    .legal-p strong, .legal-li strong, .legal-fact-v strong { color: #000 !important; }
    .legal-clause { color: #111 !important; }

    .legal-h2, .legal-h3 { color: #111 !important; }
    .legal-h2::after { background: #555 !important; }
    .legal-h3 { border-left: 2px solid #555 !important; }

    /* Outlined numerals don't survive a print renderer — use flat ink. */
    .legal-section-num {
      color: #111 !important;
      -webkit-text-stroke: 0 !important;
      opacity: 0.45;
    }

    /* Boxes lose their glow, keep a hairline frame. */
    .legal-chip, .legal-note, .legal-clause, .legal-facts,
    .legal-contact-card, .legal-signature, .legal-toc-action {
      background: #fff !important;
      border-color: #bbb !important;
      box-shadow: none !important;
    }
    .legal-chip, .legal-chip b { color: #222 !important; -webkit-text-fill-color: #222 !important; }
    .legal-chip b { color: #555 !important; -webkit-text-fill-color: #555 !important; }
    .legal-note { border-left: 3px solid #444 !important; }
    .legal-note-label, .legal-signature-chip { color: #444 !important; }
    .legal-signature-chip { border-color: #bbb !important; }
    .legal-signature-name, .legal-contact-card h3 { color: #111 !important; }
    .legal-fact-k { background: #f3f3f3 !important; }
    .legal-facts { border-top: 1px solid #bbb !important; border-bottom: 1px solid #bbb !important; }
    .legal-fact-k, .legal-fact-v { border-bottom: 1px solid #e2e2e2 !important; }
    .legal-ul > .legal-li::before {
      border-color: #444 !important;
      background: #444 !important;
    }
    .legal-lead { border-left: 2px solid #444 !important; }
    .legal-ol > .legal-li::before { color: #444 !important; }
    .legal-divider, .legal-hero-rule { background: #ddd !important; }

    /* Keep the document from splitting awkwardly across pages. */
    .legal-section { break-inside: auto; }
    .legal-section-head, .legal-h2, .legal-h3 { break-after: avoid; }
  }
`;
