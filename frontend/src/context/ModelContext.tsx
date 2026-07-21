import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface ModelInfo {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: Model['details'];
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress: number;
}

interface ModelContextType {
  models: ModelInfo[];
  availableModels: ModelInfo[];
  isLoading: boolean;
  error: Error | null;
  fetchModels: () => Promise<void>;
  fetchAvailableModels: () => Promise<void>;
  pullModel: (name: string) => Promise<void>;
  deleteModel: (name: string) => Promise<void>;
  getModelInfo: (name: string) => ModelInfo | undefined;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const AVAILABLE_MODELS = [
  { name: 'llama3.2:3b', size: '2.0 GB', description: 'Fast 3B parameter model' },
  { name: 'llama3.2:1b', size: '1.3 GB', description: 'Ultra-fast 1B parameter model' },
  { name: 'gemma2:2b', size: '1.6 GB', description: 'Google\'s efficient 2B model' },
  { name: 'gemma2:9b', size: '5.5 GB', description: 'Google\'s capable 9B model' },
  { name: 'phi3.5:3.8b', size: '2.3 GB', description: 'Microsoft\'s small language model' },
  { name: 'phi3.5:14b', size: '8.2 GB', description: 'Microsoft\'s larger Phi model' },
  { name: 'qwen2.5:3b', size: '2.0 GB', description: 'Alibaba\'s multilingual 3B model' },
  { name: 'qwen2.5:7b', size: '4.7 GB', description: 'Alibaba\'s capable 7B model' },
  { name: 'mistral:7b', size: '4.1 GB', description: 'Mistral AI\'s 7B model' },
  { name: 'codellama:7b', size: '3.8 GB', description: 'Code-specialized Llama model' },
  { name: 'deepseek-coder:6.7b', size: '3.8 GB', description: 'DeepSeek code model' },
  { name: 'nomic-embed-text', size: '274 MB', description: 'Embedding model for RAG' },
];

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      const modelInfos: ModelInfo[] = (data.models || []).map((m: Model) => ({
        ...m,
        isDownloaded: true,
        isDownloading: false,
        downloadProgress: 100,
      }));
      setModels(modelInfos);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch models:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAvailableModels = useCallback(async () => {
    try {
      const modelInfos: ModelInfo[] = AVAILABLE_MODELS.map(m => ({
        name: m.name,
        model: m.name,
        modified_at: new Date().toISOString(),
        size: parseSize(m.size),
        digest: '',
        details: {
          parent_model: '',
          format: 'gguf',
          family: m.name.split(':')[0],
          families: [m.name.split(':')[0]],
          parameter_size: m.name.includes(':') ? m.name.split(':')[1] : 'unknown',
          quantization_level: 'Q4_K_M',
        },
        isDownloaded: models.some(lm => lm.name === m.name),
        isDownloading: false,
        downloadProgress: 0,
      }));
      setAvailableModels(modelInfos);
    } catch (err) {
      console.error('Failed to fetch available models:', err);
    }
  }, [models]);

  const pullModel = useCallback(async (name: string) => {
    setModels(prev => prev.map(m => m.name === name ? { ...m, isDownloading: true, downloadProgress: 0 } : m));
    setAvailableModels(prev => prev.map(m => m.name === name ? { ...m, isDownloading: true, downloadProgress: 0 } : m));

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stream: true }),
      });

      if (!response.ok) throw new Error('Failed to pull model');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status === 'downloading' && data.total && data.completed) {
              const progress = Math.round((data.completed / data.total) * 100);
              setModels(prev => prev.map(m => m.name === name ? { ...m, downloadProgress: progress } : m));
              setAvailableModels(prev => prev.map(m => m.name === name ? { ...m, downloadProgress: progress } : m));
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      await fetchModels();
      await fetchAvailableModels();
    } catch (err) {
      setError(err as Error);
      setModels(prev => prev.map(m => m.name === name ? { ...m, isDownloading: false, downloadProgress: 0 } : m));
      setAvailableModels(prev => prev.map(m => m.name === name ? { ...m, isDownloading: false, downloadProgress: 0 } : m));
      throw err;
    }
  }, [fetchModels, fetchAvailableModels]);

  const deleteModel = useCallback(async (name: string) => {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to delete model');
      await fetchModels();
      await fetchAvailableModels();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [fetchModels, fetchAvailableModels]);

  const getModelInfo = useCallback((name: string) => {
    return models.find(m => m.name === name) || availableModels.find(m => m.name === name);
  }, [models, availableModels]);

  useEffect(() => {
    fetchModels();
    fetchAvailableModels();
  }, [fetchModels, fetchAvailableModels]);

  return (
    <ModelContext.Provider value={{
      models,
      availableModels,
      isLoading,
      error,
      fetchModels,
      fetchAvailableModels,
      pullModel,
      deleteModel,
      getModelInfo,
    }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModels() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModels must be used within a ModelProvider');
  }
  return context;
}

function parseSize(size: string): number {
  const match = size.match(/^([\d.]+)\s*(GB|MB|KB)$/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
  case 'GB': return value * 1024 * 1024 * 1024;
  case 'MB': return value * 1024 * 1024;
  case 'KB': return value * 1024;
  default: return 0;
  }
}