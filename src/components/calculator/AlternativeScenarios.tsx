'use client';

import { useMemo } from 'react';
import { compareScenarios, generateScenarioInsight } from '@/lib/math/scenarios';
import type { ScenarioMetrics } from '@/lib/types';

interface AlternativeScenariosProps {
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
  return `${sign}$${d.toFixed(0)}/hr`;
}

export function AlternativeScenarios({
  winrate,
  stdDev,
  hands,
  bankroll,
  stakes,
}: AlternativeScenariosProps) {
  const comparison = useMemo(
    () => compareScenarios(winrate, stakes, hands, stdDev, bankroll),
    [winrate, stakes, hands, stdDev, bankroll]
  );

  const insight = useMemo(
    () => generateScenarioInsight(comparison),
    [comparison]
  );

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title">Alternative Scenarios Comparison</div>
        <div style={{ padding: '1.5rem', opacity: 0.6, textAlign: 'center' }}>
          Scenario comparison requires a positive winrate. Adjust your winrate slider above.
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Alternative Scenarios Comparison
      </div>
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
