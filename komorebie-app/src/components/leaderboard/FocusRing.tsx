import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { type TierConfig, type TierKey } from '../../lib/leagues';

interface FocusRingProps {
  isFocusing?: boolean | null;
  children: React.ReactNode;
  className?: string;
  tier?: TierConfig;
}

/**
 * FocusRing — Handcrafted Premium Animations
 * 
 * Each league tier represents a different level of mastery.
 * The visual effects evolve from simple "embers" to "celestial events".
 */const FocusRing: React.FC<FocusRingProps> = ({ isFocusing, children, className = '', tier }) => {
  const tierKey = tier?.key || 'ember';

  return (
    <div className={`relative inline-flex ${className}`}>
      {children}

      {isFocusing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 pointer-events-none" 
          style={{ zIndex: 5 }}
        >
          {/* Ambient Glow Foundation */}
          <GlowLayer tierKey={tierKey} />

          {/* Dynamic Arc Systems */}
          <ArcSystem tierKey={tierKey} />

          {/* Tier-Specific Special Effects */}
          <SpecialEffects tierKey={tierKey} />

          {/* Presence Indicator Dot */}
          <StatusDot tierKey={tierKey} />
        </motion.div>
      )}
    </div>
  );
};

/* ──────────────────────────────────────────────────────────
 * Sub-components for premium visual storytelling
 * ────────────────────────────────────────────────────────── */

const GlowLayer: React.FC<{ tierKey: TierKey }> = ({ tierKey }) => {
  const glowStyles: Record<TierKey, { border: string; shadow: string; pulse: boolean }> = {
    ember: { border: 'rgba(245, 158, 11, 0.2)', shadow: '0 0 15px rgba(245, 158, 11, 0.1)', pulse: false },
    stone: { border: 'rgba(148, 163, 184, 0.2)', shadow: '0 0 15px rgba(148, 163, 184, 0.1)', pulse: false },
    iron: { border: 'rgba(96, 165, 250, 0.3)', shadow: '0 0 20px rgba(59, 130, 246, 0.2)', pulse: true },
    gold: { border: 'rgba(250, 204, 21, 0.4)', shadow: '0 0 25px rgba(250, 204, 21, 0.3)', pulse: true },
    diamond: { border: 'rgba(103, 232, 249, 0.5)', shadow: '0 0 30px rgba(103, 232, 249, 0.4)', pulse: true },
    zenmaster: { border: 'rgba(183, 201, 176, 0.6)', shadow: '0 0 35px rgba(183, 201, 176, 0.5)', pulse: true },
    transcendent: { border: 'rgba(167, 139, 250, 0.7)', shadow: '0 0 50px rgba(167, 139, 250, 0.6)', pulse: true },
  };

  const style = glowStyles[tierKey] || glowStyles.ember;

  return (
    <motion.div 
      animate={style.pulse ? { 
        boxShadow: [style.shadow, style.shadow.replace('0.6', '0.8').replace('0.5', '0.7'), style.shadow],
        scale: [1, 1.02, 1]
      } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-[-4px] rounded-full"
      style={{
        border: `1.5px solid ${style.border}`,
        boxShadow: style.shadow
      }}
    />
  );
};

const ArcSystem: React.FC<{ tierKey: TierKey }> = ({ tierKey }) => {
  const configs: Record<TierKey, { arcs: { r: number; d: string; s: number; c: string; w: number; dir?: number; dash?: string }[] }> = {
    ember: { arcs: [{ r: 48, d: '30 120', s: 8, c: '#f59e0b', w: 1.5 }] },
    stone: { arcs: [{ r: 48, d: '50 100', s: 7, c: '#94a3b8', w: 2 }] },
    iron: { arcs: [
      { r: 48, d: '40 110', s: 6, c: '#60a5fa', w: 2 },
      { r: 44, d: '20 130', s: 5, c: '#1d4ed8', w: 1.5, dir: -1 }
    ]},
    gold: { arcs: [
      { r: 48, d: '60 90', s: 5, c: '#facc15', w: 2.5 },
      { r: 44, d: '30 120', s: 4, c: '#fbbf24', w: 1.5 },
      { r: 40, d: '15 135', s: 3, c: '#ffffff', w: 1, dir: -1 }
    ]},
    diamond: { arcs: [
      { r: 48, d: '10 40', s: 3, c: '#67e8f9', w: 2.5 },
      { r: 48, d: '10 40', s: 3.2, c: '#ffffff', w: 1, dir: -1 },
      { r: 43, d: '20 80', s: 2.5, c: '#22d3ee', w: 2 }
    ]},
    zenmaster: { arcs: [
      { r: 48, d: '120 40', s: 10, c: '#a3e635', w: 3 },
      { r: 42, d: '80 80', s: 8, c: '#b7c9b0', w: 2 },
      { r: 36, d: '40 120', s: 6, c: '#ffffff', w: 1.5, dir: -1 }
    ]},
    transcendent: { arcs: [
      { r: 48, d: '20 10', s: 2, c: '#a78bfa', w: 4 },
      { r: 48, d: '10 50', s: 1.8, c: '#ffffff', w: 1.5, dir: -1 },
      { r: 42, d: '30 20', s: 2.5, c: '#8b5cf6', w: 3 },
      { r: 36, d: '5 15', s: 1.2, c: '#c4b5fd', w: 2, dir: -1 }
    ]}
  };

  const config = configs[tierKey] || configs.ember;

  return (
    <svg className="absolute inset-[-15px] w-[calc(100%+30px)] h-[calc(100%+30px)] overflow-visible" viewBox="0 0 100 100">
      {config.arcs.map((arc, i) => (
        <motion.circle
          key={i}
          cx="50"
          cy="50"
          r={arc.r}
          fill="none"
          stroke={arc.c}
          strokeWidth={arc.w}
          strokeLinecap="round"
          strokeDasharray={arc.d}
          animate={{ rotate: (arc.dir || 1) * 360 }}
          transition={{ duration: arc.s, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '50px 50px', opacity: 0.8, filter: 'blur(0.5px)' }}
        />
      ))}
    </svg>
  );
};

const SpecialEffects: React.FC<{ tierKey: TierKey }> = ({ tierKey }) => {
  if (tierKey === 'zenmaster') {
    return (
      <div className="absolute inset-0">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.8, 2.2], opacity: [0, 0.4, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: i * 1.25, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        ))}
      </div>
    );
  }
  return <AestheticLayer tierKey={tierKey} />;
};

