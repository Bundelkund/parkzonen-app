'use client';

import { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ZoneMapProps {
  initialBbox?: [number, number, number, number];
  center?: [number, number];
  initialZoom?: number;
  selectedZoneId?: number;
  flyTo?: { lng: number; lat: number } | null;
  activeBezirkSlug?: string;
  activeZoneId?: string;
  onZoneClick?: (zone: { id: number; properties: Record<string, unknown> }) => void;
}

const SOURCE_ID = 'parkzonen';
const POINTS_ID = 'parkzonen-points';
const GEOJSON_URL = '/data/berlin.geojson';
const FILL_LAYER = 'parkzonen-fill';
const LINE_LAYER = 'parkzonen-line';
const POINT_LAYER = 'parkzonen-point';

const DEFAULT_CENTER: [number, number] = [13.405, 52.52];
const DEFAULT_ZOOM = 11;

// Calm semantic palette graded to the real price spread (must mirror FEE.map
// in lib/fee.ts). Emphasis darkens the active bezirk / zone.
const COLOR_FREE = '#14b8a6'; // null / kostenlos
const COLOR_LOW = '#3aa873'; // ~2 € günstig
const COLOR_MID = '#e0ad44'; // ~3 € mittel
const COLOR_HIGH = '#dc564b'; // 4 €+ teuer
const COLOR_BEZIRK = '#b8443b'; // darker
const COLOR_ZONE = '#7f2b22'; // darkest

const BASE_FILL: maplibregl.ExpressionSpecification = [
  'case',
  ['==', ['get', 'gebuehr'], null],
  COLOR_FREE,
  ['<', ['to-number', ['get', 'gebuehr'], 0], 2.5],
  COLOR_LOW,
  ['<', ['to-number', ['get', 'gebuehr'], 0], 3.5],
  COLOR_MID,
  COLOR_HIGH,
];

// Progressive emphasis: matching bezirk darker, the exact zone darkest.
function buildFillColor(
  bezirkSlug?: string,
  zoneId?: string,
): maplibregl.ExpressionSpecification {
  if (!bezirkSlug) return BASE_FILL;
  const expr: unknown[] = ['case'];
  if (zoneId) {
    expr.push(
      ['all', ['==', ['get', 'bezirk_slug'], bezirkSlug], ['==', ['get', 'zone_id'], zoneId]],
      COLOR_ZONE,
    );
  }
  expr.push(['==', ['get', 'bezirk_slug'], bezirkSlug], COLOR_BEZIRK);
  expr.push(BASE_FILL);
  return expr as unknown as maplibregl.ExpressionSpecification;
}

// Extend bounds over a Polygon / MultiPolygon geometry's coordinates.
function extendBounds(bounds: maplibregl.LngLatBounds, geometry: GeoJSON.Geometry): void {
  if (!('coordinates' in geometry)) return;
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') {
      bounds.extend(c as [number, number]);
    } else if (Array.isArray(c)) {
      c.forEach(walk);
    }
  };
  walk(geometry.coordinates);
}

// bbox-center of a geometry (cheap centroid for point markers).
function centroidOf(geometry: GeoJSON.Geometry): [number, number] {
  const b = new maplibregl.LngLatBounds();
  extendBounds(b, geometry);
  const c = b.getCenter();
  return [c.lng, c.lat];
}

// Build a point FeatureCollection (one centroid per zone, id + gebuehr kept).
function buildCentroids(fc: GeoJSON.FeatureCollection): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: fc.features.map((f) => ({
      type: 'Feature',
      id: f.id,
      geometry: { type: 'Point', coordinates: centroidOf(f.geometry) },
      properties: f.properties ?? {},
    })),
  };
}

