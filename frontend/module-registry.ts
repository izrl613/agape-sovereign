export interface IdentityVectorModule {
  id: string;
  name: string;
  description: string;
  requiredFields: {
    name: string;
    type: 'text' | 'select' | 'email' | 'url' | 'number';
    label: string;
    placeholder: string;
    examples: string[];
  }[];
  providers?: string[];
  verificationApis: string[];
}

export const MODULE_REGISTRY: Record<string, IdentityVectorModule> = {
  'communication': {
    id: 'communication',
    name: 'Communication (Email)',
    description: 'Primary and secondary digital communication channels.',
    requiredFields: [
      { name: 'email', type: 'email', label: 'Email Address', placeholder: 'me@example.com', examples: ['me@gmail.com', 'work@company.com'] },
      { name: 'provider', type: 'select', label: 'Provider', placeholder: 'Select Provider', examples: ['Gmail', 'Outlook', 'Proton', 'iCloud'] },
      { name: 'status', type: 'select', label: 'Status', placeholder: 'Primary/Secondary', examples: ['Primary', 'Secondary'] },
    ],
    providers: ['Gmail', 'Outlook', 'Proton', 'iCloud', 'Yahoo', 'Zoho'],
    verificationApis: ['SendGrid', 'Mailgun', 'Google OAuth2', 'Microsoft Graph'],
  },
  'social': {
    id: 'social',
    name: 'Social Identity',
    description: 'Public digital personas and social graphs.',
    requiredFields: [
      { name: 'platform', type: 'select', label: 'Platform', placeholder: 'Select Platform', examples: ['X', 'LinkedIn', 'Instagram'] },
      { name: 'handle', type: 'text', label: 'Handle/URL', placeholder: '@username', examples: ['@johndoe', 'linkedin.com/in/johndoe'] },
    ],
    providers: ['X', 'LinkedIn', 'Instagram', 'Facebook', 'Threads', 'Mastodon'],
    verificationApis: ['X API', 'LinkedIn API', 'Meta Graph API', 'TikTok API'],
  },
  'privacy-reclaim': {
    id: 'privacy-reclaim',
    name: 'Privacy Reclaim',
    description: 'Reclaiming data and managing privacy from financial institutions.',
    requiredFields: [
      { name: 'institution', type: 'text', label: 'Institution Name', placeholder: 'e.g. Chase Bank', examples: ['Chase', 'Vanguard', 'Bank of America'] },
      { name: 'accountType', type: 'text', label: 'Account Type', placeholder: 'e.g. Savings', examples: ['Checking', 'Savings', 'Investment'] },
      { name: 'requestStatus', type: 'select', label: 'Request Status', placeholder: 'Status', examples: ['Requested', 'Completed', 'Denied'] },
    ],
    verificationApis: ['Plaid', 'Yodlee', 'Salt Edge', 'Tink'],
  },
  'legal': {
    id: 'legal',
    name: 'Government/Legal Identity',
    description: 'Official state-issued identification.',
    requiredFields: [
      { name: 'idType', type: 'select', label: 'ID Type', placeholder: 'Select Type', examples: ['Passport', 'Drivers License'] },
      { name: 'idNumber', type: 'text', label: 'ID Number', placeholder: 'Enter ID number', examples: ['A1234567'] },
      { name: 'country', type: 'text', label: 'Issuing Country', placeholder: 'e.g. USA', examples: ['USA', 'Canada', 'UK'] },
    ],
    verificationApis: ['Onfido', 'Jumio', 'Persona', 'ID.me'],
  },
  'professional': {
    id: 'professional',
    name: 'Professional Identity',
    description: 'Career history, skills, and certifications.',
    requiredFields: [
      { name: 'title', type: 'text', label: 'Job Title', placeholder: 'e.g. Software Engineer', examples: ['Senior Architect', 'Product Manager'] },
      { name: 'company', type: 'text', label: 'Company', placeholder: 'e.g. Google', examples: ['Google', 'Amazon', 'Apple'] },
      { name: 'certId', type: 'text', label: 'Certification ID', placeholder: 'Enter ID', examples: ['AWS-12345'] },
    ],
    verificationApis: ['Credly', 'LinkedIn', 'Accredible', 'Indeed API'],
  },
  'health': {
    id: 'health',
    name: 'Health Identity',
    description: 'Medical records and health status.',
    requiredFields: [
      { name: 'provider', type: 'text', label: 'Provider', placeholder: 'e.g. Mayo Clinic', examples: ['Mayo Clinic', 'Kaiser Permanente'] },
      { name: 'recordType', type: 'text', label: 'Record Type', placeholder: 'e.g. General', examples: ['Bloodwork', 'Vaccinations'] },
      { name: 'policyNo', type: 'text', label: 'Insurance Policy No', placeholder: 'Enter policy number', examples: ['BCBS-98765'] },
    ],
    verificationApis: ['Epic', 'Cerner', 'Apple HealthKit', 'FHIR'],
  },
  'educational': {
    id: 'educational',
    name: 'Educational Identity',
    description: 'Academic achievements and degrees.',
    requiredFields: [
      { name: 'institution', type: 'text', label: 'Institution', placeholder: 'e.g. MIT', examples: ['MIT', 'Stanford', 'Oxford'] },
      { name: 'degree', type: 'text', label: 'Degree', placeholder: 'e.g. BS Computer Science', examples: ['BSc CS', 'PhD Physics'] },
      { name: 'year', type: 'number', label: 'Graduation Year', placeholder: 'e.g. 2015', examples: ['2015', '2020'] },
    ],
    verificationApis: ['National Student Clearinghouse', 'Parchment', 'Digitary'],
  },
  'network': {
    id: 'network',
    name: 'Network Identity',
    description: 'Technical fingerprints and network presence.',
    requiredFields: [
      { name: 'ip', type: 'text', label: 'IP Address', placeholder: 'e.g. 1.1.1.1', examples: ['192.168.1.1', '8.8.8.8'] },
      { name: 'mac', type: 'text', label: 'MAC Address', placeholder: '00:00:00:00:00:00', examples: ['a1:b2:c3:d4:e5:f6'] },
      { name: 'uuid', type: 'text', label: 'Device UUID', placeholder: 'UUID', examples: ['550e8400-e29b-41d4-a716-446655440000'] },
    ],
    verificationApis: ['MaxMind', 'IP-API', 'Cloudflare Intelligence', 'WhoisXML'],
  },
  'cryptographic': {
    id: 'cryptographic',
    name: 'Cryptographic Identity',
    description: 'Blockchain and decentralized identifiers.',
    requiredFields: [
      { name: 'address', type: 'text', label: 'Wallet Address', placeholder: '0x...', examples: ['0x123...abc'] },
      { name: 'ens', type: 'text', label: 'ENS Name', placeholder: 'name.eth', examples: ['sovereign.eth'] },
    ],
    verificationApis: ['Alchemy', 'Infura', 'Etherscan', 'Solscan', 'The Graph'],
  },
  'biometric': {
    id: 'biometric',
    name: 'Biometric Identity',
    description: 'Unique physical identifiers (hashed).',
    requiredFields: [
      { name: 'type', type: 'select', label: 'Biometric Type', placeholder: 'Select', examples: ['FaceID', 'TouchID'] },
      { name: 'hash', type: 'text', label: 'Hash Template', placeholder: 'Hex string', examples: ['a1b2c3d4...'] },
    ],
    verificationApis: ['Worldcoin', 'Secure Enclave', 'FaceTec'],
  },
  'reputation': {
    id: 'reputation',
    name: 'Reputation Identity',
    description: 'Trust and social proof across platforms.',
    requiredFields: [
      { name: 'platform', type: 'text', label: 'Platform', placeholder: 'e.g. Airbnb', examples: ['Airbnb', 'eBay', 'Uber'] },
      { name: 'score', type: 'number', label: 'Trust Score', placeholder: 'e.g. 4.9', examples: ['4.9', '5.0'] },
    ],
    verificationApis: ['Trustpilot', 'Yelp', 'Airbnb API', 'Uber API', 'Google Reviews'],
  },
  'subscription': {
    id: 'subscription',
    name: 'Subscription Identity',
    description: 'Digital services and recurring payments.',
    requiredFields: [
      { name: 'service', type: 'text', label: 'Service Name', placeholder: 'e.g. Netflix', examples: ['Netflix', 'Spotify'] },
      { name: 'tier', type: 'text', label: 'Subscription Tier', placeholder: 'e.g. Premium', examples: ['Basic', 'Premium'] },
    ],
    verificationApis: ['Stripe', 'PayPal', 'Recurly', 'Chargebee'],
  },
  'location': {
    id: 'location',
    name: 'Location Identity',
    description: 'Geographic and residency data.',
    requiredFields: [
      { name: 'address', type: 'text', label: 'Address', placeholder: '123 Main St', examples: ['123 Sovereign Way, NY'] },
      { name: 'citizenship', type: 'text', label: 'Citizenship', placeholder: 'e.g. USA', examples: ['USA', 'UK'] },
    ],
    verificationApis: ['Google Maps', 'USPS', 'Mapbox', 'Here API'],
  },
  'behavioral': {
    id: 'behavioral',
    name: 'Interests/Behavioral Identity',
    description: 'Digital preference and behavioral patterns.',
    requiredFields: [
      { name: 'category', type: 'text', label: 'Interest Category', placeholder: 'e.g. AI', examples: ['AI Research', 'Web3'] },
      { name: 'platform', type: 'text', label: 'Platform', placeholder: 'e.g. GitHub', examples: ['GitHub', 'arXiv'] },
    ],
    verificationApis: ['Google My Activity', 'Meta Ad Preferences', 'Amazon Purchase History'],
  },
  'membership': {
    id: 'membership',
    name: 'Membership Identity',
    description: 'Affiliations and organization memberships.',
    requiredFields: [
      { name: 'organization', type: 'text', label: 'Organization', placeholder: 'e.g. IEEE', examples: ['IEEE', 'NYPL'] },
      { name: 'role', type: 'text', label: 'Role', placeholder: 'e.g. Member', examples: ['Senior Member', 'Fellow'] },
    ],
    verificationApis: ['IEEE', 'ACM', 'National Registries', 'Org-specific OAuth'],
  },
  'permissions': {
    id: 'permissions',
    name: 'Privacy Permissions',
    description: 'The master list of data access and consent.',
    requiredFields: [
      { name: 'entity', type: 'text', label: 'Entity Name', placeholder: 'e.g. Architect AI', examples: ['Architect AI', 'Tax Authority'] },
      { name: 'accessLevel', type: 'select', label: 'Access Level', placeholder: 'Select', examples: ['Read-only', 'Full Access'] },
      { name: 'expiry', type: 'text', label: 'Expiration', placeholder: 'YYYY-MM-DD', examples: ['2026-12-31'] },
    ],
    verificationApis: ['Sovereign Internal Ledger', 'Hyperledger Fabric'],
  },
};
