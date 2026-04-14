interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SchemaOrgProps {
  type: 'Dataset' | 'WebPage';
  name: string;
  description: string;
  url: string;
  breadcrumb?: BreadcrumbItem[];
}

export default function SchemaOrg({
  type,
  name,
  description,
  url,
  breadcrumb,
}: SchemaOrgProps) {
  let schema: Record<string, unknown>;

  if (type === 'Dataset') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name,
      description,
      url,
      license: 'https://creativecommons.org/licenses/by/4.0/',
    };
  } else {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name,
      description,
      url,
      ...(breadcrumb && breadcrumb.length > 0
        ? {
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumb.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url,
              })),
            },
          }
        : {}),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  );
}
