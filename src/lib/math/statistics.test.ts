import { describe, it, expect } from 'vitest';
import {
  normalCDF,
  normalInverseCDF,
  expectedWinnings,
  winningsStdDev,
  standardError,
  confidenceInterval,
  confidenceInterval70,
  confidenceInterval95,
  probabilityOfLoss,
  probabilityAboveObserved,
  probabilityBelowObserved,
  minimumBankroll,
  probabilityOfProfit,
} from './statistics';
import { Z_70, Z_95 } from '../constants';

describe('normalCDF', () => {
  it('returns 0.5 for z=0', () => {
    expect(normalCDF(0)).toBe(0.5);
  });

  it('returns approximately 0.8413 for z=1', () => {
    expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
  });

  it('returns approximately 0.9772 for z=2', () => {
    expect(normalCDF(2)).toBeCloseTo(0.9772, 3);
  });

  it('returns approximately 0.1587 for z=-1', () => {
    expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
  });

  it('returns approximately 0.025 for z=-1.96', () => {
    expect(normalCDF(-1.96)).toBeCloseTo(0.025, 2);
  });

  it('returns 0 for very negative z', () => {
    expect(normalCDF(-10)).toBe(0);
  });

  it('returns 1 for very positive z', () => {
    expect(normalCDF(10)).toBe(1);
  });
});

describe('normalInverseCDF', () => {
  it('returns 0 for p=0.5', () => {
    expect(normalInverseCDF(0.5)).toBe(0);
  });

  it('returns approximately 1.645 for p=0.95', () => {
    expect(normalInverseCDF(0.95)).toBeCloseTo(1.645, 2);
  });

  it('returns approximately -1.645 for p=0.05', () => {
    expect(normalInverseCDF(0.05)).toBeCloseTo(-1.645, 2);
  });

  it('returns approximately 1.96 for p=0.975', () => {
    expect(normalInverseCDF(0.975)).toBeCloseTo(1.96, 2);
  });

  it('returns -Infinity for p=0', () => {
    expect(normalInverseCDF(0)).toBe(-Infinity);
  });

  it('returns Infinity for p=1', () => {
    expect(normalInverseCDF(1)).toBe(Infinity);
  });

  it('is inverse of normalCDF', () => {
    const testValues = [0.1, 0.25, 0.5, 0.75, 0.9];
    for (const p of testValues) {
      const z = normalInverseCDF(p);
      expect(normalCDF(z)).toBeCloseTo(p, 6);
    }
  });
});

describe('Z values', () => {
  it('Z_70 should correspond to 0.85 quantile', () => {
    expect(normalCDF(Z_70)).toBeCloseTo(0.85, 4);
  });

  it('Z_95 should correspond to 0.975 quantile', () => {
    expect(normalCDF(Z_95)).toBeCloseTo(0.975, 4);
  });
});

describe('expectedWinnings', () => {
  it('calculates expected winnings correctly', () => {
    // 2.5 BB/100 over 10,000 hands = 250 BB
    expect(expectedWinnings(10000, 2.5)).toBe(250);
  });

  it('handles negative winrate', () => {
    expect(expectedWinnings(10000, -2.5)).toBe(-250);
  });

  it('handles zero winrate', () => {
    expect(expectedWinnings(10000, 0)).toBe(0);
  });
});

describe('winningsStdDev', () => {
  it('calculates standard deviation correctly', () => {
    // SD of 75 BB/100 over 10,000 hands = 75 * sqrt(100) = 750 BB
    expect(winningsStdDev(10000, 75)).toBe(750);
  });

  it('scales with square root of hands', () => {
    const sd1 = winningsStdDev(10000, 75);
    const sd2 = winningsStdDev(40000, 75);
    expect(sd2 / sd1).toBeCloseTo(2, 6); // sqrt(4) = 2
  });
});

describe('standardError', () => {
  it('calculates standard error correctly', () => {
    // SE = SD / sqrt(hands/100) = 75 / sqrt(100) = 7.5 BB/100
    expect(standardError(10000, 75)).toBeCloseTo(7.5, 6);
  });

  it('decreases with more hands', () => {
    const se1 = standardError(10000, 75);
    const se2 = standardError(40000, 75);
    expect(se1 / se2).toBeCloseTo(2, 6);
  });
});

describe('confidenceInterval', () => {
  it('calculates correct interval', () => {
    const ci = confidenceInterval(10000, 2.5, 75, 1.96);
    expect(ci.mean).toBe(250);
    expect(ci.lower).toBeCloseTo(250 - 1.96 * 750, 2);
    expect(ci.upper).toBeCloseTo(250 + 1.96 * 750, 2);
  });

  it('is symmetric around the mean', () => {
    const ci = confidenceInterval(10000, 2.5, 75, 1.96);
    expect(ci.mean - ci.lower).toBeCloseTo(ci.upper - ci.mean, 6);
  });
});

