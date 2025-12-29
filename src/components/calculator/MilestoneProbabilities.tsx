'use client';

import { goalProbability } from '@/lib/math/statistics';

interface MilestoneProbabilitiesProps {
  winrate: number;
  stdDev: number;
  hands: number;
}

// Profit milestones in BB
const MILESTONES = [1000, 2500, 5000, 10000];

function formatPercent(p: number): string {
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(0)}%`;
}

function formatBB(bb: number): string {
  if (bb >= 1000) return `${(bb / 1000).toFixed(bb % 1000 === 0 ? 0 : 1)}k`;
  return bb.toString();
}

export function MilestoneProbabilities({ winrate, stdDev, hands }: MilestoneProbabilitiesProps) {
  const data = MILESTONES.map((goal) => ({
    goal,
    probability: goalProbability(goal, hands, winrate, stdDev),
  }));

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Probability of Hitting Profit Goals
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {data.map(({ goal, probability }) => (
          <div key={goal} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                opacity: 0.6,
                marginBottom: '0.25rem',
              }}
            >
              {formatBB(goal)} BB
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
              className={probability >= 0.5 ? 'text-positive' : probability >= 0.2 ? 'text-accent' : 'text-negative'}
            >
              {formatPercent(probability)}
            </div>
            <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
              <div
                className={`progress-bar__fill ${
                  probability >= 0.5
                    ? 'progress-bar__fill--positive'
                    : probability >= 0.2
                    ? 'progress-bar__fill--accent'
                    : 'progress-bar__fill--negative'
                }`}
                style={{ width: `${probability * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
