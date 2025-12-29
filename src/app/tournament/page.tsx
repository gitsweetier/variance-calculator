'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SliderControl } from '@/components/calculator/SliderControls';
import { Toggle } from '@/components/ui/Toggle';
import { Tooltip } from '@/components/ui/Tooltip';
import { NumberInput } from '@/components/ui/NumberInput';
import { MetricCard } from '@/components/ui/MetricCard';
import { useDebounce } from '@/hooks/useDebounce';
import { useTournamentSimulation } from '@/hooks/useTournamentSimulation';
import { TournamentDetailedRunChart } from '@/components/tournament/TournamentDetailedRunChart';
import { TournamentSamplePathsChart } from '@/components/tournament/TournamentSamplePathsChart';
import { DEBOUNCE_DELAY } from '@/lib/constants';
import type { TournamentCalculatorInputs, TournamentSimulationMode } from '@/lib/tournament/types';
import { formatDollars, formatBuyIns, formatPct, ordinal, formatNumber } from '@/lib/tournament/formatters';

type TabId = 'outcomes' | 'downswings' | 'bankroll' | 'model';
type DisplayUnit = 'buyins' | 'dollars';

interface TournamentPreset {
  name: string;
  buyin: number;
  fee: number;
  fieldSize: number;
  percentPaid: number;
  topPrizeMultiple: number;
}

const TOURNAMENT_PRESETS: TournamentPreset[] = [
  {
    name: '$25 Turbo',
    buyin: 22,
    fee: 3,
    fieldSize: 1000,
    percentPaid: 20,
    topPrizeMultiple: 50,
  },
  {
    name: '$100 Daily Deepstack',
    buyin: 91,
    fee: 9,
    fieldSize: 500,
    percentPaid: 15,
    topPrizeMultiple: 25,
  },
  {
    name: '$500 Sunday Major',
    buyin: 465,
    fee: 35,
    fieldSize: 2000,
    percentPaid: 15,
    topPrizeMultiple: 200,
  },
  {
    name: '$1k High Roller',
    buyin: 950,
    fee: 50,
    fieldSize: 300,
    percentPaid: 12,
    topPrizeMultiple: 80,
  },
];