const AestheticLayer: React.FC<{ tierKey: TierKey }> = ({ tierKey }) => {
  // Generate all non-deterministic values at the top level to satisfy purity and hook rules
  const vortexParticles = useMemo(() => Array.from({ length: 24 }).map((_, i) => ({
    angle: (i / 24) * Math.PI * 2,
    radius: 45 + Math.random() * 15, // eslint-disable-line react-hooks/purity
    rotateDuration: 3 + Math.random() * 5, // eslint-disable-line react-hooks/purity
    opacityDuration: 2 + Math.random() * 2, // eslint-disable-line react-hooks/purity
    scaleDuration: 2 + Math.random() * 2, // eslint-disable-line react-hooks/purity
    delay: Math.random() * 2 // eslint-disable-line react-hooks/purity
  })), []);

  const diamondParticles = useMemo(() => Array.from({ length: 6 }).map(() => ({
    x1: (Math.random() - 0.5) * 20, // eslint-disable-line react-hooks/purity
    x2: (Math.random() - 0.5) * 40, // eslint-disable-line react-hooks/purity
    duration: 2 + Math.random(), // eslint-disable-line react-hooks/purity
    delay: Math.random() * 2, // eslint-disable-line react-hooks/purity
    left: `${20 + Math.random() * 60}%` // eslint-disable-line react-hooks/purity
  })), []);

  if (tierKey === 'zenmaster' || tierKey === 'transcendent') {
    return (
      <div className="absolute inset-[-12px] w-[calc(100%+24px)] h-[calc(100%+24px)] pointer-events-none">
        {vortexParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            animate={{ 
              rotate: 360,
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              rotate: { duration: p.rotateDuration, repeat: Infinity, ease: "linear" },
              opacity: { duration: p.opacityDuration, repeat: Infinity },
              scale: { duration: p.scaleDuration, repeat: Infinity }
            }}
            style={{ 
              backgroundColor: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#8b5cf6' : '#ffffff',
              boxShadow: '0 0 8px currentColor',
              transformOrigin: 'center center',
              left: `${50 + Math.cos(p.angle) * p.radius}%`,
              top: `${50 + Math.sin(p.angle) * p.radius}%`
            }}
          />
        ))}
        {/* Central Core Pulse */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500/20 to-fuchsia-500/20 blur-md"
        />
      </div>
    );
  }

  if (tierKey === 'diamond' || tierKey === 'gold') {
    return (
      <div className="absolute inset-[-6px]">
        {diamondParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [-10, -30],
              x: [p.x1, p.x2]
            }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
            style={{ 
              left: p.left, 
              top: '50%',
              boxShadow: tierKey === 'gold' ? '0 0 10px #facc15' : '0 0 10px #67e8f9'
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

const StatusDot: React.FC<{ tierKey: TierKey }> = ({ tierKey }) => {
  const colors: Record<TierKey, string> = {
    ember: '#f59e0b',
    stone: '#94a3b8',
    iron: '#60a5fa',
    gold: '#facc15',
    diamond: '#67e8f9',
    zenmaster: '#a3e635',
    transcendent: '#a78bfa',
  };

  const color = colors[tierKey] || colors.ember;

  return (
    <div className="absolute -top-1 -right-1 z-20">
      <div
        className="w-3.5 h-3.5 rounded-full border-2 border-slate-950"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      >
        <motion.div
          animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-full h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
};

export default FocusRing;
