'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  expectedWinnings,
  winningsStdDev,
} from '@/lib/math/statistics';
import { Z_95 } from '@/lib/constants';

interface MonteCarloSVGProps {
  winrate: number;
  stdDev: number;
  hands: number;
  seed?: number;
}

// Simple seeded random number generator
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(random: () => number): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Generate a single sample path
function generatePath(
  hands: number,
  winrate: number,
  stdDev: number,
  random: () => number,
  numPoints: number = 50
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const stepSize = Math.max(100, Math.floor(hands / numPoints));

  let cumulative = 0;
  for (let h = stepSize; h <= hands; h += stepSize) {
    // Per-step winnings follow N(μ, σ²) where:
    // μ = winrate * stepSize / 100
    // σ = stdDev * sqrt(stepSize / 100)
    const stepMean = winrate * (stepSize / 100);
    const stepStd = stdDev * Math.sqrt(stepSize / 100);
    cumulative += stepMean + stepStd * normalRandom(random);
    points.push({ x: h, y: cumulative });
  }

  // Ensure we have the final point
  if (points[points.length - 1].x !== hands) {
    const remaining = hands - points[points.length - 1].x;
    const stepMean = winrate * (remaining / 100);
    const stepStd = stdDev * Math.sqrt(remaining / 100);
    cumulative += stepMean + stepStd * normalRandom(random);
    points.push({ x: hands, y: cumulative });
  }

  return points;
}

