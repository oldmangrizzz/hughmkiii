// omni-canvas/src/shaders/clifford.ts
//
// H.U.G.H. Living Vortex Field — Clifford Attractor WebGPU implementation.
// 100,000 particles, WGSL compute + render shaders, hormone-driven color/dynamics.
//
// Formula:
//   x' = sin(a * y) + c * cos(a * x)
//   y' = sin(b * x) + d * cos(b * y)

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AttractorParams {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface HormoneState {
  cortisol: number;
  dopamine: number;
  adrenaline: number;
}

export interface CliffordRenderer {
  render(params: AttractorParams, hormones: HormoneState): void;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 100_000;
// Particle struct layout (std430, aligned):
//   position : vec2f  → 8 bytes  (offset 0)
//   velocity : vec2f  → 8 bytes  (offset 8)
//   life     : f32    → 4 bytes  (offset 16)
//   age      : f32    → 4 bytes  (offset 20)
// Total: 24 bytes per particle
const PARTICLE_STRIDE_BYTES = 24;
const WORKGROUP_SIZE = 64;
const WORKGROUP_COUNT = Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE); // 1563

// Params uniform layout (std140 / scalar):
//   a, b, c, d, dt, cortisol, dopamine, adrenaline, time  → 9 × f32 = 36 bytes
//   padded to 48 bytes (next multiple of 16 for WebGPU uniform alignment)
const PARAMS_UNIFORM_BYTES = 48;

// Render uniform layout:
//   aspect : f32, scale : f32, pad0 : f32, pad1 : f32  → 16 bytes
const RENDER_UNIFORM_BYTES = 16;

// ---------------------------------------------------------------------------
// WGSL — Compute Shader
// ---------------------------------------------------------------------------

export const CLIFFORD_COMPUTE_SHADER = /* wgsl */ `
struct Particle {
  position  : vec2<f32>,
  velocity  : vec2<f32>,
  life      : f32,
  age       : f32,
}

struct Params {
  a          : f32,
  b          : f32,
  c          : f32,
  d          : f32,
  dt         : f32,
  cortisol   : f32,
  dopamine   : f32,
  adrenaline : f32,
  time       : f32,
  _pad0      : f32,
  _pad1      : f32,
  _pad2      : f32,
}

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform>             params    : Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let index = global_id.x;
  if (index >= ${PARTICLE_COUNT}u) { return; }

  var p = particles[index];

  // --- Clifford attractor target position ---
  let target_x = sin(params.a * p.position.y) + params.c * cos(params.a * p.position.x);
  let target_y = sin(params.b * p.position.x) + params.d * cos(params.b * p.position.y);
  let target   = vec2<f32>(target_x, target_y);

  // --- Velocity: spring toward attractor, adrenaline boosts convergence speed ---
  let speed    = 0.1 * (1.0 + params.adrenaline);
  p.velocity   = (target - p.position) * speed;
  p.position   = p.position + p.velocity * params.dt;

  // --- Torus wrap: clamp to [-2.5, 2.5] with wrap-around ---
  let bound = 2.5;
  if (p.position.x >  bound) { p.position.x = p.position.x - bound * 2.0; }
  if (p.position.x < -bound) { p.position.x = p.position.x + bound * 2.0; }
  if (p.position.y >  bound) { p.position.y = p.position.y - bound * 2.0; }
  if (p.position.y < -bound) { p.position.y = p.position.y + bound * 2.0; }

  // --- Life / age ---
  p.age  = p.age + 1.0;
  p.life = 1.0 - (p.age / 500.0);

  // --- Reset particle deterministically when it expires ---
  if (p.age > 500.0) {
    let fi    = f32(index);
    p.position = vec2<f32>(
      sin(fi * 0.618033988749895) * 1.5,
      cos(fi * 1.6180339887498951) * 1.5
    );
    p.velocity = vec2<f32>(0.0, 0.0);
    p.life     = 1.0;
    p.age      = 0.0;
  }

  particles[index] = p;
}
`;

// ---------------------------------------------------------------------------
// WGSL — Render Shader
// ---------------------------------------------------------------------------

export const CLIFFORD_RENDER_SHADER = /* wgsl */ `
struct Particle {
  position  : vec2<f32>,
  velocity  : vec2<f32>,
  life      : f32,
  age       : f32,
}

struct RenderUniforms {
  aspect    : f32,
  scale     : f32,
  cortisol  : f32,
  dopamine  : f32,
}

@group(0) @binding(0) var<storage, read> particles      : array<Particle>;
@group(0) @binding(1) var<uniform>       renderUniforms : RenderUniforms;

struct VertexOutput {
  @builtin(position) clip_pos : vec4<f32>,
  @location(0)       color    : vec4<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertex_index : u32) -> VertexOutput {
  let p = particles[vertex_index];

  // Map [-2.5, 2.5] → clip space [-1, 1]
  // X is corrected for aspect ratio so the attractor appears circular, not squashed
  let scale     = renderUniforms.scale;
  let clip_x    = p.position.x * scale / renderUniforms.aspect;
  let clip_y    = p.position.y * scale;

  // --- Hormone-driven color ---
  // Baseline: cool blue-white
  var r = 0.4 + p.life * 0.3;
  var g = 0.5 + p.life * 0.3;
  var b = 0.9 + p.life * 0.1;

  // High cortisol → shift toward crimson
  let c_weight = clamp(renderUniforms.cortisol, 0.0, 1.0);
  r = r + c_weight * (1.0 - r);
  g = g - c_weight * g * 0.7;
  b = b - c_weight * b * 0.8;

  // High dopamine → shift toward emerald
  let d_weight = clamp(renderUniforms.dopamine, 0.0, 1.0);
  r = r - d_weight * r * 0.5;
  g = g + d_weight * (1.0 - g) * 0.8;
  b = b - d_weight * b * 0.4;

  let alpha = clamp(p.life * 0.6, 0.0, 1.0);

  var out : VertexOutput;
  out.clip_pos = vec4<f32>(clip_x, clip_y, 0.0, 1.0);
  out.color    = vec4<f32>(clamp(r, 0.0, 1.0), clamp(g, 0.0, 1.0), clamp(b, 0.0, 1.0), alpha);
  return out;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>) -> @location(0) vec4<f32> {
  return color;
}
`;

// ---------------------------------------------------------------------------
// Intent → AttractorParams
// ---------------------------------------------------------------------------

export function getAttractorParams(intent: string): AttractorParams {
  switch (intent) {
    case 'media_playback': return { a:  0.0,  b:  0.0,  c:  1.0,  d:  1.0  };
    case 'text_display':   return { a: -1.7,  b:  1.3,  c: -0.1,  d: -1.2  };
    case 'alert':          return { a:  2.0,  b: -1.8,  c:  0.3,  d:  1.5  };
    case 'spatial_search': return { a:  1.5,  b: -1.5,  c:  0.5,  d: -0.5  };
    default:               return { a: -1.4,  b:  1.6,  c:  1.0,  d:  0.7  };
  }
}

// ---------------------------------------------------------------------------
// initCliffordPipeline
// ---------------------------------------------------------------------------

export async function initCliffordPipeline(
  canvas: HTMLCanvasElement
): Promise<CliffordRenderer | null> {
  if (!navigator.gpu) {
    console.warn('[CLIFFORD] WebGPU not available — particle field disabled.');
    return null;
  }

  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) {
    console.warn('[CLIFFORD] No WebGPU adapter found.');
    return null;
  }

  const device = await adapter.requestDevice();

  // --- Canvas context ---
  const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
  if (!context) {
    console.warn('[CLIFFORD] Failed to get WebGPU canvas context.');
    return null;
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });

  // -------------------------------------------------------------------------
  // Particle buffer — 100K × 24 bytes
  // -------------------------------------------------------------------------
  const particleBufferSize = PARTICLE_COUNT * PARTICLE_STRIDE_BYTES;
  const particleBuffer = device.createBuffer({
    label: 'clifford-particles',
    size: particleBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  // Initialise with deterministic seeded positions
  {
    const init = new Float32Array(PARTICLE_COUNT * 6); // 6 f32 per particle
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const fi = i;
      const base = i * 6;
      init[base + 0] = Math.sin(fi * 0.618033988749895) * 1.5;  // position.x
      init[base + 1] = Math.cos(fi * 1.6180339887498951) * 1.5; // position.y
      init[base + 2] = 0.0;                                       // velocity.x
      init[base + 3] = 0.0;                                       // velocity.y
      init[base + 4] = 1.0;                                       // life
      init[base + 5] = 0.0;                                       // age
    }
    device.queue.writeBuffer(particleBuffer, 0, init);
  }

  // -------------------------------------------------------------------------
  // Params uniform buffer (compute)
  // -------------------------------------------------------------------------
  const paramsBuffer = device.createBuffer({
    label: 'clifford-params',
    size: PARAMS_UNIFORM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // -------------------------------------------------------------------------
  // Render uniform buffer
  // -------------------------------------------------------------------------
  const renderUniformBuffer = device.createBuffer({
    label: 'clifford-render-uniforms',
    size: RENDER_UNIFORM_BYTES,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // -------------------------------------------------------------------------
  // Compute pipeline
  // -------------------------------------------------------------------------
  const computeShaderModule = device.createShaderModule({
    label: 'clifford-compute',
    code: CLIFFORD_COMPUTE_SHADER,
  });

  const computePipeline = device.createComputePipeline({
    label: 'clifford-compute-pipeline',
    layout: 'auto',
    compute: {
      module: computeShaderModule,
      entryPoint: 'main',
    },
  });

  const computeBindGroup = device.createBindGroup({
    label: 'clifford-compute-bindgroup',
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particleBuffer } },
      { binding: 1, resource: { buffer: paramsBuffer   } },
    ],
  });

  // -------------------------------------------------------------------------
  // Render pipeline — point sprites, additive blend
  // -------------------------------------------------------------------------
  const renderShaderModule = device.createShaderModule({
    label: 'clifford-render',
    code: CLIFFORD_RENDER_SHADER,
  });

  const renderPipeline = device.createRenderPipeline({
    label: 'clifford-render-pipeline',
    layout: 'auto',
    vertex: {
      module: renderShaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: renderShaderModule,
      entryPoint: 'fs_main',
      targets: [
        {
          format,
          blend: {
            // Additive blending: src * 1 + dst * 1 — glowing light accumulation
            color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
          },
        },
      ],
    },
    primitive: {
      topology: 'point-list',
    },
  });

  const renderBindGroup = device.createBindGroup({
    label: 'clifford-render-bindgroup',
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particleBuffer      } },
      { binding: 1, resource: { buffer: renderUniformBuffer } },
    ],
  });

  // -------------------------------------------------------------------------
  // Do one initial clear so the canvas starts fully black
  // -------------------------------------------------------------------------
  {
    const encoder = device.createCommandEncoder({ label: 'clifford-init-clear' });
    const currentTexture = context.getCurrentTexture();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view:       currentTexture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp:     'clear',
          storeOp:    'store',
        },
      ],
    });
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  // -------------------------------------------------------------------------
  // Renderer state
  // -------------------------------------------------------------------------
  let time = 0;
  let destroyed = false;

  // -------------------------------------------------------------------------
  // render()
  // -------------------------------------------------------------------------
  function render(params: AttractorParams, hormones: HormoneState): void {
    if (destroyed) return;

    time += 1;

    // Write compute params uniform
    // Layout: a, b, c, d, dt, cortisol, dopamine, adrenaline, time, pad0, pad1, pad2
    const paramsData = new Float32Array(12);
    paramsData[0]  = params.a;
    paramsData[1]  = params.b;
    paramsData[2]  = params.c;
    paramsData[3]  = params.d;
    paramsData[4]  = 0.016;                 // dt ≈ 60 fps frame time
    paramsData[5]  = hormones.cortisol;
    paramsData[6]  = hormones.dopamine;
    paramsData[7]  = hormones.adrenaline;
    paramsData[8]  = time;
    // pads 9-11 are zero-init by Float32Array
    device.queue.writeBuffer(paramsBuffer, 0, paramsData);

    // Write render uniforms
    // Layout: aspect, scale, cortisol, dopamine
    const aspect = canvas.width / canvas.height;
    const renderData = new Float32Array(4);
    renderData[0] = aspect;
    renderData[1] = 0.38;
    renderData[2] = hormones.cortisol;
    renderData[3] = hormones.dopamine;
    device.queue.writeBuffer(renderUniformBuffer, 0, renderData);

    // Build command buffer
    const encoder = device.createCommandEncoder({ label: 'clifford-frame' });

    // Compute pass — advance particle simulation
    const computePass = encoder.beginComputePass({ label: 'clifford-compute-pass' });
    computePass.setPipeline(computePipeline);
    computePass.setBindGroup(0, computeBindGroup);
    computePass.dispatchWorkgroups(WORKGROUP_COUNT);
    computePass.end();

    // Render pass — draw particles
    // loadOp: 'load' preserves previous frame → creates trailing smear / persistence effect
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const currentTexture = context!.getCurrentTexture();
    const renderPass = encoder.beginRenderPass({
      label: 'clifford-render-pass',
      colorAttachments: [
        {
          view:       currentTexture.createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0.05 },
          loadOp:     'load',
          storeOp:    'store',
        },
      ],
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(PARTICLE_COUNT);
    renderPass.end();

    device.queue.submit([encoder.finish()]);
  }

  // -------------------------------------------------------------------------
  // destroy()
  // -------------------------------------------------------------------------
  function destroy(): void {
    destroyed = true;
    particleBuffer.destroy();
    paramsBuffer.destroy();
    renderUniformBuffer.destroy();
    device.destroy();
  }

  return { render, destroy };
}

