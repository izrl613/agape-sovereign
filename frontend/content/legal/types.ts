/**
 * Content model for the public legal documents (Privacy Policy + Terms of Service).
 *
 * The documents are stored as structured data — not JSX — so that a single
 * scroll-spy layout can build the left-hand table of contents automatically and
 * so that copy edits never touch layout code.
 */

export type LegalFact = { k: string; v: string };

export type LegalBlock =
  /** Opening paragraph — rendered slightly larger. */
  | { type: 'lead'; text: string }
  /** Standard body copy. Supports **bold**, *italic*, [label](href), emails + URLs. */
  | { type: 'p'; text: string }
  /** Bulleted list. */
  | { type: 'ul'; items: string[] }
  /** Numbered list. */
  | { type: 'ol'; items: string[] }
  /** "In Plain English" callout. */
  | { type: 'note'; text: string }
  /** ALL-CAPS legal clause — rendered as a distinct, boxed block. */
  | { type: 'allcaps'; text: string }
  /** Definition grid (Document Details, "Who we are", …). */
  | { type: 'facts'; rows: LegalFact[] }
  /** Operator signature block. */
  | { type: 'signature' }
  /** Thin divider. */
  | { type: 'divider' };

export type LegalSubsection = {
  /** URL-safe anchor id, e.g. `sec-3-2`. */
  id: string;
  /** Display number, e.g. `3.2`. */
  number: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalSection = {
  /** URL-safe anchor id, e.g. `sec-3`. */
  id: string;
  /** Display number, e.g. `3`. */
  number: string;
  title: string;
  blocks: LegalBlock[];
  subsections?: LegalSubsection[];
};

export type LegalDocument = {
  kind: 'privacy' | 'terms';
  /** Short label used by the nav switcher, e.g. "PRIVACY". */
  shortLabel: string;
  /** Full document name, e.g. "Privacy Policy". */
  title: string;
  /** One-line purpose statement shown under the H1. */
  tagline: string;
  /** Mono eyebrow above the H1, e.g. "LEGAL · SOVEREIGN.NYC". */
  eyebrow: string;
  effectiveDate: string;
  version: string;
  operator: string;
  contactEmail: string;
  /** Absolute URL used for canonical / meta tags. */
  canonicalPath: string;
  intro: LegalBlock[];
  sections: LegalSection[];
  /** Closing "Document Details" fact table. */
  documentDetails: LegalFact[];
  /** Optional signed-by block appended after Document Details. */
  signatureName?: string;
  signatureRole?: string;
  signatureContacts?: string[];
};

/** Every anchor the scroll-spy needs to track, in document order. */
export const collectAnchors = (doc: LegalDocument): string[] => {
  const out: string[] = [];
  doc.sections.forEach((section) => {
    out.push(section.id);
    section.subsections?.forEach((sub) => out.push(sub.id));
  });
  return out;
};
