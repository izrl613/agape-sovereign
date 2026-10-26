import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LegalDocument } from '../../content/legal/types';
import { formatBytes, shortHash } from '../../content/legal/documentIds';
import { LegalBlocks } from './LegalBlocks';
import { LEGAL_CSS } from './legalStyles';

/* ────────────────────────────────────────────────────────────
   Public legal shell — /privacy and /terms.

   Layout: sticky header + reading-progress rail, a blue left-hand
   table of contents where the reader's current clause is wrapped in
   an orange box, and the document body on the right. The TOC is
   generated from the structured document data, so adding a section
   to the copy can never desync the navigation.
   ──────────────────────────────────────────────────────────── */

type TocEntry = {
  id: string;
  num: string;
  label: string;
  level: 1 | 2;
  parentId?: string;
};

const pad = (num: string) => (num.length === 1 ? `0${num}` : num);

const HexMark: React.FC = () => (
  <svg viewBox="0 0 32 36" width="26" height="29" aria-hidden="true">
    <polygon points="16,2 30,10 30,26 16,34 2,26 2,10" fill="none" stroke="#00D4FF" strokeWidth="1.6" />
    <polygon points="16,9 24,13.5 24,22.5 16,27 8,22.5 8,13.5" fill="none" stroke="#FF2E9F" strokeWidth="0.9" opacity="0.75" />
    <text
      x="16"
      y="21.5"
      textAnchor="middle"
      fill="#FF7A18"
      fontFamily="Orbitron, sans-serif"
      fontSize="7.5"
      fontWeight="900"
    >
      AI
    </text>
  </svg>
);

const setMetaTag = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const previous = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => {
    if (previous === null) el?.remove();
    else el?.setAttribute('content', previous);
  };
};

/** Document-level SEO/meta, restored when the reader leaves the page. */
const useLegalMeta = (doc: LegalDocument) => {
  useEffect(() => {
    const previousTitle = document.title;
    const absolute = `https://sovereign.nyc${doc.canonicalPath}`;
    const description =
      doc.kind === 'privacy'
        ? 'How Agape Sovereign – Architect AI collects, encrypts, and protects your data. Zero-knowledge architecture, Google OAuth scope limits, and your access, deletion, and portability rights.'
        : 'The binding terms governing use of Agape Sovereign – Architect AI: eligibility, acceptable use, DIFF analysis limits, liability caps, and New York arbitration.';

    document.title = `${doc.title} — Agape Sovereign AI`;

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute('href') ?? null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', absolute);

    const restore = [
      setMetaTag('meta[name="description"]', 'name', 'description', description),
      setMetaTag('meta[name="robots"]', 'name', 'robots', 'index,follow'),
      setMetaTag('meta[property="og:title"]', 'property', 'og:title', `${doc.title} — Agape Sovereign AI`),
      setMetaTag('meta[property="og:description"]', 'property', 'og:description', description),
      setMetaTag('meta[property="og:url"]', 'property', 'og:url', absolute),
      setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article'),
    ];

    return () => {
      document.title = previousTitle;
      if (previousCanonical === null) canonical?.remove();
      else canonical?.setAttribute('href', previousCanonical);
      restore.forEach((fn) => fn());
    };
  }, [doc]);
};

export interface LegalDocumentPageProps {
  doc: LegalDocument;
  otherDoc: LegalDocument;
}

