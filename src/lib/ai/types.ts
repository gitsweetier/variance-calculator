/**
 * Types for the guided conversational flow system
 */

// =============================================================================
// GAME & ENVIRONMENT TYPES
// =============================================================================

export type GameFormat =
  | 'nlhe_6max'
  | 'nlhe_fullring'
  | 'nlhe_headsup'
  | 'plo_6max'
  | 'plo_fullring'
  | 'mtt'
  | 'sng';

export type Environment = 'online' | 'live';

export interface Stakes {
  id: string;
  label: string; // e.g., "$1/$2", "$0.25/$0.50"
  bigBlind: number; // in dollars
}

// =============================================================================
// INTENT & FLOW TYPES
// =============================================================================

export type Intent =
  | 'bankroll_sizing'
  | 'results_analysis'
  | 'game_selection'
  | 'unclear';

export type WinrateSource = 'provided' | 'estimated' | 'unknown';

// =============================================================================
// ASSESSMENT TYPES
// =============================================================================

export interface AssessmentFlags {
  sampleSizeAdequate: boolean | null;
  winrateRealistic: boolean | null;
  experienceLevel: 'beginner' | 'intermediate' | 'experienced' | null;
  winrateTrustLevel: 'high' | 'medium' | 'low' | null;
}

export type SampleSizeCategory = 'very_small' | 'small' | 'moderate' | 'large';
export type WinrateRealism = 'realistic' | 'high' | 'very_high' | 'unrealistic';

// =============================================================================
// COLLECTED DATA (derived from conversation)
// =============================================================================

export interface CollectedData {
  // Intent classification
  intent?: Intent;

  // Game context
  gameFormat?: GameFormat;
  environment?: Environment;
  stakes?: Stakes;

  // Performance data
  winrate?: number;
  winrateSource?: WinrateSource;
  sampleSize?: {
    hands?: number;
    hours?: number;
  };

  // For results analysis
  observedResults?: {
    profit?: number;
    buyInsLost?: number;
    observedWinrate?: number;
  };

  // Assessment
  flags: AssessmentFlags;

  // Derived values (populated by calculations)
  derived?: {
    stdDev?: number;
    handsPerHour?: number;
    estimatedHands?: number;
    estimatedWinrate?: number;
  };
}

// =============================================================================
// TOOL COMPONENT PROPS
// =============================================================================

export interface ChipOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

export interface ToolComponentProps<T = Record<string, unknown>> {
  params: T;
  onResponse: (response: string) => void;
}

// =============================================================================
// SPECIFIC TOOL PARAM TYPES
// =============================================================================

export interface AskGameFormatParams {
  question: string;
  allowMultiple?: boolean;
}

export interface AskEnvironmentParams {
  question: string;
}

export interface AskStakesParams {
  question: string;
  environment: Environment;
}

export interface AskWinrateParams {
  question: string;
  showInput: boolean;
  showDontKnow?: boolean;
}

export interface AskSampleSizeParams {
  question: string;
  type: 'hands' | 'hours' | 'ask';
}

export interface AskExperienceLevelParams {
  question?: string;
}

export interface AskOverallResultsParams {
  question?: string;
}

export interface AskTimeAtStakesParams {
  question?: string;
}

export interface ShowAssessmentParams {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'insight';
  flags?: Array<{
    label: string;
    value: string;
    status: 'good' | 'warning' | 'neutral';
  }>;
}

export interface BankrollCalculationInputs {
  winrate: number;
  stdDev: number;
  environment: Environment;
  stakes: string;
  bigBlind: number;
}

export interface ShowBankrollRecommendationParams {
  calculationInputs: BankrollCalculationInputs;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export interface ResultsCalculationInputs {
  winrate: number;
  stdDev: number;
  hands: number;
  observedWinrate?: number;
  buyInsLost?: number;
}

export interface ShowResultsAnalysisParams {
  calculationInputs: ResultsCalculationInputs;
}
