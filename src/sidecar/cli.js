/**
 * src/sidecar/cli.js: H.U.G.H. Tactical CLI.
 * 
 * Grizzly Medicine: The command line is the most direct interface for 
 * an operator with Highland grit. No fluff, just raw intent.
 * 
 * Harbor Master Philosophy: The sidecar thinking loop must be 
 * accessible from anywhere. This CLI provides a sovereign bridge 
 * between the terminal and H.U.G.H.'s memory (Convex).
 */
const { ConvexClient } = require("convex/browser");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Polyfill for WebSocket
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const client = new ConvexClient(process.env.CONVEX_URL);
const query = process.argv.slice(2).join(" ");

if (!query) {
  console.log("⚓ H.U.G.H.: Aye? You called? Give me a command or I'm going back to the perimeter.");
  process.exit(0);
}

async function talkToHugh() {
  const { api } = require("../../convex/_generated/api");
  
  console.log("🧠 H.U.G.H.: Thinking...");
  
  // Drop the message into the messages table
  await client.mutation(api.messages.send, {
    role: "user",
    content: query
  });

  // Listen for the assistant response
  client.subscribe(api.messages.getRecent, {}, (msgs) => {
    const latest = msgs[0];
    if (latest && latest.role === "assistant") {
      console.log(`\n🗣️ H.U.G.H.: ${latest.content}`);
      process.exit(0);
    }
  });
}

talkToHugh().catch(err => {
  console.error("❌ H.U.G.H. Link Error:", err.message);
  process.exit(1);
});
