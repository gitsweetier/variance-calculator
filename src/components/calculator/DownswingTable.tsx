'use client';

import { downswingProbability } from '@/lib/math/statistics';

interface DownswingTableProps {
  winrate: number;
  stdDev: number;
  stakes: number;
}

// Thresholds in buy-ins (100bb each)
const THRESHOLDS_BI = [20, 30, 40, 50, 75, 100];

function formatPercent(p: number): string {
  if (p >= 0.999) return '>99.9%';
  if (p >= 0.99) return `${(p * 100).toFixed(1)}%`;
  if (p >= 0.01) return `${(p * 100).toFixed(0)}%`;
  if (p >= 0.001) return `${(p * 100).toFixed(1)}%`;
  return '<0.1%';
}

function formatDollars(dollars: number): string {
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

export function DownswingTable({ winrate, stdDev, stakes }: DownswingTableProps) {
  const data = THRESHOLDS_BI.map((buyIns) => {
    const bbThreshold = buyIns * 100;
    const prob = downswingProbability(bbThreshold, winrate, stdDev);
    const dollars = bbThreshold * stakes;

    return {
      buyIns,
      probability: prob,
      dollars,
    };
  });

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          Risk of Net Loss
        </div>
        <div style={{
          padding: '1rem',
          background: 'rgba(220, 38, 38, 0.1)',
          fontSize: '0.875rem',
          color: '#dc2626'
        }}>
          With a non-positive winrate, going broke is guaranteed regardless of bankroll size.
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Risk of Net Loss
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Bankroll</th>
            <th>Amount</th>
            <th>Bust Risk</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ buyIns, probability, dollars }) => (
            <tr key={buyIns}>
              <td>{buyIns} buy-ins</td>
              <td>{formatDollars(dollars)}</td>
              <td className={probability > 0.5 ? 'text-negative' : probability > 0.1 ? 'text-accent' : 'text-positive'}>
                {formatPercent(probability)}
              </td>
              <td style={{ width: '80px' }}>
                <div className="progress-bar">
                  <div
                    className={`progress-bar__fill ${
                      probability > 0.5
                        ? 'progress-bar__fill--negative'
                        : probability > 0.1
                        ? 'progress-bar__fill--accent'
                        : ''
                    }`}
                    style={{ width: `${Math.min(100, probability * 100)}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
        If your bankroll were this size, this is your lifetime chance of going broke. (Starting now, the chance you&apos;ll ever be down this much if your winrate and standard deviation stay the same.)
      </div>
    </div>
  );
}
