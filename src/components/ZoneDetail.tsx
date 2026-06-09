'use client';

import type { ParkZone } from '@/types/zone';
import { formatGebuehr } from '@/lib/fee';
import FeeBadge from './FeeBadge';

const ICON: Record<string, React.ReactNode> = {
  left: <path d="M15 5l-7 7 7 7" />,
  pin: <><path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  euro: <><path d="M16.5 8.2A5 5 0 008 12a5 5 0 008.5 3.8" /><path d="M5.5 10.5h7M5.5 13.5h6" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  nav: <path d="M3 11l18-8-8 18-2.5-7.5L3 11z" />,
};

function Svg({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {ICON[name]}
      </g>
    </svg>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-t border-slate-100 py-3.5">
      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Svg name={icon} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.4px] text-slate-400">
          {label}
        </div>
        <div className="mt-0.5 text-[14.5px] leading-snug text-slate-900">{value}</div>
      </div>
    </div>
  );
}

interface ZoneDetailProps {
  zone: ParkZone;
  onBack: () => void;
  onShowMap: () => void;
}

export default function ZoneDetail({ zone, onBack, onShowMap }: ZoneDetailProps) {
  const fee = formatGebuehr(zone.gebuehr);
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500"
          >
            <Svg name="left" size={15} /> Zurück
          </button>
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.5px] text-slate-900">{zone.name}</h2>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-slate-500">
            <Svg name="pin" size={14} className="text-slate-300" />
            {zone.bezirk}
          </div>
        </div>
        <div className="mt-7">
          <FeeBadge gebuehr={zone.gebuehr} size="lg" />
        </div>
      </div>

      <div className="mt-4">
        {zone.zeiten && <InfoRow icon="clock" label="Parkzeiten" value={zone.zeiten} />}
        <InfoRow
          icon="euro"
          label="Gebühr"
          value={fee === null ? 'Kostenlos parken' : `${fee} € pro Stunde`}
        />
        {zone.besonderheiten && (
          <InfoRow icon="info" label="Besonderheiten" value={zone.besonderheiten} />
        )}
      </div>

      <button
        onClick={onShowMap}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-[15px] font-semibold text-white"
      >
        <Svg name="nav" size={18} /> Auf Karte zeigen
      </button>
    </div>
  );
}
