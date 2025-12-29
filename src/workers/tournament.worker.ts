/**
 * Web Worker for tournament variance computations (discrete, heavy-tailed outcomes).
 */

import {
  TournamentCalculatorInputs,
  TournamentSimulationResults,
  TournamentSimulationPath,
  TournamentWorkerInput,
  TournamentWorkerOutput,
} from '@/lib/tournament/types';
import { buildTournamentModel, generateTournamentConfidenceData } from '@/lib/tournament/model';
import {
  normalApproxProbabilityOfProfit,
  runTournamentMonteCarlo,
  summarizeFinalProfitDistribution,
  simulateTournamentPath,
} from '@/lib/tournament/simulation';
import { createRNG, generateRandomSeed } from '@/lib/math/simulation';

const ctx: Worker = self as unknown as Worker;

const TOURNAMENT_SIM_PARAMS = {
  turbo: { numPaths: 12, numTrials: 5000 },
  fast: { numPaths: 20, numTrials: 20000 },
  accurate: { numPaths: 20, numTrials: 50000 },
} as const;

const DEFAULT_DOWNSWING_THRESHOLDS_BUYINS = [20, 30, 50, 75, 100, 150, 200];

ctx.onmessage = (event: MessageEvent<TournamentWorkerInput>) => {
  const { type, params } = event.data;
  if (type !== 'simulateTournament') return;

  try {
    const results = runTournamentSimulation(params);
    const output: TournamentWorkerOutput = { type: 'result', data: results };
    ctx.postMessage(output);
  } catch (error) {
    const output: TournamentWorkerOutput = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    ctx.postMessage(output);
  }
};

function sendProgress(progress: number) {
  const output: TournamentWorkerOutput = { type: 'progress', progress };
  ctx.postMessage(output);
}

function validateInputs(inputs: TournamentCalculatorInputs) {
  if (!Number.isFinite(inputs.buyIn) || inputs.buyIn <= 0) {
    throw new Error('Buy-in must be a positive number.');
  }
  if (!Number.isFinite(inputs.fee) || inputs.fee < 0) {
    throw new Error('Fee must be a non-negative number.');
  }
  if (!Number.isFinite(inputs.fieldSize) || inputs.fieldSize < 2) {
    throw new Error('Field size must be at least 2.');
  }
  if (!Number.isFinite(inputs.percentPaid) || inputs.percentPaid <= 0 || inputs.percentPaid > 100) {
    throw new Error('Percent paid must be between 0 and 100.');
  }
  if (!Number.isFinite(inputs.topPrizeMultiple) || inputs.topPrizeMultiple <= 0) {
    throw new Error('Top prize multiple must be positive.');
  }
  if (!Number.isFinite(inputs.roiPercent)) {
    throw new Error('ROI must be a valid number.');
  }
  if (!Number.isFinite(inputs.tournaments) || inputs.tournaments < 0) {
    throw new Error('Tournaments must be 0 or greater.');
  }
  if (!Number.isFinite(inputs.bankrollBuyIns) || inputs.bankrollBuyIns < 0) {
    throw new Error('Bankroll (buy-ins) must be 0 or greater.');
  }
  if (inputs.mode !== 'turbo' && inputs.mode !== 'fast' && inputs.mode !== 'accurate') {
    throw new Error('Invalid mode.');
  }
  if (inputs.seed !== undefined && (!Number.isFinite(inputs.seed) || inputs.seed <= 0)) {
    throw new Error('Seed must be a positive integer.');
  }
}

