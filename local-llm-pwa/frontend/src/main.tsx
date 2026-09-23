import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GenkitProvider } from './context/GenkitContext';
import { ModelProvider } from './context/ModelContext';
import { ChatProvider } from './context/ChatContext';
import { UIProvider } from './context/UIContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GenkitProvider>
        <ModelProvider>
          <ChatProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </ChatProvider>
        </ModelProvider>
      </GenkitProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}