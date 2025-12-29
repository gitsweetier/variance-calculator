'use client';

import { ChipSelector } from './ChipSelector';
import { TIME_AT_STAKES_OPTIONS } from '@/lib/ai/flow-options';
import type { ToolComponentProps } from '@/lib/ai/types';

export interface AskTimeAtStakesParams {
  question?: string;
}

export function TimeAtStakesSelector({
  params,
  onResponse,
}: ToolComponentProps<AskTimeAtStakesParams>) {
  const question = params?.question ?? 'How long have you been playing at these stakes?';

  const handleSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;
    const option = TIME_AT_STAKES_OPTIONS.find((o) => o.id === id);
    const label = option?.label ?? id;
    onResponse(`[TIME:${id}] ${label}`);
  };

  return (
    <ChipSelector
      options={TIME_AT_STAKES_OPTIONS}
      question={question}
      onSelect={handleSelect}
    />
  );
}
