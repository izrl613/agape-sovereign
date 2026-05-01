import React from 'react';
import { motion } from 'framer-motion';
import { NEON, GlassCard, NeonText } from './UI';
import { Shield, Key, EyeOff, Smartphone, Globe, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const TIPS = [
  {
    id: 'passwords',
    icon: <Key className="w-6 h-6" />,
    title: 'Password Hygiene',
    description: 'Use strong, unique passwords for every account. A password manager is essential for maintaining complex credentials without cognitive overload.',
    actionable: [
      'Enable multi-factor authentication (MFA) wherever possible.',
      'Use passphrases (e.g., "CorrectHorseBatteryStaple") instead of complex but short passwords.',
      'Regularly audit your password manager for compromised or reused passwords.'
    ],
    color: NEON.blue
  },
  {
    id: 'privacy',
    icon: <EyeOff className="w-6 h-6" />,
    title: 'Data Minimization',
    description: 'Limit the amount of personal information you share online. The less data exists about you, the smaller your attack surface.',
    actionable: [
      'Use alias email addresses for signups (e.g., SimpleLogin or Apple Hide My Email).',
      'Provide fake or minimal information for non-essential services.',
      'Regularly review and delete old accounts you no longer use.'
    ],
    color: NEON.magenta
  },
  {
    id: 'brokers',
    icon: <Lock className="w-6 h-6" />,
    title: 'Data Broker Removal',
    description: 'Data brokers aggregate your PII from public records and social media. Proactive removal is the only way to NUKED these profiles.',
    actionable: [
      'Submit opt-out requests to major brokers like Spokeo, Whitepages, and Intelius.',
      'Use alias email addresses and dummy data for services that do not require verification.',
      'NUKED your digital presence from people-search sites using ECRA-compliant templates.'
    ],
    color: '#00D4FF'
  },
  {
    id: 'devices',
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Device Security',
    description: 'Your devices are the gateway to your digital life. Keep them secure, updated, and encrypted.',
    actionable: [
      'Enable full-disk encryption (FileVault on Mac, BitLocker on Windows).',
      'Keep your OS and all applications updated to patch known vulnerabilities.',
      'Use a privacy screen and be aware of shoulder surfing in public spaces.'
    ],
    color: NEON.orange
  },
  {
    id: 'network',
    icon: <Globe className="w-6 h-6" />,
    title: 'Network Privacy',
    description: 'Protect your data in transit. Public Wi-Fi networks are inherently untrustworthy.',
    actionable: [
      'Use a reputable VPN when connecting to public or untrusted networks.',
      'Change default router passwords and disable remote management.',
      'Configure your DNS to use a privacy-respecting provider (e.g., Quad9, NextDNS).'
    ],
    color: '#00ffcc'
  },
  {
    id: 'social',
    icon: <Shield className="w-6 h-6" />,
    title: 'Social Engineering Defense',
    description: 'Attackers often target the human element. Be skeptical of unsolicited communications.',
    actionable: [
      'Verify the identity of anyone requesting sensitive information or money.',
      'Do not click on links or download attachments from unknown or suspicious sources.',
      'Be mindful of what you share on social media; attackers use this for spear-phishing.'
    ],
    color: '#ffcc00'
  }
];

export const SecurityTips = () => {
  return (
    <div className="space-y-8">
      <div>
        <NeonText color={NEON.blue} size="2rem" weight={700} style={{ marginBottom: '0.5rem' }}>
          SECURITY PROTOCOLS
        </NeonText>
        <div className="text-slate-400 font-mono text-sm tracking-widest">
          ACTIONABLE INTELLIGENCE FOR DIGITAL SOVEREIGNTY
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {TIPS.map((tip, index) => (
          <motion.div
            key={tip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="h-full p-6 border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: tip.color }}
              />
              
              <div className="flex items-start gap-4 mb-4 relative z-10">
                <div 
                  className="p-3 rounded-xl bg-black/40 border border-white/10"
                  style={{ color: tip.color }}
                >
                  {tip.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-rajdhani tracking-wide mb-1">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 relative z-10 mt-6">
                <div className="text-xs font-mono tracking-widest text-slate-500 mb-2">
                  RECOMMENDED ACTIONS:
                </div>
                {tip.actionable.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 
                      className="w-4 h-4 mt-0.5 shrink-0" 
                      style={{ color: tip.color }}
                    />
                    <span className="text-sm text-slate-300 leading-snug">
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: TIPS.length * 0.1 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-6 border border-[#FF2E9F]/20 bg-[#FF2E9F]/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#FF2E9F]/10 border border-[#FF2E9F]/20 text-[#FF2E9F]">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-rajdhani tracking-wide mb-2">
                  Zero Trust Architecture
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  The core philosophy of digital sovereignty is "Never trust, always verify." 
                  Assume that networks are hostile, devices can be compromised, and data breaches are inevitable. 
                  Design your digital life to minimize the impact of any single point of failure.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};
