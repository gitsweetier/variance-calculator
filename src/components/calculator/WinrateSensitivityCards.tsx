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
  severity: 'warning' | 'danger' | 'critical';
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

  // Scenario 1: ~2/3 of winrate (rounded to nearest 0.5)
  const twoThirds = roundToHalf(winrate * (2 / 3));
  if (twoThirds > 0) {
    const bustRisk = downswingProbability(bankrollBB, twoThirds, stdDev);
    const safeBR = minimumBankroll(twoThirds, stdDev, 0.05);
    scenarios.push({
      winrate: twoThirds,
      bustRisk,
      safeBankrollBI: safeBR !== null ? Math.ceil(safeBR / 100) : null,
      severity: 'warning',
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
      severity: 'danger',
    });
  }

  // Scenario 3: Breakeven (0 bb/100)
  scenarios.push({
    winrate: 0,
    bustRisk: 1.0,
    safeBankrollBI: null,
    severity: 'critical',
  });

  // Current winrate stats
  const currentBustRisk = winrate > 0 ? downswingProbability(bankrollBB, winrate, stdDev) : 1.0;
  const currentSafeBR = winrate > 0 ? minimumBankroll(winrate, stdDev, 0.05) : null;
  const currentSafeBRBI = currentSafeBR !== null ? Math.ceil(currentSafeBR / 100) : null;

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

  const getSeverityStyles = (severity: 'warning' | 'danger' | 'critical') => {
    switch (severity) {
      case 'warning':
        return { background: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' };
      case 'danger':
        return { background: 'rgba(249, 115, 22, 0.15)', borderColor: '#f97316' };
      case 'critical':
        return { background: 'rgba(220, 38, 38, 0.15)', borderColor: '#dc2626' };
    }
  };

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        What If You&apos;re Wrong?
      </div>

      {/* Green box - User's assumption */}
      <div style={{
        marginBottom: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'rgba(34, 197, 94, 0.15)',
        border: '2px solid #22c55e',
        fontSize: '0.875rem',
      }}>
        <div style={{ marginBottom: '0.35rem' }}>
          Your assumption: <strong>{winrate.toFixed(1)} bb/100</strong>
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          Bust risk ({bankrollBI} BI): <strong>{formatPercent(currentBustRisk)}</strong>
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          Safe* bankroll: {currentSafeBRBI !== null ? `${currentSafeBRBI} BI` : '∞'}
        </div>
      </div>

      {/* Scenario cards */}
      <div className="sensitivity-cards-grid">
        {scenarios.map((scenario, i) => {
          const styles = getSeverityStyles(scenario.severity);
          const isBreakeven = scenario.winrate === 0;
          return (
            <div
              key={i}
              style={{
                padding: '0.75rem 1rem',
                background: styles.background,
                border: `2px solid ${styles.borderColor}`,
              }}
            >
              <div style={{ marginBottom: '0.35rem', fontSize: '0.875rem' }}>
                If your edge is{' '}
                <strong>
                  {isBreakeven ? '0 bb/100 (breakeven)' : `${scenario.winrate.toFixed(1)} bb/100`}
                </strong>
                :
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Bust risk ({bankrollBI} BI): <strong>{formatPercent(scenario.bustRisk)}</strong>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                Safe* bankroll: {scenario.safeBankrollBI !== null ? `${scenario.safeBankrollBI} BI` : '∞'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom text */}
      <div style={{
        marginTop: '1rem',
        fontSize: '0.75rem',
        opacity: 0.7,
        lineHeight: 1.5,
      }}>
        If you&apos;re wrong about your winrate, your risk changes dramatically. The less confident you are, the more conservative your bankroll should be.
      </div>

      {/* Footnote */}
      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.7rem',
        opacity: 0.5,
        lineHeight: 1.4,
      }}>
        *Safe means 5% Risk of Ruin (going broke) if you were to never move down in stakes. I suggest moving down much before that.
      </div>
    </div>
  );
}
