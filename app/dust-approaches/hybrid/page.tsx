"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { HybridDust } from "./HybridDust";
import { DustControlsWithPanel } from "../shared/controls";
import { DustParameters } from "../shared/types";
import { getPreset } from "../shared/presets";
import Link from "next/link";

export default function HybridDustPage() {
  // State to track if we're on the client (for hydration safety)
  const [isClient, setIsClient] = useState(false);

  // State for dust parameters
  const [parameters, setParameters] = useState<DustParameters>(
    getPreset("Gentle Breeze").parameters
  );

  // State for performance metrics
  const [fps, setFps] = useState(0);
  const [particleCount, setParticleCount] = useState(1000);

  // Handle parameter changes from controls
  const handleParametersChange = useCallback((newParams: DustParameters) => {
    setParameters(newParams);
  }, []);

  // Handle FPS updates
  const handlePerformanceUpdate = useCallback(
    (newFps: number, count: number) => {
      setFps(newFps);
    },
    []
  );

  // Particle count slider
  const [sliderValue, setSliderValue] = useState(1000);

  // Handle slider change with debounce
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value);
      setSliderValue(value);

      // Debounce the actual particle count update to avoid too many re-renders
      const timer = setTimeout(() => {
        setParticleCount(value);
      }, 300);

      return () => clearTimeout(timer);
    },
    []
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 bg-black text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hybrid Dust Simulation</h1>
            <p className="text-sm opacity-70">
              Combining shader-based atmosphere with 3D particles
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
            <Canvas camera={{ position: [0, 5, 10], fov: 45 }}>
              <ambientLight intensity={0.2} />
              <directionalLight position={[10, 10, 5]} intensity={0.5} />
              <HybridDust
                parameters={parameters}
                particleCount={particleCount}
                onPerformanceUpdate={handlePerformanceUpdate}
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
          <>
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <label htmlFor="particleCount" className="block text-white mb-2">
                Particle Count: {sliderValue.toLocaleString()}
              </label>
              <input
                id="particleCount"
                type="range"
                min="500"
                max="5000"
                step="500"
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>500</span>
                <span>2,500</span>
                <span>5,000</span>
              </div>
            </div>

            <DustControlsWithPanel
              onChange={handleParametersChange}
              initialPreset="Gentle Breeze"
              showPerformance={true}
              fps={fps}
              particleCount={particleCount}
            />
          </>
        )}
      </main>

      <footer className="p-4 text-center text-sm opacity-70">
        <p>
          This implementation combines a shader-based atmospheric dust layer
          with a particle system.
        </p>
        <p>
          Key features: Volumetric atmosphere from shaders + distinct particles
          with physics-based movement.
        </p>
        <p className="text-green-500 mt-2">
          The hybrid approach offers the best of both worlds: the performance of
          shaders with the detail of particles.
        </p>
      </footer>
    </div>
  );
}
