import type { MetadataRoute } from 'next';
import { getStaedte, getBezirkeByStadt, getZonesByBezirk } from '@/lib/queries';

const BASE_URL = 'https://parkzonen.de';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  const staedte = await getStaedte();

  for (const stadt of staedte) {
    entries.push({
      url: `${BASE_URL}/${stadt.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });

    const bezirke = await getBezirkeByStadt(stadt.slug);

    for (const bezirk of bezirke) {
      entries.push({
        url: `${BASE_URL}/${stadt.slug}/${bezirk.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });

      const zones = await getZonesByBezirk(stadt.slug, bezirk.slug);

      for (const zone of zones) {
        entries.push({
          url: `${BASE_URL}/${stadt.slug}/${bezirk.slug}/${zone.zone_id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  }

  return entries;
}
