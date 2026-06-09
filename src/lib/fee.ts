// Fee tiers — calm semantic palette (from the redesign).
// gebuehr is null (free) | < 2 €/h (cheap) | >= 2 €/h (paid).

export type FeeTier = 'free' | 'cheap' | 'paid';

export interface FeeStyle {
  label: string;
  bg: string;
  fg: string;
  dot: string;
  map: string; // polygon fill on the map
}

export const FEE: Record<FeeTier, FeeStyle> = {
  free: { label: 'Kostenlos', bg: '#e6f3ec', fg: '#1c7a4c', dot: '#2f9e6b', map: '#3aa873' },
  cheap: { label: 'Günstig', bg: '#f8efda', fg: '#946410', dot: '#d6a23c', map: '#e0ad44' },
  paid: { label: 'Teuer', bg: '#f9e8e6', fg: '#a4352b', dot: '#d35248', map: '#dc564b' },
};

// Darker shades of the paid tone for route-driven emphasis (bezirk / zone).
export const MAP_EMPHASIS = {
  bezirk: '#b8443b', // darker
  zone: '#7f2b22', // darkest
};

// Accepts the number (map props) or the string display form (ParkZone.gebuehr).
export function feeTier(gebuehr: number | string | null): FeeTier {
  if (gebuehr === null) return 'free';
  const n = typeof gebuehr === 'number' ? gebuehr : parseFloat(gebuehr);
  if (Number.isNaN(n)) return 'free';
  return n < 2 ? 'cheap' : 'paid';
}

// "4.00" | 4 -> "4,00" (German comma); null -> null.
export function formatGebuehr(gebuehr: number | string | null): string | null {
  if (gebuehr === null) return null;
  const n = typeof gebuehr === 'number' ? gebuehr : parseFloat(gebuehr);
  if (Number.isNaN(n)) return null;
  return n.toFixed(2).replace('.', ',');
}
