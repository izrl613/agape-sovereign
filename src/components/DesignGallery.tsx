import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ArrowLeft, Sparkles, Shield, Palette, Type, Layers } from 'lucide-react';
import { SOVEREIGN_PALETTE, NEON } from '../theme/tokens';
import { GlassCard, NeonButton, NeonText, StatusBadge } from './UI/index';

interface CopyableCodeProps {
  code: string;
  label?: string;
}

const CopyableCode: React.FC<CopyableCodeProps> = ({ code, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored in restricted contexts
    }
  };

  return (
    <div
      className="rounded-lg overflow-hidden mt-3"
      style={{
        background: '#070B16',
        border: '1px solid rgba(0, 212, 255, 0.2)',
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 text-xs"
        style={{
          background: 'rgba(17, 24, 48, 0.9)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
          color: NEON.textMuted,
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        <span>{label || 'TSX'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors cursor-pointer"
          style={{
            color: copied ? '#00FF89' : SOVEREIGN_PALETTE.cyan,
            background: copied ? 'rgba(0, 255, 137, 0.1)' : 'rgba(0, 212, 255, 0.1)',
            border: `1px solid ${copied ? 'rgba(0, 255, 137, 0.35)' : 'rgba(0, 212, 255, 0.25)'}`,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        className="p-3 text-xs overflow-x-auto leading-relaxed"
        style={{
          color: SOVEREIGN_PALETTE.ice,
          fontFamily: "'Share Tech Mono', monospace",
          margin: 0,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

const COLOR_TOKENS = [
  {
    name: 'canvas',
    token: 'SOVEREIGN_PALETTE.canvas',
    tailwind: 'bg-sovereign-canvas',
    hex: SOVEREIGN_PALETTE.canvas,
    role: 'Deep Sovereign Dark Blue — Primary canvas',
  },
  {
    name: 'surface',
    token: 'SOVEREIGN_PALETTE.surface',
    tailwind: 'bg-sovereign-surface',
    hex: SOVEREIGN_PALETTE.surface,
    role: 'Elevated surface & card background',
  },
  {
    name: 'ice',
    token: 'SOVEREIGN_PALETTE.ice',
    tailwind: 'text-sovereign-ice',
    hex: SOVEREIGN_PALETTE.ice,
    role: 'Luminous Ice White — Primary labels',
  },
  {
    name: 'cyan',
    token: 'SOVEREIGN_PALETTE.cyan',
    tailwind: 'text-sovereign-cyan',
    hex: SOVEREIGN_PALETTE.cyan,
    role: 'Electric Cyan — KNOXED state & primary accent',
  },
  {
    name: 'magenta',
    token: 'SOVEREIGN_PALETTE.magenta',
    tailwind: 'text-sovereign-magenta',
    hex: SOVEREIGN_PALETTE.magenta,
    role: 'Neon Magenta — NUKED state & critical alerts',
  },
  {
    name: 'orange',
    token: 'SOVEREIGN_PALETTE.orange',
    tailwind: 'text-sovereign-orange',
    hex: SOVEREIGN_PALETTE.orange,
    role: 'Burnt Neon Orange — MONITORED state & warnings',
  },
];

export const DesignGallery: React.FC = () => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const copyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <div
      className="min-h-screen px-6 py-10 md:px-12"
      style={{
        backgroundColor: SOVEREIGN_PALETTE.canvas,
        color: SOVEREIGN_PALETTE.ice,
      }}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#00D4FF]/20">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} style={{ color: SOVEREIGN_PALETTE.cyan }} />
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: NEON.textMuted, fontFamily: "'Share Tech Mono', monospace" }}
              >
                Agape Sovereign Enclave · Zero-Grey Design System
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <NeonText size="2rem" color={SOVEREIGN_PALETTE.cyan}>
                COMPONENT &amp; TOKEN GALLERY
              </NeonText>
            </h1>
            <p className="mt-2 text-sm max-w-2xl" style={{ color: 'rgba(248, 250, 252, 0.8)' }}>
              Live showcase of the repository&apos;s color tokens, typography scale, and UI primitives.
              Every surface adheres strictly to the Zero-Grey Mandate.
            </p>
          </div>
          <Link to="/">
            <NeonButton size="sm" color={NEON.blue}>
              <span className="flex items-center gap-2">
                <ArrowLeft size={14} />
                Back to Enclave
              </span>
            </NeonButton>
          </Link>
        </header>

        {/* 1. Color Tokens */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={20} style={{ color: SOVEREIGN_PALETTE.magenta }} />
            <NeonText size="1.25rem" color={SOVEREIGN_PALETTE.ice}>
              1. Color Tokens
            </NeonText>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLOR_TOKENS.map((c) => (
              <GlassCard
                key={c.name}
                onClick={() => copyHex(c.hex)}
                className="p-4 cursor-pointer transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-lg shrink-0"
                    style={{
                      backgroundColor: c.hex,
                      border: '1px solid rgba(248, 250, 252, 0.25)',
                      boxShadow: `0 0 14px ${c.hex}55`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm" style={{ color: SOVEREIGN_PALETTE.ice }}>
                        {c.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          background: 'rgba(0, 212, 255, 0.1)',
                          color: copiedHex === c.hex ? '#00FF89' : SOVEREIGN_PALETTE.cyan,
                        }}
                      >
                        {copiedHex === c.hex ? 'Copied!' : c.hex}
                      </span>
                    </div>
                    <p className="text-xs mt-1 truncate" style={{ color: NEON.textMuted }}>
                      {c.token}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(248, 250, 252, 0.72)' }}>
                      {c.role}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          <CopyableCode
            label="src/theme/tokens.ts"
            code={`import { SOVEREIGN_PALETTE, NEON } from '../theme/tokens';

// Canvas & Surface
backgroundColor: SOVEREIGN_PALETTE.canvas  // '#0B1020'
background: SOVEREIGN_PALETTE.surface      // '#111830'
color: SOVEREIGN_PALETTE.ice               // '#F8FAFC'
color: NEON.textMuted                      // 'rgba(0, 212, 255, 0.6)'`}
          />
        </section>

        {/* 2. Typography Tokens */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Type size={20} style={{ color: SOVEREIGN_PALETTE.cyan }} />
            <NeonText size="1.25rem" color={SOVEREIGN_PALETTE.ice}>
              2. Typography &amp; NeonText Variants
            </NeonText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-5 space-y-4">
              <div className="text-xs uppercase tracking-wider" style={{ color: NEON.textMuted }}>
                Font Families (src/index.css)
              </div>
              <div>
                <div className="text-xs" style={{ color: NEON.textMuted }}>--font-display (Orbitron)</div>
                <div className="text-2xl font-bold mt-1" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  SOVEREIGN ENCLAVE 2026
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: NEON.textMuted }}>--font-sans (Inter / Rajdhani)</div>
                <div className="text-base mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Zero-Knowledge AES-256-GCM envelope encryption for 16 identity vectors.
                </div>
              </div>
              <div>
                <div className="text-xs" style={{ color: NEON.textMuted }}>--font-mono (Share Tech Mono)</div>
                <div className="text-sm mt-1" style={{ fontFamily: "'Share Tech Mono', monospace", color: SOVEREIGN_PALETTE.cyan }}>
                  SHA-256: 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 space-y-4">
              <div className="text-xs uppercase tracking-wider" style={{ color: NEON.textMuted }}>
                NeonText Component Variants
              </div>
              <div className="flex flex-col gap-3">
                <NeonText color={NEON.blue} size="1.35rem" weight={700}>
                  Electric Cyan Heading (NEON.blue)
                </NeonText>
                <NeonText color={NEON.magenta} size="1.15rem" weight={700}>
                  Neon Magenta Alert (NEON.magenta)
                </NeonText>
                <NeonText color={NEON.orange} size="1rem" weight={600}>
                  Burnt Orange Telemetry (NEON.orange)
                </NeonText>
                <NeonText color={SOVEREIGN_PALETTE.ice} size="0.95rem" weight={500}>
                  Ice White Label (SOVEREIGN_PALETTE.ice)
                </NeonText>
              </div>
            </GlassCard>
          </div>

          <CopyableCode
            label="NeonText Usage"
            code={`import { NeonText } from './components/UI';
import { NEON } from './theme/tokens';

<NeonText color={NEON.blue} size="1.35rem" weight={700}>
  Electric Cyan Heading
</NeonText>`}
          />
        </section>

        {/* 3. Component Variants */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Layers size={20} style={{ color: SOVEREIGN_PALETTE.orange }} />
            <NeonText size="1.25rem" color={SOVEREIGN_PALETTE.ice}>
              3. Component Variants
            </NeonText>
          </div>

          {/* NeonButton */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <NeonText size="1rem" color={SOVEREIGN_PALETTE.cyan}>
                NeonButton — Colors, Sizes &amp; Disabled State
              </NeonText>
              <span className="text-xs" style={{ color: NEON.textMuted, fontFamily: "'Share Tech Mono', monospace" }}>
                src/components/UI/NeonButton.tsx
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NeonButton size="sm" color={NEON.blue}>Small Cyan</NeonButton>
              <NeonButton size="md" color={NEON.blue}>Medium Cyan</NeonButton>
              <NeonButton size="lg" color={NEON.blue}>Large Cyan</NeonButton>
              <NeonButton size="md" color={NEON.magenta}>Magenta</NeonButton>
              <NeonButton size="md" color={NEON.orange}>Orange</NeonButton>
              <NeonButton size="md" color={NEON.blue} disabled>Disabled</NeonButton>
            </div>

            <CopyableCode
              label="NeonButton Usage"
              code={`import { NeonButton } from './components/UI';
import { NEON } from './theme/tokens';

<NeonButton size="sm" color={NEON.blue}>Small Cyan</NeonButton>
<NeonButton size="md" color={NEON.magenta}>Magenta</NeonButton>
<NeonButton size="lg" color={NEON.orange}>Orange</NeonButton>
<NeonButton size="md" color={NEON.blue} disabled>Disabled</NeonButton>`}
            />
          </GlassCard>

          {/* StatusBadge */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <NeonText size="1rem" color={SOVEREIGN_PALETTE.cyan}>
                StatusBadge — Vector Enclave States
              </NeonText>
              <span className="text-xs" style={{ color: NEON.textMuted, fontFamily: "'Share Tech Mono', monospace" }}>
                src/components/UI/StatusBadge.tsx
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <StatusBadge type="KNOXED" />
              <StatusBadge type="NUKED" />
              <StatusBadge type="MONITORED" />
              <StatusBadge type="SCANNING" />
            </div>

            <CopyableCode
              label="StatusBadge Usage"
              code={`import { StatusBadge } from './components/UI';

<StatusBadge type="KNOXED" />
<StatusBadge type="NUKED" />
<StatusBadge type="MONITORED" />
<StatusBadge type="SCANNING" />`}
            />
          </GlassCard>

          {/* GlassCard & Neon Triad Borders */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <NeonText size="1rem" color={SOVEREIGN_PALETTE.cyan}>
                GlassCard &amp; Neon Triad Surface States
              </NeonText>
              <span className="text-xs" style={{ color: NEON.textMuted, fontFamily: "'Share Tech Mono', monospace" }}>
                src/components/UI/GlassCard.tsx · src/index.css
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} style={{ color: SOVEREIGN_PALETTE.cyan }} />
                  <span className="font-semibold text-sm">Default GlassCard</span>
                </div>
                <p className="text-xs" style={{ color: NEON.textMuted }}>
                  Frosted dark-blue glass with subtle cyan border.
                </p>
              </GlassCard>

              <div className="glass-panel knoxed-glow p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} style={{ color: SOVEREIGN_PALETTE.cyan }} />
                  <span className="font-semibold text-sm">.knoxed-glow</span>
                </div>
                <p className="text-xs" style={{ color: NEON.textMuted }}>
                  Steady Electric Cyan glow for verified KNOXED vectors.
                </p>
              </div>

              <div className="glass-panel neon-wrap p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} style={{ color: SOVEREIGN_PALETTE.magenta }} />
                  <span className="font-semibold text-sm">.neon-wrap</span>
                </div>
                <p className="text-xs" style={{ color: NEON.textMuted }}>
                  Animated Magenta / Cyan / Orange triad gradient border.
                </p>
              </div>
            </div>

            <CopyableCode
              label="GlassCard & Surface Usage"
              code={`import { GlassCard } from './components/UI';

<GlassCard className="p-4">Default GlassCard</GlassCard>
<div className="glass-panel knoxed-glow p-4">KNOXED Surface</div>
<div className="glass-panel neon-wrap p-4">Triad Gradient Border</div>`}
            />
          </GlassCard>
        </section>
      </div>
    </div>
  );
};
