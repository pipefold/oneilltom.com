"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Leva } from "leva";
import { DustEffect } from "./DustShader";

export default function BlowingDustPage() {
  // State to track if we're on the client (for hydration safety)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Leva controls panel */}
      <Leva collapsed={false} />

      <header className="p-4 bg-black text-white">
        <h1 className="text-2xl font-bold">Blowing Dust Simulation</h1>
        <p className="text-sm opacity-70">
          An organic, dynamic dust simulation using R3F and custom shaders
        </p>
      </header>

      <main className="flex-grow p-4">
        <div className="bg-gray-900 rounded-lg overflow-hidden h-[600px] shadow-lg">
          {isClient && (
            <Canvas camera={{ position: [0, 2, 4], fov: 45 }}>
              <ambientLight intensity={0.2} />
              <DustEffect />
              <OrbitControls
                enableZoom={true}
                enablePan={true}
                minPolarAngle={0}
                maxPolarAngle={Math.PI / 2 - 0.1} // Limit to slightly above horizontal
              />
            </Canvas>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-sm opacity-70">
        <p>Use mouse to orbit, zoom, and pan around the dust simulation</p>
        <p>
          Adjust parameters using the control panel to create different dust
          effects
        </p>
      </footer>
    </div>
  );
}
