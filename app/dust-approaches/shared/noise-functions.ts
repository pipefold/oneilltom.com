// Noise utility functions for dust simulations
// These functions provide various noise patterns that can be used for dust movement and appearance

/**
 * Simplex 3D Noise
 * Based on the implementation by Ian McEwan, Ashima Arts
 */
export const simplexNoise = `
// Simplex 3D Noise
// by Ian McEwan, Ashima Arts
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  // Permutations
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          
  // Gradients
  float n_ = 1.0/7.0; // N=7
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/**
 * FBM (Fractal Brownian Motion) for layered noise
 */
export const fbmNoise = `
// FBM (Fractal Brownian Motion) for layered noise
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  // Add several layers of noise
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}
`;

/**
 * Curl noise for realistic turbulence
 */
export const curlNoise = `
// Curl noise for realistic turbulence
vec3 curl(vec3 p, float delta) {
  vec3 dx = vec3(delta, 0.0, 0.0);
  vec3 dy = vec3(0.0, delta, 0.0);
  vec3 dz = vec3(0.0, 0.0, delta);
  
  // Calculate gradient
  float x1 = fbm(p + dx, 3);
  float x2 = fbm(p - dx, 3);
  float y1 = fbm(p + dy, 3);
  float y2 = fbm(p - dy, 3);
  float z1 = fbm(p + dz, 3);
  float z2 = fbm(p - dz, 3);
  
  // Calculate curl
  float x = (y2 - y1) - (z2 - z1);
  float y = (z2 - z1) - (x2 - x1);
  float z = (x2 - x1) - (y2 - y1);
  
  return normalize(vec3(x, y, z));
}
`;

/**
 * Voronoi noise for cell-like patterns
 */
export const voronoiNoise = `
// Voronoi noise for cell-like patterns
float voronoi(vec3 p) {
  vec3 b = floor(p);
  vec3 f = fract(p);
  
  float res = 8.0;
  
  for(int i = -1; i <= 1; i++) {
    for(int j = -1; j <= 1; j++) {
      for(int k = -1; k <= 1; k++) {
        vec3 b2 = vec3(float(i), float(j), float(k));
        vec3 r = b2 - f + vec3(
          snoise(b + b2) * 0.5 + 0.5,
          snoise((b + b2) * 1.1) * 0.5 + 0.5,
          snoise((b + b2) * 1.2) * 0.5 + 0.5
        );
        
        float d = dot(r, r);
        
        if(d < res) {
          res = d;
        }
      }
    }
  }
  
  return 1.0 - res;
}
`;

/**
 * Dust particle function for small-scale details
 */
export const dustParticleFunction = `
// Dust particle function for small-scale details
float dustParticle(vec2 uv, float time, float size, float speed) {
  // Create a moving dust particle
  vec2 center = vec2(
    fract(sin(uv.y * 100.0 + time * speed) * 1000.0),
    fract(cos(uv.x * 100.0 + time * speed * 0.7) * 1000.0)
  );
  
  float dist = length(uv - center);
  return smoothstep(size, 0.0, dist);
}
`;

/**
 * Worley noise for cellular patterns
 */
export const worleyNoise = `
// Worley noise for cellular patterns
float worley(vec3 p, float jitter) {
  vec3 id = floor(p);
  vec3 p_fract = fract(p);
  
  float min_dist = 1.0;
  
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      for (int z = -1; z <= 1; z++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 h = offset - p_fract + vec3(
          snoise(id + offset) * jitter,
          snoise((id + offset) * 1.1) * jitter,
          snoise((id + offset) * 1.2) * jitter
        );
        
        float dist = length(h);
        min_dist = min(min_dist, dist);
      }
    }
  }
  
  return min_dist;
}
`;

/**
 * Ridge noise for sharp ridges and valleys
 */
export const ridgeNoise = `
// Ridge noise for sharp ridges and valleys
float ridge(float h, float offset) {
  h = abs(h);     // create creases
  h = offset - h; // invert so creases are at top
  h = h * h;      // sharpen creases
  return h;
}

float ridgedFbm(vec3 p, int octaves, float lacunarity, float gain, float offset) {
  float sum = 0.0;
  float freq = 1.0;
  float amp = 0.5;
  float prev = 1.0;
  
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    
    float n = ridge(snoise(p * freq), offset);
    sum += n * amp;
    sum += n * amp * prev;  // scale by previous octave
    prev = n;
    freq *= lacunarity;
    amp *= gain;
  }
  
  return sum;
}
`;

/**
 * Combine all noise functions into a single string for shader use
 */
export const allNoiseShaderFunctions = `
${simplexNoise}

${fbmNoise}

${curlNoise}

${voronoiNoise}

${dustParticleFunction}

${worleyNoise}

${ridgeNoise}
`;

/**
 * Helper function to generate dust movement based on time and parameters
 * This is a GLSL function that can be included in shaders
 */
export const dustMovementFunction = `
// Calculate dust movement based on time and parameters
vec2 calculateDustMovement(vec2 uv, float time, vec2 windDirection, float windSpeed, float turbulence, float scale) {
  // Base flow with wind direction
  vec2 flowUv = uv + windDirection * time * windSpeed;
  
  // Apply turbulence using curl noise
  vec3 curlVec = curl(vec3(flowUv * scale * 2.0, time * 0.2), 0.01);
  vec2 turbulenceOffset = vec2(curlVec.x, curlVec.y) * turbulence * 0.3;
  
  return flowUv + turbulenceOffset;
}
`;

/**
 * Helper function to generate dust appearance based on parameters
 * This is a GLSL function that can be included in shaders
 */
export const dustAppearanceFunction = `
// Calculate dust appearance based on parameters
float calculateDustAppearance(vec2 uv, float time, vec2 windDirection, float windSpeed, 
                             float turbulence, float density, float scale) {
  // Get movement coordinates
  vec2 flowUv = calculateDustMovement(uv, time, windDirection, windSpeed, turbulence, scale);
  
  // Scale factor for different noise layers
  float scaleFactor = scale * 0.1;
  
  // Base dust layer (large scale movement)
  float baseDust = fbm(vec3(flowUv * scaleFactor, time * 0.1), 3) * 0.5 + 0.5;
  
  // Medium scale dust features
  float mediumDust = fbm(vec3(flowUv * scaleFactor * 3.0, time * 0.15), 2) * 0.5 + 0.5;
  
  // Fine dust particles (small scale details)
  float fineDetail = 0.0;
  for (int i = 0; i < 5; i++) {
    float size = 0.002 + 0.003 * float(i) / 5.0;
    float speed = 0.2 + 0.4 * float(i) / 5.0;
    fineDetail += dustParticle(flowUv, time, size, speed) * 0.2;
  }
  
  // Combine dust layers with different weights
  float dustNoise = baseDust * 0.5 + mediumDust * 0.3 + fineDetail * 0.2;
  
  // Apply density control
  return dustNoise * density;
}
`;
