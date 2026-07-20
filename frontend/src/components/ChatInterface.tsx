import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, StopCircle, Copy, Check, Loader2, Bot, User, Settings, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Sparkles, MessageSquare, FileText, Code, Image, Mic, MicOff } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useModels } from '../context/ModelContext';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface MessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    model?: string;
    metadata?: any;
  };
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

function Message({ message, isStreaming, onCopy, onRegenerate, onEdit }: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
          <Bot className="w-4 h-4" />
        </div>
      )}
      <div className={clsx(
        'flex-1 max-w-[85%]',
        isUser ? 'text-right' : 'text-left'
      )}>
        <div
          className={clsx(
            'relative px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-primary-600 text-white rounded-br-md'
              : 'bg-surface-800 text-surface-100 rounded-bl-md border border-surface-700'
          )}
        >
          <div className="prose prose-invert dark:prose-dark max-w-none">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          {isStreaming && (
            <span className="absolute bottom-1 right-2 text-xs text-surface-400 animate-pulse-soft">
              <Loader2 className="w-3 h-3 inline" />
            </span>
          )}
        </div>
        <div className={clsx('flex items-center gap-2 mt-1 text-xs text-surface-500', isUser ? 'justify-end' : 'justify-start')}>
          <span>{formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
          {message.model && <span className="px-1.5 py-0.5 bg-surface-700 rounded text-surface-400">{message.model}</span>}
          {message.metadata?.tokens && (
            <span className="px-1.5 py-0.5 bg-surface-700 rounded text-surface-400">
              {message.metadata.tokens} tokens
            </span>
          )}
        </div>
        {showActions && (
          <div className={clsx('flex items-center gap-1 mt-1 opacity-0 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
            <button onClick={onCopy} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-100 transition-colors" title="Copy">
              <Copy className="w-4 h-4" />
            </button>
            {message.role === 'assistant' && onRegenerate && (
              <button onClick={onRegenerate} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-100 transition-colors" title="Regenerate">
                <Loader2 className="w-4 h-4" />
              </button>
            )}
            {message.role === 'user' && onEdit && (
              <button onClick={onEdit} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-100 transition-colors" title="Edit">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-surface-300">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
  model: string;
  onModelChange: (model: string) => void;
  availableModels: string[];
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  showSystemPrompt: boolean;
  onToggleSystemPrompt: () => void;
}

function ChatInput({
  onSend,
  isStreaming,
  disabled,
  model,
  onModelChange,
  availableModels,
  systemPrompt,
  onSystemPromptChange,
  showSystemPrompt,
  onToggleSystemPrompt,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isStreaming || disabled) return;
    onSend(message.trim());
    setMessage('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="border-t border-surface-700 p-4 bg-surface-950/50 backdrop-blur-sm">
      {showSystemPrompt && (
        <div className="mb-3 p-3 bg-surface-800/50 rounded-lg border border-surface-700">
          <label className="block text-xs text-surface-500 mb-1">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
            placeholder="System prompt (optional)..."
            className="w-full bg-transparent border-none resize-none text-sm text-surface-100 placeholder-surface-500 focus:outline-none min-h-[60px] max-h-[120px]"
            rows={2}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-surface-800 border border-surface-600 rounded-lg px-2 py-1 text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
            disabled={isStreaming || disabled}
          >
            {availableModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            onClick={adjustHeight}
            placeholder="Message..."
            disabled={isStreaming || disabled}
            className="w-full px-10 py-3 pr-12 bg-surface-800 border border-surface-600 rounded-xl text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[52px] max-h-[200px] font-mono text-sm"
            rows={1}
            style={{ paddingLeft: '80px' }}
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onToggleSystemPrompt}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              showSystemPrompt
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
            )}
            title={showSystemPrompt ? 'Hide system prompt' : 'Show system prompt'}
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!message.trim() || isStreaming || disabled}
            className={clsx(
              'p-3 rounded-xl transition-all duration-200 flex items-center justify-center',
              isStreaming
                ? 'bg-red-500/20 text-red-400'
                : 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isStreaming ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ChatInterface() {
  const {
    currentSession,
    messages,
    isStreaming,
    error,
    sendMessage,
    streamMessage,
    createSession,
    selectSession,
    deleteSession,
    updateSessionTitle,
    clearCurrentSession,
  } = useChat();

  const { models: availableModels } = useModels();
  const [showSessions, setShowSessions] = useState(true);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.name || 'llama3.2:3b');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const modelNames = availableModels.map(m => m.name);

  const handleSend = useCallback(async (content: string) => {
    if (!currentSession) {
      const session = await createSession({ model: selectedModel, systemPrompt });
      selectSession(session.id);
    }
    await streamMessage(content);
  }, [currentSession, createSession, selectSession, streamMessage, selectedModel, systemPrompt]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex > 0 && messages[msgIndex - 1].role === 'user') {
      const userMessage = messages[msgIndex - 1].content;
      await streamMessage(userMessage);
    }
  }, [messages, streamMessage]);

  const handleEdit = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editingMessageId && editContent.trim()) {
      // Implementation would update the message and regenerate response
      setEditingMessageId(null);
      setEditContent('');
    }
  }, [editingMessageId, editContent]);

  const handleNewChat = () => {
    clearCurrentSession();
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary-500" />
        </div>
        <h1 className="text-3xl font-light text-surface-100 mb-2">Welcome to Local LLM</h1>
        <p className="text-surface-500 mb-8 max-w-md">
          Start a new conversation with your local AI models. All processing happens on your device - no cloud required.
        </p>
        <button
          onClick={handleNewChat}
          className="btn-primary px-8 py-3 text-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Chat
        </button>
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-surface-500">
          <span className="flex items-center gap-1">
            <Bot className="w-4 h-4" />
            Model: {selectedModel}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Offline Ready
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-surface-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Message
              key={message.id}
              message={message}
              isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
              onCopy={() => navigator.clipboard.writeText(message.content)}
              onRegenerate={message.role === 'assistant' ? () => handleRegenerate(message.id) : undefined}
              onEdit={message.role === 'user' ? () => handleEdit(message.id, message.content) : undefined}
            />
          ))
        )}
        {error && (
          <div className="text-center text-red-400 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            Error: {error.message}
          </div>
        )}
      </div>

      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        model={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={modelNames}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        showSystemPrompt={showSystemPrompt}
        onToggleSystemPrompt={() => setShowSystemPrompt(!showSystemPrompt)}
      />
    </div>
  );
}