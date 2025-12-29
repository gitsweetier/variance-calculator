'use client';

import { useMemo } from 'react';
import {
  minimumBankroll,
  downswingProbabilityBuyIns,
  generateDownswingTable,
} from '@/lib/ai/calculations';
import { formatNumber } from '@/lib/utils';
import type { ShowBankrollRecommendationParams, ToolComponentProps } from '@/lib/ai/types';

const RISK_LABELS = {
  conservative: { label: 'Conservative', ror: 0.01, desc: '1% risk of ruin' },
  moderate: { label: 'Moderate', ror: 0.05, desc: '5% risk of ruin' },
  aggressive: { label: 'Aggressive', ror: 0.10, desc: '10% risk of ruin' },
};

export function BankrollRecommendation({
  params,
}: ToolComponentProps<ShowBankrollRecommendationParams>) {
  // Defensive checks for undefined params
  const calculationInputs = params?.calculationInputs;
  const riskTolerance = params?.riskTolerance ?? 'moderate';

  // Show loading state if params aren't ready yet
  if (!calculationInputs) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Loading bankroll recommendation...</p>
      </div>
    );
  }

  const { winrate, stdDev, bigBlind, stakes, environment } = calculationInputs;

  const recommendations = useMemo(() => {
    const riskConfig = RISK_LABELS[riskTolerance];
    const bankrollBB = minimumBankroll(winrate, stdDev, riskConfig.ror);
    const bankrollDollars = bankrollBB * bigBlind;
    const buyIns = bankrollBB / 100;

    // Downswing probabilities for context
    const downswing10BI = downswingProbabilityBuyIns(winrate, 10, stdDev);
    const downswing20BI = downswingProbabilityBuyIns(winrate, 20, stdDev);

    // Full downswing table
    const downswingTable = generateDownswingTable(winrate, stdDev);

    return {
      bankrollBB,
      bankrollDollars,
      buyIns,
      rorPercent: riskConfig.ror * 100,
      riskLabel: riskConfig.label,
      riskDesc: riskConfig.desc,
      downswing10BI: (downswing10BI * 100).toFixed(1),
      downswing20BI: (downswing20BI * 100).toFixed(1),
      downswingTable,
    };
  }, [winrate, stdDev, bigBlind, riskTolerance]);

  // Handle edge case of losing player
  if (winrate <= 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-medium text-amber-900">Bankroll Sizing Not Applicable</h4>
            <p className="mt-1 text-sm text-amber-800">
              With a break-even or negative winrate, traditional bankroll requirements don&apos;t apply.
              Focus on improving your game before sizing your bankroll for these stakes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-green-100 bg-green-50 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Bankroll Recommendation</h3>
        <p className="text-sm text-gray-600">
          For {stakes} {environment} at {winrate} bb/100
        </p>
      </div>

      {/* Main recommendation */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white p-4 border border-green-100">
            <p className="text-sm text-gray-500">Recommended Bankroll</p>
            <p className="text-2xl font-bold text-green-700">
              ${formatNumber(recommendations.bankrollDollars, 0)}
            </p>
            <p className="text-xs text-gray-400">
              {formatNumber(recommendations.bankrollBB, 0)} BB / {Math.round(recommendations.buyIns)} buy-ins
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 border border-green-100">
            <p className="text-sm text-gray-500">Risk of Ruin</p>
            <p className="text-2xl font-bold text-gray-900">
              {recommendations.rorPercent}%
            </p>
            <p className="text-xs text-gray-400">
              {recommendations.riskLabel} ({recommendations.riskDesc})
            </p>
          </div>
        </div>

        {/* Downswing expectations */}
        <div className="mt-4 rounded-lg bg-white p-4 border border-green-100">
          <h4 className="font-medium text-gray-900 mb-2">Downswing Expectations</h4>
          <p className="text-sm text-gray-600 mb-3">
            With your winrate and variance, here are the probabilities of experiencing various downswings:
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {recommendations.downswingTable.slice(0, 4).map(({ buyIns, probability }) => (
              <div key={buyIns} className="rounded bg-gray-50 p-2">
                <p className="text-xs text-gray-500">{buyIns} BI</p>
                <p className="font-medium text-gray-900">
                  {(probability * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Parameters used */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            WR: {winrate} bb/100
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            SD: {stdDev} bb/100
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            BB: ${bigBlind}
          </span>
        </div>
      </div>
    </div>
  );
}
