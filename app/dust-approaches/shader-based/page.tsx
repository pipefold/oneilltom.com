"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { DustShader } from "./DustShader";
import { DustControlsWithPanel } from "../shared/controls";
import { DustParameters } from "../shared/types";
import { getPreset } from "../shared/presets";
import Link from "next/link";

export default function ShaderBasedDustPage() {
  // State to track if we're on the client (for hydration safety)
  const [isClient, setIsClient] = useState(false);

  // State for dust parameters
  const [parameters, setParameters] = useState<DustParameters>(
    getPreset("Gentle Breeze").parameters
  );

  // State for performance metrics
  const [fps, setFps] = useState(0);

  // Handle parameter changes from controls
  const handleParametersChange = useCallback((newParams: DustParameters) => {
    setParameters(newParams);
  }, []);

  // Handle FPS updates
  const handleFpsUpdate = useCallback((newFps: number) => {
    setFps(newFps);
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 bg-black text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Shader-Based Dust Simulation</h1>
            <p className="text-sm opacity-70">
              Enhanced shader approach with distinct particles
            </p>
          </div>
          <nav>
            <Link
              href="/dust-approaches"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Comparison
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow p-4">
        <div className="bg-gray-900 rounded-lg overflow-hidden h-[600px] shadow-lg relative">
          {isClient && (
            <Canvas camera={{ position: [0, 2, 4], fov: 45 }}>
              <ambientLight intensity={0.2} />
              <DustShader
                parameters={parameters}
                onPerformanceUpdate={handleFpsUpdate}
              />
              <OrbitControls
                enableZoom={true}
                enablePan={true}
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2 - 0.1} // Limit to slightly above horizontal
              />
              <Stats />
            </Canvas>
          )}
        </div>

        {isClient && (
          <DustControlsWithPanel
            onChange={handleParametersChange}
            initialPreset="Gentle Breeze"
            showPerformance={true}
            fps={fps}
            particleCount={0} // Shader-based approach doesn't have discrete particles
          />
        )}
      </main>

      <footer className="p-4 text-center text-sm opacity-70">
        <p>
          This implementation uses advanced shader techniques to create the
          illusion of distinct dust particles.
        </p>
        <p>
          Key features: Thresholding for sharper particles, Voronoi noise for
          cellular patterns, and depth variation.
        </p>
      </footer>
    </div>
  );
}
