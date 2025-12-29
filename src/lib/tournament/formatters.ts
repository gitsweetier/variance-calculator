/**
 * Formats a dollar amount with abbreviations for large numbers
 * @example formatDollars(1500) => "$1.5k"
 * @example formatDollars(-2500000) => "-$2.50M"
 */
export function formatDollars(x: number): string {
  const sign = x < 0 ? '-' : '';
  const abs = Math.abs(x);
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Formats a dollar amount as buy-ins
 * @example formatBuyIns(500, 100) => "5.0 BI"
 */
export function formatBuyIns(xDollars: number, buyIn: number): string {
  const bi = buyIn > 0 ? xDollars / buyIn : 0;
  const abs = Math.abs(bi);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const sign = bi < 0 ? '-' : '';
  return `${sign}${abs.toFixed(decimals)} BI`;
}

/**
 * Formats a probability as a percentage
 * @example formatPct(0.5) => "50.0%"
 * @example formatPct(0.999) => ">99%"
 */
export function formatPct(p: number): string {
  if (!Number.isFinite(p)) return '—';
  if (p >= 0.995) return '>99%';
  if (p <= 0.005) return '<1%';
  return `${(p * 100).toFixed(1)}%`;
}

/**
 * Formats a number as an ordinal (1st, 2nd, 3rd, etc.)
 * @example ordinal(1) => "1st"
 * @example ordinal(22) => "22nd"
 */
export function ordinal(place: number): string {
  const p = Math.abs(place);
  const mod100 = p % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  const mod10 = p % 10;
  if (mod10 === 1) return `${place}st`;
  if (mod10 === 2) return `${place}nd`;
  if (mod10 === 3) return `${place}rd`;
  return `${place}th`;
}

/**
 * Formats a number with comma separators (SSR-safe, no locale dependency)
 * @example formatNumber(1000) => "1,000"
 * @example formatNumber(1234567) => "1,234,567"
 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const parts = Math.abs(n).toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + parts.join('.');
}
