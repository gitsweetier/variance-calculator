'use client';

import { useMemo } from 'react';

interface SessionBarsProps {
  winrate: number;
  stdDev: number;
  handsPerSession?: number;
  seed?: number;
}

// Simple seeded random
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Box-Muller for normal distribution
function normalRandom(random: () => number): number {
  const u1 = random();
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function SessionBars({
  winrate,
  stdDev,
  handsPerSession = 500,
  seed = 123,
}: SessionBarsProps) {
  const sessions = useMemo(() => {
    const random = seededRandom(seed);
    const numSessions = 20;

    // Session result: N(μ, σ²) where μ = wr * h/100, σ = sd * sqrt(h/100)
    const sessionMean = winrate * (handsPerSession / 100);
    const sessionStd = stdDev * Math.sqrt(handsPerSession / 100);

    const results: number[] = [];
    for (let i = 0; i < numSessions; i++) {
      results.push(sessionMean + sessionStd * normalRandom(random));
    }

    return results;
  }, [winrate, stdDev, handsPerSession, seed]);

  // Find max absolute value for scaling
  const maxAbs = Math.max(...sessions.map((s) => Math.abs(s)));

  return (
    <div className="block">
      <div className="block-title" style={{ marginBottom: '0.5rem' }}>
        Typical Session Swings ({handsPerSession} hands each)
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '80px',
          gap: '3px',
          position: 'relative',
        }}
      >
        {/* Zero line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: '1px',
            background: 'rgba(0,0,0,0.2)',
          }}
        />

        {sessions.map((result, i) => {
          const height = Math.abs(result) / maxAbs * 35; // Max 35px each direction
          const isPositive = result >= 0;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              {isPositive ? (
                <>
                  <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}px`,
                        background: '#16a34a',
                      }}
                    />
                  </div>
                  <div style={{ height: '40px' }} />
                </>
              ) : (
                <>
                  <div style={{ height: '40px' }} />
                  <div style={{ height: '40px', display: 'flex', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${height}px`,
                        background: '#dc2626',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.625rem',
          opacity: 0.5,
          marginTop: '0.25rem',
        }}
      >
        <span>Session 1</span>
        <span>Session 20</span>
      </div>
    </div>
  );
}
