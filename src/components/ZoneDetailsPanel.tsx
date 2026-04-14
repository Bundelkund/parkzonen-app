'use client';

import { useEffect, useRef } from 'react';
import type { ParkZone } from '@/types/zone';

interface ZoneDetailsPanelProps {
  zone: ParkZone | null;
  isOpen: boolean;
  onClose: () => void;
}

function GebuehrBadge({ gebuehr }: { gebuehr: string | null }) {
  if (gebuehr === null) {
    return (
      <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
        Kostenlos
      </span>
    );
  }

  const amount = parseFloat(gebuehr);
  if (amount < 2) {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
        {gebuehr} &euro;/h
      </span>
    );
  }

  return (
    <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
      {gebuehr} &euro;/h
    </span>
  );
}

function ZoneContent({ zone, onClose }: { zone: ParkZone; onClose: () => void }) {
  return (
    <div className="relative">
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Schliessen"
        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Zone name & bezirk */}
      <h2 className="pr-12 text-xl font-bold text-slate-900">{zone.name}</h2>
      <p className="mt-1 text-sm text-slate-500">{zone.bezirk}</p>

      {/* Gebuehr */}
      <div className="mt-4">
        <GebuehrBadge gebuehr={zone.gebuehr} />
      </div>

      {/* Zeiten */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-700">Parkzeiten</h3>
        <p className="mt-1 text-sm text-slate-600">{zone.zeiten}</p>
      </div>

      {/* Besonderheiten */}
      {zone.besonderheiten && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700">
            Besonderheiten
          </h3>
          <p className="mt-1 text-sm text-slate-600">{zone.besonderheiten}</p>
        </div>
      )}
    </div>
  );
}

export default function ZoneDetailsPanel({
  zone,
  isOpen,
  onClose,
}: ZoneDetailsPanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on overlay tap (mobile)
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleOverlayClick = (e: MouseEvent) => {
      if (e.target === overlay) onClose();
    };

    overlay.addEventListener('mousedown', handleOverlayClick);
    return () => overlay.removeEventListener('mousedown', handleOverlayClick);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!zone) return null;

  return (
    <>
      {/* Mobile bottom sheet (< md) */}
      <div className="md:hidden">
        {/* Overlay */}
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        {/* Sheet */}
        <div
          className={`fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          {/* Drag handle */}
          <div className="flex justify-center pb-2 pt-3">
            <div className="h-1.5 w-10 rounded-full bg-slate-300" />
          </div>
          <div className="px-5 pb-6">
            <ZoneContent zone={zone} onClose={onClose} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar content (>= md) */}
      <div className="hidden md:block">
        <div className="rounded-xl bg-white p-6">
          <ZoneContent zone={zone} onClose={onClose} />
        </div>
      </div>
    </>
  );
}
