import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_MODEL, OLLAMA_BASE_URL, buildOllamaChatPayload } from '../src/config/aiModel.js';

test('defaults to the local Ollama Gemma 4 E4B model', () => {
  assert.equal(DEFAULT_MODEL, 'gemma4:e4b');
  assert.equal(OLLAMA_BASE_URL, 'http://localhost:11434');
});

test('builds Ollama chat payloads with the default model', () => {
  const payload = buildOllamaChatPayload({
    messages: [{ role: 'user', content: 'Hello' }],
    stream: false,
  });

  assert.equal(payload.model, 'gemma4:e4b');
  assert.equal(payload.stream, false);
  assert.deepEqual(payload.messages, [{ role: 'user', content: 'Hello' }]);
});
