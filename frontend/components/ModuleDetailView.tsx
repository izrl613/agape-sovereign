import React, { useState, useEffect } from 'react';
import { NEON, DIFF_MODULES, GRADIENT_BORDER, PILLARS, PillarKey } from '../constants';
import { GlassCard, NeonText, NeonButton, StatusBadge, SovereignScore } from './ui/NeonElements';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth } from '../lib/firebase';

interface ModuleDetailViewProps {
  moduleId: string;
  onBack: () => void;
  user: { uid: string; email: string; provider: string };
}

type InputType = 'text' | 'textarea' | 'email' | 'url' | 'password' | 'number' | 'select' | 'checkbox';

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'url' | 'password' | 'number' | 'select' | 'checkbox';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  sensitive?: boolean;
  helpText?: string;
}

const MODULE_FIELDS: Record<string, FormField[]> = {
  email: [
    { key: 'primaryEmail', label: 'Primary Email', type: 'email', placeholder: 'you@domain.com', required: true, sensitive: true },
    { key: 'secondaryEmails', label: 'Secondary Emails (comma-separated)', type: 'textarea', placeholder: 'backup@domain.com, work@domain.com', helpText: 'All emails to scan for breaches' },
    { key: 'recoveryEmails', label: 'Recovery Emails', type: 'textarea', placeholder: 'recovery@domain.com', helpText: 'Account recovery addresses' },
    { key: 'aliases', label: 'Email Aliases (plus-addressing)', type: 'textarea', placeholder: 'alias+tag@domain.com', helpText: 'Plus-addressing aliases used' },
  ],
  social: [
    { key: 'facebook', label: 'Facebook Profile URL', type: 'url', placeholder: 'https://facebook.com/username' },
    { key: 'twitter', label: 'Twitter/X Handle', type: 'text', placeholder: '@username' },
    { key: 'linkedin', label: 'LinkedIn Profile URL', type: 'url', placeholder: 'https://linkedin.com/in/username' },
    { key: 'instagram', label: 'Instagram Handle', type: 'text', placeholder: '@username' },
    { key: 'github', label: 'GitHub Username', type: 'text', placeholder: 'username' },
    { key: 'discord', label: 'Discord Tag', type: 'text', placeholder: 'username#1234' },
    { key: 'reddit', label: 'Reddit Username', type: 'text', placeholder: 'u/username' },
    { key: 'otherProfiles', label: 'Other Social Profiles', type: 'textarea', placeholder: 'TikTok, YouTube, Mastodon, etc.' },
  ],
  device: [
    { key: 'deviceName', label: 'Device Name', type: 'text', placeholder: 'MacBook Pro M3, iPhone 15 Pro', required: true },
    { key: 'osVersion', label: 'OS Version', type: 'text', placeholder: 'macOS 14.5, iOS 17.5' },
    { key: 'serialNumber', label: 'Serial Number (optional)', type: 'text', placeholder: 'C02XXXXXX', sensitive: true },
    { key: 'encryptionStatus', label: 'Full Disk Encryption', type: 'select', options: ['FileVault/BitLocker ON', 'FileVault/BitLocker OFF', 'Unknown'], required: true },
    { key: 'lockScreen', label: 'Lock Screen Enabled', type: 'select', options: ['Enabled (biometric+PIN)', 'Enabled (PIN only)', 'Disabled'], required: true },
    { key: 'autoLock', label: 'Auto-Lock Timeout', type: 'select', options: ['30 seconds', '1 minute', '5 minutes', '15 minutes', 'Never'] },
  ],
  mobile: [
    { key: 'deviceModel', label: 'Device Model', type: 'text', placeholder: 'iPhone 15 Pro, Pixel 8 Pro', required: true },
    { key: 'osVersion', label: 'OS Version', type: 'text', placeholder: 'iOS 17.5, Android 14' },
    { key: 'passkeyEnabled', label: 'Passkeys Enabled', type: 'select', options: ['Yes (iCloud Keychain / Google Password Manager)', 'Partial', 'No'], required: true },
    { key: 'biometricAuth', label: 'Biometric Authentication', type: 'select', options: ['Face ID / Face Unlock', 'Touch ID / Fingerprint', 'None'], required: true },
    { key: 'appPermissions', label: 'Over-Privileged Apps', type: 'textarea', placeholder: 'App Name - Permission (e.g., Maps - Location Always)' },
    { key: 'mdmProfile', label: 'MDM/Device Management Profile', type: 'select', options: ['None', 'Corporate MDM', 'Personal (Apple Configurator / Android Enterprise)'], required: true },
    { key: 'backupEncryption', label: 'Encrypted Backups', type: 'select', options: ['iCloud Encrypted / Google Encrypted', 'Local Encrypted (iTunes/Finder)', 'Unencrypted', 'Unknown'] },
  ],
  deepweb: [
    { key: 'monitoredEmails', label: 'Emails to Monitor', type: 'textarea', placeholder: 'email1@domain.com, email2@domain.com', required: true },
    { key: 'monitoredUsernames', label: 'Usernames to Monitor', type: 'textarea', placeholder: 'username1, username2' },
    { key: 'monitoredPhones', label: 'Phone Numbers', type: 'textarea', placeholder: '+1-555-123-4567' },
    { key: 'monitoredSSN', label: 'SSN Last 4 (optional)', type: 'text', placeholder: '1234', sensitive: true },
    { key: 'alertEmail', label: 'Alert Email', type: 'email', placeholder: 'alerts@yourdomain.com' },
    { key: 'monitoringFrequency', label: 'Scan Frequency', type: 'select', options: ['Continuous (real-time)', 'Daily', 'Weekly', 'Monthly'], required: true },
  ],
  broker: [
    { key: 'fullName', label: 'Legal Full Name', type: 'text', placeholder: 'First Middle Last', required: true, sensitive: true },
    { key: 'addresses', label: 'Current & Previous Addresses', type: 'textarea', placeholder: '123 Main St, City, ST 12345\n456 Oak Ave, City, ST 67890', sensitive: true },
    { key: 'phoneNumbers', label: 'Phone Numbers', type: 'textarea', placeholder: '+1-555-123-4567, +1-555-987-6543', sensitive: true },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'text', placeholder: 'MM/DD/YYYY', sensitive: true },
    { key: 'removalStatus', label: 'Removal Request Status', type: 'select', options: ['Not Started', 'Submitted - Pending', 'Partial Success', 'Completed', 'Failed - Legal Escalation'] },
    { key: 'brokersTargeted', label: 'Brokers Targeted', type: 'textarea', placeholder: 'Acxiom, Experian, Equifax, TransUnion, LexisNexis, PeopleFinders, Whitepages, Spokeo...' },
  ],
  password: [
    { key: 'vaultType', label: 'Password Manager', type: 'select', options: ['1Password', 'Bitwarden', 'Apple Keychain', 'Google Password Manager', 'KeePass/KeePassXC', 'Dashlane', 'LastPass', 'Other', 'None (manual)'], required: true },
    { key: 'masterPasswordStrength', label: 'Master Password Strength', type: 'select', options: ['Diceware (6+ words)', 'Strong Random (20+ chars)', 'Moderate (12-19 chars)', 'Weak (<12 chars)', 'N/A - No Vault'], required: true },
    { key: 'totalEntries', label: 'Total Vault Entries', type: 'number', placeholder: '247' },
    { key: 'reusedCount', label: 'Reused Passwords', type: 'number', placeholder: '3' },
    { key: 'breachedCount', label: 'Breached Passwords', type: 'number', placeholder: '0' },
    { key: 'mfaEnabled', label: 'MFA on Vault', type: 'select', options: ['Yes (TOTP + Hardware Key)', 'Yes (TOTP only)', 'Yes (SMS only)', 'No'], required: true },
    { key: 'rotationPolicy', label: 'Rotation Policy', type: 'select', options: ['Auto-rotate on breach', 'Manual rotation quarterly', 'Manual rotation annually', 'Never rotated'] },
  ],
  location: [
    { key: 'locationServices', label: 'Location Services', type: 'select', options: ['Enabled (precise)', 'Enabled (approximate)', 'Disabled'], required: true },
    { key: 'significantLocations', label: 'Significant Locations Tracked', type: 'number', placeholder: '47' },
    { key: 'appsWithLocation', label: 'Apps with Location Access', type: 'textarea', placeholder: 'Maps - Always, Weather - While Using, Social - While Using' },
    { key: 'geoTagPhotos', label: 'Photo Geo-Tagging', type: 'select', options: ['Enabled', 'Disabled', 'Strip on Share'] },
    { key: 'locationHistory', label: 'Location History Retention', type: 'select', options: ['3 months', '18 months', 'Until deleted', 'Disabled'] },
    { key: 'findMyEnabled', label: 'Find My / Find Device', type: 'select', options: ['Enabled (network + device)', 'Enabled (device only)', 'Disabled'] },
  ],
  browser: [
    { key: 'primaryBrowser', label: 'Primary Browser', type: 'select', options: ['Safari', 'Chrome', 'Firefox', 'Brave', 'Edge', 'Arc', 'Other'], required: true },
    { key: 'extensions', label: 'Privacy Extensions Installed', type: 'textarea', placeholder: 'uBlock Origin, Privacy Badger, HTTPS Everywhere, Cookie AutoDelete, Canvas Blocker' },
    { key: 'cookiePolicy', label: 'Cookie Policy', type: 'select', options: ['Block all third-party', 'Block cross-site', 'Allow all', 'Custom per-site'] },
    { key: 'fingerprintProtection', label: 'Fingerprint Protection', type: 'select', options: ['Strict (Tor Browser / Brave)', 'Standard (Firefox RfP)', 'Basic (Safari ITP)', 'None'] },
    { key: 'dnsProvider', label: 'DNS Provider', type: 'select', options: ['Quad9 (9.9.9.9)', 'NextDNS', 'Cloudflare (1.1.1.1)', 'Google (8.8.8.8)', 'ISP Default', 'Custom DoH/DoT'] },
    { key: 'clearOnExit', label: 'Clear on Exit', type: 'select', options: ['Everything', 'Cookies only', 'History only', 'Nothing'] },
  ],
  financial: [
    { key: 'creditCards', label: 'Credit Cards on File', type: 'number', placeholder: '3' },
    { key: 'bankAccounts', label: 'Bank Accounts Linked', type: 'number', placeholder: '2' },
    { key: 'paymentApps', label: 'Payment Apps', type: 'textarea', placeholder: 'Apple Pay, Google Pay, PayPal, Venmo, Cash App, Stripe' },
    { key: 'cryptoWallets', label: 'Crypto Wallets/Exchanges', type: 'textarea', placeholder: 'Coinbase, MetaMask, Ledger, Trezor' },
    { key: 'investmentAccounts', label: 'Investment Accounts', type: 'textarea', placeholder: 'Robinhood, Fidelity, Vanguard, Interactive Brokers' },
    { key: 'creditFreeze', label: 'Credit Freeze Status', type: 'select', options: ['All 3 bureaus frozen', '2 of 3 frozen', '1 of 3 frozen', 'None frozen'] },
    { key: 'identityTheftProtection', label: 'Identity Theft Protection', type: 'select', options: ['Active (LifeLock, etc.)', 'Credit monitoring only', 'None'] },
  ],
  medical: [
    { key: 'providers', label: 'Healthcare Providers', type: 'textarea', placeholder: 'Primary care, specialists, hospitals, clinics' },
    { key: 'insuranceCarriers', label: 'Insurance Carriers', type: 'textarea', placeholder: 'Blue Cross, Aetna, UnitedHealthcare, Medicare' },
    { key: 'patientPortals', label: 'Patient Portals Used', type: 'textarea', placeholder: 'MyChart, Epic MyChart, HealtheLife, FollowMyHealth' },
    { key: 'prescriptions', label: 'Active Prescriptions', type: 'number', placeholder: '3' },
    { key: 'wearableHealth', label: 'Wearable Health Data', type: 'select', options: ['Apple Health', 'Google Fit', 'Garmin Connect', 'Fitbit', 'Oura', 'None'] },
    { key: 'hipaaConsent', label: 'HIPAA Consent Status', type: 'select', options: ['Current', 'Expired', 'Partial', 'Unknown'] },
  ],
  biometric: [
    { key: 'voicePrints', label: 'Voice Prints Stored', type: 'textarea', placeholder: 'Siri, Google Assistant, Alexa, banking apps' },
    { key: 'facialHashes', label: 'Facial Hashes Stored', type: 'textarea', placeholder: 'Face ID, Windows Hello, banking apps, airport e-gates' },
    { key: 'fingerprints', label: 'Fingerprints Registered', type: 'number', placeholder: '10 (Touch ID, Windows Hello, border control)' },
    { key: 'irisScans', label: 'Iris/Retina Scans', type: 'textarea', placeholder: 'CLEAR, border control, corporate access' },
    { key: 'gaitBehavioral', label: 'Gait/Behavioral Biometrics', type: 'select', options: ['Enabled (banking/app)', 'Disabled', 'Unknown'] },
    { key: 'consentStatus', label: 'Biometric Consent Status', type: 'select', options: ['Explicit consent given', 'Implicit (ToS)', 'Revoked', 'Unknown'] },
  ],
  iot: [
    { key: 'smartHomeHub', label: 'Smart Home Hub', type: 'select', options: ['HomeKit', 'Google Home', 'Alexa', 'SmartThings', 'Hubitat', 'Home Assistant', 'None'] },
    { key: 'connectedDevices', label: 'Connected Devices', type: 'number', placeholder: '23' },
    { key: 'deviceTypes', label: 'Device Types', type: 'textarea', placeholder: 'Cameras, thermostats, locks, lights, speakers, sensors, appliances' },
    { key: 'defaultCredentials', label: 'Devices with Default Credentials', type: 'number', placeholder: '0' },
    { key: 'firmwareUpdate', label: 'Firmware Update Policy', type: 'select', options: ['Auto-update', 'Manual (quarterly)', 'Manual (annually)', 'Never updated'] },
    { key: 'networkSegmentation', label: 'IoT Network Segmentation', type: 'select', options: ['VLAN isolated', 'Guest network', 'Same LAN', 'Unknown'] },
  ],
  cloud: [
    { key: 'cloudProviders', label: 'Cloud Providers', type: 'textarea', placeholder: 'iCloud, Google Drive, OneDrive, Dropbox, AWS S3, Backblaze B2' },
    { key: 'totalStorageGB', label: 'Total Storage (GB)', type: 'number', placeholder: '2500' },
    { key: 'encryptionAtRest', label: 'Encryption at Rest', type: 'select', options: ['Provider-managed (AES-256)', 'Client-side (Cryptomator, Boxcryptor)', 'Both', 'Unknown/None'] },
    { key: 'sharedLinks', label: 'Active Shared Links', type: 'number', placeholder: '12' },
    { key: 'versioning', label: 'Versioning/Trash Retention', type: 'select', options: ['30 days', '90 days', '1 year', 'Forever', 'Disabled'] },
    { key: 'aiArtifacts', label: 'AI Model Artifacts Stored', type: 'select', options: ['Yes (local models, LoRAs)', 'Yes (API keys only)', 'No'] },
  ],
  darkweb: [
    { key: 'monitoredIdentities', label: 'Identities Monitored', type: 'textarea', placeholder: 'Email, phone, SSN, passport, drivers license, credit cards' },
    { key: 'alertChannels', label: 'Alert Channels', type: 'select', options: ['Email + SMS', 'Email only', 'Push notification', 'Webhook/Telegram'] },
    { key: 'marketplacesScanned', label: 'Marketplaces Scanned', type: 'select', options: ['All major (20+)', 'Top 10', 'Top 5', 'Custom list'] },
    { key: 'takedownService', label: 'Automated Takedown', type: 'select', options: ['Enabled (legal partner)', 'Manual requests only', 'Not available'] },
    { key: 'credentialRotation', label: 'Auto-Credential Rotation', type: 'select', options: ['On detection', 'Weekly', 'Monthly', 'Manual'] },
  ],
  behavioral: [
    { key: 'baselineEstablished', label: 'Behavioral Baseline', type: 'select', options: ['Established (30+ days)', 'Partial (7-30 days)', 'New (< 7 days)', 'None'] },
    { key: 'anomaliesDetected', label: 'Anomalies Detected (30 days)', type: 'number', placeholder: '2' },
    { key: 'aiAgentsActive', label: 'AI Agents/Assistants Active', type: 'textarea', placeholder: 'GitHub Copilot, Cursor, ChatGPT, Claude, local LLMs' },
    { key: 'dataExfilAlerts', label: 'Data Exfiltration Alerts', type: 'number', placeholder: '0' },
    { key: 'privacyBudget', label: 'Privacy Budget (ε-differential)', type: 'text', placeholder: 'ε = 1.0 (standard), 0.5 (strict), 2.0 (lenient)' },
    { key: 'consentGranularity', label: 'Consent Granularity', type: 'select', options: ['Per-purpose per-vector', 'Per-vector', 'Global only', 'None'] },
  ],
};

