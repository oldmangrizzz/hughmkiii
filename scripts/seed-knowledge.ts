/**
 * H.U.G.H. Knowledge Base Seeder
 *
 * Reads all 9 personality JSONL files and loads them into the Convex
 * knowledge_base table via the Convex HTTP import API.
 *
 * Strategy:
 *   1. Transform each conversation from OpenAI format → knowledge_base schema
 *   2. Write a combined JSONL seed file to /tmp/knowledge_seed.jsonl
 *   3. Call `npx convex import --table knowledge_base --replace --yes` on it
 *
 * Usage:
 *   node scripts/seed-knowledge.js       (compiled)
 *   npx ts-node scripts/seed-knowledge.ts (if ts-node is available)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// ── Configuration ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const TMP_SEED = '/tmp/knowledge_seed.jsonl';

interface FileConfig {
  file: string;
  category: string;
  priority: number;
}

const FILE_MAP: FileConfig[] = [
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface ConvexMessage {
  role: string;
  content: string;
}

interface ConversationLine {
  messages: ConvexMessage[];
}

interface KnowledgeEntry {
  category: string;
  title: string;
  content: string;
  priority: number;
  sourceDoc: string;
  createdAt: number;
  metadata: {
    messageCount: number;
    roles: string[];
  };
}

// ── Core Transform ─────────────────────────────────────────────────────────────

function transformConversation(
  conv: ConversationLine,
  config: FileConfig
): KnowledgeEntry | null {
  const messages = conv.messages;
  if (!messages || messages.length === 0) return null;

  // Find first user message for the title
  const firstUser = messages.find((m) => m.role === 'user');
  const rawTitle = firstUser?.content ?? messages[0].content;
  const title = rawTitle.trim().slice(0, 80);

  // Join all messages as [ROLE]: content\n\n
  const content = messages
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content.trim()}`)
    .join('\n\n');

  return {
    category: config.category,
    title,
    content,
    priority: config.priority,
    sourceDoc: config.file,
    createdAt: Date.now(),
    metadata: {
      messageCount: messages.length,
      roles: [...new Set(messages.map((m) => m.role))],
    },
  };
}

// ── File Reader ────────────────────────────────────────────────────────────────

async function processFile(
  config: FileConfig,
  writer: fs.WriteStream,
  startIndex: number
): Promise<number> {
  const filePath = path.join(ROOT, config.file);

  if (!fs.existsSync(filePath)) {
    console.warn(`  [WARN] File not found, skipping: ${filePath}`);
    return 0;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let fileCount = 0;
  let globalIdx = startIndex;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let parsed: ConversationLine;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      console.warn(`  [WARN] Failed to parse line in ${config.file}: ${trimmed.slice(0, 60)}...`);
      continue;
    }

    const entry = transformConversation(parsed, config);
    if (!entry) continue;

    writer.write(JSON.stringify(entry) + '\n');

    const shortTitle = entry.title.length > 60
      ? entry.title.slice(0, 57) + '...'
      : entry.title;

    console.log(`  [${globalIdx}] Inserted: "${shortTitle}" (${config.category})`);
    fileCount++;
    globalIdx++;
  }

  return fileCount;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('H.U.G.H. Knowledge Base Seeder');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Root: ${ROOT}`);
  console.log(`Seed file: ${TMP_SEED}`);
  console.log('');

  // Create the output stream
  const writer = fs.createWriteStream(TMP_SEED, { encoding: 'utf8', flags: 'w' });

  let totalEntries = 0;
  let totalFiles = 0;

  for (const config of FILE_MAP) {
    console.log(`Processing ${config.file} → [${config.category}] (priority: ${config.priority})`);
    const count = await processFile(config, writer, totalEntries + 1);
    console.log(`  → ${count} entries from ${config.file}`);
    console.log('');
    totalEntries += count;
    if (count > 0) totalFiles++;
  }

  // Close the write stream
  await new Promise<void>((resolve, reject) => {
    writer.end((err?: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });

  console.log('══════════════════════════════════════════════════════════════');
  console.log(`Seed file written: ${TMP_SEED} (${totalEntries} entries)`);
  console.log('');

  if (totalEntries === 0) {
    console.error('[ERROR] No entries generated — aborting import.');
    process.exit(1);
  }

  // ── Import via Convex CLI ──────────────────────────────────────────────────
  console.log('Importing into Convex knowledge_base table...');
  console.log('  Command: npx convex import --table knowledge_base --replace --yes');
  console.log('');

  try {
    const output = execSync(
      `cd ${ROOT} && npx convex import --table knowledge_base --replace --yes ${TMP_SEED}`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 120_000,
      }
    );
    console.log(output);
  } catch (err: any) {
    const stderr = err.stderr ?? '';
    const stdout = err.stdout ?? '';
    console.error('[ERROR] Convex import failed:');
    if (stdout) console.error('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);
    process.exit(1);
  }

  console.log('');
  console.log(`Seeded ${totalEntries} knowledge entries across ${totalFiles} files`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
