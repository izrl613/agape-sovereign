import { Settings, Cpu, Database, Globe, Moon, Sun, Monitor, Download, Trash2, Info, Key, Shield, Bell, Palette, Layout, Terminal, GitBranch, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'appearance' | 'advanced' | 'about'>('general');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [apiKey, setApiKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, [theme]);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Terminal },
    { id: 'about', label: 'About', icon: Info },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <h2 className="text-xl font-semibold text-surface-100">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <nav className="w-48 border-r border-surface-700 p-4 flex flex-col gap-1 overflow-y-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-primary-500/10 text-primary-400 border-l-2 border-primary-500'
                      : 'text-surface-400 hover:text-surface-100 hover:bg-surface-800/50'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Ollama Connection</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">Ollama Server URL</label>
                      <input
                        type="url"
                        value={ollamaUrl}
                        onChange={e => setOllamaUrl(e.target.value)}
                        className="input"
                        placeholder="http://localhost:11434"
                      />
                      <p className="text-xs text-surface-500 mt-1">Default: http://localhost:11434</p>
                    </div>
                    <button onClick={async () => { const res = await fetch(`${ollamaUrl}/api/tags`); alert(res.ok ? 'Connected!' : 'Failed to connect'); }} className="btn-secondary">
                      <RefreshCw className="w-4 h-4 mr-2" /> Test Connection
                    </button>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Chat Behavior</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Auto-scroll to new messages</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={showTimestamps} onChange={e => setShowTimestamps(e.target.checked)} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Show message timestamps</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Compact mode (smaller spacing)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={notifications} onChange={e => setNotifications(e.target.checked)} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Desktop notifications</span>
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Data & Privacy</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={autoUpdate} onChange={e => setAutoUpdate(e.target.checked)} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Auto-check for app updates</span>
                    </label>
                    <button className="btn-secondary w-full justify-start text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Chat History
                    </button>
                    <button className="btn-secondary w-full justify-start">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-6">
                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Model Management</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Auto-load last used model</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={false} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Preload model on startup</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Show model size warnings</span>
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Default Parameters</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">Temperature <span className="text-primary-400">0.7</span></label>
                      <input type="range" min="0" max="2" step="0.1" value={0.7} className="w-full accent-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">Top P <span className="text-primary-400">0.9</span></label>
                      <input type="range" min="0" max="1" step="0.05" value={0.9} className="w-full accent-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">Max Tokens <span className="text-primary-400">4096</span></label>
                      <input type="range" min="100" max="8192" step="100" value={4096} className="w-full accent-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">Top K <span className="text-primary-400">40</span></label>
                      <input type="range" min="1" max="100" step="1" value={40} className="w-full accent-primary-500" />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Theme</h3>
                  <div className="grid gap-3 grid-cols-3">
                    {['light', 'dark', 'system'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTheme(t as any)}
                        className={clsx(
                          'p-4 rounded-xl border-2 transition-all text-center',
                          theme === t
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-surface-700 hover:border-surface-600'
                        )}
                      >
                        <div className={clsx('w-10 h-10 rounded-lg mx-auto mb-2', t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-surface-900' : 'bg-gradient-to-r from-white to-surface-900')} />
                        <div className="font-medium text-surface-100 capitalize">{t}</div>
                        <div className="text-xs text-surface-500 mt-1">{t === 'system' ? 'Follows OS' : t === 'dark' ? 'Always dark' : 'Always light'}</div>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Layout</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={compactMode} onChange={e => setCompactMode(e.target.checked)} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Compact sidebar</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Show model badges on messages</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Syntax highlighting in code blocks</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Markdown rendering</span>
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Accent Color</h3>
                  <div className="flex gap-3 flex-wrap">
                    {['primary', 'accent', 'emerald', 'amber', 'violet', 'rose'].map(c => (
                      <button
                        key={c}
                        className={clsx(
                          'w-10 h-10 rounded-lg border-2 transition-all',
                          theme === 'dark' ? 'border-surface-600' : 'border-surface-200'
                        )}
                        style={{ backgroundColor: `var(--color-${c}-500)` }}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Developer Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={false} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Enable debug logging</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Show token counts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={false} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Enable experimental features</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={true} className="w-4 h-4 accent-primary-500 rounded border-surface-600" />
                      <span className="text-surface-100">Offline-first mode (PWA)</span>
                    </label>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">API Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">API Key (for remote models)</label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="input"
                        placeholder="Enter API key..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-surface-400 mb-2">Custom Headers (JSON)</label>
                      <textarea className="input font-mono text-sm min-h-[100px]" placeholder='{"Authorization": "Bearer ..."}' />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Danger Zone</h3>
                  <div className="space-y-3">
                    <button className="btn-danger w-full justify-start">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset All Settings
                    </button>
                    <button className="btn-danger w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      Clear Local Storage
                    </button>
                    <button className="btn-danger w-full justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset to Defaults
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <section className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                    <Cpu className="w-10 h-10 text-primary-500" />
                  </div>
                  <h3 className="text-2xl font-light text-surface-100">Local LLM PWA</h3>
                  <p className="text-surface-500 mt-1">Version 1.0.0</p>
                  <p className="text-surface-500 text-sm mt-2">Open-source local AI chat application</p>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Features</h3>
                  <ul className="space-y-2">
                    {[
                      '🤖 Local LLM inference via Ollama',
                      '💬 Streaming chat with markdown support',
                      '📱 PWA - Installable, works offline',
                      '🔒 Zero cloud dependencies - your data stays local',
                      '🎨 Dark/Light/System themes',
                      '⚡ VS Code extension integration',
                      '🔧 Model management UI',
                      '💾 Persistent chat history',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-surface-300">
                        <span className="w-2 h-2 rounded-full bg-primary-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="font-medium text-surface-100 mb-4">Links</h3>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                      <GitBranch className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
                    <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                      <Globe className="w-4 h-4 mr-2" />
                      Ollama
                    </a>
                    <a href="https://github.com/genkit-ai/genkit" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Genkit
                    </a>
                  </div>
                </section>

                <section className="pt-6 border-t border-surface-700">
                  <p className="text-center text-surface-500 text-sm">
                    Built with React, TypeScript, Vite, Tailwind CSS, Genkit, and Ollama
                  </p>
                  <p className="text-center text-surface-500 text-sm mt-1">
                    MIT License - Free for personal and commercial use
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}