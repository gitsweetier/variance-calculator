'use client';

import { probabilityOfProfit, normalInverseCDF } from '@/lib/math/statistics';

interface BreakEvenTimelineProps {
  winrate: number;
  stdDev: number;
}

// Milestones to check
const MILESTONES = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];

function formatHands(h: number): string {
  if (h >= 1000000) return `${h / 1000000}M`;
  if (h >= 1000) return `${h / 1000}k`;
  return h.toString();
}

function formatPercent(p: number): string {
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(0)}%`;
}

/**
 * Calculate exact number of hands needed to reach a target probability of profit
 *
 * For P(profit) = target, we need:
 * Φ(winrate * sqrt(hands/100) / stdDev) = target
 *
 * Solving: hands = 100 * (z * stdDev / winrate)^2
 * where z = normalInverseCDF(target)
 */
function handsForProfitProbability(winrate: number, stdDev: number, targetProb: number): number | null {
  if (winrate <= 0) return null;

  const z = normalInverseCDF(targetProb);
  const hands = 100 * Math.pow((z * stdDev) / winrate, 2);

  return Math.ceil(hands);
}

function formatExactHands(hands: number | null): string {
  if (hands === null) return 'N/A';
  if (hands >= 1000000) return `${(hands / 1000000).toFixed(1)}M`;
  if (hands >= 1000) return `${(hands / 1000).toFixed(0)}k`;
  return hands.toLocaleString();
}

export function BreakEvenTimeline({ winrate, stdDev }: BreakEvenTimelineProps) {
  const milestoneData = MILESTONES.map((hands) => {
    const probProfit = probabilityOfProfit(hands, winrate, stdDev);
    return {
      hands,
      label: formatHands(hands),
      probProfit,
    };
  });

  // Calculate exact hands for 90%, 95%, 99% confidence
  const exact90 = handsForProfitProbability(winrate, stdDev, 0.90);
  const exact95 = handsForProfitProbability(winrate, stdDev, 0.95);
  const exact99 = handsForProfitProbability(winrate, stdDev, 0.99);

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          Chance of Profit vs. Time
        </div>
        <div style={{
          padding: '1rem',
          background: 'rgba(220, 38, 38, 0.1)',
          fontSize: '0.875rem',
          color: '#dc2626'
        }}>
          With a {winrate <= 0 ? 'non-positive' : 'negative'} winrate, you will not become profitable over time.
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Chance of Profit vs. Time
      </div>

      {/* Summary callouts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>
            90% confident
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {formatExactHands(exact90)} hands
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>
            95% confident
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {formatExactHands(exact95)} hands
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>
            99% confident
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {formatExactHands(exact99)} hands
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {milestoneData.map(({ hands, label, probProfit }) => (
          <div key={hands} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              minWidth: '50px',
              textAlign: 'right',
            }}>
              {label}
            </span>
            <div style={{
              flex: 1,
              height: '12px',
              background: 'rgba(0,0,0,0.1)',
              position: 'relative',
            }}>
              <div style={{
                height: '100%',
                width: `${probProfit * 100}%`,
                background: probProfit >= 0.95 ? '#16a34a' : probProfit >= 0.8 ? '#FF4D00' : '#dc2626',
              }} />
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              minWidth: '45px',
            }}
            className={probProfit >= 0.95 ? 'text-positive' : probProfit >= 0.8 ? 'text-accent' : 'text-negative'}
            >
              {formatPercent(probProfit)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
        Probability of being profitable after playing this many hands
      </div>
    </div>
  );
}
