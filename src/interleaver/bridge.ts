// src/interleaver/bridge.ts
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { ThinkingContext, Hormones, Pheromone } from "../sidecar/types";

/**
 * Interleaver Bridge (v2.0)
 * The Mycelial connector that fuses long-term memory and semantic graphs
 * into a single holographic context for H.U.G.H.'s thinking cycles.
 *
 * FIX: Removed 'telepathy' (direct axios calls). Now queries the substrate.
 * FIX: Implemented 'Hormonal Resonance' for context prioritization.
 */

export const interleave = async (
  query: string,
  hormones: Hormones,
  pheromones: Pheromone[],
  client: ConvexClient
): Promise<ThinkingContext> => {
  try {
    // 1. Hormonal Resonance: Shift focus if cortisol is high (Emergency/Tactical bias)
    const categoryFilter = hormones.cortisol > 0.5 ? 'tactical' : undefined;

    // 2. Query the stigmergic substrate for relevant knowledge (query-aware)
    const knowledgeEntries = await client.query(api.pheromones.searchKnowledge, {
      query,
      limit: 10,
      category: categoryFilter
    });

    // 3. Partition entries into history and facts
    const relationalHistory = knowledgeEntries
      .filter(e => e.category === 'memory' || e.category === 'relational')
      .map(e => `${e.title}: ${e.content}`);

    const semanticFacts = knowledgeEntries
      .filter(e => e.category === 'graph' || e.category === 'fact' || e.category === 'tactical')
      .map(e => `${e.title}: ${e.content}`);

    // 4. Roger Roger Protocol: Audit the context assembly event
    await client.mutation(api.pheromones.auditPheromone, {
      emitterId: "interleaver-bridge",
      type: "context_assembly",
      intent: "think",
      accepted: true,
      timestamp: Date.now()
    });

    return {
      pheromones,
      relationalHistory,
      semanticFacts,
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
