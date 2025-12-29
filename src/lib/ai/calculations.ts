/**
 * Poker Variance Calculations
 * All math happens here - the LLM never calculates.
 */

import type { GameFormat, Environment } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Hands per hour by game format and environment
 */
export const HANDS_PER_HOUR: Record<Environment, Record<GameFormat, number>> = {
  online: {
    nlhe_6max: 500,
    nlhe_fullring: 400,
    nlhe_headsup: 200,
    plo_6max: 400,
    plo_fullring: 350,
    mtt: 80,
    sng: 100,
  },
  live: {
    nlhe_6max: 33,
    nlhe_fullring: 25,
    nlhe_headsup: 60,
    plo_6max: 25,
    plo_fullring: 20,
    mtt: 25,
    sng: 30,
  },
};

/**
 * Standard deviation ranges by game format (BB/100)
 */
export const STANDARD_DEVIATIONS: Record<
  GameFormat,
  { min: number; typical: number; max: number }
> = {
  nlhe_fullring: { min: 60, typical: 70, max: 80 },
  nlhe_6max: { min: 75, typical: 85, max: 100 },
  nlhe_headsup: { min: 100, typical: 120, max: 140 },
  plo_6max: { min: 120, typical: 140, max: 160 },
  plo_fullring: { min: 100, typical: 115, max: 130 },
  mtt: { min: 80, typical: 100, max: 150 },
  sng: { min: 70, typical: 90, max: 120 },
};

/**
 * Winrate adjustment when moving up stakes
 * Live games are tougher relative to online at equivalent stakes
 */
export const MOVING_UP_ADJUSTMENT: Record<Environment, number> = {
  live: 3, // Subtract 3 BB/100
  online: 1, // Subtract 1 BB/100
};

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * Project winrate at higher stakes using the moving-up formula:
 * projectedWR = (currentWR / 1.5) - adjustment
 *
 * @param currentWinrate - Current winrate in BB/100
 * @param environment - 'online' or 'live'
 * @returns Projected winrate at next stake level
 */
export function projectWinrateAtHigherStakes(
  currentWinrate: number,
  environment: Environment
): number {
  const adjustment = MOVING_UP_ADJUSTMENT[environment];
  return currentWinrate / 1.5 - adjustment;
}

/**
 * Calculate probability of experiencing a downswing of D big blinds
 * Formula: P = e^(-2 × WR × D / SD²)
 *
 * This represents the probability of hitting a downswing of exactly D BBs
 * "starting right now" - at any given moment.
 *
 * @param winrate - Winrate in BB/100
 * @param downswingBB - Downswing size in big blinds
 * @param stdDev - Standard deviation in BB/100
 * @returns Probability (0 to 1)
 */
export function downswingProbability(
  winrate: number,
  downswingBB: number,
  stdDev: number
): number {
  if (winrate <= 0) return 1; // Losing/breakeven player will definitely hit any downswing
  if (downswingBB <= 0) return 1; // 0 or negative downswing always happens

  // Convert to per-hand values for the formula
  // WR in BB/100, so WR per hand = WR / 100
  // SD in BB/100, so variance per hand = SD² / 100
  const exponent = (-2 * winrate * downswingBB) / (stdDev * stdDev);
  return Math.exp(exponent);
}

/**
 * Calculate probability of experiencing a downswing of N buy-ins
 *
 * @param winrate - Winrate in BB/100
 * @param buyIns - Number of buy-ins (1 buy-in = 100 BB)
 * @param stdDev - Standard deviation in BB/100
 * @returns Probability (0 to 1)
 */
export function downswingProbabilityBuyIns(
  winrate: number,
  buyIns: number,
  stdDev: number
): number {
  const downswingBB = buyIns * 100;
  return downswingProbability(winrate, downswingBB, stdDev);
}

/**
 * Estimate winrate from results
 *
 * @param profit - Total profit in dollars
 * @param bigBlind - Big blind size in dollars
 * @param hands - Number of hands played
 * @returns Estimated winrate in BB/100
 */
export function estimateWinrateFromResults(
  profit: number,
  bigBlind: number,
  hands: number
): number {
  if (hands <= 0 || bigBlind <= 0) return 0;
  const profitInBB = profit / bigBlind;
  const hundredsOfHands = hands / 100;
  return profitInBB / hundredsOfHands;
}

