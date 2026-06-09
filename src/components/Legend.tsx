import { FEE, type FeeTier } from '@/lib/fee';

const TIERS: FeeTier[] = ['free', 'cheap', 'paid'];

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3.5">
      {TIERS.map((t) => (
        <span key={t} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: FEE[t].map }} />
          {FEE[t].label}
        </span>
      ))}
    </div>
  );
}
