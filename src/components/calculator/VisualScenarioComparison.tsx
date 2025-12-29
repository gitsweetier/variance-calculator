'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
  LabelList
} from 'recharts';
import { compareScenarios, generateScenarioInsight } from '@/lib/math/scenarios';
import type { ScenarioMetrics } from '@/lib/types';

interface VisualScenarioComparisonProps {
  winrate: number;
  stdDev: number;
  hands: number;
  bankroll: number;
  stakes: number;
}

function formatDollars(d: number): string {
  const sign = d >= 0 ? '+' : '';
  if (Math.abs(d) >= 1000) return `${sign}$${(d / 1000).toFixed(1)}k`;
  return `${sign}$${d.toFixed(0)}`;
}

function formatPercent(p: number): string {
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(1)}%`;
}

function formatHourly(d: number): string {
  const sign = d >= 0 ? '+' : '';
  return `${sign}$${d.toFixed(2)}/hr`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ 
        background: 'white', 
        border: '2px solid black', 
        padding: '0.75rem',
        fontFamily: 'var(--font-mono)',
        boxShadow: '4px 4px 0px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{data.name || label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ fontSize: '0.75rem', color: entry.color }}>
            {entry.name}: {
              entry.name.includes('RoR') || entry.name.includes('Risk') 
                ? formatPercent(entry.value)
                : formatDollars(entry.value)
            }
          </p>
        ))}
        {data.desc && (
          <p style={{ fontSize: '0.625rem', marginTop: '0.5rem', opacity: 0.6, maxWidth: '200px' }}>
            {data.desc}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function VisualScenarioComparison({
  winrate,
  stdDev,
  hands,
  bankroll,
  stakes,
}: VisualScenarioComparisonProps) {
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

  const comparison = useMemo(
    () => compareScenarios(winrate, stakes, hands, stdDev, bankroll),
    [winrate, stakes, hands, stdDev, bankroll]
  );

  const insight = useMemo(
    () => generateScenarioInsight(comparison),
    [comparison]
  );

  const chartData = useMemo(() => {
    return comparison.scenarios.map(s => ({
      name: s.scenario.name,
      shortName: s.scenario.id === 'current' ? 'Curr' : 
                 s.scenario.id.includes('plus') ? `+${s.scenario.id.replace('plus', '')}%` :
                 s.scenario.id.includes('minus') ? `-${s.scenario.id.replace('minus', '')}%` : 
                 s.scenario.id === 'halfStakes' ? '½Stk' : s.scenario.id,
      ev: s.expectedValueDollars,
      ror: s.riskOfRuin,
      hourly: s.hourlyRateDollars,
      isBase: s.scenario.isBase,
      desc: s.scenario.description,
      // For scatter plot
      x: s.riskOfRuin * 100, // Risk %
      y: s.expectedValueDollars, // Reward $
      z: 1 // Size bubble
    }));
  }, [comparison]);

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title">Scenario Analysis</div>
        <div style={{ padding: '1.5rem', opacity: 0.6, textAlign: 'center' }}>
          Scenario comparison requires a positive winrate. Adjust your winrate slider above.
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="block-title">
          Scenario Analysis
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setViewMode('charts')}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              background: viewMode === 'charts' ? 'black' : 'white',
              color: viewMode === 'charts' ? 'white' : 'black',
              border: '2px solid black',
              cursor: 'pointer'
            }}
          >
            VISUAL
          </button>
          <button 
            onClick={() => setViewMode('table')}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              background: viewMode === 'table' ? 'black' : 'white',
              color: viewMode === 'table' ? 'white' : 'black',
              border: '2px solid black',
              cursor: 'pointer'
            }}
          >
            TABLE
          </button>
        </div>
      </div>

      {viewMode === 'charts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Risk vs Reward Scatter */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.8 }}>
              RISK vs REWARD
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Risk of Ruin" 
                    unit="%" 
                    label={{ value: 'Risk of Ruin (%)', position: 'bottom', offset: 0, fontSize: 12 }} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Expected Profit" 
                    unit="$" 
                    label={{ value: 'Expected Profit ($)', angle: -90, position: 'left', offset: 0, fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Scenarios" data={chartData} fill="#000">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isBase ? 'var(--accent, #FF4D00)' : '#000'} 
                      />
                    ))}
                    <LabelList dataKey="shortName" position="top" style={{ fontSize: '0.75rem', fontWeight: 700 }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'center', marginTop: '0.5rem' }}>
              Goal: High Profit (Up), Low Risk (Left). Best scenarios are Top-Left.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
             {/* EV Comparison */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.8 }}>
                EXPECTED PROFIT ($)
              </div>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="shortName" width={50} style={{ fontSize: '0.75rem', fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="ev" name="Expected Profit" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isBase ? 'var(--accent, #FF4D00)' : '#000'} />
                      ))}
                      <LabelList dataKey="ev" position="right" formatter={(val) => formatDollars(val as number)} style={{ fontSize: '0.75rem' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Comparison */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.8 }}>
                RISK OF RUIN (%)
              </div>
              <div style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="shortName" width={50} style={{ fontSize: '0.75rem', fontWeight: 700 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="ror" name="Risk of Ruin" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.ror > 0.05 ? '#ef4444' : (entry.isBase ? 'var(--accent, #FF4D00)' : '#22c55e')} />
                      ))}
                      <LabelList dataKey="ror" position="right" formatter={(val) => formatPercent(val as number)} style={{ fontSize: '0.75rem' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>EV</th>
                <th>Profit%</th>
                <th>$/hr</th>
                <th>RoR</th>
                <th>Bank</th>
              </tr>
            </thead>
            <tbody>
              {comparison.scenarios.map((m: ScenarioMetrics) => (
                <tr
                  key={m.scenario.id}
                  style={{
                    background: m.scenario.isBase ? 'rgba(59, 130, 246, 0.08)' : undefined,
                  }}
                >
                  <td>
                    <div style={{ fontWeight: m.scenario.isBase ? 700 : 400 }}>
                      {m.scenario.name}
                    </div>
                    <div style={{ fontSize: '0.625rem', opacity: 0.6 }}>
                      {m.scenario.winrate.toFixed(1)} BB/100
                      {m.scenario.stakes !== stakes && (
                        <> @ ${m.scenario.stakes.toFixed(2)}</>
                      )}
                    </div>
                  </td>
                  <td
                    className={m.expectedValueDollars >= 0 ? 'text-positive' : 'text-negative'}
                    style={{ fontWeight: 700 }}
                  >
                    {formatDollars(m.expectedValueDollars)}
                  </td>
                  <td className={m.probabilityOfProfit >= 0.7 ? 'text-positive' : ''}>
                    {formatPercent(m.probabilityOfProfit)}
                  </td>
                  <td className={m.hourlyRateDollars >= 0 ? 'text-positive' : 'text-negative'}>
                    {formatHourly(m.hourlyRateDollars)}
                  </td>
                  <td className={m.riskOfRuin <= 0.05 ? 'text-positive' : 'text-negative'}>
                    {formatPercent(m.riskOfRuin)}
                  </td>
                  <td>
                    {m.recommendedBankrollBB === Infinity
                      ? 'N/A'
                      : `${Math.ceil(m.recommendedBankrollBB / 100)} BI`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(255, 77, 0, 0.05)',
          borderLeft: '3px solid var(--accent, #FF4D00)',
          fontSize: '0.875rem',
        }}
      >
        {insight}
      </div>
    </div>
  );
}

