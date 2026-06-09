// Fee tiers — calm semantic palette, graded to the real Berlin price spread
// (2 € / 3 € / 4 €). null = kostenlos (other cities), 2 = günstig, 3 = mittel,
// 4+ = teuer.

export type FeeTier = 'free' | 'low' | 'mid' | 'high';

export interface FeeStyle {
  label: string;
  bg: string;
  fg: string;
  dot: string;
  map: string; // polygon / point fill on the map
}

export const FEE: Record<FeeTier, FeeStyle> = {
  free: { label: 'Kostenlos', bg: '#d9f2ec', fg: '#0f766e', dot: '#14b8a6', map: '#14b8a6' },
  low: { label: 'Günstig', bg: '#e6f3ec', fg: '#1c7a4c', dot: '#2f9e6b', map: '#3aa873' },
  mid: { label: 'Mittel', bg: '#f8efda', fg: '#946410', dot: '#d6a23c', map: '#e0ad44' },
  high: { label: 'Teuer', bg: '#f9e8e6', fg: '#a4352b', dot: '#d35248', map: '#dc564b' },
};

// Darker shades of the high tone for route-driven emphasis (bezirk / zone).
export const MAP_EMPHASIS = {
  bezirk: '#b8443b',
  zone: '#7f2b22',
};

// Accepts the number (map props) or the string display form (ParkZone.gebuehr).
export function feeTier(gebuehr: number | string | null): FeeTier {
  if (gebuehr === null) return 'free';
  const n = typeof gebuehr === 'number' ? gebuehr : parseFloat(gebuehr);
  if (Number.isNaN(n)) return 'free';
  if (n < 2.5) return 'low'; // ~2 €
  if (n < 3.5) return 'mid'; // ~3 €
  return 'high'; // 4 €+
}

// "4.00" | 4 -> "4,00" (German comma); null -> null.
export function formatGebuehr(gebuehr: number | string | null): string | null {
  if (gebuehr === null) return null;
  const n = typeof gebuehr === 'number' ? gebuehr : parseFloat(gebuehr);
  if (Number.isNaN(n)) return null;
  return n.toFixed(2).replace('.', ',');
}
