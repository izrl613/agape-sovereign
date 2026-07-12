/**
 * dlpService.ts — Polymer-inspired Adaptive Data Loss Prevention
 *
 * Provides:
 *  - Pattern-based PII / credential / sensitive-data detection
 *  - Configurable rule engine: REDACT · BLOCK · REPLACE · ALERT
 *  - Violation log persisted to Firestore (collection: dlp_violations)
 *  - Real-time clipboard & input-field monitoring hooks
 */

import { db } from '../firebase';
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Unsubscribe
} from 'firebase/firestore';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DlpAction = 'REDACT' | 'BLOCK' | 'REPLACE' | 'ALERT';
export type DlpSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DlpRule {
  id: string;
  name: string;
  pattern: RegExp;
  action: DlpAction;
  severity: DlpSeverity;
  replacement?: string;   // used when action === 'REPLACE'
  enabled: boolean;
}

export interface DlpViolation {
  id?: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  dataType: string;
  redactedPreview: string;
  action: DlpAction;
  sourceContext: string;  // 'clipboard' | 'input' | 'paste' | 'api-response' | 'manual'
  timestamp: Date;
}

export interface DlpScanResult {
  original: string;
  processed: string;
  violations: Array<{ ruleName: string; action: DlpAction; severity: DlpSeverity }>;
  blocked: boolean;
}

// ── Default Rule Set ───────────────────────────────────────────────────────────

export const DEFAULT_DLP_RULES: DlpRule[] = [
  {
    id: 'dlp-ssn',
    name: 'Social Security Number',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    action: 'REDACT',
    severity: 'CRITICAL',
    replacement: '[SSN REDACTED]',
    enabled: true,
  },
  {
    id: 'dlp-cc',
    name: 'Credit / Debit Card Number',
    pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,
    action: 'REDACT',
    severity: 'CRITICAL',
    replacement: '[CARD REDACTED]',
    enabled: true,
  },
  {
    id: 'dlp-passport',
    name: 'Passport / Gov. ID',
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,
    action: 'BLOCK',
    severity: 'CRITICAL',
    enabled: true,
  },
  {
    id: 'dlp-bank-acct',
    name: 'Bank Account Number',
    pattern: /\b\d{8,17}\b/g,
    action: 'REDACT',
    severity: 'HIGH',
    replacement: '[ACCT REDACTED]',
    enabled: true,
  },
  {
    id: 'dlp-email',
    name: 'Email Address',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    action: 'REPLACE',
    severity: 'MEDIUM',
    replacement: 'user@private.io',
    enabled: true,
  },
  {
    id: 'dlp-phone',
    name: 'Phone Number',
    pattern: /\b(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/g,
    action: 'REPLACE',
    severity: 'MEDIUM',
    replacement: '[PHONE REDACTED]',
    enabled: true,
  },
  {
    id: 'dlp-api-key',
    name: 'API Key / Secret Token',
    pattern: /\b(sk|pk|api|key|secret|token)[_\-][a-zA-Z0-9_\-]{20,}/gi,
    action: 'BLOCK',
    severity: 'CRITICAL',
    enabled: true,
  },
  {
    id: 'dlp-ip',
    name: 'IP Address',
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    action: 'REPLACE',
    severity: 'LOW',
    replacement: '[IP REDACTED]',
    enabled: false,
  },
];

// ── Core DLP Engine ────────────────────────────────────────────────────────────

export class DlpEngine {
  private rules: DlpRule[];

  constructor(rules: DlpRule[] = DEFAULT_DLP_RULES) {
    this.rules = rules;
  }

  /** Scan text against all active rules. Returns processed text + violation list. */
  scan(text: string, sourceContext = 'manual'): DlpScanResult {
    let processed = text;
    const violations: DlpScanResult['violations'] = [];
    let blocked = false;

    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      const fresh = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
      if (!fresh.test(processed)) continue;

      violations.push({ ruleName: rule.name, action: rule.action, severity: rule.severity });

      if (rule.action === 'BLOCK') {
        blocked = true;
        processed = `[BLOCKED — ${rule.name}]`;
        break;
      } else if (rule.action === 'REDACT' || rule.action === 'REPLACE') {
        const freshReplace = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
        processed = processed.replace(freshReplace, rule.replacement ?? `[${rule.name} REDACTED]`);
      }
      // ALERT: leave content unchanged but record violation
    }

    return { original: text, processed, violations, blocked };
  }

  /** Update a rule's enabled state at runtime. */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) rule.enabled = enabled;
  }

  getRules(): DlpRule[] {
    return [...this.rules];
  }
}

// ── Firestore Violation Logging ────────────────────────────────────────────────

export const logDlpViolation = async (violation: DlpViolation): Promise<void> => {
  try {
    await addDoc(collection(db, 'dlp_violations'), {
      ...violation,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[DLP] Failed to log violation:', err);
  }
};

export const subscribeDlpViolations = (
  userId: string,
  onUpdate: (violations: DlpViolation[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'dlp_violations'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, snapshot => {
    const items: DlpViolation[] = snapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<DlpViolation, 'id'>),
      timestamp: d.data().timestamp?.toDate() ?? new Date(),
    }));
    onUpdate(items);
  }, err => console.warn('[DLP] Violation snapshot error:', err));
};

// ── Singleton export ───────────────────────────────────────────────────────────
export const dlpEngine = new DlpEngine();
