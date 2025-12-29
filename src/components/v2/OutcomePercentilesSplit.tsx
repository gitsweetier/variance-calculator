'use client';

import { percentileOutcome } from '@/lib/math/statistics';

interface OutcomePercentilesSplitProps {
  winrate: number;
  stdDev: number;
  hands: number;
  stakes: number;
}

const P_ABOVE = [99, 95, 75] as const;
const P_MEDIAN = 50 as const;
const P_BELOW = [25, 10, 1] as const;

function formatDollars(dollars: number): string {
  const sign = dollars >= 0 ? '+' : '';
  if (Math.abs(dollars) >= 1000) {
    return `${sign}$${(dollars / 1000).toFixed(1)}k`;
  }
  return `${sign}$${dollars.toFixed(0)}`;
}

function formatBuyIns(bb: number): string {
  const buyIns = bb / 100;
  const sign = buyIns >= 0 ? '+' : '';
  return `${sign}${buyIns.toFixed(1)} BI`;
}

function getLabel(percentile: number): string {
  switch (percentile) {
    case 99:
      return 'Best 1%';
    case 95:
      return 'Top 5%';
    case 75:
      return 'Above average (top 25%)';
    case 50:
      return 'Median';
    case 25:
      return 'Below average (bottom 25%)';
    case 10:
      return 'Bottom 10%';
    case 1:
      return 'Worst 1%';
    default:
      return `${percentile}th`;
  }
}

type OutcomeRow = {
  percentile: number;
  label: string;
  outcomeBB: number;
  outcomeDollars: number;
};

function OutcomeRowCard({ row, maxAbs }: { row: OutcomeRow; maxAbs: number }) {
  const { label, outcomeBB, outcomeDollars } = row;
  const abs = Math.abs(outcomeDollars);
  const barPct = maxAbs > 0 ? (abs / maxAbs) * 100 : 0;

  return (
    <div
      style={{
        padding: '0.75rem 0.75rem',
        border: '1px solid rgba(0,0,0,0.15)',
        background: 'rgba(255,255,255,0.7)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.6,
            }}
          >
            {label}
          </div>
        </div>
        <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div
            className={outcomeDollars >= 0 ? 'text-positive' : 'text-negative'}
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.1,
            }}
          >
            {formatDollars(outcomeDollars)}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: 0.6 }}>
            {formatBuyIns(outcomeBB)}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '0.5rem',
          height: '6px',
          background: 'rgba(0,0,0,0.08)',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barPct}%`,
            background: outcomeDollars >= 0 ? 'var(--positive)' : 'var(--negative)',
            minWidth: abs > 0 ? '2px' : undefined,
          }}
        />
      </div>
    </div>
  );
}

export function OutcomePercentilesSplit({ winrate, stdDev, hands, stakes }: OutcomePercentilesSplitProps) {
  const rows: OutcomeRow[] = [...P_ABOVE, P_MEDIAN, ...P_BELOW].map((p) => {
    const outcomeBB = percentileOutcome(p, hands, winrate, stdDev);
    return {
      percentile: p,
      label: getLabel(p),
      outcomeBB,
      outcomeDollars: outcomeBB * stakes,
    };
  });

  const maxAbs = Math.max(1, ...rows.map((r) => Math.abs(r.outcomeDollars)));

  const aboveRows = rows.filter((r) => P_ABOVE.includes(r.percentile as (typeof P_ABOVE)[number]));
  const medianRow = rows.find((r) => r.percentile === P_MEDIAN)!;
  const belowRows = rows.filter((r) => P_BELOW.includes(r.percentile as (typeof P_BELOW)[number]));

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '1rem' }}>
        Outcome Percentiles
      </div>

      <div className="grid-12" style={{ alignItems: 'stretch' }}>
        {/* Above-average scenarios */}
        <div className="col-5">
          <div style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700 }}>
            Above average outcomes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {aboveRows.map((row) => (
              <OutcomeRowCard key={row.percentile} row={row} maxAbs={maxAbs} />
            ))}
          </div>
        </div>

        {/* Median (thin, visually distinct) */}
        <div className="col-2" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Spacer so the median box aligns with the top of the row cards (not the headers) */}
          <div
            aria-hidden="true"
            style={{
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              visibility: 'hidden',
            }}
          >
            Spacer
          </div>
          <div
            style={{
              flex: 1,
              border: '1px solid rgba(0,0,0,0.15)',
              background: 'rgba(0,0,0,0.02)',
              padding: '0.75rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.5rem',
            }}
          >
            <div className="metric">
              <span className="metric__label">{getLabel(P_MEDIAN)} (50th)</span>
              <span
                className={`metric__value ${medianRow.outcomeDollars >= 0 ? 'metric__value--positive' : 'metric__value--negative'}`}
                style={{ fontSize: '1.6rem' }}
              >
                {formatDollars(medianRow.outcomeDollars)}
              </span>
              <span className="metric__subtext">{formatBuyIns(medianRow.outcomeBB)}</span>
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              Coin-flip outcome
            </div>
          </div>
        </div>

        {/* Below-average scenarios */}
        <div className="col-5">
          <div
            style={{
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            Below average outcomes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {belowRows.map((row) => (
              <OutcomeRowCard key={row.percentile} row={row} maxAbs={maxAbs} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.6 }}>
        Percentiles of your total result after {hands.toLocaleString()} hands (given your winrate + variance inputs).
      </div>
    </div>
  );
}


