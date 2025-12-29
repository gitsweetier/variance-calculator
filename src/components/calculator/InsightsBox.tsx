'use client';

import {
  expectedWinnings,
  probabilityOfLoss,
  riskOfRuin,
  standardError,
  handsForAccuracy,
} from '@/lib/math/statistics';

interface InsightsBoxProps {
  winrate: number;
  stdDev: number;
  hands: number;
  bankroll: number;
  stakes: number;
}

function formatDollars(dollars: number): string {
  if (Math.abs(dollars) >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars.toFixed(0)}`;
}

function formatHands(h: number): string {
  if (h >= 1000000) return `${(h / 1000000).toFixed(1)}M`;
  if (h >= 1000) return `${Math.round(h / 1000)}k`;
  return h.toString();
}

export function InsightsBox({ winrate, stdDev, hands, bankroll, stakes }: InsightsBoxProps) {
  const evBB = expectedWinnings(hands, winrate);
  const evDollars = evBB * stakes;
  const probLoss = probabilityOfLoss(hands, winrate, stdDev);
  const ror = riskOfRuin(winrate, bankroll, stdDev);
  const se = standardError(hands, stdDev);
  const handsFor1bb = handsForAccuracy(stdDev, 1);
  const bankrollBuyIns = bankroll / 100;
  const bankrollDollars = bankroll * stakes;

  const insights: string[] = [];

  // EV insight
  if (evDollars > 0) {
    insights.push(
      `Over ${formatHands(hands)} hands, you can expect to win about <strong>${formatDollars(evDollars)}</strong>.`
    );
  } else if (evDollars < 0) {
    insights.push(
      `Over ${formatHands(hands)} hands, you can expect to lose about <strong>${formatDollars(Math.abs(evDollars))}</strong>.`
    );
  } else {
    insights.push(`At breakeven, you're expected to neither win nor lose over the long run.`);
  }

  // Probability insight
  if (probLoss > 0.4 && probLoss < 0.6) {
    insights.push(`It's basically a coin flip whether you'll be up or down after this sample.`);
  } else if (probLoss < 0.1 && winrate > 0) {
    insights.push(
      `You have a <strong>${((1 - probLoss) * 100).toFixed(0)}%</strong> chance of being profitable. Variance is on your side.`
    );
  } else if (probLoss > 0.5) {
    insights.push(
      `There's a <strong>${(probLoss * 100).toFixed(0)}%</strong> chance you'll be in the red. ${
        winrate > 0 ? 'Sample size is still too small for your edge to show consistently.' : 'A negative winrate means losing is expected.'
      }`
    );
  }

  // RoR insight
  if (winrate > 0) {
    if (ror < 0.01) {
      insights.push(
        `Your ${formatDollars(bankrollDollars)} bankroll (${bankrollBuyIns} buy-ins) is very safe—less than 1% risk of going broke.`
      );
    } else if (ror < 0.05) {
      insights.push(
        `With ${formatDollars(bankrollDollars)} (${bankrollBuyIns} buy-ins), your risk of ruin is about ${(ror * 100).toFixed(1)}%. This is within safe limits.`
      );
    } else if (ror < 0.2) {
      insights.push(
        `<strong>Warning:</strong> ${(ror * 100).toFixed(0)}% risk of ruin. Consider building a larger bankroll.`
      );
    } else {
      insights.push(
        `<strong>High risk:</strong> ${(ror * 100).toFixed(0)}% chance of going broke. You're underrolled for these stakes.`
      );
    }
  }

  // Sample size insight
  if (hands < handsFor1bb) {
    insights.push(
      `At ${formatHands(hands)} hands, your winrate has a margin of error of ±${se.toFixed(1)} bb/100. You'd need about <strong>${formatHands(handsFor1bb)}</strong> hands to narrow that to ±1 bb/100.`
    );
  } else {
    insights.push(
      `With ${formatHands(hands)} hands, your margin of error is just ±${se.toFixed(1)} bb/100—a solid sample size.`
    );
  }

  // Make it feel like a set of post-it notes: rotate colors / shapes.
  const variants = [
    'insights-box--wide',
    'insights-box--mint',
    'insights-box--sky',
    'insights-box--lilac',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`insights-box ${variants[i % variants.length]} ${i === 0 ? 'insights-box--wide' : ''}`}
          style={{
            transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 0.35}deg)`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.6,
              display: 'block',
              marginBottom: '0.5rem',
            }}
          >
            Insight
          </span>
          <div style={{ fontSize: '1.05rem', lineHeight: 1.4 }}>
            <span dangerouslySetInnerHTML={{ __html: insight }} />
          </div>
        </div>
      ))}
    </div>
  );
}
