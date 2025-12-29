'use client';

import { useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { AnalyticalMetrics, CalculatorInputs } from '@/lib/types';
import { formatBB, formatPercent, formatNumber, createShareableUrl, copyToClipboard } from '@/lib/utils';

interface KeyResultsProps {
  metrics: AnalyticalMetrics | null;
  inputs: CalculatorInputs;
  roundedHands: number;
  isLoading: boolean;
  progress: number;
}

export function KeyResults({
  metrics,
  inputs,
  roundedHands,
  isLoading,
  progress,
}: KeyResultsProps) {
  const { bigBlindSize } = inputs;

  const handleCopyLink = async () => {
    const url = createShareableUrl(inputs);
    const success = await copyToClipboard(url);
    if (success) {
      // Could add a toast notification here
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <Card className="sticky top-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Key Results</h3>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <svg className="w-16 h-16 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Running simulation...
              </p>
              <p className="text-2xl font-semibold text-blue-600 mt-1">
                {formatPercent(progress, 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="sticky top-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Key Results</h3>
          <div className="py-8 text-center">
            <p className="text-gray-400 text-sm">
              Enter parameters and click Calculate to see your variance analysis.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Key Results</h3>
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          After {formatNumber(roundedHands)} hands
        </p>

        <div className="space-y-3">
          {/* Expected Winnings */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Expected Winnings</span>
            <span
              className={`font-semibold text-lg ${
                metrics.expectedWinnings >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {metrics.expectedWinnings >= 0 ? '+' : ''}
              {formatBB(metrics.expectedWinnings, bigBlindSize, 0)}
            </span>
          </div>

          {/* 95% CI */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">95% Confidence</span>
            <span className="font-medium text-gray-900 text-sm">
              {formatBB(metrics.confidenceInterval95.lower, bigBlindSize, 0)}
              <span className="text-gray-400 mx-1">to</span>
              {formatBB(metrics.confidenceInterval95.upper, bigBlindSize, 0)}
            </span>
          </div>

          {/* Standard Error */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Standard Error</span>
            <span className="font-medium text-gray-900">
              {metrics.standardError.toFixed(2)} <span className="text-xs text-gray-400">BB/100</span>
            </span>
          </div>

          {/* Probability of Loss */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Probability of Loss</span>
            <span
              className={`font-semibold ${
                metrics.probabilityOfLoss > 0.5 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {formatPercent(metrics.probabilityOfLoss)}
            </span>
          </div>

          {/* Required Bankroll */}
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Min Bankroll <span className="text-xs">(5% RoR)</span></span>
            <span className="font-medium text-gray-900">
              {metrics.minimumBankroll5Percent === Infinity
                ? <span className="text-gray-400">N/A</span>
                : formatBB(metrics.minimumBankroll5Percent, bigBlindSize, 0)}
            </span>
          </div>

          {/* Observed Winrate Probabilities */}
          {metrics.probabilityAboveObserved !== undefined && (
            <>
              <div className="pt-3 border-t border-blue-100">
                <p className="text-xs text-blue-600 mb-3">
                  Given true winrate of {inputs.winrate} BB/100:
                </p>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  P(run &ge; {inputs.observedWinrate})
                </span>
                <span className="font-medium text-gray-900">
                  {formatPercent(metrics.probabilityAboveObserved)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-600">
                  P(run &lt; {inputs.observedWinrate})
                </span>
                <span className="font-medium text-gray-900">
                  {formatPercent(metrics.probabilityBelowObserved!)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* What this means */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-600">Interpretation:</strong> The 95% CI means there&apos;s a 95% chance your actual winnings fall within that range. A lower probability of loss indicates more certainty in positive expectation.
          </p>
        </div>
      </div>
    </Card>
  );
}
