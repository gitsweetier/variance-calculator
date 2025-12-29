'use client';

import { ChipSelector } from './ChipSelector';
import { EXPERIENCE_LEVEL_OPTIONS } from '@/lib/ai/flow-options';
import type { ToolComponentProps } from '@/lib/ai/types';

export interface AskExperienceLevelParams {
  question?: string;
}

export function ExperienceLevelSelector({
  params,
  onResponse,
}: ToolComponentProps<AskExperienceLevelParams>) {
  const question = params?.question ?? 'How would you describe your poker experience?';

  const handleSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;
    const option = EXPERIENCE_LEVEL_OPTIONS.find((o) => o.id === id);
    const label = option?.label ?? id;
    onResponse(`[EXPERIENCE:${id}] ${label}`);
  };

  return (
    <ChipSelector
      options={EXPERIENCE_LEVEL_OPTIONS}
      question={question}
      onSelect={handleSelect}
    />
  );
}
