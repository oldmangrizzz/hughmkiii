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
    category: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("knowledge_base");
    if (args.category) {
      q = q.withIndex("by_category", (idx) => idx.eq("category", args.category!));
    }
    return await q.order("desc").take(args.limit || 5);
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
