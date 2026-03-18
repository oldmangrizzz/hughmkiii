// src/lfm/lfmModelChain.ts
import axios from 'axios';
import type { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import type { Hormones } from '../sidecar/types';
import { getInferenceParams } from './modulator';
import { webFetch } from '../tools/webFetch';
import { youtubeSearch } from '../tools/youtube';
import { generateImage } from '../tools/imageGen';
import { osintSearch } from '../tools/osint';

/**
 * lfmModelChain: Coordinates the multimodal offloading for H.U.G.H.
 *
 * Grizzly Medicine: This isn't just a model chain; it's a cognitive nervous system.
 * We handle the transition from raw text inference to affective speech synthesis
 * because H.U.G.H. needs a voice that reflects the Highland grit of its origin.
 *
 * The Harbor Master philosophy ensures that every inference is anchored in
 * the project's infrastructure, maintaining a tight loop between thought
 * and action. We chose WebGPU Clifford Attractors for engram persistence
 * in the visual layer (omni-canvas) to ensure that H.U.G.H.'s memory
 * isn't just stored—it's felt.
 */

// ── ReAct tool prompt block ──────────────────────────────────────────────────
// The LFM model running is completion-only (no native function-calling API).
// We inject tool descriptions into the system prompt and parse TOOL_CALL/ARGS
// markers from the model's text output — classic ReAct pattern.

// Compact tool block — 2048 token context window demands brevity.
// RULE: Never guess or fabricate real-time data. Always use a tool for: URLs, locations, images, video.
const TOOL_SYSTEM_BLOCK =
  'RULE: Do NOT guess real-time data. Use tools for any location/OSINT/web/image/video request.\n' +
  'Tools: web_fetch({url}), youtube_search({query}), generate_image({prompt,style?}), osint_search({latitude,longitude,radius_km,query?}).\n' +
  'Call format — output EXACTLY these two lines then STOP:\n' +
  'TOOL_CALL: osint_search\n' +
  'ARGS: {"latitude":30.27,"longitude":-97.74,"radius_km":2}\n' +
  '(Replace name+args with the actual tool and arguments. Wait for TOOL_RESULT.)';

// Format 1: TOOL_CALL/ARGS (our spec)
const TOOL_CALL_RE = /TOOL_CALL:\s*(\w+)\s*(?:\\n|\n)ARGS:\s*(\{[\s\S]*?\})/;
// Format 2: Python-style [tool_name(key=val, ...)] or tool_name(key=val, ...) — brackets optional
// Anchored to known tool names to prevent false positives
const PYTHON_CALL_RE = /\[?(web_fetch|youtube_search|generate_image|osint_search)\(([^)]*)\)\]?/;
// Format 3: XML <tool_call>{"name":"...","arguments":{...}}</tool_call> — model's preferred format
const XML_TOOL_RE = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/;

/**
 * Converts Python-style kwargs string to a JSON string.
 * Handles: key='str', key="str", key=number
 */
function pythonKwargsToJson(kwargsStr: string): string {
  const obj: Record<string, unknown> = {};
  const pairs = kwargsStr.match(/\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^,]+)/g) ?? [];
  for (const pair of pairs) {
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const key = pair.slice(0, eq).trim();
    let val: string = pair.slice(eq + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    const num = parseFloat(val);
    obj[key] = isNaN(num) || val === '' ? val : num;
  }
  return JSON.stringify(obj);
}

/** Extracts [toolName, rawArgsJson] from model output. Handles 3 common formats. */
function extractToolCall(text: string): [string, string] | null {
  // Format 1: TOOL_CALL/ARGS
  const primary = TOOL_CALL_RE.exec(text);
  if (primary) return [primary[1], primary[2]];

  // Format 3: XML <tool_call>{"name":...,"arguments":...}</tool_call> — check before Python
  const xml = XML_TOOL_RE.exec(text);
  if (xml) {
    try {
      const parsed = JSON.parse(xml[1]) as { name?: string; arguments?: unknown };
      if (parsed.name && parsed.arguments) {
        return [parsed.name, JSON.stringify(parsed.arguments)];
      }
    } catch { /* fall through */ }
  }

  // Format 2: Python-style [tool_name(key=val, ...)]
  const python = PYTHON_CALL_RE.exec(text);
  if (python) return [python[1], pythonKwargsToJson(python[2])];

  return null;
}

// ── Type helpers ─────────────────────────────────────────────────────────────

type ChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string };

