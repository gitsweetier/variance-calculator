'use client';

import { useMemo } from 'react';
import {
  downswingProbabilityBuyIns,
  assessSampleSize,
  generateDownswingTable,
} from '@/lib/ai/calculations';
import { formatNumber } from '@/lib/utils';
import type { ShowResultsAnalysisParams, ToolComponentProps } from '@/lib/ai/types';

const SAMPLE_SIZE_MESSAGES = {
  very_small: {
    label: 'Very Small Sample',
    message: 'With under 10k hands, results are highly uncertain.',
    color: 'text-amber-600',
  },
  small: {
    label: 'Small Sample',
    message: 'With 10-30k hands, there\'s still significant uncertainty.',
    color: 'text-amber-500',
  },
  moderate: {
    label: 'Moderate Sample',
    message: 'With 30-100k hands, results are becoming meaningful.',
    color: 'text-blue-600',
  },
  large: {
    label: 'Large Sample',
    message: 'With 100k+ hands, results are fairly reliable.',
    color: 'text-green-600',
  },
};

export function ResultsAnalysis({
  params,
}: ToolComponentProps<ShowResultsAnalysisParams>) {
  // Defensive checks for undefined params
  const calculationInputs = params?.calculationInputs;

  // Show loading state if params aren't ready yet
  if (!calculationInputs) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Loading results analysis...</p>
      </div>
    );
  }

  const { winrate, stdDev, hands, observedWinrate, buyInsLost } = calculationInputs;

  const analysis = useMemo(() => {
    const sampleCategory = assessSampleSize(hands);
    const sampleInfo = SAMPLE_SIZE_MESSAGES[sampleCategory];

    // Calculate downswing probability if buyInsLost is provided
    let downswingProb: number | null = null;
    if (buyInsLost && buyInsLost > 0) {
      downswingProb = downswingProbabilityBuyIns(winrate, buyInsLost, stdDev);
    }

    // Generate downswing table
    const downswingTable = generateDownswingTable(winrate, stdDev);

    // Calculate expected BB won vs observed
    const expectedBB = (winrate * hands) / 100;

    let observedBB: number | null = null;
    if (observedWinrate !== undefined) {
      observedBB = (observedWinrate * hands) / 100;
    } else if (buyInsLost !== undefined) {
      observedBB = -buyInsLost * 100; // Negative because it's a loss
    }

    // Difference analysis
    let varianceFromExpected: number | null = null;
    if (observedBB !== null) {
      varianceFromExpected = observedBB - expectedBB;
    }

    return {
      sampleCategory,
      sampleInfo,
      expectedBB,
      observedBB,
      varianceFromExpected,
      downswingProb,
      downswingTable,
    };
  }, [winrate, stdDev, hands, observedWinrate, buyInsLost]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Results Analysis</h3>
        <p className="text-sm text-gray-600">
          {formatNumber(hands)} hands at {winrate} bb/100
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Sample size assessment */}
        <div className="rounded-lg bg-white p-3 border border-blue-100">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${analysis.sampleInfo.color}`}>
              {analysis.sampleInfo.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {analysis.sampleInfo.message}
          </p>
        </div>

        {/* Expected vs Observed */}
        {analysis.observedBB !== null && (
          <div className="rounded-lg bg-white p-4 border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-3">Expected vs Actual</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Expected</p>
                <p className={`font-medium ${analysis.expectedBB >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.expectedBB >= 0 ? '+' : ''}{formatNumber(analysis.expectedBB, 0)} BB
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Actual</p>
                <p className={`font-medium ${analysis.observedBB >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.observedBB >= 0 ? '+' : ''}{formatNumber(analysis.observedBB, 0)} BB
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Variance</p>
                <p className={`font-medium ${analysis.varianceFromExpected! >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                  {analysis.varianceFromExpected! >= 0 ? '+' : ''}{formatNumber(analysis.varianceFromExpected!, 0)} BB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Downswing probability */}
        {analysis.downswingProb !== null && buyInsLost && (
          <div className="rounded-lg bg-white p-4 border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-2">Downswing Analysis</h4>
            <p className="text-sm text-gray-600">
              At your winrate of {winrate} bb/100, the probability of experiencing a{' '}
              <span className="font-medium">{buyInsLost} buy-in downswing</span> at any given point is:
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(analysis.downswingProb * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This means over a long career, this type of downswing is{' '}
              {analysis.downswingProb > 0.5 ? 'more likely than not' : 'possible but not guaranteed'}
              {' '}to happen at some point.
            </p>
          </div>
        )}

        {/* Full downswing table */}
        <div className="rounded-lg bg-white p-4 border border-blue-100">
          <h4 className="font-medium text-gray-900 mb-3">Downswing Probabilities</h4>
          <div className="grid grid-cols-4 gap-2 text-center">
            {analysis.downswingTable.slice(0, 8).map(({ buyIns, probability }) => (
              <div
                key={buyIns}
                className={`rounded p-2 ${
                  buyInsLost && buyIns === buyInsLost
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : 'bg-gray-50'
                }`}
              >
                <p className="text-xs text-gray-500">{buyIns} BI</p>
                <p className="font-medium text-gray-900">
                  {(probability * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Parameters used */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            WR: {winrate} bb/100
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            SD: {stdDev} bb/100
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5">
            Hands: {formatNumber(hands)}
          </span>
        </div>
      </div>
    </div>
  );
}
