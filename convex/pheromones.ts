// convex/pheromones.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { visualIntent, spatialPosition, contentPayload, somaticSource } from "./schema";

export const emitVisual = mutation({
  args: {
    intent: visualIntent,
    position: spatialPosition,
    size: v.object({ width: v.float64(), height: v.float64() }),
    weight: v.float64(),
    content: contentPayload,
    ttlMs: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  },
  handler: async (ctx, { ttlMs, ...args }) => {
    // Initial verification (Actual Soul Anchor crypto integration in Phase 2)
    if (args.emitterSignature === "untrusted") throw new Error("Unsigned");
    return await ctx.db.insert("visual_pheromones", {
      ...args,
      expiresAt: Date.now() + ttlMs,
    });
  },
});

export const emitAudio = mutation({
  args: {
    intent: v.string(),
    transcription: v.optional(v.string()),
    intentVector: v.optional(v.array(v.float64())),
    confidence: v.float64(),
    position: spatialPosition,
    weight: v.float64(),
    ttlMs: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  },
  handler: async (ctx, { ttlMs, ...args }) => {
    return await ctx.db.insert("audio_pheromones", {
      ...args,
      expiresAt: Date.now() + ttlMs,
    });
  },
});

export const emitSomatic = mutation({
  args: {
    source: somaticSource,
    intensity: v.float64(),
    hueShift: v.optional(v.float64()),
    turbulence: v.optional(v.float64()),
    driftSpeed: v.optional(v.float64()),
    position: spatialPosition,
    weight: v.float64(),
    ttlMs: v.number(),
    emitterId: v.string(),
    emitterSignature: v.string(),
  },
  handler: async (ctx, { ttlMs, ...args }) => {
    return await ctx.db.insert("somatic_pheromones", {
      ...args,
      expiresAt: Date.now() + ttlMs,
    });
  },
});

export const getActiveVisual = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("visual_pheromones")
      .withIndex("by_expiration", (q) => q.gt("expiresAt", now))
      .collect();
  },
});

export const getActiveSomatic = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("somatic_pheromones")
      .withIndex("by_expiration", (q) => q.gt("expiresAt", now))
      .collect();
  },
});

/**
 * Query: Search the knowledge base for relevant context.
 * This replaces the direct API calls to Cognee/MemGPT.
 */
export const searchKnowledge = query({
  args: {
    query: v.optional(v.string()),
    category: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;

    // Pull candidates — category-scoped if provided, else top 50 by priority
    const candidates = args.category
      ? await ctx.db
          .query("knowledge_base")
          .withIndex("by_category", (idx) => idx.eq("category", args.category!))
          .order("desc")
          .take(50)
      : await ctx.db.query("knowledge_base").order("desc").take(50);

    // Keyword relevance scoring — score against title + content
    if (args.query && args.query.trim().length > 0) {
      const terms = args.query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2);

      const scored = candidates.map((entry) => {
        const haystack = `${entry.title} ${entry.content}`.toLowerCase();
        const score = terms.reduce(
          (acc, t) => acc + (haystack.includes(t) ? 1 : 0),
          0
        );
        return { entry, score };
      });

      scored.sort(
        (a, b) => b.score - a.score || b.entry.priority - a.entry.priority
      );
      return scored.slice(0, limit).map((s) => s.entry);
    }

    // No query — sort by priority and return top N
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates.slice(0, limit);
  },
});

/**
 * Mutation: Roger Roger Protocol audit log.
 * Named after the battle droids — because Grizz thinks they're funny.
 * Every pheromone emission and context assembly gets logged here for forensic review.
 */
export const auditPheromone = mutation({
  args: {
    emitterId: v.string(),
    type: v.string(),
    intent: v.string(),
    accepted: v.boolean(),
    timestamp: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pheromone_audit", args);
  },
});

/**
 * Mutation: Insert a knowledge base entry (used by seed-knowledge script).
 */
export const insertKnowledge = mutation({
  args: {
    category: v.string(),
    title: v.string(),
    content: v.string(),
    priority: v.number(),
    sourceDoc: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("knowledge_base", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

/**
 * Mutation: Clear all knowledge base entries (for idempotent re-seeding).
 */
export const clearKnowledgeBase = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("knowledge_base").collect();
    await Promise.all(all.map((e) => ctx.db.delete(e._id)));
    return all.length;
  },
});

/**
 * Mutation: Delete a visual pheromone by ID (used by portal close buttons).
 */
export const deleteVisualPheromone = mutation({
  args: { id: v.id("visual_pheromones") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Mutation: Register or heartbeat an agent.
 */
export const heartbeatAgent = mutation({
  args: {
    agentId: v.string(),
    agentType: v.string(),
    hostname: v.optional(v.string()),
    publicKey: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agent_registry")
      .withIndex("by_agent_id", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        isActive: true,
      });
    } else {
      await ctx.db.insert("agent_registry", {
        agentId: args.agentId,
        agentType: args.agentType as any,
        hostname: args.hostname,
        publicKey: args.publicKey,
        lastSeen: Date.now(),
        isActive: true,
      });
    }
  },
});
