'use client';

import { useId } from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  id?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  id: providedId,
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = providedId || generatedId;

  const displayLabel = prefix || suffix
    ? `${label}${prefix ? ` (${prefix})` : ''}${suffix ? ` ${suffix}` : ''}`
    : label;

  return (
    <div>
      <label htmlFor={inputId} className="slider-control__label">{displayLabel}</label>
      <input
        id={inputId}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={displayLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          width: '100%',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          fontWeight: 700,
          padding: '0.5rem',
          border: '2px solid black',
          background: 'white',
        }}
      />
    </div>
  );
}
