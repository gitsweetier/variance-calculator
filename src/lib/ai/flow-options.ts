/**
 * Button/chip options for conversational flow data collection
 */

import type { ChipOption, Stakes } from './types';

// =============================================================================
// GAME FORMAT OPTIONS
// =============================================================================

export const GAME_FORMAT_OPTIONS: ChipOption[] = [
  { id: 'nlhe_6max', label: 'NL Hold\'em 6-max' },
  { id: 'nlhe_fullring', label: 'NL Hold\'em Full Ring' },
  { id: 'nlhe_headsup', label: 'NL Hold\'em Heads-Up' },
  { id: 'plo_6max', label: 'PLO 6-max' },
  { id: 'plo_fullring', label: 'PLO Full Ring' },
  { id: 'plo_headsup', label: 'PLO Heads-Up' },
];

// =============================================================================
// ENVIRONMENT OPTIONS
// =============================================================================

export const ENVIRONMENT_OPTIONS: ChipOption[] = [
  { id: 'online', label: 'Online' },
  { id: 'live', label: 'Live' },
];

// =============================================================================
// STAKES OPTIONS
// =============================================================================

export const ONLINE_STAKES_OPTIONS: Stakes[] = [
  { id: '2nl', label: '$0.01/$0.02 (2NL)', bigBlind: 0.02 },
  { id: '5nl', label: '$0.02/$0.05 (5NL)', bigBlind: 0.05 },
  { id: '10nl', label: '$0.05/$0.10 (10NL)', bigBlind: 0.10 },
  { id: '25nl', label: '$0.10/$0.25 (25NL)', bigBlind: 0.25 },
  { id: '50nl', label: '$0.25/$0.50 (50NL)', bigBlind: 0.50 },
  { id: '100nl', label: '$0.50/$1 (100NL)', bigBlind: 1.00 },
  { id: '200nl', label: '$1/$2 (200NL)', bigBlind: 2.00 },
  { id: '500nl', label: '$2.50/$5 (500NL)', bigBlind: 5.00 },
  { id: '1knl', label: '$5/$10 (1KNL)', bigBlind: 10.00 },
  { id: '2knl', label: '$10/$20+ (2KNL+)', bigBlind: 20.00 },
];

export const LIVE_STAKES_OPTIONS: Stakes[] = [
  { id: 'live_1_2', label: '$1/$2', bigBlind: 2 },
  { id: 'live_1_3', label: '$1/$3', bigBlind: 3 },
  { id: 'live_2_5', label: '$2/$5', bigBlind: 5 },
  { id: 'live_5_10', label: '$5/$10', bigBlind: 10 },
  { id: 'live_10_20', label: '$10/$20', bigBlind: 20 },
  { id: 'live_25_50', label: '$25/$50+', bigBlind: 50 },
];

// =============================================================================
// WINRATE KNOWLEDGE OPTIONS
// =============================================================================

export const WINRATE_KNOWLEDGE_OPTIONS: ChipOption[] = [
  {
    id: 'know_exact',
    label: 'I know my winrate',
    description: 'I have tracking software or records',
  },
  {
    id: 'know_approximate',
    label: 'I have a rough idea',
    description: 'I can estimate based on my results',
  },
  {
    id: 'dont_know',
    label: 'I don\'t know',
    description: 'Help me figure it out',
  },
];

// =============================================================================
// SAMPLE SIZE TYPE OPTIONS
// =============================================================================

export const SAMPLE_SIZE_TYPE_OPTIONS: ChipOption[] = [
  {
    id: 'hands',
    label: 'I know my hand count',
    description: 'From tracking software or site stats',
  },
  {
    id: 'hours',
    label: 'I know hours played',
    description: 'I can estimate time spent',
  },
  {
    id: 'neither',
    label: 'Not sure',
    description: 'Help me estimate',
  },
];

// =============================================================================
// EXPERIENCE LEVEL OPTIONS
// =============================================================================

export const EXPERIENCE_LEVEL_OPTIONS: ChipOption[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'semi_pro', label: 'Semi-pro' },
  { id: 'recreational_winner', label: 'Recreational winner' },
  { id: 'recreational_losing', label: 'Recreational - break-even or below' },
];

// =============================================================================
// OVERALL RESULTS OPTIONS
// =============================================================================

export const OVERALL_RESULTS_OPTIONS: ChipOption[] = [
  { id: 'winning', label: 'Winning consistently' },
  { id: 'slightly_ahead', label: 'Slightly ahead' },
  { id: 'breakeven', label: 'Roughly break-even' },
  { id: 'slightly_behind', label: 'Slightly behind' },
  { id: 'losing', label: 'Losing consistently' },
  { id: 'not_sure', label: "Not sure / don't track" },
];

// =============================================================================
// TIME AT STAKES OPTIONS
// =============================================================================

export const TIME_AT_STAKES_OPTIONS: ChipOption[] = [
  { id: 'just_starting', label: 'Just starting out' },
  { id: 'few_months', label: 'A few months' },
  { id: 'six_plus_months', label: '6+ months' },
  { id: 'one_plus_years', label: '1+ years' },
];

// =============================================================================
// RISK TOLERANCE OPTIONS
// =============================================================================

export const RISK_TOLERANCE_OPTIONS: ChipOption[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    description: '1% risk of ruin - very safe',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: '5% risk of ruin - balanced',
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    description: '10% risk of ruin - more risk',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get stakes options based on environment
 */
export function getStakesOptions(environment: 'online' | 'live'): Stakes[] {
  return environment === 'online' ? ONLINE_STAKES_OPTIONS : LIVE_STAKES_OPTIONS;
}

/**
 * Find a stakes option by ID
 */
export function findStakesById(id: string): Stakes | undefined {
  return (
    ONLINE_STAKES_OPTIONS.find((s) => s.id === id) ||
    LIVE_STAKES_OPTIONS.find((s) => s.id === id)
  );
}

/**
 * Find a game format option by ID
 */
export function findGameFormatById(id: string): ChipOption | undefined {
  return GAME_FORMAT_OPTIONS.find((o) => o.id === id);
}

/**
 * Get display label for a game format ID
 */
export function getGameFormatLabel(id: string): string {
  return findGameFormatById(id)?.label || id;
}

/**
 * Get display label for a stakes ID
 */
export function getStakesLabel(id: string): string {
  return findStakesById(id)?.label || id;
}
