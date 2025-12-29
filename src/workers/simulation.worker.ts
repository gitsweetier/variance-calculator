/**
 * Web Worker for heavy simulation computations
 * Runs Monte Carlo simulations off the main thread
 */

import {
  CalculatorInputs,
  SimulationResults,
  DownswingProbabilityInputs,
  DownswingProbabilityResult,
  WorkerInput,
  WorkerOutput,
} from '@/lib/types';
import { SIMULATION_PARAMS } from '@/lib/constants';
import {
  createRNG,
  generateRandomSeed,
  generateSamplePaths,
  simulatePath,
  runDownswingAnalysis,
  estimateMaxDrawdownProbability,
} from '@/lib/math/simulation';
import {
  calculateAnalyticalMetrics,
  generateConfidenceData,
  generateMilestoneSummaries,
  roundHands,
} from '@/lib/math/analytics';

// Type assertion for worker context
const ctx: Worker = self as unknown as Worker;

/**
 * Handle incoming messages from the main thread
 */
ctx.onmessage = (event: MessageEvent<WorkerInput>) => {
  const { type, params } = event.data;

  if (type === 'simulate') {
    try {
      const results = runSimulation(params as CalculatorInputs);
      const output: WorkerOutput = {
        type: 'result',
        data: results,
      };
      ctx.postMessage(output);
    } catch (error) {
      const output: WorkerOutput = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      ctx.postMessage(output);
    }
  }

  if (type === 'downswingProbability') {
    try {
      const output: WorkerOutput = {
        type: 'downswingProbabilityResult',
        downswingProbability: runDownswingProbability(params as DownswingProbabilityInputs),
      };
      ctx.postMessage(output);
    } catch (error) {
      const output: WorkerOutput = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      ctx.postMessage(output);
    }
  }
};

/**
 * Run the complete simulation based on inputs
 */
function runSimulation(inputs: CalculatorInputs): SimulationResults {
  const { winrate, stdDev, hands, observedWinrate, seed, mode } = inputs;

  // Get simulation parameters based on mode
  const simParams = SIMULATION_PARAMS[mode];

  // Round hands to nearest step size
  const { rounded: roundedHands } = roundHands(hands);

  // Initialize RNG with seed or generate random
  const actualSeed = seed ?? generateRandomSeed();
  const rng = createRNG(actualSeed);

  // Report initial progress
  sendProgress(0.05);

  // Generate 20 sample paths for the chart
  const samplePaths = generateSamplePaths(
    roundedHands,
    winrate,
    stdDev,
    simParams.numPaths,
    rng,
    simParams.stepSize
  );

  sendProgress(0.2);

  // Generate one detailed high-resolution path
  const detailedRng = createRNG(actualSeed + 1); // Different seed for variety
  const detailedPath = simulatePath(
    roundedHands,
    winrate,
    stdDev,
    detailedRng,
    100 // Always 100-hand resolution for detailed view
  );

  sendProgress(0.3);

  // Run downswing analysis with many trials
  const downswingRng = createRNG(actualSeed + 2);
  const downswingStats = runDownswingAnalysis(
    roundedHands,
    winrate,
    stdDev,
    simParams.downswingTrials,
    downswingRng,
    (progress) => sendProgress(0.3 + progress * 0.5)
  );

  sendProgress(0.85);

  // Calculate analytical metrics
  const analyticalMetrics = calculateAnalyticalMetrics(
    roundedHands,
    winrate,
    stdDev,
    observedWinrate
  );

  // Generate confidence interval data for charting
  const numCIPoints = mode === 'accurate' ? 200 : 100;
  const confidenceData = generateConfidenceData(
    roundedHands,
    winrate,
    stdDev,
    numCIPoints
  );

  // Generate milestone summaries for variance table
  const milestoneSummaries = generateMilestoneSummaries(
    roundedHands,
    winrate,
    stdDev
  );

  sendProgress(1);

  return {
    samplePaths,
    detailedPath,
    downswingStats,
    analyticalMetrics,
    confidenceData,
    milestoneSummaries,
    roundedHands,
  };
}

/**
 * Send progress update to main thread
 */
function sendProgress(progress: number): void {
  const output: WorkerOutput = {
    type: 'progress',
    progress,
  };
  ctx.postMessage(output);
}

function runDownswingProbability(params: DownswingProbabilityInputs): DownswingProbabilityResult {
  const { hands, winrate, stdDev, thresholdBB, seed, mode } = params;

  const selectedMode = (mode ?? 'turbo') as keyof typeof SIMULATION_PARAMS;
  const simParams = SIMULATION_PARAMS[selectedMode];

  const actualSeed = seed ?? generateRandomSeed();
  const rng = createRNG(actualSeed);

  // Use 100-hand blocks to better capture peak-to-trough drawdowns.
  const stepSize = 100;
  const { probability, numTrials } = estimateMaxDrawdownProbability(
    hands,
    winrate,
    stdDev,
    thresholdBB,
    simParams.downswingTrials,
    rng,
    (p) => sendProgress(p),
    stepSize
  );

  return {
    hands,
    thresholdBB,
    probability,
    numTrials,
    stepSize,
  };
}

// Export for type checking (not actually used at runtime)
export {};