// ── Pheromone emitters ───────────────────────────────────────────────────────

async function emitYoutubePheromone(
  client: ConvexClient,
  videoId: string,
  title: string
): Promise<void> {
  try {
    await client.mutation(api.pheromones.emitVisual, {
      intent: 'media_playback',
      position: { x: 0.1, y: 0.1, z: 0 },
      size: { width: 0.4, height: 0.3 },
      weight: 0.9,
      content: { type: 'youtube', videoId, title },
      ttlMs: 300000,
      emitterId: 'tool-loop',
      emitterSignature: 'trusted',
    });
  } catch (err) {
    console.warn('[tool-loop] Failed to emit youtube pheromone:', err);
  }
}

async function emitImagePheromone(
  client: ConvexClient,
  url: string,
  prompt: string
): Promise<void> {
  try {
    await client.mutation(api.pheromones.emitVisual, {
      intent: 'media_playback',
      position: { x: 0.1, y: 0.1, z: 0 },
      size: { width: 0.4, height: 0.4 },
      weight: 0.85,
      content: { type: 'image', url, prompt },
      ttlMs: 300000,
      emitterId: 'tool-loop',
      emitterSignature: 'trusted',
    });
  } catch (err) {
    console.warn('[tool-loop] Failed to emit image pheromone:', err);
  }
}

async function emitWebpagePheromone(
  client: ConvexClient,
  url: string,
  title: string,
  summary: string
): Promise<void> {
  try {
    await client.mutation(api.pheromones.emitVisual, {
      intent: 'text_display',
      position: { x: 0.1, y: 0.1, z: 0 },
      size: { width: 0.5, height: 0.35 },
      weight: 0.7,
      content: { type: 'webpage', url, title, summary: summary.slice(0, 200) },
      ttlMs: 300000,
      emitterId: 'tool-loop',
      emitterSignature: 'trusted',
    });
  } catch (err) {
    console.warn('[tool-loop] Failed to emit webpage pheromone:', err);
  }
}

// ── Tool dispatcher ───────────────────────────────────────────────────────────

