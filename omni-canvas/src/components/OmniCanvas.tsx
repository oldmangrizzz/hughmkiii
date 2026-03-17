// omni-canvas/src/components/OmniCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DigitalPsyche } from '../middleware/mycelium';
import { OmniChat } from './OmniChat';
import { MapPortal } from './MapPortal';

/**
 * OmniCanvas: The infinitely modular expandable canvas.
 * Instead of a linear chat, this renders the Stigmergic UI via Clifford Attractors.
 */
export const OmniCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pheromones = useQuery(api.pheromones.getActiveVisual);
  const somatic = useQuery(api.pheromones.getActiveSomatic);
  const [psyche] = useState(() => new DigitalPsyche(
    process.env.CONVEX_URL!, 
    process.env.LFM_URL!
  ));

  useEffect(() => {
    // Initial Mycelial Binding
    psyche.bindNetwork();

    // WebGPU Compute Shader Pipeline (Clifford Attractor)
    // 100,000 Particles — "The Engram Substrate"
    const initWebGPU = async () => {
      if (!navigator.gpu) {
        console.warn("⚠️ WebGPU not detected. Falling back to Canvas2D/WebGL.");
        return;
      }
      
      const adapter = await navigator.gpu.requestAdapter();
      const device = await adapter?.requestDevice();
      // ... [Shader logic to implement CLIFFORD_ATTRACTOR_SHADER] ...
    };

    initWebGPU();
  }, []);

  // CLIFFORD ATTRACTOR STATE PARAMETERS (From Whitepaper)
  const getAttractorParams = (intent: string) => {
    switch (intent) {
      case 'media_playback': return { a: 0.0, b: 0.0, c: 1.0, d: 1.0 }; // Media Plane Collapse
      case 'text_display':   return { a: -1.7, b: 1.3, c: -0.1, d: -1.2 }; // Spatial Text Clustering
      case 'alert':          return { a: 2.0, b: -1.8, c: 0.3, d: 1.5 }; // Rapid Oscillation
      default:               return { a: -1.4, b: 1.6, c: 1.0, d: 0.7 }; // Idle / Ambient Search
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
      {/* 1. The Living Vortex Field (WebGPU Canvas) */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />

      {/* 2. Crystallized Content Projection (The OmniCanvas Panels) */}
      <div className="crystallization-layer" style={{ position: 'absolute', pointerEvents: 'none' }}>
        {pheromones?.map((phero) => (
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
            {/* ... other content types ... */}
          </div>
        ))}
      </div>

      {/* 3. The Somatic Overlay (Sensation Feed) */}
      <div className="somatic-layer" style={{ 
        position: 'absolute', 
        inset: 0, 
        pointerEvents: 'none',
        boxShadow: somatic?.some(s => s.source === 'latency') ? 'inset 0 0 100px rgba(0, 100, 255, 0.3)' : 'none'
      }} />

      {/* 4. The Linear Dialogue Layer */}
      <OmniChat />

      {/* 5. The Spatial Portal Layer */}
      <MapPortal />
    </div>
  );
};
