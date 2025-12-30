'use client';

import { useState } from 'react';
import { bankrollForRoR } from '@/lib/math/statistics';

interface BankrollRecommendationsProps {
  winrate: number;
  stdDev: number;
  stakes: number;
}

const ROR_TARGETS = [
  { ror: 0.01, label: '1%', description: 'Very conservative' },
  { ror: 0.02, label: '2%', description: 'Conservative' },
  { ror: 0.05, label: '5%', description: 'Standard' },
  { ror: 0.10, label: '10%', description: 'Aggressive' },
];

function formatDollars(dollars: number): string {
  if (!isFinite(dollars)) return '∞';
  if (Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

export function BankrollRecommendations({ winrate, stdDev, stakes }: BankrollRecommendationsProps) {
  const [customRoR, setCustomRoR] = useState(5);

  const recommendations = ROR_TARGETS.map(({ ror, label, description }) => {
    const bankrollBB = bankrollForRoR(winrate, ror, stdDev);
    const buyIns = Math.ceil(bankrollBB / 100);
    const dollars = bankrollBB * stakes;

    return {
      ror,
      label,
      description,
      buyIns,
      dollars,
      isInfinite: !isFinite(bankrollBB),
    };
  });

  // Custom slider calculation
  const customBankrollBB = bankrollForRoR(winrate, customRoR / 100, stdDev);
  const customBuyIns = Math.ceil(customBankrollBB / 100);
  const customDollars = customBankrollBB * stakes;

  // Color based on risk level for slider
  const getSliderColor = (ror: number) => {
    if (ror <= 2) return { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' };
    if (ror <= 5) return { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.08)' };
    if (ror <= 10) return { color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.12)' };
    return { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' };
  };
  const sliderColors = getSliderColor(customRoR);

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          Bankroll Requirements
        </div>
        <div style={{
          padding: '1rem',
          background: 'rgba(220, 38, 38, 0.1)',
          fontSize: '0.875rem',
          color: '#dc2626'
        }}>
          With a non-positive winrate, no bankroll can protect you from eventual ruin.
          Focus on improving your game first.
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Bankroll Requirements
      </div>

      {/* Custom RoR Slider */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '2rem',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '1rem 1.25rem',
        background: sliderColors.bg,
        border: `2px solid ${sliderColors.color}`,
        transition: 'background 0.2s, border-color 0.2s',
      }}>
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.65rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem',
              opacity: 0.5,
            }}
          >
            Risk of Ruin Target
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input
              type="range"
              min={1}
              max={20}
              value={customRoR}
              onChange={(e) => setCustomRoR(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', minWidth: '45px' }}>
              {customRoR}%
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', borderLeft: '1px solid #e5e5e5', paddingLeft: '1.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, marginBottom: '0.25rem' }}>
            Required Bankroll
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {formatDollars(customDollars)}
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
            {isFinite(customBuyIns) ? `${customBuyIns} buy-ins` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Preset recommendations - minimal table style */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5 }}>Risk</th>
            <th style={{ textAlign: 'left', padding: '0.5rem 0', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5 }}>Style</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5 }}>Buy-ins</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.5 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map(({ ror, label, description, buyIns, dollars, isInfinite }, i) => {
            const rowBgs = ['white', '#fafafa', '#f5f5f5', '#efefef'];
            return (
              <tr key={ror} style={{ background: rowBgs[i] || 'white' }}>
                <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{label}</td>
                <td style={{ padding: '0.6rem 0', opacity: 0.6 }}>{description}</td>
                <td style={{ padding: '0.6rem 0', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {isInfinite ? '∞' : buyIns}
                </td>
                <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {isInfinite ? '—' : formatDollars(dollars)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '1rem', fontSize: '0.7rem', opacity: 0.5, lineHeight: 1.5 }}>
        Based on {winrate} bb/100 winrate and {stdDev} standard deviation
      </div>
    </div>
  );
}
