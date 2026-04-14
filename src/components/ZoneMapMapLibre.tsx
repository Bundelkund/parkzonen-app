'use client';

import { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface ZoneMapProps {
  initialBbox?: [number, number, number, number];
  center?: [number, number];
  initialZoom?: number;
  selectedZoneId?: number;
  onZoneClick?: (zone: { id: number; properties: Record<string, unknown> }) => void;
}

const SOURCE_ID = 'parkzonen';
const SOURCE_LAYER = 'parkzonen';
const FILL_LAYER = 'parkzonen-fill';
const LINE_LAYER = 'parkzonen-line';

const DEFAULT_CENTER: [number, number] = [13.405, 52.52];
const DEFAULT_ZOOM = 11;

export default function ZoneMapMapLibre({
  initialBbox,
  center,
  initialZoom,
  selectedZoneId,
  onZoneClick,
}: ZoneMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  const clearSelection = useCallback(() => {
    const map = mapRef.current;
    if (!map || selectedIdRef.current === null) return;
    map.setFeatureState(
      { source: SOURCE_ID, sourceLayer: SOURCE_LAYER, id: selectedIdRef.current },
      { selected: false },
    );
    selectedIdRef.current = null;
  }, []);

  const setSelection = useCallback((id: number) => {
    const map = mapRef.current;
    if (!map) return;
    clearSelection();
    map.setFeatureState(
      { source: SOURCE_ID, sourceLayer: SOURCE_LAYER, id },
      { selected: true },
    );
    selectedIdRef.current = id;
  }, [clearSelection]);

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
      // Add Martin vector tile source
      map.addSource(SOURCE_ID, {
        type: 'vector',
        tiles: ['https://tiles.parkzonen.de/parkzonen/{z}/{x}/{y}.mvt'],
        minzoom: 10,
        maxzoom: 18,
      });

      // Fill layer — colored polygons with data-driven color
      map.addLayer({
        id: FILL_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        'source-layer': SOURCE_LAYER,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'gebuehr'], null],
            '#10B981',
            ['<', ['to-number', ['get', 'gebuehr']], 2.0],
            '#F59E0B',
            '#EF4444',
          ],
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
        'source-layer': SOURCE_LAYER,
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
        },
      });

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

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  );
}
