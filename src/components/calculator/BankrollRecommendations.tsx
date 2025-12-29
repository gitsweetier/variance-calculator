'use client';

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

export function BankrollRecommendations({ winrate, stdDev, stakes }: BankrollRecommendationsProps) {
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

  if (winrate <= 0) {
    return (
      <div className="block">
        <div className="block-title" style={{ marginBottom: '1rem' }}>
          Recommended Bankroll by Risk Tolerance
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
        Recommended Bankroll by Risk Tolerance
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Risk of Ruin</th>
            <th>Style</th>
            <th>Buy-ins</th>
            <th>Dollars</th>
          </tr>
        </thead>
        <tbody>
          {recommendations.map(({ ror, label, description, buyIns, dollars, isInfinite }) => (
            <tr key={ror}>
              <td style={{ fontWeight: 700 }}>{label}</td>
              <td style={{ opacity: 0.7 }}>{description}</td>
              <td>
                {isInfinite ? '∞' : `${buyIns} BI`}
              </td>
              <td>
                {isInfinite ? '—' : (
                  dollars >= 1000
                    ? `$${(dollars / 1000).toFixed(1)}k`
                    : `$${dollars.toFixed(0)}`
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
        Based on your {winrate} bb/100 winrate and {stdDev} standard deviation
      </div>
    </div>
  );
}