export default function TournamentPage() {
  const [buyIn, setBuyIn] = useState(100);
  const [fee, setFee] = useState(10);

  const [fieldSize, setFieldSize] = useState(100);
  const [percentPaid, setPercentPaid] = useState(15);
  const [topPrizeMultiple, setTopPrizeMultiple] = useState(20);

  const [roiPercent, setRoiPercent] = useState(20);
  const [tournaments, setTournaments] = useState(2000);
  const [bankrollBuyIns, setBankrollBuyIns] = useState(200);
  const [mode, setMode] = useState<TournamentSimulationMode>('fast');

  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('buyins');
  const [activeTab, setActiveTab] = useState<TabId>('outcomes');
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === 'custom') return;

    const preset = TOURNAMENT_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setBuyIn(preset.buyin);
      setFee(preset.fee);
      setFieldSize(preset.fieldSize);
      setPercentPaid(preset.percentPaid);
      setTopPrizeMultiple(preset.topPrizeMultiple);
    }
  };

  // Auto-switch to "custom" when user manually changes parameters
  useEffect(() => {
    if (selectedPreset === 'custom') return;

    const preset = TOURNAMENT_PRESETS.find(p => p.name === selectedPreset);
    if (preset) {
      const matches =
        buyIn === preset.buyin &&
        fee === preset.fee &&
        fieldSize === preset.fieldSize &&
        percentPaid === preset.percentPaid &&
        topPrizeMultiple === preset.topPrizeMultiple;

      if (!matches) {
        setSelectedPreset('custom');
      }
    }
  }, [buyIn, fee, fieldSize, percentPaid, topPrizeMultiple, selectedPreset]);

  const inputs = useMemo((): TournamentCalculatorInputs => {
    return {
      buyIn,
      fee,
      fieldSize,
      percentPaid,
      topPrizeMultiple,
      roiPercent,
      tournaments,
      bankrollBuyIns,
      mode,
    };
  }, [buyIn, fee, fieldSize, percentPaid, topPrizeMultiple, roiPercent, tournaments, bankrollBuyIns, mode]);

  const debouncedInputs = useDebounce(inputs, DEBOUNCE_DELAY);

  const { results, isLoading, progress, error, runSimulation } = useTournamentSimulation();

  useEffect(() => {
    runSimulation(debouncedInputs);
  }, [debouncedInputs, runSimulation]);

  const cost = buyIn + fee;
  const bankrollDollars = bankrollBuyIns * buyIn;

  const tabs: Array<{ id: TabId; label: string; shortLabel: string }> = [
    { id: 'outcomes', label: 'Expected Outcomes', shortLabel: 'Outcomes' },
    { id: 'downswings', label: 'Downswings', shortLabel: 'Downswing' },
    { id: 'bankroll', label: 'Bankroll & RoR', shortLabel: 'Bankroll' },
    { id: 'model', label: 'Model & Payouts', shortLabel: 'Model' },
  ];

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (results?.payoutModel.warnings?.length) w.push(...results.payoutModel.warnings);
    if (results?.skillModel.warnings?.length) w.push(...results.skillModel.warnings);
    return w;
  }, [results]);

  return (
    <main className="page-main">
      <div className="page-main__inner">
        <header className="page-header">
          <div className="page-header__title-wrapper">
            <h1 className="page-header__title">
              Tournament Variance
            </h1>
            <p className="page-header__subtitle">
              MTT outcome modeling + Monte Carlo
            </p>
          </div>
          <div className="header-nav">
            <Link href="/" className="header-nav__link header-nav__link--white">
              Cash Game
            </Link>
            <Link href="/advanced" className="header-nav__link header-nav__link--black">
              Advanced
            </Link>
            <Link href="/chat" className="header-nav__link header-nav__link--white">
              Chat
            </Link>
          </div>
        </header>

        <section className="page-section" aria-labelledby="params-heading">
          <div className="block block--accent" style={{ marginBottom: 'var(--gap)', padding: '0.75rem 1rem' }} role="alert">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.25rem' }} aria-hidden="true">⚠️</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                <strong>Important:</strong> Tournament variance has heavy tails. Actual downswings can exceed these estimates significantly. This tool provides conservative guidance, not absolute limits. Simulation results are more reliable than normal approximations.
              </div>
            </div>
          </div>

          <h2 id="params-heading" className="section-header">Tournament Parameters</h2>
          <div className="section-content">
            <div className="block">
              <div className="grid-12" style={{ marginBottom: '1rem' }}>
                <div className="col-8">
                  <label htmlFor="preset-select" className="slider-control__label">Quick Presets</label>
                  <select
                    id="preset-select"
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="slider-controls__stakes-select"
                    aria-label="Select tournament preset"
                  >
                    <option value="custom">Custom</option>
                    {TOURNAMENT_PRESETS.map((preset) => (
                      <option key={preset.name} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-4">
                  <label htmlFor="unit-toggle" className="slider-control__label">Display Units</label>
                  <div style={{ marginTop: '0.25rem' }}>
                    <Toggle
                      checked={displayUnit === 'dollars'}
                      onChange={(checked) => setDisplayUnit(checked ? 'dollars' : 'buyins')}
                      options={['Buy-ins', 'Dollars']}
                      aria-label="Toggle between buy-ins and dollars"
                    />
                  </div>
                </div>
              </div>

              <h3 className="block-title">
                Structure
              </h3>

              <div className="grid-12">
                <div className="col-3">
                  <NumberInput
                    label="Buy-in"
                    prefix="$"
                    value={buyIn}
                    onChange={setBuyIn}
                    min={1}
                    step={1}
                  />
                </div>
                <div className="col-3">
                  <NumberInput
                    label="Fee"
                    prefix="$"
                    value={fee}
                    onChange={setFee}
                    min={0}
                    step={1}
                  />
                </div>
                <div className="col-3">
                  <label className="slider-control__label">Total cost</label>
                  <div className="metric__value">
                    {formatDollars(cost)}
                  </div>
                  <div className="metric__subtext">
                    ROI is defined on total cost (buy-in + fee)
                  </div>
                </div>
                <div className="col-3">
                  <label htmlFor="mode-select" className="slider-control__label">Mode</label>
                  <select
                    id="mode-select"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as TournamentSimulationMode)}
                    className="slider-controls__stakes-select"
                    aria-label="Select simulation accuracy mode"
                  >
                    <option value="turbo">Turbo</option>
                    <option value="fast">Fast</option>
                    <option value="accurate">Accurate</option>
                  </select>
                </div>

                <div className="col-3">
                  <NumberInput
                    label="Field size"
                    value={fieldSize}
                    onChange={setFieldSize}
                    min={2}
                    step={1}
                  />
                </div>
                <div className="col-3">
                  <NumberInput
                    label="% paid"
                    value={percentPaid}
                    onChange={setPercentPaid}
                    min={0.1}
                    max={100}
                    step={0.1}
                  />
                </div>
                <div className="col-3">
                  <NumberInput
                    label="Top prize (× buy-in)"
                    value={topPrizeMultiple}
                    onChange={setTopPrizeMultiple}
                    min={0.1}
                    step={0.1}
                  />
                </div>
              </div>
            </div>

            <div className="block">
              <h3 className="block-title">
                Player & Volume
              </h3>
              <div className="slider-controls__grid">
                <SliderControl
                  label="ROI (after fee)"
                  value={roiPercent}
                  min={-20}
                  max={80}
                  step={1}
                  unit="%"
                  inlineEdit={{
                    value: roiPercent,
                    min: -100,
                    max: 500,
                    step: 0.1,
                    unit: '%',
                    precision: 1,
                    onCommit: setRoiPercent,
                  }}
                  onChange={setRoiPercent}
                />
                <SliderControl
                  label="Tournaments"
                  value={tournaments}
                  min={100}
                  max={5000}
                  step={100}
                  inlineEdit={{
                    value: tournaments,
                    min: 0,
                    max: 200000,
                    step: 1,
                    unit: 'tournaments',
                    precision: 0,
                    onCommit: setTournaments,
                  }}
                  onChange={setTournaments}
                />
                <SliderControl
                  label="Bankroll"
                  value={bankrollBuyIns}
                  min={10}
                  max={500}
                  step={10}
                  formatValue={(v) => `${v.toFixed(0)} buy-ins`}
                  inlineEdit={{
                    value: bankrollBuyIns,
                    min: 0,
                    max: 5000,
                    step: 1,
                    unit: 'buy-ins',
                    precision: 0,
                    onCommit: setBankrollBuyIns,
                  }}
                  onChange={setBankrollBuyIns}
                />
                <div className="slider-control">
                  <div className="slider-control__header">
                    <span className="slider-control__label">Bankroll (USD)</span>
                    <span className="slider-control__value">{formatDollars(bankrollDollars)}</span>
                  </div>
                  <div className="slider-control__subtext">
                    1 BI = {formatDollars(buyIn)}
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="block" role="status" aria-live="polite">
                <h3 className="block-title">
                  Simulation
                </h3>
                <div className="progress-bar" aria-label="Simulation progress">
                  <div className="progress-bar__fill progress-bar__fill--accent" style={{ width: `${Math.round(progress * 100)}%` }} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} />
                </div>
                <div className="progress-bar__label">
                  {Math.round(progress * 100)}%
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="block block--error" role="alert">
                <h3 className="block-title">Error</h3>
                <div className="block__error-message">
                  {error}
                </div>
              </div>
            ) : null}

            {warnings.length ? (
              <div className="block block--accent" role="alert">
                <h3 className="block-title">Notes / Warnings</h3>
                <ul className="block__warning-list">
                  {warnings.map((w, i) => (
                    <li key={i}>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        <section className="page-section" aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">Tournament Analysis Results</h2>
          <div className="tabs">
            <div className="tabs__list" role="tablist" aria-label="Tournament variance tabs">
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
              {/* TAB: OUTCOMES */}
              <div id="tab-panel-outcomes" role="tabpanel" hidden={activeTab !== 'outcomes'} className="tab-panel" aria-labelledby="tab-outcomes">
                <div className="grid-12">
                  <article className="block col-8">
                    <h3 className="block-title">Sample Paths</h3>
                    <div style={{ marginTop: '0.75rem' }}>
                      <TournamentSamplePathsChart
                        paths={results?.samplePaths ?? []}
                        confidence={results?.confidence ?? []}
                        buyIn={buyIn}
                        unit={displayUnit}
                      />
                    </div>
                  </article>
                  <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <article className="block">
                      <h3 className="block-title">Key Results</h3>
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <MetricCard
                          label="EV / tournament"
                          value={results ? (displayUnit === 'dollars' ? formatDollars(results.perTournament.ev) : formatBuyIns(results.perTournament.ev, buyIn)) : '—'}
                          variant={(results?.perTournament.ev ?? 0) >= 0 ? 'positive' : 'negative'}
                          subtext={results ? `ROI: ${((results.skillModel.roiAchieved ?? 0) * 100).toFixed(1)}% (target ${roiPercent.toFixed(1)}%)` : undefined}
                        />

                        <MetricCard
                          label="SD / tournament"
                          value={results ? (displayUnit === 'dollars' ? formatDollars(results.perTournament.sd) : formatBuyIns(results.perTournament.sd, buyIn)) : '—'}
                          subtext={results ? `ITM: ${formatPct(results.perTournament.itmProbability)}` : undefined}
                        />

                        <MetricCard
                          label={`P(Profit after ${formatNumber(tournaments)})`}
                          value={results ? formatPct(results.aggregate.simulatedProbabilityOfProfit) : '—'}
                          variant={(results?.aggregate.simulatedProbabilityOfProfit ?? 0) >= 0.5 ? 'positive' : 'negative'}
                          subtext={results ? `Normal approx: ${formatPct(results.aggregate.normalApproxProbabilityOfProfit)}` : undefined}
                        />

                        <MetricCard
                          label="Median profit"
                          value={results ? (displayUnit === 'dollars' ? formatDollars(results.aggregate.profitQuantiles.p50) : formatBuyIns(results.aggregate.profitQuantiles.p50, buyIn)) : '—'}
                          variant={(results?.aggregate.profitQuantiles.p50 ?? 0) >= 0 ? 'positive' : 'negative'}
                          subtext={results ? `5–95%: ${displayUnit === 'dollars'
                            ? `${formatDollars(results.aggregate.profitQuantiles.p05)} to ${formatDollars(results.aggregate.profitQuantiles.p95)}`
                            : `${formatBuyIns(results.aggregate.profitQuantiles.p05, buyIn)} to ${formatBuyIns(results.aggregate.profitQuantiles.p95, buyIn)}`}` : undefined}
                        />
                      </div>
                    </article>

                    <article className="block">
                      <h3 className="block-title">Payout Structure (modeled)</h3>
                      {results ? (
                        <div className="tournament-info">
                          <div className="key-value-row">
                            <span className="key-value-row__label">Prize pool</span>
                            <span className="key-value-row__value">{formatDollars(results.payoutModel.prizePool)}</span>
                          </div>
                          <div className="key-value-row">
                            <span className="key-value-row__label">Paid places</span>
                            <span className="key-value-row__value">{formatNumber(results.payoutModel.numPaid)} ({((results.payoutModel.numPaid / fieldSize) * 100).toFixed(1)}%)</span>
                          </div>

                          <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '0.75rem' }}>
                            <table style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                              <caption className="sr-only">Payout structure by finishing position</caption>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                  <th style={{ textAlign: 'left', paddingBottom: '0.5rem', opacity: 0.6 }}>Place</th>
                                  <th style={{ textAlign: 'right', paddingBottom: '0.5rem', opacity: 0.6 }}>Payout</th>
                                  <th style={{ textAlign: 'right', paddingBottom: '0.5rem', opacity: 0.6 }}>× BI</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { place: 1, label: '1st' },
                                  { place: 2, label: '2nd' },
                                  { place: 3, label: '3rd' },
                                  { place: Math.ceil(results.payoutModel.numPaid * 0.1), label: `${ordinal(Math.ceil(results.payoutModel.numPaid * 0.1))} (10%)` },
                                  { place: Math.ceil(results.payoutModel.numPaid * 0.5), label: `${ordinal(Math.ceil(results.payoutModel.numPaid * 0.5))} (50%)` },
                                  { place: results.payoutModel.numPaid, label: 'Min cash' },
                                ].filter((item, idx, arr) => {
                                  // Remove duplicates
                                  return arr.findIndex(x => x.place === item.place) === idx;
                                }).map(({ place, label }) => {
                                  const prize = results.payoutModel.prizes[place - 1] ?? 0;
                                  const multiple = buyIn > 0 ? prize / buyIn : 0;
                                  return (
                                    <tr key={place}>
                                      <td style={{ paddingTop: '0.35rem' }}>{label}</td>
                                      <td style={{ textAlign: 'right', paddingTop: '0.35rem', fontWeight: 700 }}>
                                        {formatDollars(prize)}
                                      </td>
                                      <td style={{ textAlign: 'right', paddingTop: '0.35rem', opacity: 0.6 }}>
                                        {multiple.toFixed(1)}×
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="metric__subtext">—</div>
                      )}
                    </article>
                  </div>
                </div>

                <article className="block">
                  <h3 className="block-title">One detailed run</h3>
                  <div style={{ marginTop: '0.75rem' }}>
                    <TournamentDetailedRunChart path={results?.detailedPath ?? null} buyIn={buyIn} unit={displayUnit} />
                  </div>
                </article>

                <article className="block">
                  <h3 className="block-title">
                    ROI Sensitivity Analysis{' '}
                    <Tooltip content="How your expected profit changes if your true ROI differs from your assumption. Useful for understanding uncertainty in skill estimates.">
                      <span style={{ opacity: 0.5, cursor: 'help', fontSize: '0.75rem' }}>ⓘ</span>
                    </Tooltip>
                  </h3>
                  {results ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '0.5rem', opacity: 0.8 }}>
                        Current assumption: {roiPercent.toFixed(1)}% ROI
                      </div>
                      <table style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        <caption className="sr-only">ROI sensitivity analysis showing expected value and profit probability at different ROI levels</caption>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                            <th style={{ textAlign: 'left', paddingBottom: '0.5rem', opacity: 0.6 }}>True ROI</th>
                            <th style={{ textAlign: 'right', paddingBottom: '0.5rem', opacity: 0.6 }}>EV ({formatNumber(tournaments)} tourneys)</th>
                            <th style={{ textAlign: 'right', paddingBottom: '0.5rem', opacity: 0.6 }}>P(Profit)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[-4, -2, -1, 0, +1, +2, +4].map((roiShift) => {
                            const adjustedRoi = roiPercent + roiShift;
                            const adjustedEv = (cost * (adjustedRoi / 100)) * tournaments;
                            const currentEv = results.aggregate.expectedProfit;
                            const currentSd = results.aggregate.sdProfit;
                            // Rough approximation: P(profit) using normal with adjusted EV
                            const zScore = adjustedEv / currentSd;
                            const approxPProfit = zScore > 3 ? 1 : zScore < -3 ? 0 : 0.5 + 0.5 * Math.tanh(zScore * 0.7);
                            const isCurrent = roiShift === 0;

                            return (
                              <tr key={roiShift} style={{ background: isCurrent ? 'rgba(0,0,0,0.04)' : 'transparent' }}>
                                <td style={{ paddingTop: '0.35rem', fontWeight: isCurrent ? 700 : 400 }}>
                                  {adjustedRoi.toFixed(1)}% {roiShift > 0 ? `(+${roiShift}%)` : roiShift < 0 ? `(${roiShift}%)` : '(current)'}
                                </td>
                                <td style={{ textAlign: 'right', paddingTop: '0.35rem', fontWeight: isCurrent ? 700 : 400, color: adjustedEv >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                                  {displayUnit === 'dollars' ? formatDollars(adjustedEv) : formatBuyIns(adjustedEv, buyIn)}
                                </td>
                                <td style={{ textAlign: 'right', paddingTop: '0.35rem', opacity: 0.8 }}>
                                  {formatPct(approxPProfit)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                        Note: Estimates assume variance stays constant. Actual variance may change with skill level.
                      </div>
                    </div>
                  ) : (
                    <div className="metric__subtext">—</div>
                  )}
                </article>
              </div>

              {/* TAB: DOWNSWINGS */}
              <div id="tab-panel-downswings" role="tabpanel" hidden={activeTab !== 'downswings'} className="tab-panel" aria-labelledby="tab-downswings">
                <article className="block">
                  <h3 className="block-title">Max drawdown within {formatNumber(tournaments)} tournaments</h3>
                  {results ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <caption className="sr-only">Probabilities of experiencing maximum drawdowns at different threshold levels during {formatNumber(tournaments)} tournaments</caption>
                          <thead>
                            <tr>
                              <th>Threshold</th>
                              <th>P(Drawdown ≥ threshold)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.downswing.thresholdsBuyIns.map((thr, i) => (
                              <tr key={thr}>
                                <td>{thr} BI</td>
                                <td>{formatPct(results.downswing.probabilities[i] ?? 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', opacity: 0.8 }}>
                        Avg max drawdown:{' '}
                        <strong>
                          {displayUnit === 'dollars'
                            ? formatDollars(results.downswing.averageMaxDrawdown)
                            : formatBuyIns(results.downswing.averageMaxDrawdown, buyIn)}
                        </strong>
                        {' · '}
                        Worst seen:{' '}
                        <strong>
                          {displayUnit === 'dollars'
                            ? formatDollars(results.downswing.worstMaxDrawdown)
                            : formatBuyIns(results.downswing.worstMaxDrawdown, buyIn)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.75rem', opacity: 0.6 }}>—</div>
                  )}
                </article>
              </div>

              {/* TAB: BANKROLL */}
              <div id="tab-panel-bankroll" role="tabpanel" hidden={activeTab !== 'bankroll'} className="tab-panel" aria-labelledby="tab-bankroll">
                <div className="grid-12">
                  <article className="block col-6">
                    <h3 className="block-title">Finite-horizon bust probability (simulation)</h3>
                    {results ? (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="metric">
                          <span className="metric__label">Starting bankroll</span>
                          <span className="metric__value">{bankrollBuyIns.toFixed(0)} BI</span>
                          <span className="metric__subtext">{formatDollars(bankrollDollars)}</span>
                        </div>
                        <div style={{ marginTop: '1rem' }} />
                        <div className="metric">
                          <span className="metric__label">P(bust within {formatNumber(tournaments)} tournaments)</span>
                          <span className={`metric__value ${results.bankroll.bustProbability < 0.05 ? 'metric__value--positive' : results.bankroll.bustProbability < 0.1 ? 'metric__value--accent' : 'metric__value--negative'}`}>
                            {formatPct(results.bankroll.bustProbability)}
                          </span>
                          <span className="metric__subtext">
                            Bust defined as bankroll &lt; entry cost ({formatDollars(cost)})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem', opacity: 0.6 }}>—</div>
                    )}
                  </article>

                  <article className="block col-6">
                    <h3 className="block-title">
                      Simulation vs Approximation{' '}
                      <Tooltip content="Compare Monte Carlo simulation (accurate) vs normal approximation (fast but less reliable for tournaments).">
                        <span style={{ opacity: 0.5, cursor: 'help', fontSize: '0.75rem' }}>ⓘ</span>
                      </Tooltip>
                    </h3>
                    {results ? (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}>
                            <span>Method</span>
                            <span>Bust Risk</span>
                          </div>

                          <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderLeft: '3px solid var(--ink)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Simulation</span>
                              <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                                {formatPct(results.bankroll.bustProbability)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.25rem' }}>
                              Monte Carlo ({formatNumber(results.numTrials)} trials)
                            </div>
                          </div>

                          <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.02)', borderLeft: '3px solid var(--accent)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Approximation</span>
                              <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                                {results.bankroll.approxInfiniteRor !== undefined ? formatPct(results.bankroll.approxInfiniteRor) : '—'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.25rem' }}>
                              Normal formula (exp(-2μB/σ²))
                            </div>
                          </div>

                          {results.bankroll.approxInfiniteRor !== undefined && Math.abs(results.bankroll.bustProbability - results.bankroll.approxInfiniteRor) > 0.05 && (
                            <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(255,165,0,0.1)', borderLeft: '3px solid var(--accent)', fontSize: '0.7rem' }}>
                              <strong>Note:</strong> Large difference detected. Trust simulation over approximation for tournaments.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem', opacity: 0.6 }}>—</div>
                    )}
                  </article>
                </div>
              </div>

              {/* TAB: MODEL */}
              <div id="tab-panel-model" role="tabpanel" hidden={activeTab !== 'model'} className="tab-panel" aria-labelledby="tab-model">
                <div className="grid-12">
                  <article className="block col-6">
                    <h3 className="block-title">Skill model</h3>
                    {results ? (
                      <div className="tournament-info">
                        <div className="key-value-row">
                          <span className="key-value-row__label">
                            Finish bias β{' '}
                            <Tooltip content="Skill parameter. Positive β means you finish deeper than random (higher skill). β=0 is average. Higher β = better finishes.">
                              <span style={{ opacity: 0.5, cursor: 'help' }}>ⓘ</span>
                            </Tooltip>
                          </span>
                          <span className="key-value-row__value">{results.skillModel.beta.toFixed(4)}</span>
                        </div>
                        <div className="key-value-row">
                          <span className="key-value-row__label">
                            ROI (achieved){' '}
                            <Tooltip content="Return on Investment. The actual ROI% achieved by your skill model. A 20% ROI means you profit $20 per $100 tournament on average.">
                              <span style={{ opacity: 0.5, cursor: 'help' }}>ⓘ</span>
                            </Tooltip>
                          </span>
                          <span className="key-value-row__value">{(results.skillModel.roiAchieved * 100).toFixed(1)}%</span>
                        </div>
                        <div className="key-value-row">
                          <span className="key-value-row__label">Max ROI feasible</span>
                          <span className="key-value-row__value">{(results.skillModel.maxRoiFeasible * 100).toFixed(1)}%</span>
                        </div>
                        <div className="tournament-info__text" style={{ marginTop: '0.75rem' }}>
                          Prob(rank) ∝ exp(-β · percentile). β=0 is average (uniform ranks). Higher β shifts mass to deeper runs.
                        </div>
                      </div>
                    ) : (
                      <div className="metric__subtext">—</div>
                    )}
                  </article>

                  <article className="block col-6">
                    <h3 className="block-title">Payout curve</h3>
                    {results ? (
                      <div className="tournament-info">
                        <div className="key-value-row">
                          <span className="key-value-row__label">
                            Curve α{' '}
                            <Tooltip content="Payout curve steepness. Higher α = more top-heavy payouts (bigger 1st place prize relative to min cash).">
                              <span style={{ opacity: 0.5, cursor: 'help' }}>ⓘ</span>
                            </Tooltip>
                          </span>
                          <span className="key-value-row__value">{results.payoutModel.alpha.toFixed(4)}</span>
                        </div>
                        <div className="key-value-row">
                          <span className="key-value-row__label">Top prize (actual)</span>
                          <span className="key-value-row__value">{formatDollars(results.payoutModel.topPrizeActual)}</span>
                        </div>
                        <div className="tournament-info__text" style={{ marginTop: '0.75rem' }}>
                          prize(place) ∝ 1 / place^α, scaled to fit prize pool.
                        </div>
                      </div>
                    ) : (
                      <div className="metric__subtext">—</div>
                    )}
                  </article>
                </div>

                <article className="block">
                  <h3 className="block-title">Top modeled outcomes</h3>
                  {results ? (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <caption className="sr-only">Top 12 most likely tournament outcomes with prizes and probabilities</caption>
                          <thead>
                            <tr>
                              <th>Finish</th>
                              <th>Prize</th>
                              <th>Profit</th>
                              <th>Prob</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...results.outcomes]
                              .filter((o) => o.label !== 'Bust')
                              .slice(0, 12)
                              .map((o) => (
                                <tr key={o.label}>
                                  <td>{o.place ? ordinal(o.place) : o.label}</td>
                                  <td>{formatDollars(o.prize)}</td>
                                  <td>{o.profit >= 0 ? '+' : ''}{displayUnit === 'dollars' ? formatDollars(o.profit) : formatBuyIns(o.profit, buyIn)}</td>
                                  <td>{formatPct(o.probability)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.75rem' }}>
                        Note: probabilities are for exact finishing positions in this simplified finish-distribution model.
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.75rem', opacity: 0.6 }}>—</div>
                  )}
                </article>
              </div>
            </div>
          </div>
        </section>

        <footer className="page-footer">
          Statistical approximations based on Monte Carlo simulation.
          <br />
          <span className="page-footer__brand">TOURNAMENT VARIANCE</span> — Built for poker players
        </footer>
      </div>
    </main>
  );
}


