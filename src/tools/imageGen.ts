// src/tools/imageGen.ts
// Image generation via Pollinations.AI — free, no API key, production-grade.
// Falls back to Stable Diffusion WebUI on kvm2 if available.
import axios from 'axios';

export interface ImageGenArgs {
  prompt: string;
  style?: string;
}

export interface ImageGenResult {
  url: string;
}

/**
 * generate_image tool.
 * Primary: Pollinations.AI public API (https://image.pollinations.ai)
 *   - No key, no rate limit for reasonable use, returns JPEG directly.
 * Fallback: Stable Diffusion WebUI on kvm2:7860.
 */
export async function generateImage(args: ImageGenArgs): Promise<ImageGenResult> {
  const fullPrompt = args.style
    ? `${args.prompt}, style: ${args.style}`
    : args.prompt;

  // ── Primary: Pollinations.AI ──────────────────────────────────────────────
  // Returns a direct image URL — no base64 needed, canvas <img> renders it as-is.
  try {
    const encoded = encodeURIComponent(fullPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
    // HEAD confirms the endpoint is reachable before returning the URL
    await axios.head(url, { timeout: 10000 });
    console.log(`[imageGen] Pollinations URL: ${url}`);
    return { url };
  } catch (primaryErr) {
    console.warn('[imageGen] Pollinations unavailable, trying kvm2 SD:', primaryErr);
  }

  // ── Fallback: Stable Diffusion WebUI ─────────────────────────────────────
  try {
    const sdResp = await axios.post(
      'http://kvm2:7860/sdapi/v1/txt2img',
      {
        prompt: fullPrompt,
        negative_prompt: 'blurry, low quality, watermark, text, ugly',
        steps: 20,
        width: 768,
        height: 768,
        cfg_scale: 7,
        sampler_name: 'DPM++ 2M Karras',
      },
      { timeout: 60000 }
    );
    const b64: string = sdResp.data.images?.[0];
    if (!b64) throw new Error('SD returned no images');
    return { url: `data:image/png;base64,${b64}` };
  } catch (fallbackErr) {
    const msg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
    throw new Error(`Image generation failed — Pollinations and kvm2 SD both unreachable: ${msg}`);
  }
}
