export type TournamentSimulationMode = 'turbo' | 'fast' | 'accurate';

/**
 * User inputs for the tournament variance calculator.
 *
 * Notes:
 * - ROI is defined on total cost (buy-in + fee), i.e. after paying the fee.
 * - 1 "buy-in" unit = the base buy-in amount (excluding fee).
 */
export interface TournamentCalculatorInputs {
  // Tournament structure
  buyIn: number; // $ that goes to prize pool
  fee: number; // $ fee / rake (not in prize pool)
  fieldSize: number; // number of entrants, N
  percentPaid: number; // % of field paid (e.g. 15)

  /**
   * Approximate payout shape input:
   * first prize = topPrizeMultiple * buyIn
   */
  topPrizeMultiple: number;

  // Player skill
  roiPercent: number; // ROI% on total cost (buyIn + fee)

  // Volume / bankroll
  tournaments: number; // T
  bankrollBuyIns: number; // bankroll in buy-ins (base buy-in units)

  // Simulation config
  mode: TournamentSimulationMode;
  seed?: number;
}

export interface TournamentPayoutModel {
  type: 'approxPower';
  fieldSize: number;
  percentPaid: number;
  numPaid: number;
  prizePool: number; // $
  topPrizeTarget: number; // $
  topPrizeActual: number; // $
  alpha: number; // payout curve exponent used
  prizes: number[]; // $ prizes for places 1..numPaid
  warnings: string[];
}

export interface TournamentSkillModel {
  type: 'expFinishBias';
  roiTarget: number; // ROI fraction, e.g. 0.2
  roiAchieved: number;
  beta: number; // finish-bias parameter
  maxRoiFeasible: number;
  warnings: string[];
}

export interface TournamentOutcome {
  label: string; // e.g. "Bust", "1st"
  place?: number; // 1..numPaid for paid outcomes
  prize: number; // $ prize (0 for bust)
  profit: number; // $ net profit after paying (buyIn + fee)
  probability: number; // [0,1]
}

export interface TournamentSingleTournamentStats {
  cost: number; // buyIn + fee
  ev: number; // $ per tournament
  variance: number; // $^2 per tournament
  sd: number; // $ per tournament
  itmProbability: number; // P(prize > 0)
  avgPrizeWhenCashing: number; // E[prize | prize>0]
  avgProfitWhenCashing: number; // E[profit | cash]
}

export interface TournamentConfidencePoint {
  tournaments: number;
  ev: number;
  ci70Lower: number;
  ci70Upper: number;
  ci95Lower: number;
  ci95Upper: number;
}

export interface TournamentSimulationPath {
  tournaments: number[]; // x-axis
  profit: number[]; // cumulative profit ($)
  peaks: number[];
  drawdowns: number[];
  maxDrawdown: number;
  finalProfit: number;
}

export interface TournamentDownswingStats {
  thresholdsBuyIns: number[];
  probabilities: number[]; // P(maxDrawdown >= threshold) in horizon T
  averageMaxDrawdown: number;
  worstMaxDrawdown: number;
}

export interface TournamentBankrollStats {
  bankrollBuyIns: number;
  bankrollDollars: number;
  bustProbability: number; // P(bankroll < cost at any point) in horizon T
  approxInfiniteRor?: number; // optional approximation (normal RW)
  approxBankrollFor1PctRor?: number; // buy-ins (approx)
}

export interface TournamentAggregateStats {
  tournaments: number;
  expectedProfit: number; // $
  sdProfit: number; // $
  normalApproxProbabilityOfProfit: number; // using CLT/normal approximation
  simulatedProbabilityOfProfit: number;
  profitQuantiles: {
    p05: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  roiQuantiles: {
    p05: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
}

export interface TournamentSimulationResults {
  inputs: TournamentCalculatorInputs;
  payoutModel: TournamentPayoutModel;
  skillModel: TournamentSkillModel;

  outcomes: TournamentOutcome[]; // includes "Bust" + 1..numPaid
  perTournament: TournamentSingleTournamentStats;
  confidence: TournamentConfidencePoint[];

  samplePaths: TournamentSimulationPath[];
  detailedPath: TournamentSimulationPath;

  aggregate: TournamentAggregateStats;
  downswing: TournamentDownswingStats;
  bankroll: TournamentBankrollStats;

  numTrials: number;
  seed: number;
}

export type TournamentWorkerInput = { type: 'simulateTournament'; params: TournamentCalculatorInputs };

export type TournamentWorkerOutput =
  | { type: 'progress'; progress: number }
  | { type: 'result'; data: TournamentSimulationResults }
  | { type: 'error'; error: string };


