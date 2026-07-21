import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { useGenkit } from './GenkitContext';
import { useModels } from './ModelContext';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  model?: string;
  metadata?: {
    tokens?: number;
    duration?: number;
    tools?: string[];
    finishReason?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isStreaming: boolean;
  error: Error | null;
  createSession: (model?: string) => ChatSession;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  sendMessage: (content: string, options?: { model?: string; systemPrompt?: string }) => Promise<void>;
  streamMessage: (content: string, options?: { model?: string; systemPrompt?: string; onChunk?: (chunk: string) => void }) => Promise<void>;
  updateSessionTitle: (id: string, title: string) => void;
  clearCurrentSession: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEY = 'local-llm-chat-sessions';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New Chat';
  return firstUser.content.slice(0, 50) + (firstUser.content.length > 50 ? '...' : '');
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { ai, isInitialized } = useGenkit();
  const { models: availableModels } = useModels();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const selectedModel = availableModels[0]?.name || 'llama3.2:3b';

  // Load sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const loaded = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setSessions(loaded);
        if (loaded.length > 0) {
          setCurrentSession(loaded[0]);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createSession = useCallback((model?: string): ChatSession => {
    const session: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      model: model || selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions(prev => [session, ...prev]);
    setCurrentSession(session);
    return session;
  }, [selectedModel]);

  const selectSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSession(session);
    }
  }, [sessions]);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(sessions.find(s => s.id !== id) || null);
    }
  }, [currentSession, sessions]);

  const updateSession = useCallback((id: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s));
    if (currentSession?.id === id) {
      setCurrentSession(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  }, [currentSession]);

  const updateSessionTitle = useCallback((id: string, title: string) => {
    updateSession(id, { title });
  }, [updateSession]);

  const clearCurrentSession = useCallback(() => {
    if (currentSession) {
      updateSession(currentSession.id, { messages: [], title: 'New Chat' });
    }
  }, [currentSession, updateSession]);

  const sendMessage = useCallback(async (
    content: string,
    options?: { model?: string; systemPrompt?: string }
  ) => {
    if (!ai || !isInitialized) {
      throw new Error('Genkit not initialized');
    }

    const session = currentSession || createSession(options?.model);
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      model: options?.model || session.model,
    };

    const updatedMessages = [...session.messages, userMessage];
    updateSession(session.id, { messages: updatedMessages, title: generateTitle(updatedMessages) });

    setIsStreaming(true);
    setError(null);

    try {
      const systemPrompt = options?.systemPrompt || 'You are a helpful AI assistant running locally.';
      const modelName = options?.model || session.model;

      const response = await ai.generate({
        model: `ollama/${modelName}`,
        prompt: content,
        system: systemPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        model: modelName,
        metadata: {
          tokens: response.usage?.totalTokens,
          finishReason: response.finishReason,
        },
      };

      updateSession(session.id, {
        messages: [...updatedMessages, assistantMessage],
        title: generateTitle([...updatedMessages, assistantMessage]),
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsStreaming(false);
    }
  }, [ai, isInitialized, currentSession, createSession, updateSession]);

  const streamMessage = useCallback(async (
    content: string,
    options?: { model?: string; systemPrompt?: string; onChunk?: (chunk: string) => void }
  ) => {
    if (!ai || !isInitialized) {
      throw new Error('Genkit not initialized');
    }

    abortControllerRef.current = new AbortController();
    const session = currentSession || createSession(options?.model);
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
      model: options?.model || session.model,
    };

    const updatedMessages = [...session.messages, userMessage];
    updateSession(session.id, { messages: updatedMessages, title: generateTitle(updatedMessages) });

    setIsStreaming(true);
    setError(null);

    let fullResponse = '';
    let assistantMessageId = generateId();

    try {
      const systemPrompt = options?.systemPrompt || 'You are a helpful AI assistant running locally.';
      const modelName = options?.model || session.model;

      const { stream } = await ai.generateStream({
        model: `ollama/${modelName}`,
        prompt: content,
        system: systemPrompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      });

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        if (chunk.text) {
          fullResponse += chunk.text;
          options?.onChunk?.(chunk.text);
        }
      }

      const finalResponse = await stream;

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        model: modelName,
        metadata: {
          finishReason: 'stop',
        },
      };

      updateSession(session.id, {
        messages: [...updatedMessages, assistantMessage],
        title: generateTitle([...updatedMessages, assistantMessage]),
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err as Error);
        throw err;
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [ai, isInitialized, currentSession, createSession, updateSession]);

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSession,
      isStreaming,
      error,
      createSession,
      selectSession,
      deleteSession,
      sendMessage,
      streamMessage,
      updateSessionTitle,
      clearCurrentSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}