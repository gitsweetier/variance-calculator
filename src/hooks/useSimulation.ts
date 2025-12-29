'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CalculatorInputs, SimulationResults, WorkerOutput } from '@/lib/types';

interface UseSimulationResult {
  results: SimulationResults | null;
  isLoading: boolean;
  progress: number;
  error: string | null;
  runSimulation: (inputs: CalculatorInputs) => void;
}

/**
 * Hook for managing Web Worker simulation
 */
export function useSimulation(): UseSimulationResult {
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    // Create worker using URL constructor for compatibility
    workerRef.current = new Worker(
      new URL('../workers/simulation.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event: MessageEvent<WorkerOutput>) => {
      const { type, data, error: workerError, progress: workerProgress } = event.data;

      switch (type) {
        case 'result':
          setResults(data ?? null);
          setIsLoading(false);
          setProgress(1);
          break;
        case 'error':
          setError(workerError ?? 'Unknown error occurred');
          setIsLoading(false);
          setProgress(0);
          break;
        case 'progress':
          setProgress(workerProgress ?? 0);
          break;
      }
    };

    workerRef.current.onerror = (event) => {
      setError(`Worker error: ${event.message}`);
      setIsLoading(false);
      setProgress(0);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const runSimulation = useCallback((inputs: CalculatorInputs) => {
    if (!workerRef.current) {
      setError('Worker not initialized');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    workerRef.current.postMessage({
      type: 'simulate',
      params: inputs,
    });
  }, []);

  return {
    results,
    isLoading,
    progress,
    error,
    runSimulation,
  };
}
