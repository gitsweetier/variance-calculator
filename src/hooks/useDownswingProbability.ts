'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DownswingProbabilityInputs, DownswingProbabilityResult, WorkerInput, WorkerOutput } from '@/lib/types';

interface UseDownswingProbabilityResult {
  result: DownswingProbabilityResult | null;
  isLoading: boolean;
  progress: number;
  error: string | null;
  runDownswingProbability: (inputs: DownswingProbabilityInputs) => void;
}

/**
 * Hook for estimating P(max drawdown ≥ threshold) over a finite hand horizon,
 * computed in the existing simulation web worker.
 */
export function useDownswingProbability(): UseDownswingProbabilityResult {
  const [result, setResult] = useState<DownswingProbabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url));

    workerRef.current.onmessage = (event: MessageEvent<WorkerOutput>) => {
      const { type, downswingProbability, error: workerError, progress: workerProgress } = event.data;

      switch (type) {
        case 'downswingProbabilityResult':
          setResult(downswingProbability ?? null);
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

  const runDownswingProbability = useCallback((inputs: DownswingProbabilityInputs) => {
    if (!workerRef.current) {
      setError('Worker not initialized');
      return;
    }

    setResult(null);
    setIsLoading(true);
    setProgress(0);
    setError(null);

    const msg: WorkerInput = {
      type: 'downswingProbability',
      params: inputs,
    };

    workerRef.current.postMessage(msg);
  }, []);

  return {
    result,
    isLoading,
    progress,
    error,
    runDownswingProbability,
  };
}


