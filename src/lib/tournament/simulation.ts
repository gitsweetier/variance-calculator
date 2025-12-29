import { normalCDF } from '@/lib/math/statistics';
import {
  TournamentDownswingStats,
  TournamentOutcome,
  TournamentSimulationPath,
} from './types';

function buildCdf(outcomes: TournamentOutcome[]): { profits: number[]; cdf: number[] } {
  const profits: number[] = [];
  const cdf: number[] = [];

  let cumulative = 0;
  for (const o of outcomes) {
    const p = Math.max(0, o.probability);
    cumulative += p;
    profits.push(o.profit);
    cdf.push(cumulative);
  }

  // Normalize if needed
  if (cumulative > 0 && Math.abs(cumulative - 1) > 1e-9) {
    for (let i = 0; i < cdf.length; i++) {
      cdf[i] /= cumulative;
    }
  }

  // Ensure last value is exactly 1 for sampling safety.
  if (cdf.length > 0) cdf[cdf.length - 1] = 1;

  return { profits, cdf };
}

function sampleIndexFromCdf(cdf: number[], u: number): number {
  // Binary search first index with cdf[idx] >= u
  let lo = 0;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (u <= cdf[mid]) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function simulateTournamentPath(params: {
  tournaments: number;
  outcomes: TournamentOutcome[];
  rng: () => number;
  recordEvery?: number; // record every K tournaments (default auto)
}): TournamentSimulationPath {
  const total = Math.max(0, Math.floor(params.tournaments));
  const { profits, cdf } = buildCdf(params.outcomes);

  const recordEvery =
    typeof params.recordEvery === 'number' && params.recordEvery >= 1
      ? Math.floor(params.recordEvery)
      : Math.max(1, Math.floor(total / 220));

  const tournaments: number[] = [0];
  const profit: number[] = [0];
  const peaks: number[] = [0];
  const drawdowns: number[] = [0];

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (let t = 1; t <= total; t++) {
    const u = params.rng();
    const idx = sampleIndexFromCdf(cdf, u);
    cumulative += profits[idx] ?? 0;

    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDrawdown) maxDrawdown = dd;

    if (t === total || t % recordEvery === 0) {
      tournaments.push(t);
      profit.push(cumulative);
      peaks.push(peak);
      drawdowns.push(dd);
    }
  }

  // Ensure last point exists
  if (tournaments[tournaments.length - 1] !== total) {
    tournaments.push(total);
    profit.push(cumulative);
    peaks.push(peak);
    drawdowns.push(peak - cumulative);
  }

  return {
    tournaments,
    profit,
    peaks,
    drawdowns,
    maxDrawdown,
    finalProfit: cumulative,
  };
}

function quantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const clamped = Math.min(1, Math.max(0, p));
  const idx = (sorted.length - 1) * clamped;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? 0;
  const w = idx - lo;
  const a = sorted[lo] ?? 0;
  const b = sorted[hi] ?? 0;
  return a + (b - a) * w;
}

export function normalApproxProbabilityOfProfit(params: { mean: number; sd: number }): number {
  if (params.sd <= 0) return params.mean > 0 ? 1 : params.mean < 0 ? 0 : 0.5;
  const z = (0 - params.mean) / params.sd;
  return 1 - normalCDF(z);
}

