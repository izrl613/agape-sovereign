/**
 * ============================================================
 * ARCHITECT AI — Gatekeeper Service
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Gatekeeper logic for identity vector data validation and verification.
 * Ensures all user-entered data passes through rigorous checks before
 * being processed by vector agents or Architect AI.
 * 
 * Features:
 * - Multi-provider data validation
 * - Schema-based verification
 * - Encrypted data handoff preparation
 * - Offline-first compatible
 * - Splash screen gate status reporting
 */

import { SovereignEncryption } from '../lib/encryption';
import { generateSHA256 } from '../utils/crypto';
import type { AgentConfig } from '../modules/agents/types';

/**
 * Data source provider types
 */
export type DataProvider = 
  | 'google-oauth' 
  | 'apple-id' 
  | 'webauthn-passkey' 
  | 'manual-entry' 
  | 'csv-import' 
  | 'api-integration';

/**
 * Validation result for a single data field
 */
interface ValidationResult {
  valid: boolean;
  field: string;
  value: string;
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Gatekeeper decision for a vector module
 */
interface GateDecision {
  moduleId: string;
  vector: string;
  allowed: boolean;
  reason?: string;
  validatedFields: string[];
  encryptedPayload?: string;
  sha256Hash?: string;
  provider: DataProvider;
}

/**
 * Gatekeeper configuration per module
 */
const GATE_CONFIG: Record<string, { minFields: number; maxFields: number; requiredProviders: DataProvider[] }> = {
  'email-scanner': { minFields: 1, maxFields: 4, requiredProviders: ['manual-entry'] },
  'social-map': { minFields: 1, maxFields: 4, requiredProviders: ['manual-entry', 'api-integration'] },
  'device-health': { minFields: 1, maxFields: 4, requiredProviders: ['webauthn-passkey'] },
  'system-security': { minFields: 1, maxFields: 4, requiredProviders: ['webauthn-passkey'] },
  'deep-web': { minFields: 1, maxFields: 3, requiredProviders: ['api-integration'] },
  'broker-removal': { minFields: 1, maxFields: 5, requiredProviders: ['manual-entry'] },
  'network-vector': { minFields: 1, maxFields: 4, requiredProviders: ['api-integration'] },
  'cloud-enclave': { minFields: 1, maxFields: 4, requiredProviders: ['api-integration'] },
  'biometrics': { minFields: 1, maxFields: 3, requiredProviders: ['webauthn-passkey'] },
  'crypto-assets': { minFields: 1, maxFields: 4, requiredProviders: ['manual-entry'] },
  'smart-home': { minFields: 1, maxFields: 3, requiredProviders: ['api-integration'] },
  'metadata-purge': { minFields: 1, maxFields: 2, requiredProviders: ['manual-entry'] },
  'kernel-health': { minFields: 1, maxFields: 3, requiredProviders: ['manual-entry'] },
  'bios-integrity': { minFields: 1, maxFields: 3, requiredProviders: ['manual-entry'] },
  'sovereign-id': { minFields: 2, maxFields: 3, requiredProviders: ['webauthn-passkey', 'manual-entry'] },
  'shadow-purge': { minFields: 1, maxFields: 2, requiredProviders: ['manual-entry'] },
};

/**
 * Gatekeeper service class
 */
export class GatekeeperService {
  private encryption: SovereignEncryption;

  constructor() {
    this.encryption = new SovereignEncryption();
  }

