/**
 * Published artefacts + integrity identifiers for the legal corpus.
 *
 * The signed PDFs live at these paths in `frontend/public/`, so they are served
 * verbatim by Firebase Hosting (static files win over the SPA rewrite) and by
 * any other static host.
 *
 * `sha256` is the digest of the exact PDF bytes that ship in this repo — it is
 * what the footer "SHA-256 ID" shows, so a reader can verify that the file they
 * downloaded is the file we published:
 *
 *   shasum -a 256 frontend/public/terms/TERMS.pdf
 *
 * Regenerate after replacing either PDF (see `scripts/hash-legal-docs.mjs`).
 */

export type LegalPdf = {
  /** Site-root-relative path to the published PDF. */
  href: string;
  /** Uppercase filename for link labels. */
  label: string;
  /** Size in bytes, formatted for the UI. */
  bytes: number;
  /** SHA-256 of the published file. */
  sha256: string;
};

const TERMS_PDF: LegalPdf = {
  href: '/terms/TERMS.pdf',
  label: 'TERMS.PDF',
  bytes: 3383888,
  sha256: 'd0718ae0afd0241f41d6d582db13933439e15cc747acc262c6f734f1b5009734',
};

const PRIVACY_PDF: LegalPdf = {
  href: '/privacy/PRIVACY.pdf',
  label: 'PRIVACY.PDF',
  bytes: 17226,
  sha256: '37948367c42975cc1d9b7c42d393c5ed74cf50bfeecbbf12e0fba3b2e0ed03e0',
};

export const LEGAL_PDFS = { privacy: PRIVACY_PDF, terms: TERMS_PDF } as const;

/**
 * Digest of the pair, in document order — the single identifier shown on the
 * landing-page footer, which covers both documents.
 */
export const LEGAL_MANIFEST_SHA256 =
  'e9773d658f25f1e1ae5be9fecf8f1be9f2101503d3eb8de830f3047e8999251d';

/**
 * Human-readable file weight, decimal units (3.4 MB / 17 KB) so the number in
 * the UI matches what an OS file manager reports for the downloaded file.
 */
export const formatBytes = (bytes: number): string => {
  if (!bytes) return '';
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
};

/** Short display form of a digest: first 8 · … · last 4. */
export const shortHash = (hash: string): string =>
  hash.length > 16 ? `${hash.slice(0, 12)}…${hash.slice(-4)}` : hash;