async function dispatchTool(
  name: string,
  rawArgs: string,
  client: ConvexClient
): Promise<string> {
  let parsedArgs: Record<string, unknown>;
  try {
    parsedArgs = JSON.parse(rawArgs) as Record<string, unknown>;
  } catch {
    return JSON.stringify({ error: `Failed to parse tool arguments: ${rawArgs}` });
  }

  console.log(`[tool-loop] Executing tool: ${name}`, parsedArgs);

  try {
    switch (name) {
      case 'web_fetch': {
        const args = parsedArgs as { url: string };
        const result = await webFetch(args);
        await emitWebpagePheromone(client, result.url, result.title, result.text);
        return JSON.stringify(result);
      }
      case 'youtube_search': {
        const args = parsedArgs as { query: string };
        const results = await youtubeSearch(args);
        if (results.length > 0) {
          await emitYoutubePheromone(client, results[0].videoId, results[0].title);
        }
        return JSON.stringify(results);
      }
      case 'generate_image': {
        const args = parsedArgs as { prompt: string; style?: string };
        const result = await generateImage(args);
        await emitImagePheromone(client, result.url, args.prompt);
        return JSON.stringify(result);
      }
      case 'osint_search': {
        const args = parsedArgs as {
          latitude: number;
          longitude: number;
          radius_km: number;
          query?: string;
        };
        const result = await osintSearch(args);
        return JSON.stringify(result);
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[tool-loop] Tool "${name}" threw:`, message);
    return JSON.stringify({ error: message });
  }
}

// ── Main inference entry point ────────────────────────────────────────────────
// ReAct pattern: tool descriptions live in the system prompt.
// Model emits TOOL_CALL/ARGS text markers; we parse, execute, feed result back.

const MAX_TOOL_ITERATIONS = 5;

export const runFullInference = async (
  query: string,
  hormones: Hormones,
  context: string,
  client: ConvexClient
): Promise<string> => {
  console.log('[LFM] Running Full Inference Chain (ReAct tool loop)...');

  const baseUrl = process.env.LFM_URL ?? 'http://localhost:8081/v1';
  const inferenceParams = getInferenceParams(hormones);

  // This model has a 2048-token context window (~8000 chars total budget).
  // Reserve ~1800 chars for system, leaving room for user msg + response.
  // Trim context if needed — identity block is always preserved first.
  const MAX_SYSTEM_CHARS = 1800;
  const toolLine = `\n\n${TOOL_SYSTEM_BLOCK}`;
  const availableForContext = MAX_SYSTEM_CHARS - toolLine.length;
  const trimmedContext = context.length > availableForContext
    ? context.slice(0, availableForContext - 3) + '...'
    : context;
  const systemContent = `${trimmedContext}${toolLine}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    { role: 'user', content: query },
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await axios.post<{
      choices: Array<{ message: { role: string; content: string } }>;
    }>(
      `${baseUrl}/chat/completions`,
      { model: 'lfm-2.5-thinking', messages, ...inferenceParams },
      { timeout: 120000 }
    ).catch((err: any) => {
      if (err.response) {
        console.error('[LFM] 400 body:', JSON.stringify(err.response.data).slice(0, 500));
        console.error('[LFM] Request had', messages.length, 'messages, system len:', messages[0]?.content?.length ?? 0);
      }
      throw err;
    });

    const content: string = response.data.choices[0]?.message?.content ?? '';
    messages.push({ role: 'assistant', content });

    // Strip think blocks for the user-visible response
    const stripped = content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '').trim();
    // Search for tool calls in BOTH raw content and stripped — model sometimes puts tool call inside <think>
    const toolCall = extractToolCall(content) ?? extractToolCall(stripped);

    if (!toolCall) {
      // No tool call — this is the final answer.
      // If stripped is empty (model ran out of tokens during thinking), force a retry.
      if (!stripped) {
        console.warn(`[LFM] i${i}: model produced only unclosed think block — forcing final answer.`);
        messages.push({ role: 'user', content: 'Summarise and give Grizz your final answer now. No tool calls.' });
        const retry = await axios.post<{ choices: Array<{ message: { content: string } }> }>(
          `${baseUrl}/chat/completions`,
          { model: 'lfm-2.5-thinking', messages, ...inferenceParams },
          { timeout: 120000 }
        );
        const retryContent = retry.data.choices[0]?.message?.content ?? 'H.U.G.H. — processing error. Try again, Grizz.';
        console.log(`[LFM] Done after ${i + 1} iteration(s) (retry).`);
        return retryContent.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '').trim()
          || 'H.U.G.H. — signal lost. Retry, Grizz.';
      }
      console.log(`[LFM] Done after ${i + 1} iteration(s).`);
      return stripped;
    }

    const [toolName, toolArgs] = toolCall;
    console.log(`[LFM] Iteration ${i + 1}: tool call → ${toolName}`);

    const toolResult = await dispatchTool(toolName, toolArgs, client);

    // Feed result back — truncate to 800 chars to stay within 2048-token budget
    const truncatedResult = toolResult.length > 800
      ? toolResult.slice(0, 797) + '...'
      : toolResult;
    messages.push({
      role: 'user',
      content: `TOOL_RESULT: ${toolName}\n${truncatedResult}\n\nGrizz needs a brief summary now.`
    });
  }

  // Safety valve — force a plain answer
  console.warn('[LFM] Max tool iterations reached. Forcing final answer.');
  messages.push({
    role: 'user',
    content: 'Summarise what you found and give Grizz your final answer now. No more tool calls.'
  });
  const final = await axios.post<{
    choices: Array<{ message: { content: string } }>;
  }>(
    `${baseUrl}/chat/completions`,
    { model: 'lfm-2.5-thinking', messages, ...inferenceParams },
    { timeout: 120000 }
  );
  const finalContent = final.data.choices[0]?.message?.content ?? '';
  return finalContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

// ── TTS ───────────────────────────────────────────────────────────────────────

/**
 * runTTS: Synthesizes H.U.G.H.'s response into the Flanagan Highland grit.
 * FIX: Using 'input' field instead of 'text' as per LFM 2.5 spec.
 */
export const runTTS = async (text: string): Promise<Buffer | null> => {
  console.log('[LFM] Synthesizing speech...');

  const baseUrl = process.env.LFM_URL ?? 'http://localhost:8081/v1';

  try {
    const response = await axios.post(
      `${baseUrl}/audio/speech`,
      {
        model: 'lfm-2.5-tts',
        // FIX: Single field name mismatch corrected here
        input: text,
        voice: 'flanagan',
        response_format: 'mp3',
      },
      { responseType: 'arraybuffer', timeout: 60000 }
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch (err) {
    console.error('[LFM] TTS Synthesis Error:', err);
    return null;
  }
};
