# Project Guardrails — Parkzonen App

## Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- One feature per commit
- `npx tsc --noEmit` must pass before commit

## Architecture
- NO business logic in components — data fetching in `src/lib/`
- NO cross-concern imports (map components don't import search components)
- Server Components by default — `"use client"` only when needed
- API Routes in `src/app/api/` are READ ONLY (from backend-mvp)

## Map
- MapLibre GL JS ONLY — no Google Maps, no Leaflet, no Mapbox
- OpenFreeMap positron basemap — no paid tiles
- `next/dynamic({ ssr: false })` for all map components
- `map.setFeatureState()` for highlighting — no layer repaint
- Always dispose map in useEffect cleanup

## Design
- Nuechtern, Google-Maps-artig — no playful/colorful UI
- Touch targets >= 44px (Tailwind: `h-12`, `py-4 px-4`)
- Mobile: Bottom-Sheet for details. Desktop: Sidebar (30%)
- No modals, no tooltips-only for zone details
- Polygon colors: emerald-500 (free), amber-500 (cheap), red-500 (expensive)

## SEO
- Every page needs `generateMetadata`
- Static generation via `generateStaticParams` where possible
- Schema.org JSON-LD on city/district pages