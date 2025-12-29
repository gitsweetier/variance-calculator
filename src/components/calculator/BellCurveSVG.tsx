'use client';

import { useMemo } from 'react';
import {
  expectedWinnings,
  winningsStdDev,
} from '@/lib/math/statistics';

interface BellCurveSVGProps {
  winrate: number;
  stdDev: number;
  hands: number;
}

export function BellCurveSVG({ winrate, stdDev, hands }: BellCurveSVGProps) {
  const { curvePoints, ev, sigma, minX, maxX } = useMemo(() => {
    const ev = expectedWinnings(hands, winrate);
    const sigma = winningsStdDev(hands, stdDev);

    // Range: EV ± 3.5 sigma
    const minX = ev - 3.5 * sigma;
    const maxX = ev + 3.5 * sigma;

    // Generate bell curve points
    const numPoints = 100;
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = minX + (i / numPoints) * (maxX - minX);
      // Normal PDF: (1/(σ√(2π))) * exp(-((x-μ)²/(2σ²)))
      const z = (x - ev) / sigma;
      const y = Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
      points.push({ x, y });
    }

    return { curvePoints: points, ev, sigma, minX, maxX };
  }, [winrate, stdDev, hands]);

  // SVG dimensions
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Find max Y for scaling
  const maxY = Math.max(...curvePoints.map((p) => p.y));

  // Scale functions
  const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * chartWidth;
  const scaleY = (y: number) => chartHeight - (y / maxY) * chartHeight;

  // Generate curve path
  const curvePath = curvePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(' ');

  // Generate filled areas (loss = x < 0, win = x > 0)
  const lossAreaPoints = curvePoints.filter((p) => p.x <= 0);
  const winAreaPoints = curvePoints.filter((p) => p.x >= 0);

  const generateAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
    return `${path} L ${scaleX(points[points.length - 1].x)} ${chartHeight} L ${scaleX(points[0].x)} ${chartHeight} Z`;
  };

  // Format axis labels
  const formatBB = (bb: number) => {
    if (Math.abs(bb) >= 1000) return `${(bb / 1000).toFixed(0)}k`;
    return bb.toFixed(0);
  };

  // X axis ticks at -2σ, -1σ, EV, +1σ, +2σ
  const xTicks = [
    { x: ev - 2 * sigma, label: '-2σ' },
    { x: ev - sigma, label: '-1σ' },
    { x: ev, label: 'EV' },
    { x: ev + sigma, label: '+1σ' },
    { x: ev + 2 * sigma, label: '+2σ' },
  ].filter((t) => t.x >= minX && t.x <= maxX);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* Loss area (x < 0) */}
        {lossAreaPoints.length > 1 && (
          <path d={generateAreaPath(lossAreaPoints)} fill="rgba(220, 38, 38, 0.3)" />
        )}

        {/* Win area (x > 0) */}
        {winAreaPoints.length > 1 && (
          <path d={generateAreaPath(winAreaPoints)} fill="rgba(22, 163, 74, 0.3)" />
        )}

        {/* Zero line */}
        {minX < 0 && maxX > 0 && (
          <line
            x1={scaleX(0)}
            y1={0}
            x2={scaleX(0)}
            y2={chartHeight}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* EV line */}
        <line
          x1={scaleX(ev)}
          y1={0}
          x2={scaleX(ev)}
          y2={chartHeight}
          stroke="#FF4D00"
          strokeWidth="2"
        />

        {/* Bell curve */}
        <path d={curvePath} fill="none" stroke="#000" strokeWidth="2" />

        {/* X axis */}
        <g transform={`translate(0, ${chartHeight})`}>
          <line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#000" strokeWidth="2" />
          {xTicks.map((tick) => (
            <g key={tick.label} transform={`translate(${scaleX(tick.x)}, 0)`}>
              <line y2={6} stroke="#000" strokeWidth="2" />
              <text y={18} textAnchor="middle" fontSize="9" fill="#000">
                {tick.label}
              </text>
              <text y={30} textAnchor="middle" fontSize="8" fill="#666">
                {formatBB(tick.x)}
              </text>
            </g>
          ))}
        </g>

        {/* Labels */}
        {lossAreaPoints.length > 5 && (
          <text
            x={scaleX(Math.min(0, ev) - sigma)}
            y={chartHeight - 20}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#dc2626"
          >
            LOSE
          </text>
        )}
        {winAreaPoints.length > 5 && (
          <text
            x={scaleX(Math.max(0, ev) + sigma)}
            y={chartHeight - 20}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#16a34a"
          >
            WIN
          </text>
        )}
      </g>
    </svg>
  );
}
