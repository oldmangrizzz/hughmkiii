// convex/system.ts
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * H.U.G.H. System State Management.
 * 
 * Grizzly Medicine: Baseline hormones return linearly every 60s pulse.
 * This is the physiological heartbeat of the sidecar.
 */
export const getSystemState = query({
  handler: async (ctx) => {
    return await ctx.db.query("system_state").first();
  },
});

export const updateStatus = mutation({
  args: { 
    status: v.union(v.literal("waking"), v.literal("thinking"), v.literal("asleep"), v.literal("interrogation")) 
  },
  handler: async (ctx, args) => {
    const state = await ctx.db.query("system_state").first();
    if (!state) throw new Error("Not initialized");
    await ctx.db.patch(state._id, { status: args.status });
  },
});

export const pulse = internalMutation({
  handler: async (ctx) => {
    const state = await ctx.db.query("system_state").first();
    if (!state) return;

    const baseline = 0.2;
    const hormones = { ...state.hormones };

    // Linear decay toward baseline
    hormones.cortisol = Math.max(baseline, hormones.cortisol - 0.05 / 60);
    hormones.dopamine = Math.max(baseline, hormones.dopamine - 0.1 / 60);
    hormones.adrenaline = Math.max(baseline, hormones.adrenaline - 0.2 / 60);

    await ctx.db.patch(state._id, {
      hormones,
      lastPulse: Date.now(),
    });
  },
});

export const updateHormones = mutation({
  args: {
    cortisolDelta: v.optional(v.float64()),
    dopamineDelta: v.optional(v.float64()),
    adrenalineDelta: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db.query("system_state").first();
    if (!state) throw new Error("Not initialized");

    const hormones = { ...state.hormones };
    if (args.cortisolDelta !== undefined) hormones.cortisol = Math.min(1, Math.max(0, hormones.cortisol + args.cortisolDelta));
    if (args.dopamineDelta !== undefined) hormones.dopamine = Math.min(1, Math.max(0, hormones.dopamine + args.dopamineDelta));
    if (args.adrenalineDelta !== undefined) hormones.adrenaline = Math.min(1, Math.max(0, hormones.adrenaline + args.adrenalineDelta));

    await ctx.db.patch(state._id, { hormones });
  },
});

export const accumulateExperience = mutation({
  args: {
    category: v.union(v.literal("tactical"), v.literal("ethical"), v.literal("infrastructure")),
    intent: v.string(),
    context: v.any(),
    assessment: v.string(),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const state = await ctx.db.query("system_state").first();
    const hormones = state?.hormones || { cortisol: 0.2, dopamine: 0.2, adrenaline: 0.2 };

    return await ctx.db.insert("experiences", {
      ...args,
      timestamp: Date.now(),
      hormonesAtTime: hormones,
    });
  },
});
