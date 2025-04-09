"use client";

import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { DustParameters } from "../shared/types";
import { random, randomGaussian, clamp } from "../shared/utils/math";
import { hexToNormalizedRgb } from "../shared/utils/color";

// Interface for a single dust particle
interface DustParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  age: number;
  lifetime: number;
  opacity: number;
  color: THREE.Color;
}

interface ParticleLayerProps {
  parameters: DustParameters;
  particleCount?: number;
}

export function ParticleLayer({
  parameters,
  particleCount = 1000,
}: ParticleLayerProps) {
  // References
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const particlesRef = useRef<DustParticle[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Create particle texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Create a radial gradient for a soft particle
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // Initialize particles
  useEffect(() => {
    initializeParticles();
  }, [particleCount]);

  // Initialize particles with random positions and properties
  const initializeParticles = () => {
    const particles: DustParticle[] = [];
    const dustColor = new THREE.Color().fromArray(
      Object.values(hexToNormalizedRgb(parameters.dustColor))
    );

    for (let i = 0; i < particleCount; i++) {
      // Create a particle with random position within a volume
      // For hybrid approach, focus particles in a smaller area for better visibility
      const particle: DustParticle = {
        position: new THREE.Vector3(
          random(-8, 8),
          random(0.5, 4),
          random(-8, 8)
        ),
        velocity: new THREE.Vector3(
          randomGaussian(0, 0.02),
          randomGaussian(0, 0.01),
          randomGaussian(0, 0.02)
        ),
        size: randomGaussian(
          parameters.particleSize,
          parameters.particleSize * 0.3
        ),
        age: random(0, 1), // Start with random age for variation
        lifetime: random(3, 8), // Shorter lifetime for more dynamic movement
        opacity: random(0.5, 1.0), // Higher opacity for better visibility
        color: dustColor.clone(),
      };

      particles.push(particle);
    }

    particlesRef.current = particles;
  };

  // Update particles based on parameters
  useEffect(() => {
    if (!particlesRef.current.length) return;

    const dustColor = new THREE.Color().fromArray(
      Object.values(hexToNormalizedRgb(parameters.dustColor))
    );

    // Update existing particles with new parameters
    particlesRef.current.forEach((particle) => {
      particle.color.copy(dustColor);
    });
  }, [parameters]);

  // Animation loop
  useFrame((state, delta) => {
    if (!meshRef.current || !particlesRef.current.length) return;

    // Scale delta by timeScale parameter
    const scaledDelta = delta * parameters.timeScale;

    // Update each particle
    particlesRef.current.forEach((particle, i) => {
      // Age the particle
      particle.age += scaledDelta;

      // Calculate life ratio (0 = new, 1 = dead)
      const lifeRatio = particle.age / particle.lifetime;

      // Reset particle if it's too old
      if (lifeRatio >= 1) {
        resetParticle(particle);
      }

      // Apply wind force
      const windForce = new THREE.Vector3(
        parameters.windDirection.x,
        parameters.windDirection.y * 0.2, // Less vertical movement
        parameters.windDirection.x * 0.5 // Some z-movement for depth
      ).multiplyScalar(parameters.windSpeed * 0.5);

      // Apply turbulence
      if (parameters.turbulence > 0) {
        const turbulenceScale = parameters.turbulence * 0.2;
        const noiseTime = state.clock.elapsedTime * 0.2;

        // Simple noise-based turbulence
        const turbulenceX =
          Math.sin(particle.position.x * 0.1 + noiseTime) *
          Math.sin(particle.position.z * 0.1 + noiseTime * 0.7) *
          turbulenceScale;

        const turbulenceY =
          Math.sin(particle.position.y * 0.1 + noiseTime * 1.3) *
          Math.sin(particle.position.x * 0.1 + noiseTime * 0.9) *
          turbulenceScale;

        const turbulenceZ =
          Math.sin(particle.position.z * 0.1 + noiseTime * 1.1) *
          Math.sin(particle.position.y * 0.1 + noiseTime * 0.8) *
          turbulenceScale;

        particle.velocity.x += turbulenceX;
        particle.velocity.y += turbulenceY;
        particle.velocity.z += turbulenceZ;
      }

      // Apply wind force to velocity
      particle.velocity.add(windForce.clone().multiplyScalar(scaledDelta));

      // Apply slight gravity
      particle.velocity.y -= 0.01 * scaledDelta;

      // Apply drag (air resistance)
      particle.velocity.multiplyScalar(0.99);

      // Update position based on velocity
      particle.position.add(
        particle.velocity.clone().multiplyScalar(scaledDelta)
      );

      // Boundary check - wrap around if particles go too far
      if (particle.position.x < -10) particle.position.x = 10;
      if (particle.position.x > 10) particle.position.x = -10;
      if (particle.position.z < -10) particle.position.z = 10;
      if (particle.position.z > 10) particle.position.z = -10;

      // Keep particles above ground
      if (particle.position.y < 0) {
        particle.position.y = 0;
        particle.velocity.y = Math.abs(particle.velocity.y) * 0.3; // Bounce a little
      }

      // Cap height
      if (particle.position.y > 8) {
        particle.position.y = 8;
        particle.velocity.y *= -0.3; // Bounce back down
      }

      // Calculate opacity based on age and density
      // Fade in at start, fade out at end
      const fadeIn = clamp(particle.age / 0.3, 0, 1);
      const fadeOut = clamp(1 - (lifeRatio - 0.7) / 0.3, 0, 1);
      particle.opacity = fadeIn * fadeOut * parameters.density * 0.8;

      // Update the instanced mesh
      dummy.position.copy(particle.position);

      // Scale based on particle size and parameter
      const finalSize = particle.size * (1 + parameters.scale * 0.2);
      dummy.scale.set(finalSize, finalSize, finalSize);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Update colors and opacity
      meshRef.current.setColorAt(i, particle.color);
    });

    // Update the instance matrix and colors
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  // Reset a particle to a new random state
  const resetParticle = (particle: DustParticle) => {
    // Reset position to a random location
    particle.position.set(random(-8, 8), random(0.5, 4), random(-8, 8));

    // Reset velocity
    particle.velocity.set(
      randomGaussian(0, 0.02),
      randomGaussian(0, 0.01),
      randomGaussian(0, 0.02)
    );

    // Reset age and lifetime
    particle.age = 0;
    particle.lifetime = random(3, 8);

    // Reset size
    particle.size = randomGaussian(
      parameters.particleSize,
      parameters.particleSize * 0.3
    );

    // Reset opacity
    particle.opacity = random(0.5, 1.0);
  };

  // Custom shader material for particles
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        diffuseTexture: { value: particleTexture },
        pointMultiplier: {
          value:
            window.innerHeight /
            (2.0 * Math.tan((0.5 * 60.0 * Math.PI) / 180.0)),
        },
      },
      vertexShader: `
        attribute vec3 color;
        varying vec3 vColor;
        varying vec2 vUv;
        uniform float pointMultiplier;
        
        void main() {
          vColor = color;
          vUv = uv;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Calculate point size based on distance from camera
          gl_PointSize = pointMultiplier * ${parameters.particleSize.toFixed(
            4
          )} / -mvPosition.z;
        }
      `,
      fragmentShader: `
        uniform sampler2D diffuseTexture;
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          // Sample texture
          vec4 texColor = texture2D(diffuseTexture, gl_PointCoord);
          
          // Apply color and opacity
          gl_FragColor = vec4(vColor, 1.0) * texColor;
          
          // Discard transparent pixels
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [particleTexture, parameters.particleSize]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particleCount]}
      material={particleMaterial}
    >
      <planeGeometry args={[1, 1]} />
    </instancedMesh>
  );
}
