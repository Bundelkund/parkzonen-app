// Bake Berlin parking zones: WFS -> normalized static GeoJSON.
// Source verified 2026-06-09: 102 features, EPSG:4326 (lng,lat), UTF-8.
// Run: npm run bake:berlin  (writes public/data/berlin.geojson)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const WFS =
  'https://gdi.berlin.de/services/wfs/parkraumbewirtschaftung' +
  '?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature' +
  '&TYPENAMES=parkraumbewirtschaftung:parkzonen' +
  '&OUTPUTFORMAT=application/json' +
  '&SRSNAME=urn:ogc:def:crs:EPSG::4326';

const OUT = 'public/data/berlin.geojson';

// "Tempelhof-Schöneberg" -> "tempelhof-schoeneberg"
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// "4,00 Euro" -> 4.0 ; non-parsable -> null
function parseGebuehr(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/\s*euro/i, '').replace(',', '.').trim();
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function clean(s) {
  if (s == null) return null;
  const t = String(s).trim();
  return t.length ? t : null;
}

async function main() {
  console.log('Fetching WFS …');
  const res = await fetch(WFS);
  if (!res.ok) throw new Error(`WFS HTTP ${res.status}`);
  // Server serves UTF-8 (verified) — default text decode is correct.
  const raw = JSON.parse(await res.text());
  if (!raw.features?.length) throw new Error('WFS returned 0 features');

  const features = raw.features.map((f, i) => {
    const p = f.properties ?? {};
    const parkzone = String(p.parkzone ?? i + 1);
    const bezirk = clean(p.bezirk) ?? 'Unbekannt';
    return {
      type: 'Feature',
      id: i + 1, // numeric, sequential (ADR-3: setFeatureState needs numeric id)
      geometry: f.geometry,
      properties: {
        zone_id: parkzone,
        name: `Zone ${parkzone}`,
        bezirk,
        bezirk_slug: slugify(bezirk),
        city_slug: 'berlin',
        gebuehr: parseGebuehr(p.gebuehr),
        zeiten: clean(p.zeiten),
        besonderheiten: clean(p.bemerkung),
      },
    };
  });

  const out = { type: 'FeatureCollection', features };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));

  // Distribution log (SA-005: clarifies gebuehr=null presence on first run)
  const free = features.filter((f) => f.properties.gebuehr === null).length;
  const bezirke = new Set(features.map((f) => f.properties.bezirk_slug));
  const fees = features.map((f) => f.properties.gebuehr).filter((g) => g !== null);
  console.log(`✓ ${features.length} features -> ${OUT}`);
  console.log(`  Bezirke: ${bezirke.size} (${[...bezirke].sort().join(', ')})`);
  console.log(`  gebuehr=null (kostenlos/unparsebar): ${free}`);
  console.log(`  gebuehr range: ${Math.min(...fees)}–${Math.max(...fees)} Euro`);
}

main().catch((e) => {
  console.error('✗ Bake failed:', e.message);
  process.exit(1);
});
