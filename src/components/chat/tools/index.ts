/**
 * Tool Component Registry
 * Maps tool type strings to their React components
 */

export { ChipSelector } from './ChipSelector';
export { GameFormatSelector } from './GameFormatSelector';
export { EnvironmentSelector } from './EnvironmentSelector';
export { StakesSelector } from './StakesSelector';
export { WinrateInput } from './WinrateInput';
export { SampleSizeInput } from './SampleSizeInput';
export { ExperienceLevelSelector } from './ExperienceLevelSelector';
export { OverallResultsSelector } from './OverallResultsSelector';
export { TimeAtStakesSelector } from './TimeAtStakesSelector';
export { AssessmentCard } from './AssessmentCard';
export { BankrollRecommendation } from './BankrollRecommendation';
export { ResultsAnalysis } from './ResultsAnalysis';

// Import SimulationTool from its current location
import { SimulationTool } from '../SimulationTool';
import { GameFormatSelector } from './GameFormatSelector';
import { EnvironmentSelector } from './EnvironmentSelector';
import { StakesSelector } from './StakesSelector';
import { WinrateInput } from './WinrateInput';
import { SampleSizeInput } from './SampleSizeInput';
import { ExperienceLevelSelector } from './ExperienceLevelSelector';
import { OverallResultsSelector } from './OverallResultsSelector';
import { TimeAtStakesSelector } from './TimeAtStakesSelector';
import { AssessmentCard } from './AssessmentCard';
import { BankrollRecommendation } from './BankrollRecommendation';
import { ResultsAnalysis } from './ResultsAnalysis';

/**
 * Registry mapping tool type strings to components
 * Tool types are formatted as 'tool-{toolName}' by AI SDK
 */
export const TOOL_COMPONENTS = {
  'tool-askGameFormat': GameFormatSelector,
  'tool-askEnvironment': EnvironmentSelector,
  'tool-askStakes': StakesSelector,
  'tool-askWinrate': WinrateInput,
  'tool-askSampleSize': SampleSizeInput,
  'tool-askExperienceLevel': ExperienceLevelSelector,
  'tool-askOverallResults': OverallResultsSelector,
  'tool-askTimeAtStakes': TimeAtStakesSelector,
  'tool-showAssessment': AssessmentCard,
  'tool-showBankrollRecommendation': BankrollRecommendation,
  'tool-showResultsAnalysis': ResultsAnalysis,
  'tool-generateSimulation': SimulationTool,
} as const;

export type ToolType = keyof typeof TOOL_COMPONENTS;
