import React from 'react';
import { privacyPolicy } from '../../content/legal/privacyPolicy';
import { termsOfService } from '../../content/legal/termsOfService';
import { LegalDocumentPage } from './LegalDocumentPage';

/**
 * /terms — public, no authentication required.
 * Also reachable at /legal/terms and /terms-of-service (see App.tsx).
 */
export const TermsOfServicePage: React.FC = () => (
  <LegalDocumentPage doc={termsOfService} otherDoc={privacyPolicy} />
);

export default TermsOfServicePage;
