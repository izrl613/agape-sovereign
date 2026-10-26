import React from 'react';

/**
 * Minimal inline formatter for the legal corpus.
 *
 * Supports the tiny subset of markdown we actually use in the source documents:
 *   **bold**   *italic*   [label](href)
 * plus automatic linking of bare emails and URLs (legal copy is full of both).
 */
const INLINE_TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
const AUTO_LINK = /((?:https?:\/\/|www\.)[^\s<>{}"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
const TRAILING_PUNCT = /[.,;:!?)\]]+$/;

const trimlink = (raw: string): { href: string; suffix: string } => {
  const match = raw.match(TRAILING_PUNCT);
  const suffix = match ? match[0] : '';
  return { href: suffix ? raw.slice(0, -suffix.length) : raw, suffix };
};

const ExternalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer">
    {children}
  </a>
);

const autoLink = (text: string, keyPrefix: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  AUTO_LINK.lastIndex = 0;

  while ((match = AUTO_LINK.exec(text)) !== null) {
    const { href, suffix } = trimlink(match[0]);
    if (!href) continue;

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const isEmail = href.includes('@') && !href.startsWith('http') && !href.startsWith('www.');
    nodes.push(
      <ExternalLink key={`${keyPrefix}-a${match.index}`} href={isEmail ? `mailto:${href}` : /^www\./.test(href) ? `https://${href}` : href}>
        {href}
      </ExternalLink>,
    );
    if (suffix) nodes.push(suffix);

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

export const RichText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(INLINE_TOKEN).filter((part) => part !== undefined && part !== '');

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={`b${i}`}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <em key={`i${i}`}>{part.slice(1, -1)}</em>;
        }
        const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
        if (link) {
          return (
            <ExternalLink key={`l${i}`} href={link[2]}>
              {link[1]}
            </ExternalLink>
          );
        }
        return <React.Fragment key={`t${i}`}>{autoLink(part, `t${i}`)}</React.Fragment>;
      })}
    </>
  );
};
