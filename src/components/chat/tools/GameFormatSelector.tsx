'use client';

import { ChipSelector } from './ChipSelector';
import { GAME_FORMAT_OPTIONS, getGameFormatLabel } from '@/lib/ai/flow-options';
import type { AskGameFormatParams, ToolComponentProps } from '@/lib/ai/types';

export function GameFormatSelector({
  params,
  onResponse,
}: ToolComponentProps<AskGameFormatParams>) {
  const handleSelect = (selected: string | string[]) => {
    if (Array.isArray(selected)) {
      const labels = selected.map((id) => getGameFormatLabel(id)).join(', ');
      onResponse(`[FORMAT:${selected.join(',')}] ${labels}`);
    } else {
      const label = getGameFormatLabel(selected);
      onResponse(`[FORMAT:${selected}] ${label}`);
    }
  };

  // Handle undefined params gracefully
  const question = params?.question ?? 'What type of poker do you play?';
  const allowMultiple = params?.allowMultiple ?? false;

  return (
    <ChipSelector
      options={GAME_FORMAT_OPTIONS}
      question={question}
      allowMultiple={allowMultiple}
      onSelect={handleSelect}
    />
  );
}
