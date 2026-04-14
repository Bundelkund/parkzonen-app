import type { Stadt, Bezirk, ParkZone } from '@/types/zone';

// Mock data — will be replaced with real DB queries when PostGIS is connected

export async function getStaedte(): Promise<Stadt[]> {
  return [
    {
      slug: 'berlin',
      name: 'Berlin',
      lat: 52.52,
      lng: 13.405,
      bbox: [13.09, 52.34, 13.76, 52.68],
      active: true,
    },
  ];
}

export async function getStadtBySlug(
  citySlug: string,
): Promise<Stadt | null> {
  const staedte = await getStaedte();
  return staedte.find((s) => s.slug === citySlug) ?? null;
}

export async function getBezirkeByStadt(
  citySlug: string,
): Promise<Bezirk[]> {
  if (citySlug === 'berlin') {
    return [
      {
        slug: 'mitte',
        name: 'Mitte',
        city_slug: 'berlin',
        bbox: [13.34, 52.5, 13.42, 52.54],
      },
      {
        slug: 'friedrichshain-kreuzberg',
        name: 'Friedrichshain-Kreuzberg',
        city_slug: 'berlin',
        bbox: [13.39, 52.49, 13.47, 52.53],
      },
      {
        slug: 'pankow',
        name: 'Pankow',
        city_slug: 'berlin',
        bbox: [13.37, 52.53, 13.5, 52.6],
      },
      {
        slug: 'charlottenburg-wilmersdorf',
        name: 'Charlottenburg-Wilmersdorf',
        city_slug: 'berlin',
        bbox: [13.22, 52.47, 13.34, 52.54],
      },
      {
        slug: 'tempelhof-schoeneberg',
        name: 'Tempelhof-Schoeneberg',
        city_slug: 'berlin',
        bbox: [13.32, 52.44, 13.4, 52.5],
      },
      {
        slug: 'neukoelln',
        name: 'Neukoelln',
        city_slug: 'berlin',
        bbox: [13.39, 52.43, 13.5, 52.49],
      },
    ];
  }
  return [];
}

export async function getBezirkBySlug(
  citySlug: string,
  bezirkSlug: string,
): Promise<Bezirk | null> {
  const bezirke = await getBezirkeByStadt(citySlug);
  return bezirke.find((b) => b.slug === bezirkSlug) ?? null;
}

const MOCK_ZONES: Record<string, ParkZone[]> = {
  'berlin/mitte': [
    {
      zone_id: 'zone-55',
      name: 'Zone 55',
      bezirk: 'Mitte',
      bezirk_slug: 'mitte',
      gebuehr: '2.00',
      zeiten: 'Mo-Sa 9-20 Uhr',
      besonderheiten: 'Anwohnerparken mit Ausweis M-55',
      bbox: [13.37, 52.515, 13.39, 52.525],
    },
    {
      zone_id: 'zone-56',
      name: 'Zone 56',
      bezirk: 'Mitte',
      bezirk_slug: 'mitte',
      gebuehr: '2.00',
      zeiten: 'Mo-Sa 9-20 Uhr',
      besonderheiten: null,
      bbox: [13.38, 52.51, 13.4, 52.52],
    },
    {
      zone_id: 'zone-57',
      name: 'Zone 57',
      bezirk: 'Mitte',
      bezirk_slug: 'mitte',
      gebuehr: '1.00',
      zeiten: 'Mo-Fr 9-18 Uhr',
      besonderheiten: 'Kurzparkzone, max. 2 Stunden',
      bbox: [13.36, 52.52, 13.38, 52.53],
    },
  ],
  'berlin/friedrichshain-kreuzberg': [
    {
      zone_id: 'zone-41',
      name: 'Zone 41',
      bezirk: 'Friedrichshain-Kreuzberg',
      bezirk_slug: 'friedrichshain-kreuzberg',
      gebuehr: '1.00',
      zeiten: 'Mo-Fr 9-18 Uhr',
      besonderheiten: null,
      bbox: [13.41, 52.5, 13.43, 52.51],
    },
    {
      zone_id: 'zone-42',
      name: 'Zone 42',
      bezirk: 'Friedrichshain-Kreuzberg',
      bezirk_slug: 'friedrichshain-kreuzberg',
      gebuehr: null,
      zeiten: 'Keine Parkraumbewirtschaftung',
      besonderheiten: 'Kostenloses Parken ohne Zeitbegrenzung',
      bbox: [13.44, 52.49, 13.46, 52.5],
    },
  ],
  'berlin/pankow': [
    {
      zone_id: 'zone-61',
      name: 'Zone 61',
      bezirk: 'Pankow',
      bezirk_slug: 'pankow',
      gebuehr: '1.00',
      zeiten: 'Mo-Fr 9-18 Uhr',
      besonderheiten: 'Anwohnerparken mit Ausweis P-61',
      bbox: [13.4, 52.54, 13.42, 52.55],
    },
  ],
  'berlin/charlottenburg-wilmersdorf': [
    {
      zone_id: 'zone-31',
      name: 'Zone 31',
      bezirk: 'Charlottenburg-Wilmersdorf',
      bezirk_slug: 'charlottenburg-wilmersdorf',
      gebuehr: '2.00',
      zeiten: 'Mo-Sa 9-20 Uhr',
      besonderheiten: null,
      bbox: [13.28, 52.5, 13.3, 52.51],
    },
  ],
  'berlin/tempelhof-schoeneberg': [
    {
      zone_id: 'zone-21',
      name: 'Zone 21',
      bezirk: 'Tempelhof-Schoeneberg',
      bezirk_slug: 'tempelhof-schoeneberg',
      gebuehr: '1.00',
      zeiten: 'Mo-Fr 9-18 Uhr',
      besonderheiten: null,
      bbox: [13.34, 52.47, 13.36, 52.48],
    },
  ],
  'berlin/neukoelln': [
    {
      zone_id: 'zone-71',
      name: 'Zone 71',
      bezirk: 'Neukoelln',
      bezirk_slug: 'neukoelln',
      gebuehr: null,
      zeiten: 'Keine Parkraumbewirtschaftung',
      besonderheiten: 'Kostenloses Parken',
      bbox: [13.42, 52.46, 13.44, 52.47],
    },
  ],
};

export async function getZonesByBezirk(
  citySlug: string,
  bezirkSlug: string,
): Promise<ParkZone[]> {
  const key = `${citySlug}/${bezirkSlug}`;
  return MOCK_ZONES[key] ?? [];
}

export async function getZoneBySlug(
  citySlug: string,
  bezirkSlug: string,
  zoneId: string,
): Promise<ParkZone | null> {
  const zones = await getZonesByBezirk(citySlug, bezirkSlug);
  return zones.find((z) => z.zone_id === zoneId) ?? null;
}
