'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ChipOption } from '@/lib/ai/types';

interface ChipSelectorProps {
  options: ChipOption[];
  question?: string;
  allowMultiple?: boolean;
  onSelect: (selected: string | string[]) => void;
  disabled?: boolean;
}

export function ChipSelector({
  options,
  question,
  allowMultiple = false,
  onSelect,
  disabled = false,
}: ChipSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleChipClick = (id: string) => {
    if (submitted || disabled) return;

    if (allowMultiple) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      // Single select: immediately submit
      setSelected([id]);
      setSubmitted(true);
      onSelect(id);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      setSubmitted(true);
      onSelect(selected);
    }
  };

  // Submitted state: show selected chips as styled pills
  if (submitted) {
    const selectedOptions = options.filter((o) => selected.includes(o.id));

    return (
      <div className="flex flex-wrap gap-2">
        {selectedOptions.map((option) => (
          <span
            key={option.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-800"
          >
            {option.emoji && <span>{option.emoji}</span>}
            {option.label}
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
        ))}
      </div>
    );
  }

  // Selection state: show clickable chips
  return (
    <div className="space-y-3">
      {question && (
        <p className="text-sm text-gray-700">{question}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleChipClick(option.id)}
              disabled={disabled}
              className={`
                inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium
                transition-all duration-150
                ${
                  isSelected
                    ? 'bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-1'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
              title={option.description}
            >
              {option.emoji && <span>{option.emoji}</span>}
              {option.label}
            </button>
          );
        })}
      </div>
      {allowMultiple && selected.length > 0 && (
        <Button onClick={handleSubmit} size="sm">
          Continue
        </Button>
      )}
    </div>
  );
}
