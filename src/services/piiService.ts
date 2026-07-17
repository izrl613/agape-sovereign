/// <reference types="vite/client" />

/**
 * piiService.ts — Nymiz-inspired AI PII Detection & Anonymization
 *
 * Provides:
 *  - PII entity detection: names, emails, phones, SSN, DOB, addresses, IDs
 *  - Three anonymization techniques: MASKING · TOKENIZATION · SUBSTITUTION
 *  - Pseudonymization with deterministic token mapping (session-stable)
 *  - Gemini AI fallback for complex NER (names in context, addresses, orgs)
 *  - Scan history persisted to Firestore (collection: pii_scans)
 */

import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_MODEL, OLLAMA_BASE_URL, buildOllamaChatPayload } from '../config/aiModel.js';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PiiType = 'NAME' | 'EMAIL' | 'PHONE' | 'SSN' | 'DOB' | 'ADDRESS' | 'IP' | 'ID' | 'CARD';
export type AnonymizeTechnique = 'MASKING' | 'TOKENIZATION' | 'SUBSTITUTION' | 'PSEUDONYMIZATION';

export interface PiiEntity {
  type: PiiType;
  original: string;
  start: number;
  end: number;
  confidence: number;      // 0.0–1.0
}

export interface PiiScanResult {
  original: string;
  anonymized: string;
  technique: AnonymizeTechnique;
  entitiesFound: PiiEntity[];
  fieldCount: number;
  processingMs: number;
}

export interface PiiScanRecord {
  id?: string;
  userId: string;
  sourceContext: string;
  piiTypes: string[];
  anonymizedPreview: string;
  technique: AnonymizeTechnique;
  fieldCount: number;
  timestamp: Date;
}

// ── Regex-Based PII Detectors ──────────────────────────────────────────────────

const PII_PATTERNS: Array<{ type: PiiType; pattern: RegExp; confidence: number }> = [
  { type: 'SSN',    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,                                                     confidence: 0.99 },
  { type: 'CARD',   pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g,                            confidence: 0.97 },
  { type: 'EMAIL',  pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,                         confidence: 0.99 },
  { type: 'PHONE',  pattern: /\b(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b/g,                 confidence: 0.90 },
  { type: 'DOB',    pattern: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{2}|\d{4})\b/g,    confidence: 0.85 },
  { type: 'IP',     pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,                                    confidence: 0.88 },
  { type: 'NAME',   pattern: /\b[A-Z][a-z]{1,20} [A-Z][a-z]{1,20}\b/g,                                     confidence: 0.60 },
];

// ── Substitution Pools ─────────────────────────────────────────────────────────

const SUBSTITUTE: Record<PiiType, () => string> = {
  NAME:    () => ['Alex Johnson', 'Sam Rivera', 'Jordan Lee', 'Morgan Chen', 'Casey Park'][Math.floor(Math.random() * 5)],
  EMAIL:   () => 'anonymous@private.io',
  PHONE:   () => '555-000-0000',
  SSN:     () => '000-00-0000',
  DOB:     () => '01/01/1970',
  ADDRESS: () => '1 Private Lane, Anytown, USA',
  IP:      () => '0.0.0.0',
  ID:      () => 'ID-REDACTED',
  CARD:    () => '0000-0000-0000-0000',
};

// ── Deterministic Token Map (session-stable pseudonymization) ──────────────────

const _tokenMap = new Map<string, string>();

