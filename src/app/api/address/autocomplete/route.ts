import { NextResponse } from 'next/server';

// Server-side Nominatim proxy (ADR-2: frontend never calls Nominatim directly).
// Berlin-bounded, in-memory cache TTL 1h, rate-limit-safe (1 req/s policy).

export const runtime = 'nodejs';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Suggestion {
  display_name: string;
  lat: number;
  lng: number;
}

const TTL_MS = 60 * 60 * 1000; // 1h
const cache = new Map<string, { ts: number; data: Suggestion[] }>();

// Berlin bounding box as Nominatim viewbox: lon_left,lat_top,lon_right,lat_bottom
const BERLIN_VIEWBOX = '13.088,52.675,13.761,52.338';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 3) return NextResponse.json({ suggestions: [] });

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) {
    return NextResponse.json({ suggestions: hit.data });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'de');
  url.searchParams.set('viewbox', BERLIN_VIEWBOX);
  url.searchParams.set('bounded', '1');

  try {
    const res = await fetch(url, {
      // Nominatim usage policy requires an identifying User-Agent.
      headers: { 'User-Agent': 'parkzonen.de/1.0 (florian@konektos.de)' },
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const raw = (await res.json()) as NominatimResult[];
    const suggestions: Suggestion[] = raw.map((r) => ({
      display_name: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
    cache.set(key, { ts: Date.now(), data: suggestions });
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
