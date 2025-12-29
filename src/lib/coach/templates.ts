/**
 * Text templates for Coach Mode explanations
 * These templates are used to generate human-readable explanations
 */

export const TEMPLATES = {
  evLine: {
    positive:
      'The orange dashed line shows your Expected Value (EV) - where you\'d end up on average. At {winrate} BB/100 over {hands} hands, you expect to win {evBB} BB ({evDollars}).',
    negative:
      'The orange dashed line shows your expected loss path. At {winrate} BB/100 over {hands} hands, you expect to lose {evBB} BB ({evDollars}).',
    breakeven:
      'The orange dashed line sits at zero - at breakeven, you\'re not expected to win or lose long-term.',
  },

  ciBand: {
    base: 'The shaded gray area is your 95% confidence interval. 95% of the time, your actual results will fall in this range.',
    wide: 'Notice how wide this band is - that\'s variance at work. Even with a positive winrate, there\'s significant uncertainty.',
    narrow:
      'The relatively narrow band shows that over {hands} hands, variance has less impact on your likely outcomes.',
  },

  samplePaths: {
    base: 'Each gray line is one possible "poker career" - a simulation of {hands} hands. Notice how they diverge from EV.',
    divergence:
      'The paths spread over time - that\'s variance causing different outcomes even with the same underlying winrate.',
  },

  probLoss: {
    high: 'About {probLossPercent}% of the time, you\'d be losing at this point despite your positive winrate. Short-term variance is normal.',
    medium:
      'There\'s roughly a {probLossPercent}% chance you\'d be in the red. Your edge hasn\'t fully manifested yet.',
    low: 'Only {probLossPercent}% chance of being down - your edge is strongly asserting itself over this sample.',
  },

  bellCurve: {
    lossArea:
      'The red shaded area represents the probability ({probLossPercent}%) of finishing at a loss. This is where variance works against you.',
    winArea:
      'The green shaded area represents the probability ({probWinPercent}%) of finishing with a profit. This is where your edge manifests.',
    evMarker:
      'The vertical orange line marks your expected outcome: {evBB} BB. This is the peak of the distribution.',
  },

  summary: {
    positiveWinrateLargeSample:
      'Over {hands} hands at {winrate} BB/100, you expect to win around <strong>{evDollars}</strong>. With {probWinPercent}% chance of profit, your edge should manifest clearly.',
    positiveWinrateSmallSample:
      'With only {hands} hands at {winrate} BB/100, variance still dominates. The 95% CI ranges from {ci95Lower} to {ci95Upper} BB - a huge swing! There\'s a {probLossPercent}% chance you\'d be losing despite your edge.',
    negativeWinrate:
      'At {winrate} BB/100 over {hands} hands, you expect to lose around <strong>{evDollars}</strong>. The sample paths trend downward, confirming this is a losing scenario.',
    breakeven:
      'At exactly 0 BB/100, you\'re breakeven long-term. But as the wide confidence band shows, short-term results swing dramatically. It\'s a 50/50 coin flip.',
  },
};

export const TOOLTIP_CONTENT = {
  evLine:
    'Expected Value (EV) line - where you\'d end up on average if you played these hands countless times.',
  ciBand:
    '95% Confidence Interval - 95% of the time, your actual results fall within this shaded region.',
  samplePaths:
    'Sample paths - each line represents one possible outcome. These are Monte Carlo simulations.',
  zeroLine:
    'Breakeven line - above this you\'re winning, below you\'re losing.',
  bellCurveLoss:
    'Loss region - the probability of finishing with negative results.',
  bellCurveWin:
    'Win region - the probability of finishing with positive results.',
  bellCurveEV:
    'Expected Value marker - the most likely outcome based on your parameters.',
};
