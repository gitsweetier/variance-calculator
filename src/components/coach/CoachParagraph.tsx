'use client';

import { useMemo } from 'react';
import { generateCoachExplanation } from '@/lib/coach/explanations';

interface CoachParagraphProps {
  winrate: number;
  stdDev: number;
  hands: number;
  stakes: number;
}

export function CoachParagraph({ winrate, stdDev, hands, stakes }: CoachParagraphProps) {
  const explanation = useMemo(
    () => generateCoachExplanation({ winrate, stdDev, hands, stakes }),
    [winrate, stdDev, hands, stakes]
  );

  return (
    <div className="coach-paragraph">
      {explanation.paragraphs.map((paragraph, index) => (
        <p
          key={index}
          style={{ marginBottom: index < explanation.paragraphs.length - 1 ? '0.75rem' : 0 }}
          dangerouslySetInnerHTML={{ __html: paragraph }}
        />
      ))}
    </div>
  );
}
