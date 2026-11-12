/**
 * ============================================================
 * ARCHITECT AI — Enhanced ModuleSplashScreen with Gatekeeper
 * Agape Sovereign Enclave 2026
 * ============================================================
 * 
 * Enhanced per-module identity vector entry screen with:
 * - Interactive data entry fields
 * - Gatekeeper validation before processing
 * - Multi-provider data source support
 * - Real-time SHA-256 integrity seal
 * - Offline-first compatible
 * - Architect AI handoff integration
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NEON } from './UI';
import { ThirdPartyVerificationModal } from './ThirdPartyVerificationModal';
import { gatekeeper, GateDecision, DataProvider } from '../services/gatekeeperService';
import { generateSHA256, encryptClientSide } from '../utils/crypto';
import { toast } from 'sonner';
import { Lock, Key, Plus, Trash2, ShieldCheck, Cpu, ArrowRight, RefreshCw } from 'lucide-react';
import { VECTOR_MODULES, getModuleById, ENCRYPTION_COLORS } from '../modules/identity-vectors/ModuleConfig';

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced ModuleSplashScreen — Per-Module Identity Vector Entry Screen
//
// Renders a full-screen animated splash on every module navigation.
// Adapts to user's stored data: shows masked value, SHA-256 seal, and
// security status. Auto-dismisses after AUTO_DISMISS_MS.
// Supports gatekeeper validation and multi-provider data entry.
// ─────────────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 2000;

interface ModuleSplashProps {
  moduleId: string;
  vector: string;
  icon: string;
  title: string;
  uid: string;
  storedHash?: string;
  hasData: boolean;
  status?: 'KNOXED' | 'NUKED' | 'MONITORED' | null;
  onDismiss: () => void;
  showThirdPartyVerification?: boolean;
  initialProvider?: DataProvider;
}

// Glitch-animate a SHA-256 hex string before settling
const GLITCH_CHARS = '0123456789ABCDEF';
function randomHex(len: number) {
  return Array.from({ length: len }, () =>
    GLITCH_CHARS[Math.floor(Math.random * GLITCH_CHARS.length)]
  ).join('');
}

// Format a 64-char hex into groups of 8 for readability
function formatHex(hex: string): string {
  if (!hex || hex.length < 8) return hex;
  return hex.match(/.{1,8}/g)?.join(' · ') ?? hex;
}

const STATUS_COLOR: Record<string, string> = {
  KNOXED: NEON.blue,
  NUKED: NEON.magenta,
  MONITORED: NEON.orange,
};

const STATUS_LABEL: Record<string, string> = {
  KNOXED: '🔒 SECURED — KNOXED',
  NUKED: '🔥 CRITICAL — NUKED',
  MONITORED: '👁 WATCHING — MONITORED',
};

// Module config lookup
const moduleConfig = getModuleById(moduleId) || VECTOR_MODULES.find(m => m.vector === vector);
const encColor = ENCRYPTION_COLORS[moduleConfig?.encryptionLevel] || NEON.textMuted;

export const EnhancedModuleSplashScreen: React.FC<ModuleSplashProps> = ({
  moduleId,
  vector,
  icon,
  title,
  uid,
  storedHash,
  hasData,
  status,
  onDismiss,
  showThirdPartyVerification,
  initialProvider = 'manual-entry',
}) => {
  const moduleConfig = getModuleById(moduleId) || VECTOR_MODULES.find(m => m.vector === vector);
  const encColor = ENCRYPTION_COLORS[moduleConfig?.encryptionLevel] || NEON.textMuted;
  const statusColor = status ? NEON[status.toLowerCase() as keyof typeof NEON] || moduleConfig?.color : NEON.textMuted;
  const statusLabel = status ? (STATUS_LABEL[status] ?? 'AWAITING CONFIGURATION') : 'AWAITING CONFIGURATION';

  // Initialize field schemas based on module
  useEffect(() => {
    const loadSchemas = async () => {
      // Define rich inputs for each module - matching RichVectorInputForm schemas
      const moduleSchemas: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
        'email-scanner': [
          { key: 'primaryEmail', label: 'Primary Email', placeholder: 'user@sovereign.nyc' },
          { key: 'backupAliases', label: 'Cloaked Aliases', placeholder: 'alias1@anon.me, alias2@vault.net' },
          { key: 'compromisedPasswords', label: 'Exposed Passwords', placeholder: 'P@ssword123', type: 'password' },
          { key: 'forwardingRules', label: 'Forwarding Domains', placeholder: 'protonmail.com' },
        ],
        'social-map': [
          { key: 'socialHandles', label: 'Social Handles', placeholder: '@username (X, GitHub, LI)' },
          { key: 'oauthTokens', label: 'OAuth Tokens', placeholder: 'Google/GitHub token' },
          { key: 'publicPostPII', label: 'Public PII', placeholder: 'Phone, address mentions' },
          { key: 'profileURLs', label: 'Profile URLs', placeholder: 'https://twitter.com/user' },
        ],
        'device-health': [
          { key: 'hardwareSerial', label: 'Hardware Serial', placeholder: 'C02FX001MD6M' },
          { key: 'operatingSystem', label: 'OS & Build', placeholder: 'macOS Tahoe 15.4' },
          { key: 'diskEncryptionKey', label: 'Disk Encryption Key', placeholder: 'SHA256:...', type: 'password' },
          { key: 'cloudSyncFolders', label: 'Cloud Folders', placeholder: '~/iCloud' },
        ],
        'system-security': [
          { key: 'firewallPolicy', label: 'Firewall Policy', placeholder: 'PF / UFW active' },
          { key: 'openPorts', label: 'Open Ports', placeholder: '22 (SSH), 443 (HTTPS)' },
          { key: 'sshPublicKeys', label: 'SSH Public Keys', placeholder: 'ssh-ed25519...' },
          { key: 'antivirusSignature', label: 'Antivirus', placeholder: 'Sovereign Monitor' },
        ],
        'deep-web': [
          { key: 'darknetHandles', label: 'Darknet Handles', placeholder: 'shadow_user99' },
          { key: 'breachQueryTerms', label: 'Breach Terms', placeholder: 'Domain names, SSN hashes' },
          { key: 'pastebinWatchlist', label: 'Paste Watchlist', placeholder: 'API keys, DB passwords' },
        ],
        'broker-removal': [
          { key: 'legalName', label: 'Legal Name', placeholder: 'Jane Sovereign Doe' },
          { key: 'residentialAddresses', label: 'Addresses', placeholder: '123 Sovereign Way' },
          { key: 'phoneNumbers', label: 'Phone Numbers', placeholder: '+1 (555) 019-2834' },
          { key: 'brokerOptOutIDs', label: 'Broker Opt-Out IDs', placeholder: 'Optery Ref #99281' },
        ],
        'network-vector': [
          { key: 'homeSSID', label: 'Home SSID', placeholder: 'Sovereign_Enclave_5G' },
          { key: 'routerMAC', label: 'Router MAC', placeholder: '00:1A:2B:3C:4D:5E' },
          { key: 'vpnEndpoint', label: 'VPN Endpoint', placeholder: 'vpn.sovereign.nyc:51820' },
          { key: 'dnsResolver', label: 'DNS Resolver', placeholder: '1.1.1.1, 9.9.9.9' },
        ],
        'cloud-enclave': [
          { key: 'gcpProjectId', label: 'GCP Project', placeholder: 'agape-sovereign-prod' },
          { key: 'firebaseAppId', label: 'Firebase App', placeholder: '1:1029384756:web:abcd1234' },
          { key: 's3BucketURIs', label: 'S3 Buckets', placeholder: 'gs://vault-data' },
          { key: 'apiKeysHashes', label: 'API Key Hashes', placeholder: 'SHA256:7f8a9b...', type: 'password' },
        ],
        'biometrics': [
          { key: 'webauthnCredID', label: 'WebAuthn Cred ID', placeholder: 'cred-pubkey-2026' },
          { key: 'faceIdHash', label: 'FaceID Hash', placeholder: 'e3b0c44298fc1c149af...', type: 'password' },
          { key: 'secureEnclaveID', label: 'Secure Enclave', placeholder: 'TPM-SECURE-ID-9921' },
        ],
        'crypto-assets': [
          { key: 'evmAddress', label: 'EVM Address', placeholder: '0x71C7656EC7ab88b098def' },
          { key: 'btcAddress', label: 'BTC Address', placeholder: 'bc1qxy2kgdygjrsqtzq2n0y' },
          { key: 'solAddress', label: 'Solana Address', placeholder: '7v91Nbdg2wP1s8mN29384756...' },
          { key: 'seedPhraseHash', label: 'Seed Hash', placeholder: 'e3b0c44298fc1c149af...', type: 'password' },
        ],
        'smart-home': [
          { key: 'homeAssistantURL', label: 'Home Assistant', placeholder: 'https://homeassistant.local:8123' },
          { key: 'zigbeeGatewayMAC', label: 'Zigbee MAC', placeholder: '00:15:8D:00:01:23:45:67' },
          { key: 'smartCameraIDs', label: 'Camera RTSP', placeholder: 'rtsp://admin:pass@192.168.1.100' },
        ],
        'metadata-purge': [
          { key: 'exifStripperTags', label: 'EXIF Tags', placeholder: 'GPS, camera serials, timestamp' },
          { key: 'pdfRedactionRules', label: 'PDF Redaction', placeholder: 'Strip Author, Date, Producer' },
        ],
        'kernel-health': [
          { key: 'kernelModuleHashes', label: 'Kernel Modules', placeholder: 'sha256(vboxdrv), sha256(nvidia)' },
          { key: 'ebpfRules', label: 'eBPF Rules', placeholder: 'sys_execve monitoring' },
          { key: 'driverCertFingerprint', label: 'Driver Cert', placeholder: 'SHA1: 4B:92:A1...' },
        ],
        'bios-integrity': [
          { key: 'motherboardSerial', label: 'Motherboard Serial', placeholder: 'MB-992104-SYSTEM' },
          { key: 'tpmPcr0Hash', label: 'TPM PCR0', placeholder: '8f92a10b4c890d2e...', type: 'password' },
          { key: 'secureBootKey', label: 'Secure Boot Key', placeholder: 'CN=Platform Key 2026' },
        ],
        'sovereign-id': [
          { key: 'decentralizedID', label: 'DID', placeholder: 'did:key:z6Mkp...' },
          { key: 'passportIDHash', label: 'Passport Hash', placeholder: 'SHA256(Passport+Salt)', type: 'password' },
          { key: 'ssnHashSeal', label: 'SSN Hash', placeholder: 'SHA256(SSN+Salt)', type: 'password' },
        ],
        'shadow-purge': [
          { key: 'unusedAppList', label: 'Unused Apps', placeholder: 'Old e-commerce, legacy social' },
          { key: 'opteryRemovalTarget', label: 'Opt-Out Targets', placeholder: 'Spokeo, Radaris' },
        ],
      };

      const schemas = moduleSchemas[moduleId] || [
        { key: 'param1', label: `${title} Primary Parameter`, placeholder: `Enter value for ${title}...` },
        { key: 'param2', label: `${title} Secondary Parameter`, placeholder: 'Additional detail...' },
      ];
      setFieldSchemas(schemas);
      setProviderOptions(['manual-entry', 'api-integration', 'webauthn-passkey', 'google-oauth', 'apple-id']);
    };

    loadSchemas();
  }, [moduleId, title]);

  // Gatekeeper validation on form data changes
  useEffect(() => {
    const runGatekeeper = async () => {
      if (Object.keys(formData).length === 0) {
        setGateDecision(null);
        setValidationState({ valid: true, message: 'Ready for secure input', color: '#64748B' });
        return;
      }

      const decision = await gatekeeper.gateData(moduleId, formData, selectedProvider);
      setGateDecision(decision);

      // Update validation state based on gate decision
      if (decision.allowed) {
        setValidationState({ valid: true, message: '✅ Data validated and approved', color: '#10B981' });
      } else {
        setValidationState({ valid: false, message: decision.reason || 'Gate validation failed', color: '#EF4444' });
      }
    };

    runGatekeeper();
  }, [formData, selectedProvider, moduleId]);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 500); // let exit animation finish
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const statusColor = status ? (STATUS_COLOR[status] ?? NEON.textMuted) : NEON.textMuted;
  const statusLabel = status ? (STATUS_LABEL[status] ?? 'AWAITING CONFIGURATION') : 'AWAITING CONFIGURATION';

  // Provider selector UI
  const providerOptionsList = providerOptions.map(provider => (
    <span
      key={provider}
      className="px-2 py-1 rounded-md text-xs font-mono hover:bg-slate-800 cursor-pointer transition-colors"
      style={{ background: selectedProvider === provider ? NEON.blue + '20' : 'transparent' }}
      onClick={() => setSelectedProvider(provider)}
    >
      {provider.replace(/-/, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  ));

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`splash-enhanced-${moduleId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(6, 13, 31, 0.97)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Animated grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* Radial glow centered */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600, height: 600,
            background: `radial-gradient(circle, ${statusColor}08 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          {/* Corner decorations */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTop: `2px solid ${NEON.magenta}44`, borderLeft: `2px solid ${NEON.magenta}44` }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTop: `2px solid ${NEON.blue}44`, borderRight: `2px solid ${NEON.blue}44` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottom: `2px solid ${NEON.blue}44`, borderLeft: `2px solid ${NEON.blue}44` }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottom: `2px solid ${NEON.magenta}44`, borderRight: `2px solid ${NEON.magenta}44` }} />

          {/* Main content card */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', maxWidth: 640,
              padding: '40px 48px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 20,
              textAlign: 'center',
            }}
          >
            {/* Vector badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '4px 16px',
              background: `${encColor}11`,
              border: `1px solid ${encColor}33`,
              borderRadius: 999,
              marginBottom: 4,
            }}>
              <span style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.6rem', color: NEON.orange, letterSpacing: '0.2em' }}>
                {vector} · DIFF VECTOR
              </span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: encColor, boxShadow: `0 0 6px ${encColor}` }} />
            </div>

            {/* Icon */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '3.5rem', filter: `drop-shadow(0 0 20px ${statusColor})` }}
            >
              {icon}
            </motion.div>

            {/* Module title */}
            <div>
              <div style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: '1.5rem', fontWeight: 900,
                color: statusColor,
                textShadow: `0 0 20px ${statusColor}66`,
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}>
                {title.toUpperCase()}
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.65rem',
                color: statusColor,
                letterSpacing: '0.15em',
                opacity: 0.8,
              }}>
                {statusLabel}
              </div>
            </div>

            {/* Data status row */}
            <div style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid rgba(255,255,255,0.07)`,
              borderRadius: 12,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: "'Share Tech Mono'", fontSize: '0.55rem', color: NEON.textMuted, letterSpacing: '0.15em', marginBottom: 4 }}>
                  VECTOR PARAMETER
                </div>
                <div style={{
                  fontFamily: "'Share Tech Mono'", fontSize: '0.8rem',
                  color: hasData ? NEON.text : NEON.textMuted,
                  letterSpacing: '0.05em',
                }}>
                  {hasData ? '●●●●●●●●●●●●●●●●' : '— NOT CONFIGURED —'}
                </div>
              </div>
              <div style={{
                background: hasData ? `${encColor}11` : `${NEON.orange}11`,
                border: `1px solid ${hasData ? encColor : NEON.orange}33`,
                borderRadius: 6,
                padding: '4px 12px',
                fontFamily: "'Orbitron'",
                fontSize: '0.5rem',
                fontWeight: 700,
                color: hasData ? encColor : NEON.orange,
                letterSpacing: '0.1em',
                flexShrink: 0,
              }}>
                {hasData ? 'SEALED' : 'CONFIGURE'}
              </div>
            </div>

            {/* SHA-256 seal block */}
            <div style={{
              width: '100%',
              background: 'rgba(0, 212, 255, 0.03)',
              border: `1px solid rgba(0, 212, 255, 0.12)`,
              borderRadius: 12,
              padding: '14px 20px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem' }}>{hashRevealed ? '🔒' : '⟳'}</span>
                  <span style={{
                    fontFamily: "'Share Tech Mono'",
                    fontSize: '0.55rem',
                    color: NEON.textMuted,
                    letterSpacing: '0.15em',
                  }}>
                    INTEGRITY SEAL · SHA-256
                  </span>
                </div>
                <span style={{
                  fontFamily: "'Orbitron'",
                  fontSize: '0.45rem',
                  color: NEON.orange,
                  letterSpacing: '0.1em',
                  background: 'rgba(255,122,24,0.08)',
                  border: '1px solid rgba(255,122,24,0.2)',
                  borderRadius: 4,
                  padding: '2px 8px',
                }}>
                  AGAPE-SOVEREIGN
                </span>
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.58rem',
                color: hashRevealed ? encColor : NEON.magenta,
                letterSpacing: '0.06em',
                lineHeight: 1.7,
                wordBreak: 'break-all',
                textShadow: `0 0 6px ${hashRevealed ? encColor : NEON.magenta}44`,
                transition: 'color 0.4s ease',
              }}>
                {formatHash(displayHash)}
              </div>
            </div>

            {/* Gatekeeper status */}
            {gateDecision && (
              <div style={{
                margin: '20px 0',
                padding: '12px 16px',
                background: gateDecision.allowed ? encColor + '15' : NEON.magenta + '15',
                border: `1px solid ${gateDecision.allowed ? encColor : NEON.magenta}33`,
                borderRadius: 8,
                width: '100%',
                maxWidth: 500,
                textAlign: 'left',
              }}>
                <div style={{
                  fontFamily: "'Share Tech Mono'", fontSize: '0.5rem', color: gateDecision.allowed ? NEON.green : NEON.magenta,
                  letterSpacing: '0.1em',
                  marginBottom: 8,
                }}>
                  {gateDecision.allowed ? '✅ GATE APPROVED' : '🚫 GATE BLOCKED'}
                </div>
                {!gateDecision.allowed && (
                  <div style={{ fontSize: '0.45rem', color: NEON.muted, letterSpacing: '0.08em', marginBottom: 4 }}>
                    Reason: {gateDecision.reason}
                  </div>
                )}
                {gateDecision.validatedFields.length > 0 && (
                  <div style={{ fontSize: '0.45rem', color: encColor, letterSpacing: '0.08em', marginBottom: 4 }}>
                    Validated fields: {gateDecision.validatedFields.join(', ')}
                  </div>
                )}
                {gateDecision.encryptedPayload && (
                  <div style={{ fontSize: '0.45rem', color: encColor, letterSpacing: '0.08em' }}>
                    Encrypted payload: {gateDecision.encryptedPayload.substring(0, 32)}...
                  </div>
                )}
              </div>
            )}

            {/* Provider selection */}
            {fieldSchemas.length > 0 && (
              <div style={{ margin: '20px 0', width: '100%', maxWidth: 500 }}>
                <div style={{ fontFamily: "'Orbitron'", fontSize: '0.5rem', color: NEON.textMuted, letterSpacing: '0.1em', marginBottom: 8 }}>
                  Data Provider
                </div>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {providerOptionsList}
                </div>
              </div>
            )}

            {/* Form fields */}
            {fieldSchemas.length > 0 && (
              <div style={{ width: '100%', maxWidth: 500, textAlign: 'left' }}>
                {fieldSchemas.map((field, idx) => (
                  <div key={field.key} style={{ marginBottom: '12px' }}>
                    <label style={{
                      fontFamily: "'Share Tech Mono'", fontSize: '0.5rem', color: NEON.textMuted, letterSpacing: '0.1em', marginBottom: 4,
                      display: 'block',
                    }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, [field.key]: e.target.value.trim() }));
                      }}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-[#040914] border border-slate-700 focus:border-[#00d4ff] rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00d4ff] transition-all"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Custom field adder */}
            {fieldSchemas.length > 0 && formData[fieldSchemas[fieldSchemas.length - 1].key] && (
              <div style={{ margin: '8px 0', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>
                <span style={{ fontSize: '0.45rem', color: NEON.cyan, letterSpacing: '0.08em' }}>
                  Add custom field: <input
                    type="text"
                    onChange={(e) => setFormData(prev => ({ ...prev, [`custom_${Date.now()}`]: e.target.value }))}
                    className="ml-2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#00d4ff]"
                  />&nbsp;{Object.keys(formData).filter(k => k.startsWith('custom_')).length} active
                </span>
              </div>
            )}

            {/* Gatekeeper action button */}
            <div style={{ width: '100%', marginTop: '24px' }}>
              <button
                onClick={async () => {
                  // Run gatekeeper validation
                  const decision = await gatekeeper.gateData(moduleId, formData, selectedProvider);
                  setGateDecision(decision);

                  if (decision.allowed) {
                    // Encrypt and handoff to Architect AI
                    const jsonStr = JSON.stringify(formData);
                    const encrypted = await encryptClientSide(jsonStr, uid || 'sovereign-user');
                    const sha256Hash = await generateSHA256(jsonStr);

                    // Trigger third-party verification if configured
                    if (showThirdPartyVerification && decision.validatedFields.length > 0) {
                      toast('Third-party verification initiated...', {
                        description: `Vector ${vector} data queued for external validation`,
                        action: {
                          label: 'View Details',
                          onClick: () => {
                            // Open verification modal
                          },
                        },
                      });
                    }

                    // Call onDismiss with handoff data
                    onDismiss({
                      ...decision,
                      formData,
                      sha256Hash,
                      vector,
                      moduleId,
                    });
                  } else {
                    toast.error('Gatekeeper validation failed', {
                      description: decision.reason || 'Please check your inputs and provider selection',
                    });
                  }
                }}
                disabled={Object.keys(formData).length === 0}
                style={{
                  width: '100%',
                  maxWidth: 500,
                  padding: '14px 24px',
                  background: gateDecision?.allowed ? encColor + ' gradient' : NEON.magenta + ' gradient',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontFamily: "'Orbitron'", fontSize: '0.6rem', fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: gateDecision?.allowed ? 'pointer' : 'not-allowed',
                  marginBottom: 8,
                  boxShadow: gateDecision?.allowed ? `0 0 20px rgba(${encColor.replace('#','')},0.3)` : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {gateDecision?.allowed
                  ? <><Cpu className="w-3.5 h-3.5" /> HANDOFF TO ARCHITECT AI (NEMOTRON-3-NANO:4B)⟩
                  : <><ShieldAlert className="w-3.5 h-3.5" /> GATEKEEPER DENIED⟩}
              </button>
            </div>

            {/* Provider hint */}
            {fieldSchemas.length > 0 && (
              <div style={{
                marginTop: '12px', fontSize: '0.45rem', color: encColor,
                letterSpacing: '0.08em', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8,
              }}>
                Provider: {selectedProvider.replace(/-/, ' ').replace(/\b\w/g, c => c.toUpperCase())} — Switch provider to enable different data fields
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Helper to format and truncate SHA-256 display
 */
function formatHash(hash: string): string {
  if (!hash) return 'Computing…';
  if (hashRevealed) return hash;
  // Show only first 32 chars with ellipsis when not revealed
  return hash.substring(0, 32) + '…';
}