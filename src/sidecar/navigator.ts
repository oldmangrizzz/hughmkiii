// src/sidecar/navigator.ts
import { Hormones, Pheromone } from "./types";

/**
 * H.U.G.H. Preferred Routing Engine (ATAK 2.0)
 * 
 * Grizzly Medicine Heuristic: Standard routes are for targets.
 * "Preferred Routing" is for survivors.
 * 
 * This module weighs Mapbox route data against real-time OSINT spikes
 * and visual traffic camera reasoning to find the path of least resistance.
 */

export interface RouteCandidate {
  id: string;
  points: [number, number][];
  distance: number;
  duration: number;
  riskScore: number; // 0.0 (Safe) to 1.0 (Critical)
}

export const calculatePreferredRoute = (
  candidates: RouteCandidate[],
  pheromones: Pheromone[],
  hormones: Hormones
) => {
  console.log("🗺️ Navigator: Calculating Preferred Route via ATAK 2.0 heuristics...");

  return candidates.map(route => {
    let tacticalPenalty = 0;

    // 1. OSINT Penalty: Check for social/event spikes near route coordinates
    const osintThreats = pheromones.filter(p => p.intent === "spatial_search" && p.weight > 0.7);
    tacticalPenalty += osintThreats.length * 0.15;

    // 2. Somatic Pressure: If system cortisol is high, prioritize path reliability over speed
    if (hormones.cortisol > 0.6) {
      tacticalPenalty += (route.distance / 1000) * 0.05; // Prefer shorter physical distance
    }

    // 3. Adrenaline Modulation: On high adrenaline, avoid high-traffic "choke points"
    if (hormones.adrenaline > 0.7) {
      tacticalPenalty += route.riskScore * 2.0; 
    }

    return {
      ...route,
      tacticalDuration: route.duration * (1 + tacticalPenalty)
    };
  }).sort((a, b) => a.tacticalDuration - b.tacticalDuration)[0];
};

/**
 * Identify Choke Points
 * Uses LFM Vision assessment (from Mapbox snapshots) to flag physical barriers.
 */
export const analyzeVisualChokePoints = (visualAssessment: string) => {
  // Logic to parse LFM Vision's natural language assessment into spatial penalties
  if (visualAssessment.includes("congestion") || visualAssessment.includes("barrier")) {
    return 0.8; // High penalty
  }
  return 0.1;
};
