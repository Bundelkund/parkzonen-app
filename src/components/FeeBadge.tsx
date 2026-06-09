import { FEE, feeTier, formatGebuehr } from '@/lib/fee';

interface FeeBadgeProps {
  gebuehr: number | string | null;
  size?: 'sm' | 'lg';
}

// Pill badge: colored dot + "4,00 €/h", or the tier label when free.
export default function FeeBadge({ gebuehr, size = 'sm' }: FeeBadgeProps) {
  const f = FEE[feeTier(gebuehr)];
  const value = formatGebuehr(gebuehr);
  const big = size === 'lg';
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold leading-none ${
        big ? 'gap-[7px] px-[13px] py-[7px] text-sm' : 'gap-[5px] px-[9px] py-1 text-xs'
      }`}
      style={{ background: f.bg, color: f.fg }}
    >
      <span
        className="rounded-full"
        style={{ width: big ? 8 : 6, height: big ? 8 : 6, background: f.dot }}
      />
      {value === null ? (
        f.label
      ) : (
        <>
          {value}&nbsp;€<span className="font-medium opacity-65">/h</span>
        </>
      )}
    </span>
  );
}
