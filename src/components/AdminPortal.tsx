import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { NEON, NeonText, GlassCard, StatusBadge } from './UI';
import { motion } from 'framer-motion';
import { Users, ShieldAlert, Activity, Terminal, ShieldCheck, AlertTriangle } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface AuditLog {
  id: string;
  type: string;
  action: string;
  userEmail?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export const AdminPortal: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScans: 0,
    criticalFindings: 0,
    activeAdmins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time Audit Logs
    const logsQuery = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      } as AuditLog));
      setLogs(newLogs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "audit_logs");
    });

    // Stats Aggregation (Real-time)
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const admins = snapshot.docs.filter(d => d.data().role === 'admin').length;
      setStats(prev => ({ ...prev, totalUsers: snapshot.size, activeAdmins: admins }));
    });

    const unsubscribeScans = onSnapshot(collection(db, "diff_scans"), (snapshot) => {
      const critical = snapshot.docs.filter(d => d.data().status === 'NUKED').length;
      setStats(prev => ({ ...prev, totalScans: snapshot.size, criticalFindings: critical }));
    });

    return () => {
      unsubscribeLogs();
      unsubscribeUsers();
      unsubscribeScans();
    };
  }, []);

  const logTypeStyles: Record<string, { color: string, icon: React.ElementType }> = {
    USER_LOGIN: { color: NEON.blue, icon: Users },
    SCAN_INITIATED: { color: NEON.orange, icon: Activity },
    SCAN_COMPLETED: { color: "#0f0", icon: ShieldCheck },
    ADMIN_ACTION: { color: NEON.magenta, icon: ShieldAlert },
    USER_REGISTERED: { color: NEON.blue, icon: Users }
  };

  return (
    <div style={{ animation: "fade-in 0.4s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", color: NEON.magenta, letterSpacing: "0.2em", marginBottom: 6 }}>SYSTEM ADMINISTRATION INTERFACE</div>
        <NeonText color={NEON.magenta} size="1.5rem" weight={900}>SOVEREIGN ADMIN PORTAL</NeonText>
        <div style={{ color: NEON.textMuted, fontSize: "0.8rem", marginTop: 4 }}>Aggregated intelligence and system-wide audit telemetry</div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "TOTAL USERS", value: stats.totalUsers, icon: Users, color: NEON.blue },
          { label: "TOTAL SCANS", value: stats.totalScans, icon: Activity, color: NEON.orange },
          { label: "CRITICAL FINDINGS", value: stats.criticalFindings, icon: AlertTriangle, color: NEON.magenta },
          { label: "ADMIN NODES", value: stats.activeAdmins, icon: ShieldCheck, color: NEON.blue },
        ].map((kpi) => (
          <GlassCard key={kpi.label} style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted, letterSpacing: "0.1em" }}>{kpi.label}</div>
              <kpi.icon size={14} color={kpi.color} style={{ opacity: 0.7 }} />
            </div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.8rem", fontWeight: 900, color: kpi.color, textShadow: `0 0 12px ${kpi.color}66` }}>{kpi.value}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <Terminal size={16} color={NEON.magenta} />
            <NeonText color={NEON.magenta} size="0.75rem" weight={700}>REAL-TIME AUDIT TELEMETRY</NeonText>
            <div style={{ flex: 1, height: 1, background: `${NEON.magenta}33` }} />
          </div>

          <GlassCard style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ maxHeight: "500px", overflowY: "auto", padding: "12px" }}>
              {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: NEON.textMuted }}>Initializing secure connection...</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: NEON.textMuted }}>No audit logs found in system.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {logs.map((log) => {
                    const style = logTypeStyles[log.type] || { color: NEON.textMuted, icon: Terminal };
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={log.id} 
                        style={{ 
                          padding: "10px 14px", 
                          background: "rgba(255,255,255,0.02)", 
                          borderRadius: 8,
                          borderLeft: `2px solid ${style.color}`,
                          display: "flex",
                          alignItems: "center",
                          gap: 16
                        }}
                      >
                        <div style={{ background: `${style.color}22`, padding: 8, borderRadius: 6 }}>
                          <style.icon size={14} color={style.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontFamily: "'Rajdhani'", fontSize: "0.85rem", fontWeight: 600, color: NEON.text }}>{log.action}</div>
                            <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.6rem", color: NEON.textMuted }}>{log.timestamp.toLocaleTimeString()}</div>
                          </div>
                          <div style={{ fontFamily: "'Share Tech Mono'", fontSize: "0.65rem", color: style.color, opacity: 0.8 }}>
                            {log.type} {log.userEmail ? `· ${log.userEmail}` : ""}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
