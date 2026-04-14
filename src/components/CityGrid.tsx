import Link from 'next/link';
import { getStaedte } from '@/lib/queries';

export default async function CityGrid() {
  const staedte = await getStaedte();

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-slate-900 mb-4">
        Verfuegbare Staedte
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {staedte
          .filter((stadt) => stadt.active)
          .map((stadt) => (
            <Link
              key={stadt.slug}
              href={`/${stadt.slug}`}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-slate-900">
                {stadt.name}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Parkzonen ansehen
              </p>
            </Link>
          ))}
      </div>
    </section>
  );
}
