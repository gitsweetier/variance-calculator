'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelector } from './ChipSelector';
import { SAMPLE_SIZE_TYPE_OPTIONS } from '@/lib/ai/flow-options';
import type { AskSampleSizeParams, ToolComponentProps } from '@/lib/ai/types';

type Mode = 'select' | 'hands_input' | 'hours_input' | 'submitted';

export function SampleSizeInput({
  params,
  onResponse,
}: ToolComponentProps<AskSampleSizeParams>) {
  const inputType = params?.type ?? 'ask';
  const question = params?.question ?? 'How much have you played?';

  // Determine initial mode based on params.type
  const getInitialMode = (): Mode => {
    if (inputType === 'hands') return 'hands_input';
    if (inputType === 'hours') return 'hours_input';
    return 'select';
  };

  const [mode, setMode] = useState<Mode>(getInitialMode());
  const [value, setValue] = useState('');
  const [submittedValue, setSubmittedValue] = useState('');

  const handleTypeSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;

    if (id === 'hands') {
      setMode('hands_input');
    } else if (id === 'hours') {
      setMode('hours_input');
    } else {
      // "Not sure" path
      setSubmittedValue("I'm not sure of my sample size");
      setMode('submitted');
      onResponse("[SAMPLE:unknown] I'm not sure of my sample size");
    }
  };

  const handleSubmitHands = () => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      const formatted = numValue.toLocaleString();
      setSubmittedValue(`${formatted} hands`);
      setMode('submitted');
      onResponse(`[SAMPLE:hands:${numValue}] ${formatted} hands`);
    }
  };

  const handleSubmitHours = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setSubmittedValue(`${numValue} hours`);
      setMode('submitted');
      onResponse(`[SAMPLE:hours:${numValue}] ${numValue} hours`);
    }
  };

  // Submitted state
  if (mode === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800">
        {submittedValue}
        <svg
          className="h-4 w-4 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    );
  }

  // Type selection state
  if (mode === 'select') {
    return (
      <ChipSelector
        options={SAMPLE_SIZE_TYPE_OPTIONS}
        question={question}
        onSelect={handleTypeSelect}
      />
    );
  }

  // Hands input state
  if (mode === 'hands_input') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          {question || 'How many hands have you played?'}
        </p>
        <div className="flex items-end gap-2">
          <div className="w-36">
            <Input
              type="number"
              placeholder="e.g., 50000"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <span className="pb-2 text-sm text-gray-500">hands</span>
          <Button
            onClick={handleSubmitHands}
            disabled={!value || isNaN(parseInt(value, 10)) || parseInt(value, 10) <= 0}
            size="sm"
          >
            Confirm
          </Button>
        </div>
      </div>
    );
  }

  // Hours input state
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">
        {question || 'How many hours have you played?'}
      </p>
      <div className="flex items-end gap-2">
        <div className="w-28">
          <Input
            type="number"
            step="0.5"
            placeholder="e.g., 100"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <span className="pb-2 text-sm text-gray-500">hours</span>
        <Button
          onClick={handleSubmitHours}
          disabled={!value || isNaN(parseFloat(value)) || parseFloat(value) <= 0}
          size="sm"
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
