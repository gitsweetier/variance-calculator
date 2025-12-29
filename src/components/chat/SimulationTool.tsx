'use client';

import { useEffect, useState } from 'react';
import { useSimulation } from '@/hooks/useSimulation';
import { SamplePathsChart } from '@/components/SamplePathsChart';
import { formatNumber, formatBB } from '@/lib/utils';
import type { SimulationParams } from '@/lib/ai/knowledge';

interface SimulationToolProps {
  params: SimulationParams;
}

export function SimulationTool({ params }: SimulationToolProps) {
  const { results, isLoading, progress, error, runSimulation } = useSimulation();
  const [hasStarted, setHasStarted] = useState(false);

  // Defensive check for params
  const winrate = params?.winrate ?? 5;
  const stdDev = params?.stdDev ?? 85;
  const hands = params?.hands ?? 100000;

  // Run simulation on mount - use state instead of ref to work with StrictMode
  useEffect(() => {
    if (!hasStarted && !isLoading && !results && winrate && stdDev && hands) {
      setHasStarted(true);
      runSimulation({
        winrate,
        stdDev,
        hands,
        mode: 'turbo',
      });
    }
  }, [winrate, stdDev, hands, runSimulation, hasStarted, isLoading, results]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Simulation error: {error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-600">
            Running simulation... {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  // Calculate summary stats
  const { analyticalMetrics, confidenceData } = results;
  const finalCI = confidenceData[confidenceData.length - 1];

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium text-gray-900">Variance Simulation</span>
          <span className="text-gray-500">
            {winrate} bb/100 | {stdDev} SD | {formatNumber(hands)} hands
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <SamplePathsChart
          paths={results.samplePaths}
          confidenceData={results.confidenceData}
        />
      </div>

      {/* Summary */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-gray-500">Expected Value</p>
            <p className="font-medium text-gray-900">
              {formatBB(analyticalMetrics.expectedWinnings, undefined, 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">95% CI Range</p>
            <p className="font-medium text-gray-900">
              {formatBB(finalCI?.ci95Lower ?? 0, undefined, 0)} to{' '}
              {formatBB(finalCI?.ci95Upper ?? 0, undefined, 0)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Chance of Profit</p>
            <p className="font-medium text-gray-900">
              {((1 - analyticalMetrics.probabilityOfLoss) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-gray-500">Std Deviation</p>
            <p className="font-medium text-gray-900">
              {formatBB(analyticalMetrics.standardDeviation, undefined, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
