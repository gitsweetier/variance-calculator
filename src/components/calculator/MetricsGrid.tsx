'use client';

import {
  expectedWinnings,
  winningsStdDev,
  probabilityOfLoss,
  riskOfRuin,
} from '@/lib/math/statistics';
import { Z_95 } from '@/lib/constants';

interface MetricsGridProps {
  winrate: number;
  stdDev: number;
  hands: number;
  bankroll: number;
  stakes: number;
}

function formatBuyIns(bb: number): string {
  const buyIns = bb / 100;
  if (Math.abs(buyIns) >= 100) {
    return `${buyIns.toFixed(0)} buy-ins`;
  }
  if (Math.abs(buyIns) >= 10) {
    return `${buyIns.toFixed(1)} buy-ins`;
  }
  return `${buyIns.toFixed(1)} buy-ins`;
}

function formatDollars(bb: number, stakes: number): string {
  const dollars = bb * stakes;
  if (Math.abs(dollars) >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

function formatPercent(p: number): string {
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(1)}%`;
}

function shortDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 1,
        background: 'rgba(0,0,0,0.12)',
        width: '62%',
        margin: '0.85rem auto',
      }}
    />
  );
}

export function MetricsGrid({ winrate, stdDev, hands, bankroll, stakes }: MetricsGridProps) {
  const ev = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);
  const probLoss = probabilityOfLoss(hands, winrate, stdDev);
  const probProfit = 1 - probLoss;

  const ci95Lower = ev - Z_95 * sigma;
  const ci95Upper = ev + Z_95 * sigma;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {/* Expected Value */}
      <div className="block">
        <div className="metric">
          <span className="metric__label">Expected Value</span>
          <span className={`metric__value ${ev >= 0 ? 'metric__value--positive' : 'metric__value--negative'}`}>
            {ev >= 0 ? '+' : ''}{formatBuyIns(ev)}
          </span>
          <span className="metric__subtext">
            {formatDollars(ev, stakes)}
          </span>
        </div>
      </div>

      {/* Probability of Profit */}
      <div className="block">
        <div className="metric">
          <span className="metric__label">Probability of Profit</span>
          <span className={`metric__value ${probProfit >= 0.5 ? 'metric__value--positive' : 'metric__value--negative'}`}>
            {formatPercent(probProfit)}
          </span>
        </div>
      </div>

      {/* 95% Confidence Interval Range */}
      <div className="block">
        <div className="metric">
          <span className="metric__label">95% Confidence Interval</span>
          <span className="metric__value" style={{ fontSize: '1rem' }}>
            {formatBuyIns(ci95Lower)} to {formatBuyIns(ci95Upper)}
          </span>
          <span className="metric__subtext">
            {formatDollars(ci95Lower, stakes)} to {formatDollars(ci95Upper, stakes)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface RiskOfRuinGaugeProps {
  winrate: number;
  stdDev: number;
  bankroll: number;
}

export function RiskOfRuinGauge({ winrate, stdDev, bankroll }: RiskOfRuinGaugeProps) {
  const ror = riskOfRuin(winrate, bankroll, stdDev);
  const buyIns = bankroll / 100;

  const getColor = () => {
    if (ror < 0.04) return 'text-positive';
    if (ror < 0.07) return 'text-accent';
    return 'text-negative';
  };

  const getMessage = () => {
    if (ror < 0.01) return 'Very safe';
    if (ror < 0.04) return 'Safe';
    if (ror < 0.07) return 'Moderate';
    if (ror < 0.1) return 'High';
    if (ror < 0.15) return 'Very high';
    return 'Danger';
  };

  return (
    <div className="block block--accent" style={{ textAlign: 'center', padding: '2rem' }}>
      <div className="gauge">
        <span className="gauge__label">Risk of Ruin</span>
        <span className={`gauge__value ${getColor()}`}>
          {formatPercent(ror)}
        </span>
        <span className="gauge__subtext">{getMessage()}</span>
        <span className="gauge__subtext">with {buyIns} buy-in bankroll</span>
      </div>
    </div>
  );
}

interface CoreOutcomesCardProps {
  winrate: number;
  stdDev: number;
  hands: number;
  bankroll: number;
  stakes: number;
}

export function CoreOutcomesCard({ winrate, stdDev, hands, bankroll, stakes }: CoreOutcomesCardProps) {
  const ev = expectedWinnings(hands, winrate);
  const probLoss = probabilityOfLoss(hands, winrate, stdDev);
  const probProfit = 1 - probLoss;
  const ror = riskOfRuin(winrate, bankroll, stdDev);
  const buyIns = bankroll / 100;

  const getRoRColor = () => {
    if (ror < 0.04) return 'metric__value--positive';
    if (ror < 0.07) return 'metric__value--accent';
    return 'metric__value--negative';
  };

  const getRoRBadge = () => {
    if (ror < 0.01) {
      return { label: 'Very safe', bg: 'rgba(22, 163, 74, 0.10)', fg: '#16a34a' };
    }
    if (ror < 0.04) {
      return { label: 'Safe', bg: 'rgba(22, 163, 74, 0.10)', fg: '#16a34a' };
    }
    if (ror < 0.07) {
      return { label: 'Moderate', bg: 'rgba(255, 77, 0, 0.12)', fg: '#FF4D00' };
    }
    if (ror < 0.1) {
      return { label: 'High', bg: 'rgba(220, 38, 38, 0.10)', fg: '#dc2626' };
    }
    if (ror < 0.15) {
      return { label: 'Very high', bg: 'rgba(220, 38, 38, 0.14)', fg: '#dc2626' };
    }
    return { label: 'Danger', bg: 'rgba(220, 38, 38, 0.20)', fg: '#dc2626' };
  };

  const getRoRMessage = () => {
    if (ror < 0.01) return 'Very safe';
    if (ror < 0.04) return 'Safe';
    if (ror < 0.07) return 'Moderate';
    if (ror < 0.1) return 'High';
    if (ror < 0.15) return 'Very high';
    return 'Danger';
  };

  const probColor = probProfit >= 0.5 ? 'var(--positive)' : 'var(--negative)';
  const rorBadge = getRoRBadge();
  const rorStripe = ror < 0.04 ? 'var(--positive)' : ror < 0.07 ? 'var(--accent)' : 'var(--negative)';

  return (
    <div
      className="block"
      style={{
        padding: '1.25rem',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(255,255,255,1) 42%)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'baseline', gap: '0.75rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: 'black',
            color: 'white',
            padding: '0.25rem 0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          After {hands.toLocaleString()} hands
        </span>
      </div>

      <div
        aria-hidden="true"
        style={{
          height: 1,
          background: 'rgba(0,0,0,0.12)',
          margin: '0.75rem 0 0.9rem',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* EV panel */}
        <div
          style={{
            padding: '0.9rem',
            border: '1px solid rgba(0,0,0,0.14)',
            borderLeft: `6px solid ${ev >= 0 ? 'var(--positive)' : 'var(--negative)'}`,
            background: 'rgba(255,255,255,0.80)',
          }}
        >
          <div className="metric">
            <span className="metric__label">Expected Value</span>
            <span
              className={`metric__value ${ev >= 0 ? 'metric__value--positive' : 'metric__value--negative'}`}
              style={{ fontSize: '1.9rem' }}
            >
              {ev >= 0 ? '+' : ''}{formatBuyIns(ev)}
            </span>
            <span className="metric__subtext">{formatDollars(ev, stakes)}</span>
          </div>
        </div>

        {/* Probability panel */}
        <div
          style={{
            padding: '0.9rem',
            border: '1px solid rgba(0,0,0,0.14)',
            borderLeft: `6px solid ${probColor}`,
            background: 'rgba(255,255,255,0.80)',
          }}
        >
          <div className="metric">
            <span className="metric__label">Probability of Profit</span>
            <span className={`metric__value ${probProfit >= 0.5 ? 'metric__value--positive' : 'metric__value--negative'}`}>
              {formatPercent(probProfit)}
            </span>
            <div
              style={{
                height: 10,
                background: 'rgba(0,0,0,0.10)',
                position: 'relative',
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, probProfit * 100))}%`, background: probColor }} />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'rgba(0,0,0,0.25)',
                }}
              />
            </div>
            <span className="metric__subtext">Finish up vs down (50% is the coin-flip line)</span>
          </div>
        </div>

        {/* RoR panel */}
        <div
          style={{
            padding: '0.9rem',
            border: '1px solid rgba(0,0,0,0.14)',
            borderLeft: `6px solid ${rorStripe}`,
            background: 'rgba(255,255,255,0.80)',
          }}
        >
          <div className="metric">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
              <span className="metric__label" style={{ marginBottom: 0 }}>
                Risk of Ruin
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0.15rem 0.45rem',
                  background: rorBadge.bg,
                  color: rorBadge.fg,
                  border: '1px solid rgba(0,0,0,0.12)',
                  whiteSpace: 'nowrap',
                }}
              >
                {rorBadge.label}
              </span>
            </div>
            <span className={`metric__value ${getRoRColor()}`}>
              {formatPercent(ror)}
            </span>
            <span className="metric__subtext">
              {getRoRMessage()} with {buyIns} buy-in bankroll
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Winnings95CICardProps {
  winrate: number;
  stdDev: number;
  hands: number;
  stakes: number;
}

export function Winnings95CICard({ winrate, stdDev, hands, stakes }: Winnings95CICardProps) {
  const ev = expectedWinnings(hands, winrate);
  const sigma = winningsStdDev(hands, stdDev);
  const ci95Lower = ev - Z_95 * sigma;
  const ci95Upper = ev + Z_95 * sigma;

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '0.75rem' }}>
        95% Confidence Interval (winnings)
      </div>
      <div className="metric">
        <span className="metric__label">Range</span>
        <span className="metric__value" style={{ fontSize: '1.125rem' }}>
          {formatBuyIns(ci95Lower)} to {formatBuyIns(ci95Upper)}
        </span>
        <span className="metric__subtext">
          {formatDollars(ci95Lower, stakes)} to {formatDollars(ci95Upper, stakes)}
        </span>
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
        Under the normal approximation, about 95% of outcomes land in this range after {hands.toLocaleString()} hands.
      </div>
    </div>
  );
}
