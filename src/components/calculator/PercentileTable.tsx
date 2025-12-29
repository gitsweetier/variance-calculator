'use client';

import { percentileOutcome } from '@/lib/math/statistics';

interface PercentileTableProps {
  winrate: number;
  stdDev: number;
  hands: number;
  stakes: number;
}

const PERCENTILES = [99, 95, 75, 50, 25, 5, 1];

function formatDollars(dollars: number): string {
  const sign = dollars >= 0 ? '+' : '';
  if (Math.abs(dollars) >= 1000) {
    return `${sign}$${(dollars / 1000).toFixed(1)}k`;
  }
  return `${sign}$${dollars.toFixed(0)}`;
}

function formatBuyIns(bb: number): string {
  const buyIns = bb / 100;
  const sign = buyIns >= 0 ? '+' : '';
  return `${sign}${buyIns.toFixed(1)} BI`;
}

function getLabel(percentile: number): string {
  switch (percentile) {
    case 99: return 'Best 1%';
    case 95: return 'Top 5%';
    case 75: return 'Above average';
    case 50: return 'Median';
    case 25: return 'Below average';
    case 5: return 'Bottom 5%';
    case 1: return 'Worst 1%';
    default: return `${percentile}th`;
  }
}

export function PercentileTable({ winrate, stdDev, hands, stakes }: PercentileTableProps) {
  const data = PERCENTILES.map((p) => {
    const outcomeBB = percentileOutcome(p, hands, winrate, stdDev);
    return {
      percentile: p,
      label: getLabel(p),
      outcomeBB,
      outcomeDollars: outcomeBB * stakes,
    };
  });

  // Find max absolute value for bar scaling
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.outcomeDollars)));

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Outcome Percentiles
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Result</th>
            <th>Buy-ins</th>
            <th style={{ width: '100px' }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ percentile, label, outcomeBB, outcomeDollars }) => (
            <tr key={percentile}>
              <td>
                <span style={{ fontWeight: percentile === 50 ? 700 : 400 }}>{label}</span>
              </td>
              <td className={outcomeDollars >= 0 ? 'text-positive' : 'text-negative'} style={{ fontWeight: 700 }}>
                {formatDollars(outcomeDollars)}
              </td>
              <td style={{ opacity: 0.6 }}>
                {formatBuyIns(outcomeBB)}
              </td>
              <td>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: outcomeDollars >= 0 ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: `${(Math.abs(outcomeDollars) / maxAbs) * 100}%`,
                      height: '8px',
                      background: outcomeDollars >= 0 ? '#16a34a' : '#dc2626',
                      minWidth: '2px',
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
