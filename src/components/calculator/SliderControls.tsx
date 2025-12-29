'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ParameterHelpWizard } from './ParameterHelpWizard';
import { STAKES_PRESETS } from '@/lib/constants';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  inlineEdit?: {
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    precision?: number;
    onCommit: (value: number) => void;
  };
  onChange: (value: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  formatValue,
  inlineEdit,
  onChange,
}: SliderControlProps) {
  const displayValue = formatValue ? formatValue(value) : `${value}${unit}`;

  const editConfig = useMemo(() => {
    if (inlineEdit) return inlineEdit;
    return {
      value,
      min,
      max,
      step,
      unit,
      onCommit: onChange,
    };
  }, [inlineEdit, value, min, max, step, unit, onChange]);

  const [isEditing, setIsEditing] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [draft, setDraft] = useState<string>(() => String(editConfig.value));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastChangeSource = useRef<'typed' | 'slider' | 'external'>('external');

  useEffect(() => {
    if (!isEditing) setDraft(String(editConfig.value));
  }, [editConfig.value, isEditing]);

  useEffect(() => {
    // If the value changes externally (e.g. via wizard/help), clear the "custom typed" indicator.
    // Keep it when the change originated from typing (commitEdit).
    if (lastChangeSource.current !== 'typed') setIsCustom(false);
    lastChangeSource.current = 'external';
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      // Small delay ensures the input is mounted.
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isEditing]);

  const startEdit = () => {
    setDraft(String(editConfig.value));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(String(editConfig.value));
    setIsEditing(false);
  };

  const clamp = (val: number, minV: number, maxV: number) => Math.min(maxV, Math.max(minV, val));

  // Keep the slider usable even when the underlying value is outside the slider range.
  const sliderValue = clamp(value, min, max);

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      cancelEdit();
      return;
    }

    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      cancelEdit();
      return;
    }

    // Allow values beyond slider range / step. Indicate "custom" with blue styling.
    const precision =
      typeof editConfig.precision === 'number' && Number.isFinite(editConfig.precision)
        ? Math.max(0, Math.min(6, Math.floor(editConfig.precision)))
        : 2;
    const normalized = Number(n.toFixed(precision));

    lastChangeSource.current = 'typed';
    editConfig.onCommit(normalized);
    setIsCustom(true);
    setIsEditing(false);
  };

  return (
    <div className={`slider-control ${isCustom ? 'slider-control--custom' : ''}`}>
      <div className="slider-control__header">
        <span className="slider-control__label">{label}</span>
        {!isEditing ? (
          <span className="slider-control__value-wrap">
            <span
              className="slider-control__value slider-control__value-text"
              onDoubleClick={startEdit}
              title="Double-click to edit"
            >
              {displayValue}
            </span>
            <button
              type="button"
              className="slider-control__edit-button"
              onClick={startEdit}
              aria-label={`Edit ${label}`}
              title="Edit"
            >
              ✎
            </button>
          </span>
        ) : (
          <span className="slider-control__editor">
            <input
              ref={inputRef}
              type="number"
              value={draft}
              min={editConfig.min}
              max={editConfig.max}
              step={editConfig.step}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              className="slider-control__editor-input"
            />
            {editConfig.unit ? (
              <span className="slider-control__editor-unit">{editConfig.unit}</span>
            ) : null}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => {
          lastChangeSource.current = 'slider';
          setIsCustom(false);
          onChange(Number(e.target.value));
        }}
        className={isCustom ? 'range--custom' : undefined}
      />
      <div className="slider-control__range">
        <span>{formatValue ? formatValue(min) : `${min}${unit}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${unit}`}</span>
      </div>
    </div>
  );
}

interface SliderControlsProps {
  winrate: number;
  stdDev: number;
  sampleSize: number;
  bankroll: number;
  stakes: number;
  onWinrateChange: (value: number) => void;
  onStdDevChange: (value: number) => void;
  onSampleSizeChange: (value: number) => void;
  onBankrollChange: (value: number) => void;
  onStakesChange: (value: number) => void;
}

export function SliderControls({
  winrate,
  stdDev,
  sampleSize,
  bankroll,
  stakes,
  onWinrateChange,
  onStdDevChange,
  onSampleSizeChange,
  onBankrollChange,
  onStakesChange,
}: SliderControlsProps) {
  const formatHands = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 0)}k`;
    }
    return value.toString();
  };

  const formatBuyIns = (value: number) => {
    const buyIns = value / 100;
    const formatted = Number.isInteger(buyIns) ? buyIns.toFixed(0) : buyIns.toFixed(1);
    return `${formatted} buy-ins`;
  };

  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="block col-12">
      {/* Stakes selector row */}
      <div className="slider-controls__stakes-row">
        <label className="slider-controls__stakes-label">
          Stakes
        </label>
        <select
          value={stakes}
          onChange={(e) => onStakesChange(Number(e.target.value))}
          className="slider-controls__stakes-select"
        >
          {STAKES_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
        <span className="slider-controls__stakes-info">
          1 buy-in = 100 BB = ${(stakes * 100).toFixed(2)}
        </span>
        <button
          type="button"
          className="slider-controls__help-me"
          onClick={() => setHelpOpen(true)}
        >
          Help me
        </button>
      </div>

      {/* Sliders row */}
      <div className="slider-controls__grid">
        <SliderControl
          label="Winrate"
          value={winrate}
          min={-10}
          max={30}
          step={0.5}
          unit=" bb/100"
          inlineEdit={{
            value: winrate,
            min: -10,
            max: 30,
            step: 0.01,
            unit: 'bb/100',
            precision: 2,
            onCommit: onWinrateChange,
          }}
          onChange={onWinrateChange}
        />
        <SliderControl
          label="Std Dev"
          value={stdDev}
          min={50}
          max={200}
          step={5}
          unit=" bb/100"
          inlineEdit={{
            value: stdDev,
            min: 50,
            max: 200,
            step: 1,
            unit: 'bb/100',
            precision: 0,
            onCommit: onStdDevChange,
          }}
          onChange={onStdDevChange}
        />
        <SliderControl
          label="Sample Size"
          value={sampleSize}
          min={10000}
          max={500000}
          step={10000}
          formatValue={formatHands}
          inlineEdit={{
            value: sampleSize,
            min: 10000,
            max: 500000,
            step: 1,
            unit: 'hands',
            precision: 0,
            onCommit: onSampleSizeChange,
          }}
          onChange={onSampleSizeChange}
        />
        <SliderControl
          label="Bankroll"
          value={bankroll}
          min={500}
          max={10000}
          step={100}
          formatValue={formatBuyIns}
          inlineEdit={{
            value: bankroll / 100,
            min: 5,
            max: 100,
            step: 1,
            unit: 'buy-ins',
            precision: 0,
            onCommit: (buyIns) => onBankrollChange(buyIns * 100),
          }}
          onChange={onBankrollChange}
        />
      </div>

      <ParameterHelpWizard
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        stakes={stakes}
        onStakesChange={onStakesChange}
        winrate={winrate}
        onWinrateChange={onWinrateChange}
        stdDev={stdDev}
        onStdDevChange={onStdDevChange}
      />
    </div>
  );
}
