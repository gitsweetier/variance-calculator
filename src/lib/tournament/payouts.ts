import { TournamentPayoutModel } from './types';

function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function sumPowerWeights(numPaid: number, alpha: number): number {
  let sum = 0;
  for (let i = 1; i <= numPaid; i++) {
    sum += 1 / Math.pow(i, alpha);
  }
  return sum;
}

/**
 * Build an approximate payout table for a tournament using a simple power-law curve:
 *   weight(place) = 1 / place^alpha
 *   prize(place)  = weight(place) / sumWeights * prizePool
 *
 * `alpha` is chosen to match the requested first prize (topPrizeMultiple * buyIn),
 * subject to feasibility constraints.
 */
export function buildApproximatePayoutModel(params: {
  fieldSize: number;
  percentPaid: number;
  buyIn: number;
  topPrizeMultiple: number;
}): TournamentPayoutModel {
  const warnings: string[] = [];

  const fieldSize = Math.max(2, Math.floor(params.fieldSize));
  const percentPaid = clampNumber(params.percentPaid, 0.1, 100);
  const buyIn = Math.max(0.01, params.buyIn);
  const topPrizeMultiple = Math.max(0.01, params.topPrizeMultiple);

  const prizePool = buyIn * fieldSize;
  const numPaid = Math.max(1, Math.floor((fieldSize * percentPaid) / 100));

  const minTopPrize = prizePool / numPaid; // equal payout
  const maxTopPrize = prizePool; // winner-take-all

  const requestedTopPrize = topPrizeMultiple * buyIn;
  let topPrizeTarget = requestedTopPrize;

  if (requestedTopPrize < minTopPrize) {
    warnings.push(
      `Top prize target ($${requestedTopPrize.toFixed(2)}) is too small for ${numPaid} paid places; clamped to equal-payout minimum ($${minTopPrize.toFixed(2)}).`
    );
    topPrizeTarget = minTopPrize;
  }
  if (requestedTopPrize > maxTopPrize) {
    warnings.push(
      `Top prize target ($${requestedTopPrize.toFixed(2)}) exceeds prize pool ($${maxTopPrize.toFixed(2)}); clamped to prize pool.`
    );
    topPrizeTarget = maxTopPrize;
  }

  // Binary search alpha in [0, 10] to match topPrizeTarget.
  // firstPrize(alpha) = prizePool / sumPowerWeights(numPaid, alpha)
  let lo = 0;
  let hi = 10;
  let alpha = 1.3;

  // If target is effectively equal-payout, alpha ~= 0.
  if (Math.abs(topPrizeTarget - minTopPrize) / Math.max(1e-9, minTopPrize) < 1e-10) {
    alpha = 0;
  } else if (Math.abs(topPrizeTarget - maxTopPrize) / Math.max(1e-9, maxTopPrize) < 1e-10) {
    alpha = 10;
  } else {
    for (let iter = 0; iter < 60; iter++) {
      const mid = (lo + hi) / 2;
      const sumW = sumPowerWeights(numPaid, mid);
      const first = prizePool / sumW;
      if (first < topPrizeTarget) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    alpha = (lo + hi) / 2;
  }

  const sumW = sumPowerWeights(numPaid, alpha);
  const prizes: number[] = [];
  for (let i = 1; i <= numPaid; i++) {
    const w = 1 / Math.pow(i, alpha);
    prizes.push((w / sumW) * prizePool);
  }

  const topPrizeActual = prizes[0] ?? 0;

  return {
    type: 'approxPower',
    fieldSize,
    percentPaid,
    numPaid,
    prizePool,
    topPrizeTarget,
    topPrizeActual,
    alpha,
    prizes,
    warnings,
  };
}


