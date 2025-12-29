/**
 * Statistical functions for variance calculations
 * Uses high-precision algorithms suitable for financial/poker variance analysis
 */

import { Z_70, Z_95 } from '../constants';

/**
 * Normal CDF (cumulative distribution function) using Abramowitz and Stegun approximation
 * Formula 26.2.17 - accurate to 7.5×10⁻⁸
 *
 * @param x - The z-score to evaluate
 * @returns The probability P(Z ≤ x) for standard normal Z
 */
export function normalCDF(x: number): number {
  // Handle edge cases
  if (x === 0) return 0.5;
  if (x < -8) return 0;
  if (x > 8) return 1;

  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);

  // Constants for the approximation
  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const t = 1 / (1 + p * z);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  // Standard normal PDF at z
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

  // Polynomial approximation
  const cdf = 1 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5);

  // Adjust for negative x
  return sign === 1 ? cdf : 1 - cdf;
}

/**
 * Inverse normal CDF (quantile function) using Acklam's algorithm
 * Accurate to about 1.15×10⁻⁹ in the range 0 < p < 1
 *
 * @param p - The probability (0 < p < 1)
 * @returns The z-score such that P(Z ≤ z) = p
 */
export function normalInverseCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Coefficients for the rational approximation
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 = 4.374664141464968e+00;
  const c6 = 2.938163982698783e+00;

  const d1 = 7.784695709041462e-03;
  const d2 = 3.224671290700398e-01;
  const d3 = 2.445134137142996e+00;
  const d4 = 3.754408661907416e+00;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;
  let x: number;

  if (p < pLow) {
    // Lower region
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    // Central region
    q = p - 0.5;
    r = q * q;
    x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    // Upper region
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
         ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  return x;
}

/**
 * Calculate expected winnings at a given hand count
 * @param hands - Number of hands
 * @param winrate - Winrate in BB/100
 * @returns Expected winnings in BB
 */
export function expectedWinnings(hands: number, winrate: number): number {
  return winrate * (hands / 100);
}

/**
 * Calculate standard deviation of winnings at a given hand count
 * @param hands - Number of hands
 * @param stdDev - Standard deviation in BB/100
 * @returns Standard deviation of total winnings in BB
 */
export function winningsStdDev(hands: number, stdDev: number): number {
  return stdDev * Math.sqrt(hands / 100);
}

/**
 * Calculate standard error of the winrate estimate
 * @param hands - Number of hands
 * @param stdDev - Standard deviation in BB/100
 * @returns Standard error in BB/100
 */
export function standardError(hands: number, stdDev: number): number {
  return stdDev / Math.sqrt(hands / 100);
}

/**
 * Calculate confidence interval for winnings at a given hand count
 * @param hands - Number of hands
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param zValue - Z-score for the confidence level
 * @returns Object with lower, upper bounds and mean
 */
export function confidenceInterval(
  hands: number,
  winrate: number,
  stdDev: number,
  zValue: number
): { lower: number; upper: number; mean: number } {
  const mean = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);
  const margin = zValue * sigma;

  return {
    mean,
    lower: mean - margin,
    upper: mean + margin,
  };
}

/**
 * Calculate 70% confidence interval
 */
export function confidenceInterval70(hands: number, winrate: number, stdDev: number) {
  return confidenceInterval(hands, winrate, stdDev, Z_70);
}

/**
 * Calculate 95% confidence interval
 */
export function confidenceInterval95(hands: number, winrate: number, stdDev: number) {
  return confidenceInterval(hands, winrate, stdDev, Z_95);
}

/**
 * Calculate probability of loss (negative total winnings) after H hands
 * @param hands - Number of hands
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @returns Probability (0-1) of having lost money
 */
export function probabilityOfLoss(hands: number, winrate: number, stdDev: number): number {
  if (winrate === 0) return 0.5;

  const mean = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);

  if (sigma === 0) return winrate < 0 ? 1 : 0;

  // P(total < 0) = Φ((0 - μ) / σ)
  const zScore = (0 - mean) / sigma;
  return normalCDF(zScore);
}

/**
 * Calculate probability of running at or above an observed winrate
 * @param hands - Number of hands
 * @param trueWinrate - True winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param observedWinrate - Observed winrate in BB/100
 * @returns Probability of running at or above the observed winrate
 */
