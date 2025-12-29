/**
 * Utility functions for formatting and helpers
 */

import { CalculatorInputs, SimulationPath, ConfidencePoint } from './types';
import { URL_PARAMS, DEFAULTS } from './constants';

/**
 * Format a number with thousands separators
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as BB with optional $ conversion
 */
export function formatBB(
  value: number,
  bigBlindSize?: number,
  decimals: number = 0
): string {
  if (bigBlindSize && bigBlindSize > 0) {
    const dollarValue = value * bigBlindSize;
    return `$${formatNumber(dollarValue, decimals)}`;
  }
  return `${formatNumber(value, decimals)} BB`;
}

/**
 * Format a number as BB/100
 */
export function formatBBPer100(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)} BB/100`;
}

/**
 * Format a probability as a percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format hands count (e.g., "100k", "1M")
 */
export function formatHandsShort(hands: number): string {
  if (hands >= 1000000) {
    return `${(hands / 1000000).toFixed(hands % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (hands >= 1000) {
    return `${(hands / 1000).toFixed(hands % 1000 === 0 ? 0 : 1)}k`;
  }
  return hands.toString();
}

/**
 * Serialize calculator inputs to URL query params
 */
export function serializeToUrl(inputs: CalculatorInputs): string {
  const params = new URLSearchParams();

  params.set(URL_PARAMS.winrate, inputs.winrate.toString());
  params.set(URL_PARAMS.stdDev, inputs.stdDev.toString());
  params.set(URL_PARAMS.hands, inputs.hands.toString());
  params.set(URL_PARAMS.mode, inputs.mode);

  if (inputs.observedWinrate !== undefined) {
    params.set(URL_PARAMS.observedWinrate, inputs.observedWinrate.toString());
  }
  if (inputs.seed !== undefined) {
    params.set(URL_PARAMS.seed, inputs.seed.toString());
  }
  if (inputs.bigBlindSize !== undefined) {
    params.set(URL_PARAMS.bigBlindSize, inputs.bigBlindSize.toString());
  }

  return params.toString();
}

/**
 * Deserialize URL query params to calculator inputs
 */
export function deserializeFromUrl(searchParams: URLSearchParams): Partial<CalculatorInputs> {
  const inputs: Partial<CalculatorInputs> = {};

  const winrate = searchParams.get(URL_PARAMS.winrate);
  if (winrate) inputs.winrate = parseFloat(winrate);

  const stdDev = searchParams.get(URL_PARAMS.stdDev);
  if (stdDev) inputs.stdDev = parseFloat(stdDev);

  const hands = searchParams.get(URL_PARAMS.hands);
  if (hands) inputs.hands = parseInt(hands, 10);

  const observedWinrate = searchParams.get(URL_PARAMS.observedWinrate);
  if (observedWinrate) inputs.observedWinrate = parseFloat(observedWinrate);

  const seed = searchParams.get(URL_PARAMS.seed);
  if (seed) inputs.seed = parseInt(seed, 10);

  const mode = searchParams.get(URL_PARAMS.mode);
  if (mode === 'turbo' || mode === 'fast' || mode === 'accurate') inputs.mode = mode;

  const bigBlindSize = searchParams.get(URL_PARAMS.bigBlindSize);
  if (bigBlindSize) inputs.bigBlindSize = parseFloat(bigBlindSize);

  return inputs;
}

/**
 * Create a complete URL with query params
 */
export function createShareableUrl(inputs: CalculatorInputs): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const queryString = serializeToUrl(inputs);
  return `${baseUrl}?${queryString}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate CSV content from sample paths
 */
export function generateSamplePathsCSV(
  paths: SimulationPath[],
  confidenceData: ConfidencePoint[]
): string {
  if (paths.length === 0) return '';

  const numPoints = paths[0].hands.length;
  const headers = ['Hands'];

  for (let i = 0; i < paths.length; i++) {
    headers.push(`Path${i + 1}`);
  }
  headers.push('EV', 'CI95_Lower', 'CI95_Upper', 'CI70_Lower', 'CI70_Upper');

  const rows: string[] = [headers.join(',')];

  for (let i = 0; i < numPoints; i++) {
    const hands = paths[0].hands[i];
    const row: (string | number)[] = [hands];

    for (const path of paths) {
      row.push(path.winnings[i].toFixed(2));
    }

    // Find matching confidence data point
    const ciPoint = confidenceData.find(p => p.hands === hands) ||
      confidenceData.find(p => Math.abs(p.hands - hands) < 100);

    if (ciPoint) {
      row.push(
        ciPoint.ev.toFixed(2),
        ciPoint.ci95Lower.toFixed(2),
        ciPoint.ci95Upper.toFixed(2),
        ciPoint.ci70Lower.toFixed(2),
        ciPoint.ci70Upper.toFixed(2)
      );
    } else {
      row.push('', '', '', '', '');
    }

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Generate CSV content from detailed run
 */
export function generateDetailedRunCSV(path: SimulationPath): string {
  const headers = ['Hands', 'Winnings', 'Peak', 'Drawdown'];
  const rows: string[] = [headers.join(',')];

  for (let i = 0; i < path.hands.length; i++) {
    rows.push([
      path.hands[i],
      path.winnings[i].toFixed(2),
      path.peaks[i].toFixed(2),
      path.drawdowns[i].toFixed(2),
    ].join(','));
  }

  return rows.join('\n');
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate input value against constraints
 */
export function validateInput(
  value: number | undefined,
  constraints: { min: number; max: number },
  required: boolean = true
): string | null {
  if (value === undefined || isNaN(value)) {
    return required ? 'This field is required' : null;
  }
  if (value < constraints.min) {
    return `Minimum value is ${constraints.min}`;
  }
  if (value > constraints.max) {
    return `Maximum value is ${constraints.max}`;
  }
  return null;
}

/**
 * Get default inputs merged with any URL params
 */
export function getInitialInputs(searchParams?: URLSearchParams): CalculatorInputs {
  const urlInputs = searchParams ? deserializeFromUrl(searchParams) : {};

  return {
    winrate: urlInputs.winrate ?? DEFAULTS.winrate,
    stdDev: urlInputs.stdDev ?? DEFAULTS.stdDev,
    hands: urlInputs.hands ?? DEFAULTS.hands,
    mode: urlInputs.mode ?? DEFAULTS.mode,
    observedWinrate: urlInputs.observedWinrate,
    seed: urlInputs.seed,
    bigBlindSize: urlInputs.bigBlindSize,
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}
