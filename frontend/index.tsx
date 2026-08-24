import './vertex-ai-proxy-interceptor.js';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker for offline PWA support
// MCP/Ollama traffic is passed through (never cached) — see public/sw.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('[SW] Registered:', reg.scope))
      .catch((err) => console.warn('[SW] Registration failed:', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
