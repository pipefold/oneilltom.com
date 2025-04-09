// Common types and interfaces for dust simulation approaches

// Basic vector type
export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Common dust parameters shared across all approaches
export interface DustParameters {
  // Wind properties
  windDirection: Vector2;
  windSpeed: number;
  turbulence: number;

  // Visual properties
  density: number;
  scale: number;
  dustColor: string;
  lightColor: string;
  lightIntensity: number;

  // Additional properties
  timeScale: number;
  particleSize: number;
}

// Preset configuration
export interface DustPreset {
  name: string;
  description: string;
  parameters: DustParameters;
}

// Particle system specific types
export interface Particle {
  position: Vector3;
  velocity: Vector3;
  size: number;
  age: number;
  lifetime: number;
  opacity: number;
  color: string;
}

// Performance metrics
export interface PerformanceMetrics {
  fps: number;
  particleCount: number;
  renderTime: number;
}

// Approach identifier
export enum DustApproach {
  SHADER_BASED = "shader-based",
  PARTICLE_SYSTEM = "particle-system",
  HYBRID = "hybrid",
}
