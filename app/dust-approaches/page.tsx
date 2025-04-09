"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { DustApproach } from "./shared/types";

// Card component for each approach
interface ApproachCardProps {
  title: string;
  description: string;
  approach: DustApproach;
  features: string[];
  performance: string;
  imageUrl?: string;
}

function ApproachCard({
  title,
  description,
  approach,
  features,
  performance,
  imageUrl = "/dust-placeholder.jpg",
}: ApproachCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.02]">
      <div className="h-48 bg-gray-700 relative">
        {/* Placeholder for screenshot/preview */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <span className="text-lg font-semibold">{title} Preview</span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>

        <h4 className="font-semibold text-blue-400 mb-2">Key Features:</h4>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-gray-300 text-sm">
              {feature}
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <span className="font-semibold text-blue-400">Performance: </span>
          <span className="text-gray-300">{performance}</span>
        </div>

        <Link
          href={`/dust-approaches/${approach}`}
          className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Explore {title}
        </Link>
      </div>
    </div>
  );
}

export default function DustApproachesPage() {
  // State to track if we're on the client (for hydration safety)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Approach data
  const approaches = [
    {
      title: "Shader-Based Approach",
      description:
        "Uses advanced shader techniques to create the illusion of dust particles",
      approach: DustApproach.SHADER_BASED,
      features: [
        "Efficient GPU-based rendering",
        "Thresholding for sharper particles",
        "Voronoi noise for cellular patterns",
        "Depth variation for 3D feel",
      ],
      performance: "Excellent (handles millions of 'virtual' particles)",
    },
    {
      title: "Particle System Approach",
      description:
        "True 3D particles with physics-based movement and individual behaviors",
      approach: DustApproach.PARTICLE_SYSTEM,
      features: [
        "Real 3D particles in space",
        "Physics-based movement",
        "Individual particle lifecycle",
        "Depth-based rendering",
      ],
      performance: "Good (handles thousands of particles)",
    },
    {
      title: "Hybrid Approach",
      description:
        "Combines shader-based atmosphere with 3D particles for the best of both worlds",
      approach: DustApproach.HYBRID,
      features: [
        "Volumetric atmosphere from shaders",
        "Distinct particles with physics",
        "Balanced performance and detail",
        "Depth-based interaction between systems",
      ],
      performance: "Very Good (optimized combination)",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-6 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Dust Simulation Approaches</h1>
              <p className="text-lg opacity-70 mt-2">
                Comparing different techniques for creating realistic dust
                effects
              </p>
            </div>
            <nav>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Choose an Approach</h2>
            <p className="text-gray-300">
              Each approach has different strengths and trade-offs. Explore them
              to see which works best for your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {approaches.map((approach) => (
              <ApproachCard key={approach.approach} {...approach} />
            ))}
          </div>

          <div className="mt-12 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Understanding the Differences
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">
                  Shader-Based Approach
                </h3>
                <p className="text-gray-300">
                  Uses fragment shaders to create the illusion of particles
                  through clever noise functions and visual tricks. Extremely
                  efficient as all calculations happen on the GPU in parallel,
                  but particles aren't true 3D objects.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">
                  Particle System Approach
                </h3>
                <p className="text-gray-300">
                  Creates actual 3D particles that exist in the scene. Each
                  particle has its own position, velocity, and lifecycle. More
                  resource-intensive but provides true depth and can interact
                  with other scene elements.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">
                  Hybrid Approach
                </h3>
                <p className="text-gray-300">
                  Combines a shader-based atmospheric layer for the overall dust
                  volume with a smaller number of true 3D particles for the most
                  visible dust motes. Balances performance with visual fidelity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 bg-black text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p>
            These dust simulation techniques can be applied to various scenarios
            like atmospheric effects, particle visualizations, and environmental
            elements in games and interactive experiences.
          </p>
        </div>
      </footer>
    </div>
  );
}
