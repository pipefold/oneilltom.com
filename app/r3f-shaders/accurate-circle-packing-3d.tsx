"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls, button } from "leva";

// Circle packing algorithm for a sphere
interface Circle {
  x: number;
  y: number;
  z: number;
  radius: number;
  id: number;
}

// Convert spherical coordinates to Cartesian
function sphericalToCartesian(
  radius: number,
  theta: number,
  phi: number
): { x: number; y: number; z: number } {
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi),
  };
}

// Generate circle packing on a sphere
function generateSphericalCirclePacking(
  sphereRadius: number,
  minCircleRadius: number,
  maxCircleRadius: number,
  maxAttempts: number,
  maxCircles: number
): Circle[] {
  const circles: Circle[] = [];
  let attempts = 0;
  let id = 0;

  // Try to place circles until we reach max attempts or max circles
  while (attempts < maxAttempts && circles.length < maxCircles) {
    attempts++;

    // Generate a random radius for the circle
    // Use a power distribution to favor smaller circles
    const circleRadius =
      minCircleRadius +
      (maxCircleRadius - minCircleRadius) * Math.pow(Math.random(), 2);

    // Generate a random position on the sphere
    // Use uniform distribution on a sphere
    const theta = Math.random() * Math.PI * 2; // Longitude (0 to 2π)
    const phi = Math.acos(2 * Math.random() - 1); // Latitude (0 to π)

    // Convert to Cartesian coordinates
    const pos = sphericalToCartesian(sphereRadius, theta, phi);

    // Check if this circle overlaps with any existing circle
    // For simplicity, we'll use Euclidean distance, though it's not perfect for spherical surfaces
    let overlaps = false;
    for (const circle of circles) {
      const dx = circle.x - pos.x;
      const dy = circle.y - pos.y;
      const dz = circle.z - pos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Adjust for curvature (approximate)
      const effectiveRadius1 =
        circle.radius * (1 - circle.radius / (2 * sphereRadius));
      const effectiveRadius2 =
        circleRadius * (1 - circleRadius / (2 * sphereRadius));

      if (distance < effectiveRadius1 + effectiveRadius2) {
        overlaps = true;
        break;
      }
    }

    // If it doesn't overlap, add it to our list
    if (!overlaps) {
      circles.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        radius: circleRadius,
        id: id++,
      });
      attempts = 0; // Reset attempts when we successfully place a circle
    }
  }

  return circles;
}

