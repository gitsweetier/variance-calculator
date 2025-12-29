'use client';

import { DownswingStats } from '@/lib/types';
import { formatNumber, formatBB, formatPercent, formatHandsShort } from '@/lib/utils';

interface DownswingTablesProps {
  stats: DownswingStats | null;
  bigBlindSize?: number;
}

export function DownswingTables({ stats, bigBlindSize }: DownswingTablesProps) {
  if (!stats) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400">Run a simulation to see downswing statistics</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Max Drawdown</p>
          <p className="text-xl font-semibold text-amber-600">
            {formatBB(stats.averageMaxDrawdown, bigBlindSize, 0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Worst Drawdown</p>
          <p className="text-xl font-semibold text-red-600">
            {formatBB(stats.worstMaxDrawdown, bigBlindSize, 0)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Recovery</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatHandsShort(Math.round(stats.averageRecoveryHands))}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Longest Recovery</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatHandsShort(stats.longestRecovery)}
          </p>
        </div>
      </div>

      {/* Probability table */}
      <div className="overflow-x-auto mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Probability of Experiencing Downswing
        </h4>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Downswing Size
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probability
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.probabilities.map((prob, idx) => {
              const count = stats.expectedCounts[idx];
              const threshold = prob.threshold;

              // Color code by probability severity
              let probColor = 'text-green-600';
              if (prob.probability > 0.5) probColor = 'text-blue-600';
              if (prob.probability > 0.75) probColor = 'text-amber-600';
              if (prob.probability > 0.9) probColor = 'text-red-600';

              return (
                <tr key={threshold}>
                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                    &ge; {formatBB(threshold, bigBlindSize, 0)}
                  </td>
                  <td className={`px-3 py-3 text-sm text-right font-medium ${probColor}`}>
                    {formatPercent(prob.probability)}
                  </td>
                  <td className="px-3 py-3 text-sm text-right text-gray-600">
                    {count.count.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        This shows how likely you are to experience downswings of various sizes. Even winning players experience significant downswings.
      </p>
    </div>
  );
}
