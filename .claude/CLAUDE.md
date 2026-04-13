# Parkzonen App

> SEO-first Webapp: Parkzonen, Gebuehren & kostenloses Parken in deutschen Staedten. Mobile-first, nuechtern, ultraschnell.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Frontend | Next.js 14+ (App Router), TypeScript |
| Styling | Tailwind CSS |
| Map | MapLibre GL JS (NOT Google Maps) |
| Basemap | OpenFreeMap positron (kostenlos) |
| Vector Tiles | Martin on Hetzner VPS |
| Geocoding | Nominatim via own API Route (cached) |
| Database | PostGIS on Hetzner VPS |
| Hosting | Vercel (Frontend), Hetzner (Backend) |

## Build & Test

```bash
npx tsc --noEmit        # Type check (no backend needed)
npm run lint             # ESLint
npm run build            # SSG build (needs DATABASE_URL)
npm run dev              # Dev server
```

## Architecture

```
src/
  app/                 # Next.js App Router pages
    page.tsx           # Startseite (/, Hero + CityGrid)
    layout.tsx         # Root layout
    [city]/            # Stadtseite (/berlin)
      [bezirk]/        # Stadtteilseite (/berlin/mitte)
        [zone]/        # Zonendetail (/berlin/mitte/zone-55)
    api/               # API Routes (from backend-mvp, DO NOT MODIFY)
      zone/
      address/
  components/          # React components
    ZoneMapMapLibre.tsx # MapLibre map (Client, dynamic ssr:false)
    MapWrapper.tsx      # Dynamic import wrapper
    AddressSearch.tsx   # Autocomplete search (Client)
    ZoneDetailsPanel.tsx # Bottom-Sheet/Sidebar (Hybrid)
    CityGrid.tsx        # City grid (Server Component)
    SchemaOrg.tsx       # JSON-LD structured data
    AdBanner.tsx        # AdSense banner
  lib/                 # Server utilities
    db.ts              # PostGIS connection (from backend-mvp)
    queries.ts         # DB query helpers
  types/               # Shared TypeScript types
    zone.ts            # ParkZone interface
```

## Rules

| Rule | Required | Forbidden |
|------|----------|-----------|
| Map Library | MapLibre GL JS | Google Maps, Mapbox GL, Leaflet |
| Basemap | OpenFreeMap positron | Paid tile services |
| Geocoding | /api/address/autocomplete | Direct Nominatim from client |
| Map SSR | `next/dynamic({ ssr: false })` | Server-rendering MapLibre |
| Highlighting | `map.setFeatureState()` | Layer filter/repaint |
| Zone Details | Bottom-Sheet (Mobile) / Sidebar (Desktop) | Modals, tooltips-only |
| Colors | Tailwind classes from Design Blueprint | Hardcoded color values |
| Touch Targets | >= 44px on all interactive elements | Small tap targets |
| Commits | Conventional: feat/fix/chore/refactor | Free-form messages |
| API Routes | READ ONLY (from backend-mvp) | Modifying existing API routes |

## Design System

### Polygon Colors (Data-Driven)
- Kostenlos: `#10B981` (emerald-500)
- Guenstig < 2 Euro: `#F59E0B` (amber-500)
- Teuer >= 2 Euro: `#EF4444` (red-500)

### UI Colors
- Background: `bg-slate-50`
- Panels: `bg-white shadow-2xl rounded-t-3xl` (Mobile)
- Primary Action: `bg-slate-900 text-white`

### Typography
- System: `font-sans` (Inter on Vercel)
- Headings: `text-xl font-bold text-slate-900`
- Body: `text-sm text-slate-600`

## Forbidden Patterns

- Google Maps (costs ~500 Euro/mo)
- Direct Nominatim calls from frontend
- SSR for MapLibre component
- `useEffect` without cleanup (memory leaks)
- Hardcoded coordinates (use DB/API)
- Touch targets < 44px
- AdSense overlapping map controls
- `print()` / `console.log` in production
- Modifying files in `src/app/api/` (owned by backend-mvp)

## Agent Team

Plan: `AGENT-TEAM-PLAN.md` in project root.

| Agent | Owns | Off-limits |
|-------|------|------------|
| map-agent | `src/components/ZoneMapMapLibre.tsx`, `MapWrapper.tsx` | `src/app/`, other components |
| pages-agent | `src/app/**`, `src/lib/queries.ts`, `CityGrid.tsx`, `package.json` | Map, Search components |
| search-agent | `AddressSearch.tsx`, `ZoneDetailsPanel.tsx`, `AdBanner.tsx`, `src/types/` | `src/app/`, Map, CityGrid |
| seo-agent | `SchemaOrg.tsx`, `robots.ts`, `sitemap.ts` | All page files |
| qa-agent | Read-only | No modifications |
