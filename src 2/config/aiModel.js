export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || process.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
export const DEFAULT_MODEL = process.env.ARCHITECT_MODEL || process.env.VITE_ARCHITECT_MODEL || 'gemma4:e4b';

/**
 * @param {{
 *   messages: Array<{ role: string, content: string }>,
 *   stream?: boolean,
 *   format?: string,
 *   options?: Record<string, unknown>,
 *   model?: string
 * }} params
 */
export function buildOllamaChatPayload({
  messages,
  stream = false,
  format,
  options = {},
  model = DEFAULT_MODEL,
}) {
  const payload = {
    model,
    messages,
    stream,
  };

  if (typeof format !== 'undefined') {
    payload.format = format;
  }

  if (Object.keys(options).length > 0) {
    payload.options = options;
  }

  return payload;
}
