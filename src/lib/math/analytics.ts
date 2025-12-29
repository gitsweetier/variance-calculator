/**
 * Analytical calculations for variance metrics
 */

import {
  AnalyticalMetrics,
  ConfidencePoint,
  MilestoneSummary,
} from '../types';
import {
  expectedWinnings,
  winningsStdDev,
  standardError,
  confidenceInterval70,
  confidenceInterval95,
  probabilityOfLoss,
  probabilityOfProfit,
  probabilityAboveObserved,
  probabilityBelowObserved,
  minimumBankroll,
} from './statistics';
import { MILESTONE_HANDS, Z_70, Z_95 } from '../constants';

/**
 * Calculate all analytical metrics for the given inputs
 */
export function calculateAnalyticalMetrics(
  hands: number,
  winrate: number,
  stdDev: number,
  observedWinrate?: number
): AnalyticalMetrics {
  const ev = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);
  const se = standardError(hands, stdDev);
  const pLoss = probabilityOfLoss(hands, winrate, stdDev);
  const ci70 = confidenceInterval70(hands, winrate, stdDev);
  const ci95 = confidenceInterval95(hands, winrate, stdDev);
  const minBR = minimumBankroll(winrate, stdDev);

  const metrics: AnalyticalMetrics = {
    expectedWinnings: ev,
    standardDeviation: sigma,
    standardError: se,
    probabilityOfLoss: pLoss,
    confidenceInterval70: { lower: ci70.lower, upper: ci70.upper },
    confidenceInterval95: { lower: ci95.lower, upper: ci95.upper },
    minimumBankroll5Percent: minBR,
  };

  // Add observed winrate probabilities if provided
  if (observedWinrate !== undefined) {
    metrics.probabilityAboveObserved = probabilityAboveObserved(
      hands,
      winrate,
      stdDev,
      observedWinrate
    );
    metrics.probabilityBelowObserved = probabilityBelowObserved(
      hands,
      winrate,
      stdDev,
      observedWinrate
    );
  }

  return metrics;
}

/**
 * Generate confidence interval data points for charting
 * Creates points at regular intervals for smooth CI bands
 */
export function generateConfidenceData(
  totalHands: number,
  winrate: number,
  stdDev: number,
  numPoints: number = 100
): ConfidencePoint[] {
  const points: ConfidencePoint[] = [];
  const stepSize = Math.max(100, Math.floor(totalHands / numPoints));

  for (let h = 0; h <= totalHands; h += stepSize) {
    if (h === 0) {
      points.push({
        hands: 0,
        ev: 0,
        ci70Lower: 0,
        ci70Upper: 0,
        ci95Lower: 0,
        ci95Upper: 0,
      });
      continue;
    }

    const ev = expectedWinnings(h, winrate);
    const sigma = winningsStdDev(h, stdDev);

    points.push({
      hands: h,
      ev,
      ci70Lower: ev - Z_70 * sigma,
      ci70Upper: ev + Z_70 * sigma,
      ci95Lower: ev - Z_95 * sigma,
      ci95Upper: ev + Z_95 * sigma,
    });
  }

  // Ensure we have the final point
  const lastPoint = points[points.length - 1];
  if (lastPoint.hands !== totalHands && totalHands > 0) {
    const ev = expectedWinnings(totalHands, winrate);
    const sigma = winningsStdDev(totalHands, stdDev);

    points.push({
      hands: totalHands,
      ev,
      ci70Lower: ev - Z_70 * sigma,
      ci70Upper: ev + Z_70 * sigma,
      ci95Lower: ev - Z_95 * sigma,
      ci95Upper: ev + Z_95 * sigma,
    });
  }

  return points;
}

/**
 * Generate milestone summaries for the variance table
 * Only includes milestones up to the specified hand count
 */
export function generateMilestoneSummaries(
  totalHands: number,
  winrate: number,
  stdDev: number
): MilestoneSummary[] {
  const summaries: MilestoneSummary[] = [];

  // Get milestones up to totalHands, plus totalHands itself if not a milestone
  const relevantMilestones = MILESTONE_HANDS.filter(h => h <= totalHands);

  // Always include totalHands if it's not already a milestone
  if (!relevantMilestones.includes(totalHands) && totalHands > 0) {
    relevantMilestones.push(totalHands);
    relevantMilestones.sort((a, b) => a - b);
  }

  for (const hands of relevantMilestones) {
    const ev = expectedWinnings(hands, winrate);
    const sigma = winningsStdDev(hands, stdDev);
    const ci95 = confidenceInterval95(hands, winrate, stdDev);
    const pProfit = probabilityOfProfit(hands, winrate, stdDev);
    const minBR = minimumBankroll(winrate, stdDev);

    summaries.push({
      hands,
      expectedValue: ev,
      standardDeviation: sigma,
      ci95Lower: ci95.lower,
      ci95Upper: ci95.upper,
      probabilityOfProfit: pProfit,
      requiredBankroll: minBR,
    });
  }

  return summaries;
}

/**
 * Round hands to nearest 100 for simulation
 * Returns the rounded value and whether rounding occurred
 */
export function roundHands(hands: number): { rounded: number; wasRounded: boolean } {
  const rounded = Math.round(hands / 100) * 100;
  return {
    rounded: Math.max(100, rounded), // Minimum 100 hands
    wasRounded: rounded !== hands,
  };
}
