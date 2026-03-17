// convex/system.ts
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const pulse = internalMutation({
  handler: async (ctx) => {
    const state = await ctx.db.query("system_state").first();
    if (!state) return;

    const baseline = 0.2;
    const hormones = { ...state.hormones };

    // Linear decay toward baseline (values return to baseline via linear decay calculated every 60s)
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
