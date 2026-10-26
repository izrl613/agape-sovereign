import React, { useState } from 'react';
import { MODULE_REGISTRY } from '../module-registry';
import { MODULE_CONFIGS } from '../module-config';
import { ZkFooter } from './ZkFooter';

interface ModuleInterfaceProps {
  moduleId: string;
  onSubmit: (data: any[]) => void;
  /** Returns to the dashboard without collecting the vector. */
  onBack?: () => void;
}

export const ModuleInterface: React.FC<ModuleInterfaceProps> = ({ moduleId, onSubmit, onBack }) => {
  const registryModule = MODULE_REGISTRY[moduleId];
  // One registry vector has no bespoke config; synthesise one from the registry
  // so every card on the dashboard opens a working module instead of an error.
  const config =
    MODULE_CONFIGS[moduleId] ??
    (registryModule
      ? {
          id: moduleId,
          name: registryModule.name,
          thematicHook: registryModule.description,
          splash: {
            headline: registryModule.name,
            narrative: registryModule.description,
            privacyPledge:
              'Values are encrypted client-side with a per-module key before they leave your device.',
          },
          dataFields: registryModule.requiredFields.map((f) => ({
            label: f.label,
            key: f.name,
            type: (f.type === 'select' ? 'select' : f.type === 'email' ? 'text' : 'text') as 'text' | 'select',
            options: f.type === 'select' ? f.examples : undefined,
          })),
        }
      : undefined);

  const BackBar = onBack ? (
    <button
      type="button"
      onClick={onBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 0 14px',
        padding: '7px 14px',
        borderRadius: 7,
        border: '1px solid rgba(0,212,255,0.28)',
        background: 'rgba(0,212,255,0.06)',
        color: '#00D4FF',
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '0.62rem',
        letterSpacing: '0.12em',
        cursor: 'pointer',
      }}
    >
      ← DASHBOARD
    </button>
  ) : null;
  const [view, setView] = useState<'splash' | 'entry'>('splash');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState<any>({});

  if (!registryModule || !config) return <div className="error">Module not found</div>;

  const addAccount = () => {
    if (Object.keys(currentAccount).length === 0) return;
    setAccounts([...accounts, { ...currentAccount, id: Date.now() }]);
    setCurrentAccount({});
  };

  const removeAccount = (id: number) => {
    setAccounts(accounts.filter(acc => acc.id !== id));
  };

  if (view === 'splash') {
    return (
      <div className="sovereign-splash">
        <ZkFooter pageId={`${moduleId}-splash`} />

        <div className="splash-content">
          {BackBar}
          <div className="vector-icon">{config.name[0]}</div>
          <h1 className="splash-headline">{config.splash.headline}</h1>
          <p className="description">{config.splash.narrative}</p>

          <div className="privacy-pledge">
            <span className="pledge-label">Privacy Pledge:</span> {config.splash.privacyPledge}
          </div>

          <button className="begin-btn" onClick={() => setView('entry')}>
            Begin Vectorization
          </button>
        </div>

        <style>{`
          .sovereign-splash {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: radial-gradient(1100px 520px at 50% -10%, rgba(0,212,255,0.10), transparent 65%), #060C1A;
            text-align: center;
            padding: 20px;
          }
          .splash-content {
            max-width: 600px;
            animation: fadeIn 0.8s ease-out;
          }
          .vector-icon {
            font-size: 64px;
            font-weight: bold;
            font-family: 'Orbitron', monospace;
            color: #00D4FF;
            margin-bottom: 20px;
            width: 100px;
            height: 100px;
            line-height: 100px;
            border-radius: 50%;
            background: rgba(0,212,255,0.06);
            border: 1px solid rgba(0,212,255,0.28);
            margin-left: auto;
            margin-right: auto;
            box-shadow: 0 0 40px rgba(0,212,255,0.18);
          }
          .splash-headline {
            font-size: 2.5rem;
            color: #eaf4ff;
            margin-bottom: 20px;
            font-weight: 800;
          }
          .description {
            font-size: 1.05rem;
            color: #8aa0bd;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .privacy-pledge {
            background: rgba(11,18,36,0.85);
            padding: 15px;
            border-radius: 12px;
            font-size: 0.9rem;
            color: #8aa0bd;
            margin-bottom: 40px;
            border: 1px solid rgba(0,212,255,0.16);
            border-left: 4px solid #00D4FF;
            text-align: left;
          }
          .pledge-label {
            font-weight: bold;
            color: #00D4FF;
            display: block;
            margin-bottom: 5px;
          }
          .begin-btn {
            padding: 15px 40px;
            font-size: 1.1rem;
            background: rgba(0,212,255,0.10);
            color: #00D4FF;
            border: 1px solid rgba(0,212,255,0.45);
            border-radius: 30px;
            font-family: 'Orbitron', monospace;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .begin-btn:hover { transform: scale(1.05); }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="sovereign-entry">
      <ZkFooter pageId={`${moduleId}-entry`} />

      <header className="entry-header">
        <h2>{config.name}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button className="back-btn" onClick={onBack} title="Return to the dashboard">
              ← Dashboard
            </button>
          )}
          <button className="back-btn" onClick={() => setView('splash')}>← Info</button>
        </div>
      </header>

      <div className="main-layout">
        <div className="entry-slot">
          <h3 className="slot-title">{config.thematicHook}</h3>
          <div className="input-grid">
            {config.dataFields.map(field => (
              <div key={field.key} className="field-container">
                <label>{field.label}</label>
                {field.type === 'select' ? (
                  <div className="provider-cloud">
                    {field.options?.map(opt => (
                      <div
                        key={opt}
                        className={`provider-chip ${currentAccount[field.key] === opt ? 'active' : ''}`}
                        onClick={() => setCurrentAccount({...currentAccount, [field.key]: opt})}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    value={currentAccount[field.key] || ''}
                    onChange={(e) => setCurrentAccount({...currentAccount, [field.key]: e.target.value})}
                  />
                )}
              </div>
            ))}
          </div>
          <button className="add-btn" onClick={addAccount}>Add to Vector</button>
        </div>

        <div className="identity-feed">
          <h3 className="feed-title">Verified Fragments</h3>
          <div className="feed-container">
            {accounts.length === 0 && <div className="empty-state">No data vectorized yet.</div>}
            {accounts.map(acc => (
              <div key={acc.id} className="identity-card">
                <div className="card-content">
                  {config.dataFields.map(f => (
                    <div key={f.key} className="card-item">
                      <strong className="card-label">{f.label}:</strong> {acc[f.key]}
                    </div>
                  ))}
                </div>
                <button className="remove-btn" onClick={() => removeAccount(acc.id)}>×</button>
              </div>
            ))}
          </div>
          {accounts.length > 0 && (
            <button className="submit-btn" onClick={() => onSubmit(accounts)}>
              Commit to Architect AI
            </button>
          )}
        </div>
      </div>

      <style>{`
        .sovereign-entry {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #060C1A;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .entry-header {
          padding: 20px 40px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0,212,255,0.14);
        }
        .back-btn {
          background: rgba(0,212,255,0.06);
          border: 1px solid rgba(0,212,255,0.3);
          color: #00D4FF;
          padding: 5px 15px;
          border-radius: 15px;
          cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          transition: background 0.2s, border-color 0.2s;
        }
        .back-btn:hover { background: rgba(0,212,255,0.14); border-color: rgba(0,212,255,0.55); }
        .entry-header h2 {
          color: #eaf4ff;
          font-family: 'Orbitron', monospace;
          font-size: 1.35rem;
          letter-spacing: 0.04em;
        }
        .main-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding: 40px;
          flex: 1;
          overflow: hidden;
        }
        .entry-slot {
          background: rgba(11,18,36,0.9);
          padding: 30px;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,212,255,0.12);
        }
        .slot-title {
          font-size: 1rem;
          color: #8aa0bd;
          font-style: italic;
          margin-bottom: 20px;
        }
        .input-grid {
          margin: 20px 0;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        .field-container label {
          display: block;
          font-size: 0.9rem;
          color: #8aa0bd;
          margin-bottom: 10px;
        }
        .field-container input {
          width: 100%;
          padding: 12px;
          background: rgba(6,12,26,0.9);
          color: #eaf4ff;
          border: 1px solid rgba(0,212,255,0.22);
          border-radius: 8px;
          font-size: 1rem;
          font-family: 'Rajdhani', sans-serif;
        }
        .field-container input::placeholder { color: #52708f; }
        .field-container input:focus { outline: none; border-color: rgba(0,212,255,0.6); box-shadow: 0 0 0 2px rgba(0,212,255,0.12); }
        .provider-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .provider-chip {
          color: #8aa0bd;
          padding: 8px 16px;
          border: 1px solid rgba(0,212,255,0.22);
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .provider-chip.active {
          background: rgba(0,212,255,0.16);
          color: #eaf4ff;
          border-color: rgba(0,212,255,0.5);
        }
        .add-btn {
          width: 100%;
          padding: 15px;
          font-family: 'Orbitron', monospace;
          letter-spacing: 0.05em;
          background: rgba(0,212,255,0.14);
          color: #00D4FF;
          border: none;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
        }
        .identity-feed {
          display: flex;
          flex-direction: column;
        }
        .feed-title {
          font-size: 1.1rem;
          color: #eaf4ff;
          margin-bottom: 20px;
        }
        .feed-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding-right: 10px;
        }
        .identity-card {
          background: rgba(11,18,36,0.9);
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(0,212,255,0.12);
          position: relative;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .card-item {
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        .card-label {
          font-weight: 600;
          color: #8aa0bd;
        }
        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #4a6280;
        }
        .remove-btn:hover { color: #e74c3c; }
        .empty-state {
          text-align: center;
          color: #8aa0bd;
          margin-top: 100px;
        }
        .submit-btn {
          margin-top: 20px;
          font-family: 'Orbitron', monospace;
          letter-spacing: 0.05em;
          padding: 20px;
          background: rgba(0,212,255,0.16);
          color: #00D4FF;
          border: none;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

