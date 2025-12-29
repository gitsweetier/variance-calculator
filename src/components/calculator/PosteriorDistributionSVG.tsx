'use client';

import { useMemo } from 'react';
import type { PosteriorPoint, CredibleInterval } from '@/lib/types';

interface PosteriorDistributionSVGProps {
  posteriorCurve: PosteriorPoint[];
  credibleIntervals: CredibleInterval[];
  observedWinrate: number;
}

export function PosteriorDistributionSVG({
  posteriorCurve,
  credibleIntervals,
  observedWinrate,
}: PosteriorDistributionSVGProps) {
  const { minX, maxX, maxY, scaleX, scaleY } = useMemo(() => {
    const winrates = posteriorCurve.map((p) => p.winrate);
    const minX = Math.min(...winrates);
    const maxX = Math.max(...winrates);
    const maxY = Math.max(...posteriorCurve.map((p) => p.density));

    // SVG dimensions
    const width = 400;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 50, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * chartWidth;
    const scaleY = (y: number) => chartHeight - (y / maxY) * chartHeight;

    return { minX, maxX, maxY, scaleX, scaleY, chartWidth, chartHeight };
  }, [posteriorCurve]);

  // SVG dimensions
  const width = 400;
  const height = 200;
  const margin = { top: 20, right: 20, bottom: 50, left: 20 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Generate curve path
  const curvePath = posteriorCurve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.winrate)} ${scaleY(p.density)}`)
    .join(' ');

  // Generate filled areas (loss = winrate < 0, win = winrate >= 0)
  const lossAreaPoints = posteriorCurve.filter((p) => p.winrate <= 0);
  const winAreaPoints = posteriorCurve.filter((p) => p.winrate >= 0);

  const generateAreaPath = (points: PosteriorPoint[]) => {
    if (points.length === 0) return '';
    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.winrate)} ${scaleY(p.density)}`)
      .join(' ');
    return `${path} L ${scaleX(points[points.length - 1].winrate)} ${chartHeight} L ${scaleX(points[0].winrate)} ${chartHeight} Z`;
  };

  // Get the 95% CI for shading
  const ci95 = credibleIntervals.find((ci) => ci.probability === 0.95);

  // X axis ticks
  const range = maxX - minX;
  const step = range / 4;
  const xTicks = [
    minX,
    minX + step,
    minX + 2 * step,
    minX + 3 * step,
    maxX,
  ].map((x) => ({ x, label: `${x >= 0 ? '+' : ''}${x.toFixed(1)}` }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* 95% CI band */}
        {ci95 && (
          <rect
            x={scaleX(Math.max(ci95.lower, minX))}
            y={0}
            width={scaleX(Math.min(ci95.upper, maxX)) - scaleX(Math.max(ci95.lower, minX))}
            height={chartHeight}
            fill="rgba(59, 130, 246, 0.1)"
          />
        )}

        {/* Loss area (winrate < 0) */}
        {lossAreaPoints.length > 1 && (
          <path d={generateAreaPath(lossAreaPoints)} fill="rgba(220, 38, 38, 0.3)" />
        )}

        {/* Win area (winrate >= 0) */}
        {winAreaPoints.length > 1 && (
          <path d={generateAreaPath(winAreaPoints)} fill="rgba(22, 163, 74, 0.3)" />
        )}

        {/* Zero line (breakeven) */}
        {minX < 0 && maxX > 0 && (
          <line
            x1={scaleX(0)}
            y1={0}
            x2={scaleX(0)}
            y2={chartHeight}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
        )}

        {/* Observed winrate line */}
        <line
          x1={scaleX(observedWinrate)}
          y1={0}
          x2={scaleX(observedWinrate)}
          y2={chartHeight}
          stroke="#FF4D00"
          strokeWidth="2"
        />

        {/* Posterior curve */}
        <path d={curvePath} fill="none" stroke="#000" strokeWidth="2" />

        {/* X axis */}
        <g transform={`translate(0, ${chartHeight})`}>
          <line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#000" strokeWidth="2" />
          {xTicks.map((tick, i) => (
            <g key={i} transform={`translate(${scaleX(tick.x)}, 0)`}>
              <line y2={6} stroke="#000" strokeWidth="2" />
              <text y={18} textAnchor="middle" fontSize="9" fill="#000">
                {tick.label}
              </text>
            </g>
          ))}
          <text
            x={chartWidth / 2}
            y={38}
            textAnchor="middle"
            fontSize="10"
            fill="#666"
          >
            True Winrate (BB/100)
          </text>
        </g>

        {/* Labels */}
        {lossAreaPoints.length > 5 && (
          <text
            x={scaleX(Math.min(0, observedWinrate) - (range / 6))}
            y={chartHeight - 20}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#dc2626"
          >
            LOSER
          </text>
        )}
        {winAreaPoints.length > 5 && (
          <text
            x={scaleX(Math.max(0, observedWinrate) + (range / 6))}
            y={chartHeight - 20}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#16a34a"
          >
            WINNER
          </text>
        )}

        {/* Zero label */}
        {minX < 0 && maxX > 0 && (
          <text
            x={scaleX(0)}
            y={-8}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
          >
            Breakeven
          </text>
        )}

        {/* Observed label */}
        <text
          x={scaleX(observedWinrate)}
          y={-8}
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="#FF4D00"
        >
          Observed: {observedWinrate.toFixed(1)}
        </text>
      </g>
    </svg>
  );
}
