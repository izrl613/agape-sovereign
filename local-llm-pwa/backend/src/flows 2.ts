import { z } from 'genkit';
import { ai } from './genkit.js';

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })),
      model: z.string().optional().default('llama3.2:3b'),
      temperature: z.number().min(0).max(2).optional().default(0.7),
      maxTokens: z.number().optional().default(2048),
      stream: z.boolean().optional().default(true),
    }),
    outputSchema: z.object({
      message: z.object({
        role: z.literal('assistant'),
        content: z.string(),
      }),
      usage: z.object({
        promptTokens: z.number(),
        completionTokens: z.number(),
        totalTokens: z.number(),
      }).optional(),
    }),
  },
  async (input) => {
    const { messages, model, temperature, maxTokens, stream } = input;

    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await ai.generate({
      model: ai.model(model),
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage.content }] : []),
        ...chatMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: [{ text: m.content }],
        })),
      ],
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      },
      stream,
    });

    let fullContent = '';
    for await (const chunk of response.stream) {
      fullContent += chunk.text;
    }

    return {
      message: {
        role: 'assistant' as const,
        content: fullContent,
      },
      usage: response.usage,
    };
  }
);

export const streamChatFlow = ai.defineFlow(
  {
    name: 'streamChatFlow',
    inputSchema: z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })),
      model: z.string().optional().default('llama3.2:3b'),
      temperature: z.number().min(0).max(2).optional().default(0.7),
      maxTokens: z.number().optional().default(2048),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    const { messages, model, temperature, maxTokens } = input;

    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await ai.generate({
      model: ai.model(model),
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage.content }] : []),
        ...chatMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: [{ text: m.content }],
        })),
      ],
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      },
      stream: true,
    });

    return response.stream;
  }
);

export const listModelsFlow = ai.defineFlow(
  {
    name: 'listModelsFlow',
    inputSchema: z.void(),
    outputSchema: z.array(z.object({
      name: z.string(),
      type: z.enum(['generation', 'embedding']),
      size: z.string().optional(),
      modified: z.string().optional(),
    })),
  },
  async () => {
    const ollamaPlugin = ai.plugins.find(p => p.name === 'ollama');
    if (!ollamaPlugin) {
      return [];
    }
    try {
      const models = await ollamaPlugin.listModels();
      return models.map(m => ({
        name: m.name,
        type: m.type,
        size: m.size ? `${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB` : undefined,
        modified: m.modified_at,
      }));
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }
);

export const pullModelFlow = ai.defineFlow(
  {
    name: 'pullModelFlow',
    inputSchema: z.object({
      name: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    const ollamaPlugin = ai.plugins.find(p => p.name === 'ollama');
    if (!ollamaPlugin) {
      return { success: false, message: 'Ollama plugin not available' };
    }
    try {
      await ollamaPlugin.pullModel(input.name);
      return { success: true, message: `Model ${input.name} pulled successfully` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to pull model' };
    }
  }
);

export const deleteModelFlow = ai.defineFlow(
  {
    name: 'deleteModelFlow',
    inputSchema: z.object({
      name: z.string(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (input) => {
    const ollamaPlugin = ai.plugins.find(p => p.name === 'ollama');
    if (!ollamaPlugin) {
      return { success: false, message: 'Ollama plugin not available' };
    }
    try {
      await ollamaPlugin.deleteModel(input.name);
      return { success: true, message: `Model ${input.name} deleted successfully` };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to delete model' };
    }
  }
);

export const embedFlow = ai.defineFlow(
  {
    name: 'embedFlow',
    inputSchema: z.object({
      texts: z.array(z.string()),
      model: z.string().optional().default('nomic-embed-text'),
    }),
    outputSchema: z.object({
      embeddings: z.array(z.array(z.number())),
    }),
  },
  async (input) => {
    const embedder = ai.embedder(input.model);
    const result = await embedder(input.texts);
    return { embeddings: result.embeddings };
  }
);

export const healthCheckFlow = ai.defineFlow(
  {
    name: 'healthCheckFlow',
    inputSchema: z.void(),
    outputSchema: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      ollama: z.boolean(),
      models: z.number(),
      timestamp: z.string(),
    }),
  },
  async () => {
    const ollamaPlugin = ai.plugins.find(p => p.name === 'ollama');
    let ollamaHealthy = false;
    let modelCount = 0;

    if (ollamaPlugin) {
      try {
        const models = await ollamaPlugin.listModels();
        ollamaHealthy = true;
        modelCount = models.length;
      } catch {
        ollamaHealthy = false;
      }
    }

    return {
      status: ollamaHealthy ? 'healthy' : 'unhealthy',
      ollama: ollamaHealthy,
      models: modelCount,
      timestamp: new Date().toISOString(),
    };
  }
);