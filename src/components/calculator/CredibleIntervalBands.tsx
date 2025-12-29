'use client';

import type { CredibleInterval } from '@/lib/types';

interface CredibleIntervalBandsProps {
  credibleIntervals: CredibleInterval[];
  observedWinrate: number;
}

const BAND_COLORS = [
  'rgba(59, 130, 246, 0.15)',  // 50% - lightest
  'rgba(59, 130, 246, 0.25)',  // 70%
  'rgba(59, 130, 246, 0.35)',  // 90%
  'rgba(59, 130, 246, 0.45)',  // 95% - darkest
];

export function CredibleIntervalBands({
  credibleIntervals,
  observedWinrate,
}: CredibleIntervalBandsProps) {
  // Sort intervals by probability (widest first for nested display)
  const sortedIntervals = [...credibleIntervals].sort(
    (a, b) => b.probability - a.probability
  );

  // Find the overall range for scaling
  const allLowers = sortedIntervals.map((ci) => ci.lower);
  const allUppers = sortedIntervals.map((ci) => ci.upper);
  const minValue = Math.min(...allLowers, 0);
  const maxValue = Math.max(...allUppers);
  const range = maxValue - minValue;

  const scaleX = (value: number) => ((value - minValue) / range) * 100;

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Credible Intervals for True Winrate
      </div>
      <div style={{ padding: '1rem 0' }}>
        {sortedIntervals.map((ci, index) => {
          const left = scaleX(ci.lower);
          const width = scaleX(ci.upper) - scaleX(ci.lower);
          const includesZero = ci.lower <= 0 && ci.upper >= 0;

          return (
            <div
              key={ci.probability}
              style={{
                position: 'relative',
                height: '32px',
                marginBottom: '0.5rem',
              }}
            >
              {/* Label */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  width: '100px',
                }}
              >
                {ci.label}
              </div>

              {/* Band container */}
              <div
                style={{
                  position: 'absolute',
                  left: '110px',
                  right: '80px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: '20px',
                  background: '#f5f5f5',
                  border: '1px solid #e5e5e5',
                }}
              >
                {/* Zero line */}
                {minValue < 0 && maxValue > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${scaleX(0)}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  />
                )}

                {/* CI Band */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0,
                    bottom: 0,
                    background: BAND_COLORS[index] || BAND_COLORS[0],
                    borderLeft: includesZero && ci.lower < 0 ? '2px solid #dc2626' : undefined,
                    borderRight: includesZero && ci.upper > 0 ? '2px solid #16a34a' : undefined,
                  }}
                />

                {/* Observed marker */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${scaleX(observedWinrate)}%`,
                    top: '-4px',
                    bottom: '-4px',
                    width: '3px',
                    background: '#FF4D00',
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>

              {/* Range values */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  width: '75px',
                  textAlign: 'right',
                  color: includesZero ? '#666' : ci.lower > 0 ? '#16a34a' : '#dc2626',
                }}
              >
                {ci.lower.toFixed(1)} to {ci.upper.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid #e5e5e5',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: '#FF4D00' }} />
          <span>Observed: {observedWinrate.toFixed(1)} BB/100</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              background: 'rgba(0,0,0,0.3)',
            }}
          />
          <span>Breakeven (0)</span>
        </div>
      </div>
    </div>
  );
}
