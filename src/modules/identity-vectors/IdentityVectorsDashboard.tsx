import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Fingerprint, Activity, MapPin, Users, Briefcase,
  GraduationCap, ShoppingBag, Smartphone, Brain, BookOpen,
  Scale, Clock, Dna, Trash2, Lock, ChevronRight,
  ArrowRight, Zap, Eye, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { IdentityVector } from './types';
import { EncryptionAgent } from './EncryptionAgent';
import { RetentionModuleAgent } from './RetentionModule';
import { BiometricAgent } from './agents/BiometricAgent';
import { LocationAgent } from './agents/LocationAgent';
import { PrivacyAgent } from './agents/PrivacyAgent';
import { useAuth } from '../../AuthContext';
import './IdentityVectorsDashboard.css';

const VECTOR_ROUTES: Record<string, string> = {
  v1:  '/dashboard/ai',        v2:  '/dashboard/device',
  v3:  '/dashboard/erasure',   v4:  '/dashboard/medical',
  v5:  '/dashboard/behavioral',v6:  '/dashboard/location',
  v7:  '/dashboard/social',    v8:  '/dashboard/legal',
  v9:  '/dashboard/ai',        v10: '/dashboard/device',
  v11: '/dashboard/iot',       v12: '/dashboard/ai',
  v13: '/dashboard/legal',     v14: '/dashboard/legal',
  v15: '/dashboard/email',     v16: '/dashboard/erasure',
};

const ENC_COLOR: Record<string, string> = {
  'Quantum-Resistant': '#a855f7',
  'High': '#00d4ff',
  'Standard': '#64748b',
};

const STATUS_COLOR: Record<string, string> = {
  Idle: '#64748b', Processing: '#f59e0b', Purging: '#ef4444', Active: '#10b981',
};

const STATUS_LABEL: Record<string, string> = {
  Idle: 'IDLE', Processing: 'RUNNING', Purging: 'PURGING', Active: 'SECURED',
};

const VECTORS: IdentityVector[] = [
  { id:'v1',  name:'BiometricVector',   description:'Fingerprint, facial, and voice hash encryption.',       encryptionLevel:'Quantum-Resistant', status:'Idle', agentId:'agent_bio',             icon:'Fingerprint' },
  { id:'v2',  name:'GenomicVector',     description:'DNA/RNA sequence data privacy preservation.',           encryptionLevel:'Quantum-Resistant', status:'Idle', agentId:'agent_geno',            icon:'Dna' },
  { id:'v3',  name:'PrivacyVector',     description:'Optery-style privacy retention & data erasure.',        encryptionLevel:'High',              status:'Idle', agentId:'agent_privacy',         icon:'Trash2' },
  { id:'v4',  name:'HealthVector',      description:'Medical records and vitals encryption.',                encryptionLevel:'High',              status:'Idle', agentId:'agent_health',          icon:'Activity' },
  { id:'v5',  name:'PsychometricVector',description:'Personality profiles and sentiment logs.',              encryptionLevel:'Standard',          status:'Idle', agentId:'agent_psy',             icon:'Brain' },
  { id:'v6',  name:'LocationVector',    description:'Spatial-temporal coordinates and geofencing.',          encryptionLevel:'Standard',          status:'Idle', agentId:'agent_loc',             icon:'MapPin' },
  { id:'v7',  name:'SocialVector',      description:'Relationships, graph data, and trust webs.',            encryptionLevel:'Standard',          status:'Idle', agentId:'agent_soc',             icon:'Users' },
  { id:'v8',  name:'ProfessionalVector',description:'Career history and reputation scores.',                 encryptionLevel:'Standard',          status:'Idle', agentId:'agent_prof',            icon:'Briefcase' },
  { id:'v9',  name:'EducationalVector', description:'Academic records and certifications.',                  encryptionLevel:'Standard',          status:'Idle', agentId:'agent_edu',             icon:'GraduationCap' },
  { id:'v10', name:'ConsumptionVector', description:'Purchase history and resource footprint.',              encryptionLevel:'Standard',          status:'Idle', agentId:'agent_con',             icon:'ShoppingBag' },
  { id:'v11', name:'DeviceVector',      description:'Hardware identifiers and IoT data.',                    encryptionLevel:'Standard',          status:'Idle', agentId:'agent_dev',             icon:'Smartphone' },
  { id:'v12', name:'CognitiveVector',   description:'Attention spans and learning styles.',                  encryptionLevel:'High',              status:'Idle', agentId:'agent_cog',             icon:'Brain' },
  { id:'v13', name:'BeliefVector',      description:'Philosophical and political leanings.',                 encryptionLevel:'Quantum-Resistant', status:'Idle', agentId:'agent_belief',          icon:'BookOpen' },
  { id:'v14', name:'LegalVector',       description:'Contracts, rights, and digital signatures.',            encryptionLevel:'High',              status:'Idle', agentId:'agent_legal',           icon:'Scale' },
  { id:'v15', name:'TemporalVector',    description:'Time-series anomalies and milestones.',                 encryptionLevel:'Standard',          status:'Idle', agentId:'agent_temp',            icon:'Clock' },
  { id:'v16', name:'RetentionVector',   description:'Advanced privacy retention, active footprint erasure.', encryptionLevel:'Quantum-Resistant', status:'Idle', agentId:'agent_retention_omega', icon:'Trash2' },
];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  Fingerprint, Dna, Activity, MapPin, Users, Briefcase,
  GraduationCap, ShoppingBag, Smartphone, Brain, BookOpen,
  Scale, Clock, Trash2, Shield,
};

