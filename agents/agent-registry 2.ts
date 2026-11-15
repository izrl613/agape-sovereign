import {
  socialAgent, legalAgent, professionalAgent, healthAgent,
  eduAgent, networkAgent, cryptoAgent, biometricAgent,
  reputationAgent, subscriptionAgent, locationAgent, behavioralAgent,
  membershipAgent, permissionAgent
} from './module-agents';
import { emailAgent } from './email-agent';
import { privacyReclaimAgent } from './privacy-reclaim-agent';
import { ThirdPartyAgent } from './third-party-agent';

export const AGENT_REGISTRY: Record<string, ThirdPartyAgent> = {
  'communication': emailAgent,
  'social': socialAgent,
  'privacy-reclaim': privacyReclaimAgent,
  'legal': legalAgent,
  'professional': professionalAgent,
  'health': healthAgent,
  'educational': eduAgent,
  'network': networkAgent,
  'cryptographic': cryptoAgent,
  'biometric': biometricAgent,
  'reputation': reputationAgent,
  'subscription': subscriptionAgent,
  'location': locationAgent,
  'behavioral': behavioralAgent,
  'membership': membershipAgent,
  'permissions': permissionAgent,
};

export function getAgentForModule(moduleId: string): ThirdPartyAgent {
  const agent = AGENT_REGISTRY[moduleId];
  if (!agent) throw new Error(`No agent configured for module: ${moduleId}`);
  return agent;
}
