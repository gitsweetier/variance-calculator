'use client';

import { useCallback, useMemo, useState } from 'react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Toggle } from './ui/Toggle';
import { Tooltip } from './ui/Tooltip';
import { Card } from './ui/Card';
import { CalculatorInputs } from '@/lib/types';
import { GAME_PRESETS, VALIDATION, DEFAULTS } from '@/lib/constants';
import { validateInput } from '@/lib/utils';
import { generateRandomSeed } from '@/lib/math/simulation';

interface InputFormProps {
  inputs: CalculatorInputs;
  onChange: (inputs: Partial<CalculatorInputs>) => void;
  onCalculate: () => void;
  isLoading: boolean;
  errors: Record<string, string | null>;
}

export function InputForm({
  inputs,
  onChange,
  onCalculate,
  isLoading,
  errors,
}: InputFormProps) {
  // Create preset options for select
  const presetOptions = useMemo(
    () =>
      GAME_PRESETS.map((preset) => ({
        value: preset.name,
        label: preset.name,
      })),
    []
  );

  // Find current preset
  const currentPreset = useMemo(
    () => GAME_PRESETS.find((p) => p.stdDev === inputs.stdDev)?.name || 'Custom',
    [inputs.stdDev]
  );

  // Handle preset change
  const handlePresetChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const preset = GAME_PRESETS.find((p) => p.name === e.target.value);
      if (preset) {
        onChange({ stdDev: preset.stdDev });
      }
    },
    [onChange]
  );

  // Handle number input changes
  const handleNumberChange = useCallback(
    (field: keyof CalculatorInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
      onChange({ [field]: value });
    },
    [onChange]
  );

  // Handle integer input changes
  const handleIntChange = useCallback(
    (field: keyof CalculatorInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
      onChange({ [field]: value });
    },
    [onChange]
  );

  // Generate random seed
  const handleRandomizeSeed = useCallback(() => {
    onChange({ seed: generateRandomSeed() });
  }, [onChange]);

  // Clear optional seed
  const handleClearSeed = useCallback(() => {
    onChange({ seed: undefined });
  }, [onChange]);

  // Get current preset tooltip
  const presetTooltip = useMemo(() => {
    const preset = GAME_PRESETS.find((p) => p.name === currentPreset);
    return preset?.tooltip || '';
  }, [currentPreset]);

  // State for collapsible optional section
  const [showOptional, setShowOptional] = useState(false);

  // Check if any optional fields have values
  const hasOptionalValues = inputs.observedWinrate !== undefined ||
                            inputs.seed !== undefined ||
                            inputs.bigBlindSize !== undefined;

  return (
    <Card>
      <div className="space-y-5">
        {/* Game Preset */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select
              label="Game Preset"
              options={presetOptions}
              value={currentPreset}
              onChange={handlePresetChange}
            />
          </div>
          {presetTooltip && (
            <Tooltip content={presetTooltip}>
              <button
                type="button"
                className="mb-2.5 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Preset information"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </Tooltip>
          )}
        </div>

        {/* Winrate and StdDev */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Winrate (BB/100)"
                type="number"
                step="0.1"
                value={inputs.winrate}
                onChange={handleNumberChange('winrate')}
                error={errors.winrate}
                placeholder="e.g., 2.5"
              />
            </div>
            <Tooltip content="Your expected win rate in big blinds per 100 hands. Positive = winning player.">
              <button
                type="button"
                className="mb-2.5 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Winrate information"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </Tooltip>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Std Dev (BB/100)"
                type="number"
                step="1"
                value={inputs.stdDev}
                onChange={handleNumberChange('stdDev')}
                error={errors.stdDev}
                placeholder="e.g., 75"
              />
            </div>
            <Tooltip content="Standard deviation measures how much your results swing. Higher = more variance. Typical range: 60-120 BB/100.">
              <button
                type="button"
                className="mb-2.5 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Standard deviation information"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Hands */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Number of Hands"
              type="number"
              step="1000"
              value={inputs.hands}
              onChange={handleIntChange('hands')}
              error={errors.hands}
              placeholder="e.g., 100000"
              hint="Will be rounded to nearest 100 for simulation"
            />
          </div>
        </div>

        {/* Collapsible Optional Section */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showOptional ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Advanced options</span>
            {hasOptionalValues && !showOptional && (
              <span className="text-xs text-blue-600">(configured)</span>
            )}
          </button>

          {showOptional && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              {/* Observed Winrate (Optional) */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Observed Winrate (BB/100)"
                    type="number"
                    step="0.1"
                    value={inputs.observedWinrate ?? ''}
                    onChange={handleNumberChange('observedWinrate')}
                    error={errors.observedWinrate}
                    placeholder="Your actual sample winrate"
                  />
                </div>
                <Tooltip content="Your actual observed winrate from your sample. Used to calculate the probability of running this hot/cold given your true winrate.">
                  <button
                    type="button"
                    className="mb-2.5 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Observed winrate information"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </Tooltip>
              </div>

              {/* Random Seed (Optional) */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Random Seed"
                    type="number"
                    step="1"
                    value={inputs.seed ?? ''}
                    onChange={handleIntChange('seed')}
                    error={errors.seed}
                    placeholder="Leave blank for random"
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRandomizeSeed}
                  className="mb-2.5"
                  title="Generate random seed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </Button>
                {inputs.seed !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSeed}
                    className="mb-2.5"
                    title="Clear seed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                )}
              </div>

              {/* Dollar Conversion (Optional) */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Big Blind Size ($)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={inputs.bigBlindSize ?? ''}
                    onChange={handleNumberChange('bigBlindSize')}
                    error={errors.bigBlindSize}
                    placeholder="e.g., 2 for $1/$2"
                    hint="Show results in dollars"
                  />
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center justify-between pt-2">
                <Toggle
                  label="Mode:"
                  checked={inputs.mode === 'accurate'}
                  onChange={(checked) => onChange({ mode: checked ? 'accurate' : 'fast' })}
                  options={['Fast', 'Accurate']}
                />
                <Tooltip content="Fast mode uses 500-hand steps and 5,000 downswing trials. Accurate mode uses 100-hand steps and 50,000 trials for more precision.">
                  <button
                    type="button"
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Compute mode information"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <Button
          onClick={onCalculate}
          disabled={isLoading || Object.values(errors).some((e) => e !== null)}
          className="w-full mt-2"
          size="lg"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculating...
            </span>
          ) : (
            'Calculate Variance'
          )}
        </Button>
      </div>
    </Card>
  );
}
