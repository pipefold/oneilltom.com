"use client";

import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";

// 3D Circle packing shader component
export function CirclePacking3D() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Vertex shader with displacement for 3D effect
  const vertexShader = `
    uniform float uTime;
    uniform float uDisplacementStrength;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    // Simplex noise helper functions
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vUv = uv;
      vNormal = normal;
      
      // Convert sphere position to normalized coordinates for noise
      vec3 pos = normalize(position);
      vPosition = pos;
      
      // Calculate displacement based on position and time
      float lon = atan(pos.z, pos.x);
      float lat = acos(pos.y);
      vec2 sphereUv = vec2(lon / (2.0 * 3.14159) + 0.5, lat / 3.14159);
      
      float noise = snoise(sphereUv * 3.0 + uTime * 0.1) * 0.5 + 0.5;
      
      // Apply displacement along normal
      vec3 newPosition = position + normal * noise * uDisplacementStrength;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  // Fragment shader with Worley noise for circle packing
  const fragmentShader = `
    uniform float uTime;
    uniform float uCellDensity;
    uniform vec3 uBaseColor;
    uniform vec3 uAccentColor;
    uniform float uAnimationSpeed;
    uniform float uCircleSize;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    // Random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    // Convert 3D position to 2D coordinates for Worley noise
    vec2 sphereToUv(vec3 p) {
      vec3 pos = normalize(p);
      float lon = atan(pos.z, pos.x);
      float lat = acos(pos.y);
      return vec2(lon / (2.0 * 3.14159) + 0.5, lat / 3.14159);
    }
    
    // 2D Worley noise (cellular noise)
    vec2 worley(vec2 uv, float cellDensity) {
      uv *= cellDensity;
      
      vec2 cellIndex = floor(uv);
      vec2 cellUv = fract(uv);
      
      float minDist = 1.0;  // Minimum distance
      float secondMinDist = 1.0;  // Second minimum distance
      vec2 closestCell;
      
      // Check surrounding cells (3x3 grid)
      for(int y = -1; y <= 1; y++) {
        for(int x = -1; x <= 1; x++) {
          vec2 cell = vec2(float(x), float(y));
          
          // Get random position within the cell
          vec2 cellPos = cell + cellIndex;
          float cellRandom = random(cellPos);
          
          // Animate the cell position
          vec2 pos = cell + 0.5 + 0.4 * vec2(
            sin(uTime * uAnimationSpeed + cellRandom * 6.28),
            cos(uTime * uAnimationSpeed + cellRandom * 6.28)
          );
          
          // Calculate distance to the cell
          float dist = length(pos - cellUv);
          
          // Update minimum distances
          if(dist < minDist) {
            secondMinDist = minDist;
            minDist = dist;
            closestCell = cellPos;
          } else if(dist < secondMinDist) {
            secondMinDist = dist;
          }
        }
      }
      
      return vec2(minDist, random(closestCell));
    }
    
    void main() {
      // Convert 3D position to 2D UV for Worley noise
      vec2 sphereUv = sphereToUv(vPosition);
      
      // Generate circle pattern using Worley noise
      vec2 worleyResult = worley(sphereUv, uCellDensity);
      float dist = worleyResult.x;
      float cellId = worleyResult.y;
      
      // Create circle with soft edge
      float circle = smoothstep(uCircleSize, uCircleSize - 0.05, dist);
      
      // Add subtle animation to circle size
      float animatedSize = 0.9 + 0.1 * sin(uTime * uAnimationSpeed * 0.5 + cellId * 10.0);
      circle *= animatedSize;
      
      // Create color gradient based on circle and lighting
      vec3 color = mix(uBaseColor, uAccentColor, circle);
      
      // Enhanced lighting based on normal and view direction
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      float diffuse = max(0.0, dot(vNormal, lightDir)) * 0.7 + 0.3;
      
      // Add rim lighting effect
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
      rim = pow(rim, 3.0) * 0.5;
      
      // Apply lighting
      color *= diffuse;
      color += rim * uAccentColor;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Create shader uniforms with default values
  const uniforms = useRef({
    uTime: { value: 0 },
    uCellDensity: { value: 8.0 },
    uBaseColor: { value: new THREE.Color(0x2a6c8f) },
    uAccentColor: { value: new THREE.Color(0xf7b538) },
    uAnimationSpeed: { value: 0.5 },
    uCircleSize: { value: 0.35 },
    uDisplacementStrength: { value: 0.15 },
    cameraPosition: { value: new THREE.Vector3() },
  });

  // Create controls using leva
  const controls = useControls("Circle Packing 3D", {
    cellDensity: { value: 8, min: 1, max: 20, step: 0.1 },
    circleSize: { value: 0.35, min: 0.1, max: 0.5, step: 0.01 },
    animationSpeed: { value: 0.5, min: 0, max: 2, step: 0.01 },
    displacementStrength: { value: 0.15, min: 0, max: 0.5, step: 0.01 },
    baseColor: "#2a6c8f",
    accentColor: "#f7b538",
  });

  // Update uniforms when controls change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uCellDensity.value = controls.cellDensity;
      materialRef.current.uniforms.uCircleSize.value = controls.circleSize;
      materialRef.current.uniforms.uAnimationSpeed.value =
        controls.animationSpeed;
      materialRef.current.uniforms.uDisplacementStrength.value =
        controls.displacementStrength;
      materialRef.current.uniforms.uBaseColor.value.set(controls.baseColor);
      materialRef.current.uniforms.uAccentColor.value.set(controls.accentColor);
    }
  }, [controls]);

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.cameraPosition.value.copy(
        state.camera.position
      );
    }

    // Add subtle rotation to the mesh
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
      />
    </mesh>
  );
}
