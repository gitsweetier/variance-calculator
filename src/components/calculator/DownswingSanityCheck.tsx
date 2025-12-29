'use client';

import { useEffect, useMemo, useState } from 'react';
import { outcomePercentile } from '@/lib/math/statistics';
import { useDebounce } from '@/hooks/useDebounce';
import { useDownswingProbability } from '@/hooks/useDownswingProbability';

interface DownswingSanityCheckProps {
  assumedWinrate: number;
  stdDev: number;
  stakes: number;
}

type ResultsUnit = 'dollars' | 'bb' | 'bi';

function formatPercent(p: number): string {
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(1)}%`;
}

function formatDollars(dollars: number): string {
  const abs = Math.abs(dollars);
  if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`;
  return `$${abs.toFixed(0)}`;
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

function roundToNearest(value: number, step: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return value;
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(4));
}

function formatBbPer100(winrate: number): string {
  const sign = winrate > 0 ? '+' : '';
  const formatted = Number.isInteger(winrate) ? winrate.toFixed(0) : winrate.toFixed(1);
  return `${sign}${formatted} bb/100`;
}

function formatBuyIns(bb: number): string {
  const buyIns = Math.abs(bb) / 100;
  return `${buyIns.toFixed(1)} BI`;
}

export function DownswingSanityCheck({ assumedWinrate, stdDev, stakes }: DownswingSanityCheckProps) {
  const [resultsUnit, setResultsUnit] = useState<ResultsUnit>('dollars');

  const [dollarsChange, setDollarsChange] = useState<number>(-10000);
  const [bbChange, setBbChange] = useState<number>(-2000);
  const [biChange, setBiChange] = useState<number>(-20);
  const [dollarsChangeText, setDollarsChangeText] = useState<string>('-10000');
  const [bbChangeText, setBbChangeText] = useState<string>('-2000');
  const [biChangeText, setBiChangeText] = useState<string>('-20');

  const [handsInDownswing, setHandsInDownswing] = useState<number>(25000);
  const [handsInDownswingText, setHandsInDownswingText] = useState<string>('25000');

  const [handsPerMonth, setHandsPerMonth] = useState<number>(25000);
  const [handsPerMonthText, setHandsPerMonthText] = useState<string>('25000');

  const bbFromInput = resultsUnit === 'dollars'
    ? dollarsChange / stakes
    : resultsUnit === 'bb'
      ? bbChange
      : biChange * 100;
  const downswingMagnitudeBB = Math.abs(bbFromInput);
  const netResultBB = -downswingMagnitudeBB; // Traditional tools typically treat a "downswing" as ending result <= -D
  const annualHands = Math.max(0, Math.round(handsPerMonth * 12));

  const percentile = outcomePercentile(netResultBB, handsInDownswing, assumedWinrate, stdDev);

  const getPercentileContext = () => {
    // Match the Winner Check "running hot/cold" language.
    if (percentile >= 90) return 'Running very hot';
    if (percentile >= 70) return 'Running above expected value';
    if (percentile >= 55) return 'Slightly above average';
    if (percentile >= 45) return 'Right on track';
    if (percentile >= 30) return 'Slightly below average';
    if (percentile >= 10) return 'Running cold';
    return 'Running ice cold';
  };

  const altWinrates = useMemo(() => {
    const base = assumedWinrate;
    const step = Math.max(0.5, Math.abs(base) * 0.5);
    // Keep this tight: base + 3 lower winrates (0 higher than selected by default).
    const ordered = [
      roundToNearest(base, 0.5),
      roundToNearest(base - step, 0.5),
      roundToNearest(base - 2 * step, 0.5),
      roundToNearest(base - 3 * step, 0.5),
    ];
    return ordered.filter((v, i) => ordered.indexOf(v) === i);
  }, [assumedWinrate]);

  const chanceForWinrate = (trueWinrate: number) => {
    // Traditional: P(ending net result <= -D) over the downswing hand-count.
    const cdf = outcomePercentile(netResultBB, handsInDownswing, trueWinrate, stdDev) / 100;
    return Math.min(1, Math.max(0, cdf));
  };

  const traditionalChance = chanceForWinrate(assumedWinrate);

  const chanceTileStyles = (chance: number) => {
    const c = Math.min(1, Math.max(0, chance));
    // Green (rare) -> Red (common)
    const hue = (1 - c) * 120;
    return {
      background: `hsla(${hue}, 85%, 92%, 1)`,
      border: `hsla(${hue}, 55%, 35%, 0.25)`,
    };
  };

  const { result, isLoading, progress, error, runDownswingProbability } = useDownswingProbability();

  const debouncedHandsPerMonth = useDebounce(handsPerMonth, 600);
  const debouncedThresholdBB = useDebounce(downswingMagnitudeBB, 600);

  type TimeframeId = 'year' | 'quarter' | 'month';
  const [timeframeProbs, setTimeframeProbs] = useState<Record<TimeframeId, number | null>>({
    year: null,
    quarter: null,
    month: null,
  });
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeId | null>(null);

  const handsByTimeframe = useMemo(() => {
    const month = Math.max(0, Math.round(debouncedHandsPerMonth));
    return {
      month,
      quarter: month * 3,
      year: month * 12,
    };
  }, [debouncedHandsPerMonth]);

  const baseSeed = useMemo(() => {
    const raw = Math.floor(Math.abs(assumedWinrate) * 10000 + stdDev * 100 + debouncedThresholdBB * 10 + handsByTimeframe.year);
    const mod = raw % 2147483647;
    return Math.max(1, mod);
  }, [assumedWinrate, stdDev, debouncedThresholdBB, handsByTimeframe.year]);

  const seedFor = (tf: TimeframeId) => {
    const offset = tf === 'year' ? 31 : tf === 'quarter' ? 17 : 7;
    const n = (baseSeed + offset) % 2147483647;
    return n <= 0 ? 1 : n;
  };

  useEffect(() => {
    if (!Number.isFinite(debouncedHandsPerMonth) || debouncedHandsPerMonth <= 0) return;
    if (!Number.isFinite(debouncedThresholdBB) || debouncedThresholdBB <= 0) return;
    if (handsByTimeframe.year <= 0) return;

    // New batch: clear all and compute year → quarter → month sequentially.
    setTimeframeProbs({ year: null, quarter: null, month: null });
    setActiveTimeframe('year');

    runDownswingProbability({
      hands: handsByTimeframe.year,
      winrate: assumedWinrate,
      stdDev,
      thresholdBB: debouncedThresholdBB,
      mode: 'turbo',
      seed: seedFor('year'),
    });
  }, [assumedWinrate, stdDev, debouncedHandsPerMonth, debouncedThresholdBB, handsByTimeframe, runDownswingProbability]);

  useEffect(() => {
    if (!activeTimeframe) return;
    if (!result) return;
    if (result.thresholdBB !== debouncedThresholdBB) return;
    if (result.hands !== handsByTimeframe[activeTimeframe]) return;

    setTimeframeProbs((prev) => ({ ...prev, [activeTimeframe]: result.probability }));

    const next: TimeframeId | null =
      activeTimeframe === 'year' ? 'quarter' : activeTimeframe === 'quarter' ? 'month' : null;

    if (!next) {
      setActiveTimeframe(null);
      return;
    }

    if (handsByTimeframe[next] <= 0) {
      setActiveTimeframe(null);
      return;
    }

    setActiveTimeframe(next);
    runDownswingProbability({
      hands: handsByTimeframe[next],
      winrate: assumedWinrate,
      stdDev,
      thresholdBB: debouncedThresholdBB,
      mode: 'turbo',
      seed: seedFor(next),
    });
  }, [activeTimeframe, result, assumedWinrate, stdDev, debouncedThresholdBB, handsByTimeframe, runDownswingProbability]);

  const probabilityTextFor = (tf: TimeframeId) => {
    const p = timeframeProbs[tf];
    if (p !== null) return formatPercent(p);
    if (activeTimeframe === tf && isLoading) return '…';
    return '—';
  };

  const yearProbabilityText = probabilityTextFor('year');

  return (
    <div className="grid-12">
      {/* Inputs (compact) */}
      <div className="col-6">
        <div style={{ background: 'white', border: '2px solid black', padding: '1rem', height: '100%' }}>
          <div className="flex justify-between items-baseline gap-4">
            <div className="block-title" style={{ marginBottom: '0.75rem' }}>Current Downswing Results</div>
          <div
            role="group"
            aria-label="Units"
            className="inline-flex border-2 border-black bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => {
                if (resultsUnit === 'dollars') return;
                const currentBB = resultsUnit === 'bb' ? bbChange : biChange * 100;
                const next = currentBB * stakes;
                setDollarsChange(next);
                setDollarsChangeText(toTidyNumberString(next));
                setResultsUnit('dollars');
              }}
              aria-pressed={resultsUnit === 'dollars'}
              className={`border-none px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-widest cursor-pointer ${
                resultsUnit === 'dollars' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              $
            </button>
            <button
              type="button"
              onClick={() => {
                if (resultsUnit === 'bb') return;
                const currentBB = resultsUnit === 'dollars' ? dollarsChange / stakes : biChange * 100;
                setBbChange(currentBB);
                setBbChangeText(toTidyNumberString(currentBB));
                setResultsUnit('bb');
              }}
              aria-pressed={resultsUnit === 'bb'}
              className={`border-none border-l-2 border-black px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-widest cursor-pointer ${
                resultsUnit === 'bb' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              BB
            </button>
            <button
              type="button"
              onClick={() => {
                if (resultsUnit === 'bi') return;
                const currentBB = resultsUnit === 'dollars' ? dollarsChange / stakes : bbChange;
                const next = currentBB / 100;
                setBiChange(next);
                setBiChangeText(toTidyNumberString(next));
                setResultsUnit('bi');
              }}
              aria-pressed={resultsUnit === 'bi'}
              className={`border-none border-l-2 border-black px-2 py-1 font-mono text-[0.625rem] font-bold uppercase tracking-widest cursor-pointer ${
                resultsUnit === 'bi' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              BI
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          <div>
            <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
              Winnings/Losses ({resultsUnit === 'dollars' ? '$' : resultsUnit === 'bb' ? 'BB' : 'BI'})
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={resultsUnit === 'dollars' ? dollarsChangeText : resultsUnit === 'bb' ? bbChangeText : biChangeText}
              onChange={(e) => {
                const raw = e.target.value;
                if (resultsUnit === 'dollars') setDollarsChangeText(raw);
                else if (resultsUnit === 'bb') setBbChangeText(raw);
                else setBiChangeText(raw);

                const parsed = parseFiniteNumberOrNull(raw);
                if (parsed === null) return;

                if (resultsUnit === 'dollars') setDollarsChange(parsed);
                else if (resultsUnit === 'bb') setBbChange(parsed);
                else setBiChange(parsed);
              }}
              onBlur={() => {
                if (resultsUnit === 'dollars') {
                  const parsed = parseFiniteNumberOrNull(dollarsChangeText);
                  if (parsed === null) {
                    setDollarsChangeText(toTidyNumberString(dollarsChange));
                    return;
                  }
                  setDollarsChange(parsed);
                  setDollarsChangeText(toTidyNumberString(parsed));
                } else if (resultsUnit === 'bb') {
                  const parsed = parseFiniteNumberOrNull(bbChangeText);
                  if (parsed === null) {
                    setBbChangeText(toTidyNumberString(bbChange));
                    return;
                  }
                  setBbChange(parsed);
                  setBbChangeText(toTidyNumberString(parsed));
                } else {
                  const parsed = parseFiniteNumberOrNull(biChangeText);
                  if (parsed === null) {
                    setBiChangeText(toTidyNumberString(biChange));
                    return;
                  }
                  setBiChange(parsed);
                  setBiChangeText(toTidyNumberString(parsed));
                }
              }}
              className="w-full py-1.5 px-2 text-[0.95rem]"
            />
            <div className="mt-1.5 text-xs opacity-65">
              ≈ <strong>{formatBuyIns(downswingMagnitudeBB)}</strong> ({downswingMagnitudeBB.toFixed(0)} BB)
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
              Hands Played
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={handsInDownswingText}
              onChange={(e) => {
                const raw = e.target.value;
                setHandsInDownswingText(raw);

                const parsed = parseFiniteNumberOrNull(raw);
                if (parsed === null) return;

                const next = Math.max(1, Math.round(parsed));
                setHandsInDownswing(next);
              }}
              onBlur={() => {
                const parsed = parseFiniteNumberOrNull(handsInDownswingText);
                if (parsed === null) {
                  setHandsInDownswingText(String(handsInDownswing));
                  return;
                }
                const next = Math.max(1, Math.round(parsed));
                setHandsInDownswing(next);
                setHandsInDownswingText(String(next));
              }}
              step={1000}
              className="w-full py-1.5 px-2 text-[0.95rem]"
            />
          </div>
        </div>
        </div>
      </div>

      {/* Traditional output (compact + visual) */}
      <div className="col-6">
        <div style={{ background: 'white', border: '2px solid black', padding: '1rem', height: '100%' }}>
          <div className="block-title" style={{ marginBottom: '0.75rem' }}>
            Traditional Downswing Calculator (Net Result)
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-4xl leading-none">
                {formatPercent(traditionalChance)}
              </span>
              <span className="text-sm opacity-65">chance</span>
            </div>
            <div className="text-right text-xs opacity-65">
              Down ≥ {formatBuyIns(downswingMagnitudeBB)} in {handsInDownswing.toLocaleString()} hands
            </div>
          </div>

          <div className="mt-1.5 text-[0.95rem]">
            {getPercentileContext()}
          </div>

          <div className="progress-bar mt-3 h-2">
            <div className="progress-bar__fill progress-bar__fill--negative" style={{ width: `${traditionalChance * 100}%` }} />
          </div>

          <div className="mt-2.5 text-xs opacity-65">
            This is the probability of <strong>ending</strong> {handsInDownswing.toLocaleString()} hands at or below that result. (Not peak→trough drawdown risk.)
          </div>
        </div>
      </div>

      {/* Sensitivity (single-row horizontal grid of tiles) - moved above banner */}
      <div className="block col-12" style={{ padding: '0.75rem 0.85rem' }}>
        <div className="block-title" style={{ marginBottom: '0.5rem' }}>
          Sensitivity to true winrate (traditional net-result %)
        </div>

        <div
          style={{
            marginTop: '0.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.25rem',
          }}
        >
          {altWinrates.map((wr) => {
            const chance = chanceForWinrate(wr);
            const styles = chanceTileStyles(chance);
            return (
              <div
                key={wr}
                style={{
                  border: `1px solid ${styles.border}`,
                  background: styles.background,
                  padding: '0.35rem 0.4rem',
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700 }}>
                  {formatBbPer100(wr)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 700, marginTop: '0.15rem' }}>
                  {formatPercent(chance)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner alert - horizontal two-panel */}
      <div
        style={{
          gridColumn: 'span 12',
          display: 'flex',
          flexDirection: 'row',
          background: 'white',
          border: '1.5px solid #000',
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
            Traditional Downswing Math is Misleading
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
            Those calculations show the odds of a downswing starting <strong style={{ fontWeight: 700 }}>right now</strong>. But downswings can start anytime—so the <em>lifetime</em> odds are much higher. See below.
          </div>
        </div>
      </div>

      {/* Annual probability */}
      <div className="block col-12 block--accent">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          What You Actually Need To Think About (Peak → Trough Risk)
        </div>

        {/* Top row: hands input (left) + main probability display (right) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: hands per month input */}
          <div style={{ flex: '0 0 180px', minWidth: 160, maxWidth: 220 }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.35rem',
              }}
            >
              Average hands / month
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={handsPerMonthText}
              onChange={(e) => {
                const raw = e.target.value;
                setHandsPerMonthText(raw);

                const parsed = parseFiniteNumberOrNull(raw);
                if (parsed === null) return;

                const next = Math.max(0, Math.round(parsed));
                setHandsPerMonth(next);
              }}
              onBlur={() => {
                const parsed = parseFiniteNumberOrNull(handsPerMonthText);
                if (parsed === null) {
                  setHandsPerMonthText(String(handsPerMonth));
                  return;
                }
                const next = Math.max(0, Math.round(parsed));
                setHandsPerMonth(next);
                setHandsPerMonthText(String(next));
              }}
              step={1000}
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.95rem' }}
            />
            <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', opacity: 0.65 }}>
              Roughly how many hands do you play per month?
            </div>
          </div>

          {/* Right: main probability display */}
          <div style={{ flex: '1 1 380px', minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '2.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}
              >
                {yearProbabilityText}
              </span>
              <span style={{ fontSize: '1.1rem', opacity: 0.7 }}>chance / year</span>
            </div>

            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Over <strong>{handsByTimeframe.year.toLocaleString()}</strong> hands/year, chance of a max drawdown ≥{' '}
              <strong>{formatBuyIns(downswingMagnitudeBB)}</strong> ({downswingMagnitudeBB.toFixed(0)} BB)
              {Number.isFinite(stakes) ? (
                <>
                  {' '}(≈ <strong>{formatDollars(downswingMagnitudeBB * stakes)}</strong>)
                </>
              ) : null}
            </div>

            <div className="progress-bar" style={{ marginTop: '0.75rem', height: '10px' }}>
              <div
                className="progress-bar__fill progress-bar__fill--accent"
                style={{ width: `${Math.min(100, Math.max(0, (timeframeProbs.year ?? 0) * 100))}%` }}
              />
            </div>

            {isLoading ? (
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', opacity: 0.6 }}>
                Estimating {activeTimeframe ?? '…'}… {Math.round(progress * 100)}%
              </div>
            ) : (
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', opacity: 0.6 }}>
                Estimated via {result?.numTrials?.toLocaleString() ?? '—'} simulations (100-hand blocks)
              </div>
            )}

            {error ? (
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--negative)' }}>
                {error}
              </div>
            ) : null}
          </div>
        </div>

        {/* Timeframe boxes: month / quarter / year */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(0,0,0,0.12)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {/* Per Month */}
          <div
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.15)',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 150,
            }}
          >
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.6,
                marginBottom: '0.5rem',
              }}
            >
              Per Month
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 700,
                lineHeight: 1,
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {probabilityTextFor('month')}
            </div>
            <div className="progress-bar" style={{ height: '10px', marginTop: '0.85rem' }}>
              <div
                className="progress-bar__fill progress-bar__fill--accent"
                style={{ width: `${Math.min(100, Math.max(0, (timeframeProbs.month ?? 0) * 100))}%` }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem' }}>
              {handsByTimeframe.month.toLocaleString()} hands
            </div>
          </div>

          {/* Per Quarter */}
          <div
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.15)',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 150,
            }}
          >
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.6,
                marginBottom: '0.5rem',
              }}
            >
              Per Quarter
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 700,
                lineHeight: 1,
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {probabilityTextFor('quarter')}
            </div>
            <div className="progress-bar" style={{ height: '10px', marginTop: '0.85rem' }}>
              <div
                className="progress-bar__fill progress-bar__fill--accent"
                style={{ width: `${Math.min(100, Math.max(0, (timeframeProbs.quarter ?? 0) * 100))}%` }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem' }}>
              {handsByTimeframe.quarter.toLocaleString()} hands
            </div>
          </div>

          {/* Per Year */}
          <div
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.15)',
              padding: '1.15rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 150,
            }}
          >
            <div
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: 0.6,
                marginBottom: '0.5rem',
              }}
            >
              Per Year
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.75rem',
                fontWeight: 700,
                lineHeight: 1,
                flex: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {probabilityTextFor('year')}
            </div>
            <div className="progress-bar" style={{ height: '10px', marginTop: '0.85rem' }}>
              <div
                className="progress-bar__fill progress-bar__fill--accent"
                style={{ width: `${Math.min(100, Math.max(0, (timeframeProbs.year ?? 0) * 100))}%` }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.5rem' }}>
              {handsByTimeframe.year.toLocaleString()} hands
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}



