'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import MapWrapper from '@/components/MapWrapper';
import BottomSheet from '@/components/BottomSheet';
import FilterChips, { type FilterKey } from '@/components/FilterChips';
import ZoneCard from '@/components/ZoneCard';
import ZoneDetail from '@/components/ZoneDetail';
import SearchOverlay from '@/components/SearchOverlay';
import Legend from '@/components/Legend';
import { feeTier } from '@/lib/fee';
import type { ParkZone, AutocompleteSuggestion } from '@/types/zone';

export interface CityMapViewProps {
  children: React.ReactNode;
  initialBbox: [number, number, number, number];
  zones: ParkZone[];
}

function zoneCenter(z: ParkZone): { lng: number; lat: number } | null {
  if (!z.bbox) return null;
  return { lng: (z.bbox[0] + z.bbox[2]) / 2, lat: (z.bbox[1] + z.bbox[3]) / 2 };
}

function SearchPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[46px] flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-white/90 px-3.5 text-left shadow-[0_2px_10px_rgba(20,25,35,0.08)] backdrop-blur-md"
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className="text-slate-400">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
        <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <span className="text-[15px] text-slate-400">Adresse oder Zone suchen…</span>
    </button>
  );
}

function LocateButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Mein Standort"
      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/90 shadow-[0_2px_10px_rgba(20,25,35,0.08)] backdrop-blur-md"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-900">
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
    </button>
  );
}

// Variant A — "Karte zuerst": fullscreen map + bottom sheet (mobile) /
// floating panel (desktop). Backend (geojson, Nominatim, emphasis, flyTo) kept.
export default function CityMapView({ children, initialBbox, zones }: CityMapViewProps) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedZone, setSelectedZone] = useState<ParkZone | null>(null);
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number } | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Route-driven emphasis + deep-link preselect (/[city]/[bezirk]/[zone]).
  const segments = usePathname().split('/').filter(Boolean);
  const activeBezirkSlug = segments[1];
  const activeZoneId = segments[2];

  useEffect(() => {
    if (!activeZoneId) return;
    const z = zones.find(
      (z) => z.bezirk_slug === activeBezirkSlug && z.zone_id === activeZoneId,
    );
    if (z) {
      setSelectedZone(z);
      const c = zoneCenter(z);
      if (c) setFlyTo(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBezirkSlug, activeZoneId]);

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = { all: zones.length, free: 0, cheap: 0, paid: 0 };
    zones.forEach((z) => {
      c[feeTier(z.gebuehr)]++;
    });
    return c;
  }, [zones]);

  const list = useMemo(
    () => (filter === 'all' ? zones : zones.filter((z) => feeTier(z.gebuehr) === filter)),
    [filter, zones],
  );

  function selectZone(z: ParkZone) {
    setSelectedZone(z);
    const c = zoneCenter(z);
    if (c) setFlyTo(c);
    setSheetExpanded(true);
  }

  function handleZoneClick(zone: { id: number; properties: Record<string, unknown> }) {
    const p = zone.properties;
    setSelectedZone({
      id: zone.id,
      zone_id: String(p.zone_id ?? zone.id),
      name: String(p.name ?? ''),
      bezirk: String(p.bezirk ?? ''),
      bezirk_slug: String(p.bezirk_slug ?? ''),
      gebuehr: p.gebuehr != null ? String(p.gebuehr) : null,
      zeiten: String(p.zeiten ?? ''),
      besonderheiten: p.besonderheiten != null ? String(p.besonderheiten) : null,
    });
    setSheetExpanded(true);
  }

  function handleAddressSelect(s: AutocompleteSuggestion) {
    setFlyTo({ lng: s.lng, lat: s.lat });
    setSearchOpen(false);
  }

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setFlyTo({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
    );
  }

  // Shared list / detail body for both the mobile sheet and the desktop panel.
  const body = selectedZone ? (
    <div className="flex-1 overflow-y-auto px-[18px] pb-7 pt-3">
      <ZoneDetail
        zone={selectedZone}
        onBack={() => setSelectedZone(null)}
        onShowMap={() => setSheetExpanded(false)}
      />
    </div>
  ) : (
    <>
      <div className="shrink-0 px-4 pb-3 pt-3">
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="m-0 text-lg font-bold tracking-[-0.4px] text-slate-900">Parkzonen Berlin</h1>
          <span className="font-mono text-[13px] text-slate-500">{list.length} Zonen</span>
        </div>
        <FilterChips value={filter} onChange={setFilter} counts={counts} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-6">
        {list.map((z) => (
          <ZoneCard key={z.zone_id} zone={z} onSelect={selectZone} />
        ))}
      </div>
    </>
  );

  return (
    <div className="relative flex-1">
      {/* SEO / no-JS fallback */}
      <div className="sr-only">{children}</div>

      <div className="absolute inset-0">
        <MapWrapper
          initialBbox={initialBbox}
          flyTo={flyTo}
          selectedZoneId={selectedZone?.id}
          activeBezirkSlug={activeBezirkSlug}
          activeZoneId={activeZoneId}
          onZoneClick={handleZoneClick}
        />
      </div>

      {/* Mobile: floating search */}
      <div className="absolute inset-x-3.5 top-3.5 z-20 flex gap-2.5 md:hidden">
        <SearchPill onClick={() => setSearchOpen(true)} />
        <LocateButton onClick={locate} />
      </div>

      {/* Desktop: floating panel */}
      <div className="absolute bottom-3.5 left-3.5 top-3.5 z-20 hidden w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(20,25,35,0.12)] md:flex">
        <div className="flex shrink-0 gap-2.5 border-b border-slate-100 p-3">
          <SearchPill onClick={() => setSearchOpen(true)} />
          <LocateButton onClick={locate} />
        </div>
        {body}
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden">
        <BottomSheet expanded={selectedZone ? true : sheetExpanded} setExpanded={setSheetExpanded} peek={280}>
          {body}
        </BottomSheet>
      </div>

      {/* Desktop: legend */}
      <div className="absolute bottom-4 right-4 z-20 hidden rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur md:block">
        <Legend />
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        zones={zones}
        onZoneSelect={(z) => {
          selectZone(z);
          setSearchOpen(false);
        }}
        onAddressSelect={handleAddressSelect}
      />
    </div>
  );
}
