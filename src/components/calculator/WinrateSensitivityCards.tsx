'use client';

import { downswingProbability, minimumBankroll } from '@/lib/math/statistics';

interface WinrateSensitivityCardsProps {
  winrate: number;
  stdDev: number;
  bankroll: number;
}

interface ScenarioData {
  winrate: number;
  bustRisk: number;
  safeBankrollBI: number | null;
  label: string;
}

function formatPercent(p: number): string {
  if (p >= 0.999) return '>99.9%';
  if (p >= 0.99) return `${(p * 100).toFixed(1)}%`;
  if (p >= 0.01) return `${(p * 100).toFixed(0)}%`;
  if (p >= 0.001) return `${(p * 100).toFixed(1)}%`;
  return '<0.1%';
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export function WinrateSensitivityCards({ winrate, stdDev, bankroll }: WinrateSensitivityCardsProps) {
  // bankroll is already in BB
  const bankrollBB = bankroll;
  const bankrollBI = Math.round(bankrollBB / 100);

  // Build scenarios based on current winrate
  const scenarios: ScenarioData[] = [];

  // Current winrate (your assumption)
  const currentBustRisk = winrate > 0 ? downswingProbability(bankrollBB, winrate, stdDev) : 1.0;
  const currentSafeBR = winrate > 0 ? minimumBankroll(winrate, stdDev, 0.05) : null;
  const currentSafeBRBI = currentSafeBR !== null ? Math.ceil(currentSafeBR / 100) : null;

  scenarios.push({
    winrate,
    bustRisk: currentBustRisk,
    safeBankrollBI: currentSafeBRBI,
    label: 'Your Assumption',
  });

  // Scenario 1: ~2/3 of winrate (rounded to nearest 0.5)
  const twoThirds = roundToHalf(winrate * (2 / 3));
  if (twoThirds > 0) {
    const bustRisk = downswingProbability(bankrollBB, twoThirds, stdDev);
    const safeBR = minimumBankroll(twoThirds, stdDev, 0.05);
    scenarios.push({
      winrate: twoThirds,
      bustRisk,
      safeBankrollBI: safeBR !== null ? Math.ceil(safeBR / 100) : null,
      label: 'Slightly Worse',
    });
  }

  // Scenario 2: ~1/3 of winrate (rounded to nearest 0.5)
  const oneThird = roundToHalf(winrate * (1 / 3));
  if (oneThird > 0) {
    const bustRisk = downswingProbability(bankrollBB, oneThird, stdDev);
    const safeBR = minimumBankroll(oneThird, stdDev, 0.05);
    scenarios.push({
      winrate: oneThird,
      bustRisk,
      safeBankrollBI: safeBR !== null ? Math.ceil(safeBR / 100) : null,
      label: 'Much Worse',
    });
  }

  // Scenario 3: Breakeven (0 bb/100)
  scenarios.push({
    winrate: 0,
    bustRisk: 1.0,
    safeBankrollBI: null,
    label: 'Breakeven',
  });

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          What If You&apos;re Wrong?
        </div>
        <div style={{
          padding: '1rem',
          background: 'rgba(220, 38, 38, 0.1)',
          fontSize: '0.875rem',
          color: '#dc2626'
        }}>
          With a non-positive winrate, no bankroll is safe. Consider whether your sample size is sufficient to confirm you&apos;re a winning player.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner alert - horizontal two-panel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          background: 'white',
          border: '1.5px solid #000',
          marginBottom: '1rem',
        }}
      >
        {/* Left panel - orange with headline */}
        <div
          style={{
            flex: '0 0 40%',
            background: '#D94B2B',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.9)',
              marginBottom: '0.5rem',
            }}
          >
            Heads Up
          </div>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.3,
            }}
          >
            What If You&apos;re Wrong?
          </div>
        </div>
        {/* Right panel - black with white foreground */}
        <div
          style={{
            flex: 1,
            background: 'black',
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              color: 'white',
              lineHeight: 1.6,
            }}
          >
            Your bankroll calculations are only as good as your winrate estimate. If you&apos;re wrong about your edge, your risk of ruin changes <strong style={{ fontWeight: 700 }}>dramatically</strong>.
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          Alternate Win Rates
        </div>
      {/* Scenario cards - horizontal layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px' }}>
        {scenarios.map((scenario, i) => {
          const isBreakeven = scenario.winrate === 0;
          const winrateColors = ['#16a34a', '#ca8a04', '#ea580c', '#dc2626'];
          const winrateColor = winrateColors[i] || winrateColors[0];

          return (
            <div
              key={i}
              style={{
                padding: '1rem',
                background: 'white',
                border: `1px solid ${winrateColor}`,
              }}
            >
              {/* Small label */}
              <div style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.35rem',
                color: winrateColor,
                opacity: 0.8,
              }}>
                {scenario.label}
              </div>

              {/* Large winrate value */}
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                marginBottom: '0.75rem',
                letterSpacing: '-0.02em',
                color: winrateColor,
              }}>
                {isBreakeven ? '0' : scenario.winrate.toFixed(1)}
                <span style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.7, marginLeft: '0.25rem' }}>
                  bb/100
                </span>
              </div>

              {/* Stats */}
              <div style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Bust Risk</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {formatPercent(scenario.bustRisk)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Safe Bankroll</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {scenario.safeBankrollBI !== null ? `${scenario.safeBankrollBI} BI` : '∞'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom text */}
      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.7rem',
        opacity: 0.5,
        lineHeight: 1.5,
      }}>
        *&quot;Safe&quot; bankroll = 5% risk of ruin.
      </div>
      </div>
    </div>
  );
}
