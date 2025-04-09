"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls, folder, button } from "leva";

export function DustEffect() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Define presets
  const presets = {
    "Gentle Breeze": {
      windDirectionX: 0.3,
      windDirectionY: 0.1,
      windSpeed: 0.2,
      turbulence: 0.3,
      density: 0.4,
      scale: 2.0,
      dustColor: "#d2b48c",
      lightColor: "#fffaf0",
      lightIntensity: 0.6,
    },
    "Desert Haboob": {
      windDirectionX: 0.8,
      windDirectionY: 0.2,
      windSpeed: 0.7,
      turbulence: 0.5,
      density: 0.9,
      scale: 3.5,
      dustColor: "#b8860b",
      lightColor: "#ff8c00",
      lightIntensity: 0.8,
    },
    "Swirling Vortex": {
      windDirectionX: 0.0,
      windDirectionY: 0.0,
      windSpeed: 0.5,
      turbulence: 0.9,
      density: 0.7,
      scale: 1.5,
      dustColor: "#c19a6b",
      lightColor: "#ffe4b5",
      lightIntensity: 0.7,
    },
    "Ambient Dust": {
      windDirectionX: 0.1,
      windDirectionY: 0.1,
      windSpeed: 0.1,
      turbulence: 0.2,
      density: 0.3,
      scale: 1.0,
      dustColor: "#e6d8ad",
      lightColor: "#fffacd",
      lightIntensity: 0.5,
    },
  };

  // State to track current preset
  const [currentPreset, setCurrentPreset] = useState("Gentle Breeze");

  // Apply preset function
  const applyPreset = useCallback((presetName: string) => {
    setCurrentPreset(presetName);
    const preset = presets[presetName as keyof typeof presets];

    // Update all the controls
    setWindDirectionX(preset.windDirectionX);
    setWindDirectionY(preset.windDirectionY);
    setWindSpeed(preset.windSpeed);
    setTurbulence(preset.turbulence);
    setDensity(preset.density);
    setScale(preset.scale);
    setDustColor(preset.dustColor);
    setLightColor(preset.lightColor);
    setLightIntensity(preset.lightIntensity);
  }, []);

  // Individual controls with their own state
  const [windDirectionX, setWindDirectionX] = useState(0.3);
  const [windDirectionY, setWindDirectionY] = useState(0.1);
  const [windSpeed, setWindSpeed] = useState(0.2);
  const [turbulence, setTurbulence] = useState(0.3);
  const [density, setDensity] = useState(0.4);
  const [scale, setScale] = useState(2.0);
  const [dustColor, setDustColor] = useState("#d2b48c");
  const [lightColor, setLightColor] = useState("#fffaf0");
  const [lightIntensity, setLightIntensity] = useState(0.6);

  // Initialize with default preset
  useEffect(() => {
    applyPreset("Gentle Breeze");
  }, [applyPreset]);

  // Controls for the dust effect with simplified parameters
  useControls({
    preset: {
      options: Object.keys(presets),
      value: currentPreset,
      onChange: applyPreset,
    },
  });

  // Controls for individual parameters
  useControls({
    windDirectionX: {
      value: windDirectionX,
      min: -1,
      max: 1,
      step: 0.01,
      label: "Wind Direction X",
      onChange: setWindDirectionX,
    },
    windDirectionY: {
      value: windDirectionY,
      min: -1,
      max: 1,
      step: 0.01,
      label: "Wind Direction Y",
      onChange: setWindDirectionY,
    },
    windSpeed: {
      value: windSpeed,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Wind Speed",
      onChange: setWindSpeed,
    },
    turbulence: {
      value: turbulence,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: setTurbulence,
    },
    density: {
      value: density,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: setDensity,
    },
    scale: {
      value: scale,
      min: 0.1,
      max: 10,
      step: 0.1,
      onChange: setScale,
    },
    dustColor: {
      value: dustColor,
      onChange: setDustColor,
    },
    lightColor: {
      value: lightColor,
      onChange: setLightColor,
    },
    lightIntensity: {
      value: lightIntensity,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Light Intensity",
      onChange: setLightIntensity,
    },
  });

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

  // Fragment shader for dust rendering
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
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Simplex 3D Noise
    // by Ian McEwan, Ashima Arts
    vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      
      // Other corners
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      
      // Permutations
      i = mod(i, 289.0);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
              
      // Gradients
      float n_ = 1.0/7.0; // N=7
      vec3 ns = n_ * D.wyz - D.xzx;
      
      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
      
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      
      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      
      // Normalise gradients
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      
      // Mix final noise value
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
    
    // FBM (Fractal Brownian Motion) for layered noise
    float fbm(vec3 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      // Add several layers of noise
      for (int i = 0; i < 5; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    // Curl noise for realistic turbulence
    vec3 curl(vec3 p, float delta) {
      vec3 dx = vec3(delta, 0.0, 0.0);
      vec3 dy = vec3(0.0, delta, 0.0);
      vec3 dz = vec3(0.0, 0.0, delta);
      
      // Calculate gradient
      float x1 = fbm(p + dx, 3);
      float x2 = fbm(p - dx, 3);
      float y1 = fbm(p + dy, 3);
      float y2 = fbm(p - dy, 3);
      float z1 = fbm(p + dz, 3);
      float z2 = fbm(p - dz, 3);
      
      // Calculate curl
      float x = (y2 - y1) - (z2 - z1);
      float y = (z2 - z1) - (x2 - x1);
      float z = (x2 - x1) - (y2 - y1);
      
      return normalize(vec3(x, y, z));
    }
    
    // Dust particle function
    float dustParticle(vec2 uv, float time, float size, float speed) {
      // Create a moving dust particle
      vec2 center = vec2(
        fract(sin(uv.y * 100.0 + time * speed) * 1000.0),
        fract(cos(uv.x * 100.0 + time * speed * 0.7) * 1000.0)
      );
      
      float dist = length(uv - center);
      return smoothstep(size, 0.0, dist);
    }
    
    void main() {
      // Base coordinates with wind movement
      vec2 baseUv = vUv;
      
      // Apply wind direction and speed
      vec2 windOffset = uWindDirection * uTime * uWindSpeed;
      vec2 flowUv = baseUv + windOffset;
      
      // Scale factor for different noise layers
      float scaleFactor = uScale * 0.1;
      
      // Base dust layer (large scale movement)
      float baseDust = fbm(vec3(flowUv * scaleFactor, uTime * 0.1), 3) * 0.5 + 0.5;
      
      // Apply turbulence using curl noise
      vec3 curlVec = curl(vec3(flowUv * scaleFactor * 2.0, uTime * 0.2), 0.01);
      vec2 turbulenceOffset = vec2(curlVec.x, curlVec.y) * uTurbulence * 0.3;
      vec2 turbulentUv = flowUv + turbulenceOffset;
      
      // Medium scale dust features with turbulence
      float mediumDust = fbm(vec3(turbulentUv * scaleFactor * 3.0, uTime * 0.15), 2) * 0.5 + 0.5;
      
      // Fine dust particles (small scale details)
      float fineDetail = 0.0;
      for (int i = 0; i < 5; i++) {
        float size = 0.002 + 0.003 * float(i) / 5.0;
        float speed = 0.2 + 0.4 * float(i) / 5.0;
        fineDetail += dustParticle(turbulentUv, uTime, size, speed) * 0.2;
      }
      
      // Combine dust layers with different weights
      float dustNoise = baseDust * 0.5 + mediumDust * 0.3 + fineDetail * 0.2;
      
      // Apply density control
      float dustIntensity = dustNoise * uDensity;
      
      // Edge highlighting for volumetric effect
      float edgeFactor = (1.0 - abs(vUv.x - 0.5) * 2.0) * (1.0 - abs(vUv.y - 0.5) * 2.0);
      float lightFactor = edgeFactor * uLightIntensity;
      
      // Create depth variation
      float depthVariation = fbm(vec3(flowUv * scaleFactor * 0.5, uTime * 0.05), 2) * 0.5 + 0.5;
      
      // Mix dust color with light color based on density and lighting
      vec3 dustWithLight = mix(uDustColor, uLightColor, lightFactor * dustIntensity);
      
      // Apply depth variation to color
      vec3 finalColor = mix(dustWithLight, uDustColor * 0.8, depthVariation * 0.3);
      
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
      value: new THREE.Vector2(windDirectionX, windDirectionY),
    },
    uWindSpeed: { value: windSpeed },
    uTurbulence: { value: turbulence },
    uDensity: { value: density },
    uScale: { value: scale },
    uDustColor: { value: new THREE.Color(dustColor) },
    uLightColor: { value: new THREE.Color(lightColor) },
    uLightIntensity: { value: lightIntensity },
  });

  // Update uniforms when controls change
  React.useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uWindDirection.value.set(
        windDirectionX,
        windDirectionY
      );
      materialRef.current.uniforms.uWindSpeed.value = windSpeed;
      materialRef.current.uniforms.uTurbulence.value = turbulence;
      materialRef.current.uniforms.uDensity.value = density;
      materialRef.current.uniforms.uScale.value = scale;
      materialRef.current.uniforms.uDustColor.value.set(dustColor);
      materialRef.current.uniforms.uLightColor.value.set(lightColor);
      materialRef.current.uniforms.uLightIntensity.value = lightIntensity;
    }
  }, [
    windDirectionX,
    windDirectionY,
    windSpeed,
    turbulence,
    density,
    scale,
    dustColor,
    lightColor,
    lightIntensity,
  ]);

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
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
