import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getStaedte,
  getStadtBySlug,
  getBezirkeByStadt,
  getBezirkBySlug,
  getZonesByBezirk,
  getZoneBySlug,
} from '@/lib/queries';

type Props = {
  params: Promise<{ city: string; bezirk: string; zone: string }>;
};

export async function generateStaticParams() {
  const staedte = await getStaedte();
  const results: { city: string; bezirk: string; zone: string }[] = [];
  for (const stadt of staedte) {
    const bezirke = await getBezirkeByStadt(stadt.slug);
    for (const b of bezirke) {
      const zones = await getZonesByBezirk(stadt.slug, b.slug);
      for (const z of zones) {
        results.push({ city: stadt.slug, bezirk: b.slug, zone: z.zone_id });
      }
    }
  }
  return results;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, bezirk, zone } = await params;
  const [stadt, zoneData] = await Promise.all([
    getStadtBySlug(city),
    getZoneBySlug(city, bezirk, zone),
  ]);
  if (!stadt || !zoneData) return {};
  const gebuehrText = zoneData.gebuehr
    ? `${zoneData.gebuehr} €/h`
    : 'Kostenloses Parken';
  return {
    title: `${zoneData.name} — ${zoneData.bezirk}, ${stadt.name}`,
    description: `Parkzone ${zoneData.name} in ${zoneData.bezirk}, ${stadt.name}. ${gebuehrText}. Parkzeiten: ${zoneData.zeiten}.`,
  };
}

function GebuehrBadge({ gebuehr }: { gebuehr: string | null }) {
  if (gebuehr === null) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
        Kostenlos parken
      </span>
    );
  }
  const value = parseFloat(gebuehr);
  const colorClass =
    value >= 2
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {gebuehr} €/h
    </span>
  );
}

export default async function ZonePage({ params }: Props) {
  const { city, bezirk, zone } = await params;
  const [stadt, bezirkData, zoneData] = await Promise.all([
    getStadtBySlug(city),
    getBezirkBySlug(city, bezirk),
    getZoneBySlug(city, bezirk, zone),
  ]);

  if (!stadt || !bezirkData || !zoneData) notFound();

  return (
    <div className="p-4">
      <Link
        href={`/${city}/${bezirk}`}
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 mb-4"
      >
        ← {bezirkData.name}
      </Link>

      <div className="flex items-start justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-slate-900">{zoneData.name}</h1>
        <GebuehrBadge gebuehr={zoneData.gebuehr} />
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Bezirk</p>
          <p className="text-sm font-medium text-slate-900">{zoneData.bezirk}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Parkzeiten</p>
          <p className="text-sm font-medium text-slate-900">{zoneData.zeiten}</p>
        </div>

        {zoneData.gebuehr && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Gebuehr</p>
            <p className="text-sm font-medium text-slate-900">{zoneData.gebuehr} €/h</p>
          </div>
        )}

        {zoneData.besonderheiten && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Besonderheiten</p>
            <p className="text-sm text-slate-700">{zoneData.besonderheiten}</p>
          </div>
        )}
      </div>
    </div>
  );
}
