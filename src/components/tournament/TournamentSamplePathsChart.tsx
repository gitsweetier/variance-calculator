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
  Legend,
  ReferenceLine,
} from 'recharts';
import { COLORS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';
import { TournamentConfidencePoint, TournamentSimulationPath } from '@/lib/tournament/types';

type DisplayUnit = 'buyins' | 'dollars';

interface TournamentSamplePathsChartProps {
  paths: TournamentSimulationPath[];
  confidence: TournamentConfidencePoint[];
  buyIn: number;
  unit: DisplayUnit;
}

function formatCountShort(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

function formatValue(valueDollars: number, buyIn: number, unit: DisplayUnit): string {
  if (unit === 'dollars') return `$${formatNumber(valueDollars, 0)}`;
  const bi = buyIn > 0 ? valueDollars / buyIn : 0;
  const decimals = Math.abs(bi) >= 100 ? 0 : Math.abs(bi) >= 10 ? 1 : 2;
  return `${formatNumber(bi, decimals)} BI`;
}

function formatYAxisTick(valueDollars: number, buyIn: number, unit: DisplayUnit): string {
  if (unit === 'dollars') {
    const abs = Math.abs(valueDollars);
    const sign = valueDollars < 0 ? '-' : '';
    if (abs >= 1000000) return `${sign}$${formatNumber(abs / 1000000, 1)}M`;
    if (abs >= 1000) return `${sign}$${formatNumber(abs / 1000, 1)}k`;
    return `${sign}$${formatNumber(abs, 0)}`;
  }
  const bi = buyIn > 0 ? valueDollars / buyIn : 0;
  const absBI = Math.abs(bi);
  const sign = bi < 0 ? '-' : '';
  const decimals = absBI >= 100 ? 0 : absBI >= 10 ? 1 : 2;
  return `${sign}${formatNumber(absBI, decimals)}`;
}

export function TournamentSamplePathsChart({
  paths,
  confidence,
  buyIn,
  unit,
}: TournamentSamplePathsChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = useMemo(() => {
    if (paths.length === 0) return [];

    const map = new Map<number, Record<string, number>>();

    for (const pt of confidence) {
      map.set(pt.tournaments, {
        tournaments: pt.tournaments,
        ev: pt.ev,
        ci70Lower: pt.ci70Lower,
        ci70Upper: pt.ci70Upper,
        ci95Lower: pt.ci95Lower,
        ci95Upper: pt.ci95Upper,
      });
    }

    for (let pathIdx = 0; pathIdx < paths.length; pathIdx++) {
      const p = paths[pathIdx];
      for (let i = 0; i < p.tournaments.length; i++) {
        const t = p.tournaments[i] ?? 0;
        const existing = map.get(t) || { tournaments: t };
        existing[`path${pathIdx}`] = p.profit[i] ?? 0;
        map.set(t, existing);
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.tournaments as number) - (b.tournaments as number));
  }, [paths, confidence]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: number;
  }) => {
    if (!active || !payload) return null;

    const ev = payload.find((p) => p.name === 'EV')?.value;
    const ci95Lower = payload.find((p) => p.name === 'ci95Lower')?.value;
    const ci95Upper = payload.find((p) => p.name === 'ci95Upper')?.value;

    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{formatNumber(label || 0)} tournaments</p>
        {ev !== undefined ? (
          <p className="text-sm text-blue-600">EV: {formatValue(ev, buyIn, unit)}</p>
        ) : null}
        {ci95Lower !== undefined && ci95Upper !== undefined ? (
          <p className="text-sm text-gray-600">
            95% CI: {formatValue(ci95Lower, buyIn, unit)} to {formatValue(ci95Upper, buyIn, unit)}
          </p>
        ) : null}
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
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey="tournaments"
              tickFormatter={formatCountShort}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              stroke={COLORS.axis}
              axisLine={{ stroke: COLORS.grid }}
            />
            <YAxis
              tickFormatter={(v) => formatYAxisTick(v, buyIn, unit)}
              tick={{ fontSize: 12, fill: COLORS.axis }}
              stroke={COLORS.axis}
              axisLine={{ stroke: COLORS.grid }}
              label={{
                value: unit === 'dollars' ? '$' : 'BI',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: COLORS.axis },
              }}
            />
            <Tooltip content={<CustomTooltip />} />

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

            <ReferenceLine y={0} stroke={COLORS.axis} strokeDasharray="5 5" />

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
        Each line is one possible tournament sequence. The blue line is EV; shaded bands are 70% and 95% normal-approx confidence intervals.
      </p>
    </div>
  );
}


