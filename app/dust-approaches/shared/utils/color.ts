// Color utility functions for dust simulations

/**
 * Convert hex color string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  let r, g, b;
  if (hex.length === 3) {
    // Short notation (#RGB)
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    // Full notation (#RRGGBB)
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return { r, g, b };
}

/**
 * Convert RGB values to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  // Ensure values are in valid range
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  // Convert to hex
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert RGB values to normalized values (0-1)
 */
export function rgbToNormalized(
  r: number,
  g: number,
  b: number
): { r: number; g: number; b: number } {
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
  };
}

/**
 * Convert normalized RGB values (0-1) to standard RGB (0-255)
 */
export function normalizedToRgb(
  r: number,
  g: number,
  b: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert hex color to normalized RGB values (0-1)
 */
export function hexToNormalizedRgb(hex: string): {
  r: number;
  g: number;
  b: number;
} {
  const rgb = hexToRgb(hex);
  return rgbToNormalized(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert normalized RGB values to hex color
 */
export function normalizedRgbToHex(r: number, g: number, b: number): string {
  const rgb = normalizedToRgb(r, g, b);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

/**
 * Interpolate between two colors
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);

  return rgbToHex(r, g, b);
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  // Normalize RGB values
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(
  h: number,
  s: number,
  l: number
): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    // Achromatic (grey)
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Adjust the brightness of a color
 * @param color Hex color string
 * @param factor Factor to adjust brightness (0-2, where 1 is no change)
 */
export function adjustBrightness(color: string, factor: number): string {
  const rgb = hexToRgb(color);

  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
}

/**
 * Generate a random color
 */
export function randomColor(): string {
  return rgbToHex(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  );
}

/**
 * Create a color with specified opacity
 */
export function colorWithOpacity(color: string, opacity: number): string {
  const rgb = hexToRgb(color);
  const alpha = Math.max(0, Math.min(1, opacity));

  // Convert to rgba format
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
