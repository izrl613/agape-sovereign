import 'dotenv/config';
import { genkit } from 'genkit';
import { ollama } from '@genkit-ai/ollama';

export const ai = genkit({
  plugins: [
    ollama({
      models: [
        { name: 'llama3.2:3b', type: 'generation' },
        { name: 'llama3.2:1b', type: 'generation' },
        { name: 'nomic-embed-text', type: 'embedding' },
        { name: 'mxbai-embed-large', type: 'embedding' },
      ],
      serverAddress: process.env.OLLAMA_HOST || 'http://localhost:11434',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});