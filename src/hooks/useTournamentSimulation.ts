'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  TournamentCalculatorInputs,
  TournamentSimulationResults,
  TournamentWorkerOutput,
} from '@/lib/tournament/types';

interface UseTournamentSimulationResult {
  results: TournamentSimulationResults | null;
  isLoading: boolean;
  progress: number;
  error: string | null;
  runSimulation: (inputs: TournamentCalculatorInputs) => void;
}

export function useTournamentSimulation(): UseTournamentSimulationResult {
  const [results, setResults] = useState<TournamentSimulationResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/tournament.worker.ts', import.meta.url));

    workerRef.current.onmessage = (event: MessageEvent<TournamentWorkerOutput>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        setProgress(msg.progress ?? 0);
        return;
      }
      if (msg.type === 'result') {
        setResults(msg.data ?? null);
        setIsLoading(false);
        setProgress(1);
        return;
      }
      if (msg.type === 'error') {
        setError(msg.error ?? 'Unknown error');
        setIsLoading(false);
        setProgress(0);
        return;
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

  const runSimulation = useCallback((inputs: TournamentCalculatorInputs) => {
    if (!workerRef.current) {
      setError('Worker not initialized');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError(null);

    workerRef.current.postMessage({ type: 'simulateTournament', params: inputs });
  }, []);

  return { results, isLoading, progress, error, runSimulation };
}


