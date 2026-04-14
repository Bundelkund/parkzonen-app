import Link from 'next/link';
import CityGrid from '@/components/CityGrid';
import HomeSearch from './_HomeSearch';

export default function Home() {
  return (
    <main className="flex flex-col flex-1">
      {/* Hero */}
      <section className="w-full max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          Parkzonen in Deutschland
        </h1>
        <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
          Finde Parkzonen, Gebuehren und kostenloses Parken in deiner Stadt
        </p>

        <div className="mt-8 max-w-xl mx-auto">
          <HomeSearch />
        </div>

        <div className="mt-6">
          <Link
            href="/berlin"
            className="inline-flex items-center justify-center h-12 px-8 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Parkzonen in Berlin ansehen
          </Link>
        </div>
      </section>

      {/* City Grid */}
      <CityGrid />
    </main>
  );
}
