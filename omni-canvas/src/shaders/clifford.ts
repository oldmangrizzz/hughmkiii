// omni-canvas/src/shaders/clifford.ts

/**
 * CLIFFORD ATTRACTOR SHADER (WebGPU)
 * Implementation of the "Living Vortex Field" from the H.U.G.H. Whitepaper.
 * Formula: 
 * x' = sin(a * y) + c * cos(a * x)
 * y' = sin(b * x) + d * cos(b * y)
 */

export const CLIFFORD_COMPUTE_SHADER = `
struct Particle {
  position : vec2<f32>,
  velocity : vec2<f32>,
};

struct Params {
  a : f32,
  b : f32,
  c : f32,
  d : f32,
  dt : f32,
};

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let index = global_id.x;
  var p = particles[index];

  // Clifford Attractor Calculation
  let next_x = sin(params.a * p.position.y) + params.c * cos(params.a * p.position.x);
  let next_y = sin(params.b * p.position.x) + params.d * cos(params.b * p.position.y);

  // Apply velocity and damping
  p.velocity = (vec2<f32>(next_x, next_y) - p.position) * params.dt;
  p.position = p.position + p.velocity;

  // Bound check and wrap-around for holographic persistence
  if (p.position.x > 2.0) { p.position.x = -2.0; }
  if (p.position.x < -2.0) { p.position.x = 2.0; }
  if (p.position.y > 2.0) { p.position.y = -2.0; }
  if (p.position.y < -2.0) { p.position.y = 2.0; }

  particles[index] = p;
}
`;
