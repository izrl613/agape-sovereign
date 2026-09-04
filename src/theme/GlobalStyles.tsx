import { useEffect } from "react";
import { KEYFRAMES } from "./tokens";

export const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { 
        background: #060D1F; 
        color: #E8F4FF; 
        font-family: 'Rajdhani', sans-serif; 
        overflow-x: hidden; 
      }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
      ::-webkit-scrollbar-thumb { background: #00D4FF; border-radius: 2px; }

      ${KEYFRAMES}

      .neon-border {
        position: relative;
      }
      .neon-border::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, #FF2E9F 0%, #00D4FF 50%, #FF7A18 100%);
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
        border-color: #00D4FF !important;
        box-shadow: 0 8px 32px rgba(0,212,255,0.2) !important;
      }
      .nav-item {
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .nav-item:hover, .nav-item.active {
        background: rgba(0,212,255,0.08);
        border-left: 2px solid #00D4FF;
        padding-left: 14px;
      }
      .nuked-item { animation: nuke-flash 3s ease-in-out infinite; }
      .knoxed-item { animation: knox-pulse 3s ease-in-out infinite; }
      .chat-bubble {
        animation: slide-in-up 0.3s ease;
      }
      .score-ring {
        filter: drop-shadow(0 0 12px #00D4FF);
      }
      .thinking-dot {
        width: 6px; height: 6px; border-radius: 50%; background: #00D4FF;
        animation: pulse-border 0.8s ease-in-out infinite;
      }
      .thinking-dot:nth-child(2) { animation-delay: 0.15s; background: #FF2E9F; }
      .thinking-dot:nth-child(3) { animation-delay: 0.3s; background: #FF7A18; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};