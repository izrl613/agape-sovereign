import React from 'react';
import { motion } from 'framer-motion';
import { NEON } from './UI';

export const SplashScreen = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(6,13,31,0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(12px)'
  }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: `8px solid ${NEON.blue}`,
        borderTopColor: NEON.magenta,
        boxShadow: `0 0 20px ${NEON.blue}`
      }}
    />
  </div>
);
