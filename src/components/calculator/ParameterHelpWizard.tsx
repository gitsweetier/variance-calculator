'use client';

import { useState, useEffect } from 'react';
import { STAKES_PRESETS } from '@/lib/constants';

type WizardMode = 'cash' | 'tournaments';
type WizardPlatform = 'online' | 'live';
type WizardGame = 'nlhe' | 'plo';
type WizardFormat = '6max' | 'fullring' | 'headsup';

type WizardStep =
  | 'choose_mode'
  | 'tournaments_notice'
  | 'choose_platform'
  | 'choose_game'
  | 'choose_format'
  | 'stddev_result'
  | 'winrate_ask'
  | 'winrate_estimate';

function recommendStdDev({
  platform,
  game,
  format,
}: {
  platform: WizardPlatform;
  game: WizardGame;
  format: WizardFormat;
}): { value: number; explanation: string } {
  if (platform === 'live') {
    if (game === 'plo') {
      return {
        value: 120,
        explanation: 'Live PLO tends to have very large swings. A rough default is ~120 BB/100.',
      };
    }
    return {
      value: 75,
      explanation: 'Live NL tends to be less swingy than online. A rough default is ~75 BB/100.',
    };
  }

  // Online
  if (game === 'plo') {
    if (format === 'headsup') return { value: 170, explanation: 'Online PLO HU is extremely swingy; ~170 BB/100 is a reasonable placeholder.' };
    if (format === '6max') return { value: 130, explanation: 'Online PLO 6-max is very swingy; ~130 BB/100 is a common ballpark.' };
    return { value: 110, explanation: 'Online PLO full ring is still swingy; ~110 BB/100 is a reasonable placeholder.' };
  }

  // NLHE
  if (format === 'headsup') return { value: 140, explanation: 'Online NL HU is swingy; ~140 BB/100 is a reasonable placeholder.' };
  if (format === '6max') return { value: 90, explanation: 'Online NL 6-max often lands around ~80–100 BB/100; defaulting to 90.' };
  return { value: 75, explanation: 'Online NL full ring is typically a bit less swingy; defaulting to 75 BB/100.' };
}

function estimateHandsFromHours({
  hours,
  platform,
  game,
  format,
  tables,
}: {
  hours: number;
  platform: WizardPlatform;
  game: WizardGame;
  format: WizardFormat;
  tables: number;
}) {
  if (hours <= 0) return 0;

  if (platform === 'live') {
    const hph = game === 'plo' ? 27 : 33;
    return Math.round(hours * hph);
  }

  // Online per-table hands/hour (rough, varies by site/speed)
  let perTable = 75;
  if (format === 'fullring') perTable = 65;
  if (format === '6max') perTable = 80;
  if (format === 'headsup') perTable = 160;

  const t = Math.max(1, Math.round(tables || 1));
  return Math.round(hours * perTable * t);
}

