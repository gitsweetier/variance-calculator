'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SliderControls } from '@/components/calculator/SliderControls';
import { MonteCarloSVG } from '@/components/calculator/MonteCarloSVG';
import { DownswingTable } from '@/components/calculator/DownswingTable';
import { BreakEvenTimeline } from '@/components/calculator/BreakEvenTimeline';
import { BankrollRecommendations } from '@/components/calculator/BankrollRecommendations';
import { PlanningCalculators } from '@/components/calculator/PlanningCalculators';
import { CoreOutcomesCard } from '@/components/calculator/MetricsGrid';
import { DownswingSanityCheck } from '@/components/calculator/DownswingSanityCheck';
import { BackingCalculator } from '@/components/v2/BackingCalculator';
import { OutcomePercentilesSplit } from '@/components/v2/OutcomePercentilesSplit';
import { WinrateSensitivityCards } from '@/components/calculator/WinrateSensitivityCards';

type TabId = 'outcomes' | 'downswing' | 'bankroll' | 'staking' | 'tips';

export default function Home() {
  // Core parameters
  const [winrate, setWinrate] = useState(3);
  const [stdDev, setStdDev] = useState(80);
  const [sampleSize, setSampleSize] = useState(50000);
  const [bankroll, setBankroll] = useState(5000);
  const [stakes, setStakes] = useState(5.0); // $ per BB

  const [activeTab, setActiveTab] = useState<TabId>('outcomes');

  // Seed for reproducible Monte Carlo paths
  const seed = useMemo(() => {
    return Math.floor(winrate * 100 + stdDev * 10 + sampleSize / 1000);
  }, [winrate, stdDev, sampleSize]);

  const tabs: Array<{ id: TabId; label: string; shortLabel: string }> = [
    { id: 'outcomes', label: 'Expected Outcomes', shortLabel: 'Outcomes' },
    { id: 'downswing', label: 'Results and Downswings', shortLabel: 'Downswings' },
    { id: 'bankroll', label: 'Bankroll Requirements', shortLabel: 'Bankroll' },
    { id: 'staking', label: 'Backing & Staking', shortLabel: 'Staking' },
    { id: 'tips', label: 'Hot Tips', shortLabel: 'Hot Tips' },
  ];

  return (
    <main className="page-main">
      <div className="page-main__inner">
        {/* Header */}
        <header className="page-header">
          <div className="page-header__title-wrapper">
            <h1 className="page-header__title">
              Variance Calculator
            </h1>
            <p className="page-header__subtitle">
              Poker bankroll & variance analysis
            </p>
          </div>
          <div className="header-nav">
            <Link href="/winner" className="header-nav__link header-nav__link--accent">
              Am I a Winner?
            </Link>
            <Link href="/advanced" className="header-nav__link header-nav__link--black">
              Advanced
            </Link>
            <Link href="/tournament" className="header-nav__link header-nav__link--black">
              Tournament
            </Link>
            <Link href="/chat" className="header-nav__link header-nav__link--white">
              Chat
            </Link>
          </div>
        </header>

        {/* =====================================================================
            SECTION 1: YOUR PARAMETERS (always visible)
            ===================================================================== */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="section-header">Section 1: Your Parameters</div>
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
            TABS (rest of page)
            ===================================================================== */}
        <section style={{ marginBottom: 'var(--gap)' }}>
          <div className="tabs">
            {/* Mobile dropdown select */}
            <select
              className="tabs__mobile-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabId)}
              aria-label="Select tab"
            >
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Tab buttons (horizontal on desktop, vertical on mobile) */}
            <div className="tabs__list" role="tablist" aria-label="Variance calculator tabs">
              {tabs.map((t) => {
                const selected = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`tab-panel-${t.id}`}
                    className={`tab ${selected ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <span className="tab__label-full">{t.label}</span>
                    <span className="tab__label-short">{t.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <div className="tab-panels">
            {/* TAB 1: EXPECTED OUTCOMES */}
            <div
              id="tab-panel-outcomes"
              role="tabpanel"
              hidden={activeTab !== 'outcomes'}
              className="tab-panel"
            >
              <div className="grid-12">
                <div className="block col-8">
                  <div className="block-title">Sample Paths Simulation</div>
                  <MonteCarloSVG winrate={winrate} stdDev={stdDev} hands={sampleSize} seed={seed} />
                </div>
                <div className="col-4">
                  <CoreOutcomesCard
                    winrate={winrate}
                    stdDev={stdDev}
                    hands={sampleSize}
                    bankroll={bankroll}
                    stakes={stakes}
                  />
                </div>
              </div>

              <div className="grid-12">
                <div className="col-12">
                  <OutcomePercentilesSplit winrate={winrate} stdDev={stdDev} hands={sampleSize} stakes={stakes} />
                </div>
              </div>

              <div className="grid-12">
                <div className="col-12">
                  <BreakEvenTimeline winrate={winrate} stdDev={stdDev} />
                </div>
              </div>
            </div>

            {/* TAB 2: DOWNSWING SANITY CHECK */}
            <div
              id="tab-panel-downswing"
              role="tabpanel"
              hidden={activeTab !== 'downswing'}
              className="tab-panel"
            >
              <div className="section-content">
                <DownswingSanityCheck assumedWinrate={winrate} stdDev={stdDev} stakes={stakes} />
              </div>
            </div>

            {/* TAB 3: BANKROLL REQUIREMENTS */}
            <div
              id="tab-panel-bankroll"
              role="tabpanel"
              hidden={activeTab !== 'bankroll'}
              className="tab-panel"
            >
              {/* 1. Risk of Net Loss + What If You're Wrong - Side by side */}
              <div className="grid-12">
                <div className="col-5">
                  <DownswingTable winrate={winrate} stdDev={stdDev} stakes={stakes} />
                </div>
                <div className="col-7">
                  <WinrateSensitivityCards winrate={winrate} stdDev={stdDev} bankroll={bankroll} />
                </div>
              </div>

              {/* 2. Recommended Bankroll */}
              <div className="grid-12">
                <div className="col-12">
                  <BankrollRecommendations winrate={winrate} stdDev={stdDev} stakes={stakes} />
                </div>
              </div>

              {/* 3. Planning Calculators - Bottom */}
              <div className="grid-12">
                <div className="col-12">
                  <div className="block">
                    <div className="block-title" style={{ marginBottom: '1rem' }}>
                      Calculators
                    </div>
                    <PlanningCalculators winrate={winrate} stdDev={stdDev} stakes={stakes} />
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 4: BACKING / STAKING */}
            <div
              id="tab-panel-staking"
              role="tabpanel"
              hidden={activeTab !== 'staking'}
              className="tab-panel"
            >
              <BackingCalculator winrate={winrate} stdDev={stdDev} hands={sampleSize} stakes={stakes} bankroll={bankroll} />
            </div>

            {/* TAB 5: HOT TIPS */}
            <div
              id="tab-panel-tips"
              role="tabpanel"
              hidden={activeTab !== 'tips'}
              className="tab-panel"
            >
              {/* Coming soon */}
            </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="page-footer">
          Statistical approximations based on the normal distribution. Actual results may vary.
          <br />
          <span className="page-footer__brand">VARIANCE CALCULATOR</span> — Built for poker players
        </footer>
      </div>
    </main>
  );
}
