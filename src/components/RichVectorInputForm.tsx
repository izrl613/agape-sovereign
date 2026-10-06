/**
 * ============================================================
 * ARCHITECT AI — Rich Vector Input Form Component
 * Agape Sovereign Enclave 2026
 * ============================================================
 *
 * Expanded multi-field data entry suite for all 16 identity vector modules.
 * Allows entering extensive vector-specific information, generates a SHA-256
 * digest seal, and encrypts payload client-side via AES-GCM 256-bit cryptography.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Key, Plus, Trash2, ShieldCheck, Cpu, ArrowRight, RefreshCw } from 'lucide-react';
import { generateSHA256, encryptClientSide, decryptClientSide } from '../utils/crypto';
import { toast } from 'sonner';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'password' | 'textarea';
}

// Tailored rich inputs for each of the 16 canonical identity vector modules
const MODULE_FIELD_SCHEMAS: Record<string, FieldConfig[]> = {
  'email-scanner': [
    { key: 'primaryEmail', label: 'Primary Email Address', placeholder: 'user@sovereign.nyc' },
    { key: 'backupAliases', label: 'Cloaked Forwarding Aliases', placeholder: 'alias1@anon.me, alias2@vault.net' },
    { key: 'compromisedPasswords', label: 'Exposed Plaintext/Hash Passwords', placeholder: 'P@ssword123, 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', type: 'password' },
    { key: 'forwardingRules', label: 'Inbound Forwarding Domains', placeholder: 'protonmail.com, simplelogin.io' },
  ],
  'social-map': [
    { key: 'socialHandles', label: 'Social Platform Handles', placeholder: '@username (X, GitHub, LinkedIn, Instagram)' },
    { key: 'oauthTokens', label: 'OAuth 2.0 Connected App Scopes', placeholder: 'Google OAuth, GitHub Auth Token' },
    { key: 'publicPostPII', label: 'Public PII Exposure Elements', placeholder: 'Phone numbers, address mentions in public posts' },
    { key: 'profileURLs', label: 'Public Profile URLs', placeholder: 'https://twitter.com/user, https://github.com/user' },
  ],
  'device-health': [
    { key: 'hardwareSerial', label: 'Device Serial Number', placeholder: 'C02FX001MD6M' },
    { key: 'operatingSystem', label: 'OS & Build Version', placeholder: 'macOS Tahoe 15.4 / Ubuntu 24.04 LTS' },
    { key: 'diskEncryptionKey', label: 'Disk Encryption Status / Recovery Key Hash', placeholder: 'FileVault Enabled / BitLocker Hash' },
    { key: 'cloudSyncFolders', label: 'Cloud Storage Sync Paths', placeholder: '~/iCloud, ~/GoogleDrive, ~/Dropbox' },
  ],
  'system-security': [
    { key: 'firewallPolicy', label: 'Firewall Policy Rules', placeholder: 'PF Active / Uncomplicated Firewall (UFW)' },
    { key: 'openPorts', label: 'Active Listening Ports', placeholder: '22 (SSH), 443 (HTTPS), 1234 (LMStudio)' },
    { key: 'sshPublicKeys', label: 'Authorized SSH Public Keys', placeholder: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...' },
    { key: 'antivirusSignature', label: 'Kernel Security Agent', placeholder: 'Sovereign Enclave Monitor / XProtect' },
  ],
  'deep-web': [
    { key: 'darknetHandles', label: 'Dark Web Alias / Handles', placeholder: 'shadow_user99' },
    { key: 'breachQueryTerms', label: 'Monitored Breach Terms', placeholder: 'Domain names, phone numbers, SSN hashes' },
    { key: 'pastebinWatchlist', label: 'Paste Site Watchlist Terms', placeholder: 'API Keys, private RSA keys, DB passwords' },
  ],
  'broker-removal': [
    { key: 'legalName', label: 'Full Legal Name & Aliases', placeholder: 'Jane Sovereign Doe' },
    { key: 'residentialAddresses', label: 'Past & Present Residential Addresses', placeholder: '123 Sovereign Way, New York NY 10001' },
    { key: 'phoneNumbers', label: 'Associated Mobile & VoIP Numbers', placeholder: '+1 (555) 019-2834, +1 (555) 019-[#]' },
    { key: 'brokerOptOutIDs', label: 'Broker Removal Reference IDs', placeholder: 'Optery Ref #99281, Whitepages ID #102' },
  ],
  'network-vector': [
    { key: 'homeSSID', label: 'Home Wi-Fi SSID Network Name', placeholder: 'Sovereign_Enclave_5G' },
    { key: 'routerMAC', label: 'Gateway Router MAC Address', placeholder: '00:1A:2B:3C:4D:5E' },
    { key: 'vpnEndpoint', label: 'Encrypted WireGuard / OpenVPN Endpoint', placeholder: 'vpn.sovereign.nyc:51820' },
    { key: 'dnsResolver', label: 'Private DoH DNS Resolver IP', placeholder: '1.1.1.1, 9.9.9.9 (Encrypted DNS)' },
  ],
  'cloud-enclave': [
    { key: 'gcpProjectId', label: 'GCP Project ID', placeholder: 'agape-sovereign-prod' },
    { key: 'firebaseAppId', label: 'Firebase App Identifier', placeholder: '1:1029384756:web:abcd1234' },
    { key: 's3BucketURIs', label: 'Cloud Storage Bucket URIs', placeholder: 'gs://sovereign-vault-data' },
    { key: 'apiKeysHashes', label: 'Cloud API Key Fingerprints', placeholder: 'SHA256:7f8a9b...' },
  ],
  'biometrics': [
    { key: 'webauthnCredID', label: 'WebAuthn Credential ID', placeholder: 'cred-pubkey-webauthn-2026' },
    { key: 'faceIdHash', label: 'FaceID / TouchID Key Fingerprint', placeholder: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    { key: 'secureEnclaveID', label: 'Apple Secure Enclave / TPM 2.0 UID', placeholder: 'TPM-SECURE-ID-9921' },
  ],
  'crypto-assets': [
    { key: 'evmAddress', label: 'Ethereum / EVM Wallet Address', placeholder: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
    { key: 'btcAddress', label: 'Bitcoin Native SegWit Address', placeholder: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
    { key: 'solAddress', label: 'Solana Public Key', placeholder: '7v91Nbdg2wP1s8mN29384756...' },
    { key: 'seedPhraseHash', label: 'Cold Storage Seed SHA-256 Hash Seal', placeholder: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', type: 'password' },
  ],
  'smart-home': [
    { key: 'homeAssistantURL', label: 'Home Assistant Server URL', placeholder: 'https://homeassistant.local:8123' },
    { key: 'zigbeeGatewayMAC', label: 'Zigbee / Z-Wave Gateway MAC', placeholder: '00:15:8D:00:01:23:45:67' },
    { key: 'smartCameraIDs', label: 'Encrypted Smart Camera RTSP Feeds', placeholder: 'rtsp://admin:pass@192.168.1.100/live' },
  ],
  'metadata-purge': [
    { key: 'exifStripperTags', label: 'EXIF Metadata Stripper Rules', placeholder: 'Remove GPS coordinates, Camera serials, Timestamp' },
    { key: 'pdfRedactionRules', label: 'PDF Metadata Redaction Templates', placeholder: 'Strip Author, CreationDate, Producer tags' },
  ],
  'kernel-health': [
    { key: 'kernelModuleHashes', label: 'Loaded Kernel Module Hashes', placeholder: 'sha256(vboxdrv), sha256(nvidia)' },
    { key: 'ebpfRules', label: 'Active eBPF Security Probes', placeholder: 'sys_execve monitoring, socket filter' },
    { key: 'driverCertFingerprint', label: 'Driver Signing Certificate Fingerprint', placeholder: 'SHA1: 4B:92:A1...' },
  ],
  'bios-integrity': [
    { key: 'motherboardSerial', label: 'Motherboard Hardware Serial', placeholder: 'MB-992104-SYSTEM' },
    { key: 'tpmPcr0Hash', label: 'TPM 2.0 PCR0 Firmware Hash', placeholder: '8f92a10b4c890d2e...' },
    { key: 'secureBootKey', label: 'Secure Boot PK Key Fingerprint', placeholder: 'CN=Sovereign Platform Key 2026' },
  ],
  'sovereign-id': [
    { key: 'decentralizedID', label: 'Decentralized Identifier (DID)', placeholder: 'did:key:z6MkpTHR8VNsBxYAAAcUQ2283...' },
    { key: 'passportIDHash', label: 'National Passport / ID Number Hash', placeholder: 'SHA256(PassportNumber + Salt)' },
    { key: 'ssnHashSeal', label: 'Tax ID / SSN SHA-256 Hash Seal', placeholder: 'SHA256(SSN + SecretSalt)', type: 'password' },
  ],
  'shadow-purge': [
    { key: 'unusedAppList', label: 'Unused / Dormant Apps List', placeholder: 'Old e-commerce apps, legacy social apps' },
    { key: 'opteryRemovalTarget', label: 'Opt-Out Data Broker Targets', placeholder: 'Spokeo, Radaris, PeopleLooker, BeenVerified' },
  ],
};

interface RichVectorInputFormProps {
  moduleId: string;
  vector: string;
  title: string;
  userId: string;
  onSaveAndHandoff: (formData: Record<string, string>, sha256Hash: string, encryptedBase64: string) => void;
  isProcessing?: boolean;
}

export const RichVectorInputForm: React.FC<RichVectorInputFormProps> = ({
  moduleId,
  vector,
  title,
  userId,
  onSaveAndHandoff,
  isProcessing = false,
}) => {
  const schema = MODULE_FIELD_SCHEMAS[moduleId] || [
    { key: 'param1', label: `${title} Primary Parameter`, placeholder: `Enter value for ${title}...` },
    { key: 'param2', label: `${title} Secondary Parameter`, placeholder: 'Additional vector detail...' },
  ];

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<{ key: string; label: string; value: string }[]>([]);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [computedSha256, setComputedSha256] = useState('');
  const [encryptedBase64, setEncryptedBase64] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Re-compute SHA-256 and encrypt whenever formData or customFields changes
  useEffect(() => {
    let isMounted = true;
    const computeCrypto = async () => {
      setIsEncrypting(true);
      const combinedPayload: Record<string, string> = { ...formData };
      for (const cf of customFields) {
        if (cf.label && cf.value) {
          combinedPayload[cf.key] = cf.value;
        }
      }

      const jsonStr = JSON.stringify(combinedPayload);
      const hash = await generateSHA256(jsonStr);
      const encrypted = await encryptClientSide(jsonStr, userId || 'sovereign-user');

      if (isMounted) {
        setComputedSha256(hash);
        setEncryptedBase64(encrypted);
        setIsEncrypting(false);
      }
    };

    computeCrypto();
    return () => { isMounted = false; };
  }, [formData, customFields, userId]);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddCustomField = () => {
    if (!newCustomLabel.trim()) return;
    const key = `custom_${Date.now()}`;
    setCustomFields((prev) => [...prev, { key, label: newCustomLabel.trim(), value: '' }]);
    setNewCustomLabel('');
  };

  const handleCustomValueChange = (key: string, val: string) => {
    setCustomFields((prev) =>
      prev.map((cf) => (cf.key === key ? { ...cf, value: val } : cf))
    );
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields((prev) => prev.filter((cf) => cf.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const combinedPayload: Record<string, string> = { ...formData };
    for (const cf of customFields) {
      if (cf.label && cf.value) {
        combinedPayload[cf.key] = cf.value;
      }
    }

    onSaveAndHandoff(combinedPayload, computedSha256, encryptedBase64);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 bg-[#060d1f]/90 border border-[#00d4ff]/30 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#00d4ff]/20">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#00d4ff] tracking-widest uppercase">
            {vector} · RICH IDENTITY DATA SUITE
          </span>
          <h3 className="text-base font-orbitron font-bold text-white flex items-center gap-2">
            <span>{title}</span> Data Configuration
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" /> AES-GCM 256-BIT
        </div>
      </div>

      {/* Schema Fields */}
      <div className="space-y-4">
        {schema.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
              <span>{field.label}</span>
              {formData[field.key] && (
                <span className="text-[10px] text-emerald-400 font-mono">✓ Sealed</span>
              )}
            </label>
            <input
              type={field.type || 'text'}
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 bg-[#040914] border border-slate-700 focus:border-[#00d4ff] rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00d4ff] transition-all"
            />
          </div>
        ))}

        {/* Custom Fields */}
        {customFields.map((cf) => (
          <div key={cf.key} className="space-y-1.5 relative">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>{cf.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveCustomField(cf.key)}
                className="text-rose-400 hover:text-rose-300 p-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={cf.value}
              onChange={(e) => handleCustomValueChange(cf.key, e.target.value)}
              placeholder={`Enter value for ${cf.label}...`}
              className="w-full px-4 py-3 bg-[#040914] border border-slate-700 focus:border-[#00d4ff] rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-[#00d4ff] transition-all"
            />
          </div>
        ))}
      </div>

      {/* Add Custom Parameter Input */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          value={newCustomLabel}
          onChange={(e) => setNewCustomLabel(e.target.value)}
          placeholder="Add custom parameter field label..."
          className="flex-1 px-3 py-2 bg-[#081229] border border-slate-800 rounded-lg text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#00d4ff]"
        />
        <button
          type="button"
          onClick={handleAddCustomField}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Field
        </button>
      </div>

      {/* Real-time SHA-256 Seal Box */}
      <div className="p-3.5 rounded-xl bg-[#040914] border border-[#00d4ff]/30 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#00d4ff]">
          <span className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> REAL-TIME SHA-256 INTEGRITY SEAL
          </span>
          {isEncrypting ? (
            <span className="text-amber-400 animate-pulse">Encrypting...</span>
          ) : (
            <span className="text-emerald-400">Validated</span>
          )}
        </div>
        <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-950/80 p-2 rounded border border-slate-800">
          {computedSha256}
        </div>
      </div>

      {/* Action Handoff Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00d4ff] to-cyan-500 hover:from-cyan-400 hover:to-[#00d4ff] text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#00d4ff]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Cpu className="w-4 h-4" /> HANDOFF TO ARCHITECT AI (NEMOTRON-3-NANO:4B)
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
};
