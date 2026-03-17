// src/sidecar/types.ts
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
