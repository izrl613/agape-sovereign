import React, { useState, useEffect } from 'react';
import { Shield, Fingerprint, Activity, MapPin, Users, Briefcase, GraduationCap, ShoppingBag, Smartphone, Brain, BookOpen, Scale, Clock, Dna, CreditCard, Trash2, Lock } from 'lucide-react';
import { IdentityVector } from './types';
import { EncryptionAgent } from './EncryptionAgent';
import { RetentionModuleAgent } from './RetentionModule';
import { BiometricAgent } from './agents/BiometricAgent';
import { LocationAgent } from './agents/LocationAgent';
import { PrivacyAgent } from './agents/PrivacyAgent';
import './IdentityVectorsDashboard.css';

const VECTORS: IdentityVector[] = [
  { id: 'v1', name: 'BiometricVector', description: 'Fingerprint, facial, and voice hash encryption.', encryptionLevel: 'Quantum-Resistant', status: 'Idle', agentId: 'agent_bio', icon: 'Fingerprint' },
  { id: 'v2', name: 'GenomicVector', description: 'DNA/RNA sequence data privacy preservation.', encryptionLevel: 'Quantum-Resistant', status: 'Idle', agentId: 'agent_geno', icon: 'Dna' },
  { id: 'v3', name: 'PrivacyVector', description: 'Optery‑style privacy retention & data erasure.', encryptionLevel: 'High', status: 'Idle', agentId: 'agent_privacy', icon: 'Trash2' },
  { id: 'v4', name: 'HealthVector', description: 'Medical records and vitals encryption.', encryptionLevel: 'High', status: 'Idle', agentId: 'agent_health', icon: 'Activity' },
  { id: 'v5', name: 'PsychometricVector', description: 'Personality profiles and sentiment logs.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_psy', icon: 'Brain' },
  { id: 'v6', name: 'LocationVector', description: 'Spatial-temporal coordinates and geofencing.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_loc', icon: 'MapPin' },
  { id: 'v7', name: 'SocialVector', description: 'Relationships, graph data, and trust webs.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_soc', icon: 'Users' },
  { id: 'v8', name: 'ProfessionalVector', description: 'Career history and reputation scores.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_prof', icon: 'Briefcase' },
  { id: 'v9', name: 'EducationalVector', description: 'Academic records and certifications.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_edu', icon: 'GraduationCap' },
  { id: 'v10', name: 'ConsumptionVector', description: 'Purchase history and resource footprint.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_con', icon: 'ShoppingBag' },
  { id: 'v11', name: 'DeviceVector', description: 'Hardware identifiers and IoT data.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_dev', icon: 'Smartphone' },
  { id: 'v12', name: 'CognitiveVector', description: 'Attention spans and learning styles.', encryptionLevel: 'High', status: 'Idle', agentId: 'agent_cog', icon: 'Brain' },
  { id: 'v13', name: 'BeliefVector', description: 'Philosophical and political leanings.', encryptionLevel: 'Quantum-Resistant', status: 'Idle', agentId: 'agent_belief', icon: 'BookOpen' },
  { id: 'v14', name: 'LegalVector', description: 'Contracts, rights, and digital signatures.', encryptionLevel: 'High', status: 'Idle', agentId: 'agent_legal', icon: 'Scale' },
  { id: 'v15', name: 'TemporalVector', description: 'Time-series anomalies and milestones.', encryptionLevel: 'Standard', status: 'Idle', agentId: 'agent_temp', icon: 'Clock' },
  { id: 'v16', name: 'RetentionVector', description: 'Advanced privacy retention, active footprint erasure.', encryptionLevel: 'Quantum-Resistant', status: 'Idle', agentId: 'agent_retention_omega', icon: 'Trash2' },
];

const iconMap: Record<string, React.ReactNode> = {
  Fingerprint: <Fingerprint size={24} />,
  Dna: <Dna size={24} />,
  CreditCard: <CreditCard size={24} />,
  Activity: <Activity size={24} />,
  MapPin: <MapPin size={24} />,
  Users: <Users size={24} />,
  Briefcase: <Briefcase size={24} />,
  GraduationCap: <GraduationCap size={24} />,
  ShoppingBag: <ShoppingBag size={24} />,
  Smartphone: <Smartphone size={24} />,
  Brain: <Brain size={24} />,
  BookOpen: <BookOpen size={24} />,
  Scale: <Scale size={24} />,
  Clock: <Clock size={24} />,
  Trash2: <Trash2 size={24} />,
  Shield: <Shield size={24} />
};

