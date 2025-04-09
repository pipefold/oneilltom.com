"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, useTexture, shaderMaterial } from "@react-three/drei";
import { Leva } from "leva";
import { CirclePackingShader } from "./circle-packing";
import { CirclePacking3D } from "./circle-packing-3d";
import { AccurateCirclePacking } from "./accurate-circle-packing";
import { AccurateCirclePacking3D } from "./accurate-circle-packing-3d";

// Basic vertex shader
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Basic fragment shader with color gradient
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;
  
  void main() {
    vec3 color = mix(uColorA, uColorB, sin(vUv.x * 10.0 + uTime) * 0.5 + 0.5);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Create shader uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0x1e88e5) },
    uColorB: { value: new THREE.Color(0xff4081) },
  });

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Optional: Add some movement to the mesh
    if (meshRef.current) {
      meshRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
      meshRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[4, 4, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Wave shader component
function WavePlane() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Wave vertex shader
  const waveVertexShader = `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      
      // Create wave effect
      vec3 pos = position;
      float dist = length(uv - 0.5);
      pos.z = sin(dist * uFrequency + uTime) * uAmplitude;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  // Wave fragment shader
  const waveFragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
      // Create color based on position and time
      vec3 color = vec3(0.5 + 0.5 * sin(vUv.x * 6.28 + uTime),
                        0.5 + 0.5 * sin(vUv.y * 6.28 + uTime * 0.7),
                        0.5 + 0.5 * sin(length(vUv - 0.5) * 8.0 + uTime * 1.2));
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Create shader uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uAmplitude: { value: 0.2 },
    uFrequency: { value: 10.0 },
  });

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -4]} rotation={[0, 0, 0]}>
      <planeGeometry args={[4, 4, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        uniforms={uniforms.current}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Simplified noise shader component
function NoiseShaderSphere() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Simplified vertex shader with basic displacement
  const noiseVertexShader = `
    uniform float uTime;
    
    varying vec2 vUv;
    varying float vElevation;
    
    // Simple pseudo-random function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      vUv = uv;
      
      // Simple noise based on position and time
      float noise = random(vUv + uTime * 0.1) * 0.2;
      
      // Displace vertex along normal
      vec3 newPosition = position + normal * noise;
      vElevation = noise;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  // Simplified fragment shader
  const noiseFragmentShader = `
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform vec3 uAccentColor;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      // Create color based on elevation and UV coordinates
      float mixStrength = vElevation * 2.0 + 0.5 + sin(vUv.x * 10.0 + uTime) * 0.2;
      vec3 color = mix(uBaseColor, uAccentColor, mixStrength);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // Create shader uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uBaseColor: { value: new THREE.Color(0x2a6c8f) },
    uAccentColor: { value: new THREE.Color(0xf7b538) },
  });

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Rotate the sphere slowly
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={noiseVertexShader}
        fragmentShader={noiseFragmentShader}
        uniforms={uniforms.current}
      />
    </mesh>
  );
}

export default function R3FShadersPage() {
  // State to track if we're on the client (for hydration safety)
  const [isClient, setIsClient] = useState(false);
  // State for active shader tab
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Tab content configuration
  const tabs = [
    { name: "Gradient Shader", component: ShaderPlane },
    { name: "Wave Shader", component: WavePlane },
    { name: "Noise Shader", component: NoiseShaderSphere },
    { name: "Circle Packing", component: CirclePackingShader },
    { name: "Circle Packing 3D", component: CirclePacking3D },
    { name: "Accurate Circle Packing", component: AccurateCirclePacking },
    { name: "Accurate Circle Packing 3D", component: AccurateCirclePacking3D },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Leva controls panel */}
      <Leva collapsed={false} />
      <header className="p-4 bg-black text-white">
        <h1 className="text-2xl font-bold">R3F Shader Experiments</h1>
        <p className="text-sm opacity-70">
          Exploring shader materials with React Three Fiber
        </p>
      </header>

      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === index
                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <main className="flex-grow p-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-[600px] shadow-lg">
          {isClient && (
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <ambientLight intensity={0.5} />
              {React.createElement(tabs[activeTab].component)}
              <OrbitControls enableZoom={true} enablePan={true} />
            </Canvas>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-sm opacity-70">
        <p>Tip: Use mouse to orbit, zoom, and pan around the 3D scenes</p>
      </footer>
    </div>
  );
}
