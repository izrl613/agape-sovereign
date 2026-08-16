import { useState, useEffect } from 'react';
import { Download, Trash2, CheckCircle, AlertCircle, Loader2, Search, Filter, ChevronDown, Info, ExternalLink, Sparkles, Cpu, Database, Globe, ArrowDown, ArrowUp, Minus, Plus } from 'lucide-react';
import { useModels } from '../context/ModelContext';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

export function ModelManager() {
  const {
    models,
    availableModels,
    isLoading,
    error,
    fetchModels,
    pullModel,
    deleteModel,
    getModelInfo,
  } = useModels();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'installed' | 'available'>('all');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  const filteredModels = availableModels
    .filter(m => {
      if (filter === 'installed') return m.isDownloaded;
      if (filter === 'available') return !m.isDownloaded;
      return true;
    })
    .filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.details.family.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handlePull = async (name: string) => {
    setDownloading(prev => new Set(prev).add(name));
    try {
      await pullModel(name);
    } catch (err) {
      console.error('Failed to pull model:', err);
    } finally {
      setDownloading(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteModel(name);
    } catch (err) {
      console.error('Failed to delete model:', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getModelIcon = (family: string) => {
    const icons: Record<string, string> = {
      llama: '🦙',
      gemma: '💎',
      phi: 'Φ',
      qwen: '🐉',
      mistral: '🌬️',
      codellama: '💻',
      deepseek: '🔍',
      nomic: '🔗',
    };
    return icons[family.toLowerCase()] || '🤖';
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-6 border-b border-surface-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-surface-100">Model Manager</h1>
            <p className="text-surface-500 text-sm">Manage your local AI models</p>
          </div>
          <button
            onClick={fetchModels}
            disabled={isLoading}
            className="btn-secondary"
          >
            <Loader2 className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="input pl-10 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">All Models</option>
              <option value="installed">Installed</option>
              <option value="available">Available</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && filteredModels.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-surface-500">
            <Database className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg">No models found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredModels.map(model => {
              const isDownloading = downloading.has(model.name);
              const progress = model.downloadProgress || 0;
              const info = models.find(m => m.name === model.name);

              return (
                <div
                  key={model.name}
                  className={clsx(
                    'card-hover p-4 relative overflow-hidden transition-all duration-300',
                    model.isDownloaded ? 'border-primary-500/20 bg-primary-500/5' : ''
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getModelIcon(model.details.family)}</span>
                      <div>
                        <h3 className="font-medium text-surface-100">{model.name}</h3>
                        <p className="text-xs text-surface-500 capitalize">{model.details.family} family</p>
                      </div>
                    </div>
                    {model.isDownloaded && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Installed
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-surface-400">
                    <div className="flex items-center justify-between">
                      <span>Size</span>
                      <span className="text-surface-100 font-mono">{formatSize(model.size)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Parameters</span>
                      <span className="text-surface-100 font-mono">{model.details.parameter_size}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quantization</span>
                      <span className="text-surface-100 font-mono">{model.details.quantization_level}</span>
                    </div>
                    {info && (
                      <div className="flex items-center justify-between">
                        <span>Modified</span>
                        <span className="text-surface-100 font-mono">{formatDistanceToNow(new Date(info.modified_at), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>

                  {isDownloading && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-400">Downloading...</span>
                        <span className="text-primary-400 font-mono">{progress}%</span>
                      </div>
                      <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!model.isDownloaded && !isDownloading && (
                    <button
                      onClick={() => handlePull(model.name)}
                      className="mt-4 w-full btn-primary"
                      disabled={isDownloading}
                    >
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  )}

                  {model.isDownloaded && !isDownloading && (
                    <button
                      onClick={() => handleDelete(model.name)}
                      className="mt-4 w-full btn-danger"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  )}

                  <button
                    onClick={() => setExpandedModel(expandedModel === model.name ? null : model.name)}
                    className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-surface-500 hover:text-surface-300"
                  >
                    <Info className="w-4 h-4" />
                    {expandedModel === model.name ? 'Hide details' : 'Show details'}
                    <ChevronDown className={clsx('w-4 h-4 transition-transform', expandedModel === model.name && 'rotate-180')} />
                  </button>

                  {expandedModel === model.name && (
                    <div className="mt-3 pt-3 border-t border-surface-700 animate-slide-down space-y-2 text-xs text-surface-500">
                      <div className="grid grid-cols-2 gap-2">
                        <span>Format</span>
                        <span className="text-surface-300 font-mono">{model.details.format}</span>
                        <span>Family</span>
                        <span className="text-surface-300 font-mono">{model.details.family}</span>
                        <span>Digest</span>
                        <span className="text-surface-300 font-mono truncate">{model.digest.slice(0, 16)}...</span>
                      </div>
                      {model.details.families.length > 1 && (
                        <div>
                          <span>Families: </span>
                          <span className="text-surface-300">{model.details.families.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-surface-700 bg-surface-950/50 backdrop-blur-sm">
        <h3 className="font-medium text-surface-100 mb-3">Popular Models</h3>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { name: 'llama3.2:3b', size: '2.0 GB', desc: 'Best balance' },
            { name: 'gemma2:2b', size: '1.6 GB', desc: 'Fast & capable' },
            { name: 'phi3.5:3.8b', size: '2.3 GB', desc: 'Microsoft SLM' },
            { name: 'qwen2.5:3b', size: '2.0 GB', desc: 'Multilingual' },
            { name: 'mistral:7b', size: '4.1 GB', desc: 'High quality' },
          ].map(m => {
            const isInstalled = models.some(lm => lm.name === m.name);
            return (
              <button
                key={m.name}
                onClick={() => handlePull(m.name)}
                disabled={isInstalled || downloading.has(m.name)}
                className={clsx(
                  'p-3 text-left rounded-lg border transition-all duration-200',
                  isInstalled
                    ? 'border-green-500/30 bg-green-500/5 text-surface-100'
                    : 'border-surface-600 hover:border-primary-500/50 bg-surface-800/50 text-surface-300'
                )}
              >
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-surface-500">{m.size} • {m.desc}</div>
                {isInstalled && <CheckCircle className="w-4 h-4 text-green-400 mt-1" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}