export function probabilityAboveObserved(
  hands: number,
  trueWinrate: number,
  stdDev: number,
  observedWinrate: number
): number {
  const targetWinnings = expectedWinnings(hands, observedWinrate);
  const trueMean = expectedWinnings(hands, trueWinrate);
  const sigma = winningsStdDev(hands, stdDev);

  if (sigma === 0) return trueMean >= targetWinnings ? 1 : 0;

  const zScore = (targetWinnings - trueMean) / sigma;
  return 1 - normalCDF(zScore);
}

/**
 * Calculate probability of running below an observed winrate
 */
export function probabilityBelowObserved(
  hands: number,
  trueWinrate: number,
  stdDev: number,
  observedWinrate: number
): number {
  return 1 - probabilityAboveObserved(hands, trueWinrate, stdDev, observedWinrate);
}

/**
 * Calculate minimum bankroll for less than 5% risk of ruin
 * Uses Brownian motion approximation with drift
 *
 * Formula: RoR = exp(-2 * μ * BR / σ²)
 * Solving for BR: BR = -σ² * ln(RoR) / (2 * μ)
 *
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param rorTarget - Target risk of ruin (default 0.05 = 5%)
 * @returns Minimum bankroll in BB, or Infinity if winrate <= 0
 */
export function minimumBankroll(
  winrate: number,
  stdDev: number,
  rorTarget: number = 0.05
): number {
  // Risk of ruin formula only applies to positive winrate
  if (winrate <= 0) return Infinity;

  // Convert to per-hand parameters
  const muPerHand = winrate / 100;
  const variancePerHand = (stdDev * stdDev) / 100;

  // BR = -σ² * ln(RoR) / (2 * μ)
  const bankroll = -variancePerHand * Math.log(rorTarget) / (2 * muPerHand);

  return Math.ceil(bankroll);
}

/**
 * Calculate probability of profit (complement of probability of loss)
 */
export function probabilityOfProfit(hands: number, winrate: number, stdDev: number): number {
  return 1 - probabilityOfLoss(hands, winrate, stdDev);
}

/**
 * Calculate risk of ruin for a given bankroll
 * Uses the formula: RoR = exp(-2 × winrate × bankroll × 100 / stddev²)
 *
 * @param winrate - Winrate in BB/100
 * @param bankroll - Bankroll in BB
 * @param stdDev - Standard deviation in BB/100
 * @returns Risk of ruin probability (0-1), or 1 if winrate <= 0
 */
export function riskOfRuin(winrate: number, bankroll: number, stdDev: number): number {
  if (winrate <= 0) return 1;
  if (bankroll <= 0) return 1;

  // Convert to per-hand parameters
  const muPerHand = winrate / 100;
  const variancePerHand = (stdDev * stdDev) / 100;

  // RoR = exp(-2 × μ × BR / σ²)
  const ror = Math.exp(-2 * muPerHand * bankroll / variancePerHand);

  return Math.min(1, Math.max(0, ror));
}

/**
 * Calculate bankroll needed for a target risk of ruin
 * Inverse of riskOfRuin function
 *
 * @param winrate - Winrate in BB/100
 * @param targetRoR - Target risk of ruin (0-1)
 * @param stdDev - Standard deviation in BB/100
 * @returns Required bankroll in BB
 */
export function bankrollForRoR(winrate: number, targetRoR: number, stdDev: number): number {
  if (winrate <= 0) return Infinity;
  if (targetRoR <= 0) return Infinity;
  if (targetRoR >= 1) return 0;

  const muPerHand = winrate / 100;
  const variancePerHand = (stdDev * stdDev) / 100;

  // BR = -σ² × ln(RoR) / (2 × μ)
  const bankroll = -variancePerHand * Math.log(targetRoR) / (2 * muPerHand);

  return Math.ceil(bankroll);
}

/**
 * Calculate hands needed to achieve a certain accuracy in winrate estimate
 * Uses the formula: hands = (z × stdDev / accuracy)² × 100
 *
 * @param stdDev - Standard deviation in BB/100
 * @param accuracy - Desired accuracy (± BB/100)
 * @param confidence - Confidence level (default 0.95 for 95%)
 * @returns Number of hands needed
 */
export function handsForAccuracy(
  stdDev: number,
  accuracy: number,
  confidence: number = 0.95
): number {
  if (accuracy <= 0) return Infinity;

  // Get z-score for the confidence level
  const z = normalInverseCDF(1 - (1 - confidence) / 2);

  // hands = (z × σ / accuracy)² × 100
  const hands = Math.pow((z * stdDev) / accuracy, 2) * 100;

  return Math.ceil(hands);
}