/**
 * Convert hours played to hands
 *
 * @param hours - Hours played
 * @param format - Game format
 * @param environment - 'online' or 'live'
 * @returns Estimated number of hands
 */
export function hoursToHands(
  hours: number,
  format: GameFormat,
  environment: Environment
): number {
  const handsPerHour = HANDS_PER_HOUR[environment][format];
  return Math.round(hours * handsPerHour);
}

/**
 * Convert hands to hours
 *
 * @param hands - Number of hands
 * @param format - Game format
 * @param environment - 'online' or 'live'
 * @returns Estimated hours played
 */
export function handsToHours(
  hands: number,
  format: GameFormat,
  environment: Environment
): number {
  const handsPerHour = HANDS_PER_HOUR[environment][format];
  return hands / handsPerHour;
}

/**
 * Get the typical standard deviation for a game format
 *
 * @param format - Game format
 * @returns Typical standard deviation in BB/100
 */
export function getTypicalStdDev(format: GameFormat): number {
  return STANDARD_DEVIATIONS[format].typical;
}

/**
 * Calculate minimum bankroll for a given risk of ruin target
 * Using Kelly-derived formula: BR = (SD² / (2 * WR)) * ln(1/RoR)
 *
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param riskOfRuin - Target risk of ruin (e.g., 0.05 for 5%)
 * @returns Minimum bankroll in big blinds
 */
export function minimumBankroll(
  winrate: number,
  stdDev: number,
  riskOfRuin: number
): number {
  if (winrate <= 0) return Infinity; // Can't size bankroll for losing player
  if (riskOfRuin <= 0 || riskOfRuin >= 1) return Infinity;

  const variance = stdDev * stdDev;
  return (variance / (2 * winrate)) * Math.log(1 / riskOfRuin);
}

/**
 * Calculate bankroll in buy-ins
 *
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @param riskOfRuin - Target risk of ruin
 * @returns Minimum bankroll in buy-ins (100 BB each)
 */
export function minimumBankrollBuyIns(
  winrate: number,
  stdDev: number,
  riskOfRuin: number
): number {
  const bankrollBB = minimumBankroll(winrate, stdDev, riskOfRuin);
  return bankrollBB / 100;
}

/**
 * Assess sample size adequacy
 *
 * @param hands - Number of hands
 * @returns Assessment category
 */
export function assessSampleSize(
  hands: number
): 'very_small' | 'small' | 'moderate' | 'large' {
  if (hands < 10000) return 'very_small';
  if (hands < 30000) return 'small';
  if (hands < 100000) return 'moderate';
  return 'large';
}

/**
 * Assess winrate realism
 *
 * @param winrate - Winrate in BB/100
 * @param environment - 'online' or 'live'
 * @returns Assessment
 */
export function assessWinrateRealism(
  winrate: number,
  environment: Environment
): 'realistic' | 'high' | 'very_high' | 'unrealistic' {
  // Live winrates are measured in BB/hr, online in BB/100
  // For live: 10 BB/hr ≈ 30 BB/100 at 33 hands/hr
  // Thresholds adjusted accordingly
  if (environment === 'live') {
    // Live is often quoted in BB/hr but we store as BB/100
    if (winrate > 50) return 'unrealistic'; // > ~16 BB/hr
    if (winrate > 30) return 'very_high'; // > ~10 BB/hr
    if (winrate > 20) return 'high'; // > ~6 BB/hr
    return 'realistic';
  } else {
    // Online BB/100
    if (winrate > 15) return 'unrealistic';
    if (winrate > 10) return 'very_high';
    if (winrate > 8) return 'high';
    return 'realistic';
  }
}

/**
 * Generate downswing probability table for common scenarios
 *
 * @param winrate - Winrate in BB/100
 * @param stdDev - Standard deviation in BB/100
 * @returns Table of downswing probabilities
 */
export function generateDownswingTable(
  winrate: number,
  stdDev: number
): Array<{ buyIns: number; probability: number }> {
  const buyInLevels = [5, 10, 15, 20, 25, 30, 40, 50];
  return buyInLevels.map((buyIns) => ({
    buyIns,
    probability: downswingProbabilityBuyIns(winrate, buyIns, stdDev),
  }));
}
