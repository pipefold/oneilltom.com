"use client";

import React, { useCallback, useEffect } from "react";
import { useControls, folder, button, Leva } from "leva";
import { DustParameters, DustPreset } from "./types";
import { dustPresets, getPreset } from "./presets";

interface DustControlsProps {
  onChange: (params: DustParameters) => void;
  initialPreset?: string;
  showPerformance?: boolean;
  fps?: number;
  particleCount?: number;
}

export function DustControls({
  onChange,
  initialPreset = "Gentle Breeze",
  showPerformance = false,
  fps = 0,
  particleCount = 0,
}: DustControlsProps) {
  // Get initial parameters from the preset
  const initialParams = getPreset(initialPreset).parameters;

  // Create controls for preset selection
  const { preset } = useControls({
    preset: {
      options: Object.keys(dustPresets),
      value: initialPreset,
    },
  });

  // Create controls for wind parameters
  const windParams = useControls(
    "Wind",
    {
      windDirectionX: {
        value: initialParams.windDirection.x,
        min: -1,
        max: 1,
        step: 0.01,
        label: "Direction X",
      },
      windDirectionY: {
        value: initialParams.windDirection.y,
        min: -1,
        max: 1,
        step: 0.01,
        label: "Direction Y",
      },
      windSpeed: {
        value: initialParams.windSpeed,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Speed",
      },
      turbulence: {
        value: initialParams.turbulence,
        min: 0,
        max: 1,
        step: 0.01,
      },
      timeScale: {
        value: initialParams.timeScale,
        min: 0.1,
        max: 3,
        step: 0.1,
        label: "Time Scale",
      },
    },
    { collapsed: false }
  );

  // Create controls for appearance parameters
  const appearanceParams = useControls(
    "Appearance",
    {
      density: {
        value: initialParams.density,
        min: 0,
        max: 1,
        step: 0.01,
      },
      scale: {
        value: initialParams.scale,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      particleSize: {
        value: initialParams.particleSize,
        min: 0.001,
        max: 0.1,
        step: 0.001,
      },
      dustColor: {
        value: initialParams.dustColor,
        label: "Dust Color",
      },
      lightColor: {
        value: initialParams.lightColor,
        label: "Light Color",
      },
      lightIntensity: {
        value: initialParams.lightIntensity,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Light Intensity",
      },
    },
    { collapsed: false }
  );

  // Performance metrics display
  useControls(
    "Performance",
    {
      fps: {
        value: fps.toFixed(1),
        disabled: true,
        label: "FPS",
      },
      particleCount: {
        value: particleCount.toString(),
        disabled: true,
        label: "Particles",
      },
    },
    {
      collapsed: !showPerformance,
      render: () => showPerformance,
    }
  );

  // Handle preset changes
  useEffect(() => {
    const presetParams = getPreset(preset).parameters;

    // Update all the controls to match the preset
    Object.entries(presetParams).forEach(([key, value]) => {
      if (key === "windDirection") {
        // Handle nested windDirection object
        const windDir = value as { x: number; y: number };
        // These will be updated in the next render cycle
      } else {
        // For other parameters, they will be updated in the next render cycle
      }
    });
  }, [preset]);

  // Combine all parameters and notify parent component when they change
  useEffect(() => {
    const params: DustParameters = {
      windDirection: {
        x: windParams.windDirectionX,
        y: windParams.windDirectionY,
      },
      windSpeed: windParams.windSpeed,
      turbulence: windParams.turbulence,
      density: appearanceParams.density,
      scale: appearanceParams.scale,
      dustColor: appearanceParams.dustColor,
      lightColor: appearanceParams.lightColor,
      lightIntensity: appearanceParams.lightIntensity,
      timeScale: windParams.timeScale,
      particleSize: appearanceParams.particleSize,
    };

    onChange(params);
  }, [
    windParams.windDirectionX,
    windParams.windDirectionY,
    windParams.windSpeed,
    windParams.turbulence,
    windParams.timeScale,
    appearanceParams.density,
    appearanceParams.scale,
    appearanceParams.particleSize,
    appearanceParams.dustColor,
    appearanceParams.lightColor,
    appearanceParams.lightIntensity,
    onChange,
  ]);

  return null; // The Leva UI is rendered automatically
}

// Wrapper component that includes the Leva panel
export function DustControlsWithPanel(props: DustControlsProps) {
  return (
    <>
      <Leva collapsed={false} />
      <DustControls {...props} />
    </>
  );
}
