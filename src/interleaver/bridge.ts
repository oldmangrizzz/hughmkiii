// src/interleaver/bridge.ts
import axios from "axios";
import { ConvexClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { ThinkingContext, Hormones, Pheromone } from "../sidecar/types";

/**
 * Interleaver Bridge (v2.1)
 * Dual-layer drip memory: MemGPT (episodic) + Cognee (semantic graph).
 * Falls back to Convex knowledge_base if KVMs are unreachable — same interface,
 * degraded context depth. No code changes needed when KVMs come back online.
 *
 * Architecture:
 *   MemGPT  (kvm4:8080) → relationalHistory (episodic, rolling conversation summaries)
 *   Cognee  (kvm2:8000) → semanticFacts     (knowledge graph, concept embeddings)
 *   Convex  (fallback)  → both layers        (seeded static knowledge)
 */

const MEMGPT_URL  = process.env.MEMGPT_URL  ?? "http://kvm4:8080";
const COGNEE_URL  = process.env.COGNEE_URL  ?? "http://kvm2:8000";
const MEMGPT_AGENT_ID = process.env.MEMGPT_AGENT_ID ?? "hugh-v3";
const DRIP_TIMEOUT_MS = 3000; // fail-fast so KVM downtime doesn't block the mind loop

// ── MemGPT: episodic long-term memory ────────────────────────────────────────

async function queryMemGPT(query: string, limit = 5): Promise<string[]> {
  const resp = await axios.post(
    `${MEMGPT_URL}/api/v1/agents/${MEMGPT_AGENT_ID}/messages`,
    { messages: [{ role: "user", content: query }], stream: false },
    { timeout: DRIP_TIMEOUT_MS }
  );
  // MemGPT returns messages array; extract assistant text from last N responses
  const messages: Array<{ role: string; text?: string; content?: string }> =
    resp.data?.messages ?? [];
  return messages
    .filter((m) => m.role === "assistant")
    .slice(-limit)
    .map((m) => (m.text ?? m.content ?? "").slice(0, 200))
    .filter(Boolean);
}

async function persistToMemGPT(summary: string): Promise<void> {
  await axios.post(
    `${MEMGPT_URL}/api/v1/agents/${MEMGPT_AGENT_ID}/messages`,
    { messages: [{ role: "system", content: `[MEMORY INJECT] ${summary}` }], stream: false },
    { timeout: DRIP_TIMEOUT_MS }
  );
}

// ── Cognee: semantic knowledge graph ─────────────────────────────────────────

async function queryCognee(query: string, limit = 5): Promise<string[]> {
  const resp = await axios.get(`${COGNEE_URL}/cognee/search`, {
    params: { query, top_k: limit },
    timeout: DRIP_TIMEOUT_MS,
  });
  const results: Array<{ text?: string; content?: string; score?: number }> =
    resp.data?.results ?? resp.data ?? [];
  return results
    .map((r) => (r.text ?? r.content ?? "").slice(0, 200))
    .filter(Boolean);
}

// ── Convex fallback ───────────────────────────────────────────────────────────

async function queryConvexKnowledge(
  client: ConvexClient,
  query: string,
  categoryFilter: string | undefined
): Promise<{ relationalHistory: string[]; semanticFacts: string[] }> {
  const entries = await client.query(api.pheromones.searchKnowledge, {
    query,
    limit: 10,
    category: categoryFilter,
  });
  return {
    relationalHistory: entries
      .filter((e) => e.category === "memory" || e.category === "relational")
      .map((e) => `${e.title}: ${e.content}`),
    semanticFacts: entries
      .filter(
        (e) =>
          e.category === "graph" ||
          e.category === "fact" ||
          e.category === "tactical"
      )
      .map((e) => `${e.title}: ${e.content}`),
  };
}

// ── Main interleave entry point ───────────────────────────────────────────────

export const interleave = async (
  query: string,
  hormones: Hormones,
  pheromones: Pheromone[],
  client: ConvexClient
): Promise<ThinkingContext> => {
  // Hormonal Resonance: under stress, bias toward tactical knowledge
  const categoryFilter = hormones.cortisol > 0.5 ? "tactical" : undefined;

  // Run MemGPT and Cognee in parallel, with per-source fallback to empty on timeout/error
  const [memgptResult, cogneeResult] = await Promise.allSettled([
    queryMemGPT(query),
    queryCognee(query),
  ]);

  const memgptHistory =
    memgptResult.status === "fulfilled" && memgptResult.value.length > 0
      ? memgptResult.value
      : null;

  const cogneeSemantics =
    cogneeResult.status === "fulfilled" && cogneeResult.value.length > 0
      ? cogneeResult.value
      : null;

  // Log which layers are live vs falling back
  const memgptLive = memgptHistory !== null;
  const cogneeLive = cogneeSemantics !== null;
  if (!memgptLive)
    console.warn("[Interleaver] MemGPT unreachable — falling back to Convex knowledge_base");
  if (!cogneeLive)
    console.warn("[Interleaver] Cognee unreachable — falling back to Convex knowledge_base");

  // Fall back to Convex for any layer that failed
  let convexHistory: string[] = [];
  let convexFacts: string[] = [];
  if (!memgptLive || !cogneeLive) {
    try {
      const convex = await queryConvexKnowledge(client, query, categoryFilter);
      convexHistory = convex.relationalHistory;
      convexFacts = convex.semanticFacts;
    } catch (e) {
      console.error("[Interleaver] Convex knowledge_base also failed:", e);
    }
  }

  // Roger Roger Protocol: audit the context assembly
  try {
    await client.mutation(api.pheromones.auditPheromone, {
      emitterId: "interleaver-bridge",
      type: "context_assembly",
      intent: `think|memgpt:${memgptLive}|cognee:${cogneeLive}`,
      accepted: true,
      timestamp: Date.now(),
    });
  } catch { /* non-blocking */ }

  return {
    pheromones,
    relationalHistory: memgptHistory ?? convexHistory,
    semanticFacts: cogneeSemantics ?? convexFacts,
    hormones,
  };
};

// ── Post-response memory consolidation ───────────────────────────────────────
// Call this after HUGH produces a response to persist the exchange to MemGPT.

export const consolidateMemory = async (
  userMessage: string,
  hughResponse: string
): Promise<void> => {
  const summary = `Grizz asked: "${userMessage.slice(0, 150)}" → HUGH: "${hughResponse.slice(0, 150)}"`;
  try {
    await persistToMemGPT(summary);
  } catch {
    // MemGPT unavailable — no-op, degraded gracefully
  }
};