describe('confidenceInterval70', () => {
  it('uses correct z-value', () => {
    const ci70 = confidenceInterval70(10000, 2.5, 75);
    const ciManual = confidenceInterval(10000, 2.5, 75, Z_70);
    expect(ci70.lower).toBeCloseTo(ciManual.lower, 6);
    expect(ci70.upper).toBeCloseTo(ciManual.upper, 6);
  });
});

describe('confidenceInterval95', () => {
  it('uses correct z-value', () => {
    const ci95 = confidenceInterval95(10000, 2.5, 75);
    const ciManual = confidenceInterval(10000, 2.5, 75, Z_95);
    expect(ci95.lower).toBeCloseTo(ciManual.lower, 6);
    expect(ci95.upper).toBeCloseTo(ciManual.upper, 6);
  });
});

describe('probabilityOfLoss', () => {
  it('returns 0.5 for zero winrate', () => {
    expect(probabilityOfLoss(10000, 0, 75)).toBe(0.5);
  });

  it('returns low probability for high positive winrate', () => {
    const prob = probabilityOfLoss(100000, 5, 75);
    expect(prob).toBeLessThan(0.1);
  });

  it('returns high probability for negative winrate', () => {
    const prob = probabilityOfLoss(100000, -5, 75);
    expect(prob).toBeGreaterThan(0.9);
  });

  it('decreases with more hands for positive winrate', () => {
    const prob1 = probabilityOfLoss(10000, 2.5, 75);
    const prob2 = probabilityOfLoss(100000, 2.5, 75);
    expect(prob2).toBeLessThan(prob1);
  });
});

describe('probabilityOfProfit', () => {
  it('is complement of probabilityOfLoss', () => {
    const pLoss = probabilityOfLoss(10000, 2.5, 75);
    const pProfit = probabilityOfProfit(10000, 2.5, 75);
    expect(pLoss + pProfit).toBeCloseTo(1, 10);
  });
});

describe('probabilityAboveObserved', () => {
  it('returns 0.5 when observed equals true winrate', () => {
    const prob = probabilityAboveObserved(10000, 2.5, 75, 2.5);
    expect(prob).toBeCloseTo(0.5, 4);
  });

  it('returns higher probability when observed is below true', () => {
    const prob = probabilityAboveObserved(10000, 5, 75, 2.5);
    expect(prob).toBeGreaterThan(0.5);
  });

  it('returns lower probability when observed is above true', () => {
    const prob = probabilityAboveObserved(10000, 2.5, 75, 5);
    expect(prob).toBeLessThan(0.5);
  });
});

describe('probabilityBelowObserved', () => {
  it('is complement of probabilityAboveObserved', () => {
    const pAbove = probabilityAboveObserved(10000, 2.5, 75, 3);
    const pBelow = probabilityBelowObserved(10000, 2.5, 75, 3);
    expect(pAbove + pBelow).toBeCloseTo(1, 10);
  });
});

describe('minimumBankroll', () => {
  it('returns Infinity for non-positive winrate', () => {
    expect(minimumBankroll(0, 75)).toBe(Infinity);
    expect(minimumBankroll(-1, 75)).toBe(Infinity);
  });

  it('returns finite value for positive winrate', () => {
    const br = minimumBankroll(2.5, 75);
    expect(br).toBeGreaterThan(0);
    expect(br).toBeLessThan(Infinity);
  });

  it('increases with standard deviation', () => {
    const br1 = minimumBankroll(2.5, 75);
    const br2 = minimumBankroll(2.5, 100);
    expect(br2).toBeGreaterThan(br1);
  });

  it('decreases with higher winrate', () => {
    const br1 = minimumBankroll(2.5, 75);
    const br2 = minimumBankroll(5, 75);
    expect(br2).toBeLessThan(br1);
  });

  it('matches expected formula', () => {
    // BR = (sd^2 / 100) * ln(1/0.05) / (2 * wr/100)
    // For wr=2.5, sd=75: BR = (5625/100) * 2.996 / (2 * 0.025) = 56.25 * 2.996 / 0.05 = 3370.5
    const br = minimumBankroll(2.5, 75, 0.05);
    const expected = ((75 * 75) / 100) * (-Math.log(0.05)) / (2 * 2.5 / 100);
    expect(br).toBe(Math.ceil(expected));
  });
});
