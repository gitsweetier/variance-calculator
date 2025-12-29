'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SimulationPath, ConfidencePoint } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { formatNumber, formatHandsShort, formatBB } from '@/lib/utils';

interface SamplePathsChartProps {
  paths: SimulationPath[];
  confidenceData: ConfidencePoint[];
  bigBlindSize?: number;
}

export function SamplePathsChart({
  paths,
  confidenceData,
  bigBlindSize,
}: SamplePathsChartProps) {
  // Merge paths with confidence data for charting
  const chartData = useMemo(() => {
    if (paths.length === 0) return [];

    const dataMap = new Map<number, Record<string, number>>();

    // Add confidence data
    for (const point of confidenceData) {
      dataMap.set(point.hands, {
        hands: point.hands,
        ev: point.ev,
        ci70Lower: point.ci70Lower,
        ci70Upper: point.ci70Upper,
        ci95Lower: point.ci95Lower,
        ci95Upper: point.ci95Upper,
      });
    }

    // Add path data
    for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
      const path = paths[pathIdx];
      for (let i = 0; i < path.hands.length; i++) {
        const hands = path.hands[i];
        const existing = dataMap.get(hands) || { hands };
        existing[`path${pathIdx}`] = path.winnings[i];
        dataMap.set(hands, existing);
      }
    }

    // Sort by hands and return array
    return Array.from(dataMap.values()).sort((a, b) => a.hands - b.hands);
  }, [paths, confidenceData]);

  // Format value for display
  const formatValue = (value: number) => {
    return formatBB(value, bigBlindSize, 0);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string }>;
    label?: number;
  }) => {
    if (!active || !payload) return null;

    const evPayload = payload.find((p) => p.name === 'EV');
    const ci95 = {
      lower: payload.find((p) => p.name === 'ci95Lower')?.value,
      upper: payload.find((p) => p.name === 'ci95Upper')?.value,
    };

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {formatNumber(label || 0)} hands
        </p>
        {evPayload && (
          <p className="text-sm text-blue-600">
            EV: {formatValue(evPayload.value)}
          </p>
        )}
        {ci95.lower !== undefined && ci95.upper !== undefined && (
          <p className="text-sm text-gray-600">
            95% CI: {formatValue(ci95.lower)} to {formatValue(ci95.upper)}
          </p>
        )}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-400">Run a simulation to see sample paths</p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey="hands"
              tickFormatter={formatHandsShort}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              stroke={COLORS.axis}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              tickFormatter={(v) => formatHandsShort(v)}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              stroke={COLORS.axis}
              axisLine={{ stroke: COLORS.grid }}
              label={{
                value: bigBlindSize ? '$' : 'BB',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: COLORS.axis },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* 95% CI Band */}
            <Area
              type="monotone"
              dataKey="ci95Upper"
              stroke="none"
              fill={COLORS.ci95Fill}
              name="ci95Upper"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="ci95Lower"
              stroke="none"
              fill="#ffffff"
              name="ci95Lower"
              legendType="none"
            />

            {/* 70% CI Band */}
            <Area
              type="monotone"
              dataKey="ci70Upper"
              stroke="none"
              fill={COLORS.ci70Fill}
              name="ci70Upper"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="ci70Lower"
              stroke="none"
              fill="#ffffff"
              name="ci70Lower"
              legendType="none"
            />

            {/* Zero line */}
            <ReferenceLine y={0} stroke={COLORS.axis} strokeDasharray="5 5" />

            {/* Sample paths */}
            {paths.map((_, idx) => (
              <Line
                key={`path${idx}`}
                type="monotone"
                dataKey={`path${idx}`}
                stroke={COLORS.samplePath}
                strokeWidth={1}
                dot={false}
                opacity={0.5}
                name={`Path ${idx + 1}`}
                legendType="none"
              />
            ))}

            {/* EV Line */}
            <Line
              type="monotone"
              dataKey="ev"
              stroke={COLORS.evLine}
              strokeWidth={2.5}
              dot={false}
              name="EV"
            />

            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                if (value === 'EV') return <span style={{ color: COLORS.evLine }}>Expected Value</span>;
                return value;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-4 text-xs text-gray-500 leading-relaxed">
        Each line represents one possible outcome. The blue line shows expected value (EV). Shaded areas show 70% (darker) and 95% (lighter) confidence intervals.
      </p>
    </div>
  );
}
