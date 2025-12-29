'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Toggle } from './ui/Toggle';
import { SimulationPath } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { formatNumber, formatHandsShort, formatBB } from '@/lib/utils';

interface DetailedRunChartProps {
  path: SimulationPath | null;
  bigBlindSize?: number;
}

export function DetailedRunChart({ path, bigBlindSize }: DetailedRunChartProps) {
  const [showDrawdown, setShowDrawdown] = useState(true);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(100);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!path) return [];
    return path.hands.map((h, i) => ({
      hands: h,
      winnings: path.winnings[i],
      peak: path.peaks[i],
      drawdown: -path.drawdowns[i], // Negative for display below zero
    }));
  }, [path]);

  // Filter data based on range slider
  const filteredData = useMemo(() => {
    if (chartData.length === 0) return [];
    const startIdx = Math.floor((chartData.length * rangeStart) / 100);
    const endIdx = Math.ceil((chartData.length * rangeEnd) / 100);
    return chartData.slice(startIdx, endIdx);
  }, [chartData, rangeStart, rangeEnd]);

  // Format value for display
  const formatValue = (value: number) => {
    return formatBB(value, bigBlindSize, 0);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; dataKey: string }>;
    label?: number;
  }) => {
    if (!active || !payload) return null;

    const winnings = payload.find((p) => p.dataKey === 'winnings')?.value;
    const peak = payload.find((p) => p.dataKey === 'peak')?.value;
    const drawdown = payload.find((p) => p.dataKey === 'drawdown')?.value;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {formatNumber(label || 0)} hands
        </p>
        {winnings !== undefined && (
          <p className={`text-sm ${winnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Winnings: {formatValue(winnings)}
          </p>
        )}
        {peak !== undefined && (
          <p className="text-sm text-blue-600">
            Peak: {formatValue(peak)}
          </p>
        )}
        {drawdown !== undefined && drawdown < 0 && (
          <p className="text-sm text-amber-600">
            Drawdown: {formatValue(Math.abs(drawdown))}
          </p>
        )}
      </div>
    );
  };

  if (!path) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-400">Run a simulation to see a detailed sample</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <Toggle
          label="Show Drawdown"
          checked={showDrawdown}
          onChange={setShowDrawdown}
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Max Drawdown: <strong className="text-amber-600">
              {formatBB(path.maxDrawdown, bigBlindSize, 0)}
            </strong>
          </span>
          <span className="text-sm text-gray-600">
            Final: <strong className={path.finalWinnings >= 0 ? 'text-green-600' : 'text-red-600'}>
              {path.finalWinnings >= 0 ? '+' : ''}{formatBB(path.finalWinnings, bigBlindSize, 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

            <ReferenceLine y={0} stroke={COLORS.axis} strokeDasharray="5 5" />

            {/* Drawdown area */}
            {showDrawdown && (
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="none"
                fill={COLORS.drawdown}
                fillOpacity={0.25}
                name="Drawdown"
              />
            )}

            {/* Peak line */}
            <Line
              type="monotone"
              dataKey="peak"
              stroke={COLORS.axis}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Peak"
            />

            {/* Winnings line */}
            <Line
              type="monotone"
              dataKey="winnings"
              stroke={COLORS.detailedPath}
              strokeWidth={2}
              dot={false}
              name="Winnings"
            />

            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                const colors: Record<string, string> = {
                  'Winnings': COLORS.detailedPath,
                  'Peak': COLORS.axis,
                  'Drawdown': COLORS.drawdown,
                };
                return <span style={{ color: colors[value] || COLORS.axis }}>{value}</span>;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Range Slider */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Zoom Range: <span className="text-blue-600">{formatHandsShort(filteredData[0]?.hands || 0)}</span> -{' '}
          <span className="text-blue-600">{formatHandsShort(filteredData[filteredData.length - 1]?.hands || 0)}</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max={rangeEnd - 5}
            value={rangeStart}
            onChange={(e) => setRangeStart(parseInt(e.target.value))}
            className="flex-1"
          />
          <input
            type="range"
            min={rangeStart + 5}
            max="100"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(parseInt(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500 leading-relaxed">
        The blue line tracks your winnings. The dashed line shows your peak, and the amber area shows drawdown from peak.
      </p>
    </div>
  );
}
