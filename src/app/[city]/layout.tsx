import { notFound } from 'next/navigation';
import { getStadtBySlug } from '@/lib/queries';
import SchemaOrg from '@/components/SchemaOrg';
import CityMapView from './_CityMapView';

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const stadt = await getStadtBySlug(city);

  if (!stadt) {
    notFound();
  }

  return (
    <>
      <SchemaOrg
        type="Dataset"
        name={`Parkzonen in ${stadt.name}`}
        description={`Alle Parkzonen und Parkgebuehren in ${stadt.name} nach Bezirk.`}
        url={`https://parkzonen.de/${city}`}
      />
      <CityMapView initialBbox={stadt.bbox}>
        {children}
      </CityMapView>
    </>
  );
}
