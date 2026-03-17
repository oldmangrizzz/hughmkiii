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
      processed: args.role === 'assistant', // Assistant responses are already "processed"
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
      .order("asc") // FIFO: process the oldest unprocessed message first
      .first();
  },
});

export const processResponse = mutation({
  args: { messageId: v.id("messages"), response: v.string() },
  handler: async (ctx, args) => {
    // Mark the user message as processed
    await ctx.db.patch(args.messageId, { processed: true });
    
    // Insert the assistant's response
    await ctx.db.insert("messages", {
      role: "assistant",
      content: args.response,
      timestamp: Date.now(),
      processed: true, // Assistant responses don't need further processing by the sidecar
    });
  },
});
