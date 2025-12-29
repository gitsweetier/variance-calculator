// Input parameters for the variance calculator
export interface CalculatorInputs {
  winrate: number;           // BB/100
  stdDev: number;            // BB/100
  hands: number;             // Total hands to simulate
  observedWinrate?: number;  // Optional observed winrate (BB/100)
  seed?: number;             // Optional random seed for reproducibility
  mode: 'turbo' | 'fast' | 'accurate'; // Computation mode
  bigBlindSize?: number;     // Optional: for $ conversion (e.g., 2 for $1/$2)
}

// Result of a single simulation path
export interface SimulationPath {
  hands: number[];           // x-axis values (hand counts)
  winnings: number[];        // Cumulative winnings in BB
  drawdowns: number[];       // Current drawdown from peak at each point
  peaks: number[];           // Peak winnings at each point
  maxDrawdown: number;       // Worst drawdown encountered
  finalWinnings: number;     // Final cumulative winnings
}

// Analytical metrics calculated from inputs
export interface AnalyticalMetrics {
  expectedWinnings: number;       // EV in BB
  standardDeviation: number;      // SD of total winnings
  standardError: number;          // SE of winrate estimate
  probabilityOfLoss: number;      // P(total < 0)
  probabilityAboveObserved?: number;  // P(run >= observed)
  probabilityBelowObserved?: number;  // P(run < observed)
  confidenceInterval70: { lower: number; upper: number };
  confidenceInterval95: { lower: number; upper: number };
  minimumBankroll5Percent: number;    // Bankroll for <5% RoR
}

// Confidence interval data point for charting
export interface ConfidencePoint {
  hands: number;
  ev: number;
  ci70Lower: number;
  ci70Upper: number;
  ci95Lower: number;
  ci95Upper: number;
}

// Downswing statistics from large simulation
export interface DownswingStats {
  // Probability of experiencing downswing of at least X BB
  probabilities: { threshold: number; probability: number }[];
  // Expected number of downswings of each size
  expectedCounts: { threshold: number; count: number }[];
  // Average and max downswing across all trials
  averageMaxDrawdown: number;
  worstMaxDrawdown: number;
  // Recovery statistics
  averageRecoveryHands: number;
  longestRecovery: number;
}

// Variance summary at different hand milestones
export interface MilestoneSummary {
  hands: number;
  expectedValue: number;
  standardDeviation: number;
  ci95Lower: number;
  ci95Upper: number;
  probabilityOfProfit: number;
  requiredBankroll: number;
}

// Complete simulation results
export interface SimulationResults {
  samplePaths: SimulationPath[];      // 20 sample paths for chart
  detailedPath: SimulationPath;       // High-resolution single path
  downswingStats: DownswingStats;     // From large simulation
  analyticalMetrics: AnalyticalMetrics;
  confidenceData: ConfidencePoint[];  // For charting CI bands
  milestoneSummaries: MilestoneSummary[]; // Variance table data
  roundedHands: number;               // Actual hands simulated (rounded)
}

// Worker message types
export interface DownswingProbabilityInputs {
  hands: number;          // Finite horizon (e.g., annual hands)
  winrate: number;        // BB/100
  stdDev: number;         // BB/100
  thresholdBB: number;    // Max drawdown threshold in BB (peak-to-trough)
  mode?: CalculatorInputs['mode']; // Controls trial count defaults
  seed?: number;          // Optional seed for reproducibility
}

export interface DownswingProbabilityResult {
  hands: number;
  thresholdBB: number;
  probability: number; // P(max drawdown >= threshold) within `hands`
  numTrials: number;
  stepSize: number;
}

export type WorkerInput =
  | { type: 'simulate'; params: CalculatorInputs }
  | { type: 'downswingProbability'; params: DownswingProbabilityInputs };

export interface WorkerOutput {
  type: 'result' | 'error' | 'progress' | 'downswingProbabilityResult';
  data?: SimulationResults;
  downswingProbability?: DownswingProbabilityResult;
  error?: string;
  progress?: number;
}

// Preset configuration
export interface GamePreset {
  name: string;
  stdDev: number;
  range: [number, number];
  tooltip: string;
}

// =============================================================================
// ALTERNATIVE SCENARIOS TYPES
// =============================================================================

export interface Scenario {
  id: string;
  name: string;
  description: string;
  winrate: number;      // BB/100
  stakes: number;       // $ per BB
  isBase: boolean;      // true for "Current" scenario
}

export interface ScenarioMetrics {
  scenario: Scenario;
  expectedValueBB: number;
  expectedValueDollars: number;
  probabilityOfProfit: number;
  ci95Lower: number;
  ci95Upper: number;
  riskOfRuin: number;
  recommendedBankrollBB: number;
  recommendedBankrollDollars: number;
  hourlyRateDollars: number;  // EV/hour assuming 500 hands/hour
}

export interface ScenarioComparison {
  scenarios: ScenarioMetrics[];
  baseScenario: ScenarioMetrics;
  hands: number;
  bankroll: number;
}

// =============================================================================
// BAYESIAN ANALYSIS TYPES ("Am I a Winner?")
// =============================================================================

export interface BayesianAnalysis {
  // Core probability
  probabilityWinner: number;           // P(true WR > 0)
  probabilityAboveTarget: number;      // P(true WR > target)
  targetWinrate: number;               // User-specified target (default 0)

  // Observed data
  observedWinrate: number;             // BB/100
  handsPlayed: number;
  standardError: number;               // SE of winrate estimate

  // Credible intervals (percentile bands)
  credibleIntervals: CredibleInterval[];

  // Posterior distribution points for charting
  posteriorCurve: PosteriorPoint[];
}

export interface CredibleInterval {
  probability: number;                 // e.g., 0.70, 0.90, 0.95
  lower: number;                       // Lower bound BB/100
  upper: number;                       // Upper bound BB/100
  label: string;                       // e.g., "70% confident"
}

export interface PosteriorPoint {
  winrate: number;                     // True winrate value (BB/100)
  density: number;                     // Probability density
}
