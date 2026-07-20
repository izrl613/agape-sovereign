import 'dotenv/config';
import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    ollama({
      models: [
        { name: 'llama3.2:3b', type: 'chat' },
        { name: 'llama3.2:1b', type: 'chat' },
        { name: 'nomic-embed-text', type: 'embed' },
        { name: 'mxbai-embed-large', type: 'embed' },
      ],
      serverAddress: process.env.OLLAMA_HOST || 'http://localhost:11434',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});