'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalculatorInputs } from '@/lib/types';
import { serializeToUrl, deserializeFromUrl, getInitialInputs } from '@/lib/utils';

/**
 * Hook for managing calculator inputs synced with URL
 */
export function useUrlState() {
  // Always start with defaults to avoid hydration mismatch
  // URL params are applied in useEffect after mount
  const [inputs, setInputsState] = useState<CalculatorInputs>(() => getInitialInputs());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlInputs = getInitialInputs(searchParams);
    setInputsState(urlInputs);
    setIsInitialized(true);
  }, []);

  // Update URL when inputs change (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const queryString = serializeToUrl(inputs);
    const newUrl = `${window.location.pathname}?${queryString}`;

    // Use replaceState to avoid cluttering browser history
    window.history.replaceState(null, '', newUrl);
  }, [inputs, isInitialized]);

  const setInputs = useCallback((newInputs: Partial<CalculatorInputs>) => {
    setInputsState((prev) => ({ ...prev, ...newInputs }));
  }, []);

  const resetInputs = useCallback(() => {
    setInputsState(getInitialInputs());
  }, []);

  return {
    inputs,
    setInputs,
    resetInputs,
    isInitialized,
  };
}
