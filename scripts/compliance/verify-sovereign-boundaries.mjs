#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const productionFiles = [
  'server.ts',
  'package.json',
  'src/services/localAIService.ts',
  'src/services/scanService.ts',
  'src/components/ArchitectAI.tsx',
  'src/lib/ArchitectMCPClient.ts',
  'architect-mcp-server/src/index.ts',
];

const forbiddenAiMarkers = [
  /@google\/genai/,
  /GoogleGenAI/,
  /VertexGenAi/,
  /ai\.models\.generateContent/,
  /gemini-[\w.-]+/i,
  /https:\/\/[^\s"']+\.run\.app/,
];

const knownSeededFindingMarkers = [
  /Sovereign Score is currently 71\/100/i,
  /\b59\s+NUKED\b/i,
  /\b207\s+KNOXED\b/i,
];

const violations = [];

for (const file of productionFiles) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }

  forbiddenAiMarkers.forEach((marker) => {
    if (marker.test(text)) violations.push(`${file}: forbidden cloud-AI marker ${marker}`);
  });

  knownSeededFindingMarkers.forEach((marker) => {
    if (marker.test(text)) violations.push(`${file}: known seeded finding ${marker}`);
  });
}

if (violations.length > 0) {
  console.error('Sovereign boundary violations found:');
  violations.forEach((violation) => console.error(`- ${violation}`));
  console.error('\nRemove the cloud path or seeded result before release.');
  process.exitCode = 1;
} else {
  console.log('Sovereign boundary check passed: no cloud-AI markers or known seeded findings found.');
}
