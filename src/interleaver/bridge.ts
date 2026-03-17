// src/interleaver/bridge.ts
import axios from "axios";
import { ThinkingContext, Hormones, Pheromone } from "../sidecar/types";

/**
 * Interleaver Bridge
 * The Mycelial connector that fuses long-term memory (MemGPT) and semantic graphs (Cognee)
 * into a single holographic context for H.U.G.H.'s thinking cycles.
 */

export const interleave = async (
  query: string, 
  hormones: Hormones, 
  pheromones: Pheromone[]
): Promise<ThinkingContext> => {
  try {
    const memgptUrl = process.env.MEMGPT_URL || "http://kvm4:8080/api";
    const cogneeUrl = process.env.COGNEE_URL || "http://kvm2:8000/api";

    const [memgptRes, cogneeRes] = await Promise.all([
      axios.post(`${memgptUrl}/search`, { query }).catch(err => {
        console.warn("MemGPT bridge failure:", err.message);
        return { data: { results: [] } };
      }),
      axios.post(`${cogneeUrl}/explore`, { query }).catch(err => {
        console.warn("Cognee bridge failure:", err.message);
        return { data: { nodes: [] } };
      })
    ]);

    return {
      pheromones,
      relationalHistory: memgptRes.data.results || [],
      semanticFacts: cogneeRes.data.nodes || [],
      hormones
    };
  } catch (e) {
    console.error("Interleaver bridge fatal error:", e);
    return { 
      pheromones, 
      relationalHistory: [], 
      semanticFacts: [], 
      hormones 
    };
  }
};
