"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DustParameters } from "../shared/types";
import {
  allNoiseShaderFunctions,
  dustMovementFunction,
  dustAppearanceFunction,
} from "../shared/noise-functions";
import { hexToNormalizedRgb } from "../shared/utils/color";

interface DustShaderProps {
  parameters: DustParameters;
  onPerformanceUpdate?: (fps: number) => void;
}

export function DustShader({
  parameters,
  onPerformanceUpdate,
}: DustShaderProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });

  // Vertex shader - minimal as most work happens in fragment shader
  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment shader for enhanced dust rendering
  const fragmentShader = `
    uniform float uTime;
    uniform vec2 uWindDirection;
    uniform float uWindSpeed;
    uniform float uTurbulence;
    uniform float uDensity;
    uniform float uScale;
    uniform vec3 uDustColor;
    uniform vec3 uLightColor;
    uniform float uLightIntensity;
    uniform float uTimeScale;
    uniform float uParticleSize;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${allNoiseShaderFunctions}
    
    ${dustMovementFunction}
    
    // Enhanced dust particle function with sharper edges
    float enhancedDustParticle(vec2 uv, float time, float size, float speed, float sharpness) {
      // Create multiple moving dust particles
      vec2 center1 = vec2(
        fract(sin(uv.y * 100.0 + time * speed) * 1000.0),
        fract(cos(uv.x * 100.0 + time * speed * 0.7) * 1000.0)
      );
      
      vec2 center2 = vec2(
        fract(sin(uv.x * 120.0 + time * speed * 1.1) * 1000.0),
        fract(cos(uv.y * 120.0 + time * speed * 0.8) * 1000.0)
      );
      
      vec2 center3 = vec2(
        fract(sin((uv.x + uv.y) * 110.0 + time * speed * 0.9) * 1000.0),
        fract(cos((uv.x - uv.y) * 110.0 + time * speed * 1.2) * 1000.0)
      );
      
      float dist1 = length(uv - center1);
      float dist2 = length(uv - center2);
      float dist3 = length(uv - center3);
      
      // Use sharper falloff for more distinct particles
      float particle1 = pow(smoothstep(size, size * 0.5, dist1), sharpness);
      float particle2 = pow(smoothstep(size * 0.8, size * 0.4, dist2), sharpness);
      float particle3 = pow(smoothstep(size * 1.2, size * 0.6, dist3), sharpness);
      
      return max(max(particle1, particle2), particle3);
    }
    
    // Function to create distinct dust motes
    float dustMotes(vec2 uv, float time, float scale, float speed) {
      float result = 0.0;
      
      // Create multiple layers of dust motes at different scales
      for (int i = 0; i < 5; i++) {
        float layerScale = scale * (0.5 + float(i) * 0.3);
        float layerSpeed = speed * (0.8 + float(i) * 0.1);
        float size = uParticleSize * (0.5 + float(i) * 0.3);
        float sharpness = 1.0 + float(i) * 0.5;
        
        // Offset each layer
        vec2 offsetUv = uv + vec2(float(i) * 0.02, float(i) * 0.03);
        
        // Add dust particles with varying sharpness
        result += enhancedDustParticle(offsetUv * layerScale, time * layerSpeed, size, layerSpeed, sharpness) * 
                 (0.3 - float(i) * 0.05);
      }
      
      return result;
    }
    
    // Function to create depth variation
    float depthVariation(vec2 uv, float time, float scale) {
      // Use worley noise for more distinct cellular patterns
      float depth = worley(vec3(uv * scale * 0.5, time * 0.05), 0.5);
      
      // Add some ridge noise for sharper features
      depth += ridgedFbm(vec3(uv * scale * 0.3, time * 0.03), 2, 2.0, 0.5, 1.0) * 0.3;
      
      return depth;
    }
    
    void main() {
      // Scaled time for animation
      float scaledTime = uTime * uTimeScale;
      
      // Base coordinates with wind movement
      vec2 baseUv = vUv;
      
      // Get movement coordinates with turbulence
      vec2 flowUv = calculateDustMovement(baseUv, scaledTime, uWindDirection, uWindSpeed, uTurbulence, uScale);
      
      // Scale factor for different noise layers
      float scaleFactor = uScale * 0.1;
      
      // Base dust layer using voronoi for more distinct cells
      float baseDust = voronoi(vec3(flowUv * scaleFactor, scaledTime * 0.1)) * 0.6;
      
      // Medium scale dust features with turbulence
      float mediumDust = fbm(vec3(flowUv * scaleFactor * 3.0, scaledTime * 0.15), 2) * 0.5 + 0.5;
      
      // Add distinct dust motes (small particles)
      float dustMoteDetail = dustMotes(flowUv, scaledTime, uScale, uWindSpeed);
      
      // Combine dust layers with different weights
      float dustNoise = baseDust * 0.4 + mediumDust * 0.3 + dustMoteDetail * 0.3;
      
      // Apply thresholding for more distinct particles
      float threshold = 0.4;
      float contrast = 3.0;
      dustNoise = pow(max(0.0, dustNoise - threshold) * contrast, 1.5);
      
      // Apply density control
      float dustIntensity = dustNoise * uDensity;
      
      // Edge highlighting for volumetric effect
      float edgeFactor = (1.0 - abs(vUv.x - 0.5) * 2.0) * (1.0 - abs(vUv.y - 0.5) * 2.0);
      float lightFactor = edgeFactor * uLightIntensity;
      
      // Create depth variation
      float depth = depthVariation(flowUv, scaledTime, uScale);
      
      // Mix dust color with light color based on density and lighting
      vec3 dustWithLight = mix(uDustColor, uLightColor, lightFactor * dustIntensity);
      
      // Apply depth variation to color
      vec3 finalColor = mix(dustWithLight, uDustColor * 0.8, depth * 0.3);
      
      // Calculate opacity based on dust intensity
      float opacity = smoothstep(0.0, 0.7, dustIntensity) * min(1.0, uDensity * 1.5);
      
      // Output final color with opacity
      gl_FragColor = vec4(finalColor, opacity);
    }
  `;

  // Create shader uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uWindDirection: {
      value: new THREE.Vector2(
        parameters.windDirection.x,
        parameters.windDirection.y
      ),
    },
    uWindSpeed: { value: parameters.windSpeed },
    uTurbulence: { value: parameters.turbulence },
    uDensity: { value: parameters.density },
    uScale: { value: parameters.scale },
    uDustColor: {
      value: new THREE.Color().fromArray(
        Object.values(hexToNormalizedRgb(parameters.dustColor))
      ),
    },
    uLightColor: {
      value: new THREE.Color().fromArray(
        Object.values(hexToNormalizedRgb(parameters.lightColor))
      ),
    },
    uLightIntensity: { value: parameters.lightIntensity },
    uTimeScale: { value: parameters.timeScale },
    uParticleSize: { value: parameters.particleSize },
  });

  // Update uniforms when parameters change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uWindDirection.value.set(
        parameters.windDirection.x,
        parameters.windDirection.y
      );
      materialRef.current.uniforms.uWindSpeed.value = parameters.windSpeed;
      materialRef.current.uniforms.uTurbulence.value = parameters.turbulence;
      materialRef.current.uniforms.uDensity.value = parameters.density;
      materialRef.current.uniforms.uScale.value = parameters.scale;
      materialRef.current.uniforms.uDustColor.value.set(
        ...Object.values(hexToNormalizedRgb(parameters.dustColor))
      );
      materialRef.current.uniforms.uLightColor.value.set(
        ...Object.values(hexToNormalizedRgb(parameters.lightColor))
      );
      materialRef.current.uniforms.uLightIntensity.value =
        parameters.lightIntensity;
      materialRef.current.uniforms.uTimeScale.value = parameters.timeScale;
      materialRef.current.uniforms.uParticleSize.value =
        parameters.particleSize;
    }
  }, [parameters]);

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Calculate FPS
    if (onPerformanceUpdate) {
      fpsCounterRef.current.frames++;
      const now = performance.now();
      const elapsed = now - fpsCounterRef.current.lastTime;

      if (elapsed >= 1000) {
        // Update every second
        const fps = (fpsCounterRef.current.frames * 1000) / elapsed;
        onPerformanceUpdate(fps);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[20, 20, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
