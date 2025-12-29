'use client';

import { MilestoneSummary } from '@/lib/types';
import { formatNumber, formatBB, formatPercent, formatHandsShort } from '@/lib/utils';

interface VarianceSummaryProps {
  milestones: MilestoneSummary[];
  bigBlindSize?: number;
}

export function VarianceSummary({ milestones, bigBlindSize }: VarianceSummaryProps) {
  if (milestones.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">Run a simulation to see variance milestones</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hands
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Std Dev
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                95% CI Low
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                95% CI High
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                P(Profit)
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bankroll
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {milestones.map((milestone) => (
              <tr key={milestone.hands}>
                <td className="px-3 py-3 text-sm font-medium text-gray-900">
                  {formatHandsShort(milestone.hands)}
                </td>
                <td
                  className={`px-3 py-3 text-sm text-right font-medium ${
                    milestone.expectedValue >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {milestone.expectedValue >= 0 ? '+' : ''}
                  {formatBB(milestone.expectedValue, bigBlindSize, 0)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-gray-600">
                  {formatBB(milestone.standardDeviation, bigBlindSize, 0)}
                </td>
                <td
                  className={`px-3 py-3 text-sm text-right ${
                    milestone.ci95Lower >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatBB(milestone.ci95Lower, bigBlindSize, 0)}
                </td>
                <td
                  className={`px-3 py-3 text-sm text-right ${
                    milestone.ci95Upper >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatBB(milestone.ci95Upper, bigBlindSize, 0)}
                </td>
                <td
                  className={`px-3 py-3 text-sm text-right font-medium ${
                    milestone.probabilityOfProfit >= 0.5 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatPercent(milestone.probabilityOfProfit)}
                </td>
                <td className="px-3 py-3 text-sm text-right text-gray-600">
                  {milestone.requiredBankroll === Infinity
                    ? <span className="text-gray-400">N/A</span>
                    : formatBB(milestone.requiredBankroll, bigBlindSize, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-500 leading-relaxed">
        Notice how the 95% confidence interval narrows and probability of profit increases as you play more hands.
      </p>
    </div>
  );
}
