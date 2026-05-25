import React, { useEffect } from 'react';
import { NEON, GRADIENT_BORDER } from '../constants';

export const GlobalStyles: React.FC = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      ::-webkit-scrollbar-thumb { background: ${NEON.blue}; border-radius: 2px; }
      
      @keyframes pulse-border {
        0%,100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes scan-line {
        0% { top: -2px; }
        100% { top: 100%; }
      }
      @keyframes float {
        0%,100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      @keyframes glow-pulse {
        0%,100% { box-shadow: 0 0 8px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.3); }
        33% { box-shadow: 0 0 8px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.3); }
        66% { box-shadow: 0 0 8px ${NEON.orange}, 0 0 20px rgba(255,122,24,0.3); }
      }
      @keyframes slide-in-left {
        from { transform: translateX(-30px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slide-in-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes rotate-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes nuke-flash {
        0%,100% { background: rgba(255,46,159,0.1); }
        50% { background: rgba(255,46,159,0.25); }
      }
      @keyframes knox-pulse {
        0%,100% { background: rgba(0,212,255,0.1); }
        50% { background: rgba(0,212,255,0.2); }
      }
      @keyframes spinner {
        to { transform: rotate(360deg); }
      }
      @keyframes text-glow {
        0%,100% { text-shadow: 0 0 10px ${NEON.magenta}, 0 0 20px rgba(255,46,159,0.5); }
        50% { text-shadow: 0 0 10px ${NEON.blue}, 0 0 20px rgba(0,212,255,0.5); }
      }
      @keyframes data-stream {
        0% { transform: translateY(0); opacity: 1; }
        100% { transform: translateY(-40px); opacity: 0; }
      }
      @keyframes matrix-rain {
        0% { transform: translateY(-100%); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }

      .neon-border {
        position: relative;
      }
      .neon-border::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: ${GRADIENT_BORDER};
        background-size: 200% 200%;
        animation: rotate-gradient 4s linear infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        z-index: 1;
      }
      .pulse-border::before {
        animation: rotate-gradient 3s linear infinite, pulse-border 2s ease-in-out infinite;
      }
      .btn-neon {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        border: none;
        outline: none;
      }
      .btn-neon:hover {
        transform: translateY(-2px);
        animation: glow-pulse 2s infinite;
      }
      .btn-neon::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,46,159,0.15), rgba(0,212,255,0.15));
        opacity: 0;
        transition: opacity 0.3s;
      }
      .btn-neon:hover::after { opacity: 1; }
      
      .module-card {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .module-card:hover {
        transform: translateY(-2px);
        border-color: ${NEON.blue} !important;
        box-shadow: 0 8px 32px rgba(0,212,255,0.2) !important;
      }
      
      .nav-item {
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .nav-item:hover, .nav-item.active {
        background: rgba(0,212,255,0.08);
        border-left: 2px solid ${NEON.blue};
        padding-left: 14px;
      }
      
      .nuked-item { animation: nuke-flash 3s ease-in-out infinite; }
      .knoxed-item { animation: knox-pulse 3s ease-in-out infinite; }
      .chat-bubble { animation: slide-in-up 0.3s ease; }
      .score-ring { filter: drop-shadow(0 0 12px ${NEON.blue}); }
      
      .thinking-dot {
        width: 6px; height: 6px; border-radius: 50%; background: ${NEON.blue};
        animation: pulse-border 0.8s ease-in-out infinite;
      }
      .thinking-dot:nth-child(2) { animation-delay: 0.15s; background: ${NEON.magenta}; }
      .thinking-dot:nth-child(3) { animation-delay: 0.3s; background: ${NEON.orange}; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  return null;
};