export const IdentityVectorsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithPasskey, authType } = useAuth();
  const [vectors, setVectors] = useState<IdentityVector[]>(VECTORS);
  const [selected, setSelected] = useState<IdentityVector>(VECTORS[0]);
  const [logs, setLogs] = useState<string[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);

  const addLog = (msg: string) =>
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));

  const processVector = async (id: string) => {
    if (runningId) return;
    setRunningId(id);
    setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Processing' } : v));
    const vector = vectors.find(v => v.id === id);
    if (!vector) { setRunningId(null); return; }
    try {
      if (vector.id === 'v16') {
        addLog('[RetentionVector] Initiating deep scan...');
        const agent = new RetentionModuleAgent();
        const result = await agent.scanAndPurge('sovereign_identity_01');
        addLog('[RetentionVector] Brokers purged: ' + result.brokersPurged);
        setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Purging' } : v));
        setTimeout(() => setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Idle' } : v)), 2500);
      } else {
        let agent = new EncryptionAgent(vector.agentId, vector.name);
        if (vector.id === 'v1') agent = new BiometricAgent();
        else if (vector.id === 'v3') agent = new PrivacyAgent();
        else if (vector.id === 'v6') agent = new LocationAgent();
        addLog('[' + vector.name + '] Processing data stream...');
        const encrypted = await agent.processAndEncrypt({ dummy: 'data' });
        addLog('[' + vector.name + '] Encrypted: ' + String(encrypted).slice(0, 48) + '...');
        setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Active' } : v));
        setTimeout(() => setVectors(prev => prev.map(v => v.id === id ? { ...v, status: 'Idle' } : v)), 3000);
      }
    } finally {
      setRunningId(null);
    }
  };

  const sel = vectors.find(v => v.id === selected.id) || selected;
  const encColor = ENC_COLOR[sel.encryptionLevel] || '#64748b';
  const IconComp = ICON_MAP[sel.icon] || Shield;

  return (
    <div className="iv2-root">
      {/* ── Sidebar ── */}
      <aside className="iv2-sidebar">
        <div className="iv2-sidebar-header">
          <Shield size={18} className="iv2-header-icon" />
          <div>
            <div className="iv2-sidebar-title">IDENTITY VECTORS</div>
            <div className="iv2-sidebar-sub">SOVEREIGN ENCRYPTION MATRIX</div>
          </div>
        </div>

        <div className="iv2-vector-list">
          {vectors.map(v => {
            const VIcon = ICON_MAP[v.icon] || Shield;
            const isActive = v.id === sel.id;
            const stColor = STATUS_COLOR[v.status] || '#64748b';
            const enc = ENC_COLOR[v.encryptionLevel] || '#64748b';
            return (
              <button
                key={v.id}
                className={'iv2-vector-row' + (isActive ? ' iv2-vector-row--active' : '') + (v.id === 'v16' ? ' iv2-vector-row--retention' : '')}
                onClick={() => setSelected(v)}
              >
                {isActive && <div className="iv2-active-bar" />}
                <div className="iv2-row-icon" style={{ background: enc + '18', borderColor: enc + '35' }}>
                  <VIcon size={13} style={{ color: enc }} />
                </div>
                <div className="iv2-row-labels">
                  <div className="iv2-row-name">{v.name}</div>
                  <div className="iv2-row-sub">{v.id.toUpperCase()} · {v.encryptionLevel}</div>
                </div>
                <div className="iv2-status-dot" style={{ background: stColor, boxShadow: v.status !== 'Idle' ? '0 0 6px ' + stColor : 'none' }} />
                {isActive && <ChevronRight size={11} className="iv2-chevron" />}
              </button>
            );
          })}
        </div>

        <div className="iv2-auth-bar">
          {authType !== 'passkey' ? (
            <button className="iv2-passkey-btn" onClick={async () => {
              const email = window.prompt('Enter your email for Passkey login:');
              if (email) await loginWithPasskey(email);
            }}>
              <Lock size={11} /> BIND PASSKEY
            </button>
          ) : (
            <div className="iv2-auth-secured">
              <CheckCircle2 size={11} /><span>PASSKEY SECURED</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Detail Panel ── */}
      <main className="iv2-detail">
        <div className="iv2-detail-header">
          <div className="iv2-detail-icon" style={{ background: encColor + '15', borderColor: encColor + '35' }}>
            <IconComp size={28} style={{ color: encColor }} />
          </div>
          <div className="iv2-detail-titles">
            <div className="iv2-detail-id">{sel.id.toUpperCase()} · SOVEREIGN VECTOR</div>
            <h2 className="iv2-detail-name">{sel.name}</h2>
            <div className="iv2-detail-enc" style={{ color: encColor, borderColor: encColor + '45', background: encColor + '12' }}>
              <Lock size={10} /> {sel.encryptionLevel}
            </div>
          </div>
        </div>

        <p className="iv2-detail-desc">{sel.description}</p>

        <div className="iv2-stats-row">
          <div className="iv2-stat">
            <div className="iv2-stat-label">STATUS</div>
            <div className="iv2-stat-value" style={{ color: STATUS_COLOR[sel.status] }}>{STATUS_LABEL[sel.status]}</div>
          </div>
          <div className="iv2-stat">
            <div className="iv2-stat-label">ENCRYPTION</div>
            <div className="iv2-stat-value" style={{ color: encColor }}>{sel.encryptionLevel}</div>
          </div>
          <div className="iv2-stat">
            <div className="iv2-stat-label">AGENT ID</div>
            <div className="iv2-stat-value iv2-stat-mono">{sel.agentId}</div>
          </div>
        </div>

        <div className="iv2-actions">
          <button
            className={'iv2-btn iv2-btn--primary' + (runningId === sel.id ? ' iv2-btn--running' : '')}
            onClick={() => processVector(sel.id)}
            disabled={!!runningId}
          >
            {runningId === sel.id
              ? <><RefreshCw size={14} className="iv2-spin" /> PROCESSING…</>
              : <><Zap size={14} /> RUN VECTOR</>}
          </button>
          <button
            className="iv2-btn iv2-btn--secondary"
            onClick={() => navigate(VECTOR_ROUTES[sel.id] || '/dashboard')}
          >
            <Eye size={14} /> VIEW MODULE <ArrowRight size={12} />
          </button>
        </div>

        <div className="iv2-terminal">
          <div className="iv2-terminal-header">
            <span className="iv2-terminal-title">AGENT LOGS</span>
            <div className="iv2-terminal-dots">
              <span style={{ background: '#ef4444' }} /><span style={{ background: '#f59e0b' }} /><span style={{ background: '#10b981' }} />
            </div>
          </div>
          <div className="iv2-terminal-body">
            {logs.length === 0
              ? <div className="iv2-log-empty">{'>'} Waiting for agent activation…</div>
              : logs.map((l, i) => <div key={i} className="iv2-log-line"><span className="iv2-log-prompt">{'>'}</span> {l}</div>)}
          </div>
        </div>

        <div className="iv2-mini-grid">
          {vectors.map(v => {
            const MIcon = ICON_MAP[v.icon] || Shield;
            const c = ENC_COLOR[v.encryptionLevel] || '#64748b';
            const isSel = v.id === sel.id;
            return (
              <button
                key={v.id}
                className={'iv2-mini-card' + (isSel ? ' iv2-mini-card--active' : '')}
                style={{ borderColor: isSel ? c : c + '22' }}
                onClick={() => setSelected(v)}
                title={v.name}
              >
                <MIcon size={11} style={{ color: isSel ? c : '#475569' }} />
                <div className="iv2-mini-label" style={{ color: isSel ? c : '#475569' }}>{v.id.toUpperCase()}</div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
