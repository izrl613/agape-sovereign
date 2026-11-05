import React from 'react';

/**
 * Global Styles for the Sovereign Enclave.
 * Implements the Zero-Grey mandate and the animated neon triad borders.
 */
export const GlobalStyles = () => (
  <style jsx global>{`
    body {
      background-color: #0B1020;
      color: #F8FAFC;
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }

    /* The signature neon triad gradient border */
    .sovereign-border {
      position: relative;
      border: 2px solid transparent;
      background: linear-gradient(#111830, #111830) padding-box,
                  linear-gradient(
                    45deg, 
                    #FF2E9F, 
                    #00D4FF, 
                    #FF7A18, 
                    #FF2E9F
                  ) border-box;
      background-size: 200% 200%;
      animation: gradient-shift 5s linear infinite;
      border-radius: 8px;
    }

    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }

    /* NUKED State: Pulsing Magenta and Orange */
    .state-nuked {
      border: 2px solid transparent;
      background: linear-gradient(#111830, #111830) padding-box,
                  linear-gradient(
                    45deg, 
                    #FF2E9F, 
                    #FF7A18, 
                    #FF2E9F, 
                    #FF7A18
                  ) border-box;
      animation: neon-pulse 2s infinite ease-in-out;
    }

    @keyframes neon-pulse {
      0%, 100% { filter: brightness(1) drop-shadow(0 0 2px #FF2E9F); }
      50% { filter: brightness(1.5) drop-shadow(0 0 10px #FF7A18); }
    }

    /* KNOXED State: Steady Electric Blue glow */
    .state-knoxed {
      border: 2px solid #00D4FF;
      box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
      filter: drop-shadow(0 0 5px #00D4FF);
    }

    .ice-white-text {
      color: #F8FAFC;
    }

    .cyan-text {
      color: rgba(0, 212, 255, 0.9);
    }
  `}</style>
);
