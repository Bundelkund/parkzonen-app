'use client';

import { FEE, type FeeTier } from '@/lib/fee';

export type FilterKey = 'all' | FeeTier;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'free', label: 'Kostenlos' },
  { key: 'cheap', label: 'Günstig' },
  { key: 'paid', label: 'Teuer' },
];

interface FilterChipsProps {
  value: FilterKey;
  onChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}

export default function FilterChips({ value, onChange, counts }: FilterChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-px [scrollbar-width:none]">
      {FILTERS.map((f) => {
        const active = value === f.key;
        const dot = f.key !== 'all' ? FEE[f.key].dot : null;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-[11px] py-[7px] text-[13px] font-semibold transition-all ${
              active
                ? 'border-transparent bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-500'
            }`}
          >
            {dot && (
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: dot }} />
            )}
            {f.label}
            <span className={`font-medium ${active ? 'opacity-70' : 'opacity-55'}`}>
              {counts[f.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