export function ParameterHelpWizard({
  open,
  onClose,
  stakes,
  onStakesChange,
  winrate,
  onWinrateChange,
  stdDev,
  onStdDevChange,
}: {
  open: boolean;
  onClose: () => void;
  stakes: number;
  onStakesChange: (value: number) => void;
  winrate: number;
  onWinrateChange: (value: number) => void;
  stdDev: number;
  onStdDevChange: (value: number) => void;
}) {
  const [step, setStep] = useState<WizardStep>('choose_mode');
  const [mode, setMode] = useState<WizardMode>('cash');
  const [platform, setPlatform] = useState<WizardPlatform>('online');
  const [game, setGame] = useState<WizardGame>('nlhe');
  const [format, setFormat] = useState<WizardFormat>('6max');

  const [volumeType, setVolumeType] = useState<'hands' | 'hours'>('hands');
  const [handsPlayed, setHandsPlayed] = useState<number>(50000);
  const [handsPlayedText, setHandsPlayedText] = useState<string>('50000');
  const [hoursPlayed, setHoursPlayed] = useState<number>(200);
  const [hoursPlayedText, setHoursPlayedText] = useState<string>('200');
  const [avgTables, setAvgTables] = useState<number>(1);
  const [avgTablesText, setAvgTablesText] = useState<string>('1');
  const [profitDollars, setProfitDollars] = useState<number>(1000);
  const [profitDollarsText, setProfitDollarsText] = useState<string>('1000');

  useEffect(() => {
    if (!open) return;
    setStep('choose_mode');
    setMode('cash');
    setPlatform('online');
    setGame('nlhe');
    setFormat('6max');
    setVolumeType('hands');
    setHandsPlayed(50000);
    setHandsPlayedText('50000');
    setHoursPlayed(200);
    setHoursPlayedText('200');
    setAvgTables(1);
    setAvgTablesText('1');
    setProfitDollars(1000);
    setProfitDollarsText('1000');
  }, [open]);

  if (!open) return null;

  const nextFromStdDev = () => {
    setStep('winrate_ask');
  };

  const goBack = () => {
    switch (step) {
      case 'choose_mode':
        onClose();
        return;
      case 'tournaments_notice':
        setStep('choose_mode');
        return;
      case 'choose_platform':
        setStep('choose_mode');
        return;
      case 'choose_game':
        setStep('choose_platform');
        return;
      case 'choose_format':
        setStep('choose_game');
        return;
      case 'stddev_result':
        setStep(platform === 'online' ? 'choose_format' : 'choose_game');
        return;
      case 'winrate_ask':
        setStep('stddev_result');
        return;
      case 'winrate_estimate':
        setStep('winrate_ask');
        return;
      default:
        onClose();
    }
  };

  const { value: recommendedStdDev, explanation: stdDevExplanation } = recommendStdDev({
    platform,
    game,
    format: platform === 'live' ? 'fullring' : format,
  });

  // Step progress calculation
  const stepOrder: WizardStep[] = ['choose_mode', 'choose_platform', 'choose_game', 'choose_format', 'stddev_result', 'winrate_ask', 'winrate_estimate'];
  const currentStepIndex = stepOrder.indexOf(step);
  const totalSteps = 5; // Simplified: mode, platform/game, format, result, winrate

  const estimatedHands =
    volumeType === 'hands'
      ? Math.max(0, Math.round(handsPlayed))
      : estimateHandsFromHours({
          hours: Math.max(0, hoursPlayed),
          platform,
          game,
          format: platform === 'live' ? 'fullring' : format,
          tables: avgTables,
        });

  const winningsBB = stakes > 0 ? profitDollars / stakes : 0;
  const estimatedWinrate = estimatedHands > 0 ? (winningsBB / estimatedHands) * 100 : 0;
  const estimatedWinrateRounded = Number(estimatedWinrate.toFixed(2));

  return (
    <div className="help-overlay" role="dialog" aria-modal="true" aria-label="Help me set parameters">
      <div className="help-dialog">
        <div className="help-dialog__header">
          <div className="help-dialog__header-left">
            {step !== 'choose_mode' && (
              <button type="button" className="help-btn help-btn--ghost" onClick={goBack}>
                ← Back
              </button>
            )}
            <div className="help-dialog__title">Help me</div>
          </div>
          <button type="button" className="help-dialog__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="help-dialog__body">
          {/* Step indicator */}
          {step !== 'tournaments_notice' && (
            <div className="help-dialog__step-indicator">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`help-dialog__step-dot ${
                    s === Math.min(totalSteps, Math.ceil((currentStepIndex + 1) / 1.4))
                      ? 'help-dialog__step-dot--active'
                      : s < Math.ceil((currentStepIndex + 1) / 1.4)
                      ? 'help-dialog__step-dot--completed'
                      : ''
                  }`}
                />
              ))}
            </div>
          )}

          {step === 'choose_mode' && (
            <>
              <div className="help-dialog__question">What are you playing?</div>
              <div className="help-dialog__choices">
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setMode('cash');
                    setStep('choose_platform');
                  }}
                >
                  <span className="help-btn__icon">💵</span>
                  Cash games
                </button>
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setMode('tournaments');
                    setStep('tournaments_notice');
                  }}
                >
                  <span className="help-btn__icon">🏆</span>
                  Tournaments
                </button>
              </div>
              <div className="help-dialog__note">
                We&apos;ll help you set a reasonable <strong>standard deviation</strong> and optionally estimate your winrate.
              </div>
              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'tournaments_notice' && (
            <>
              <div className="help-dialog__question">Tournament support isn’t wired up yet</div>
              <div className="help-dialog__note">
                This calculator assumes cash-game style inputs (BB/100 over hands). A tournament version needs different math (ROI distribution, payout skew).
              </div>
              <div className="help-dialog__actions">
                <button type="button" className="help-btn" onClick={goBack}>
                  Back
                </button>
                <button type="button" className="help-btn help-btn--primary" onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}

          {step === 'choose_platform' && (
            <>
              <div className="help-dialog__question">Online or live?</div>
              <div className="help-dialog__choices">
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setPlatform('online');
                    setStep('choose_game');
                  }}
                >
                  <span className="help-btn__icon">💻</span>
                  Online
                </button>
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setPlatform('live');
                    setFormat('fullring');
                    setStep('choose_game');
                  }}
                >
                  <span className="help-btn__icon">🎰</span>
                  Live
                </button>
              </div>
              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={goBack}>
                  ← Back
                </button>
              </div>
            </>
          )}

          {step === 'choose_game' && (
            <>
              <div className="help-dialog__question">Which game?</div>
              <div className="help-dialog__choices">
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setGame('nlhe');
                    setStep(platform === 'online' ? 'choose_format' : 'stddev_result');
                  }}
                >
                  <span className="help-btn__icon">♠♥</span>
                  No‑Limit Hold&apos;em
                </button>
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setGame('plo');
                    setStep(platform === 'online' ? 'choose_format' : 'stddev_result');
                  }}
                >
                  <span className="help-btn__icon">♠♥♦♣</span>
                  Pot‑Limit Omaha
                </button>
              </div>
              {platform === 'live' && (
                <div className="help-dialog__note">
                  For live we assume <strong>full ring</strong> pace/variance by default.
                </div>
              )}
              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={goBack}>
                  ← Back
                </button>
              </div>
            </>
          )}

          {step === 'choose_format' && (
            <>
              <div className="help-dialog__question">Table format?</div>
              <div className="help-dialog__choices">
                <button type="button" className="help-btn" onClick={() => { setFormat('6max'); setStep('stddev_result'); }}>
                  <span className="help-btn__icon">6️⃣</span>
                  6‑max
                </button>
                <button type="button" className="help-btn" onClick={() => { setFormat('fullring'); setStep('stddev_result'); }}>
                  <span className="help-btn__icon">9️⃣</span>
                  Full ring
                </button>
                <button type="button" className="help-btn" onClick={() => { setFormat('headsup'); setStep('stddev_result'); }}>
                  <span className="help-btn__icon">🆚</span>
                  Heads‑up
                </button>
              </div>
              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={goBack}>
                  ← Back
                </button>
              </div>
            </>
          )}

          {step === 'stddev_result' && (
            <>
              <div className="help-dialog__question">Standard deviation set! ✓</div>
              <div className="help-dialog__result help-dialog__result--highlight">
                <div className="help-dialog__result-row">
                  <span>Your selection</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {platform === 'live' ? 'Live' : 'Online'} · {game === 'plo' ? 'PLO' : 'NLHE'}
                    {platform === 'online' ? ` · ${format === '6max' ? '6‑max' : format === 'headsup' ? 'HU' : 'Full ring'}` : ''}
                  </span>
                </div>
                <div className="help-dialog__result-row">
                  <span>Standard Deviation</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                    {recommendedStdDev} bb/100
                  </span>
                </div>
              </div>
              <div className="help-dialog__note">{stdDevExplanation}</div>
              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={goBack}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="help-btn help-btn--primary help-btn--inline"
                  onClick={() => {
                    onStdDevChange(recommendedStdDev);
                    nextFromStdDev();
                  }}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {step === 'winrate_ask' && (
            <>
              <div className="help-dialog__question">Need help with winrate?</div>
              <div className="help-dialog__note">
                If you share your <strong>profit</strong> and <strong>volume</strong>, we can estimate your BB/100 winrate.
              </div>
              <div className="help-dialog__choices">
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    onClose();
                  }}
                >
                  <span className="help-btn__icon">✓</span>
                  I&apos;m done
                </button>
                <button
                  type="button"
                  className="help-btn"
                  onClick={() => {
                    setStep('winrate_estimate');
                  }}
                >
                  <span className="help-btn__icon">📊</span>
                  Estimate winrate
                </button>
              </div>
              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={goBack}>
                  ← Back
                </button>
              </div>
            </>
          )}

          {step === 'winrate_estimate' && (
            <>
              <div className="help-dialog__question">Estimate your winrate</div>

              <div className="help-dialog__form">
                <div className="help-dialog__field">
                  <div className="help-dialog__label">Stakes</div>
                  <select
                    value={stakes}
                    onChange={(e) => onStakesChange(Number(e.target.value))}
                    className="help-dialog__select"
                  >
                    {STAKES_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="help-dialog__field">
                  <div className="help-dialog__label">Volume type</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`help-btn help-btn--inline ${volumeType === 'hands' ? 'help-btn--secondary' : ''}`}
                      onClick={() => setVolumeType('hands')}
                      style={{ flex: 1 }}
                    >
                      Hands
                    </button>
                    <button
                      type="button"
                      className={`help-btn help-btn--inline ${volumeType === 'hours' ? 'help-btn--secondary' : ''}`}
                      onClick={() => setVolumeType('hours')}
                      style={{ flex: 1 }}
                    >
                      Hours
                    </button>
                  </div>
                </div>

                {volumeType === 'hands' ? (
                  <div className="help-dialog__field">
                    <div className="help-dialog__label">Hands played</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={handsPlayedText}
                      onChange={(e) => {
                        setHandsPlayedText(e.target.value);
                        const n = Number(e.target.value);
                        if (Number.isFinite(n)) setHandsPlayed(Math.max(0, n));
                      }}
                      onBlur={() => {
                        if (handsPlayedText.trim() === '' || !Number.isFinite(Number(handsPlayedText))) {
                          setHandsPlayedText(String(handsPlayed));
                        }
                      }}
                      className="help-dialog__input"
                    />
                  </div>
                ) : (
                  <>
                    <div className="help-dialog__field">
                      <div className="help-dialog__label">Hours played</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={hoursPlayedText}
                        onChange={(e) => {
                          setHoursPlayedText(e.target.value);
                          const n = Number(e.target.value);
                          if (Number.isFinite(n)) setHoursPlayed(Math.max(0, n));
                        }}
                        onBlur={() => {
                          if (hoursPlayedText.trim() === '' || !Number.isFinite(Number(hoursPlayedText))) {
                            setHoursPlayedText(String(hoursPlayed));
                          }
                        }}
                        className="help-dialog__input"
                      />
                    </div>
                    {platform === 'online' && (
                      <div className="help-dialog__field">
                        <div className="help-dialog__label">Avg tables</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={avgTablesText}
                          onChange={(e) => {
                            setAvgTablesText(e.target.value);
                            const n = Number(e.target.value);
                            if (Number.isFinite(n)) setAvgTables(Math.max(1, Math.min(20, n)));
                          }}
                          onBlur={() => {
                            if (avgTablesText.trim() === '' || !Number.isFinite(Number(avgTablesText))) {
                              setAvgTablesText(String(avgTables));
                            }
                          }}
                          className="help-dialog__input"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="help-dialog__field">
                  <div className="help-dialog__label">Net profit ($)</div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={profitDollarsText}
                    onChange={(e) => {
                      setProfitDollarsText(e.target.value);
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) setProfitDollars(n);
                    }}
                    onBlur={() => {
                      if (profitDollarsText.trim() === '' || !Number.isFinite(Number(profitDollarsText))) {
                        setProfitDollarsText(String(profitDollars));
                      }
                    }}
                    className="help-dialog__input"
                  />
                  <div className="help-dialog__hint">Negative if you&apos;re down</div>
                </div>
              </div>

              <div className="help-dialog__result help-dialog__result--highlight" style={{ marginTop: '1rem' }}>
                <div className="help-dialog__result-row">
                  <span>Volume</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {estimatedHands.toLocaleString()} hands
                  </span>
                </div>
                <div className="help-dialog__result-row">
                  <span>Estimated winrate</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: estimatedWinrateRounded >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                    {estimatedWinrateRounded >= 0 ? '+' : ''}
                    {estimatedWinrateRounded.toFixed(2)} bb/100
                  </span>
                </div>
              </div>

              <div className="help-dialog__actions">
                <button type="button" className="help-btn help-btn--ghost help-btn--inline" onClick={goBack}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="help-btn help-btn--primary help-btn--inline"
                  onClick={() => {
                    onWinrateChange(estimatedWinrateRounded);
                    onClose();
                  }}
                >
                  Apply & Done ✓
                </button>
              </div>
              <div className="help-dialog__note" style={{ marginTop: '0.75rem' }}>
                This is a rough estimate. For confidence intervals and deeper analysis, try the &quot;Chat with Expert&quot; feature.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

