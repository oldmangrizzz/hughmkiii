// convex/init.ts
import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("system_state").first();
    if (existing) return;

    await ctx.db.insert("system_state", {
      status: "waking",
      hormones: {
        cortisol: 0.2,
        dopamine: 0.2,
        adrenaline: 0.2,
      },
      lastPulse: Date.now(),
    });
  },
});
