'use client';

import { ChipSelector } from './ChipSelector';
import { ENVIRONMENT_OPTIONS } from '@/lib/ai/flow-options';
import type { AskEnvironmentParams, ToolComponentProps } from '@/lib/ai/types';

export function EnvironmentSelector({
  params,
  onResponse,
}: ToolComponentProps<AskEnvironmentParams>) {
  const handleSelect = (selected: string | string[]) => {
    const id = Array.isArray(selected) ? selected[0] : selected;
    const label = id === 'online' ? 'Online' : 'Live';
    onResponse(`[ENV:${id}] ${label}`);
  };

  const question = params?.question ?? 'Do you play online or live?';

  return (
    <ChipSelector
      options={ENVIRONMENT_OPTIONS}
      question={question}
      onSelect={handleSelect}
    />
  );
}