export function runTournamentMonteCarlo(params: {
  tournaments: number;
  outcomes: TournamentOutcome[];
  numTrials: number;
  bankrollDollars: number;
  costDollars: number;
  buyInDollars: number;
  downswingThresholdsBuyIns: number[];
  rng: () => number;
  progress?: (p: number) => void;
}): {
  finalProfits: number[];
  simulatedProbabilityOfProfit: number;
  downswing: TournamentDownswingStats;
  bustProbability: number;
} {
  const total = Math.max(0, Math.floor(params.tournaments));
  const numTrials = Math.max(0, Math.floor(params.numTrials));

  const { profits, cdf } = buildCdf(params.outcomes);

  const finalProfits: number[] = new Array(numTrials);
  const maxDrawdowns: number[] = new Array(numTrials);

  const thresholdsBuyIns = params.downswingThresholdsBuyIns
    .map((x) => Math.max(0, x))
    .filter((x) => x > 0)
    .sort((a, b) => a - b);

  const thresholdsDollars = thresholdsBuyIns.map((b) => b * params.buyInDollars);
  const exceededCounts = new Array(thresholdsDollars.length).fill(0) as number[];

  let profitCount = 0;
  let bustCount = 0;

  for (let trial = 0; trial < numTrials; trial++) {
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;

    // Bankroll path (finite horizon bust probability)
    let bankroll = params.bankrollDollars;
    let busted = bankroll < params.costDollars;

    for (let t = 1; t <= total; t++) {
      const u = params.rng();
      const idx = sampleIndexFromCdf(cdf, u);
      const delta = profits[idx] ?? 0;

      cumulative += delta;
      if (cumulative > peak) peak = cumulative;
      const dd = peak - cumulative;
      if (dd > maxDrawdown) maxDrawdown = dd;

      // Bust check: you can only enter if bankroll >= cost at start of tournament.
      // Once busted, you stop playing (absorbing); but we still keep sampling for the "always play T" profit distribution.
      if (!busted) {
        if (bankroll < params.costDollars) {
          busted = true;
        } else {
          bankroll += delta;
          if (bankroll < params.costDollars) busted = true;
        }
      }
    }

    finalProfits[trial] = cumulative;
    maxDrawdowns[trial] = maxDrawdown;

    if (cumulative > 0) profitCount++;
    if (busted) bustCount++;

    // threshold crossings
    for (let i = 0; i < thresholdsDollars.length; i++) {
      if (maxDrawdown >= thresholdsDollars[i]!) exceededCounts[i] += 1;
    }

    if (params.progress && trial % Math.max(1, Math.floor(numTrials / 100)) === 0) {
      params.progress(trial / numTrials);
    }
  }

  if (params.progress) params.progress(1);

  const probabilities = exceededCounts.map((c) => (numTrials > 0 ? c / numTrials : 0));
  const averageMaxDrawdown =
    numTrials > 0 ? maxDrawdowns.reduce((a, b) => a + b, 0) / numTrials : 0;
  const worstMaxDrawdown =
    numTrials > 0 ? maxDrawdowns.reduce((m, v) => (v > m ? v : m), -Infinity) : 0;

  const downswing: TournamentDownswingStats = {
    thresholdsBuyIns,
    probabilities,
    averageMaxDrawdown,
    worstMaxDrawdown,
  };

  return {
    finalProfits,
    simulatedProbabilityOfProfit: numTrials > 0 ? profitCount / numTrials : 0,
    downswing,
    bustProbability: numTrials > 0 ? bustCount / numTrials : 0,
  };
}

export function summarizeFinalProfitDistribution(params: {
  finalProfits: number[];
  totalCost: number;
  tournaments: number;
}): {
  profitQuantiles: { p05: number; p25: number; p50: number; p75: number; p95: number };
  roiQuantiles: { p05: number; p25: number; p50: number; p75: number; p95: number };
} {
  const sorted = params.finalProfits.slice().sort((a, b) => a - b);

  const p05 = quantile(sorted, 0.05);
  const p25 = quantile(sorted, 0.25);
  const p50 = quantile(sorted, 0.5);
  const p75 = quantile(sorted, 0.75);
  const p95 = quantile(sorted, 0.95);

  const denom = Math.max(1e-12, params.tournaments * params.totalCost);
  const roi = (x: number) => x / denom;

  return {
    profitQuantiles: { p05, p25, p50, p75, p95 },
    roiQuantiles: {
      p05: roi(p05),
      p25: roi(p25),
      p50: roi(p50),
      p75: roi(p75),
      p95: roi(p95),
    },
  };
}


