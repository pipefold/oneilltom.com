// Reusable OffscreenCanvas and context (fallback to regular canvas if needed)
let canvas: OffscreenCanvas | HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

try {
  canvas = new OffscreenCanvas(1, 1);
  ctx = canvas.getContext("2d")!;
} catch (e) {
  canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  ctx = canvas.getContext("2d")!;
}

// Cache for parsed colors
const colorCache = new Map<string, RGBA>();

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function oklchToRGBA(oklchString: string): RGBA {
  // Check cache first
  if (colorCache.has(oklchString)) {
    return colorCache.get(oklchString)!;
  }

  // Parse using the shared canvas
  ctx.fillStyle = oklchString;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

  const rgba: RGBA = {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a: a / 255,
  };

  // Cache the result
  colorCache.set(oklchString, rgba);

  return rgba;
}

export function oklchToRGB(oklchString: string): {
  r: number;
  g: number;
  b: number;
} {
  const rgba = oklchToRGBA(oklchString);
  return { r: rgba.r, g: rgba.g, b: rgba.b };
}

export function oklchToHex(oklchString: string): string {
  const rgba = oklchToRGBA(oklchString);
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Get colors from CSS custom properties
export function getThemeColors() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  return {
    background: computedStyle.getPropertyValue("--background").trim(),
    foreground: computedStyle.getPropertyValue("--foreground").trim(),
    primary: computedStyle.getPropertyValue("--primary").trim(),
    secondary: computedStyle.getPropertyValue("--secondary").trim(),
    accent: computedStyle.getPropertyValue("--accent").trim(),
    muted: computedStyle.getPropertyValue("--muted").trim(),
    destructive: computedStyle.getPropertyValue("--destructive").trim(),
    border: computedStyle.getPropertyValue("--border").trim(),
    input: computedStyle.getPropertyValue("--input").trim(),
    ring: computedStyle.getPropertyValue("--ring").trim(),
  };
}

// Clear the color cache (useful for testing or memory management)
export function clearColorCache() {
  colorCache.clear();
}
