'use client';

import { useId } from 'react';

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  options?: [string, string]; // [off, on] labels
}

export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  options,
}: ToggleProps) {
  const labelId = useId();
  const ariaLabel = label || (options ? `Toggle between ${options[0]} and ${options[1]}` : 'Toggle switch');

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span id={labelId} className="text-sm font-medium text-gray-700">{label}</span>
      )}
      {options && (
        <span className={`text-sm ${!checked ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
          {options[0]}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={label ? labelId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      {options && (
        <span className={`text-sm ${checked ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
          {options[1]}
        </span>
      )}
    </div>
  );
}
