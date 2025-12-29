/**
 * Bayesian Analysis Functions for "Am I a Winner?" Feature
 *
 * Uses Bayesian inference to estimate the probability distribution
 * of a player's true winrate given their observed results.
 *
 * With a flat (uninformative) prior, the Bayesian credible interval
 * is numerically equivalent to the frequentist confidence interval.
 */

import {
  standardError,
  normalCDF,
  normalInverseCDF,
  probabilityTrueWinrateAbove,
  handsForAccuracy,
} from './statistics';
import type { BayesianAnalysis, CredibleInterval, PosteriorPoint } from '../types';

/**
 * Generate posterior distribution points for charting
 * The posterior is approximately Normal(observedWinrate, SE)
 *
 * @param observedWinnings - Total winnings in BB
 * @param hands - Number of hands played
 * @param stdDev - Standard deviation in BB/100
 * @param numPoints - Number of points to generate (default 100)
 */
export function posteriorDistribution(
  observedWinnings: number,
  hands: number,
  stdDev: number,
  numPoints: number = 100
): PosteriorPoint[] {
  const observedWinrate = (observedWinnings / hands) * 100;
  const se = standardError(hands, stdDev);

  // Range: observed ± 4 SE (covers 99.99% of distribution)
  const minWr = observedWinrate - 4 * se;
  const maxWr = observedWinrate + 4 * se;

  const points: PosteriorPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const wr = minWr + (i / numPoints) * (maxWr - minWr);
    const z = (wr - observedWinrate) / se;
    const density = Math.exp(-0.5 * z * z) / (se * Math.sqrt(2 * Math.PI));
    points.push({ winrate: wr, density });
  }

  return points;
}

/**
 * Calculate multiple credible intervals for true winrate
 *
 * @param observedWinnings - Total winnings in BB
 * @param hands - Number of hands played
 * @param stdDev - Standard deviation in BB/100
 * @param probabilities - Confidence levels to calculate (default: 50%, 70%, 90%, 95%)
 */
export function multipleCredibleIntervals(
  observedWinnings: number,
  hands: number,
  stdDev: number,
  probabilities: number[] = [0.50, 0.70, 0.90, 0.95]
): CredibleInterval[] {
  const observedWinrate = (observedWinnings / hands) * 100;
  const se = standardError(hands, stdDev);

  return probabilities.map((prob) => {
    // For central interval, use (1 + prob) / 2 for upper tail
    const z = normalInverseCDF((1 + prob) / 2);
    const margin = z * se;

    return {
      probability: prob,
      lower: observedWinrate - margin,
      upper: observedWinrate + margin,
      label: `${Math.round(prob * 100)}% confident`,
    };
  });
}

/**
 * Full Bayesian analysis for "Am I a Winner?" feature
 *
 * @param observedWinnings - Total winnings in BB
 * @param hands - Number of hands played
 * @param stdDev - Standard deviation in BB/100
 * @param targetWinrate - Threshold to test against (default 0 for breakeven)
 */
export function bayesianWinnerAnalysis(
  observedWinnings: number,
  hands: number,
  stdDev: number,
  targetWinrate: number = 0
): BayesianAnalysis {
  const observedWinrate = (observedWinnings / hands) * 100;
  const se = standardError(hands, stdDev);

  return {
    probabilityWinner: probabilityTrueWinrateAbove(observedWinnings, hands, stdDev, 0),
    probabilityAboveTarget: probabilityTrueWinrateAbove(observedWinnings, hands, stdDev, targetWinrate),
    targetWinrate,
    observedWinrate,
    handsPlayed: hands,
    standardError: se,
    credibleIntervals: multipleCredibleIntervals(observedWinnings, hands, stdDev),
    posteriorCurve: posteriorDistribution(observedWinnings, hands, stdDev),
  };
}

/**
 * Generate human-readable insight based on Bayesian analysis
 */
export function generateBayesianInsight(analysis: BayesianAnalysis, stdDev: number): string {
  const { probabilityWinner, observedWinrate, handsPlayed, standardError: se } = analysis;

  // Calculate hands needed for better clarity
  const handsFor1bb = handsForAccuracy(stdDev, 1, 0.95);
  const additionalHandsNeeded = Math.max(0, handsFor1bb - handsPlayed);

  if (probabilityWinner >= 0.95) {
    return `Very likely a winner. With ${(probabilityWinner * 100).toFixed(0)}% confidence, your results are statistically significant. Your true winrate is almost certainly positive.`;
  }

  if (probabilityWinner >= 0.80) {
    return `Probably a winning player. There's an ${(probabilityWinner * 100).toFixed(0)}% chance your true winrate is positive. ${additionalHandsNeeded > 0 ? `Play another ${formatHands(additionalHandsNeeded)} hands to reach 95% confidence.` : ''}`;
  }

  if (probabilityWinner >= 0.60) {
    return `Leaning toward winner, but variance is still a significant factor. Your margin of error is ±${se.toFixed(1)} BB/100. ${additionalHandsNeeded > 0 ? `You need about ${formatHands(additionalHandsNeeded)} more hands to narrow this down.` : ''}`;
  }

  if (probabilityWinner >= 0.40) {
    return `Too early to tell. You're right at the edge of breakeven. Your observed ${observedWinrate.toFixed(1)} BB/100 could easily be explained by variance. Play significantly more hands to distinguish skill from luck.`;
  }

  if (probabilityWinner >= 0.20) {
    return `Results suggest you may be a losing player. There's only a ${(probabilityWinner * 100).toFixed(0)}% chance your true winrate is positive. Consider studying or moving down in stakes.`;
  }

  return `Very likely a losing player. Only ${(probabilityWinner * 100).toFixed(0)}% chance of being a winner. Your negative results are statistically significant. Consider moving down and working on your game.`;
}

function formatHands(h: number): string {
  if (h >= 1000000) return `${(h / 1000000).toFixed(1)}M`;
  if (h >= 1000) return `${Math.round(h / 1000)}k`;
  return h.toString();
}
