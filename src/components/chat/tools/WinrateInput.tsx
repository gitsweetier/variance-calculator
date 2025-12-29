'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipSelector } from './ChipSelector';
import { WINRATE_KNOWLEDGE_OPTIONS } from '@/lib/ai/flow-options';
import type { AskWinrateParams, ToolComponentProps } from '@/lib/ai/types';

type Mode = 'select' | 'input' | 'submitted';

export function WinrateInput({
  params,
  onResponse,
}: ToolComponentProps<AskWinrateParams>) {
  const showInput = params?.showInput ?? false;
  const showDontKnow = params?.showDontKnow ?? true;
  const question = params?.question ?? 'What is your winrate?';

  const [mode, setMode] = useState<Mode>(showInput ? 'input' : 'select');
  const [value, setValue] = useState('');
  const [submittedValue, setSubmittedValue] = useState('');

  const handleKnowledgeSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;

    if (id === 'know_exact' || id === 'know_approximate') {
      setMode('input');
    } else {
      // "I don't know" path
      setSubmittedValue("I don't know my winrate");
      setMode('submitted');
      onResponse("[WINRATE:unknown] I don't know my winrate");
    }
  };

  const handleSubmit = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setSubmittedValue(`${numValue} bb/100`);
      setMode('submitted');
      onResponse(`[WINRATE:${numValue}] ${numValue} bb/100`);
    }
  };

  const handleDontKnow = () => {
    setSubmittedValue("I don't know my exact winrate");
    setMode('submitted');
    onResponse("[WINRATE:unknown] I don't know my exact winrate");
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

  // Knowledge selection state
  if (mode === 'select') {
    return (
      <ChipSelector
        options={WINRATE_KNOWLEDGE_OPTIONS}
        question={question}
        onSelect={handleKnowledgeSelect}
      />
    );
  }

  // Input state
  return (
    <div className="space-y-3">
      {question && (
        <p className="text-sm text-gray-700">{question}</p>
      )}
      <div className="flex items-end gap-2">
        <div className="w-28">
          <Input
            type="number"
            step="0.1"
            placeholder="e.g., 2.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <span className="pb-2 text-sm text-gray-500">bb/100</span>
        <Button
          onClick={handleSubmit}
          disabled={!value || isNaN(parseFloat(value))}
          size="sm"
        >
          Confirm
        </Button>
      </div>
      {showDontKnow && (
        <button
          onClick={handleDontKnow}
          className="text-sm text-blue-600 hover:underline"
        >
          I&apos;m not sure of my winrate
        </button>
      )}
    </div>
  );
}
