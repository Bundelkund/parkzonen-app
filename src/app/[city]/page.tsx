import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getStaedte, getStadtBySlug, getBezirkeByStadt, getZonesByBezirk } from '@/lib/queries';

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateStaticParams() {
  const staedte = await getStaedte();
  return staedte.map((stadt) => ({ city: stadt.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const stadt = await getStadtBySlug(city);
  if (!stadt) return {};
  return {
    title: `Parkzonen in ${stadt.name} — Bezirke & Gebuehren`,
    description: `Alle Parkzonen und Parkgebuehren in ${stadt.name} nach Bezirk. Kostenlose und kostenpflichtige Parkzonen im Ueberblick.`,
  };
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;
  const [stadt, bezirke] = await Promise.all([
    getStadtBySlug(city),
    getBezirkeByStadt(city),
  ]);

  if (!stadt) notFound();

  // Fetch zone counts per bezirk
  const zoneCounts = await Promise.all(
    bezirke.map(async (b) => {
      const zones = await getZonesByBezirk(city, b.slug);
      return { slug: b.slug, count: zones.length };
    }),
  );
  const zoneCountMap = Object.fromEntries(zoneCounts.map((z) => [z.slug, z.count]));

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-1">
        Parkzonen in {stadt.name}
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        {bezirke.length} Bezirke mit Parkraumbewirtschaftung
      </p>

      <ul className="space-y-2">
        {bezirke.map((bezirk) => (
          <li key={bezirk.slug}>
            <Link
              href={`/${city}/${bezirk.slug}`}
              className="flex items-center justify-between h-12 px-4 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <span className="text-sm font-medium text-slate-900">{bezirk.name}</span>
              <span className="text-xs text-slate-500">
                {zoneCountMap[bezirk.slug] ?? 0} Zone{(zoneCountMap[bezirk.slug] ?? 0) !== 1 ? 'n' : ''}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