function pseudonymize(value: string, type: PiiType): string {
  if (_tokenMap.has(value)) return _tokenMap.get(value)!;
  const hash = [...value].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
  const token = `${type}_${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  _tokenMap.set(value, token);
  return token;
}

// ── Core PII Scanner ───────────────────────────────────────────────────────────

export function detectPii(text: string): PiiEntity[] {
  const entities: PiiEntity[] = [];
  for (const { type, pattern, confidence } of PII_PATTERNS) {
    const fresh = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    let match: RegExpExecArray | null;
    while ((match = fresh.exec(text)) !== null) {
      entities.push({ type, original: match[0], start: match.index, end: match.index + match[0].length, confidence });
    }
  }
  // Sort by position descending so replacements don't shift indices
  return entities.sort((a, b) => b.start - a.start);
}

export function anonymizePii(text: string, technique: AnonymizeTechnique): PiiScanResult {
  const t0 = performance.now();
  const entities = detectPii(text);
  let anonymized = text;

  const replace = (entity: PiiEntity): string => {
    switch (technique) {
      case 'MASKING':
        return `[${entity.type}]`;
      case 'TOKENIZATION':
        return `TOK_${entity.type}_${Math.abs([...entity.original].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0)).toString(16).toUpperCase().slice(0, 8)}`;
      case 'SUBSTITUTION':
        return SUBSTITUTE[entity.type]?.() ?? `[${entity.type}]`;
      case 'PSEUDONYMIZATION':
        return pseudonymize(entity.original, entity.type);
    }
  };

  for (const entity of entities) {
    anonymized = anonymized.slice(0, entity.start) + replace(entity) + anonymized.slice(entity.end);
  }

  return {
    original: text,
    anonymized,
    technique,
    entitiesFound: entities.sort((a, b) => a.start - b.start),
    fieldCount: entities.length,
    processingMs: Math.round(performance.now() - t0),
  };
}

// ── AI-Assisted NER (Gemini) ───────────────────────────────────────────────────

export async function detectPiiWithAi(
  text: string,
  technique: AnonymizeTechnique = 'MASKING'
): Promise<PiiScanResult> {
  // Start with regex scan as baseline
  const baseResult = anonymizePii(text, technique);

  try {
    const prompt = `You are a PII detection engine. Identify ALL personal information in the following text and return a JSON array of objects with fields: type (NAME|EMAIL|PHONE|SSN|DOB|ADDRESS|IP|ID|CARD), original (exact match), confidence (0.0-1.0). Only return valid JSON, no prose.\n\nText:\n${text}`;

    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildOllamaChatPayload({
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content: "You are a PII detection engine. Identify ALL personal information in the user text and return a JSON array of objects. Conforming to: [ { 'type': 'NAME'|'EMAIL'|'PHONE'|'SSN'|'DOB'|'ADDRESS'|'IP'|'ID'|'CARD', 'original': string, 'confidence': number } ]. No markdown or extra prose."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        options: {
          temperature: 0.2
        }
      }))
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    const raw = data.message?.content?.trim() ?? '[]';
    const aiEntities: PiiEntity[] = JSON.parse(raw).map((e: Partial<PiiEntity>, i: number) => ({
      type: e.type ?? 'NAME',
      original: e.original ?? '',
      start: text.indexOf(e.original ?? '') + i,
      end: text.indexOf(e.original ?? '') + (e.original?.length ?? 0) + i,
      confidence: e.confidence ?? 0.7,
    }));

    // Merge AI entities + regex entities (deduplicate by original value)
    const seen = new Set(baseResult.entitiesFound.map(e => e.original));
    let enhanced = text;
    for (const entity of aiEntities.filter(e => !seen.has(e.original) && e.original)) {
      const mask = technique === 'MASKING' ? `[${entity.type}]`
        : technique === 'TOKENIZATION' ? `TOK_AI_${entity.type}`
        : technique === 'SUBSTITUTION' ? (SUBSTITUTE[entity.type]?.() ?? `[${entity.type}]`)
        : pseudonymize(entity.original, entity.type);
      enhanced = enhanced.replaceAll(entity.original, mask);
    }

    return {
      ...baseResult,
      anonymized: enhanced,
      entitiesFound: [...baseResult.entitiesFound, ...aiEntities.filter(e => !seen.has(e.original))],
      fieldCount: baseResult.fieldCount + aiEntities.filter(e => !seen.has(e.original)).length,
    };
  } catch {
    return baseResult;  // Graceful fallback to regex result
  }
}

// ── Firestore Persistence ──────────────────────────────────────────────────────

export const logPiiScan = async (record: PiiScanRecord): Promise<void> => {
  try {
    await addDoc(collection(db, 'pii_scans'), {
      ...record,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[PII] Failed to log scan:', err);
  }
};

export const getPiiScanHistory = async (userId: string): Promise<PiiScanRecord[]> => {
  try {
    const snap = await getDocs(
      query(collection(db, 'pii_scans'), where('userId', '==', userId), orderBy('timestamp', 'desc'))
    );
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<PiiScanRecord, 'id'>),
      timestamp: d.data().timestamp?.toDate() ?? new Date(),
    }));
  } catch {
    return [];
  }
};
