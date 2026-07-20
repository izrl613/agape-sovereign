import 'dotenv/config';
import { genkit } from 'genkit';
import { ollama } from 'genkitx-ollama';

export const ai = genkit({
  plugins: [
    ollama({
      models: [
        { name: 'llama3.2:3b', type: 'chat' },
        { name: 'llama3.2:1b', type: 'chat' },
        { name: 'gemma2:2b', type: 'chat' },
        { name: 'phi3.5:3.8b', type: 'chat' },
        { name: 'qwen2.5:3b', type: 'chat' },
        { name: 'llama3.2:3b', type: 'generate' },
        { name: 'llama3.2:1b', type: 'generate' },
        { name: 'gemma2:2b', type: 'generate' },
        { name: 'phi3.5:3.8b', type: 'generate' },
        { name: 'qwen2.5:3b', type: 'generate' },
      ],
      embedders: [
        { name: 'nomic-embed-text', dimensions: 768 },
        { name: 'mxbai-embed-large', dimensions: 1024 },
      ],
      serverAddress: process.env.OLLAMA_HOST || 'http://localhost:11434',
    }),
  ],
});