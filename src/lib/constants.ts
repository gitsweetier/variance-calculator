import { GamePreset } from './types';

// Z-values for confidence intervals
export const Z_70 = 1.036433;  // normalInverseCDF(0.85) for central 70%
export const Z_95 = 1.959964;  // normalInverseCDF(0.975) for central 95%

// Default input values
export const DEFAULTS = {
  winrate: 2.5,
  stdDev: 75,
  hands: 100000,
  mode: 'fast' as const,
} as const;

// Input validation ranges
export const VALIDATION = {
  winrate: { min: -50, max: 50 },
  stdDev: { min: 10, max: 200 },
  hands: { min: 1000, max: 10000000 },
  observedWinrate: { min: -50, max: 50 },
  seed: { min: 1, max: 2147483647 },
  bigBlindSize: { min: 0.01, max: 10000 },
} as const;

// Game presets with typical standard deviations
export const GAME_PRESETS: GamePreset[] = [
  {
    name: 'Custom',
    stdDev: 75,
    range: [10, 200],
    tooltip: 'Enter your own standard deviation',
  },
  {
    name: 'NLH Full Ring (9-max)',
    stdDev: 60,
    range: [50, 75],
    tooltip: 'Typical SD: 50-75 BB/100 for tight full ring games',
  },
  {
    name: 'NLH 6-max',
    stdDev: 75,
    range: [65, 90],
    tooltip: 'Typical SD: 65-90 BB/100 for short-handed games',
  },
  {
    name: 'PLO Full Ring',
    stdDev: 100,
    range: [85, 120],
    tooltip: 'Typical SD: 85-120 BB/100 for pot-limit Omaha',
  },
  {
    name: 'PLO 6-max',
    stdDev: 120,
    range: [100, 150],
    tooltip: 'Typical SD: 100-150 BB/100 for 6-max PLO',
  },
];

// Simulation parameters by mode
export const SIMULATION_PARAMS = {
  turbo: {
    stepSize: 1000,          // Hands per data point (coarse for speed)
    numPaths: 10,            // Fewer sample paths for chat context
    downswingTrials: 1000,   // Minimal trials for fast results
  },
  fast: {
    stepSize: 500,           // Hands per data point
    numPaths: 20,            // Sample paths to display
    downswingTrials: 5000,   // Trials for downswing stats
  },
  accurate: {
    stepSize: 100,           // Hands per data point
    numPaths: 20,            // Sample paths to display
    downswingTrials: 50000,  // Trials for downswing stats
  },
} as const;

// Milestone hand counts for variance summary table
export const MILESTONE_HANDS = [
  10000,
  25000,
  50000,
  100000,
  250000,
  500000,
  1000000,
];

// Downswing thresholds for analysis (in BB)
export const DOWNSWING_THRESHOLDS = [
  2000,
  3000,
  4000,
  5000,
  7500,
  10000,
  15000,
  20000,
  30000,
  50000,
];

// Chart colors - Clean light theme palette
export const COLORS = {
  evLine: '#3b82f6',           // Blue-500
  samplePath: 'rgba(59, 130, 246, 0.3)',  // Blue with transparency
  ci70Fill: 'rgba(59, 130, 246, 0.15)',
  ci95Fill: 'rgba(59, 130, 246, 0.08)',
  detailedPath: '#3b82f6',     // Blue-500
  drawdown: '#f59e0b',         // Amber-500
  profit: '#22c55e',           // Green-500
  loss: '#ef4444',             // Red-500
  grid: 'rgba(0, 0, 0, 0.05)', // Subtle gray
  axis: '#9ca3af',             // Gray-400
  tooltipBg: '#ffffff',        // White
  tooltipBorder: '#e5e7eb',    // Gray-200
};

// Debounce delay for input changes (ms)
export const DEBOUNCE_DELAY = 400;

// URL parameter keys
export const URL_PARAMS = {
  winrate: 'wr',
  stdDev: 'sd',
  hands: 'h',
  observedWinrate: 'obs',
  seed: 'seed',
  mode: 'mode',
  bigBlindSize: 'bb',
} as const;

// Stakes presets for dropdown
export const STAKES_PRESETS = [
  { label: '$0.01/$0.02 (2NL)', value: 0.02 },
  { label: '$0.02/$0.05 (5NL)', value: 0.05 },
  { label: '$0.05/$0.10 (10NL)', value: 0.10 },
  { label: '$0.10/$0.25 (25NL)', value: 0.25 },
  { label: '$0.25/$0.50 (50NL)', value: 0.50 },
  { label: '$0.50/$1 (100NL)', value: 1.00 },
  { label: '$1/$2 (200NL)', value: 2.00 },
  { label: '$2/$5 (500NL)', value: 5.00 },
  { label: '$5/$10 (1KNL)', value: 10.00 },
  { label: '$10/$25', value: 25.00 },
  { label: '$25/$50', value: 50.00 },
];
