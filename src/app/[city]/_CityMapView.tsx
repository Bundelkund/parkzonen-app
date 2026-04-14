'use client';

import { useState } from 'react';
import AddressSearch from '@/components/AddressSearch';
import ZoneDetailsPanel from '@/components/ZoneDetailsPanel';
import MapWrapper from '@/components/MapWrapper';
import type { ParkZone, AutocompleteSuggestion } from '@/types/zone';

export interface CityMapViewProps {
  children: React.ReactNode;
  initialBbox: [number, number, number, number];
}

export default function CityMapView({ children, initialBbox }: CityMapViewProps) {
  const [selectedZone, setSelectedZone] = useState<ParkZone | null>(null);

  function handleZoneClick(zone: { id: number; properties: Record<string, unknown> }) {
    const props = zone.properties;
    const mapped: ParkZone = {
      zone_id: String(props.zone_id ?? zone.id),
      name: String(props.name ?? ''),
      bezirk: String(props.bezirk ?? ''),
      bezirk_slug: String(props.bezirk_slug ?? ''),
      gebuehr: props.gebuehr != null ? String(props.gebuehr) : null,
      zeiten: String(props.zeiten ?? ''),
      besonderheiten: props.besonderheiten != null ? String(props.besonderheiten) : null,
    };
    setSelectedZone(mapped);
  }

  function handleSearchSelect(suggestion: AutocompleteSuggestion) {
    // Future: fly map to suggestion coordinates using a map ref
    console.log('Address selected:', suggestion.display_name, suggestion.lat, suggestion.lng);
  }

  return (
    <div className="flex flex-col flex-1 md:flex-row md:h-dvh">
      {/* Sidebar */}
      <div className="relative z-10 md:w-[30%] md:min-w-[320px] md:overflow-y-auto bg-white md:shadow-lg flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <AddressSearch
            onSelect={handleSearchSelect}
            placeholder="Adresse suchen..."
            className="w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        {/* Desktop: panel inline at sidebar bottom */}
        <div className="hidden md:block">
          <ZoneDetailsPanel
            zone={selectedZone}
            isOpen={selectedZone !== null}
            onClose={() => setSelectedZone(null)}
          />
        </div>
      </div>

      {/* Map */}
      <div className="h-[60vh] md:h-auto md:w-[70%] md:flex-1">
        <MapWrapper initialBbox={initialBbox} onZoneClick={handleZoneClick} />
      </div>

      {/* Mobile: bottom sheet */}
      <div className="md:hidden">
        <ZoneDetailsPanel
          zone={selectedZone}
          isOpen={selectedZone !== null}
          onClose={() => setSelectedZone(null)}
        />
      </div>
    </div>
  );
}