/**
 * Calculate hands needed to recover from a downswing
 *
 * @param downswingBB - Size of downswing in BB
 * @param winrate - Winrate in BB/100
 * @returns Expected hands to recover
 */
export function recoveryHands(downswingBB: number, winrate: number): number {
  if (winrate <= 0) return Infinity;
  if (downswingBB <= 0) return 0;

  // Expected hands = downswing / (winrate / 100)
  return Math.ceil(downswingBB / (winrate / 100));
}

/**
 * Calculate probability of achieving a profit goal
 *
 * @param goal - Profit goal in BB
 * @param hands - Number of hands
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @returns Probability (0-1) of achieving the goal
 */
export function goalProbability(
  goal: number,
  hands: number,
  winrate: number,
  stdDev: number
): number {
  const ev = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);

  if (sigma === 0) return ev >= goal ? 1 : 0;

  // P(profit >= goal) = 1 - Φ((goal - EV) / σ)
  const zScore = (goal - ev) / sigma;
  return 1 - normalCDF(zScore);
}

/**
 * Calculate probability of experiencing a downswing of at least X BB
 * Uses lifetime downswing probability formula
 *
 * @param downswingBB - Downswing threshold in BB
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @returns Probability (0-1) of experiencing such a downswing
 */
export function downswingProbability(
  downswingBB: number,
  winrate: number,
  stdDev: number
): number {
  if (winrate <= 0) return 1;
  if (downswingBB <= 0) return 1;

  // Same formula as risk of ruin, treating downswing as "bankroll"
  // P(downswing >= D) = exp(-2 × μ × D / σ²)
  const muPerHand = winrate / 100;
  const variancePerHand = (stdDev * stdDev) / 100;

  const prob = Math.exp(-2 * muPerHand * downswingBB / variancePerHand);

  return Math.min(1, Math.max(0, prob));
}

/**
 * Calculate the outcome at a given percentile
 *
 * @param percentile - Percentile (0-100)
 * @param hands - Number of hands
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @returns Winnings in BB at the given percentile
 */
export function percentileOutcome(
  percentile: number,
  hands: number,
  winrate: number,
  stdDev: number
): number {
  const ev = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);

  // Convert percentile to probability (0-1)
  const p = percentile / 100;

  // Get z-score for this percentile
  const z = normalInverseCDF(p);

  return ev + z * sigma;
}

/**
 * Calculate what percentile a given outcome represents
 *
 * @param outcome - Actual winnings in BB
 * @param hands - Number of hands
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @returns Percentile (0-100)
 */
export function outcomePercentile(
  outcome: number,
  hands: number,
  winrate: number,
  stdDev: number
): number {
  const ev = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);

  if (sigma === 0) return outcome >= ev ? 100 : 0;

  const zScore = (outcome - ev) / sigma;
  return normalCDF(zScore) * 100;
}

/**
 * Calculate confidence interval for true winrate given observed results
 *
 * @param observedWinnings - Actual winnings in BB
 * @param hands - Number of hands played
 * @param stdDev - Standard deviation in BB/100
 * @param confidence - Confidence level (default 0.95)
 * @returns Object with lower and upper bounds for true winrate (BB/100)
 */
export function winrateConfidenceInterval(
  observedWinnings: number,
  hands: number,
  stdDev: number,
  confidence: number = 0.95
): { lower: number; upper: number; observed: number } {
  // Observed winrate
  const observedWinrate = (observedWinnings / hands) * 100;

  // Standard error of the winrate
  const se = standardError(hands, stdDev);

  // Z-score for confidence level
  const z = normalInverseCDF(1 - (1 - confidence) / 2);

  const margin = z * se;

  return {
    observed: observedWinrate,
    lower: observedWinrate - margin,
    upper: observedWinrate + margin,
  };
}

/**
 * Calculate probability that true winrate is above a threshold
 *
 * @param observedWinnings - Actual winnings in BB
 * @param hands - Number of hands played
 * @param stdDev - Standard deviation in BB/100
 * @param threshold - Winrate threshold in BB/100 (default 0 for "am I a winner?")
 * @returns Probability (0-1) that true winrate is above threshold
 */
export function probabilityTrueWinrateAbove(
  observedWinnings: number,
  hands: number,
  stdDev: number,
  threshold: number = 0
): number {
  const observedWinrate = (observedWinnings / hands) * 100;
  const se = standardError(hands, stdDev);

  if (se === 0) return observedWinrate > threshold ? 1 : 0;

  // Z-score: how many SEs is threshold below observed?
  const zScore = (observedWinrate - threshold) / se;

  return normalCDF(zScore);
}