export const ModuleDetailView: React.FC<ModuleDetailViewProps> = ({ moduleId, onBack, user }) => {
  const module = DIFF_MODULES.find(m => m.id === moduleId);
  if (!module) return null;

  const fields = MODULE_FIELDS[moduleId] || [];
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'ivm_data', moduleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
      } catch (err) {
        console.error('Failed to load IVM data:', err);
      }
    };
    loadData();
  }, [moduleId, user.uid]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (saved) setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const docRef = doc(db, 'users', user.uid, 'ivm_data', moduleId);
      await setDoc(docRef, {
        ...formData,
        moduleId,
        updatedAt: Timestamp.now(),
        updatedBy: user.uid,
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key] || '';
    
    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.key} className="mb-4">
            <label className="block font-['Rajdhani'] text-[0.75rem] font-semibold mb-1.5" style={{ color: NEON.text }}>
              {field.label} {field.required && <span style={{ color: NEON.magenta }}> *</span>}
            </label>
            <textarea
              value={value}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00D4FF]/50 font-['Rajdhani'] text-sm"
              style={{ caretColor: NEON.blue }}
            />
            {field.helpText && <div className="text-[0.65rem] mt-1" style={{ color: NEON.textMuted }}>{field.helpText}</div>}
          </div>
        );
      case 'select':
        return (
          <div key={field.key} className="mb-4">
            <label className="block font-['Rajdhani'] text-[0.75rem] font-semibold mb-1.5" style={{ color: NEON.text }}>
              {field.label} {field.required && <span style={{ color: NEON.magenta }}> *</span>}
            </label>
            <select
              value={value}
              onChange={e => handleChange(field.key, e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00D4FF]/50"
              style={{ background: 'rgba(8,18,40,0.8)', color: NEON.text }}
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.key} className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={e => handleChange(field.key, e.target.checked)}
              className="w-4 h-4 rounded border-white/20"
              style={{ accentColor: NEON.blue }}
            />
            <label className="font-['Rajdhani'] text-sm" style={{ color: NEON.text }}>{field.label}</label>
          </div>
        );
      case 'password':
        return (
          <div key={field.key} className="mb-4">
            <label className="block font-['Rajdhani'] text-[0.75rem] font-semibold mb-1.5" style={{ color: NEON.text }}>
              {field.label} {field.required && <span style={{ color: NEON.magenta }}> *</span>}
            </label>
            <input
              type="password"
              value={value}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00D4FF]/50"
              style={{ caretColor: NEON.blue }}
            />
            {field.helpText && <div className="text-[0.65rem] mt-1" style={{ color: NEON.textMuted }}>{field.helpText}</div>}
          </div>
        );
      case 'number':
        return (
          <div key={field.key} className="mb-4">
            <label className="block font-['Rajdhani'] text-[0.75rem] font-semibold mb-1.5" style={{ color: NEON.text }}>
              {field.label} {field.required && <span style={{ color: NEON.magenta }}> *</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => handleChange(field.key, parseInt(e.target.value) || 0)}
              placeholder={field.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00D4FF]/50"
              style={{ caretColor: NEON.blue }}
            />
          </div>
        );
      default:
        return (
          <div key={field.key} className="mb-4">
            <label className="block font-['Rajdhani'] text-[0.75rem] font-semibold mb-1.5" style={{ color: NEON.text }}>
              {field.label} {field.required && <span style={{ color: NEON.magenta }}> *</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={e => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#00D4FF]/50"
              style={{ caretColor: NEON.blue }}
            />
            {field.helpText && <div className="text-[0.65rem] mt-1" style={{ color: NEON.textMuted }}>{field.helpText}</div>}
          </div>
        );
    }
  };

  return (
    <div className="p-6 overflow-y-auto h-full" style={{ animation: "fade-in 0.4s ease" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3" onClick={onBack} style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: NEON.textMuted }}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <div>
            <div className="font-['Share_Tech_Mono'] text-[0.6rem] tracking-[0.15em]" style={{ color: NEON.textMuted }}>MODULE {module.vector}</div>
            <NeonText color={NEON.blue} size="1.1rem" weight={900}>{module.label}</NeonText>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <StatusBadge type={module.nuked > module.knoxed ? 'NUKED' : module.knoxed > module.nuked ? 'KNOXED' : 'MONITORED'} />
          <div className="w-12 h-[2px] shrink-0" style={{ background: GRADIENT_BORDER }} />
          <SovereignScore score={100 - module.severity} />
        </div>
      </div>

      <div className="h-[1px] mb-6" style={{ background: GRADIENT_BORDER }} />

      {/* Pillar badge */}
      <div className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `rgba(0,212,255,0.05)`, border: `1px solid rgba(0,212,255,0.15)` }}>
        <span className="font-['Share_Tech_Mono'] text-[0.55rem] tracking-[0.1em]" style={{ color: NEON.orange }}>PILLAR</span>
        <div className="w-[4px] h-[4px] rounded-full" style={{ background: module.pillar === 'POLYMER' ? NEON.magenta : module.pillar === 'UNOSECUR' ? NEON.orange : module.pillar === 'NYMIZ' ? NEON.blue : module.pillar === 'PRIVACY_PROCTOR' ? NEON.orange : NEON.blue }} />
        <span className="font-['Orbitron'] text-[0.65rem] font-bold" style={{ color: NEON.blue }}>{module.pillar}</span>
      </div>

      {/* Capability */}
      <div className="mb-5 p-3 rounded-lg border" style={{ background: "rgba(0,212,255,0.03)", borderColor: "rgba(0,212,255,0.1)" }}>
        <div className="font-['Share_Tech_Mono'] text-[0.55rem] tracking-[0.1em] mb-1" style={{ color: NEON.orange }}>CAPABILITY</div>
        <div className="text-[0.8rem] leading-relaxed" style={{ color: NEON.text }}>{module.capability}</div>
      </div>

      {/* Techniques */}
      <div className="mb-5">
        <div className="font-['Share_Tech_Mono'] text-[0.55rem] tracking-[0.1em] mb-2" style={{ color: NEON.orange }}>TECHNIQUES</div>
        <div className="flex flex-wrap gap-2">
          {module.techniques.map((t, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-[0.6rem] font-['Rajdhani'] border" style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.1)", color: NEON.textMuted }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[1px] mb-5" style={{ background: GRADIENT_BORDER }} />

      {/* Data Entry Form */}
      <div className="mb-4 flex items-center justify-between">
        <NeonText color={NEON.orange} size="0.72rem">DATA ENTRY — {module.label}</NeonText>
        <div className="flex gap-2">
          {saved && <span className="text-[0.65rem] font-['Orbitron']" style={{ color: NEON.blue }}>✓ SAVED</span>}
          {error && <span className="text-[0.65rem] font-['Orbitron']" style={{ color: NEON.magenta }}>ERROR</span>}
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
        <div className="space-y-4 max-w-2xl">
          {fields.map(field => renderField(field))}
          
          {/* Signature */}
          <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="confirm" required className="w-4 h-4" style={{ accentColor: NEON.blue }} />
              <label htmlFor="confirm" className="font-['Rajdhani'] text-sm" style={{ color: NEON.text }}>
                I confirm this data is accurate and consent to its encrypted storage for identity analysis
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onBack}
              className="btn-neon neon-border flex-1 py-3 px-5 rounded-lg text-white font-['Orbitron'] font-semibold text-sm"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.1)", color: NEON.textMuted }}
            >
              BACK TO DASHBOARD
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="btn-neon neon-border flex-1 py-3 px-5 rounded-lg text-white font-['Orbitron'] font-semibold text-sm"
              style={{ background: "rgba(0,212,255,0.1)", borderColor: `${NEON.blue}44`, color: NEON.blue, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: `rgba(0,212,255,0.3)`, borderTopColor: NEON.blue, animation: "spinner 1s linear infinite" }} />
                  ENCRYPTING & SAVING...
                </span>
              ) : '⬡ ENCRYPT & SAVE VECTOR'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ModuleDetailView;