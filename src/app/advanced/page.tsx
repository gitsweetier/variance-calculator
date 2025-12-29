'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SliderControls } from '@/components/calculator/SliderControls';
import { AlternativeScenarios } from '@/components/calculator/AlternativeScenarios';
import { BayesianBreakdown } from '@/components/calculator/BayesianBreakdown';
import { CoachParagraph } from '@/components/coach/CoachParagraph';
import { MonteCarloWithTooltips } from '@/components/advanced/MonteCarloWithTooltips';
import { BellCurveWithTooltips } from '@/components/advanced/BellCurveWithTooltips';

export default function AdvancedPage() {
  // Core parameters (same as main page)
  const [winrate, setWinrate] = useState(2.5);
  const [stdDev, setStdDev] = useState(75);
  const [sampleSize, setSampleSize] = useState(100000);
  const [bankroll, setBankroll] = useState(5000);
  const [stakes, setStakes] = useState(5.0);

  // Observed results for "Am I a Winner?" analysis
  const [observedHands, setObservedHands] = useState(50000);
  const [observedWinnings, setObservedWinnings] = useState(1250); // BB

  // Seed for reproducible paths
  const seed = useMemo(() => {
    return Math.floor(winrate * 100 + stdDev * 10 + sampleSize / 1000);
  }, [winrate, stdDev, sampleSize]);

  return (
    <main style={{ minHeight: '100vh', padding: '1rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--gap)',
            padding: '1rem',
            background: 'white',
            border: '2px solid black',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Advanced Analysis
            </h1>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
              Deep-dive variance tools & scenario comparison
            </p>
            <Link 
              href="/advanced-v2"
              style={{
                display: 'inline-block',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--accent, #FF4D00)',
                fontWeight: 700,
                textDecoration: 'underline'
              }}
            >
              Try Visual V2 Analysis →
            </Link>
          </div>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'white',
              color: 'black',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textDecoration: 'none',
              border: '2px solid black',
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Basic Calculator
          </Link>
        </header>

        {/* Input Parameters */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="section-header">Your Parameters</div>
          <div className="section-content">
            <SliderControls
              winrate={winrate}
              stdDev={stdDev}
              sampleSize={sampleSize}
              bankroll={bankroll}
              stakes={stakes}
              onWinrateChange={setWinrate}
              onStdDevChange={setStdDev}
              onSampleSizeChange={setSampleSize}
              onBankrollChange={setBankroll}
              onStakesChange={setStakes}
            />
          </div>
        </section>

        {/* =====================================================================
            SECTION 1: ALTERNATIVE SCENARIOS
            ===================================================================== */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="section-header">Alternative Scenarios Comparison</div>
          <div className="section-content">
            <AlternativeScenarios
              winrate={winrate}
              stdDev={stdDev}
              hands={sampleSize}
              bankroll={bankroll}
              stakes={stakes}
            />
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: AM I A WINNER? (BAYESIAN BREAKDOWN)
            ===================================================================== */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="section-header">Am I a Winner? (Bayesian Analysis)</div>
          <div className="section-content">
            {/* Observed Results Input */}
            <div className="block" style={{ marginBottom: 'var(--gap)' }}>
              <div className="block-title">Your Observed Results</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginTop: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.5rem',
                  }}>
                    Hands Played
                  </label>
                  <input
                    type="number"
                    value={observedHands}
                    onChange={(e) => setObservedHands(Number(e.target.value))}
                    min={1000}
                    step={1000}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid black',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '0.5rem',
                  }}>
                    Total Winnings (BB)
                  </label>
                  <input
                    type="number"
                    value={observedWinnings}
                    onChange={(e) => setObservedWinnings(Number(e.target.value))}
                    step={100}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid black',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1rem',
                      fontWeight: 700,
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                    Observed winrate: {((observedWinnings / observedHands) * 100).toFixed(2)} BB/100
                  </p>
                </div>
              </div>
            </div>

            <BayesianBreakdown
              observedWinnings={observedWinnings}
              handsPlayed={observedHands}
              stdDev={stdDev}
              stakes={stakes}
            />
          </div>
        </section>

        {/* =====================================================================
            SECTION 3: COACH MODE (CHARTS WITH EXPLANATIONS)
            ===================================================================== */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="section-header">Coach Mode (Interactive Explanations)</div>
          <div className="section-content">
            {/* Auto-generated explanation paragraph */}
            <CoachParagraph
              winrate={winrate}
              stdDev={stdDev}
              hands={sampleSize}
              stakes={stakes}
            />

            <div className="grid-12" style={{ marginTop: 'var(--gap)' }}>
              {/* Monte Carlo Chart with Tooltips */}
              <div className="block col-8">
                <div className="block-title">Sample Paths Simulation</div>
                <MonteCarloWithTooltips
                  winrate={winrate}
                  stdDev={stdDev}
                  hands={sampleSize}
                  stakes={stakes}
                  seed={seed}
                />
              </div>

              {/* Bell Curve with Tooltips */}
              <div className="block col-4">
                <div className="block-title">Outcome Distribution</div>
                <BellCurveWithTooltips
                  winrate={winrate}
                  stdDev={stdDev}
                  hands={sampleSize}
                  stakes={stakes}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            padding: '1rem',
            background: 'white',
            border: '2px solid black',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            opacity: 0.6,
          }}
        >
          <span style={{ fontWeight: 700 }}>ADVANCED ANALYSIS</span> — Deep-dive poker variance tools
        </footer>
      </div>
    </main>
  );
}
