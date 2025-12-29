'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { Toggle } from '@/components/ui/Toggle';
import { TournamentSimulationPath } from '@/lib/tournament/types';

type DisplayUnit = 'buyins' | 'dollars';

interface TournamentDetailedRunChartProps {
  path: TournamentSimulationPath | null;
  buyIn: number;
  unit: DisplayUnit;
}

function formatCountShort(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

function formatMoneyOrBI(valueDollars: number, buyIn: number, unit: DisplayUnit): string {
  if (unit === 'dollars') {
    const abs = Math.abs(valueDollars);
    if (abs >= 1000000) return `${valueDollars < 0 ? '-' : ''}$${formatNumber(abs / 1000000, 1)}M`;
    if (abs >= 1000) return `${valueDollars < 0 ? '-' : ''}$${formatNumber(abs / 1000, 1)}k`;
    return `${valueDollars < 0 ? '-' : ''}$${formatNumber(abs, 0)}`;
  }
  const bi = buyIn > 0 ? valueDollars / buyIn : 0;
  const absBI = Math.abs(bi);
  const decimals = absBI >= 100 ? 0 : absBI >= 10 ? 1 : 2;
  const prefix = bi < 0 ? '-' : '';
  return `${prefix}${formatNumber(Math.abs(bi), decimals)} BI`;
}

export function TournamentDetailedRunChart({ path, buyIn, unit }: TournamentDetailedRunChartProps) {
  const [mounted, setMounted] = useState(false);
  const [showDrawdown, setShowDrawdown] = useState(true);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(100);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (!path) return [];
    return path.tournaments.map((t, i) => ({
      tournaments: t,
      profit: path.profit[i] ?? 0,
      peak: path.peaks[i] ?? 0,
      drawdown: -(path.drawdowns[i] ?? 0),
    }));
  }, [path]);

  const filteredData = useMemo(() => {
    if (chartData.length === 0) return [];
    const startIdx = Math.floor((chartData.length * rangeStart) / 100);
    const endIdx = Math.ceil((chartData.length * rangeEnd) / 100);
    return chartData.slice(startIdx, endIdx);
  }, [chartData, rangeStart, rangeEnd]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: number;
  }) => {
    if (!active || !payload) return null;

    const profit = payload.find((p) => p.dataKey === 'profit')?.value;
    const peak = payload.find((p) => p.dataKey === 'peak')?.value;
    const drawdown = payload.find((p) => p.dataKey === 'drawdown')?.value;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{formatNumber(label || 0)} tournaments</p>
        {profit !== undefined ? (
          <p className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Profit: {formatMoneyOrBI(profit, buyIn, unit)}
          </p>
        ) : null}
        {peak !== undefined ? (
          <p className="text-sm text-blue-600">Peak: {formatMoneyOrBI(peak, buyIn, unit)}</p>
        ) : null}
        {drawdown !== undefined && drawdown < 0 ? (
          <p className="text-sm text-amber-600">
            Drawdown: {formatMoneyOrBI(Math.abs(drawdown), buyIn, unit)}
          </p>
        ) : null}
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

  // Avoid SSR sizing warnings from ResponsiveContainer.
  if (!mounted) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-gray-400">Loading chart…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <Toggle label="Show Drawdown" checked={showDrawdown} onChange={setShowDrawdown} />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Max Drawdown:{' '}
            <strong className="text-amber-600">{formatMoneyOrBI(path.maxDrawdown, buyIn, unit)}</strong>
          </span>
          <span className="text-sm text-gray-600">
            Final:{' '}
            <strong className={path.finalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {path.finalProfit >= 0 ? '+' : ''}
              {formatMoneyOrBI(path.finalProfit, buyIn, unit)}
            </strong>
          </span>
        </div>
      </div>

      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey="tournaments"
              tickFormatter={formatCountShort}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              stroke={COLORS.axis}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              tickFormatter={(v) => formatMoneyOrBI(v, buyIn, unit)}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              stroke={COLORS.axis}
              axisLine={{ stroke: COLORS.grid }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine y={0} stroke={COLORS.axis} strokeDasharray="5 5" />

            {showDrawdown ? (
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="none"
                fill={COLORS.drawdown}
                fillOpacity={0.25}
                name="Drawdown"
              />
            ) : null}

            <Line
              type="monotone"
              dataKey="peak"
              stroke={COLORS.axis}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="Peak"
            />

            <Line
              type="monotone"
              dataKey="profit"
              stroke={COLORS.detailedPath}
              strokeWidth={2}
              dot={false}
              name="Profit"
            />

            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => {
                const colors: Record<string, string> = {
                  Profit: COLORS.detailedPath,
                  Peak: COLORS.axis,
                  Drawdown: COLORS.drawdown,
                };
                return <span style={{ color: colors[value] || COLORS.axis }}>{value}</span>;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Zoom Range:{' '}
          <span className="text-blue-600">{formatCountShort(filteredData[0]?.tournaments || 0)}</span> -{' '}
          <span className="text-blue-600">
            {formatCountShort(filteredData[filteredData.length - 1]?.tournaments || 0)}
          </span>
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
        The line shows cumulative profit; the dashed line is your peak; the shaded area (optional) is drawdown from peak.
      </p>
    </div>
  );
}


