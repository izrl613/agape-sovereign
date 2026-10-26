import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find #root element to mount Agape Sovereign Enclave');
}

const preRender = document.getElementById('static-prerender');
if (preRender) {
  preRender.style.display = 'none';
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
