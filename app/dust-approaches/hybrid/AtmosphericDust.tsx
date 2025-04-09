"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DustParameters } from "../shared/types";
import {
  allNoiseShaderFunctions,
  dustMovementFunction,
} from "../shared/noise-functions";
import { hexToNormalizedRgb } from "../shared/utils/color";

interface AtmosphericDustProps {
  parameters: DustParameters;
}

export function AtmosphericDust({ parameters }: AtmosphericDustProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

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

  // Fragment shader for atmospheric dust - simplified version of the shader-based approach
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
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    ${allNoiseShaderFunctions}
    
    ${dustMovementFunction}
    
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
      
      // Combine dust layers with different weights - focus on larger scale features
      float dustNoise = baseDust * 0.6 + mediumDust * 0.4;
      
      // Apply density control
      float dustIntensity = dustNoise * uDensity;
      
      // Edge highlighting for volumetric effect
      float edgeFactor = (1.0 - abs(vUv.x - 0.5) * 2.0) * (1.0 - abs(vUv.y - 0.5) * 2.0);
      float lightFactor = edgeFactor * uLightIntensity;
      
      // Create depth variation
      float depth = fbm(vec3(flowUv * scaleFactor * 0.5, scaledTime * 0.05), 2) * 0.5 + 0.5;
      
      // Mix dust color with light color based on density and lighting
      vec3 dustWithLight = mix(uDustColor, uLightColor, lightFactor * dustIntensity);
      
      // Apply depth variation to color
      vec3 finalColor = mix(dustWithLight, uDustColor * 0.8, depth * 0.3);
      
      // Calculate opacity based on dust intensity - keep it more transparent for hybrid approach
      float opacity = smoothstep(0.0, 0.7, dustIntensity) * min(0.7, uDensity);
      
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
    }
  }, [parameters]);

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[40, 40, 1, 1]} />
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
