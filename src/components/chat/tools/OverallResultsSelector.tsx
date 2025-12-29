'use client';

import { ChipSelector } from './ChipSelector';
import { OVERALL_RESULTS_OPTIONS } from '@/lib/ai/flow-options';
import type { ToolComponentProps } from '@/lib/ai/types';

export interface AskOverallResultsParams {
  question?: string;
}

export function OverallResultsSelector({
  params,
  onResponse,
}: ToolComponentProps<AskOverallResultsParams>) {
  const question = params?.question ?? 'How have things been going at the tables overall?';

  const handleSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;
    const option = OVERALL_RESULTS_OPTIONS.find((o) => o.id === id);
    const label = option?.label ?? id;
    onResponse(`[RESULTS:${id}] ${label}`);
  };

  return (
    <ChipSelector
      options={OVERALL_RESULTS_OPTIONS}
      question={question}
      onSelect={handleSelect}
    />
  );
}