// ---------------------------------------------------------------------------
// useCliffordAttractor — React hook
// ---------------------------------------------------------------------------

export function useCliffordAttractor(
  canvasRef: RefObject<HTMLCanvasElement>,
  params: AttractorParams,
  hormones: HormoneState
): void {
  // Keep current params/hormones in a ref so the RAF loop always sees latest
  // values without needing to restart the loop.
  const paramsRef   = useRef<AttractorParams>(params);
  const hormonesRef = useRef<HormoneState>(hormones);

  // Sync refs on every render (no re-subscription needed)
  paramsRef.current   = params;
  hormonesRef.current = hormones;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number;
    let renderer: CliffordRenderer | null = null;
    let mounted = true;

    initCliffordPipeline(canvas).then((r) => {
      if (!mounted) {
        r?.destroy();
        return;
      }
      renderer = r;

      if (!renderer) {
        console.warn('[CLIFFORD] Renderer unavailable — no WebGPU support.');
        return;
      }

      const loop = () => {
        if (!mounted) return;
        renderer!.render(paramsRef.current, hormonesRef.current);
        rafId = requestAnimationFrame(loop);
      };

      rafId = requestAnimationFrame(loop);
    }).catch((err) => {
      console.error('[CLIFFORD] Pipeline init error:', err);
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      renderer?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]); // only re-init if the canvas element itself changes
}