export const LegalDocumentPage: React.FC<LegalDocumentPageProps> = ({ doc, otherDoc }) => {
  const [activeId, setActiveId] = useState<string>(doc.sections[0]?.id ?? 'sec-1');
  const [progress, setProgress] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);

  const tocRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useLegalMeta(doc);

  const tocEntries = useMemo<TocEntry[]>(() => {
    const entries: TocEntry[] = [];
    doc.sections.forEach((section) => {
      entries.push({ id: section.id, num: pad(section.number), label: section.title, level: 1 });
      section.subsections?.forEach((sub) => {
        entries.push({ id: sub.id, num: sub.number, label: sub.title, level: 2, parentId: section.id });
      });
    });
    entries.push({ id: 'sec-details', num: '§', label: 'Document Details', level: 1 });
    return entries;
  }, [doc]);

  const anchors = useMemo(() => tocEntries.map((entry) => entry.id), [tocEntries]);

  const activeEntry = tocEntries.find((entry) => entry.id === activeId);
  const activeSectionId = activeEntry?.level === 2 ? activeEntry.parentId ?? activeId : activeId;
  const activeSectionIndex = doc.sections.findIndex((section) => section.id === activeSectionId);

  /* Scroll-spy: the last heading that has passed under the sticky header wins. */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const threshold = window.innerWidth <= 1080 ? 120 : 150;
      let current = anchors[0];

      for (const id of anchors) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - threshold <= 0) current = id;
        else break;
      }

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY >= scrollable - 24) {
        current = anchors[anchors.length - 1];
      }

      setActiveId((prev) => (prev === current ? prev : current));
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
      setShowTopBtn(window.scrollY > 700);
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [anchors]);

  /* Keep the orange box in view inside the sidebar without moving the page. */
  useEffect(() => {
    const item = itemRefs.current[activeId];
    const box = tocRef.current;
    if (!item || !box) return;
    const itemRect = item.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    const margin = 10;

    if (itemRect.top < boxRect.top + margin) {
      box.scrollTop -= boxRect.top + margin - itemRect.top;
    } else if (itemRect.bottom > boxRect.bottom - margin) {
      box.scrollTop += itemRect.bottom - boxRect.bottom + margin;
    }
  }, [activeId, activeSectionId]);

  const scrollToId = useCallback((id: string, viaNav: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (viaNav) {
      window.history.replaceState(null, '', `#${id}`);
      setActiveId(id);
      setTocOpen(false);
    }
  }, []);

  /* Honour an incoming #hash (deep links from the app or an email). */
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
      window.scrollTo({ top: 0 });
      return;
    }
    const id = hash.replace(/^#/, '');
    const timer = window.setTimeout(() => scrollToId(id, false), 60);
    return () => window.clearTimeout(timer);
  }, [scrollToId]);

  const goToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.history.replaceState(null, '', window.location.pathname);
  };

  const currentLabel = activeEntry?.label ?? doc.sections[0]?.title ?? '';

  return (
    <div className="legal-root">
      <style>{LEGAL_CSS}</style>
      <div className="legal-atmos" aria-hidden="true" />

      <div
        className="legal-progress"
        style={{ transform: `scaleX(${progress})` }}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      />

      <header className="legal-header">
        <a className="legal-brand" href="/" aria-label="Agape Sovereign — back to sovereign.nyc">
          <HexMark />
          <span>
            <span className="legal-brand-main" style={{ display: 'block' }}>
              AGAPE SOVEREIGN
            </span>
            <span className="legal-brand-sub" style={{ display: 'block' }}>
              ARCHITECT AI · 2026
            </span>
          </span>
        </a>

        <nav className="legal-header-actions" aria-label="Legal documents">
          <a
            className="legal-nav-link"
            href="/privacy"
            aria-current={doc.kind === 'privacy' ? 'page' : undefined}
          >
            PRIVACY
          </a>
          <a
            className="legal-nav-link"
            href="/terms"
            aria-current={doc.kind === 'terms' ? 'page' : undefined}
          >
            TERMS
          </a>
          <a className="legal-nav-cta" href="/">
            ← APP
          </a>
        </nav>
      </header>

      <div className="legal-layout">
        {/* ── Left nav ─────────────────────────────────────── */}
        <aside className="legal-aside" data-open={tocOpen}>
          <div className="legal-toc-head">
            <span className="legal-toc-eyebrow">ON THIS PAGE</span>
            <span className="legal-toc-current" aria-hidden="true">
              <b>{activeEntry?.num}</b>
              {currentLabel}
            </span>
            <button
              type="button"
              className="legal-toc-toggle"
              onClick={() => setTocOpen((open) => !open)}
              aria-expanded={tocOpen}
              aria-controls="legal-toc"
            >
              {tocOpen ? 'HIDE' : 'SECTIONS'}
            </button>
          </div>

          <div className="legal-meter" aria-hidden="true">
            <div className="legal-meter-bar">
              <span style={{ width: `${Math.max(2, progress * 100)}%` }} />
            </div>
            <div className="legal-meter-note">
              <span>
                SECTION <b>{activeSectionIndex >= 0 ? pad(String(activeSectionIndex + 1)) : '01'}</b>/
                {pad(String(doc.sections.length))}
              </span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
          </div>

          <nav className="legal-toc" id="legal-toc" ref={tocRef} aria-label={`${doc.title} sections`}>
            {doc.sections.map((section) => {
              const isActiveSection = activeSectionId === section.id;
              const showSubs = Boolean(section.subsections?.length) && isActiveSection;

              return (
                <React.Fragment key={section.id}>
                  <a
                    href={`#${section.id}`}
                    ref={(node) => {
                      itemRefs.current[section.id] = node;
                    }}
                    className={`legal-toc-item${activeId === section.id ? ' is-active' : ''}`}
                    aria-current={activeId === section.id ? 'true' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollToId(section.id, true);
                    }}
                  >
                    <span className="legal-toc-num">{pad(section.number)}</span>
                    <span className="legal-toc-label">{section.title}</span>
                  </a>

                  {showSubs && (
                    <div className="legal-toc-sub">
                      {section.subsections!.map((sub) => (
                        <a
                          key={sub.id}
                          href={`#${sub.id}`}
                          ref={(node) => {
                            itemRefs.current[sub.id] = node;
                          }}
                          className={`legal-toc-item${activeId === sub.id ? ' is-active' : ''}`}
                          aria-current={activeId === sub.id ? 'true' : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            scrollToId(sub.id, true);
                          }}
                        >
                          <span className="legal-toc-num">{sub.number}</span>
                          <span className="legal-toc-label">{sub.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            <a
              href="#sec-details"
              ref={(node) => {
                itemRefs.current['sec-details'] = node;
              }}
              className={`legal-toc-item${activeId === 'sec-details' ? ' is-active' : ''}`}
              aria-current={activeId === 'sec-details' ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                scrollToId('sec-details', true);
              }}
            >
              <span className="legal-toc-num">§</span>
              <span className="legal-toc-label">Document Details</span>
            </a>
          </nav>

          <div className="legal-toc-foot">
            <div className="legal-legend">
              <span className="legal-legend-swatch" aria-hidden="true" />
              ORANGE FRAME MARKS YOUR CURRENT SECTION
            </div>
            <a className="legal-toc-action" href={otherDoc.canonicalPath}>
              <span>READ {otherDoc.shortLabel}</span>
              <span aria-hidden="true">→</span>
            </a>
            <a
              className="legal-toc-action"
              href={doc.pdf.href}
              target="_blank"
              rel="noopener noreferrer"
              type="application/pdf"
              title={`${doc.pdf.label} — ${formatBytes(doc.pdf.bytes)} — SHA-256 ${doc.pdf.sha256}`}
            >
              <span>PDF · {formatBytes(doc.pdf.bytes)}</span>
              <span aria-hidden="true">↓</span>
            </a>
            <button type="button" className="legal-toc-action" onClick={goToTop}>
              <span>BACK TO TOP</span>
              <span aria-hidden="true">↑</span>
            </button>
          </div>
        </aside>

        {/* ── Document body ────────────────────────────────── */}
        <main className="legal-main">
          <article className="legal-doc">
            <div className="legal-hero">
              <div className="legal-eyebrow">{doc.eyebrow}</div>
              <h1 className="legal-h1">{doc.title}</h1>
              <p className="legal-tagline">{doc.tagline}</p>

              <div className="legal-meta">
                <span className="legal-chip">
                  <b>EFFECTIVE</b> {doc.effectiveDate}
                </span>
                <span className="legal-chip">
                  <b>VERSION</b> {doc.version}
                </span>
                <span className="legal-chip">
                  <b>OPERATOR</b> Agape Sovereign · sovereign.nyc
                </span>
                <a className="legal-chip" href={`mailto:${doc.contactEmail}`}>
                  <b>CONTACT</b> {doc.contactEmail}
                </a>
              </div>

              <div className="legal-hero-actions">
                <a
                  className="legal-action is-orange"
                  href={doc.pdf.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  type="application/pdf"
                  title={`Open the signed ${doc.title}, version ${doc.version} (PDF, ${formatBytes(doc.pdf.bytes)}) in a new tab`}
                >
                  <span aria-hidden="true">↓</span> {doc.pdf.label}
                  <span className="legal-pdf-size">{formatBytes(doc.pdf.bytes)}</span>
                </a>
                <button
                  type="button"
                  className="legal-action"
                  onClick={() => window.print()}
                  title="Print this page or save the HTML version as a PDF"
                >
                  PRINT / SAVE AS PDF
                </button>
                <a className="legal-action is-pdf" href={otherDoc.canonicalPath}>
                  {otherDoc.title.toUpperCase()} <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="legal-hero-rule" />
            </div>

            <LegalBlocks blocks={doc.intro} />

            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="legal-section" aria-labelledby={`${section.id}-title`}>
                <div className="legal-section-head">
                  <span className="legal-section-num" aria-hidden="true">
                    {pad(section.number)}
                  </span>
                  <div>
                    <div className="legal-section-eyebrow">SECTION {pad(section.number)}</div>
                    <h2 className="legal-h2" id={`${section.id}-title`}>
                      {section.title}
                    </h2>
                  </div>
                </div>

                <LegalBlocks blocks={section.blocks} />

                {section.subsections?.map((sub) => (
                  <section key={sub.id} id={sub.id} className="legal-subsection" aria-labelledby={`${sub.id}-title`}>
                    <h3 className="legal-h3" id={`${sub.id}-title`}>
                      <span className="legal-h3-num">{sub.number}</span>
                      <span>{sub.title}</span>
                    </h3>
                    <LegalBlocks blocks={sub.blocks} />
                  </section>
                ))}
              </section>
            ))}

            <section id="sec-details" className="legal-section" aria-labelledby="sec-details-title">
              <div className="legal-section-head">
                <span className="legal-section-num" aria-hidden="true">
                  §
                </span>
                <div>
                  <div className="legal-section-eyebrow">APPENDIX</div>
                  <h2 className="legal-h2" id="sec-details-title">
                    Document Details
                  </h2>
                </div>
              </div>

              <LegalBlocks blocks={[{ type: 'facts', rows: doc.documentDetails }]} />

              {doc.signatureName && (
                <div className="legal-signature">
                  <div className="legal-signature-chip">
                    <span aria-hidden="true">✒</span> SIGNED &amp; EFFECTIVE · {doc.effectiveDate}
                  </div>
                  <div className="legal-signature-name">{doc.signatureName}</div>
                  <div className="legal-signature-role">{doc.signatureRole}</div>
                  <div className="legal-signature-meta">
                    {doc.signatureContacts?.map((contact) => (
                      <a key={contact} href={`mailto:${contact}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {contact}
                      </a>
                    ))}
                    <span>sovereign.nyc</span>
                  </div>
                </div>
              )}
            </section>

            <div className="legal-contact-card">
              <h3>Questions about this {doc.title.toLowerCase()}?</h3>
              <p>
                Write to the Operator directly — we answer questions about this document, data access and deletion
                requests, and security disclosures. Never send passwords, passkey data, or private keys by email.
              </p>
              <div className="legal-hero-actions">
                <a className="legal-action is-orange" href={`mailto:${doc.contactEmail}`}>
                  {doc.contactEmail}
                </a>
                <a
                  className="legal-action"
                  href={doc.pdf.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  type="application/pdf"
                >
                  <span aria-hidden="true">↓</span> {doc.pdf.label} · {formatBytes(doc.pdf.bytes)}
                </a>
                <a className="legal-action" href={otherDoc.canonicalPath}>
                  {otherDoc.title} <span aria-hidden="true">→</span>
                </a>
                <button type="button" className="legal-action" onClick={goToTop}>
                  BACK TO TOP <span aria-hidden="true">↑</span>
                </button>
              </div>
            </div>
          </article>

          <footer className="legal-foot">
            <nav className="legal-foot-links" aria-label="Signed document downloads">
              <a
                className="legal-foot-pdf"
                href={doc.pdf.href}
                target="_blank"
                rel="noopener noreferrer"
                type="application/pdf"
                download={doc.pdf.label}
                title={`${doc.pdf.label} — ${formatBytes(doc.pdf.bytes)} — opens in a new tab; SHA-256 ${doc.pdf.sha256}`}
              >
                <span className="legal-pdf-icon" aria-hidden="true">↓</span>
                {doc.pdf.label}
                <span className="legal-pdf-size">{formatBytes(doc.pdf.bytes)}</span>
              </a>
              <a
                className="legal-foot-pdf"
                href={otherDoc.pdf.href}
                target="_blank"
                rel="noopener noreferrer"
                type="application/pdf"
                download={otherDoc.pdf.label}
                title={`${otherDoc.pdf.label} — ${formatBytes(otherDoc.pdf.bytes)} — opens in a new tab`}
              >
                <span className="legal-pdf-icon" aria-hidden="true">↓</span>
                {otherDoc.pdf.label}
                <span className="legal-pdf-size">{formatBytes(otherDoc.pdf.bytes)}</span>
              </a>
            </nav>

            <div className="legal-foot-mark">
              <div className="legal-foot-copy">
                © <b>2026</b> AGAPE SOVEREIGN AI
              </div>
              <div
                className="legal-foot-sha"
                title={`SHA-256 of the published ${doc.pdf.label} — verify with: shasum -a 256 ${doc.pdf.href}`}
              >
                <span className="legal-shag-key">SHA-256</span>
                <code>{shortHash(doc.pdf.sha256)}</code>
              </div>
            </div>

            <nav className="legal-foot-links is-end" aria-label="Legal pages">
              <a href="/privacy">PRIVACY</a>
              <a href="/terms">TERMS</a>
              <a href="/contact">CONTACT</a>
            </nav>
          </footer>
        </main>
      </div>

      <button
        type="button"
        className={`legal-top-btn${showTopBtn ? ' is-visible' : ''}`}
        onClick={goToTop}
        aria-label={`Back to top of ${doc.title}${currentLabel ? ` — currently at ${currentLabel}` : ''}`}
      >
        ↑
      </button>
    </div>
  );
};
