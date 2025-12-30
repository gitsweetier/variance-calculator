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
  return <BankrollCalculator winrate={winrate} stdDev={stdDev} stakes={stakes} />;
}

function BankrollCalculator({ winrate, stdDev, stakes }: { winrate: number; stdDev: number; stakes: number }) {
  const [targetRoR, setTargetRoR] = useState(5);
  const [rorText, setRorText] = useState('5%');
  const [isEditing, setIsEditing] = useState(false);

  const bankrollBB = bankrollForRoR(winrate, targetRoR / 100, stdDev);
  const buyins = Math.ceil(bankrollBB / 100);
  const dollars = bankrollBB * stakes;

  // Color based on risk level
  const getRiskColor = (ror: number) => {
    if (ror <= 2) return { bg: 'rgba(22, 163, 74, 0.1)', border: '#16a34a', text: '#16a34a' };
    if (ror <= 5) return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' };
    if (ror <= 10) return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' };
    return { bg: 'rgba(220, 38, 38, 0.1)', border: '#dc2626', text: '#dc2626' };
  };

  const riskColors = getRiskColor(targetRoR);

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
    <div className="block" style={{ height: '100%' }}>
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Bankroll for Target Risk of Ruin
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
        {/* Left: Input */}
        <div>
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
            style={{ width: '100%', maxWidth: '100px' }}
          />
          <input
            type="range"
            min={1}
            max={20}
            value={targetRoR}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTargetRoR(val);
              setRorText(`${val}%`);
            }}
            style={{ width: '100%', marginTop: '0.5rem' }}
          />
        </div>

        {/* Right: Result Card */}
        <div
          style={{
            padding: '1rem',
            background: isFinite(dollars) ? riskColors.bg : 'rgba(220, 38, 38, 0.1)',
            border: `2px solid ${isFinite(dollars) ? riskColors.border : '#dc2626'}`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: isFinite(dollars) ? riskColors.text : '#dc2626',
            }}
          >
            {formatDollars(dollars)}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.25rem' }}>
            {isFinite(buyins) ? `${buyins} buy-ins` : 'N/A'}
          </div>
        </div>
      </div>

      {!isFinite(dollars) && (
        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.75rem' }}>
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
