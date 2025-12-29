'use client';

import { useMemo, useState } from 'react';

function formatDollars(dollars: number): string {
  const sign = dollars < 0 ? '-' : '';
  const abs = Math.abs(dollars);
  if (!isFinite(abs)) return '∞';
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function BackingStakingPlaceholder() {
  const [profit, setProfit] = useState(5000);
  const [playerCutPct, setPlayerCutPct] = useState(50);

  const [makeupOwed, setMakeupOwed] = useState(2000);
  const [expectedMonthlyProfit, setExpectedMonthlyProfit] = useState(1500);

  const split = useMemo(() => {
    const cut = Math.min(100, Math.max(0, playerCutPct)) / 100;
    const player = profit * cut;
    const backer = profit - player;
    return { player, backer, cut };
  }, [profit, playerCutPct]);

  const monthsToClear = useMemo(() => {
    if (makeupOwed <= 0) return 0;
    if (expectedMonthlyProfit <= 0) return Infinity;
    return Math.ceil(makeupOwed / expectedMonthlyProfit);
  }, [makeupOwed, expectedMonthlyProfit]);

  return (
    <div className="section-content">
      <div className="grid-12">
        <div className="block col-6">
          <div className="block-title" style={{ marginBottom: '1rem' }}>
            Split Calculator (Placeholder)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                  opacity: 0.7,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Profit ($)
              </label>
              <input
                type="number"
                value={profit}
                onChange={(e) => setProfit(Number(e.target.value))}
                step={100}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                  opacity: 0.7,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Player Cut (%)
              </label>
              <input
                type="number"
                value={playerCutPct}
                onChange={(e) => setPlayerCutPct(Number(e.target.value))}
                step={1}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="metric">
                <span className="metric__label">Player</span>
                <span className="metric__value">{formatDollars(split.player)}</span>
                <span className="metric__subtext">{Math.round(split.cut * 100)}%</span>
              </div>
            </div>
            <div>
              <div className="metric">
                <span className="metric__label">Backer</span>
                <span className="metric__value">{formatDollars(split.backer)}</span>
                <span className="metric__subtext">{Math.round((1 - split.cut) * 100)}%</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
            This is just arithmetic on profit splits (placeholder). We&apos;ll later add deal structures (makeup, expenses, swaps).
          </div>
        </div>

        <div className="block col-6">
          <div className="block-title" style={{ marginBottom: '1rem' }}>
            Makeup Tracker (Placeholder)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                  opacity: 0.7,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Makeup Owed ($)
              </label>
              <input
                type="number"
                value={makeupOwed}
                onChange={(e) => setMakeupOwed(Number(e.target.value))}
                step={100}
                min={0}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.5rem',
                  opacity: 0.7,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Expected Monthly Profit ($)
              </label>
              <input
                type="number"
                value={expectedMonthlyProfit}
                onChange={(e) => setExpectedMonthlyProfit(Number(e.target.value))}
                step={100}
              />
            </div>
          </div>

          <div className="metric">
            <span className="metric__label">Estimated time to clear</span>
            <span className={`metric__value ${isFinite(monthsToClear) ? '' : 'metric__value--accent'}`}>
              {isFinite(monthsToClear) ? `${monthsToClear} mo` : 'N/A'}
            </span>
            <span className="metric__subtext">
              {makeupOwed <= 0
                ? 'No makeup outstanding.'
                : expectedMonthlyProfit <= 0
                ? 'Requires positive expected profit.'
                : `At ${formatDollars(expectedMonthlyProfit)}/mo`}
            </span>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
            Placeholder — real deals can be more complex (expenses, swaps, stop-loss, renegotiation terms).
          </div>
        </div>
      </div>
    </div>
  );
}


