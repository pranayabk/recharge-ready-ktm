const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Nepali-style digit grouping (1,23,45,678). */
export const formatNumber = (n: number) => inr.format(n);

/** NPR with lakh grouping; switches to crore (1 crore = 1,00,00,000) for ward-scale totals. */
export function formatNPR(n: number): string {
  if (Math.abs(n) >= 10_000_000) return `NPR ${(n / 10_000_000).toFixed(2)} crore`;
  return `NPR ${inr.format(n)}`;
}

/** Litres, switching to megalitres (ML) for large ward-scale volumes. */
export function formatLiters(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} ML`;
  return `${inr.format(n)} L`;
}

export const STRUCTURE_LABELS = {
  RECHARGE_PIT: { singular: 'recharge pit', plural: 'recharge pits' },
  PARKING_SHAFT: { singular: 'parking-slab shaft', plural: 'parking-slab shafts' },
  DETENTION_TANK: { singular: 'detention tank', plural: 'detention tanks' },
} as const;

export const ROOF_MATERIAL_LABELS = {
  RCC_CONCRETE: 'RCC concrete',
  CGI_METAL: 'CGI metal sheet',
  TILED_GREEN: 'Tiled / green roof',
} as const;
