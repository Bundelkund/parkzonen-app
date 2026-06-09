'use client';

import { useState, useEffect, useRef } from 'react';
import type { ParkZone, AutocompleteSuggestion } from '@/types/zone';
import ZoneCard from './ZoneCard';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  zones: ParkZone[];
  onZoneSelect: (zone: ParkZone) => void;
  onAddressSelect: (s: AutocompleteSuggestion) => void;
}

// Search overlay: local zone-name matches + Nominatim address suggestions.
// Mobile = fullscreen, desktop = centered modal. Keeps the server proxy route.
export default function SearchOverlay({
  open,
  onClose,
  zones,
  onZoneSelect,
  onAddressSelect,
}: SearchOverlayProps) {
  const [q, setQ] = useState('');
  const [addr, setAddr] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setAddr([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 3) {
      setAddr([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/address/autocomplete?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          setAddr(data.suggestions ?? []);
        }
      } catch {
        // silent — don't break the overlay
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  if (!open) return null;

  const s = q.trim().toLowerCase();
  const zoneMatches = s
    ? zones
        .filter((z) => z.name.toLowerCase().includes(s) || z.bezirk.toLowerCase().includes(s))
        .slice(0, 6)
    : [];
  const popular = zones.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/30 md:items-start md:justify-center md:pt-24">
      {/* backdrop click closes */}
      <button aria-label="Schließen" className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="relative z-10 flex max-h-full w-full flex-col bg-white md:max-h-[70vh] md:w-[560px] md:max-w-[92vw] md:rounded-2xl md:shadow-2xl">
        {/* Search header */}
        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="ml-1 text-slate-400">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Adresse oder Zone suchen…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          />
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          )}
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-[13px] font-semibold text-slate-500">
            Abbrechen
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3">
          {!s && (
            <>
              <div className="mb-2 px-1 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-slate-400">
                Beliebte Zonen
              </div>
              <div className="flex flex-col gap-2">
                {popular.map((z) => (
                  <ZoneCard key={z.zone_id} zone={z} onSelect={onZoneSelect} />
                ))}
              </div>
            </>
          )}

          {s && addr.length > 0 && (
            <>
              <div className="mb-2 px-1 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-slate-400">
                Adressen
              </div>
              <div className="mb-4 flex flex-col">
                {addr.map((a, i) => (
                  <button
                    key={`${a.lat}-${a.lng}-${i}`}
                    onClick={() => onAddressSelect(a)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-slate-400">
                      <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.75" />
                    </svg>
                    <span className="truncate">{a.display_name}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {s && zoneMatches.length > 0 && (
            <>
              <div className="mb-2 px-1 text-[11.5px] font-semibold uppercase tracking-[0.4px] text-slate-400">
                Zonen
              </div>
              <div className="flex flex-col gap-2">
                {zoneMatches.map((z) => (
                  <ZoneCard key={z.zone_id} zone={z} onSelect={onZoneSelect} />
                ))}
              </div>
            </>
          )}

          {s && !loading && addr.length === 0 && zoneMatches.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">Keine Treffer.</div>
          )}
        </div>
      </div>
    </div>
  );
}
