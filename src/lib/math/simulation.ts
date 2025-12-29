/**
 * Simulation functions for Monte Carlo variance analysis
 */

import { SimulationPath, DownswingStats } from '../types';
import { DOWNSWING_THRESHOLDS } from '../constants';

/**
 * Mulberry32 - Fast, seedable 32-bit PRNG
 * Suitable for Monte Carlo simulations with reproducibility
 *
 * @param seed - Integer seed value
 * @returns Function that generates random numbers in [0, 1)
 */
export function createRNG(seed: number): () => number {
  let state = seed >>> 0; // Ensure unsigned 32-bit

  return function(): number {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate a random seed from Math.random()
 * @returns A random 32-bit integer seed
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}

/**
 * Box-Muller transform for generating normal random variates
 * Uses the basic form, not the polar method, for simplicity
 *
 * @param rng - Random number generator function
 * @param mean - Mean of the distribution
 * @param stdDev - Standard deviation of the distribution
 * @returns A normally distributed random number
 */
export function normalRandom(rng: () => number, mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = rng();
  const u2 = rng();

  // Avoid log(0)
  const safeU1 = u1 === 0 ? Number.MIN_VALUE : u1;

  const z = Math.sqrt(-2 * Math.log(safeU1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

/**
 * Simulate a single path of cumulative winnings
 *
 * @param totalHands - Total number of hands to simulate
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param rng - Seeded random number generator
 * @param stepSize - Hands per block (100 for accurate, 500 for fast)
 * @returns SimulationPath with all data points
 */
export function simulatePath(
  totalHands: number,
  winrate: number,
  stdDev: number,
  rng: () => number,
  stepSize: number = 100
): SimulationPath {
  // Round totalHands to nearest stepSize
  const numSteps = Math.ceil(totalHands / stepSize);
  const actualHands = numSteps * stepSize;

  // Scale mean and stdDev for block size
  // For a block of B hands: mean = wr * B/100, sd = sd_per_100 * sqrt(B/100)
  const blockMean = winrate * (stepSize / 100);
  const blockStdDev = stdDev * Math.sqrt(stepSize / 100);

  const hands: number[] = [0];
  const winnings: number[] = [0];
  const drawdowns: number[] = [0];
  const peaks: number[] = [0];

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (let i = 1; i <= numSteps; i++) {
    // Generate block result
    const blockResult = normalRandom(rng, blockMean, blockStdDev);
    cumulative += blockResult;

    // Track peak and drawdown
    if (cumulative > peak) {
      peak = cumulative;
    }
    const currentDrawdown = peak - cumulative;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    hands.push(i * stepSize);
    winnings.push(cumulative);
    peaks.push(peak);
    drawdowns.push(currentDrawdown);
  }

  return {
    hands,
    winnings,
    drawdowns,
    peaks,
    maxDrawdown,
    finalWinnings: cumulative,
  };
}

/**
 * Run multiple simulations for downswing analysis
 *
 * @param totalHands - Number of hands per simulation
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param numTrials - Number of simulations to run
 * @param rng - Seeded random number generator
 * @param progressCallback - Optional callback for progress updates
 * @returns DownswingStats with probability and count data
 */
export function runDownswingAnalysis(
  totalHands: number,
  winrate: number,
  stdDev: number,
  numTrials: number,
  rng: () => number,
  progressCallback?: (progress: number) => void
): DownswingStats {
  const maxDrawdowns: number[] = [];
  const recoveryHands: number[] = [];
  const downswingCounts: Map<number, number[]> = new Map();

  // Initialize downswing counts for each threshold
  for (const threshold of DOWNSWING_THRESHOLDS) {
    downswingCounts.set(threshold, []);
  }

  const stepSize = 100; // Use 100-hand blocks for downswing analysis
  const numSteps = Math.ceil(totalHands / stepSize);

  const blockMean = winrate * (stepSize / 100);
  const blockStdDev = stdDev * Math.sqrt(stepSize / 100);

  for (let trial = 0; trial < numTrials; trial++) {
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;
    let inDownswing = false;
    let downswingStart = 0;
    let longestRecovery = 0;

    // Count downswings exceeding each threshold in this trial
    const trialDownswingCounts: Map<number, number> = new Map();
    const downswingExceeded: Set<number> = new Set();

    for (const threshold of DOWNSWING_THRESHOLDS) {
      trialDownswingCounts.set(threshold, 0);
    }

    for (let step = 0; step < numSteps; step++) {
      const blockResult = normalRandom(rng, blockMean, blockStdDev);
      cumulative += blockResult;

      // Track peak and drawdown
      if (cumulative > peak) {
        peak = cumulative;

        // End of downswing
        if (inDownswing) {
          const recoveryLength = (step * stepSize) - downswingStart;
          recoveryHands.push(recoveryLength);
          if (recoveryLength > longestRecovery) {
            longestRecovery = recoveryLength;
          }
          inDownswing = false;
          downswingExceeded.clear();
        }
      }

      const currentDrawdown = peak - cumulative;

      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
      }

      // Start of downswing
      if (currentDrawdown > 0 && !inDownswing) {
        inDownswing = true;
        downswingStart = step * stepSize;
      }

      // Count threshold crossings (only once per downswing)
      for (const threshold of DOWNSWING_THRESHOLDS) {
        if (currentDrawdown >= threshold && !downswingExceeded.has(threshold)) {
          downswingExceeded.add(threshold);
          trialDownswingCounts.set(threshold, (trialDownswingCounts.get(threshold) || 0) + 1);
        }
      }
    }

    // Store results for this trial
    maxDrawdowns.push(maxDrawdown);

    for (const threshold of DOWNSWING_THRESHOLDS) {
      downswingCounts.get(threshold)!.push(trialDownswingCounts.get(threshold) || 0);
    }

    // Progress callback every 1%
    if (progressCallback && trial % Math.max(1, Math.floor(numTrials / 100)) === 0) {
      progressCallback(trial / numTrials);
    }
  }

  // Calculate probabilities and expected counts
  const probabilities: { threshold: number; probability: number }[] = [];
  const expectedCounts: { threshold: number; count: number }[] = [];

  for (const threshold of DOWNSWING_THRESHOLDS) {
    const counts = downswingCounts.get(threshold)!;
    const numExperienced = counts.filter(c => c > 0).length;
    const probability = numExperienced / numTrials;
    const avgCount = counts.reduce((a, b) => a + b, 0) / numTrials;

    probabilities.push({ threshold, probability });
    expectedCounts.push({ threshold, count: avgCount });
  }

  // Calculate aggregate stats
  // Note: Using reduce instead of Math.max(...arr) to avoid stack overflow with large arrays
  const averageMaxDrawdown = maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length;
  const worstMaxDrawdown = maxDrawdowns.reduce((max, val) => val > max ? val : max, -Infinity);
  const averageRecoveryHands = recoveryHands.length > 0
    ? recoveryHands.reduce((a, b) => a + b, 0) / recoveryHands.length
    : 0;
  const longestRecovery = recoveryHands.length > 0
    ? recoveryHands.reduce((max, val) => val > max ? val : max, 0)
    : 0;

  return {
    probabilities,
    expectedCounts,
    averageMaxDrawdown,
    worstMaxDrawdown,
    averageRecoveryHands,
    longestRecovery,
  };
}

/**
 * Estimate the probability of experiencing a maximum drawdown of at least `thresholdBB`
 * within a finite horizon (`totalHands`).
 *
 * Drawdown is defined as peak-to-trough decline of cumulative winnings, i.e. max(peak - cumulative).
 *
 * This is computed via Monte Carlo simulation (seeded RNG passed in).
 */
export function estimateMaxDrawdownProbability(
  totalHands: number,
  winrate: number,
  stdDev: number,
  thresholdBB: number,
  numTrials: number,
  rng: () => number,
  progressCallback?: (progress: number) => void,
  stepSize: number = 100
): { probability: number; numTrials: number; stepSize: number } {
  if (numTrials <= 0) return { probability: 0, numTrials: 0, stepSize };
  if (totalHands <= 0) return { probability: 0, numTrials, stepSize };
  if (thresholdBB <= 0) return { probability: 1, numTrials, stepSize };

  const numSteps = Math.ceil(totalHands / stepSize);
  const blockMean = winrate * (stepSize / 100);
  const blockStdDev = stdDev * Math.sqrt(stepSize / 100);

  let exceededCount = 0;

  for (let trial = 0; trial < numTrials; trial++) {
    let cumulative = 0;
    let peak = 0;
    let exceeded = false;

    for (let step = 0; step < numSteps; step++) {
      const blockResult = normalRandom(rng, blockMean, blockStdDev);
      cumulative += blockResult;

      if (cumulative > peak) peak = cumulative;

      const currentDrawdown = peak - cumulative;
      if (currentDrawdown >= thresholdBB) {
        exceeded = true;
        break; // Early exit: we only care about whether the threshold is hit
      }
    }

    if (exceeded) exceededCount++;

    // Progress callback every ~1%
    if (progressCallback && trial % Math.max(1, Math.floor(numTrials / 100)) === 0) {
      progressCallback(trial / numTrials);
    }
  }

  if (progressCallback) progressCallback(1);

  return {
    probability: exceededCount / numTrials,
    numTrials,
    stepSize,
  };
}

/**
 * Generate multiple sample paths for charting
 */
export function generateSamplePaths(
  totalHands: number,
  winrate: number,
  stdDev: number,
  numPaths: number,
  rng: () => number,
  stepSize: number = 100
): SimulationPath[] {
  const paths: SimulationPath[] = [];

  for (let i = 0; i < numPaths; i++) {
    paths.push(simulatePath(totalHands, winrate, stdDev, rng, stepSize));
  }

  return paths;
}
