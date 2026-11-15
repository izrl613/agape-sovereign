import { ThirdPartyAgent } from './third-party-agent';

export class SocialAgent extends ThirdPartyAgent {
  protected moduleId = 'social';
  protected availableApis = ['X API', 'LinkedIn API', 'Meta Graph API', 'TikTok API'];
}
export const socialAgent = new SocialAgent();

export class LegalAgent extends ThirdPartyAgent {
  protected moduleId = 'legal';
  protected availableApis = ['Onfido', 'Jumio', 'Persona', 'ID.me'];
}
export const legalAgent = new LegalAgent();

export class ProfessionalAgent extends ThirdPartyAgent {
  protected moduleId = 'professional';
  protected availableApis = ['Credly', 'LinkedIn', 'Accredible', 'Indeed API'];
}
export const professionalAgent = new ProfessionalAgent();

export class HealthAgent extends ThirdPartyAgent {
  protected moduleId = 'health';
  protected availableApis = ['Epic', 'Cerner', 'Apple HealthKit', 'FHIR'];
}
export const healthAgent = new HealthAgent();

export class EduAgent extends ThirdPartyAgent {
  protected moduleId = 'educational';
  protected availableApis = ['National Student Clearinghouse', 'Parchment', 'Digitary'];
}
export const eduAgent = new EduAgent();

export class NetworkAgent extends ThirdPartyAgent {
  protected moduleId = 'network';
  protected availableApis = ['MaxMind', 'IP-API', 'Cloudflare Intelligence', 'WhoisXML'];
}
export const networkAgent = new NetworkAgent();

export class CryptoAgent extends ThirdPartyAgent {
  protected moduleId = 'cryptographic';
  protected availableApis = ['Alchemy', 'Infura', 'Etherscan', 'Solscan', 'The Graph'];
}
export const cryptoAgent = new CryptoAgent();

export class BiometricAgent extends ThirdPartyAgent {
  protected moduleId = 'biometric';
  protected availableApis = ['Worldcoin', 'Secure Enclave', 'FaceTec'];
}
export const biometricAgent = new BiometricAgent();

export class ReputationAgent extends ThirdPartyAgent {
  protected moduleId = 'reputation';
  protected availableApis = ['Trustpilot', 'Yelp', 'Airbnb API', 'Uber API', 'Google Reviews'];
}
export const reputationAgent = new ReputationAgent();

export class SubscriptionAgent extends ThirdPartyAgent {
  protected moduleId = 'subscription';
  protected availableApis = ['Stripe', 'PayPal', 'Recurly', 'Chargebee'];
}
export const subscriptionAgent = new SubscriptionAgent();

export class LocationAgent extends ThirdPartyAgent {
  protected moduleId = 'location';
  protected availableApis = ['Google Maps', 'USPS', 'Mapbox', 'Here API'];
}
export const locationAgent = new LocationAgent();

export class BehavioralAgent extends ThirdPartyAgent {
  protected moduleId = 'behavioral';
  protected availableApis = ['Google My Activity', 'Meta Ad Preferences', 'Amazon Purchase History'];
}
export const behavioralAgent = new BehavioralAgent();

export class MembershipAgent extends ThirdPartyAgent {
  protected moduleId = 'membership';
  protected availableApis = ['IEEE', 'ACM', 'National Registries', 'Org-specific OAuth'];
}
export const membershipAgent = new MembershipAgent();

export class PermissionAgent extends ThirdPartyAgent {
  protected moduleId = 'permissions';
  protected availableApis = ['Sovereign Internal Ledger', 'Hyperledger Fabric'];
}
export const permissionAgent = new PermissionAgent();