export default function ZoneMapMapLibre({
  initialBbox,
  center,
  initialZoom,
  selectedZoneId,
  flyTo,
  activeBezirkSlug,
  activeZoneId,
  onZoneClick,
}: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  // Toggle 'selected' state on both the polygon and the point source.
  const setState = useCallback((map: maplibregl.Map, id: number, selected: boolean) => {
    map.setFeatureState({ source: SOURCE_ID, id }, { selected });
    if (map.getSource(POINTS_ID)) {
      map.setFeatureState({ source: POINTS_ID, id }, { selected });
    }
  }, []);

  const clearSelection = useCallback(() => {
    const map = mapRef.current;
    if (!map || selectedIdRef.current === null) return;
    setState(map, selectedIdRef.current, false);
    selectedIdRef.current = null;
  }, [setState]);

  const setSelection = useCallback((id: number) => {
    const map = mapRef.current;
    if (!map) return;
    clearSelection();
    setState(map, id, true);
    selectedIdRef.current = id;
  }, [clearSelection, setState]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: center ?? DEFAULT_CENTER,
      zoom: initialZoom ?? DEFAULT_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Static baked GeoJSON source (numeric feature.id for setFeatureState)
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: GEOJSON_URL,
      });

      // Fill layer — colored polygons with data-driven color
      map.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': buildFillColor(activeBezirkSlug, activeZoneId),
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.6,
            0.4,
          ],
        },
      });

      // Line layer — white outlines
      map.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
        },
      });

      // Centroid point markers (one per zone, colored by fee, grow when selected)
      fetch(GEOJSON_URL)
        .then((r) => r.json())
        .then((fc: GeoJSON.FeatureCollection) => {
          if (!mapRef.current || map.getSource(POINTS_ID)) return;
          map.addSource(POINTS_ID, { type: 'geojson', data: buildCentroids(fc) });
          map.addLayer({
            id: POINT_LAYER,
            type: 'circle',
            source: POINTS_ID,
            paint: {
              'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                7,
                4.5,
              ],
              'circle-color': BASE_FILL,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
            },
          });
          map.on('click', POINT_LAYER, (e) => {
            if (!e.features?.length) return;
            const f = e.features[0];
            const id = f.id as number;
            setSelection(id);
            onZoneClick?.({ id, properties: f.properties as Record<string, unknown> });
          });
          map.on('mouseenter', POINT_LAYER, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', POINT_LAYER, () => {
            map.getCanvas().style.cursor = '';
          });
          if (selectedIdRef.current !== null) setState(map, selectedIdRef.current, true);
        })
        .catch(() => {});

      // Fit to initial bbox if provided
      if (initialBbox) {
        map.fitBounds(
          [
            [initialBbox[0], initialBbox[1]],
            [initialBbox[2], initialBbox[3]],
          ],
          { padding: 40 },
        );
      }

      // Apply initial selection if provided
      if (selectedZoneId !== undefined) {
        setSelection(selectedZoneId);
      }
    });

    // Click handler on fill layer
    map.on('click', FILL_LAYER, (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const featureId = feature.id as number;

      setSelection(featureId);

      if (onZoneClick) {
        onZoneClick({
          id: featureId,
          properties: feature.properties as Record<string, unknown>,
        });
      }
    });

    // Pointer cursor on hover
    map.on('mouseenter', FILL_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', FILL_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only run on mount — props used at init time are captured in closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync selectedZoneId prop changes after mount
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedZoneId !== undefined) {
      setSelection(selectedZoneId);
    } else {
      clearSelection();
    }
  }, [selectedZoneId, setSelection, clearSelection]);

  // Fly to address selection (slice-4: AddressSearch -> handleSearchSelect)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;
    map.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 16, speed: 1.2 });
  }, [flyTo]);

  // Route-driven emphasis: recolor + fit when active bezirk/zone changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      if (!map.getLayer(FILL_LAYER)) return;
      map.setPaintProperty(FILL_LAYER, 'fill-color', buildFillColor(activeBezirkSlug, activeZoneId));

      if (!activeBezirkSlug) return;
      const filter = activeZoneId
        ? ['all',
            ['==', ['get', 'bezirk_slug'], activeBezirkSlug],
            ['==', ['get', 'zone_id'], activeZoneId]]
        : ['==', ['get', 'bezirk_slug'], activeBezirkSlug];
      const feats = map.querySourceFeatures(SOURCE_ID, {
        filter: filter as maplibregl.FilterSpecification,
      });
      if (!feats.length) return;
      const bounds = new maplibregl.LngLatBounds();
      for (const f of feats) extendBounds(bounds, f.geometry);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: activeZoneId ? 16 : 13.5 });
      }
    };

    if (map.isStyleLoaded() && map.getLayer(FILL_LAYER)) apply();
    else map.once('idle', apply);
  }, [activeBezirkSlug, activeZoneId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
