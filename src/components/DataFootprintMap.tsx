import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NEON } from './UI';
import { Shield, Server, Database, Globe, User, Cloud } from 'lucide-react';

export interface DataNode {
  id: string;
  label: string;
  type: 'core' | 'broker' | 'breach' | 'social';
  status: 'safe' | 'exposed' | 'resolving';
}

interface DataFootprintMapProps {
  nodes: DataNode[];
}

export const DataFootprintMap: React.FC<DataFootprintMapProps> = ({ nodes }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const coreNode = nodes.find(n => n.type === 'core') || { id: 'core', label: 'IDENTITY', type: 'core', status: 'safe' };
  const satelliteNodes = nodes.filter(n => n.type !== 'core');

  const getIcon = (type: string) => {
    switch (type) {
      case 'core': return <User size={24} />;
      case 'broker': return <Database size={16} />;
      case 'breach': return <Server size={16} />;
      case 'social': return <Globe size={16} />;
      default: return <Cloud size={16} />;
    }
  };

  const getColor = (status: string) => {
    switch (status) {
      case 'safe': return NEON.blue;
      case 'exposed': return NEON.magenta;
      case 'resolving': return NEON.orange;
      default: return NEON.textMuted;
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '300px',
      background: 'rgba(8, 18, 40, 0.4)',
      borderRadius: 12,
      border: `1px solid rgba(0,212,255,0.15)`,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 24
    }}>
      {/* Central Identity Node */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{
          position: 'absolute',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `rgba(0, 212, 255, 0.1)`,
          border: `2px solid ${NEON.blue}`,
          boxShadow: `0 0 20px ${NEON.blue}66`,
          borderRadius: '50%',
          width: 80,
          height: 80,
          color: NEON.blue
        }}
      >
        {getIcon('core')}
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: '0.6rem', marginTop: 4, fontWeight: 'bold' }}>
          {coreNode.label}
        </span>
      </motion.div>

      {/* Satellite Nodes */}
      {satelliteNodes.map((node, i) => {
        const angle = (i / satelliteNodes.length) * 2 * Math.PI;
        const radius = 100; // Distance from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const color = getColor(node.status);

        return (
          <React.Fragment key={node.id}>
            {/* Connecting Line */}
            <motion.svg
              style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + (i * 0.1) }}
            >
              <line
                x1="50%"
                y1="50%"
                x2={`calc(50% + ${x}px)`}
                y2={`calc(50% + ${y}px)`}
                stroke={color}
                strokeWidth="1"
                strokeDasharray={node.status === 'resolving' ? "4 4" : "0"}
                opacity={0.4}
              />
            </motion.svg>

            {/* Satellite Node */}
            <motion.div
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, x, y }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: `rgba(8, 18, 40, 0.8)`,
                border: `1px solid ${color}`,
                boxShadow: `0 0 10px ${color}44`,
                borderRadius: '50%',
                width: 48,
                height: 48,
                color: color,
                zIndex: 5
              }}
            >
              {getIcon(node.type)}
              <div style={{
                position: 'absolute',
                top: 52,
                fontFamily: "'Share Tech Mono'",
                fontSize: '0.6rem',
                color: NEON.text,
                whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.5)',
                padding: '2px 4px',
                borderRadius: 4
              }}>
                {node.label}
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
