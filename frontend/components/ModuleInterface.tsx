import React, { useState } from 'react';
import { MODULE_REGISTRY, IdentityVectorModule } from '../module-registry';
import { ZkFooter } from './ZkFooter';

interface ModuleInterfaceProps {
  moduleId: string;
  onSubmit: (data: any[]) => void;
}

export const ModuleInterface: React.FC<ModuleInterfaceProps> = ({ moduleId, onSubmit }) => {
  const module = MODULE_REGISTRY[moduleId];
  const [view, setView] = useState<'splash' | 'entry'>('splash');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState<any>({});

  if (!module) return <div className="error">Module not found</div>;

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
          <div className="vector-icon">{module.name[0]}</div>
          <h1>{module.name}</h1>
          <p className="description">{module.description}</p>

          <div className="requirement-grid">
            {module.requiredFields.map(field => (
              <div key={field.name} className="req-card">
                <span className="req-label">{field.label}</span>
                <span className="req-example">{field.examples[0]}</span>
              </div>
            ))}
          </div>

          <button className="begin-btn" onClick={() => setView('entry')}>
            Begin Vectorization
          </button>
        </div>

        <style jsx>{`
          .sovereign-splash {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
            color: #2c3e50;
            margin-bottom: 20px;
            width: 100px;
            height: 100px;
            line-height: 100px;
            border-radius: 50%;
            background: white;
            margin-left: auto;
            margin-right: auto;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }
          .description {
            font-size: 1.2rem;
            color: #555;
            margin-bottom: 40px;
          }
          .requirement-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 40px;
          }
          .req-card {
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .req-label {
            font-size: 0.8rem;
            color: #888;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .req-example {
            font-weight: bold;
            color: #2c3e50;
          }
          .begin-btn {
            padding: 15px 40px;
            font-size: 1.1rem;
            background: #2c3e50;
            color: white;
            border: none;
            border-radius: 30px;
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
        <h2>{module.name}</h2>
        <button className="back-btn" onClick={() => setView('splash')}>← Info</button>
      </header>

      <div className="main-layout">
        {/* Left: The Entry Slot */}
        <div className="entry-slot">
          <h3>Identity Slot</h3>
          <div className="input-grid">
            {module.requiredFields.map(field => (
              <div key={field.name} className="field-container">
                <label>{field.label}</label>
                {field.type === 'select' ? (
                  <div className="provider-cloud">
                    {(module.providers || field.examples).map(opt => (
                      <div
                        key={opt}
                        className={`provider-chip ${currentAccount[field.name] === opt ? 'active' : ''}`}
                        onClick={() => setCurrentAccount({...currentAccount, [field.name]: opt})}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={currentAccount[field.name] || ''}
                    onChange={(e) => setCurrentAccount({...currentAccount, [field.name]: e.target.value})}
                  />
                )}
              </div>
            ))}
          </div>
          <button className="add-btn" onClick={addAccount}>Add to Vector</button>
        </div>

        {/* Right: The Identity Feed */}
        <div className="identity-feed">
          <h3>Verified Fragments</h3>
          <div className="feed-container">
            {accounts.length === 0 && <div className="empty-state">No data vectorized yet.</div>}
            {accounts.map(acc => (
              <div key={acc.id} className="identity-card">
                <div className="card-content">
                  {module.requiredFields.map(f => (
                    <div key={f.name} className="card-item">
                      <strong>{f.label}:</strong> {acc[f.name]}
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

      <style jsx>{`
        .sovereign-entry {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fdfdfd;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .entry-header {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        .back-btn {
          background: none;
          border: 1px solid #ddd;
          padding: 5px 15px;
          border-radius: 15px;
          cursor: pointer;
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
          background: white;
          padding: 30px;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #eee;
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
          color: #888;
          margin-bottom: 10px;
        }
        .field-container input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }
        .provider-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .provider-chip {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .provider-chip.active {
          background: #2c3e50;
          color: white;
          border-color: #2c3e50;
        }
        .add-btn {
          width: 100%;
          padding: 15px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
        }
        .identity-feed {
          display: flex;
          flex-direction: column;
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
          background: #fff;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #eee;
          position: relative;
          animation: slideIn 0.3s ease-out;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .card-item {
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        .remove-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #ccc;
        }
        .remove-btn:hover { color: #e74c3c; }
        .empty-state {
          text-align: center;
          color: #bbb;
          margin-top: 100px;
        }
        .submit-btn {
          margin-top: 20px;
          padding: 20px;
          background: #2ecc71;
          color: white;
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
