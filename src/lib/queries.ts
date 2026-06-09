import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Stadt, Bezirk, ParkZone } from '@/types/zone';

// Server-side data access over the build-time baked GeoJSON.
// Source: public/data/berlin.geojson (npm run bake:berlin). No DB, no PostGIS.
// Function signatures are the stable seam — pages/sitemap/robots consume these.

interface BakedProps {
  zone_id: string;
  name: string;
  bezirk: string;
  bezirk_slug: string;
  city_slug: string;
  gebuehr: number | null;
  zeiten: string | null;
  besonderheiten: string | null;
}

interface BakedFeature {
  type: 'Feature';
  id: number;
  geometry: { type: string; coordinates: unknown };
  properties: BakedProps;
}

type BBox = [number, number, number, number];

let _features: BakedFeature[] | null = null;

function loadFeatures(): BakedFeature[] {
  if (_features) return _features;
  const path = join(process.cwd(), 'public', 'data', 'berlin.geojson');
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  _features = raw.features as BakedFeature[];
  return _features;
}

// bbox over arbitrarily nested Polygon / MultiPolygon coordinate arrays
function bboxOf(coords: unknown): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      const [x, y] = c as number[];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    } else if (Array.isArray(c)) {
      c.forEach(walk);
    }
  };
  walk(coords);
  return [minX, minY, maxX, maxY];
}

function unionBbox(features: BakedFeature[]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    const [a, b, c, d] = bboxOf(f.geometry.coordinates);
    if (a < minX) minX = a;
    if (b < minY) minY = b;
    if (c > maxX) maxX = c;
    if (d > maxY) maxY = d;
  }
  return [minX, minY, maxX, maxY];
}

// number|null (baked) -> string|null (display seam, ParkZone.gebuehr)
function toZone(f: BakedFeature): ParkZone {
  const p = f.properties;
  return {
    id: f.id,
    zone_id: p.zone_id,
    name: p.name,
    bezirk: p.bezirk,
    bezirk_slug: p.bezirk_slug,
    gebuehr: p.gebuehr === null ? null : p.gebuehr.toFixed(2),
    zeiten: p.zeiten ?? '',
    besonderheiten: p.besonderheiten,
    bbox: bboxOf(f.geometry.coordinates),
  };
}

export async function getStaedte(): Promise<Stadt[]> {
  const features = loadFeatures();
  const bbox = unionBbox(features);
  return [
    {
      slug: 'berlin',
      name: 'Berlin',
      lng: (bbox[0] + bbox[2]) / 2,
      lat: (bbox[1] + bbox[3]) / 2,
      bbox,
      active: true,
    },
  ];
}

export async function getStadtBySlug(citySlug: string): Promise<Stadt | null> {
  const staedte = await getStaedte();
  return staedte.find((s) => s.slug === citySlug) ?? null;
}

export async function getBezirkeByStadt(citySlug: string): Promise<Bezirk[]> {
  const features = loadFeatures().filter((f) => f.properties.city_slug === citySlug);
  const bySlug = new Map<string, BakedFeature[]>();
  for (const f of features) {
    const slug = f.properties.bezirk_slug;
    (bySlug.get(slug) ?? bySlug.set(slug, []).get(slug)!).push(f);
  }
  return [...bySlug.entries()]
    .map(([slug, group]) => ({
      slug,
      name: group[0].properties.bezirk,
      city_slug: citySlug,
      bbox: unionBbox(group),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getBezirkBySlug(
  citySlug: string,
  bezirkSlug: string,
): Promise<Bezirk | null> {
  const bezirke = await getBezirkeByStadt(citySlug);
  return bezirke.find((b) => b.slug === bezirkSlug) ?? null;
}

export async function getZonesByStadt(citySlug: string): Promise<ParkZone[]> {
  return loadFeatures()
    .filter((f) => f.properties.city_slug === citySlug)
    .map(toZone);
}

export async function getZonesByBezirk(
  citySlug: string,
  bezirkSlug: string,
): Promise<ParkZone[]> {
  return loadFeatures()
    .filter(
      (f) =>
        f.properties.city_slug === citySlug &&
        f.properties.bezirk_slug === bezirkSlug,
    )
    .map(toZone);
}

export async function getZoneBySlug(
  citySlug: string,
  bezirkSlug: string,
  zoneId: string,
): Promise<ParkZone | null> {
  const zones = await getZonesByBezirk(citySlug, bezirkSlug);
  return zones.find((z) => z.zone_id === zoneId) ?? null;
}