export function MonteCarloSVG({ winrate, stdDev, hands, seed = 42 }: MonteCarloSVGProps) {
  // Track if we're on the client to avoid hydration mismatch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { paths, evLine, ci95, bounds } = useMemo(() => {
    const numPoints = 50;

    // Only generate random paths on client to avoid hydration mismatch
    const generatedPaths: { x: number; y: number }[][] = [];
    if (isClient) {
      const random = seededRandom(seed);
      const numPaths = 15;
      for (let i = 0; i < numPaths; i++) {
        generatedPaths.push(generatePath(hands, winrate, stdDev, random, numPoints));
      }
    }

    // Generate EV line and confidence bands (deterministic, safe for SSR)
    const stepSize = Math.max(100, Math.floor(hands / numPoints));
    const evPoints: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    const ci95Points: { x: number; lower: number; upper: number }[] = [
      { x: 0, lower: 0, upper: 0 },
    ];

    for (let h = stepSize; h <= hands; h += stepSize) {
      const ev = expectedWinnings(h, winrate);
      const sigma = winningsStdDev(h, stdDev);
      evPoints.push({ x: h, y: ev });
      ci95Points.push({
        x: h,
        lower: ev - Z_95 * sigma,
        upper: ev + Z_95 * sigma,
      });
    }

    // Add final point
    if (evPoints[evPoints.length - 1].x !== hands) {
      const ev = expectedWinnings(hands, winrate);
      const sigma = winningsStdDev(hands, stdDev);
      evPoints.push({ x: hands, y: ev });
      ci95Points.push({
        x: hands,
        lower: ev - Z_95 * sigma,
        upper: ev + Z_95 * sigma,
      });
    }

    // Calculate bounds for scaling
    let minY = 0;
    let maxY = 0;

    for (const path of generatedPaths) {
      for (const point of path) {
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    }

    for (const point of ci95Points) {
      minY = Math.min(minY, point.lower);
      maxY = Math.max(maxY, point.upper);
    }

    // Add padding
    const yRange = maxY - minY;
    const padding = yRange * 0.1;
    minY -= padding;
    maxY += padding;

    return {
      paths: generatedPaths,
      evLine: evPoints,
      ci95: ci95Points,
      bounds: { minY, maxY, maxX: hands },
    };
  }, [winrate, stdDev, hands, seed, isClient]);

  // SVG dimensions
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Scale functions
  const scaleX = (x: number) => (x / bounds.maxX) * chartWidth;
  const scaleY = (y: number) =>
    chartHeight - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * chartHeight;

  // Generate path string
  const pathToString = (points: { x: number; y: number }[]) =>
    points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
      .join(' ');

  // Generate CI area path
  const ciAreaPath = () => {
    const upperPath = ci95.map((p) => `${scaleX(p.x)},${scaleY(p.upper)}`).join(' L ');
    const lowerPath = ci95
      .slice()
      .reverse()
      .map((p) => `${scaleX(p.x)},${scaleY(p.lower)}`)
      .join(' L ');
    return `M ${upperPath} L ${lowerPath} Z`;
  };

  // Format axis labels
  const formatHands = (h: number) => {
    if (h >= 1000000) return `${h / 1000000}M`;
    if (h >= 1000) return `${h / 1000}k`;
    return h.toString();
  };

  const formatBB = (bb: number) => {
    if (Math.abs(bb) >= 1000) return `${(bb / 1000).toFixed(0)}k`;
    return bb.toFixed(0);
  };

  // Generate axis ticks
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * bounds.maxX));
  const yRange = bounds.maxY - bounds.minY;
  const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 5)));
  const yTicks: number[] = [];
  for (let y = Math.ceil(bounds.minY / yStep) * yStep; y <= bounds.maxY; y += yStep) {
    yTicks.push(y);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Grid lines */}
        <g stroke="rgba(0,0,0,0.1)" strokeWidth="1">
          {xTicks.map((x) => (
            <line key={`x-${x}`} x1={scaleX(x)} y1={0} x2={scaleX(x)} y2={chartHeight} />
          ))}
          {yTicks.map((y) => (
            <line key={`y-${y}`} x1={0} y1={scaleY(y)} x2={chartWidth} y2={scaleY(y)} />
          ))}
        </g>

        {/* Zero line */}
        {bounds.minY < 0 && bounds.maxY > 0 && (
          <line
            x1={0}
            y1={scaleY(0)}
            x2={chartWidth}
            y2={scaleY(0)}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* 95% CI band */}
        <path d={ciAreaPath()} fill="rgba(0,0,0,0.08)" />

        {/* Sample paths */}
        {paths.map((path, i) => (
          <path
            key={i}
            d={pathToString(path)}
            fill="none"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1.5"
          />
        ))}

        {/* EV line */}
        <path
          d={pathToString(evLine)}
          fill="none"
          stroke="#FF4D00"
          strokeWidth="2"
          strokeDasharray="6,4"
        />

        {/* X axis */}
        <g transform={`translate(0, ${chartHeight})`}>
          <line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#000" strokeWidth="2" />
          {xTicks.map((x) => (
            <g key={`xtick-${x}`} transform={`translate(${scaleX(x)}, 0)`}>
              <line y2={6} stroke="#000" strokeWidth="2" />
              <text y={20} textAnchor="middle" fontSize="10" fill="#000">
                {formatHands(x)}
              </text>
            </g>
          ))}
          <text x={chartWidth / 2} y={35} textAnchor="middle" fontSize="10" fill="#666">
            HANDS
          </text>
        </g>

        {/* Y axis */}
        <g>
          <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#000" strokeWidth="2" />
          {yTicks.map((y) => (
            <g key={`ytick-${y}`} transform={`translate(0, ${scaleY(y)})`}>
              <line x2={-6} stroke="#000" strokeWidth="2" />
              <text x={-10} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#000">
                {formatBB(y)}
              </text>
            </g>
          ))}
          <text
            transform={`translate(-45, ${chartHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            PROFIT (BB)
          </text>
        </g>

        {/* Legend */}
        <g transform={`translate(${chartWidth - 120}, 10)`}>
          <line x1={0} y1={0} x2={20} y2={0} stroke="#FF4D00" strokeWidth="2" strokeDasharray="6,4" />
          <text x={25} y={4} fontSize="9" fill="#000">EV</text>
          <line x1={0} y1={15} x2={20} y2={15} stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
          <text x={25} y={19} fontSize="9" fill="#000">Sample paths</text>
          <rect x={0} y={28} width={20} height={10} fill="rgba(0,0,0,0.08)" />
          <text x={25} y={36} fontSize="9" fill="#000">95% CI</text>
        </g>
      </g>
    </svg>
  );
}
