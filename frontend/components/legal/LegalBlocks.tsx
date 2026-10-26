import React from 'react';
import type { LegalBlock } from '../../content/legal/types';
import { RichText } from './RichText';

export const LegalBlocks: React.FC<{ blocks: LegalBlock[] }> = ({ blocks }) => (
  <>
    {blocks.map((block, i) => {
      switch (block.type) {
        case 'lead':
          return (
            <p key={i} className="legal-lead">
              <RichText text={block.text} />
            </p>
          );

        case 'p':
          return (
            <p key={i} className="legal-p">
              <RichText text={block.text} />
            </p>
          );

        case 'ul':
          return (
            <ul key={i} className="legal-ul">
              {block.items.map((item, j) => (
                <li key={j} className="legal-li">
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          );

        case 'ol':
          return (
            <ol key={i} className="legal-ol">
              {block.items.map((item, j) => (
                <li key={j} className="legal-li">
                  <RichText text={item} />
                </li>
              ))}
            </ol>
          );

        case 'note':
          return (
            <aside key={i} className="legal-note">
              <div className="legal-note-label">
                <span aria-hidden="true">i</span>
                IN PLAIN ENGLISH
              </div>
              <p className="legal-note-text">
                <RichText text={block.text} />
              </p>
            </aside>
          );

        case 'allcaps':
          return (
            <p key={i} className="legal-clause">
              <RichText text={block.text} />
            </p>
          );

        case 'facts':
          return (
            <dl key={i} className="legal-facts">
              {block.rows.map((row, j) => (
                <React.Fragment key={j}>
                  <dt className="legal-fact-k">{row.k}</dt>
                  <dd className="legal-fact-v">
                    <RichText text={row.v} />
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          );

        case 'divider':
          return <div key={i} className="legal-divider" />;

        case 'signature':
          return null;

        default:
          return null;
      }
    })}
  </>
);
