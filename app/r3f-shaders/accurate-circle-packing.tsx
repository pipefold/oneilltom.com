"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls, button } from "leva";

// Circle packing algorithm
interface Circle {
  x: number;
  y: number;
  radius: number;
  id: number;
}

function generateCirclePacking(
  containerRadius: number,
  minRadius: number,
  maxRadius: number,
  maxAttempts: number,
  maxCircles: number
): Circle[] {
  const circles: Circle[] = [];
  let attempts = 0;
  let id = 0;

  // Try to place circles until we reach max attempts or max circles
  while (attempts < maxAttempts && circles.length < maxCircles) {
    attempts++;

    // Generate a random radius between min and max
    // Use a power distribution to favor smaller circles
    const radius =
      minRadius + (maxRadius - minRadius) * Math.pow(Math.random(), 2);

    // Generate a random position within the container
    // Use a radial distribution to ensure we stay within the container
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (containerRadius - radius);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    // Check if this circle overlaps with any existing circle
    let overlaps = false;
    for (const circle of circles) {
      const dx = circle.x - x;
      const dy = circle.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < circle.radius + radius) {
        overlaps = true;
        break;
      }
    }

    // If it doesn't overlap, add it to our list
    if (!overlaps) {
      circles.push({ x, y, radius, id: id++ });
      attempts = 0; // Reset attempts when we successfully place a circle
    }
  }

  return circles;
}

// Accurate circle packing shader component
export function AccurateCirclePacking() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // State to trigger regeneration of circle packing
  const [regenerateFlag, setRegenerateFlag] = useState(false);

  // Controls for the circle packing algorithm
  const {
    containerRadius,
    minRadius,
    maxRadius,
    maxAttempts,
    maxCircles,
    animationSpeed,
    animationStrength,
    circleColor,
    backgroundColor,
  } = useControls("Accurate Circle Packing", {
    containerRadius: { value: 1.0, min: 0.5, max: 2.0, step: 0.1 },
    minRadius: { value: 0.01, min: 0.005, max: 0.1, step: 0.005 },
    maxRadius: { value: 0.15, min: 0.05, max: 0.3, step: 0.01 },
    maxAttempts: { value: 1000, min: 100, max: 5000, step: 100 },
    maxCircles: { value: 500, min: 100, max: 1000, step: 50 },
    animationSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    animationStrength: { value: 0.02, min: 0, max: 0.1, step: 0.01 },
    regenerate: button(() => setRegenerateFlag((prev) => !prev)),
    circleColor: { value: "#ffffff" },
    backgroundColor: { value: "#000000" },
  });

  // Generate circle packing
  const circles = useMemo(() => {
    return generateCirclePacking(
      containerRadius,
      minRadius,
      maxRadius,
      maxAttempts,
      maxCircles
    );
  }, [
    containerRadius,
    minRadius,
    maxRadius,
    maxAttempts,
    maxCircles,
    regenerateFlag,
  ]);

  // Prepare circle data for the shader
  const circleData = useMemo(() => {
    // Each circle needs 3 values: x, y, radius
    const data = new Float32Array(circles.length * 3);
    circles.forEach((circle, i) => {
      data[i * 3] = circle.x;
      data[i * 3 + 1] = circle.y;
      data[i * 3 + 2] = circle.radius;
    });
    return data;
  }, [circles]);

  // Create a texture to store circle data
  const circleTexture = useMemo(() => {
    // Create a data texture to store circle information
    // We use RGBA format where R=x, G=y, B=radius, A=unused
    const size = Math.ceil(Math.sqrt(circles.length));
    const data = new Float32Array(size * size * 4).fill(0);

    // Fill the texture with circle data
    circles.forEach((circle, i) => {
      if (i < size * size) {
        data[i * 4] = circle.x;
        data[i * 4 + 1] = circle.y;
        data[i * 4 + 2] = circle.radius;
        data[i * 4 + 3] = 1.0; // Used for animation offset
      }
    });

    const texture = new THREE.DataTexture(
      data,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return { texture, size };
  }, [circles]);

  // Vertex shader (simple pass-through)
  const vertexShader = `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  // Fragment shader for rendering circles
  const fragmentShader = `
    uniform float uTime;
    uniform float uAnimationSpeed;
    uniform float uAnimationStrength;
    uniform float uContainerRadius;
    uniform sampler2D uCircleTexture;
    uniform int uCircleCount;
    uniform int uTextureSize;
    uniform vec3 uCircleColor;
    uniform vec3 uBackgroundColor;
    
    varying vec2 vUv;
    
    void main() {
      // Convert UV to centered coordinates (-1 to 1)
      vec2 coord = (vUv - 0.5) * 2.0;
      
      // Check if we're inside the container circle
      float distToCenter = length(coord);
      if (distToCenter > uContainerRadius) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      
      // Initialize with background color
      vec3 color = uBackgroundColor;
      
      // Loop through all circles
      for (int i = 0; i < 1000; i++) {
        if (i >= uCircleCount) break;
        
        // Calculate texture coordinates
        int y = i / uTextureSize;
        int x = i - (y * uTextureSize);
        vec2 texCoord = vec2(float(x) + 0.5, float(y) + 0.5) / float(uTextureSize);
        
        // Get circle data
        vec4 circleData = texture2D(uCircleTexture, texCoord);
        vec2 circlePos = circleData.xy;
        float radius = circleData.z;
        float animOffset = circleData.w * 6.28; // Random phase offset
        
        // Apply subtle animation to radius
        float animatedRadius = radius * (1.0 + sin(uTime * uAnimationSpeed + animOffset) * uAnimationStrength);
        
        // Calculate distance to circle center
        float dist = length(coord - circlePos);
        
        // If we're inside this circle, set the color
        if (dist < animatedRadius) {
          color = uCircleColor;
          break;
        }
      }
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Create shader uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uAnimationSpeed: { value: animationSpeed },
    uAnimationStrength: { value: animationStrength },
    uContainerRadius: { value: containerRadius },
    uCircleTexture: { value: circleTexture.texture },
    uCircleCount: { value: circles.length },
    uTextureSize: { value: circleTexture.size },
    uCircleColor: { value: new THREE.Color(circleColor) },
    uBackgroundColor: { value: new THREE.Color(backgroundColor) },
  });

  // Update uniforms when controls change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uAnimationSpeed.value = animationSpeed;
      materialRef.current.uniforms.uAnimationStrength.value = animationStrength;
      materialRef.current.uniforms.uContainerRadius.value = containerRadius;
      materialRef.current.uniforms.uCircleTexture.value = circleTexture.texture;
      materialRef.current.uniforms.uCircleCount.value = circles.length;
      materialRef.current.uniforms.uTextureSize.value = circleTexture.size;
      materialRef.current.uniforms.uCircleColor.value.set(circleColor);
      materialRef.current.uniforms.uBackgroundColor.value.set(backgroundColor);
    }
  }, [
    animationSpeed,
    animationStrength,
    containerRadius,
    circleColor,
    backgroundColor,
    circleTexture,
    circles.length,
  ]);

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
      />
    </mesh>
  );
}
