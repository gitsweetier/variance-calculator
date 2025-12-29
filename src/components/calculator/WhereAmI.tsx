'use client';

import { useState } from 'react';
import {
  standardError,
  winrateConfidenceInterval,
  probabilityTrueWinrateAbove,
} from '@/lib/math/statistics';
import { ConfidenceTimeline } from '@/components/calculator/ConfidenceTimeline';

interface WhereAmIProps {
  stdDev: number;
  stakes: number;
}

type ResultsUnit = 'dollars' | 'bb';

function formatPercent(p: number): string {
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(1)}%`;
}

function parseFiniteNumberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toTidyNumberString(n: number, decimals: number = 2): string {
  if (!Number.isFinite(n)) return '';
  return String(Number(n.toFixed(decimals)));
}

export function WhereAmI({ stdDev, stakes }: WhereAmIProps) {
  const [resultsUnit, setResultsUnit] = useState<ResultsUnit>('dollars');
  // Keep a "last valid" numeric value for calculations, plus an editable text value for good UX.
  const [dollarsWon, setDollarsWon] = useState<number>(10000);
  const [bbWon, setBbWon] = useState<number>(2000);
  const [dollarsWonText, setDollarsWonText] = useState<string>('10000');
  const [bbWonText, setBbWonText] = useState<string>('2000');
  const [handsPlayed, setHandsPlayed] = useState<number>(25000);
  const [handsPlayedText, setHandsPlayedText] = useState<string>('25000');

  const bbWonForCalc = resultsUnit === 'dollars' ? dollarsWon / stakes : bbWon;

  const wrInterval = winrateConfidenceInterval(bbWonForCalc, handsPlayed, stdDev);
  const probWinner = probabilityTrueWinrateAbove(bbWonForCalc, handsPlayed, stdDev, 0);
  const se = standardError(handsPlayed, stdDev);

  const getWinnerContext = () => {
    if (probWinner >= 0.95) return 'Very likely a winner';
    if (probWinner >= 0.8) return 'Probably a winner';
    if (probWinner >= 0.6) return 'Leaning winner';
    if (probWinner >= 0.4) return 'Too early to tell';
    if (probWinner >= 0.2) return 'Leaning loser';
    return 'Probably a loser';
  };

  // Z-scores for various confidence levels
  const Z_95 = 1.96;
  const Z_90 = 1.645;
  const Z_75 = 1.15;
  const Z_60 = 0.84;

  const ci95 = {
    lower: wrInterval.observed - Z_95 * se,
    upper: wrInterval.observed + Z_95 * se,
  };
  const ci90 = {
    lower: wrInterval.observed - Z_90 * se,
    upper: wrInterval.observed + Z_90 * se,
  };
  const ci75 = {
    lower: wrInterval.observed - Z_75 * se,
    upper: wrInterval.observed + Z_75 * se,
  };
  const ci60 = {
    lower: wrInterval.observed - Z_60 * se,
    upper: wrInterval.observed + Z_60 * se,
  };

  return (
    <div className="grid-12" style={{ gap: '0.75rem' }}>
      {/* Row 1: Inputs */}
      <div className="col-4">
        <div className="block" style={{ padding: '0.75rem', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div className="block-title">Your Actual Results</div>
            <div
              role="group"
              aria-label="Units"
              style={{ display: 'inline-flex', border: '2px solid black', background: 'white', overflow: 'hidden' }}
            >
              <button
                type="button"
                onClick={() => {
                  if (resultsUnit === 'dollars') return;
                  const next = bbWon * stakes;
                  setDollarsWon(next);
                  setDollarsWonText(toTidyNumberString(next));
                  setResultsUnit('dollars');
                }}
                aria-pressed={resultsUnit === 'dollars'}
                style={{
                  border: 'none',
                  padding: '0.2rem 0.45rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  background: resultsUnit === 'dollars' ? 'black' : 'white',
                  color: resultsUnit === 'dollars' ? 'white' : 'black',
                }}
              >
                $
              </button>
              <button
                type="button"
                onClick={() => {
                  if (resultsUnit === 'bb') return;
                  const next = dollarsWon / stakes;
                  setBbWon(next);
                  setBbWonText(toTidyNumberString(next));
                  setResultsUnit('bb');
                }}
                aria-pressed={resultsUnit === 'bb'}
                style={{
                  border: 'none',
                  borderLeft: '2px solid black',
                  padding: '0.2rem 0.45rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  background: resultsUnit === 'bb' ? 'black' : 'white',
                  color: resultsUnit === 'bb' ? 'white' : 'black',
                }}
              >
                BB
              </button>
            </div>
          </div>

          <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '0.25rem',
                }}
              >
                {resultsUnit === 'dollars' ? 'Won/Lost ($)' : 'Won/Lost (BB)'}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={resultsUnit === 'dollars' ? dollarsWonText : bbWonText}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (resultsUnit === 'dollars') setDollarsWonText(raw);
                  else setBbWonText(raw);

                  const parsed = parseFiniteNumberOrNull(raw);
                  if (parsed === null) return;

                  if (resultsUnit === 'dollars') setDollarsWon(parsed);
                  else setBbWon(parsed);
                }}
                onBlur={() => {
                  if (resultsUnit === 'dollars') {
                    const parsed = parseFiniteNumberOrNull(dollarsWonText);
                    if (parsed === null) {
                      setDollarsWonText(toTidyNumberString(dollarsWon));
                      return;
                    }
                    setDollarsWon(parsed);
                    setDollarsWonText(toTidyNumberString(parsed));
                  } else {
                    const parsed = parseFiniteNumberOrNull(bbWonText);
                    if (parsed === null) {
                      setBbWonText(toTidyNumberString(bbWon));
                      return;
                    }
                    setBbWon(parsed);
                    setBbWonText(toTidyNumberString(parsed));
                  }
                }}
                style={{ width: '100%', padding: '0.3rem 0.45rem' }}
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
                  marginBottom: '0.25rem',
                }}
              >
                Hands
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={handsPlayedText}
                onChange={(e) => {
                  const raw = e.target.value;
                  setHandsPlayedText(raw);
                  const parsed = parseFiniteNumberOrNull(raw);
                  if (parsed === null) return;
                  setHandsPlayed(Math.max(1, Math.round(parsed)));
                }}
                onBlur={() => {
                  const parsed = parseFiniteNumberOrNull(handsPlayedText);
                  if (parsed === null) {
                    setHandsPlayedText(String(handsPlayed));
                    return;
                  }
                  const next = Math.max(1, Math.round(parsed));
                  setHandsPlayed(next);
                  setHandsPlayedText(String(next));
                }}
                step={1000}
                style={{ width: '100%', padding: '0.3rem 0.45rem' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', opacity: 0.6 }}>
            Enter your lifetime results.
          </div>
        </div>
      </div>

      {/* Credible Intervals */}
      <div className="col-8">
        <div className="block" style={{ padding: '0.75rem', height: '100%' }}>
          <div className="block-title" style={{ marginBottom: '0.5rem' }}>
            Credible Intervals for True Winrate
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: 0.75 }}>
            Observed: <strong>{wrInterval.observed.toFixed(1)} BB/100</strong>
          </div>

          {(() => {
            const rows = [
              { label: '95%', lower: ci95.lower, upper: ci95.upper, bg: 'rgba(59, 130, 246, 0.5)' },
              { label: '90%', lower: ci90.lower, upper: ci90.upper, bg: 'rgba(59, 130, 246, 0.4)' },
              { label: '75%', lower: ci75.lower, upper: ci75.upper, bg: 'rgba(59, 130, 246, 0.3)' },
              { label: '60%', lower: ci60.lower, upper: ci60.upper, bg: 'rgba(59, 130, 246, 0.2)' },
            ].sort((a, b) => (b.upper - b.lower) - (a.upper - a.lower));

            const allLowers = rows.map((r) => r.lower);
            const allUppers = rows.map((r) => r.upper);
            const minValue = Math.min(...allLowers, 0);
            const maxValue = Math.max(...allUppers);
            const range = maxValue - minValue || 1;
            const scaleX = (value: number) => ((value - minValue) / range) * 100;

            return (
              <div style={{ marginTop: '0.6rem' }}>
                {rows.map((r) => {
                  const left = scaleX(r.lower);
                  const width = scaleX(r.upper) - scaleX(r.lower);
                  const includesZero = r.lower <= 0 && r.upper >= 0;

                  return (
                    <div key={r.label} style={{ position: 'relative', height: '24px', marginBottom: '0.25rem' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          width: '36px',
                        }}
                      >
                        {r.label}
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          left: '44px',
                          right: '70px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: '14px',
                          background: '#f5f5f5',
                          border: '1px solid #e5e5e5',
                        }}
                      >
                        {minValue < 0 && maxValue > 0 ? (
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
                        ) : null}

                        <div
                          style={{
                            position: 'absolute',
                            left: `${left}%`,
                            width: `${width}%`,
                            top: 0,
                            bottom: 0,
                            background: r.bg,
                            borderLeft: includesZero && r.lower < 0 ? '2px solid #dc2626' : undefined,
                            borderRight: includesZero && r.upper > 0 ? '2px solid #16a34a' : undefined,
                          }}
                        />

                        <div
                          style={{
                            position: 'absolute',
                            left: `${scaleX(wrInterval.observed)}%`,
                            top: '-3px',
                            bottom: '-3px',
                            width: '3px',
                            background: '#FF4D00',
                            transform: 'translateX(-50%)',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.6rem',
                          width: '66px',
                          textAlign: 'right',
                          color: includesZero ? '#666' : r.lower > 0 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {r.lower.toFixed(1)}–{r.upper.toFixed(1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.65 }}>
            Orange line = observed winrate. Gray line = breakeven. Darker = more confident.
          </div>
        </div>
      </div>

      {/* Banner: Am I a Winner? | Reading This Tab */}
      <div className="col-12 winner-banner">
        {/* Left panel - orange with Am I a Winner */}
        <div className="winner-banner__panel winner-banner__panel--orange">
          <div className="winner-banner__label">
            The Big Question
          </div>
          <div className="winner-banner__title">
            Am I Actually A Winner?
          </div>
          <div className="winner-banner__gauge">
            <span className="winner-banner__percentage">
              {formatPercent(probWinner)}
            </span>
            <span className="winner-banner__percentage-label">confident</span>
          </div>
          <div className="winner-banner__context">{getWinnerContext()}</div>
        </div>
        {/* Right panel - black with Reading This Tab */}
        <div className="winner-banner__panel winner-banner__panel--black">
          <div className="winner-banner__label winner-banner__label--muted">
            How To Read This Tab
          </div>
          <div className="winner-banner__instructions">
            <strong>Winner gauge</strong> = confidence your true winrate &gt; 0.<br />
            <strong>Credible intervals</strong> = range your true winrate likely falls in.
          </div>
        </div>
      </div>

      {/* Confidence Timeline */}
      <div className="col-12">
        <ConfidenceTimeline stdDev={stdDev} />
      </div>
    </div>
  );
}

