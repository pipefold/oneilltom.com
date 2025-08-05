// @ts-check

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],

  experimental: {
    fonts: [
      // Sans-serif: Montserrat
      {
        provider: fontProviders.google(),
        name: "Montserrat",
        cssVariable: "--font-montserrat",
        subsets: ["latin"], // Optimize by subsetting to needed characters
        weights: [400, 700], // Only include used weights
        styles: ["normal"], // Add 'italic' if needed
        fallbacks: ["ui-sans-serif", "system-ui"], // Optimized fallbacks
      },
      // Serif: EB Garamond
      {
        provider: fontProviders.google(),
        name: "EB Garamond",
        cssVariable: "--font-eb-garamond",
        subsets: ["latin"],
        weights: [400, 700],
        styles: ["normal", "italic"],
        fallbacks: ["ui-serif", "Georgia"],
      },
      // Monospace: Inconsolata
      {
        provider: fontProviders.google(),
        name: "Inconsolata",
        cssVariable: "--font-inconsolata",
        subsets: ["latin"],
        weights: [400, 700],
        styles: ["normal"],
        fallbacks: ["ui-monospace", "Menlo"],
      },
    ],
  },
});
