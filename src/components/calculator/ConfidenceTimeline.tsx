'use client';

import { standardError } from '@/lib/math/statistics';

interface ConfidenceTimelineProps {
  stdDev: number;
}

const MILESTONES = [10000, 30000, 50000, 100000, 250000, 500000];

export function ConfidenceTimeline({ stdDev }: ConfidenceTimelineProps) {
  // Calculate the confidence (inverse of standard error) at each milestone
  // Lower SE = higher confidence. We'll normalize to show as percentage of "full confidence"
  const baselineSE = standardError(10000, stdDev);

  const milestoneData = MILESTONES.map((hands) => {
    const se = standardError(hands, stdDev);
    // Confidence is inversely proportional to SE
    // We'll show it as a percentage where 500k hands = ~100%
    const maxSE = standardError(10000, stdDev);
    const minSE = standardError(500000, stdDev);
    const confidence = ((maxSE - se) / (maxSE - minSE)) * 100;

    return {
      hands,
      se,
      confidence: Math.min(100, Math.max(0, confidence)),
      label: formatHands(hands),
    };
  });

  function formatHands(h: number) {
    if (h >= 1000000) return `${h / 1000000}M`;
    if (h >= 1000) return `${h / 1000}k`;
    return h.toString();
  }

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        When Can You Trust Your Results?
      </div>
      <div className="confidence-timeline">
        {milestoneData.map(({ hands, se, confidence, label }) => (
          <div key={hands} className="confidence-milestone">
            <span className="confidence-milestone__label">{label}</span>
            <div className="confidence-milestone__bar">
              <div
                className="confidence-milestone__fill"
                style={{
                  width: `${confidence}%`,
                  background: confidence < 30 ? '#dc2626' : confidence < 60 ? '#FF4D00' : '#16a34a',
                }}
              />
            </div>
            <span className="confidence-milestone__value">±{se.toFixed(1)} bb/100</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
        Bars show relative statistical confidence. Numbers show 95% CI margin for your winrate.
      </div>
    </div>
  );
}
