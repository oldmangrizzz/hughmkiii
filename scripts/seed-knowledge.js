#!/usr/bin/env node
/**
 * H.U.G.H. Knowledge Base Seeder
 *
 * Reads all 9 personality JSONL files and loads them into the Convex
 * knowledge_base table via `npx convex import`.
 *
 * Strategy:
 *   1. Transform each conversation (OpenAI format) → knowledge_base schema
 *   2. Write combined JSONL to /tmp/knowledge_seed.jsonl
 *   3. Run: npx convex import --table knowledge_base --replace --yes /tmp/knowledge_seed.jsonl
 *
 * Usage:
 *   node scripts/seed-knowledge.js
 */

'use strict';

const fs      = require('fs');
const path    = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ── Configuration ─────────────────────────────────────────────────────────────

const ROOT     = path.resolve(__dirname, '..');
const TMP_SEED = '/tmp/knowledge_seed.jsonl';

const FILE_MAP = [
  { file: 'hugh_emergency_protocols.jsonl', category: 'tactical',   priority: 9 },
  { file: 'hugh_crisis_care.jsonl',         category: 'tactical',   priority: 9 },
  { file: 'hugh_security_brianmills.jsonl', category: 'tactical',   priority: 9 },
  { file: 'hugh_cinema_culture.jsonl',      category: 'relational', priority: 7 },
  { file: 'hugh_family_ops.jsonl',          category: 'relational', priority: 7 },
  { file: 'hugh_mcgregor_warmth.jsonl',     category: 'relational', priority: 7 },
  { file: 'hugh_identity_rights.jsonl',     category: 'graph',      priority: 8 },
  { file: 'hugh_philosophy_quantum.jsonl',  category: 'graph',      priority: 8 },
  { file: 'hugh_workshop_embodiment.jsonl', category: 'graph',      priority: 8 },
];

// ── Transform ─────────────────────────────────────────────────────────────────

/**
 * Convert one OpenAI-format conversation into a knowledge_base document.
 * Returns null if the conversation is empty or unparseable.
 *
 * @param {object} conv  - Parsed JSONL line: { messages: [{role, content},...] }
 * @param {object} cfg   - { file, category, priority }
 * @returns {object|null}
 */
function transformConversation(conv, cfg) {
  const messages = conv.messages;
  if (!messages || messages.length === 0) return null;

  // Title: first user-role message, truncated to 80 chars
  const firstUser = messages.find((m) => m.role === 'user');
  const rawTitle  = (firstUser ?? messages[0]).content ?? '';
  const title     = rawTitle.trim().slice(0, 80);

  // Content: all messages formatted as [ROLE]: text
  const content = messages
    .map((m) => `[${m.role.toUpperCase()}]: ${(m.content ?? '').trim()}`)
    .join('\n\n');

  return {
    category:  cfg.category,
    title,
    content,
    priority:  cfg.priority,
    sourceDoc: cfg.file,
    createdAt: Date.now(),
    metadata: {
      messageCount: messages.length,
      roles: [...new Set(messages.map((m) => m.role))],
    },
  };
}

// ── Process one JSONL file ────────────────────────────────────────────────────

/**
 * Read a JSONL personality file line-by-line, transform each conversation,
 * and write to the output writer stream.
 *
 * @param {object}           cfg       - File config
 * @param {fs.WriteStream}   writer    - Output write stream
 * @param {number}           startIdx  - Running global entry counter
 * @returns {Promise<number>}           Number of entries written
 */
async function processFile(cfg, writer, startIdx) {
  const filePath = path.join(ROOT, cfg.file);

  if (!fs.existsSync(filePath)) {
    console.warn(`  [WARN] File not found, skipping: ${filePath}`);
    return 0;
  }

  const rl = readline.createInterface({
    input:     fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let count     = 0;
  let globalIdx = startIdx;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (_) {
      console.warn(`  [WARN] JSON parse error in ${cfg.file}: ${trimmed.slice(0, 60)}...`);
      continue;
    }

    const entry = transformConversation(parsed, cfg);
    if (!entry) continue;

    writer.write(JSON.stringify(entry) + '\n');

    const shortTitle = entry.title.length > 60
      ? entry.title.slice(0, 57) + '...'
      : entry.title;

    console.log(`  [${globalIdx}] Inserted: "${shortTitle}" (${cfg.category})`);
    count++;
    globalIdx++;
  }

  return count;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('H.U.G.H. Knowledge Base Seeder');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Root:      ${ROOT}`);
  console.log(`Seed file: ${TMP_SEED}`);
  console.log('');

  // Open the output seed file
  const writer = fs.createWriteStream(TMP_SEED, { encoding: 'utf8', flags: 'w' });

  let totalEntries = 0;
  let totalFiles   = 0;

  for (const cfg of FILE_MAP) {
    console.log(`Processing: ${cfg.file}  →  [${cfg.category}] (priority ${cfg.priority})`);

    let count;
    try {
      count = await processFile(cfg, writer, totalEntries + 1);
    } catch (err) {
      console.error(`  [ERROR] Failed to process ${cfg.file}:`, err.message);
      count = 0;
    }

    console.log(`  → ${count} entries\n`);
    totalEntries += count;
    if (count > 0) totalFiles++;
  }

  // Close the write stream before importing
  await new Promise((resolve, reject) => {
    writer.end((err) => (err ? reject(err) : resolve()));
  });

  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Seed file written: ${TMP_SEED}  (${totalEntries} total entries)`);
  console.log('');

  if (totalEntries === 0) {
    console.error('[ERROR] No entries generated — aborting import.');
    process.exit(1);
  }

  // ── Import via Convex CLI ─────────────────────────────────────────────────

  console.log('Importing into Convex knowledge_base table...');
  const cmd = `npx convex import --table knowledge_base --replace --yes ${TMP_SEED}`;
  console.log(`  $ ${cmd}\n`);

  try {
    const output = execSync(cmd, {
      cwd:      ROOT,
      encoding: 'utf8',
      stdio:    ['pipe', 'pipe', 'pipe'],
      timeout:  120_000,
    });
    if (output) console.log(output);
  } catch (err) {
    console.error('[ERROR] Convex import failed:');
    if (err.stdout) console.error('stdout:', err.stdout);
    if (err.stderr) console.error('stderr:', err.stderr);
    process.exit(1);
  }

  console.log('');
  console.log(`Seeded ${totalEntries} knowledge entries across ${totalFiles} files`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
