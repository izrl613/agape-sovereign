import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';
import { enableDevTools } from 'genkit/beta/devtools';
import { defineFlow } from 'genkit';
import { z } from 'zod';
import { flows } from './flows.js';

export const ai = genkit({
  plugins: [
    ollama({
      models: [
        { name: 'llama3.2:3b', type: 'generate' },
        { name: 'llama3.2:1b', type: 'generate' },
        { name: 'gemma2:2b', type: 'generate' },
        { name: 'phi3:mini', type: 'generate' },
        { name: 'nomic-embed-text', type: 'embed' },
      ],
      serverAddress: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
    }),
  ],
});

for (const flow of flows) {
  defineFlow(ai, flow);
}

enableDevTools(ai);

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.HOST || '0.0.0.0';

console.log(`Genkit backend starting on http://${host}:${port}`);
console.log(`Ollama server: ${process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'}`);
console.log('Available models: llama3.2:3b, llama3.2:1b, gemma2:2b, phi3:mini');
console.log('Embedding model: nomic-embed-text');