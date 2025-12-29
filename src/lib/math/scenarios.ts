/**
 * Alternative Scenarios Calculation Logic
 * Generates and compares different winrate/stakes scenarios
 */

import {
  expectedWinnings,
  probabilityOfProfit,
  confidenceInterval95,
  riskOfRuin,
  bankrollForRoR,
} from './statistics';
import type { Scenario, ScenarioMetrics, ScenarioComparison } from '../types';

const HANDS_PER_HOUR = 500;

/**
 * Generate default comparison scenarios based on user's current parameters
 */
export function generateDefaultScenarios(
  baseWinrate: number,
  baseStakes: number
): Scenario[] {
  return [
    {
      id: 'current',
      name: 'Current',
      description: 'Your current parameters',
      winrate: baseWinrate,
      stakes: baseStakes,
      isBase: true,
    },
    {
      id: 'plus30',
      name: '+30% Winrate',
      description: `${(baseWinrate * 1.3).toFixed(1)} BB/100 at same stakes`,
      winrate: baseWinrate * 1.3,
      stakes: baseStakes,
      isBase: false,
    },
    {
      id: 'minus30',
      name: '-30% Winrate',
      description: `${(baseWinrate * 0.7).toFixed(1)} BB/100 at same stakes`,
      winrate: baseWinrate * 0.7,
      stakes: baseStakes,
      isBase: false,
    },
    {
      id: 'plus60',
      name: '+60% Winrate',
      description: `${(baseWinrate * 1.6).toFixed(1)} BB/100 at same stakes`,
      winrate: baseWinrate * 1.6,
      stakes: baseStakes,
      isBase: false,
    },
    {
      id: 'minus60',
      name: '-60% Winrate',
      description: `${(baseWinrate * 0.4).toFixed(1)} BB/100 at same stakes`,
      winrate: baseWinrate * 0.4,
      stakes: baseStakes,
      isBase: false,
    },
    {
      id: 'halfStakes',
      name: 'Half Stakes +60% WR',
      description: `${(baseWinrate * 1.6).toFixed(1)} BB/100 at $${(baseStakes / 2).toFixed(2)} BB`,
      winrate: baseWinrate * 1.6,
      stakes: baseStakes / 2,
      isBase: false,
    },
  ];
}

/**
 * Calculate all metrics for a single scenario
 */
export function calculateScenarioMetrics(
  scenario: Scenario,
  hands: number,
  stdDev: number,
  bankroll: number
): ScenarioMetrics {
  const evBB = expectedWinnings(hands, scenario.winrate);
  const ci95 = confidenceInterval95(hands, scenario.winrate, stdDev);
  const ror = riskOfRuin(scenario.winrate, bankroll, stdDev);
  const recBankrollBB = bankrollForRoR(scenario.winrate, 0.05, stdDev);

  return {
    scenario,
    expectedValueBB: evBB,
    expectedValueDollars: evBB * scenario.stakes,
    probabilityOfProfit: probabilityOfProfit(hands, scenario.winrate, stdDev),
    ci95Lower: ci95.lower,
    ci95Upper: ci95.upper,
    riskOfRuin: ror,
    recommendedBankrollBB: recBankrollBB,
    recommendedBankrollDollars: recBankrollBB * scenario.stakes,
    hourlyRateDollars: (scenario.winrate / 100) * HANDS_PER_HOUR * scenario.stakes,
  };
}

/**
 * Generate full scenario comparison
 */
export function compareScenarios(
  baseWinrate: number,
  baseStakes: number,
  hands: number,
  stdDev: number,
  bankroll: number
): ScenarioComparison {
  const scenarios = generateDefaultScenarios(baseWinrate, baseStakes);
  const metrics = scenarios.map((s) =>
    calculateScenarioMetrics(s, hands, stdDev, bankroll)
  );

  const baseMetrics = metrics.find((m) => m.scenario.isBase);
  if (!baseMetrics) {
    throw new Error('Base scenario not found');
  }

  return {
    scenarios: metrics,
    baseScenario: baseMetrics,
    hands,
    bankroll,
  };
}

/**
 * Generate insight text about scenario trade-offs
 */
export function generateScenarioInsight(comparison: ScenarioComparison): string {
  const current = comparison.baseScenario;
  const halfStakes = comparison.scenarios.find((m) => m.scenario.id === 'halfStakes');

  if (!halfStakes) {
    return 'Compare the trade-offs between maximizing expected value and minimizing variance risk.';
  }

  const dollarDiff = halfStakes.expectedValueDollars - current.expectedValueDollars;
  const rorDiff = current.riskOfRuin - halfStakes.riskOfRuin;

  if (current.scenario.winrate <= 0) {
    return 'Scenario comparison works best with a positive winrate. Adjust your assumed winrate above.';
  }

  if (dollarDiff > 0) {
    return `Moving down to half stakes with higher winrate could actually increase your expected profit by $${Math.abs(dollarDiff).toFixed(0)}, while reducing risk of ruin by ${(rorDiff * 100).toFixed(1)} percentage points.`;
  } else if (rorDiff > 0.02) {
    return `Playing half stakes with higher winrate would reduce your expected profit by $${Math.abs(dollarDiff).toFixed(0)}, but cuts your risk of ruin by ${(rorDiff * 100).toFixed(1)} percentage points.`;
  }

  return 'Compare the trade-offs between maximizing expected value and minimizing variance risk.';
}
