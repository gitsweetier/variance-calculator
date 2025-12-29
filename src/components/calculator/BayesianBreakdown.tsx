'use client';

import { useMemo } from 'react';
import { bayesianWinnerAnalysis, generateBayesianInsight } from '@/lib/math/bayesian';
import { PosteriorDistributionSVG } from './PosteriorDistributionSVG';
import { CredibleIntervalBands } from './CredibleIntervalBands';

interface BayesianBreakdownProps {
  observedWinnings: number;  // BB
  handsPlayed: number;
  stdDev: number;
  stakes: number;
}

export function BayesianBreakdown({
  observedWinnings,
  handsPlayed,
  stdDev,
  stakes,
}: BayesianBreakdownProps) {
  const analysis = useMemo(
    () => bayesianWinnerAnalysis(observedWinnings, handsPlayed, stdDev),
    [observedWinnings, handsPlayed, stdDev]
  );

  const insight = useMemo(
    () => generateBayesianInsight(analysis, stdDev),
    [analysis, stdDev]
  );

  const { probabilityWinner, observedWinrate, standardError, credibleIntervals, posteriorCurve } =
    analysis;

  // Determine verdict color
  const verdictColor =
    probabilityWinner >= 0.8
      ? '#16a34a'
      : probabilityWinner >= 0.5
      ? '#FF4D00'
      : '#dc2626';

  return (
    <div className="bayesian-breakdown">
      <div className="grid-12">
        {/* Left: Posterior Distribution Chart */}
        <div className="block col-8">
          <div className="block-title">Probability Distribution of True Winrate</div>
          <PosteriorDistributionSVG
            posteriorCurve={posteriorCurve}
            credibleIntervals={credibleIntervals}
            observedWinrate={observedWinrate}
          />
        </div>

        {/* Right: Verdict */}
        <div className="col-4">
          <div
            className="block"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              padding: '2rem',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.6,
                marginBottom: '0.5rem',
              }}
            >
              Probability You&apos;re a Winner
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '3rem',
                fontWeight: 700,
                color: verdictColor,
                lineHeight: 1,
              }}
            >
              {(probabilityWinner * 100).toFixed(0)}%
            </div>
            <div
              style={{
                marginTop: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                opacity: 0.6,
              }}
            >
              Based on {handsPlayed.toLocaleString()} hands
              <br />
              Observed: {observedWinrate.toFixed(2)} BB/100
              <br />
              Margin: ±{standardError.toFixed(1)} BB/100
            </div>
          </div>
        </div>
      </div>

      {/* Credible Interval Bands */}
      <div style={{ marginTop: 'var(--gap)' }}>
        <CredibleIntervalBands
          credibleIntervals={credibleIntervals}
          observedWinrate={observedWinrate}
        />
      </div>

      {/* Insight */}
      <div
        style={{
          marginTop: 'var(--gap)',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(to right, rgba(255, 77, 0, 0.08), transparent)',
          borderLeft: '4px solid var(--accent, #FF4D00)',
          fontSize: '0.9375rem',
          lineHeight: 1.7,
        }}
      >
        {insight}
      </div>

      {/* Summary Table */}
      <div className="block" style={{ marginTop: 'var(--gap)' }}>
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          Analysis Summary
        </div>
        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ fontWeight: 700 }}>Observed Winrate</td>
              <td>{observedWinrate.toFixed(2)} BB/100</td>
              <td style={{ opacity: 0.6 }}>
                ${(observedWinrate * handsPlayed / 100 * stakes).toFixed(0)} total
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>Standard Error</td>
              <td>±{standardError.toFixed(2)} BB/100</td>
              <td style={{ opacity: 0.6 }}>Margin of uncertainty</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>95% Credible Interval</td>
              <td>
                {credibleIntervals.find((ci) => ci.probability === 0.95)?.lower.toFixed(1)} to{' '}
                {credibleIntervals.find((ci) => ci.probability === 0.95)?.upper.toFixed(1)} BB/100
              </td>
              <td style={{ opacity: 0.6 }}>Your true winrate likely falls here</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700 }}>P(Winner)</td>
              <td
                style={{
                  color: verdictColor,
                  fontWeight: 700,
                }}
              >
                {(probabilityWinner * 100).toFixed(1)}%
              </td>
              <td style={{ opacity: 0.6 }}>Probability true WR {'>'} 0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
