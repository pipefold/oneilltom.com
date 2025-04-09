"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DustParameters } from "../shared/types";
import { AtmosphericDust } from "./AtmosphericDust";
import { ParticleLayer } from "./ParticleLayer";

interface HybridDustProps {
  parameters: DustParameters;
  particleCount?: number;
  onPerformanceUpdate?: (fps: number, particleCount: number) => void;
}

export function HybridDust({
  parameters,
  particleCount = 1000,
  onPerformanceUpdate,
}: HybridDustProps) {
  // Reference to track FPS
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });

  // Animation loop for FPS calculation
  useFrame(() => {
    // Calculate FPS
    if (onPerformanceUpdate) {
      fpsCounterRef.current.frames++;
      const now = performance.now();
      const elapsed = now - fpsCounterRef.current.lastTime;

      if (elapsed >= 1000) {
        // Update every second
        const fps = (fpsCounterRef.current.frames * 1000) / elapsed;
        onPerformanceUpdate(fps, particleCount);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }
    }
  });

  return (
    <group>
      {/* Atmospheric dust layer using shader-based approach */}
      <AtmosphericDust
        parameters={{
          ...parameters,
          // Reduce density for the atmospheric layer to make particles more visible
          density: parameters.density * 0.7,
        }}
      />

      {/* Particle layer using instanced meshes */}
      <ParticleLayer
        parameters={{
          ...parameters,
          // Increase particle size for better visibility
          particleSize: parameters.particleSize * 1.5,
        }}
        particleCount={particleCount}
      />
    </group>
  );
}
