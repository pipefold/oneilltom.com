import { DustParameters, DustPreset } from "./types";

// Default parameters that serve as a base for all presets
export const defaultDustParameters: DustParameters = {
  windDirection: { x: 0.3, y: 0.1 },
  windSpeed: 0.2,
  turbulence: 0.3,
  density: 0.4,
  scale: 2.0,
  dustColor: "#d2b48c", // Tan
  lightColor: "#fffaf0", // Ivory
  lightIntensity: 0.6,
  timeScale: 1.0,
  particleSize: 0.02,
};

// Collection of dust presets for different scenarios
export const dustPresets: Record<string, DustPreset> = {
  "Gentle Breeze": {
    name: "Gentle Breeze",
    description: "Light, wispy dust carried on a gentle wind",
    parameters: {
      ...defaultDustParameters,
      windDirection: { x: 0.3, y: 0.1 },
      windSpeed: 0.2,
      turbulence: 0.3,
      density: 0.4,
      scale: 2.0,
      dustColor: "#d2b48c", // Tan
      lightColor: "#fffaf0", // Ivory
      lightIntensity: 0.6,
      timeScale: 1.0,
      particleSize: 0.02,
    },
  },

  "Desert Haboob": {
    name: "Desert Haboob",
    description: "Dense, dramatic dust storm with strong directionality",
    parameters: {
      ...defaultDustParameters,
      windDirection: { x: 0.8, y: 0.2 },
      windSpeed: 0.7,
      turbulence: 0.5,
      density: 0.9,
      scale: 3.5,
      dustColor: "#b8860b", // Dark goldenrod
      lightColor: "#ff8c00", // Dark orange
      lightIntensity: 0.8,
      timeScale: 1.5,
      particleSize: 0.03,
    },
  },

  "Swirling Vortex": {
    name: "Swirling Vortex",
    description: "Circular dust devil with high turbulence",
    parameters: {
      ...defaultDustParameters,
      windDirection: { x: 0.0, y: 0.0 },
      windSpeed: 0.5,
      turbulence: 0.9,
      density: 0.7,
      scale: 1.5,
      dustColor: "#c19a6b", // Fallow
      lightColor: "#ffe4b5", // Moccasin
      lightIntensity: 0.7,
      timeScale: 1.2,
      particleSize: 0.025,
    },
  },

  "Ambient Dust": {
    name: "Ambient Dust",
    description: "Subtle background dust particles catching the light",
    parameters: {
      ...defaultDustParameters,
      windDirection: { x: 0.1, y: 0.1 },
      windSpeed: 0.1,
      turbulence: 0.2,
      density: 0.3,
      scale: 1.0,
      dustColor: "#e6d8ad", // Light khaki
      lightColor: "#fffacd", // Lemon chiffon
      lightIntensity: 0.5,
      timeScale: 0.8,
      particleSize: 0.015,
    },
  },

  "Industrial Haze": {
    name: "Industrial Haze",
    description: "Heavy, polluted dust with low visibility",
    parameters: {
      ...defaultDustParameters,
      windDirection: { x: 0.2, y: 0.0 },
      windSpeed: 0.15,
      turbulence: 0.4,
      density: 0.8,
      scale: 1.2,
      dustColor: "#696969", // Dim gray
      lightColor: "#a9a9a9", // Dark gray
      lightIntensity: 0.4,
      timeScale: 0.7,
      particleSize: 0.01,
    },
  },

  "Pollen Cloud": {
    name: "Pollen Cloud",
    description: "Bright, floating pollen particles in spring air",
    parameters: {
      ...defaultDustParameters,
      windDirection: { x: 0.2, y: -0.1 },
      windSpeed: 0.25,
      turbulence: 0.4,
      density: 0.5,
      scale: 2.5,
      dustColor: "#eee8aa", // Pale goldenrod
      lightColor: "#ffff00", // Yellow
      lightIntensity: 0.9,
      timeScale: 0.9,
      particleSize: 0.03,
    },
  },
};

// Helper function to get a preset by name
export function getPreset(name: string): DustPreset {
  return dustPresets[name] || dustPresets["Gentle Breeze"];
}

// Helper function to apply preset parameters to a target object
export function applyPreset(preset: DustPreset, target: any): void {
  const params = preset.parameters;

  // Apply each parameter to the target
  Object.keys(params).forEach((key) => {
    if (typeof target[key] === "object" && target[key] !== null) {
      // Handle nested objects like windDirection
      Object.assign(target[key], params[key as keyof DustParameters]);
    } else {
      // Handle primitive values
      target[key] = params[key as keyof DustParameters];
    }
  });
}
