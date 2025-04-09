"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useControls } from "leva";

export function Lava3DEffect() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Controls for the 3D lava effect
  const {
    flowSpeed,
    bubbleFrequency,
    bubbleHeight,
    crustThreshold,
    lavaGlow,
    baseColor,
    hotColor,
    crustColor,
    displacementScale,
    noiseScale,
    waveSpeed,
    eruptionFrequency,
    eruptionStrength,
    rimLightIntensity,
    detailLevel,
    viscosity,
    heatIntensity,
    crackFrequency,
    crackWidth,
    sphereRadius,
    rotation,
  } = useControls("Lava 3D Properties", {
    // Animation properties
    flowSpeed: { value: 0.3, min: 0, max: 1, step: 0.01 },
    waveSpeed: { value: 0.15, min: 0, max: 1, step: 0.01 },
    viscosity: { value: 0.7, min: 0.1, max: 1, step: 0.01 },
    rotation: { value: 0.1, min: 0, max: 0.5, step: 0.01 },

    // Bubble properties
    bubbleFrequency: { value: 4.0, min: 0.1, max: 10, step: 0.1 },
    bubbleHeight: { value: 0.3, min: 0, max: 1, step: 0.01 },

    // Crust properties
    crustThreshold: { value: 0.65, min: 0, max: 1, step: 0.01 },
    crackFrequency: { value: 40.0, min: 10, max: 100, step: 1.0 },
    crackWidth: { value: 0.1, min: 0.01, max: 0.3, step: 0.01 },

    // Eruption properties
    eruptionFrequency: { value: 0.08, min: 0, max: 0.2, step: 0.01 },
    eruptionStrength: { value: 0.8, min: 0, max: 2, step: 0.01 },

    // Visual properties
    lavaGlow: { value: 0.8, min: 0, max: 1.5, step: 0.01 },
    rimLightIntensity: { value: 0.6, min: 0, max: 1, step: 0.01 },
    heatIntensity: { value: 1.2, min: 0.5, max: 2, step: 0.01 },
    displacementScale: { value: 0.2, min: 0, max: 0.5, step: 0.01 },
    noiseScale: { value: 2.5, min: 0.1, max: 5, step: 0.1 },
    detailLevel: { value: 3, min: 1, max: 5, step: 1 },
    sphereRadius: { value: 2.0, min: 0.5, max: 5, step: 0.1 },

    // Colors
    baseColor: { value: "#ff4400" },
    hotColor: { value: "#ffdd00" },
    crustColor: { value: "#220000" },
  });

  // Vertex shader with displacement for bubbling effect
  const vertexShader = `
    uniform float uTime;
    uniform float uDisplacementScale;
    uniform float uNoiseScale;
    uniform float uBubbleFrequency;
    uniform float uBubbleHeight;
    uniform float uWaveSpeed;
    uniform float uEruptionFrequency;
    uniform float uEruptionStrength;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vDisplacement;
    
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
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      // Add several layers of noise
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      
      return value;
    }
    
    // Spherical coordinates to UV mapping
    vec2 getSphericalUV(vec3 p) {
      // Normalize the position
      vec3 n = normalize(p);
      
      // Convert to spherical coordinates
      float phi = atan(n.z, n.x);
      float theta = acos(n.y);
      
      // Map to UV space (0 to 1)
      vec2 uv = vec2(phi / (2.0 * 3.14159) + 0.5, theta / 3.14159);
      
      return uv;
    }
    
    // Eruption function for spherical surface
    float sphericalEruption(vec3 pos, float time) {
      // Convert position to UV for easier mapping
      vec2 uv = getSphericalUV(pos);
      
      // Create occasional eruptions at random locations
      float eruption = 0.0;
      
      // Create several potential eruption points
      for (int i = 0; i < 3; i++) {
        // Pseudo-random eruption location
        float seed = float(i) * 1234.5678;
        vec2 eruptionCenter = vec2(
          sin(time * 0.1 + seed) * 0.5 + 0.5,
          cos(time * 0.15 + seed) * 0.5 + 0.5
        );
        
        // Distance to eruption center (on sphere surface)
        float dist = length(uv - eruptionCenter);
        
        // Wrap-around for spherical surface
        dist = min(dist, length(uv - eruptionCenter + vec2(1.0, 0.0)));
        dist = min(dist, length(uv - eruptionCenter - vec2(1.0, 0.0)));
        
        // Eruption timing (periodic)
        float eruptionTime = sin(time * uEruptionFrequency + seed) * 0.5 + 0.5;
        eruptionTime = smoothstep(0.95, 1.0, eruptionTime); // Make eruptions more sudden
        
        // Add this eruption's contribution
        eruption += eruptionTime * smoothstep(0.2, 0.0, dist) * uEruptionStrength;
      }
      
      return eruption;
    }
    
    void main() {
      vPosition = position;
      vNormal = normal;
      
      // Get UV coordinates based on sphere position
      vUv = getSphericalUV(position);
      
      // Base noise for general terrain
      float baseNoise = fbm(vec3(vUv * uNoiseScale, uTime * uWaveSpeed)) * 0.5;
      
      // Bubble noise (higher frequency, more pronounced)
      float bubbleNoise = snoise(vec3(
        vUv.x * uBubbleFrequency,
        vUv.y * uBubbleFrequency,
        uTime * uWaveSpeed
      )) * uBubbleHeight;
      
      // Add occasional eruptions
      float eruptionEffect = sphericalEruption(position, uTime) * 2.0;
      
      // Combine displacement effects
      float displacement = baseNoise + bubbleNoise + eruptionEffect;
      
      // Apply displacement along normal
      vec3 newPosition = position + normal * displacement * uDisplacementScale;
      
      // Save displacement for fragment shader
      vDisplacement = displacement;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `;

  // Fragment shader for lava rendering
  const fragmentShader = `
    uniform float uTime;
    uniform float uFlowSpeed;
    uniform float uCrustThreshold;
    uniform float uLavaGlow;
    uniform float uRimLightIntensity;
    uniform float uHeatIntensity;
    uniform float uViscosity;
    uniform float uCrackFrequency;
    uniform float uCrackWidth;
    uniform int uDetailLevel;
    uniform vec3 uBaseColor;
    uniform vec3 uHotColor;
    uniform vec3 uCrustColor;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vDisplacement;
    
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
    
    // Voronoi noise for cell-like patterns
    float voronoi(vec2 uv, float scale, float speed, float time) {
      vec2 p = floor(uv * scale);
      vec2 f = fract(uv * scale);
      float res = 8.0;
      
      for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
          vec2 b = vec2(i, j);
          vec2 r = vec2(b) - f + (0.5 + 0.5 * sin(time * speed + dot(p + b, vec2(12.34, 56.78))));
          float d = dot(r, r);
          res = min(res, d);
        }
      }
      
      return sqrt(res);
    }
    
    // Organic lava crack pattern using noise
    float organicCracks(vec2 uv, float scale, float width, float time) {
      // Base noise for crack pattern
      float noise1 = snoise(vec3(uv * scale * 0.5, time * 0.05)) * 0.5 + 0.5;
      float noise2 = snoise(vec3(uv * scale * 0.2 + 100.0, time * 0.03)) * 0.5 + 0.5;
      
      // Create flow direction based on noise
      vec2 flowDir = vec2(
        snoise(vec3(uv * 0.5, time * 0.1)),
        snoise(vec3(uv * 0.5 + vec2(100.0, 200.0), time * 0.1))
      );
      
      // Distort UV based on flow direction
      vec2 distortedUV = uv + flowDir * 0.1;
      
      // Create ridge pattern for cracks
      float ridgeNoise1 = 1.0 - abs(snoise(vec3(distortedUV * scale, time * 0.02)) * 2.0);
      float ridgeNoise2 = 1.0 - abs(snoise(vec3(distortedUV * scale * 0.5 + 300.0, time * 0.01)) * 2.0);
      
      // Combine ridge patterns with different scales for varied crack widths
      float combinedRidge = max(
        pow(ridgeNoise1, 4.0) * 0.7,
        pow(ridgeNoise2, 8.0) * 1.3
      );
      
      // Apply noise modulation to create breaks and variations in the cracks
      float modulation = mix(0.4, 1.0, noise1 * noise2);
      
      // Create the final crack pattern
      float crack = smoothstep(width * modulation, 0.0, combinedRidge * 0.3);
      
      // Add some small-scale detail to the cracks
      float detail = snoise(vec3(uv * scale * 2.0, time * 0.1)) * 0.5 + 0.5;
      crack = mix(crack, crack * detail, 0.3);
      
      return crack;
    }
    
    void main() {
      // Flow effect - shift UV coordinates over time with viscosity influence
      float flowFactor = mix(0.2, 0.05, uViscosity);
      vec2 flowUv = vUv + vec2(
        uTime * uFlowSpeed * flowFactor * (1.0 + 0.2 * sin(vUv.y * 5.0)),
        uTime * uFlowSpeed * flowFactor * 0.5 * (1.0 + 0.2 * cos(vUv.x * 5.0))
      );
      
      // Create detailed noise patterns for color variation
      float noise1 = snoise(vec3(flowUv * 10.0, uTime * 0.2)) * 0.5 + 0.5;
      float noise2 = snoise(vec3(flowUv * 8.0, uTime * 0.3 + 100.0)) * 0.5 + 0.5;
      float noise3 = fbm(vec3(flowUv * 5.0, uTime * 0.1), uDetailLevel) * 0.5 + 0.5;
      
      // Combine noise patterns
      float combinedNoise = (noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.3);
      
      // Use displacement to determine hot spots with enhanced contrast
      float heat = vDisplacement * 2.0 + 0.5; // Normalize to 0-1 range
      heat = pow(heat, uHeatIntensity); // Increase contrast based on heat intensity
      
      // Add some high-frequency variation to the heat
      heat += snoise(vec3(flowUv * 20.0, uTime * 0.5)) * 0.1;
      
      // Determine if this area is crust (lower displacement areas)
      float crustNoise = snoise(vec3(flowUv * 3.0, uTime * 0.05)) * 0.1;
      float isCrust = 1.0 - smoothstep(uCrustThreshold - 0.15, uCrustThreshold + crustNoise, heat);
      
      // Create voronoi cell pattern for additional texture
      float cells = voronoi(flowUv, 5.0, 0.2, uTime);
      cells = smoothstep(0.0, 0.8, cells);
      
      // Mix colors based on heat, crust, and cell patterns
      vec3 hotLava = mix(uBaseColor, uHotColor, heat);
      vec3 finalColor = mix(hotLava, uCrustColor, isCrust);
      
      // Add cell pattern to the hot areas
      finalColor = mix(finalColor, uHotColor, (1.0 - isCrust) * cells * 0.2);
      
      // Add glow to hotter areas with enhanced intensity
      finalColor += uHotColor * heat * uLavaGlow * (1.0 - isCrust);
      
      // Add organic cracks in the crust
      if (isCrust > 0.3) {
        // Create organic cracks where the lava shows through
        float crack = organicCracks(flowUv, uCrackFrequency, uCrackWidth, uTime);
        
        // Make cracks more prominent in higher crust areas
        crack *= smoothstep(0.3, 0.7, isCrust);
        
        // Add some variation to crack intensity based on position
        float crackVariation = snoise(vec3(flowUv * 2.0, uTime * 0.05)) * 0.5 + 0.5;
        crack *= 0.7 + 0.6 * crackVariation;
        
        // Mix in hot lava color for the cracks
        finalColor = mix(finalColor, uHotColor, crack * 0.8);
        
        // Add glow to the cracks
        finalColor += uHotColor * crack * uLavaGlow * 0.5;
        
        // Add some extra detail to the edges of the cracks
        float crackEdge = organicCracks(flowUv, uCrackFrequency * 1.1, uCrackWidth * 1.5, uTime) - crack;
        crackEdge = max(0.0, crackEdge);
        finalColor = mix(finalColor, mix(uHotColor, uCrustColor, 0.5), crackEdge * 0.5);
      }
      
      // Add specular highlights to simulate wet lava
      vec3 lightDir = normalize(vec3(1.0, 2.0, 3.0));
      float specular = pow(max(0.0, dot(reflect(-lightDir, vNormal), normalize(cameraPosition - vPosition))), 20.0);
      finalColor += vec3(1.0, 0.9, 0.5) * specular * (1.0 - isCrust) * 0.7;
      
      // Add rim lighting for more dramatic effect
      float rim = 1.0 - max(0.0, dot(vNormal, normalize(cameraPosition - vPosition)));
      rim = pow(rim, 3.0) * uRimLightIntensity;
      finalColor += uHotColor * rim * (1.0 - isCrust * 0.5);
      
      // Add subtle smoke effect over the crust
      if (isCrust > 0.7) {
        float smoke = fbm(vec3(flowUv * 2.0 + uTime * 0.02, uTime * 0.01), 3) * 0.5;
        smoke *= smoothstep(0.7, 0.9, isCrust);
        finalColor = mix(finalColor, vec3(0.2, 0.2, 0.2), smoke * 0.3);
      }
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  // Create shader uniforms
  const uniforms = useRef({
    uTime: { value: 0 },
    uFlowSpeed: { value: flowSpeed },
    uDisplacementScale: { value: displacementScale },
    uNoiseScale: { value: noiseScale },
    uBubbleFrequency: { value: bubbleFrequency },
    uBubbleHeight: { value: bubbleHeight },
    uWaveSpeed: { value: waveSpeed },
    uCrustThreshold: { value: crustThreshold },
    uLavaGlow: { value: lavaGlow },
    uEruptionFrequency: { value: eruptionFrequency },
    uEruptionStrength: { value: eruptionStrength },
    uRimLightIntensity: { value: rimLightIntensity },
    uHeatIntensity: { value: heatIntensity },
    uViscosity: { value: viscosity },
    uCrackFrequency: { value: crackFrequency },
    uCrackWidth: { value: crackWidth },
    uDetailLevel: { value: detailLevel },
    uBaseColor: { value: new THREE.Color(baseColor) },
    uHotColor: { value: new THREE.Color(hotColor) },
    uCrustColor: { value: new THREE.Color(crustColor) },
    cameraPosition: { value: new THREE.Vector3() },
  });

  // Update uniforms when controls change
  React.useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uFlowSpeed.value = flowSpeed;
      materialRef.current.uniforms.uDisplacementScale.value = displacementScale;
      materialRef.current.uniforms.uNoiseScale.value = noiseScale;
      materialRef.current.uniforms.uBubbleFrequency.value = bubbleFrequency;
      materialRef.current.uniforms.uBubbleHeight.value = bubbleHeight;
      materialRef.current.uniforms.uWaveSpeed.value = waveSpeed;
      materialRef.current.uniforms.uCrustThreshold.value = crustThreshold;
      materialRef.current.uniforms.uLavaGlow.value = lavaGlow;
      materialRef.current.uniforms.uEruptionFrequency.value = eruptionFrequency;
      materialRef.current.uniforms.uEruptionStrength.value = eruptionStrength;
      materialRef.current.uniforms.uRimLightIntensity.value = rimLightIntensity;
      materialRef.current.uniforms.uHeatIntensity.value = heatIntensity;
      materialRef.current.uniforms.uViscosity.value = viscosity;
      materialRef.current.uniforms.uCrackFrequency.value = crackFrequency;
      materialRef.current.uniforms.uCrackWidth.value = crackWidth;
      materialRef.current.uniforms.uDetailLevel.value = detailLevel;
      materialRef.current.uniforms.uBaseColor.value.set(baseColor);
      materialRef.current.uniforms.uHotColor.value.set(hotColor);
      materialRef.current.uniforms.uCrustColor.value.set(crustColor);
    }

    // Update sphere radius
    if (meshRef.current) {
      meshRef.current.scale.set(sphereRadius, sphereRadius, sphereRadius);
    }
  }, [
    flowSpeed,
    displacementScale,
    noiseScale,
    bubbleFrequency,
    bubbleHeight,
    waveSpeed,
    crustThreshold,
    lavaGlow,
    eruptionFrequency,
    eruptionStrength,
    rimLightIntensity,
    heatIntensity,
    viscosity,
    crackFrequency,
    crackWidth,
    detailLevel,
    baseColor,
    hotColor,
    crustColor,
    sphereRadius,
  ]);

  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.cameraPosition.value.copy(
        state.camera.position
      );
    }

    // Rotate the sphere
    if (meshRef.current) {
      meshRef.current.rotation.y += rotation * 0.01;
    }
  });

  return (
    <group>
      {/* Main lava sphere */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
        />
      </mesh>

      {/* Ambient light for better visibility */}
      <ambientLight intensity={0.1} />

      {/* Point lights to enhance the glow effect */}
      <pointLight
        position={[2, 1, 2]}
        intensity={0.8}
        color="#ff6600"
        distance={10}
        decay={2}
      />
      <pointLight
        position={[-2, 1, -2]}
        intensity={0.5}
        color="#ff9900"
        distance={8}
        decay={2}
      />
      <pointLight
        position={[0, 2, 0]}
        intensity={0.6}
        color="#ffcc00"
        distance={12}
        decay={2}
      />
    </group>
  );
}
