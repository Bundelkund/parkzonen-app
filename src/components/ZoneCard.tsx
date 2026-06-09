'use client';

import type { ParkZone } from '@/types/zone';
import FeeBadge from './FeeBadge';

interface ZoneCardProps {
  zone: ParkZone;
  onSelect: (zone: ParkZone) => void;
  active?: boolean;
}

// List row: name + "bezirk · zeiten" + fee badge + chevron.
export default function ZoneCard({ zone, onSelect, active = false }: ZoneCardProps) {
  return (
    <button
      onClick={() => onSelect(zone)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
        active ? 'border-slate-900/30 bg-slate-900/[0.04]' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold tracking-[-0.2px] text-slate-900">
          {zone.name}
        </div>
        <div className="mt-0.5 flex items-center gap-2 truncate text-[12.5px] text-slate-500">
          <span>{zone.bezirk}</span>
          {zone.zeiten && <span className="text-slate-300">·</span>}
          <span className="truncate">{zone.zeiten}</span>
        </div>
      </div>
      <FeeBadge gebuehr={zone.gebuehr} />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="-ml-0.5 shrink-0 text-slate-300">
        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
