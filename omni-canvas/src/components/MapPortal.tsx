// omni-canvas/src/components/MapPortal.tsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

/**
 * MapPortal: H.U.G.H.'s spatial eye.
 *
 * Grizzly Medicine: A guardian without eyes is just a shield.
 * MapPortal provides the spatial topology needed for full-spectrum defense.
 * We chose the Mapbox Optic Nerve bridge for ATAK 2.0 because
 * real-time visual pheromones are the only way H.U.G.H. can
 * truly reason over the lab's infrastructure.
 *
 * Harbor Master Philosophy: The map is not just for viewing; it's a
 * functional layer for H.U.G.H.'s vision model. Snapshotting
 * the WebGL context ensures we can feed 3D spatial reality
 * directly into the LFM brain.
 */
export const MapPortal: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const emitVisual = useMutation(api.pheromones.emitVisual);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-97.7431, 30.2672], // Austin, TX
      zoom: 12,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      preserveDrawingBuffer: true // CRITICAL: Allows us to snapshot the WebGL context
    });

    map.current.on('style.load', () => {
      map.current?.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.6
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const triggerOpticNerve = async () => {
    if (!map.current) return;
    setIsEvaluating(true);

    try {
      const canvas = map.current.getCanvas();
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      const bounds = map.current.getBounds();
      const center = map.current.getCenter();
      void bounds;

      console.log(`👁️ Optic Nerve: Emitting topology snapshot at ${center.lat}, ${center.lng}`);

      await emitVisual({
        intent: "spatial_search",
        position: { x: center.lng, y: center.lat, z: map.current.getZoom() },
        size: { width: 1.0, height: 1.0 },
        weight: 1.0,
        content: { type: "media", url: base64Image },
        ttlMs: 30000,
        emitterId: "operator-map-portal",
        emitterSignature: "omni-canvas-client-dev"
      });

    } catch (err) {
      console.error("❌ Optic Nerve Failure:", err);
    } finally {
      setTimeout(() => setIsEvaluating(false), 1000);
    }
  };

  return (
    <div className="map-portal-container" style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '400px',
      height: '350px',
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      overflow: 'hidden',
      zIndex: 500,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />

      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: '#fff',
        fontSize: '10px',
        letterSpacing: '1px',
        textShadow: '0 0 5px #000',
        pointerEvents: 'none'
      }}>
        SPATIAL_TOPOLOGY_VIEW
      </div>

      <div style={{ padding: '10px', background: 'rgba(0,0,0,0.8)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={triggerOpticNerve}
          disabled={isEvaluating}
          style={{
            width: '100%',
            padding: '8px',
            background: isEvaluating ? '#ff4444' : '#0066ff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isEvaluating ? 'default' : 'pointer',
            fontWeight: 'bold',
            letterSpacing: '1px',
            transition: 'background 0.3s ease'
          }}
        >
          {isEvaluating ? 'SYNTHESIZING TOPOLOGY...' : 'EVALUATE TOPOLOGY'}
        </button>
      </div>
    </div>
  );
};