  /**
   * Validate and gate user-entered data for a specific vector module
   */
  async gateData(
    moduleId: string,
    formData: Record<string, string>,
    provider: DataProvider
  ): Promise<GateDecision> {
    const config = GATE_CONFIG[moduleId];
    if (!config) {
      return {
        moduleId,
        vector: `V-${Number(moduleId.replace('v', '')) + 1 || 16}`,
        allowed: false,
        reason: 'Unknown module configuration',
        validatedFields: [],
        encryptedPayload: undefined,
        sha256Hash: undefined,
        provider,
      };
    }

    // Validate required fields based on module config
    const validatedFields: string[] = [];
    const validationResults: ValidationResult[] = [];

    for (const [key, value] of Object.entries(formData)) {
      if (!value || value.trim() === '') continue;

      const result = this.validateField(moduleId, key, value, provider);
      validationResults.push(result);

      if (result.valid) {
        validatedFields.push(key);
      }
    }

    // Check minimum field requirements
    const minMet = validatedFields.length >= config.minFields;
    const maxNotExceeded = validatedFields.length <= config.maxFields;
    const hasRequiredProvider = this.hasRequiredProvider(provider, config.requiredProviders);

    const allowed = minMet && maxNotExceeded && hasRequiredProvider;

    // Generate SHA-256 hash of validated data for integrity
    let sha256Hash: string | undefined;
    let encryptedPayload: string | undefined;

    if (validatedFields.length > 0) {
      const payloadString = JSON.stringify(formData);
      sha256Hash = await generateSHA256(payloadString);
      encryptedPayload = await this.encryption.encrypt(
        payloadString,
        `gatekeeper-${moduleId}-${provider}`
      );
    }

    return {
      moduleId,
      vector: `V-${Number(moduleId.replace('v', '')) + 1 || 16}`,
      allowed,
      reason: !allowed ? this.getGateRejectionReason(validatedFields.length, config, provider) : undefined,
      validatedFields,
      encryptedPayload,
      sha256Hash,
      provider,
    };
  }

  /**
   * Validate a single field against schema rules
   */
  private validateField(
    moduleId: string,
    fieldKey: string,
    value: string,
    provider: DataProvider
  ): ValidationResult {
    // Module-specific validation rules
    const rules = this.getValidationRules(moduleId, fieldKey);

    // Check for required minimum length
    if (rules.minLength && value.length < rules.minLength) {
      return {
        valid: false,
        field: fieldKey,
        value,
        reason: `Input too short: minimum ${rules.minLength} characters`,
        severity: 'medium',
      };
    }

    // Check for maximum length
    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        valid: false,
        field: fieldKey,
        value,
        reason: `Input too long: maximum ${rules.maxLength} characters`,
        severity: 'medium',
      };
    }

    // Email format validation
    if (rules.emailFormat && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return {
        valid: false,
        field: fieldKey,
        value,
        reason: 'Invalid email format',
        severity: 'low',
      };
    }

