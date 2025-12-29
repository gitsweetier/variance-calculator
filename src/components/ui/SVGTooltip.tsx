'use client';

interface SVGTooltipProps {
  content: string;
  x: number;
  y: number;
  visible: boolean;
  chartWidth: number;
  chartHeight: number;
}

export function SVGTooltip({
  content,
  x,
  y,
  visible,
  chartWidth,
}: SVGTooltipProps) {
  if (!visible || !content) return null;

  // Tooltip dimensions
  const tooltipWidth = 180;
  const tooltipHeight = 60;
  const padding = 8;

  // Calculate position to keep tooltip within bounds
  let adjustedX = x - tooltipWidth / 2;
  const adjustedY = y - tooltipHeight - 10;

  // Keep within horizontal bounds
  if (adjustedX < padding) {
    adjustedX = padding;
  } else if (adjustedX + tooltipWidth > chartWidth - padding) {
    adjustedX = chartWidth - tooltipWidth - padding;
  }

  return (
    <foreignObject
      x={adjustedX}
      y={Math.max(padding, adjustedY)}
      width={tooltipWidth}
      height={tooltipHeight}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
    >
      <div
        style={{
          background: '#1a1a1a',
          color: 'white',
          padding: '0.5rem 0.75rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.625rem',
          lineHeight: 1.5,
          maxWidth: tooltipWidth,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {content}
      </div>
    </foreignObject>
  );
}
