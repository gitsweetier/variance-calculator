import { Z_70, Z_95 } from '@/lib/constants';
import {
  TournamentCalculatorInputs,
  TournamentConfidencePoint,
  TournamentOutcome,
  TournamentPayoutModel,
  TournamentSingleTournamentStats,
  TournamentSkillModel,
} from './types';
import { buildApproximatePayoutModel } from './payouts';

function clampNumber(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function ordinal(place: number): string {
  const p = Math.abs(place);
  const mod100 = p % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  const mod10 = p % 10;
  if (mod10 === 1) return `${place}st`;
  if (mod10 === 2) return `${place}nd`;
  if (mod10 === 3) return `${place}rd`;
  return `${place}th`;
}

/**
 * Sum_{k=0..n-1} exp(a*k) using expm1 for stability.
 * Safe for a <= 0; for a > 0, ensure a*n is not too large (to avoid overflow).
 */
function geometricSumExp(a: number, n: number): number {
  if (n <= 0) return 0;
  if (Math.abs(a) < 1e-14) return n;
  const num = Math.expm1(a * n);
  const den = Math.expm1(a);
  return num / den;
}

function computeFinishProbabilities(params: {
  fieldSize: number;
  numPaid: number;
  prizes: number[];
  cost: number;
  beta: number;
}): {
  pPaid: number[]; // length numPaid
  pBust: number;
  expectedPrize: number;
  expectedProfit: number;
} {
  const { fieldSize: n, numPaid: m, prizes, cost, beta } = params;
  const denomN = Math.max(1, n - 1);
  const a = -beta / denomN;

  // S = sum_{k=0..n-1} exp(a*k)
  const S = geometricSumExp(a, n);

  // Iteratively generate weights for places 1..m: w_i = exp(a*(i-1))
  const q = Math.exp(a);
  let w = 1;

  const pPaid: number[] = [];
  let sumPaid = 0;
  let expectedPrize = 0;

  for (let i = 1; i <= m; i++) {
    const p = w / S;
    pPaid.push(p);
    sumPaid += p;
    expectedPrize += p * (prizes[i - 1] ?? 0);
    w *= q;
  }

  const pBustRaw = 1 - sumPaid;
  const pBust = pBustRaw < 0 ? 0 : pBustRaw;
  const expectedProfit = expectedPrize - cost;

  return { pPaid, pBust, expectedPrize, expectedProfit };
}

function computeSingleTournamentStats(params: {
  cost: number;
  prizes: number[];
  pPaid: number[];
  pBust: number;
}): TournamentSingleTournamentStats {
  const { cost, prizes, pPaid, pBust } = params;

  let evPrize = 0;
  let evProfit = 0;
  let secondMoment = 0;
  let itm = 0;

  for (let i = 0; i < pPaid.length; i++) {
    const p = pPaid[i] ?? 0;
    const prize = prizes[i] ?? 0;
    const profit = prize - cost;
    evPrize += p * prize;
    evProfit += p * profit;
    secondMoment += p * profit * profit;
    if (prize > 0) itm += p;
  }

  // Bust outcome
  const bustProfit = -cost;
  secondMoment += pBust * bustProfit * bustProfit;
  evProfit += pBust * bustProfit;

  const variance = Math.max(0, secondMoment - evProfit * evProfit);
  const sd = Math.sqrt(variance);

  const avgPrizeWhenCashing = itm > 0 ? evPrize / itm : 0;
  const avgProfitWhenCashing = itm > 0 ? (evProfit - pBust * bustProfit) / itm : 0;

  return {
    cost,
    ev: evProfit,
    variance,
    sd,
    itmProbability: itm,
    avgPrizeWhenCashing,
    avgProfitWhenCashing,
  };
}

function solveSkillModel(params: {
  payoutModel: TournamentPayoutModel;
  cost: number;
  roiTarget: number; // fraction
}): { skillModel: TournamentSkillModel; pPaid: number[]; pBust: number } {
  const { payoutModel, cost } = params;
  const roiTarget = clampNumber(params.roiTarget, -1, 100); // allow crazy positive; clamp later by feasibility

  const prizes = payoutModel.prizes;
  const n = payoutModel.fieldSize;
  const m = payoutModel.numPaid;

  const maxRoiFeasible = cost > 0 ? (prizes[0] - cost) / cost : 0;
  const warnings: string[] = [];

  const target = roiTarget;
  if (target > maxRoiFeasible) {
    warnings.push(
      `ROI target ${(target * 100).toFixed(1)}% exceeds max feasible ROI ${(maxRoiFeasible * 100).toFixed(1)}% given the modeled payout (you can't win more than 1st place every time). Clamped.`
    );
  }

  const roiClamped = clampNumber(target, -1, maxRoiFeasible);

  const evalROI = (beta: number) => {
    const { pPaid, pBust, expectedProfit } = computeFinishProbabilities({
      fieldSize: n,
      numPaid: m,
      prizes,
      cost,
      beta,
    });
    const roi = cost > 0 ? expectedProfit / cost : 0;
    return { roi, pPaid, pBust };
  };

  // Baseline at beta = 0 (uniform finish distribution)
  const base = evalROI(0);

  let lo: number;
  let hi: number;

  // For negative beta, we must avoid overflow: require a*n <= ~700 where a = -beta/(n-1).
  // So |beta| <= 700*(n-1)/n approximately.
  const betaMinSafe = -Math.floor((700 * Math.max(1, n - 1)) / Math.max(1, n));

  if (roiClamped >= base.roi) {
    // Need non-negative beta. Find hi by expanding until we exceed target.
    lo = 0;
    hi = 1;
    let cur = evalROI(hi).roi;
    while (cur < roiClamped && hi < 20000) {
      hi *= 2;
      cur = evalROI(hi).roi;
    }
  } else {
    // Need negative beta. Find lo by expanding downward until below target or we hit safety floor.
    hi = 0;
    lo = -1;
    let cur = evalROI(lo).roi;
    while (cur > roiClamped && lo > betaMinSafe) {
      lo *= 2;
      if (lo < betaMinSafe) lo = betaMinSafe;
      cur = evalROI(lo).roi;
      if (lo === betaMinSafe) break;
    }
  }

  // Binary search beta in [lo, hi]
  let best = evalROI((lo + hi) / 2);
  let beta = (lo + hi) / 2;

  for (let iter = 0; iter < 70; iter++) {
    beta = (lo + hi) / 2;
    const res = evalROI(beta);
    best = res;
    if (Math.abs(res.roi - roiClamped) < 1e-6) break;
    if (res.roi < roiClamped) lo = beta;
    else hi = beta;
  }

  const achieved = best.roi;

  return {
    skillModel: {
      type: 'expFinishBias',
      roiTarget: roiClamped,
      roiAchieved: achieved,
      beta,
      maxRoiFeasible,
      warnings,
    },
    pPaid: best.pPaid,
    pBust: best.pBust,
  };
}

export function buildTournamentModel(inputs: TournamentCalculatorInputs): {
  payoutModel: TournamentPayoutModel;
  skillModel: TournamentSkillModel;
  outcomes: TournamentOutcome[];
  perTournament: TournamentSingleTournamentStats;
} {
  // Basic validation / normalization (worker also validates more aggressively)
  const buyIn = Math.max(0.01, inputs.buyIn);
  const fee = Math.max(0, inputs.fee);
  const cost = buyIn + fee;

  const payoutModel = buildApproximatePayoutModel({
    fieldSize: inputs.fieldSize,
    percentPaid: inputs.percentPaid,
    buyIn,
    topPrizeMultiple: inputs.topPrizeMultiple,
  });

  const roiFraction = inputs.roiPercent / 100;
  const { skillModel, pPaid, pBust } = solveSkillModel({
    payoutModel,
    cost,
    roiTarget: roiFraction,
  });

  const perTournament = computeSingleTournamentStats({
    cost,
    prizes: payoutModel.prizes,
    pPaid,
    pBust,
  });

  const outcomes: TournamentOutcome[] = [];
  outcomes.push({
    label: 'Bust',
    prize: 0,
    profit: -cost,
    probability: pBust,
  });

  for (let i = 1; i <= payoutModel.numPaid; i++) {
    const prize = payoutModel.prizes[i - 1] ?? 0;
    outcomes.push({
      label: ordinal(i),
      place: i,
      prize,
      profit: prize - cost,
      probability: pPaid[i - 1] ?? 0,
    });
  }

  // Minor sanity: normalize probabilities to sum 1
  const sumP = outcomes.reduce((s, o) => s + o.probability, 0);
  if (sumP > 0 && Math.abs(sumP - 1) > 1e-9) {
    for (const o of outcomes) o.probability /= sumP;
  }

  return { payoutModel, skillModel, outcomes, perTournament };
}

export function generateTournamentConfidenceData(params: {
  tournaments: number;
  evPerTournament: number;
  sdPerTournament: number;
  numPoints?: number;
}): TournamentConfidencePoint[] {
  const total = Math.max(0, Math.floor(params.tournaments));
  const numPoints = Math.max(50, Math.min(300, Math.floor(params.numPoints ?? 150)));

  if (total === 0) {
    return [
      {
        tournaments: 0,
        ev: 0,
        ci70Lower: 0,
        ci70Upper: 0,
        ci95Lower: 0,
        ci95Upper: 0,
      },
    ];
  }

  const step = Math.max(1, Math.floor(total / numPoints));
  const points: TournamentConfidencePoint[] = [];

  for (let t = 0; t <= total; t += step) {
    if (t === 0) {
      points.push({
        tournaments: 0,
        ev: 0,
        ci70Lower: 0,
        ci70Upper: 0,
        ci95Lower: 0,
        ci95Upper: 0,
      });
      continue;
    }

    const ev = t * params.evPerTournament;
    const sd = Math.sqrt(t) * params.sdPerTournament;
    points.push({
      tournaments: t,
      ev,
      ci70Lower: ev - Z_70 * sd,
      ci70Upper: ev + Z_70 * sd,
      ci95Lower: ev - Z_95 * sd,
      ci95Upper: ev + Z_95 * sd,
    });
  }

  const last = points[points.length - 1];
  if (last && last.tournaments !== total) {
    const ev = total * params.evPerTournament;
    const sd = Math.sqrt(total) * params.sdPerTournament;
    points.push({
      tournaments: total,
      ev,
      ci70Lower: ev - Z_70 * sd,
      ci70Upper: ev + Z_70 * sd,
      ci95Lower: ev - Z_95 * sd,
      ci95Upper: ev + Z_95 * sd,
    });
  }

  return points;
}


