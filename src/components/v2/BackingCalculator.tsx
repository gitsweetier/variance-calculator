'use client';

import { useMemo, useState, useEffect } from 'react';

interface BackingCalculatorProps {
  winrate: number;
  stdDev: number;
  hands: number;
  stakes: number;
  bankroll: number;
}

interface SimulationResult {
  backerOutcomes: number[];
  playerOutcomes: number[];
  finalMakeups: number[];
  backerEV: number;
  playerEV: number;
  backerProfitProb: number;
  playerProfitProb: number;
  avgMakeup: number;
  makeupProb: number;
  backerRoR: number;
  backerMedian: number;
  playerMedian: number;
}

function formatDollars(dollars: number, showSign = false): string {
  const sign = showSign ? (dollars >= 0 ? '+' : '') : (dollars < 0 ? '-' : '');
  const abs = Math.abs(dollars);
  if (!isFinite(abs)) return '∞';
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatPercent(p: number): string {
  if (p >= 0.9999) return '>99.99%';
  if (p <= 0.0001) return '<0.01%';
  if (p >= 0.99) return `${(p * 100).toFixed(1)}%`;
  return `${(p * 100).toFixed(2)}%`;
}

// Mulberry32 PRNG for reproducible simulations
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal distribution
function normalRandom(rand: () => number): number {
  const u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function runBackingSimulation(
  winrate: number,
  stdDev: number,
  totalHands: number,
  handsPerSession: number,
  sessionsPerChop: number,
  stakes: number,
  backerBankroll: number,
  backerPct: number,
  numSims: number,
  seed: number
): SimulationResult {
  const rand = mulberry32(seed);

  // Convert to per-hand values
  const evPerHand = (winrate / 100) * stakes; // $ per hand
  const sdPerHand = (stdDev / 10) * stakes; // $ per hand (stdDev is per sqrt(100) hands)

  const handsPerChop = handsPerSession * sessionsPerChop;
  const totalSessions = Math.ceil(totalHands / handsPerSession);

  const backerOutcomes: number[] = [];
  const playerOutcomes: number[] = [];
  const finalMakeups: number[] = [];

  for (let sim = 0; sim < numSims; sim++) {
    let cumulativeMakeup = 0; // Resets at each chop if player is profitable
    let periodResult = 0; // Result since last chop (or start)
    let backerTotal = 0;
    let playerTotal = 0;
    let sessionsSinceChop = 0;
    let handsPlayed = 0;

    // Simulate each session
    while (handsPlayed < totalHands) {
      // Calculate hands for this session (may be partial at the end)
      const handsThisSession = Math.min(handsPerSession, totalHands - handsPlayed);

      // Session outcome using normal distribution
      const sessionEV = evPerHand * handsThisSession;
      const sessionSD = sdPerHand * Math.sqrt(handsThisSession);
      const sessionOutcome = sessionEV + normalRandom(rand) * sessionSD;

      // Track period result and backer's running total
      periodResult += sessionOutcome;
      backerTotal += sessionOutcome; // Backer always absorbs the raw result first
      handsPlayed += handsThisSession;
      sessionsSinceChop++;

      // Check if it's time for a profit chop
      if (sessionsSinceChop >= sessionsPerChop && handsPlayed < totalHands) {
        // Time for a chop!
        if (periodResult > 0 && cumulativeMakeup === 0) {
          // Player is profitable and not in makeup - split profits!
          const playerShare = periodResult * (1 - backerPct / 100);
          playerTotal += playerShare;
          // Backer keeps their share (already in backerTotal)
          // But we need to "give back" the player's share from backer
          backerTotal -= playerShare;
        } else if (periodResult > 0 && cumulativeMakeup > 0) {
          // Player is profitable this period but was in makeup
          // First clear makeup, then split remaining
          const clearAmount = Math.min(periodResult, cumulativeMakeup);
          cumulativeMakeup -= clearAmount;
          const remainingProfit = periodResult - clearAmount;

          if (remainingProfit > 0 && cumulativeMakeup === 0) {
            // Cleared makeup and have profit left - split it
            const playerShare = remainingProfit * (1 - backerPct / 100);
            playerTotal += playerShare;
            backerTotal -= playerShare;
          }
        } else if (periodResult < 0) {
          // Lost this period - add to makeup
          cumulativeMakeup += Math.abs(periodResult);
        }

        // Reset for next period
        periodResult = 0;
        sessionsSinceChop = 0;
      }
    }

    // Handle final period (after last chop or if no chops occurred)
    if (periodResult > 0 && cumulativeMakeup === 0) {
      // Final period profitable, not in makeup
      const playerShare = periodResult * (1 - backerPct / 100);
      playerTotal += playerShare;
      backerTotal -= playerShare;
    } else if (periodResult > 0 && cumulativeMakeup > 0) {
      // Final period profitable but in makeup
      const clearAmount = Math.min(periodResult, cumulativeMakeup);
      cumulativeMakeup -= clearAmount;
      const remainingProfit = periodResult - clearAmount;

      if (remainingProfit > 0 && cumulativeMakeup === 0) {
        const playerShare = remainingProfit * (1 - backerPct / 100);
        playerTotal += playerShare;
        backerTotal -= playerShare;
      }
    } else if (periodResult < 0) {
      // Final period was a loss - add to makeup
      cumulativeMakeup += Math.abs(periodResult);
    }

    backerOutcomes.push(backerTotal);
    // Player can never lose money in backing - they can only make $0 (always in makeup)
    playerOutcomes.push(Math.max(0, playerTotal));
    finalMakeups.push(cumulativeMakeup);
  }

  // Calculate statistics
  const backerEV = backerOutcomes.reduce((a, b) => a + b, 0) / numSims;
  const playerEV = playerOutcomes.reduce((a, b) => a + b, 0) / numSims;
  const backerProfitProb = backerOutcomes.filter(x => x > 0).length / numSims;
  const playerProfitProb = playerOutcomes.filter(x => x > 0).length / numSims;
  const avgMakeup = finalMakeups.reduce((a, b) => a + b, 0) / numSims;
  const makeupProb = finalMakeups.filter(x => x > 0).length / numSims;
  const backerRoR = backerOutcomes.filter(x => x <= -backerBankroll).length / numSims;

  // Medians
  const sortedBacker = [...backerOutcomes].sort((a, b) => a - b);
  const sortedPlayer = [...playerOutcomes].sort((a, b) => a - b);
  const backerMedian = sortedBacker[Math.floor(numSims / 2)];
  const playerMedian = sortedPlayer[Math.floor(numSims / 2)];

  return {
    backerOutcomes,
    playerOutcomes,
    finalMakeups,
    backerEV,
    playerEV,
    backerProfitProb,
    playerProfitProb,
    avgMakeup,
    makeupProb,
    backerRoR,
    backerMedian,
    playerMedian,
  };
}

interface HistogramProps {
  data: number[];
  title: string;
  mean: number;
  median: number;
}

function Histogram({ data, title, mean, median }: HistogramProps) {
  const numBins = 50;

  // Track if component has mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { bins, minVal, maxVal, binWidth } = useMemo(() => {
    if (data.length === 0) return { bins: [], minVal: 0, maxVal: 0, binWidth: 0 };

    const sorted = [...data].sort((a, b) => a - b);
    const minV = sorted[0];
    const maxV = sorted[sorted.length - 1];

    // Add small padding, but don't go below 0 if data min is >= 0
    const range = maxV - minV || 1;
    const padding = range * 0.02;
    const actualMin = minV >= 0 ? Math.max(0, minV - padding) : minV - padding;
    const actualMax = maxV + padding;
    const bw = (actualMax - actualMin) / numBins;

    const binCounts = new Array(numBins).fill(0);
    for (const val of data) {
      const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((val - actualMin) / bw)));
      binCounts[binIdx]++;
    }

    return { bins: binCounts, minVal: actualMin, maxVal: actualMax, binWidth: bw };
  }, [data]);

  const maxCount = Math.max(...bins, 1);
  const range = maxVal - minVal || 1;
  // Round to 2 decimal places to avoid hydration mismatch from floating-point differences
  const zeroX = Math.round(((0 - minVal) / range) * 10000) / 100;
  const meanX = Math.round(((mean - minVal) / range) * 10000) / 100;
  const medianX = Math.round(((median - minVal) / range) * 10000) / 100;

  return (
    <div className="block" style={{ padding: '1rem' }}>
      <div className="block-title" style={{ marginBottom: '0.75rem' }}>{title}</div>

      <div style={{ position: 'relative', height: '180px', background: '#f3f4f6', padding: '0.5rem', marginBottom: '0.5rem' }}>
        {/* Axis labels */}
        <div style={{
          position: 'absolute',
          left: '0.5rem',
          top: '0.25rem',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: '#dc2626',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Losses
        </div>
        <div style={{
          position: 'absolute',
          right: '0.5rem',
          top: '0.25rem',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: '#16a34a',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Profits
        </div>

        {/* Bars container */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '0.5rem',
          right: '0.5rem',
          height: 'calc(100% - 40px)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1px'
        }}>
          {bins.map((count, i) => {
            const binCenter = minVal + (i + 0.5) * binWidth;
            const isLoss = binCenter < 0;
            const isBreakeven = binCenter >= 0 && binCenter < binWidth; // First bin when starting at 0
            const height = (count / maxCount) * 100;
            let bgColor = '#16a34a'; // green for profit
            if (isLoss) bgColor = '#dc2626'; // red for loss
            else if (isBreakeven && minVal >= 0) bgColor = '#9ca3af'; // grey for breakeven ($0)
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${height}%`,
                  background: bgColor,
                  opacity: 0.8,
                  minHeight: count > 0 ? '2px' : '0',
                }}
              />
            );
          })}
        </div>

        {/* Zero line - only render after mount to avoid hydration mismatch */}
        {mounted && zeroX > 0 && zeroX < 100 && (
          <div style={{
            position: 'absolute',
            left: `calc(0.5rem + ${zeroX}%)`,
            top: '20px',
            bottom: '20px',
            width: '2px',
            background: '#666',
            zIndex: 1,
          }} />
        )}

        {/* Mean line - only render after mount to avoid hydration mismatch */}
        {mounted && meanX >= 0 && meanX <= 100 && (
          <div style={{
            position: 'absolute',
            left: `calc(0.5rem + ${meanX}%)`,
            top: '20px',
            bottom: '20px',
            width: '3px',
            background: '#2563eb',
            zIndex: 2,
          }} />
        )}

        {/* Median line - only render after mount to avoid hydration mismatch */}
        {mounted && medianX >= 0 && medianX <= 100 && (
          <div style={{
            position: 'absolute',
            left: `calc(0.5rem + ${medianX}%)`,
            top: '20px',
            bottom: '20px',
            width: '3px',
            background: '#9333ea',
            zIndex: 2,
          }} />
        )}

        {/* X-axis labels */}
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '0.5rem',
          fontSize: '0.6rem',
          fontFamily: 'var(--font-mono)',
          opacity: 0.7
        }}>
          {formatDollars(minVal)}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '0.5rem',
          fontSize: '0.6rem',
          fontFamily: 'var(--font-mono)',
          opacity: 0.7
        }}>
          {formatDollars(maxVal)}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#dc2626', marginRight: '4px' }} />Loss</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#9ca3af', marginRight: '4px' }} />Breakeven</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#16a34a', marginRight: '4px' }} />Profit</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '3px', background: '#2563eb', marginRight: '4px' }} />Mean: {formatDollars(mean, true)}</span>
        <span><span style={{ display: 'inline-block', width: '10px', height: '3px', background: '#9333ea', marginRight: '4px' }} />Median: {formatDollars(median, true)}</span>
      </div>
    </div>
  );
}

export function BackingCalculator({ winrate, stdDev, hands, stakes, bankroll }: BackingCalculatorProps) {
  const [backerPct, setBackerPct] = useState(50);
  const [backerPctEditing, setBackerPctEditing] = useState(false);
  const [backerPctDraft, setBackerPctDraft] = useState('50');
  const [handsPerSession, setHandsPerSession] = useState(200);
  const [handsPerSessionText, setHandsPerSessionText] = useState('200');
  const [sessionsPerChop, setSessionsPerChop] = useState(75);
  const [sessionsPerChopText, setSessionsPerChopText] = useState('75');

  // Convert bankroll from BB to dollars
  const backerBankroll = bankroll * stakes;

  // Use sample size from top
  const totalHands = hands;
  const handsPerChop = handsPerSession * sessionsPerChop;
  const numChops = Math.floor(totalHands / handsPerChop);

  const numSims = 10000;

  const seed = useMemo(() => {
    return Math.floor(winrate * 100 + stdDev * 10 + handsPerSession / 100 + sessionsPerChop + backerPct + hands / 1000);
  }, [winrate, stdDev, handsPerSession, sessionsPerChop, backerPct, hands]);

  const result = useMemo(() => {
    return runBackingSimulation(
      winrate,
      stdDev,
      totalHands,
      handsPerSession,
      sessionsPerChop,
      stakes,
      backerBankroll,
      backerPct,
      numSims,
      seed
    );
  }, [winrate, stdDev, totalHands, handsPerSession, sessionsPerChop, stakes, backerBankroll, backerPct, seed]);

  const labelStyle = {
    display: 'block',
    fontSize: '0.625rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '0.5rem',
  };

  return (
    <div className="section-content">
      {/* Info Banner */}
      <div className="block" style={{
        padding: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '2px solid #3b82f6'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Backing Mode</strong> models a backing arrangement where someone else provides your bankroll in exchange for a percentage of your profits. The backer absorbs all losses, while profits are split. When losing, the player goes &quot;in makeup&quot; (owes the backer) which must be cleared before taking profit cuts.
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid-12">
        <div className="block col-4" style={{ padding: '1rem' }}>
          <div className="block-title" style={{ marginBottom: '1rem' }}>Profit Split</div>

          <div>
            <label style={labelStyle}>
              Backer&apos;s Percentage
            </label>
            {backerPctEditing ? (
              <input
                type="number"
                autoFocus
                value={backerPctDraft}
                onChange={(e) => setBackerPctDraft(e.target.value)}
                onBlur={() => {
                  const val = parseInt(backerPctDraft, 10);
                  if (!isNaN(val) && val >= 1 && val <= 99) {
                    setBackerPct(val);
                  }
                  setBackerPctDraft(String(backerPct));
                  setBackerPctEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(backerPctDraft, 10);
                    if (!isNaN(val) && val >= 1 && val <= 99) {
                      setBackerPct(val);
                      setBackerPctDraft(String(val));
                    }
                    setBackerPctEditing(false);
                  } else if (e.key === 'Escape') {
                    setBackerPctDraft(String(backerPct));
                    setBackerPctEditing(false);
                  }
                }}
                min={1}
                max={99}
                style={{ width: '80px', marginBottom: '0.5rem' }}
              />
            ) : (
              <div
                onClick={() => {
                  setBackerPctDraft(String(backerPct));
                  setBackerPctEditing(true);
                }}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                }}
                title="Click to edit"
              >
                {backerPct}%
              </div>
            )}
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={backerPct}
              onChange={(e) => setBackerPct(Number(e.target.value))}
              className="slider"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem' }}>
              <span>Backer: {backerPct}%</span>
              <span>Player: {100 - backerPct}%</span>
            </div>
          </div>
        </div>

        <div className="block col-4" style={{ padding: '1rem' }}>
          <div className="block-title" style={{ marginBottom: '1rem' }}>Session Structure</div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>
              Hands per Session
            </label>
            <input
              type="number"
              value={handsPerSessionText}
              onChange={(e) => {
                setHandsPerSessionText(e.target.value);
                const val = Number(e.target.value);
                if (isFinite(val) && val > 0) setHandsPerSession(Math.round(val));
              }}
              onBlur={() => setHandsPerSessionText(String(handsPerSession))}
              step={100}
              min={100}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Sessions per Chop
            </label>
            <input
              type="number"
              value={sessionsPerChopText}
              onChange={(e) => {
                setSessionsPerChopText(e.target.value);
                const val = Number(e.target.value);
                if (isFinite(val) && val > 0) setSessionsPerChop(Math.round(val));
              }}
              onBlur={() => setSessionsPerChopText(String(sessionsPerChop))}
              step={1}
              min={1}
              max={365}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="block col-4" style={{ padding: '1rem' }}>
          <div className="block-title" style={{ marginBottom: '1rem' }}>Summary</div>
          <div style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
            <div><strong>Total Hands:</strong> {totalHands.toLocaleString()} <span style={{ opacity: 0.6 }}>(from Sample Size)</span></div>
            <div><strong>Hands per Chop:</strong> {handsPerChop.toLocaleString()}</div>
            <div><strong>Number of Chops:</strong> {numChops}</div>
            <div><strong>Backer&apos;s Bankroll:</strong> {formatDollars(backerBankroll)}</div>
            <div><strong>Expected Total EV:</strong> {formatDollars((winrate / 100) * totalHands * stakes, true)}</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid-12">
        {/* Backer Statistics */}
        <div className="block col-4" style={{ padding: '1rem' }}>
          <div className="block-title" style={{ marginBottom: '0.75rem', color: '#dc2626' }}>
            Backer Statistics
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
              Expected Value
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: result.backerEV >= 0 ? '#16a34a' : '#dc2626'
            }}>
              {formatDollars(result.backerEV, true)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
              Profit Probability
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatPercent(result.backerProfitProb)}
            </div>
          </div>
        </div>

        {/* Player Statistics */}
        <div className="block col-4" style={{ padding: '1rem' }}>
          <div className="block-title" style={{ marginBottom: '0.75rem', color: '#16a34a' }}>
            Player Statistics
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
              Expected Value
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: result.playerEV >= 0 ? '#16a34a' : '#dc2626'
            }}>
              {formatDollars(result.playerEV, true)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
              Profit Probability
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatPercent(result.playerProfitProb)}
            </div>
          </div>
        </div>

        {/* Makeup Statistics */}
        <div className="block col-4" style={{ padding: '1rem' }}>
          <div className="block-title" style={{ marginBottom: '0.75rem', color: '#f59e0b' }}>
            Makeup Statistics
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
              Avg Final Makeup
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
            }}>
              {formatDollars(result.avgMakeup)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7 }}>
              Probability of Makeup
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatPercent(result.makeupProb)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk of Ruin */}
      <div className="block" style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.05)', border: '2px solid #dc2626' }}>
        <div className="block-title" style={{ marginBottom: '0.5rem' }}>Backer&apos;s Risk of Ruin</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: result.backerRoR > 0.1 ? '#dc2626' : result.backerRoR > 0.01 ? '#f59e0b' : '#16a34a'
          }}>
            {formatPercent(result.backerRoR)}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
          Probability of the backer losing their entire {formatDollars(backerBankroll)} bankroll over {totalHands.toLocaleString()} hands.
        </div>
      </div>

      {/* Histograms */}
      <div className="grid-12">
        <div className="col-6">
          <Histogram
            data={result.backerOutcomes}
            title="Backer's Profit/Loss Distribution"
            mean={result.backerEV}
            median={result.backerMedian}
          />
        </div>
        <div className="col-6">
          <Histogram
            data={result.playerOutcomes}
            title="Player's Profit/Loss Distribution"
            mean={result.playerEV}
            median={result.playerMedian}
          />
        </div>
      </div>

      {/* Explanation */}
      <div style={{ fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.5, marginTop: '0.5rem' }}>
        The histograms show possible profit and loss outcomes across {numSims.toLocaleString()} simulations. Red areas represent losses, green areas represent profits. Blue line = mean (average) outcome, Purple line = median outcome.
      </div>

      {/* Key Insight */}
      <div className="block" style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '2px solid #f59e0b' }}>
        <div className="block-title" style={{ marginBottom: '0.5rem' }}>Key Insight</div>
        <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
          Backing arrangements shift risk. Even with a winning player, the backer often has lower EV because:
          <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0 }}>
            <li>They absorb 100% of downswings</li>
            <li>They only get a percentage of upswings</li>
            <li>The player&apos;s EV is always non-negative (they can&apos;t lose money, only time)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
