// omni-canvas/src/components/OmniCanvas.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DigitalPsyche } from '../middleware/mycelium';
import { OmniChat } from './OmniChat';
import { MapPortal } from './MapPortal';
import { useWakeLock } from '../hooks/useWakeLock';

type Hormones = { cortisol: number; dopamine: number; adrenaline: number };

const getSomaticGlow = (status: string, h: Hormones): string | null => {
  if (status === 'asleep') return null; // handled by CSS animation
  if (h.cortisol > 0.6) return 'rgba(220, 20, 60, 0.35)';   // Crimson — high stress
  if (h.dopamine > 0.6)  return 'rgba(80, 200, 120, 0.35)'; // Emerald — reward state
  return 'rgba(192, 192, 192, 0.18)';                        // Silver  — baseline
};

/**
 * OmniCanvas: The infinitely modular expandable canvas.
 * Instead of a linear chat, this renders the Stigmergic UI via Clifford Attractors.
 */
export const OmniCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pheromones = useQuery(api.pheromones.getActiveVisual);
  const somatic    = useQuery(api.pheromones.getActiveSomatic);
  const systemState = useQuery(api.system.getSystemState);

  const [psyche] = useState(() => new DigitalPsyche(
    import.meta.env.VITE_CONVEX_URL,
    import.meta.env.VITE_LFM_URL
  ));

  useWakeLock();

  const status: string  = systemState?.status ?? 'waking';
  const hormones: Hormones = systemState?.hormones ?? { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };
  const isSleeping = status === 'asleep';
  const glowColor  = useMemo(() => getSomaticGlow(status, hormones), [status, hormones]);

  useEffect(() => {
    psyche.bindNetwork();

    // WebGPU Compute Shader Pipeline (Clifford Attractor)
    // 100,000 Particles — "The Engram Substrate"
    const initWebGPU = async () => {
      if (!navigator.gpu) {
        console.warn("⚠️ WebGPU not detected. Falling back to Canvas2D/WebGL.");
        return;
      }
      const adapter = await navigator.gpu.requestAdapter();
      const device  = await adapter?.requestDevice();
      // ... [Shader logic to implement CLIFFORD_ATTRACTOR_SHADER] ...
      void device;
    };

    initWebGPU();
  }, []);

  // CLIFFORD ATTRACTOR STATE PARAMETERS (From Whitepaper)
  const getAttractorParams = (intent: string) => {
    switch (intent) {
      case 'media_playback': return { a: 0.0,  b: 0.0,  c: 1.0,  d: 1.0  };
      case 'text_display':   return { a: -1.7, b: 1.3,  c: -0.1, d: -1.2 };
      case 'alert':          return { a: 2.0,  b: -1.8, c: 0.3,  d: 1.5  };
      default:               return { a: -1.4, b: 1.6,  c: 1.0,  d: 0.7  };
    }
  };
  void getAttractorParams; // will be wired to shader in next phase

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>

      {/* Somatic glow — hormone-driven color feedback */}
      <div
        className={isSleeping ? 'somatic-sleep-pulse' : ''}
        style={{
          position: 'absolute',
          inset: 0,
          background: isSleeping
            ? undefined
            : `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'background 1.5s ease-in-out',
        }}
      />

      {/* 1. The Living Vortex Field (WebGPU Canvas) */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />

      {/* 2. Crystallized Content Projection */}
      <div className="crystallization-layer" style={{ position: 'absolute', pointerEvents: 'none', zIndex: 2 }}>
        {pheromones?.map((phero: any) => (
          <div
            key={phero._id}
            style={{
              position: 'absolute',
              left: `${phero.position.x * 100}%`,
              top: `${phero.position.y * 100}%`,
              width: `${phero.size.width * 100}%`,
              height: `${phero.size.height * 100}%`,
              backdropFilter: 'blur(20px)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '20px',
              color: '#fff',
              pointerEvents: 'auto',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {phero.content.type === 'text' && (
              <div className="text-manifestation">
                <p style={{ margin: 0, opacity: phero.weight }}>{phero.content.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Somatic Overlay (infrastructure sensation) */}
      <div className="somatic-layer" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 3,
        boxShadow: somatic?.some((s: any) => s.source === 'latency') ? 'inset 0 0 100px rgba(0, 100, 255, 0.3)' : 'none'
      }} />

      {/* 4. Linear Dialogue Layer */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <OmniChat />
      </div>

      {/* 5. Spatial Portal Layer */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <MapPortal />
      </div>

      {/* iOS Wake Lock Fallback: 1×1 silent looping video keeps iOS screen alive */}
      <video
        src="/silent.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
      />
    </div>
  );
};
