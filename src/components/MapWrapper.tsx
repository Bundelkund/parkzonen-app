'use client';

import dynamic from 'next/dynamic';

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

const ZoneMapMapLibre = dynamic(
  () => import('./ZoneMapMapLibre'),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse" />,
  },
);

export default function MapWrapper(props: ZoneMapProps) {
  return <ZoneMapMapLibre {...props} />;
}
