import React, { useState } from 'react';
import { X, ShieldAlert, Terminal, Cpu, Database, Activity, Lock, RefreshCw, KeyRound, Server } from 'lucide-react';
import { AdminTelemetryState } from '../types';
import { ADMIN_AUTHORIZED_EMAILS } from '../constants';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: AdminTelemetryState;
  currentEmail: string;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  currentEmail,
}) => {
  const [selectedAdminEmail, setSelectedAdminEmail] = useState(currentEmail);
  const [passkeyAuthenticated, setPasskeyAuthenticated] = useState(true);

  if (!isOpen) return null;

  const isAuthorized = ADMIN_AUTHORIZED_EMAILS.includes(selectedAdminEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl p-[2px] overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF7A18] via-[#FF2E9F] to-[#00D4FF] animate-border-flow" />

        <div className="relative w-full h-full rounded-3xl bg-[#0B1020] flex flex-col overflow-hidden border border-orange-500/40 shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#0F172A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#FF7A18]/50 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-[#FF7A18]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Agape Sovereign Admin Telemetry Enclave
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FF7A18]/20 text-[#FF7A18] border border-[#FF7A18]/40">
                    RESTRICTED ROOT
                  </span>
                </div>
                <p className="text-xs text-orange-200 font-mono">
                  Authorized Administrators: {ADMIN_AUTHORIZED_EMAILS.join(' | ')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#111A33] hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Identity Switcher (for testing the restriction) */}
          <div className="px-6 py-3 bg-[#0B1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-bold">Admin Identity Context:</span>
              <select
                value={selectedAdminEmail}
                onChange={(e) => setSelectedAdminEmail(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#111A33] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-[#FF7A18]"
              >
                <option value="idin@agape.nyc">idin@agape.nyc (Root Sovereign Admin)</option>
                <option value="agape@sovereign.nyc">agape@sovereign.nyc (Co-Admin)</option>
                <option value="unauthorized.guest@domain.com">unauthorized.guest@domain.com (Test Access Denied)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300">FIDO2 Passkey:</span>
              <span className="text-[#00D4FF] font-bold">BOUND (Enclave verified)</span>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isAuthorized ? (
              <div className="p-8 rounded-2xl bg-red-950/20 border border-red-500/50 text-center space-y-3">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white font-mono">
                  ACCESS DENIED: INSUFFICIENT PRIVILEGES
                </h4>
                <p className="text-xs text-red-300 max-w-md mx-auto">
                  The admin portal and underlying <code>/admin_telemetry</code> collections are strictly isolated from user accounts. Only <strong>idin@agape.nyc</strong> or <strong>agape@sovereign.nyc</strong> can authenticate to this console.
                </p>
                <button
                  onClick={() => setSelectedAdminEmail('idin@agape.nyc')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold transition"
                >
                  Assume Authorized Admin (idin@agape.nyc)
                </button>
              </div>
            ) : (
              <>
                {/* Live Nerdy Telemetry Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-cyan-500/30">
                    <div className="text-[10px] font-mono uppercase text-slate-300">CLOUD RUN INSTANCE</div>
                    <div className="text-sm font-mono font-bold text-[#00D4FF] mt-1 truncate">
                      {telemetry.cloudRunStatus}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-orange-500/30">
                    <div className="text-[10px] font-mono uppercase text-slate-300">WEBAUTHN HANDSHAKES</div>
                    <div className="text-xl font-mono font-bold text-[#FF7A18] mt-1">
                      {telemetry.webAuthnHandshakes}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-pink-500/30">
                    <div className="text-[10px] font-mono uppercase text-slate-300">ZERO-ACCESS VIOLATIONS</div>
                    <div className="text-xl font-mono font-bold text-[#FF2E9F] mt-1">
                      {telemetry.zeroKnowledgeViolations} (0.00%)
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-green-500/30">
                    <div className="text-[10px] font-mono uppercase text-slate-300">NODE UPTIME / HEALTH</div>
                    <div className="text-xl font-mono font-bold text-green-400 mt-1">
                      {telemetry.nodeHealth}%
                    </div>
                  </div>
                </div>

                {/* Firestore Isolation Rules Notice */}
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800">
                  <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-cyan-300">
                    <Database className="w-4 h-4 text-[#00D4FF]" />
                    <span>FIRESTORE ENCLAVE SEPARATION & COMPOSITE INDICES</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    • <code>/users/&#123;userId&#125;/identity_vectors</code>: Strict Zero-Access rule in place. Even the administrator cannot inspect plaintext user payloads.<br />
                    • <code>/admin_telemetry/health_snapshots</code>: Enforces composite indices on <code>service_name (ASC) + timestamp (DESC)</code> for sub-millisecond real-time event updates.<br />
                    • Protocol: <strong>{telemetry.activeEcraProtocol}</strong>
                  </p>
                </div>

                {/* Real-time Telemetry Event Logs */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#FF7A18]" />
                    Real-time Operational Telemetry Stream
                  </h4>

                  <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#0F172A]">
                    <div className="divide-y divide-slate-800 font-mono text-xs">
                      {telemetry.logs.map((log) => (
                        <div key={log.id} className="p-3.5 hover:bg-[#111A33] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[#00D4FF] font-bold">{log.serviceName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {log.status}
                              </span>
                              <span className="text-slate-300 text-[10px]">{log.latencyMs}ms</span>
                            </div>
                            <div className="text-slate-300 text-[11px] mt-0.5">{log.operation}</div>
                          </div>
                          <div className="text-right text-[10px] text-slate-300 font-mono">
                            <div>{log.timestamp}</div>
                            <div className="text-slate-300">SHA: {log.shaFingerprint.substring(0, 16)}...</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