export const IdentityVectorsDashboard: React.FC = () => {
  const [vectors, setVectors] = useState<IdentityVector[]>(VECTORS);
  const [selectedVector, setSelectedVector] = useState<IdentityVector | null>(null);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const closePanel = () => setSelectedVector(null);


  const renderSidePanel = () => {
    if (!selectedVector) return null;
    return (
      <div className="side-panel-overlay" onClick={closePanel}>
        <div className="side-panel" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={closePanel}>✕</button>
          <h2>{selectedVector.name}</hh2>
          <p>{selectedVector.description}</p>
          <p><strong>Encryption Level:</strong> {selectedVector.encryptionLevel}</p>
          <button className="action-btn" onClick={() => processVector(selectedVector.id)}>
            Run {selectedVector.name}
          </button>
        </div>
      </div>
    );
  };

  const handleCardClick = (id: string) => {
    const vec = vectors.find(v => v.id === id) || null;
    setSelectedVector(vec);
    processVector(id);
  };
  const addLog = (log: string) => {
    setActiveLogs(prev => [log, ...prev].slice(0, 5));
  };

  const processVector = async (id: string) => {
    setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Processing' } : v));
    const vector = vectors.find(v => v.id === id);
    if (!vector) return;

    if (vector.id === 'v16') {
      const agent = new RetentionModuleAgent();
      addLog(`[RetentionVector] Initiating deep scan...`);
      const result = await agent.scanAndPurge('sovereign_identity_01');
      addLog(`[RetentionVector] Sovereign integrity restored. Brokers purged: ${result.brokersPurged}`);
      setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Purging' } : v));
      setTimeout(() => {
        setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Idle' } : v));
      }, 2000);
    } else {
      let agent = new EncryptionAgent(vector.agentId, vector.name);
      
      if (vector.id === 'v1') agent = new BiometricAgent();
      else if (vector.id === 'v3') agent = new PrivacyAgent();
      else if (vector.id === 'v6') agent = new LocationAgent();

      addLog(`[${vector.name}] Processing data stream...`);
      const encryptedData = await agent.processAndEncrypt({ dummy: 'data' });
      addLog(`[${vector.name}] Payload encrypted: ${encryptedData}`);
      setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Active' } : v));
      setTimeout(() => {
        setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Idle' } : v));
      }, 3000);
    }
  };

  return (
    <div className="iv-dashboard-container">
      <header className="iv-header">
        <div className="iv-header-title">
          <Shield size={36} className="text-cyan" />
          <h1>Sovereign Identity Encryption Matrix</h1>
        </div>
        <p>16-Vector Sub-Agent Data Processing & Privacy Retention</p>
      </header>

      <div className="iv-main-content">
        <div className="iv-grid">
          {vectors.map(vector => (
            <div
              key={vector.id}
              className={`iv-card module-card ${vector.status === 'Processing' || vector.status === 'Purging' ? 'pulse' : ''} ${vector.status === 'Active' ? 'active-border' : ''} ${vector.id === 'v16' ? 'retention-card' : ''}`}
              onClick={() => handleCardClick(vector.id)}
            >
              <div className="iv-card-icon">
                {iconMap[vector.icon] || <Shield size={24} />}
              </div>
              <span className="tooltip">{vector.description}</span>
              <div className="iv-card-content">
                <h3>{vector.name}</h3>
                <p>{vector.description}</p>
              </div>
              <div className="iv-card-footer">
                <span className={`badge ${vector.encryptionLevel.toLowerCase().replace('-', '')}`}>
                  <Lock size={12} style={{marginRight: '4px'}}/>
                  {vector.encryptionLevel}
                </span>
                <span className={`status ${vector.status.toLowerCase()}`}>{vector.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="iv-terminal">
          <h3>Agent Processing Logs</h3>
          <div className="iv-logs">
            {activeLogs.map((log, index) => (
              <div key={index} className="log-entry">&gt; {log}</div>
            ))}
            {activeLogs.length === 0 && <div className="log-entry empty">&gt; Waiting for agent activation...</div>}
          </div>
        </div>
      </div>
      {renderSidePanel()}
    </div>
  );
};
