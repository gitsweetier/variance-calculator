'use client';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'default' | 'positive' | 'negative' | 'accent';
  large?: boolean;
}

export function MetricCard({
  label,
  value,
  subtext,
  variant = 'default',
  large = false,
}: MetricCardProps) {
  const variantClass = variant !== 'default' ? `metric__value--${variant}` : '';
  const sizeClass = large ? 'metric__value--large' : '';

  return (
    <div className="metric">
      <span className="metric__label">{label}</span>
      <span className={`metric__value ${variantClass} ${sizeClass}`.trim()}>
        {value}
      </span>
      {subtext && <span className="metric__subtext">{subtext}</span>}
    </div>
  );
}
