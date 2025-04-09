// Math utility functions for dust simulations

/**
 * Linearly interpolate between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map a value from one range to another
 */
export function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Generate a random number between min and max
 */
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random value with gaussian (normal) distribution
 * @param mean The mean value
 * @param stdDev The standard deviation
 */
export function randomGaussian(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Calculate distance between two 2D points
 */
export function distance2D(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Smoothstep function - smooth transition between 0 and 1
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

/**
 * Smoother step function - even smoother transition
 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Generate a 1D Perlin noise value
 * Simplified implementation for basic noise
 */
export function noise1D(x: number): number {
  // Simple implementation using sine waves
  return (
    (Math.sin(x) +
      Math.sin(x * 2.1 + 1.3) * 0.5 +
      Math.sin(x * 3.9 + 2.7) * 0.25) /
    1.75
  );
}

/**
 * Generate a hash code from a string
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Generate a deterministic random number based on a seed
 */
export function seededRandom(seed: number): number {
  // Simple LCG (Linear Congruential Generator)
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  // Calculate next seed
  const nextSeed = (a * seed + c) % m;

  // Return normalized value between 0 and 1
  return nextSeed / m;
}

/**
 * Cubic Bezier curve interpolation
 */
export function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const oneMinusT = 1 - t;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const oneMinusTCubed = oneMinusTSquared * oneMinusT;
  const tSquared = t * t;
  const tCubed = tSquared * t;

  return (
    oneMinusTCubed * p0 +
    3 * oneMinusTSquared * t * p1 +
    3 * oneMinusT * tSquared * p2 +
    tCubed * p3
  );
}