// 3D Accurate circle packing shader component
export function AccurateCirclePacking3D() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // State to trigger regeneration of circle packing
  const [regenerateFlag, setRegenerateFlag] = useState(false);

  // Controls for the circle packing algorithm
  const {
    sphereRadius,
    minCircleRadius,
    maxCircleRadius,
    maxAttempts,
    maxCircles,
    animationSpeed,
    animationStrength,
    circleColor,
    backgroundColor,
    displacementStrength,
  } = useControls("Accurate Circle Packing 3D", {
    sphereRadius: { value: 1.0, min: 0.5, max: 2.0, step: 0.1 },
    minCircleRadius: { value: 0.05, min: 0.01, max: 0.2, step: 0.01 },
    maxCircleRadius: { value: 0.2, min: 0.1, max: 0.4, step: 0.01 },
    maxAttempts: { value: 1000, min: 100, max: 5000, step: 100 },
    maxCircles: { value: 200, min: 50, max: 500, step: 10 },
    animationSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 },
    animationStrength: { value: 0.02, min: 0, max: 0.1, step: 0.01 },
    displacementStrength: { value: 0.05, min: 0, max: 0.2, step: 0.01 },
    regenerate: button(() => setRegenerateFlag((prev) => !prev)),
    circleColor: { value: "#ffffff" },
    backgroundColor: { value: "#000000" },
  });

  // Generate circle packing
  const circles = useMemo(() => {
    return generateSphericalCirclePacking(
      sphereRadius,
      minCircleRadius,
      maxCircleRadius,
      maxAttempts,
      maxCircles
    );
  }, [
    sphereRadius,
    minCircleRadius,
    maxCircleRadius,
    maxAttempts,
    maxCircles,
    regenerateFlag,
  ]);

  // Create a texture to store circle data
  const circleTexture = useMemo(() => {
    // Create a data texture to store circle information
    // We use RGBA format where R=x, G=y, B=z, A=radius
    const size = Math.ceil(Math.sqrt(circles.length));
    const data = new Float32Array(size * size * 4).fill(0);

    // Fill the texture with circle data
    circles.forEach((circle, i) => {
      if (i < size * size) {
        data[i * 4] = circle.x;
        data[i * 4 + 1] = circle.y;
        data[i * 4 + 2] = circle.z;
        data[i * 4 + 3] = circle.radius;
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

  // Vertex shader with displacement
  const vertexShader = `
    uniform float uTime;
    uniform float uDisplacementStrength;
    uniform sampler2D uCircleTexture;
    uniform int uCircleCount;
    uniform int uTextureSize;
    uniform float uAnimationSpeed;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vPosition = position;
      vNormal = normal;
      
      // Initialize displacement
      float displacement = 0.0;
      vec3 pos = normalize(position);
      
      // Check if this vertex is inside any circle
      for (int i = 0; i < 1000; i++) {
        if (i >= uCircleCount) break;
        
        // Calculate texture coordinates
        int y = i / uTextureSize;
        int x = i - (y * uTextureSize);
        vec2 texCoord = vec2(float(x) + 0.5, float(y) + 0.5) / float(uTextureSize);
        
        // Get circle data
        vec4 circleData = texture2D(uCircleTexture, texCoord);
        vec3 circlePos = circleData.xyz;
        float radius = circleData.w;
        
        // Calculate distance to circle center
        float dist = distance(pos, normalize(circlePos));
        
        // If we're inside this circle, add displacement
        if (dist < radius * 1.2) {
          float animFactor = sin(uTime * uAnimationSpeed + float(i) * 0.1) * 0.5 + 0.5;
          displacement += (1.0 - smoothstep(0.0, radius, dist)) * uDisplacementStrength * animFactor;
        }
      }
      
      // Apply displacement along normal
      vec3 newPosition = position + normal * displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  // Fragment shader for rendering circles on a sphere
  const fragmentShader = `
    uniform float uTime;
    uniform float uAnimationSpeed;
    uniform float uAnimationStrength;
    uniform sampler2D uCircleTexture;
    uniform int uCircleCount;
    uniform int uTextureSize;
    uniform vec3 uCircleColor;
    uniform vec3 uBackgroundColor;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      // Initialize with background color
      vec3 color = uBackgroundColor;
      
      // Normalize position for sphere surface
      vec3 pos = normalize(vPosition);
      
      // Loop through all circles
      for (int i = 0; i < 1000; i++) {
        if (i >= uCircleCount) break;
        
        // Calculate texture coordinates
        int y = i / uTextureSize;
        int x = i - (y * uTextureSize);
        vec2 texCoord = vec2(float(x) + 0.5, float(y) + 0.5) / float(uTextureSize);
        
        // Get circle data
        vec4 circleData = texture2D(uCircleTexture, texCoord);
        vec3 circlePos = circleData.xyz;
        float radius = circleData.w;
        
        // Apply subtle animation to radius
        float animOffset = float(i) * 0.1;
        float animatedRadius = radius * (1.0 + sin(uTime * uAnimationSpeed + animOffset) * uAnimationStrength);
        
        // Calculate distance to circle center (on sphere surface)
        float dist = distance(pos, normalize(circlePos));
        
        // If we're inside this circle, set the color
        if (dist < animatedRadius) {
          color = uCircleColor;
          
          // Add subtle lighting based on normal
          float lighting = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
          color *= lighting;
          
          // Add rim lighting
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          rim = pow(rim, 3.0) * 0.5;
          color += rim * uCircleColor;
          
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
    uDisplacementStrength: { value: displacementStrength },
    uCircleTexture: { value: circleTexture.texture },
    uCircleCount: { value: circles.length },
    uTextureSize: { value: circleTexture.size },
    uCircleColor: { value: new THREE.Color(circleColor) },
    uBackgroundColor: { value: new THREE.Color(backgroundColor) },
    cameraPosition: { value: new THREE.Vector3() },
  });

  // Update uniforms when controls change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uAnimationSpeed.value = animationSpeed;
      materialRef.current.uniforms.uAnimationStrength.value = animationStrength;
      materialRef.current.uniforms.uDisplacementStrength.value =
        displacementStrength;
      materialRef.current.uniforms.uCircleTexture.value = circleTexture.texture;
      materialRef.current.uniforms.uCircleCount.value = circles.length;
      materialRef.current.uniforms.uTextureSize.value = circleTexture.size;
      materialRef.current.uniforms.uCircleColor.value.set(circleColor);
      materialRef.current.uniforms.uBackgroundColor.value.set(backgroundColor);
    }
  }, [
    animationSpeed,
    animationStrength,
    displacementStrength,
    circleColor,
    backgroundColor,
    circleTexture,
    circles.length,
  ]);

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
    <mesh ref={meshRef}>
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
