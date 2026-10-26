import React from 'react';
import { privacyPolicy } from '../../content/legal/privacyPolicy';
import { termsOfService } from '../../content/legal/termsOfService';
import { LegalDocumentPage } from './LegalDocumentPage';

/**
 * /privacy — public, no authentication required.
 * Also reachable at /legal/privacy (handled by the route helper in App.tsx).
 */
export const PrivacyPolicyPage: React.FC = () => (
  <LegalDocumentPage doc={privacyPolicy} otherDoc={termsOfService} />
);

export default PrivacyPolicyPage;
