/**
 * Coach Mode Explanation Generator
 * Generates human-readable explanations from simulation parameters
 */

import {
  expectedWinnings,
  probabilityOfLoss,
  confidenceInterval95,
  winningsStdDev,
} from '../math/statistics';
import { TEMPLATES, TOOLTIP_CONTENT } from './templates';

export interface ExplanationParams {
  winrate: number;
  stdDev: number;
  hands: number;
  stakes: number;
}

export interface ChartTooltips {
  evLine: string;
  ciBand: string;
  samplePaths: string;
  zeroLine: string;
  bellCurveLoss: string;
  bellCurveWin: string;
  bellCurveEV: string;
}

export interface CoachExplanation {
  summary: string;
  paragraphs: string[];
  chartTooltips: ChartTooltips;
}

function formatHands(h: number): string {
  if (h >= 1000000) return `${(h / 1000000).toFixed(1)}M`;
  if (h >= 1000) return `${Math.round(h / 1000)}k`;
  return h.toString();
}

function formatDollars(d: number): string {
  const sign = d >= 0 ? '+' : '';
  if (Math.abs(d) >= 1000) return `${sign}$${(d / 1000).toFixed(1)}k`;
  return `${sign}$${d.toFixed(0)}`;
}

function formatBB(bb: number): string {
  const sign = bb >= 0 ? '+' : '';
  return `${sign}${bb.toFixed(0)}`;
}

/**
 * Replace template placeholders with actual values
 */
function fillTemplate(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Generate the main summary paragraph based on scenario
 */
function generateSummaryParagraph(params: ExplanationParams): string {
  const { winrate, stdDev, hands, stakes } = params;
  const evBB = expectedWinnings(hands, winrate);
  const evDollars = evBB * stakes;
  const probLoss = probabilityOfLoss(hands, winrate, stdDev);
  const probWin = 1 - probLoss;
  const ci95 = confidenceInterval95(hands, winrate, stdDev);

  const values = {
    winrate: winrate.toFixed(1),
    hands: formatHands(hands),
    evBB: formatBB(evBB),
    evDollars: formatDollars(evDollars),
    probWinPercent: (probWin * 100).toFixed(0),
    probLossPercent: (probLoss * 100).toFixed(0),
    ci95Lower: formatBB(ci95.lower),
    ci95Upper: formatBB(ci95.upper),
  };

  if (winrate === 0) {
    return fillTemplate(TEMPLATES.summary.breakeven, values);
  }

  if (winrate < 0) {
    return fillTemplate(TEMPLATES.summary.negativeWinrate, values);
  }

  // Positive winrate
  const sigma = winningsStdDev(hands, stdDev);
  const isLargeSample = evBB > 2 * sigma; // EV is more than 2 SDs from zero

  if (isLargeSample) {
    return fillTemplate(TEMPLATES.summary.positiveWinrateLargeSample, values);
  } else {
    return fillTemplate(TEMPLATES.summary.positiveWinrateSmallSample, values);
  }
}

/**
 * Generate EV line explanation
 */
function generateEVLineExplanation(params: ExplanationParams): string {
  const { winrate, stdDev, hands, stakes } = params;
  const evBB = expectedWinnings(hands, winrate);
  const evDollars = evBB * stakes;

  const values = {
    winrate: winrate.toFixed(1),
    hands: formatHands(hands),
    evBB: Math.abs(evBB).toFixed(0),
    evDollars: formatDollars(Math.abs(evDollars)),
  };

  if (winrate === 0) {
    return TEMPLATES.evLine.breakeven;
  } else if (winrate > 0) {
    return fillTemplate(TEMPLATES.evLine.positive, values);
  } else {
    return fillTemplate(TEMPLATES.evLine.negative, values);
  }
}

/**
 * Generate CI band explanation
 */
function generateCIBandExplanation(params: ExplanationParams): string {
  const { winrate, stdDev, hands } = params;
  const evBB = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);

  // "Wide" if confidence interval is large relative to EV
  const ci95Range = 2 * 1.96 * sigma;
  const isWide = ci95Range > Math.abs(evBB) * 2;

  const values = { hands: formatHands(hands) };

  if (isWide) {
    return TEMPLATES.ciBand.base + ' ' + fillTemplate(TEMPLATES.ciBand.wide, values);
  } else {
    return TEMPLATES.ciBand.base + ' ' + fillTemplate(TEMPLATES.ciBand.narrow, values);
  }
}

/**
 * Generate probability of loss explanation
 */
function generateProbLossExplanation(params: ExplanationParams): string {
  const { winrate, stdDev, hands } = params;
  const probLoss = probabilityOfLoss(hands, winrate, stdDev);
  const probLossPercent = (probLoss * 100).toFixed(0);

  const values = { probLossPercent };

  if (probLoss > 0.3) {
    return fillTemplate(TEMPLATES.probLoss.high, values);
  } else if (probLoss > 0.1) {
    return fillTemplate(TEMPLATES.probLoss.medium, values);
  } else {
    return fillTemplate(TEMPLATES.probLoss.low, values);
  }
}

/**
 * Generate sample paths explanation
 */
function generateSamplePathsExplanation(params: ExplanationParams): string {
  const values = { hands: formatHands(params.hands) };
  return (
    fillTemplate(TEMPLATES.samplePaths.base, values) +
    ' ' +
    TEMPLATES.samplePaths.divergence
  );
}

/**
 * Generate full coach explanation
 */
export function generateCoachExplanation(params: ExplanationParams): CoachExplanation {
  const { winrate, stdDev, hands, stakes } = params;
  const evBB = expectedWinnings(hands, winrate);
  const probLoss = probabilityOfLoss(hands, winrate, stdDev);
  const probWin = 1 - probLoss;

  // Build the paragraphs
  const paragraphs = [
    generateSummaryParagraph(params),
    generateEVLineExplanation(params),
    generateCIBandExplanation(params),
  ];

  // Add probability context if winrate is positive
  if (winrate > 0) {
    paragraphs.push(generateProbLossExplanation(params));
  }

  paragraphs.push(generateSamplePathsExplanation(params));

  // Generate tooltips with dynamic values
  const chartTooltips: ChartTooltips = {
    evLine: `${TOOLTIP_CONTENT.evLine} At ${winrate.toFixed(1)} BB/100 over ${formatHands(hands)} hands, EV = ${formatBB(evBB)} BB (${formatDollars(evBB * stakes)}).`,
    ciBand: TOOLTIP_CONTENT.ciBand,
    samplePaths: TOOLTIP_CONTENT.samplePaths,
    zeroLine: TOOLTIP_CONTENT.zeroLine,
    bellCurveLoss: `${TOOLTIP_CONTENT.bellCurveLoss} Currently ${(probLoss * 100).toFixed(1)}%.`,
    bellCurveWin: `${TOOLTIP_CONTENT.bellCurveWin} Currently ${(probWin * 100).toFixed(1)}%.`,
    bellCurveEV: `${TOOLTIP_CONTENT.bellCurveEV} EV = ${formatBB(evBB)} BB.`,
  };

  return {
    summary: paragraphs[0],
    paragraphs,
    chartTooltips,
  };
}
