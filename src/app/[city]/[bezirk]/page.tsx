import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getStaedte,
  getStadtBySlug,
  getBezirkeByStadt,
  getBezirkBySlug,
  getZonesByBezirk,
} from '@/lib/queries';

type Props = {
  params: Promise<{ city: string; bezirk: string }>;
};

export async function generateStaticParams() {
  const staedte = await getStaedte();
  const results: { city: string; bezirk: string }[] = [];
  for (const stadt of staedte) {
    const bezirke = await getBezirkeByStadt(stadt.slug);
    for (const b of bezirke) {
      results.push({ city: stadt.slug, bezirk: b.slug });
    }
  }
  return results;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, bezirk } = await params;
  const [stadt, bezirkData] = await Promise.all([
    getStadtBySlug(city),
    getBezirkBySlug(city, bezirk),
  ]);
  if (!stadt || !bezirkData) return {};
  return {
    title: `Parkzonen ${bezirkData.name}, ${stadt.name} — Gebuehren & Zeiten`,
    description: `Alle Parkzonen in ${bezirkData.name}, ${stadt.name}. Gebuehren, Parkzeiten und Anwohnerparkzonen auf einen Blick.`,
  };
}

function GebuehrBadge({ gebuehr }: { gebuehr: string | null }) {
  if (gebuehr === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        Kostenlos
      </span>
    );
  }
  const value = parseFloat(gebuehr);
  const colorClass =
    value >= 2
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {gebuehr} €/h
    </span>
  );
}

export default async function BezirkPage({ params }: Props) {
  const { city, bezirk } = await params;
  const [stadt, bezirkData, zones] = await Promise.all([
    getStadtBySlug(city),
    getBezirkBySlug(city, bezirk),
    getZonesByBezirk(city, bezirk),
  ]);

  if (!stadt || !bezirkData) notFound();

  return (
    <div className="p-4">
      <Link
        href={`/${city}`}
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        ← {stadt.name}
      </Link>

      <h1 className="text-xl font-bold text-slate-900 mb-1">
        {bezirkData.name}
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        {zones.length} Parkzone{zones.length !== 1 ? 'n' : ''}
      </p>

      <ul className="space-y-2">
        {zones.map((zone) => (
          <li key={zone.zone_id}>
            <Link
              href={`/${city}/${bezirk}/${zone.zone_id}`}
              className="flex items-center justify-between min-h-[3rem] px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
            >
              <div>
                <span className="text-sm font-medium text-slate-900 block">{zone.name}</span>
                <span className="text-xs text-slate-500">{zone.zeiten}</span>
              </div>
              <GebuehrBadge gebuehr={zone.gebuehr} />
            </Link>
          </li>
        ))}
      </ul>

      {zones.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">
          Keine Parkzonen gefunden.
        </p>
      )}
    </div>
  );
}
