'use client';

import { ChipSelector } from './ChipSelector';
import { getStakesOptions, getStakesLabel } from '@/lib/ai/flow-options';
import type { AskStakesParams, ToolComponentProps } from '@/lib/ai/types';

export function StakesSelector({
  params,
  onResponse,
}: ToolComponentProps<AskStakesParams>) {
  const environment = params?.environment ?? 'online';
  const stakesOptions = getStakesOptions(environment);

  // Convert Stakes[] to ChipOption[] format
  const chipOptions = stakesOptions.map((s) => ({
    id: s.id,
    label: s.label,
  }));

  const handleSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;
    const stakes = stakesOptions.find((s) => s.id === id);
    const label = getStakesLabel(id);
    onResponse(`[STAKES:${id}:${stakes?.bigBlind || 0}] ${label}`);
  };

  const question = params?.question ?? 'What stakes do you play?';

  return (
    <ChipSelector
      options={chipOptions}
      question={question}
      onSelect={handleSelect}
    />
  );
}
