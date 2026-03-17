// convex/evaporation.ts
import { internalMutation } from "./_generated/server";

export const sweep = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const state = await ctx.db.query("system_state").first();
    const isDeepSleep = state?.status === "asleep" && state?.sleepPhase === "deep";
    
    const tables = ["visual_pheromones", "audio_pheromones", "somatic_pheromones"] as const;
    
    for (const table of tables) {
      // Normal evaporation (indexed query)
      const expired = await ctx.db
        .query(table)
        .withIndex("by_expiration", (q) => q.lt("expiresAt", now))
        .take(100); // Batching to avoid transaction limits
      
      for (const doc of expired) {
        await ctx.db.delete(doc._id);
      }
      
      // Phase C: Tripled rate in Deep Sleep (simulated by pruning pheromones expiring in next 10s)
      if (isDeepSleep) {
        const soonToExpire = await ctx.db
          .query(table)
          .withIndex("by_expiration", (q) => q.lt("expiresAt", now + 10000))
          .take(100);
        for (const doc of soonToExpire) {
          await ctx.db.delete(doc._id);
        }
      }
    }
  },
});