function runTournamentSimulation(inputs: TournamentCalculatorInputs): TournamentSimulationResults {
  validateInputs(inputs);

  const simParams = TOURNAMENT_SIM_PARAMS[inputs.mode];

  const actualSeed = inputs.seed ?? generateRandomSeed();

  const normalizedInputs: TournamentCalculatorInputs = {
    ...inputs,
    fieldSize: Math.floor(inputs.fieldSize),
    tournaments: Math.floor(inputs.tournaments),
    bankrollBuyIns: inputs.bankrollBuyIns,
    seed: actualSeed,
  };

  // 1) Build payout + skill + single-tournament distribution
  const { payoutModel, skillModel, outcomes, perTournament } = buildTournamentModel(normalizedInputs);
  sendProgress(0.08);

  // 2) Confidence band points (normal approximation over T tournaments)
  const confidence = generateTournamentConfidenceData({
    tournaments: normalizedInputs.tournaments,
    evPerTournament: perTournament.ev,
    sdPerTournament: perTournament.sd,
    numPoints: normalizedInputs.mode === 'accurate' ? 240 : 160,
  });
  sendProgress(0.14);

  // 3) Sample paths for charts
  const samplePaths: TournamentSimulationPath[] = [];
  for (let i = 0; i < simParams.numPaths; i++) {
    const rng = createRNG(actualSeed + 10 + i * 997);
    samplePaths.push(
      simulateTournamentPath({
        tournaments: normalizedInputs.tournaments,
        outcomes,
        rng,
        recordEvery: Math.max(1, Math.floor(normalizedInputs.tournaments / 220)),
      })
    );
  }

  const detailedRng = createRNG(actualSeed + 99991);
  const detailedPath = simulateTournamentPath({
    tournaments: normalizedInputs.tournaments,
    outcomes,
    rng: detailedRng,
    recordEvery: 1,
  });

  sendProgress(0.24);

  // 4) Monte Carlo distribution + drawdown + bust probability
  const bankrollDollars = normalizedInputs.bankrollBuyIns * normalizedInputs.buyIn;
  const costDollars = perTournament.cost;

  const mcRng = createRNG(actualSeed + 2222);

  const mc = runTournamentMonteCarlo({
    tournaments: normalizedInputs.tournaments,
    outcomes,
    numTrials: simParams.numTrials,
    bankrollDollars,
    costDollars,
    buyInDollars: normalizedInputs.buyIn,
    downswingThresholdsBuyIns: DEFAULT_DOWNSWING_THRESHOLDS_BUYINS,
    rng: mcRng,
    progress: (p) => sendProgress(0.24 + p * 0.68),
  });

  const summary = summarizeFinalProfitDistribution({
    finalProfits: mc.finalProfits,
    totalCost: perTournament.cost,
    tournaments: normalizedInputs.tournaments,
  });

  // 5) Aggregate stats (normal approx + simulated)
  const expectedProfit = normalizedInputs.tournaments * perTournament.ev;
  const sdProfit = Math.sqrt(Math.max(0, normalizedInputs.tournaments)) * perTournament.sd;

  const normalPProfit = normalApproxProbabilityOfProfit({ mean: expectedProfit, sd: sdProfit });

  // 6) Risk-of-ruin approximations (Brownian drift approximation on per-tournament increments)
  // RoR ≈ exp(-2 μ B / σ²) for μ>0.
  let approxInfiniteRor: number | undefined = undefined;
  let approxBankrollFor1PctRor: number | undefined = undefined; // buy-ins

  if (perTournament.ev > 0 && perTournament.variance > 0 && bankrollDollars > 0) {
    const ror = Math.exp((-2 * perTournament.ev * bankrollDollars) / perTournament.variance);
    approxInfiniteRor = Math.min(1, Math.max(0, ror));

    const target = 0.01;
    const bankrollTargetDollars =
      (-perTournament.variance * Math.log(target)) / (2 * perTournament.ev);
    approxBankrollFor1PctRor = bankrollTargetDollars / normalizedInputs.buyIn;
  } else if (perTournament.ev <= 0) {
    approxInfiniteRor = 1;
  }

  sendProgress(1);

  return {
    inputs: normalizedInputs,
    payoutModel,
    skillModel,
    outcomes,
    perTournament,
    confidence,
    samplePaths,
    detailedPath,
    aggregate: {
      tournaments: normalizedInputs.tournaments,
      expectedProfit,
      sdProfit,
      normalApproxProbabilityOfProfit: normalPProfit,
      simulatedProbabilityOfProfit: mc.simulatedProbabilityOfProfit,
      profitQuantiles: summary.profitQuantiles,
      roiQuantiles: summary.roiQuantiles,
    },
    downswing: mc.downswing,
    bankroll: {
      bankrollBuyIns: normalizedInputs.bankrollBuyIns,
      bankrollDollars,
      bustProbability: mc.bustProbability,
      approxInfiniteRor,
      approxBankrollFor1PctRor,
    },
    numTrials: simParams.numTrials,
    seed: actualSeed,
  };
}

// Export for type checking only.
export {};