    // Password strength validation
    if (rules.passwordStrength) {
      if (value.length < 8) {
        return {
          valid: false,
          field: fieldKey,
          value,
          reason: 'Password must be at least 8 characters',
          severity: 'medium',
        };
      }
      if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
        return {
          valid: false,
          field: fieldKey,
          value,
          reason: 'Password should include uppercase and numbers',
          severity: 'low',
        };
      }
    }

    // SSN/HASH format validation (40-char SHA-256)
    if (rules.sha256Hash && !/^[a-f0-9]{40}$/.test(value)) {
      return {
        valid: false,
        field: fieldKey,
        value,
        reason: 'Expected a 40-character SHA-256 hash',
        severity: 'high',
      };
    }

    // Handle provider-specific validation
    const providerValidation = this.providerValidate(moduleId, fieldKey, value, provider);
    if (!providerValidation.valid) {
      return providerValidation;
    }

    return { valid: true, field: fieldKey, value };
  }

  /**
   * Get validation rules for a module/field combination
   */
  private getValidationRules(moduleId: string, fieldKey: string): { minLength?: number; maxLength?: number; emailFormat?: boolean; passwordStrength?: boolean; sha256Hash?: boolean } {
    const moduleMap: Record<string, { [key: string]: { minLength?: number; maxLength?: number; emailFormat?: boolean; passwordStrength?: boolean; sha256Hash?: boolean } }> = {
      'email-scanner': {
        primaryEmail: { minLength: 5, maxLength: 254, emailFormat: true },
        backupAliases: { minLength: 5, maxLength: 254, emailFormat: true },
        compromisedPasswords: { minLength: 8, maxLength: 128, passwordStrength: true },
        forwardingRules: { minLength: 3, maxLength: 128 },
      },
      'social-map': {
        socialHandles: { minLength: 1, maxLength: 64 },
        oauthTokens: { minLength: 10, maxLength: 512 },
        publicPostPII: { minLength: 1, maxLength: 256 },
        profileURLs: { minLength: 7, maxLength: 512 },
      },
      'device-health': {
        hardwareSerial: { minLength: 3, maxLength: 64 },
        operatingSystem: { minLength: 3, maxLength: 64 },
        diskEncryptionKey: { minLength: 20, maxLength: 256, sha256Hash: true },
        cloudSyncFolders: { minLength: 1, maxLength: 128 },
      },
      'system-security': {
        firewallPolicy: { minLength: 1, maxLength: 128 },
        openPorts: { minLength: 1, maxLength: 64 },
        sshPublicKeys: { minLength: 5, maxLength: 512 },
        antivirusSignature: { minLength: 3, maxLength: 64 },
      },
      'deep-web': {
        darknetHandles: { minLength: 1, maxLength: 32 },
        breachQueryTerms: { minLength: 1, maxLength: 128 },
        pastebinWatchlist: { minLength: 1, maxLength: 128 },
      },
      'broker-removal': {
        legalName: { minLength: 3, maxLength: 128 },
        residentialAddresses: { minLength: 5, maxLength: 256 },
        phoneNumbers: { minLength: 7, maxLength: 32 },
        brokerOptOutIDs: { minLength: 3, maxLength: 64 },
      },
      'network-vector': {
        homeSSID: { minLength: 1, maxLength: 32 },
        routerMAC: { minLength: 10, maxLength: 32, sha256Hash: true },
        vpnEndpoint: { minLength: 3, maxLength: 256 },
        dnsResolver: { minLength: 3, maxLength: 32 },
      },
      'cloud-enclave': {
        gcpProjectId: { minLength: 1, maxLength: 128 },
        firebaseAppId: { minLength: 15, maxLength: 64 },
        s3BucketURIs: { minLength: 5, maxLength: 256 },
        apiKeysHashes: { minLength: 8, maxLength: 256, sha256Hash: true },
      },
      'biometrics': {
        webauthnCredID: { minLength: 5, maxLength: 128 },
        faceIdHash: { minLength: 40, maxLength: 40, sha256Hash: true },
        secureEnclaveID: { minLength: 5, maxLength: 64 },
      },
      'crypto-assets': {
        evmAddress: { minLength: 42, maxLength: 42 },
        btcAddress: { minLength: 26, maxLength: 66 },
        solAddress: { minLength: 44, maxLength: 44 },
        seedPhraseHash: { minLength: 40, maxLength: 40, sha256Hash: true },
      },
      'smart-home': {
        homeAssistantURL: { minLength: 7, maxLength: 256 },
        zigbeeGatewayMAC: { minLength: 17, maxLength: 32 },
        smartCameraIDs: { minLength: 7, maxLength: 256 },
      },
      'metadata-purge': {
        exifStripperTags: { minLength: 1, maxLength: 128 },
        pdfRedactionRules: { minLength: 1, maxLength: 128 },
      },
      'kernel-health': {
        kernelModuleHashes: { minLength: 5, maxLength: 256, sha256Hash: true },
        ebpfRules: { minLength: 1, maxLength: 128 },
        driverCertFingerprint: { minLength: 5, maxLength: 64 },
      },
      'bios-integrity': {
        motherboardSerial: { minLength: 3, maxLength: 64 },
        tpmPcr0Hash: { minLength: 40, maxLength: 40, sha256Hash: true },
        secureBootKey: { minLength: 5, maxLength: 128 },
      },
      'sovereign-id': {
        decentralizedID: { minLength: 10, maxLength: 256 },
        passportIDHash: { minLength: 40, maxLength: 40, sha256Hash: true },
        ssnHashSeal: { minLength: 40, maxLength: 40, sha256Hash: true },
      },
      'shadow-purge': {
        unusedAppList: { minLength: 1, maxLength: 128 },
        opteryRemovalTarget: { minLength: 1, maxLength: 64 },
      },
    };

    return moduleMap[moduleId]?.[fieldKey] || { minLength: 1, maxLength: 256 };
  }

  /**
   * Provider-specific validation
   */
  private providerValidate(
    moduleId: string,
    fieldKey: string,
    value: string,
    provider: DataProvider
  ): ValidationResult {
    // WebAuthn passkey provider validation
    if (provider === 'webauthn-passkey') {
      if (fieldKey === 'webauthnCredID' && !/^cred-.+/.test(value)) {
        return {
          valid: false,
          field: fieldKey,
          value,
          reason: 'Invalid WebAuthn credential ID format',
          severity: 'medium',
        };
      }
      if (fieldKey === 'faceIdHash' && value.length !== 40) {
        return {
          valid: false,
          field: fieldKey,
          value,
          reason: 'FaceID hash must be exactly 40 characters (SHA-256)',
          severity: 'high',
        };
      }
    }

    // Google OAuth provider validation
    if (provider === 'google-oauth') {
      if (fieldKey === 'socialHandles' && !value.startsWith('@')) {
        return {
          valid: false,
          field: fieldKey,
          value,
          reason: 'Google OAuth handles must start with @',
          severity: 'low',
        };
      }
    }

    // API integration provider validation
    if (provider === 'api-integration') {
      if (fieldKey === 'breachQueryTerms' && value.length < 3) {
        return {
          valid: false,
          field: fieldKey,
          value,
          reason: 'Breach query terms must be at least 3 characters',
          severity: 'low',
        };
      }
    }

    return { valid: true, field: fieldKey, value };
  }

  /**
   * Check if provider meets required provider list
   */
  private hasRequiredProvider(provider: DataProvider, requiredProviders: DataProvider[]): boolean {
    return requiredProviders.includes(provider);
  }

  /**
   * Get the rejection reason when gate denies entry
   */
  private getGateRejectionReason(
    fieldCount: number,
    config: { minFields: number; maxFields: number; requiredProviders: DataProvider[] },
    provider: DataProvider
  ): string {
    if (fieldCount < config.minFields) {
      return `Minimum ${config.minFields} fields required, got ${fieldCount}`;
    }
    if (fieldCount > config.maxFields) {
      return `Maximum ${config.maxFields} fields allowed, got ${fieldCount}`;
    }
    if (!this.hasRequiredProvider(provider, config.requiredProviders)) {
      return `Provider ${provider} not configured for this module. Required: ${config.requiredProviders.join(', ')}`;
    }
    return 'Gate validation failed';
  }

  /**
   * Generate gate status report for splash screen display
   */
  generateGateStatusReport(decisions: GateDecision[]): {
    totalModules: number;
    allowed: number;
    blocked: number;
    providerBreakdown: Record<DataProvider, number>;
    needsAttention: GateDecision[];
  } {
    let allowed = 0;
    let blocked = 0;
    const providerBreakdown: Record<DataProvider, number> = {
      'google-oauth': 0,
      'apple-id': 0,
      'webauthn-passkey': 0,
      'manual-entry': 0,
      'csv-import': 0,
      'api-integration': 0,
    };

    const needsAttention: GateDecision[] = [];

    for (const decision of decisions) {
      if (decision.allowed) {
        allowed++;
      } else {
        blocked++;
        needsAttention.push(decision);
      }
      providerBreakdown[decision.provider]++;
    }

    return { totalModules: decisions.length, allowed, blocked, providerBreakdown, needsAttention };
  }
}

/**
 * Pre-configured gatekeeper instance
 */
export const gatekeeper = new GatekeeperService();