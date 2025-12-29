'use client';

import { useState } from 'react';
import {
  bankrollForRoR,
  handsForAccuracy,
} from '@/lib/math/statistics';

interface PlanningCalculatorsProps {
  winrate: number;
  stdDev: number;
  stakes: number;
}

function formatHands(h: number): string {
  if (!isFinite(h)) return '∞';
  if (h >= 1000000) return `${(h / 1000000).toFixed(1)}M`;
  if (h >= 1000) return `${Math.round(h / 1000)}k`;
  return h.toLocaleString();
}

function formatDollars(dollars: number): string {
  if (!isFinite(dollars)) return '∞';
  if (Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

export function PlanningCalculators({ winrate, stdDev, stakes }: PlanningCalculatorsProps) {
  return (
    <div className="grid-12">
      <div className="col-12">
        <BankrollCalculator winrate={winrate} stdDev={stdDev} stakes={stakes} />
      </div>
    </div>
  );
}

function BankrollCalculator({ winrate, stdDev, stakes }: { winrate: number; stdDev: number; stakes: number }) {
  const [targetRoR, setTargetRoR] = useState(5);
  const [rorText, setRorText] = useState('5%');
  const [isEditing, setIsEditing] = useState(false);

  const bankrollBB = bankrollForRoR(winrate, targetRoR / 100, stdDev);
  const buyins = Math.ceil(bankrollBB / 100);
  const dollars = bankrollBB * stakes;

  const handleFocus = () => {
    setIsEditing(true);
    setRorText(String(targetRoR));
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseInt(rorText, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
      setTargetRoR(parsed);
      setRorText(`${parsed}%`);
    } else {
      setRorText(`${targetRoR}%`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setRorText(val);
  };

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Bankroll for Target Risk of Ruin
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.625rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}
        >
          Target Risk of Ruin
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={rorText}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{ width: '80px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
          className={isFinite(dollars) ? '' : 'text-negative'}
        >
          {formatDollars(dollars)}
        </span>
      </div>
      <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>
        = {isFinite(buyins) ? buyins : '∞'} buy-ins
      </div>
      {!isFinite(dollars) && (
        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>
          Requires positive winrate
        </div>
      )}
    </div>
  );
}

export function AccuracyCalculator({ stdDev }: { stdDev: number }) {
  const [accuracy, setAccuracy] = useState(2.5);

  const hands = handsForAccuracy(stdDev, accuracy);

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Hands Until You Know
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.625rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}
        >
          Desired Accuracy (± bb/100)
        </label>
        <input
          type="number"
          value={accuracy}
          onChange={(e) => setAccuracy(Number(e.target.value))}
          step={0.5}
          min={0.5}
          max={10}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {formatHands(hands)}
        </span>
        <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>hands needed</span>
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem' }}>
        To know your winrate within ±{accuracy} bb/100 (95% confidence)
      </div>
    </div>
  );
}
