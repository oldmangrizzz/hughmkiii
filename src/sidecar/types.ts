// src/sidecar/types.ts
/**
 * PROJECT H.U.G.H. Core Types
 * Defines the structural sinew of the holographic nervous system.
 */

export type Hormones = { 
  cortisol: number; 
  dopamine: number; 
  adrenaline: number 
};

export type Pheromone = { 
  type: "visual" | "somatic"; 
  intent?: string; 
  source?: string; 
  weight: number 
};

export type ThinkingContext = { 
  pheromones: Pheromone[]; 
  relationalHistory: string[]; 
  semanticFacts: string[]; 
  hormones: Hormones 
};
