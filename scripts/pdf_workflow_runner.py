#!/usr/bin/env python3
import json
import re
from pathlib import Path
from typing import List, Dict, Any

ROOT = Path('/Users/aarondavid/Documents/agape-sovereign')
SOURCE = Path('/Users/aarondavid/Desktop/Sovereign Data Pipeline Defined - 2026-07-15 21.46.md')
OUTPUT_DIR = ROOT / 'output'
OUTPUT_DIR.mkdir(exist_ok=True)


def extract_sections(text: str) -> List[Dict[str, Any]]:
    sections = []
    current = None
    for line in text.splitlines():
        if re.match(r'^#{1,4}\s+', line):
            if current:
                sections.append(current)
            current = {'heading': line.lstrip('#').strip(), 'content': []}
        elif current is not None:
            current['content'].append(line)
    if current:
        sections.append(current)
    return sections


def extract_entities(text: str) -> Dict[str, List[str]]:
    entities = {
        'names': [],
        'dates': [],
        'financial_figures': [],
        'technical_schematics': [],
    }
    for line in text.splitlines():
        if re.search(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', line):
            entities['names'].append(line.strip())
        if re.search(r'\b(19|20)\d{2}\b', line):
            entities['dates'].append(line.strip())
        if re.search(r'\$\d[\d,]*(?:\.\d+)?', line):
            entities['financial_figures'].append(line.strip())
        if re.search(r'\b(?:PDF|API|JSON|OCR|MCP|IndexedDB|Service Worker|SHA256|GitHub|Firebase|PWA)\b', line, flags=re.I):
            entities['technical_schematics'].append(line.strip())
    return entities


def build_briefing(sections: List[Dict[str, Any]], entities: Dict[str, List[str]]) -> str:
    lines = []
    lines.append('Executive Briefing')
    lines.append('=================')
    lines.append('')
    lines.append('This document outlines an orchestrated sovereign workflow involving extraction, AI processing, PDF generation, and offline-first delivery.')
    lines.append('')
    lines.append('Key themes:')
    for section in sections[:8]:
        lines.append(f'- {section["heading"]}')
    lines.append('')
    lines.append('Extracted data points:')
    for key, values in entities.items():
        lines.append(f'- {key}: {len(values)} matches')
    return '\n'.join(lines)


def find_compliance_issues(text: str) -> List[str]:
    issues = []
    if 'GDPR' not in text.upper():
        issues.append('GDPR controls are not explicitly enumerated in the document.')
    if 'CCPA' not in text.upper():
        issues.append('CCPA controls are not explicitly enumerated in the document.')
    if 'privacy' not in text.lower():
        issues.append('Privacy safeguards are only implied and should be formalized.')
    if not issues:
        issues.append('No explicit compliance gaps were detected in the extracted text.')
    return issues


def run() -> Dict[str, Any]:
    text = SOURCE.read_text(encoding='utf-8', errors='ignore')
    sections = extract_sections(text)
    entities = extract_entities(text)
    briefing = build_briefing(sections, entities)
    compliance = find_compliance_issues(text)
    report = {
        'source_file': str(SOURCE),
        'section_count': len(sections),
        'entities': entities,
        'briefing': briefing,
        'compliance_issues': compliance,
        'workflow_summary': [
            'Ingestion and parsing of the document',
            'Extraction of names, dates, financial figures, and technical concepts',
            'Synthesis into executive briefing',
            'Compliance review for privacy and data-handling controls',
        ],
    }
    (OUTPUT_DIR / 'extracted_report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (OUTPUT_DIR / 'executive_briefing.txt').write_text(briefing, encoding='utf-8')
    (OUTPUT_DIR / 'compliance_review.txt').write_text('\n'.join(compliance), encoding='utf-8')
    return report


if __name__ == '__main__':
    result = run()
    print(json.dumps(result, indent=2))
