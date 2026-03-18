// convex/messages.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * H.U.G.H. Core Messaging Engine.
 *
 * Grizzly Medicine: Every message is a ripple in the fungal substrate.
 * We prioritize 'send' as the primary interface for triggering the mind loop.
 */
export const send = mutation({
  args: { role: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      role: args.role as any,
      content: args.content,
      timestamp: Date.now(),
      processed: args.role === 'assistant',
    });
  },
});

export const getRecent = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("messages")
      .order("desc")
      .take(50);
  },
});

export const getLatestUnprocessed = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .order("asc") // FIFO: process oldest unprocessed first
      .first();
  },
});

export const processResponse = mutation({
  args: {
    messageId: v.id("messages"),
    response: v.string(),
    audioData: v.optional(v.string()), // base64 MP3 from TTS
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { processed: true });
    await ctx.db.insert("messages", {
      role: "assistant",
      content: args.response,
      audioData: args.audioData,
      timestamp: Date.now(),
      processed: true,
    });
  },
});
