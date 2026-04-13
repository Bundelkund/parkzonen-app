# Parkzonen Deutschland Frontend MVP — Agent Team Build Plan

## Overview

Mobile-first Next.js Webapp die Berliner Parkzonen auf einer interaktiven MapLibre-Karte mit farbkodierten Polygonen darstellt, Adresssuche mit Autocomplete bietet und SEO-optimierte Seiten statisch generiert. Nuechtern, ultraschnell, nutzwertorientiert.

**Backend-Abhaengigkeit**: Backend MVP (01-backend-mvp) wird NICHT fuer den Code-Build benoetigt. Alle Agents koennen Code schreiben, type-checken (`tsc --noEmit`) und Komponenten strukturell testen ohne laufende Backend-Services. Backend (PostGIS + Martin + API Routes) wird erst fuer folgende Schritte benoetigt:
- `npm run build` mit `generateStaticParams` (braucht `DATABASE_URL`)
- Map mit echten Parkzonen-Polygonen sehen (braucht Martin Tiles)
- Autocomplete/Zone-Lookup testen (braucht API Routes + Nominatim)
- QA Agent End-to-End Validation (braucht alles live)

## Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Map**: MapLibre GL JS + OpenFreeMap positron Basemap (kostenlos)
- **Vector Tiles**: Martin auf Hetzner VPS (`tiles.parkzonen.de`)
- **Geocoding**: Nominatim via eigene API Route (serverseitiger Cache)
- **Database**: PostGIS auf Hetzner VPS (Tabellen `staedte`, `parkzonen`)
- **Hosting**: Vercel (Frontend), Hetzner VPS (PostGIS + Martin)

## Contract Chain

```
PostGIS (staedte + parkzonen Tabellen)
  → Martin Vector Tiles (tiles.parkzonen.de)
    → Map Agent (konsumiert MVT-Tiles)
  → API Routes (01-backend-mvp liefert /api/zone, /api/address, /api/address/autocomplete)
    → Search Agent (konsumiert API)
    → Pages Agent (konsumiert API fuer generateStaticParams + SSG)
  → Pages Agent (konsumiert DB Queries fuer Stadt/Bezirk-Daten)
    → SEO Agent (generiert Metadata auf fertige Pages)
```

**Spawn Order**: Map Agent + Pages Agent + Search Agent parallel → SEO Agent nach Pages fertig → QA Agent zuletzt
**Hinweis**: Alle Developer-Agents (map, pages, search, seo) koennen OHNE laufendes Backend arbeiten. QA Agent braucht Backend live.

## Protected Resources (DO NOT DROP/CREATE)

- **PostGIS Tabellen** `staedte`, `parkzonen` — READ ONLY, enthalten Live-Daten aus 01-backend-mvp
- **Martin Config** `martin.yaml` — nicht aendern, liefert Vector Tiles
- **Caddy Config** — nicht aendern, Reverse Proxy fuer Martin
- **n8n Workflows** — nicht aendern, Berlin Collector
- **API Routes** aus 01-backend-mvp: `/api/zone/route.ts`, `/api/address/route.ts` — nicht ueberschreiben, nur konsumieren
- **DB Connection Helper** `src/lib/db.ts` — falls von backend-mvp angelegt, NICHT ueberschreiben

## API Contracts (from Backend MVP — READ ONLY)

### GET /api/zone?lat={lat}&lng={lng}
```json
{"zones": [{"zone_id": "1", "name": "Zone 1", "bezirk": "Mitte", "gebuehr": "4.00", "zeiten": "Mo-Sa 9-22 Uhr", "besonderheiten": "..."}], "city": "berlin"}
```

### GET /api/address/autocomplete?q={partial_query}
```json
{"suggestions": [{"display_name": "Torstrasse 1, Mitte, Berlin", "lat": 52.5275, "lng": 13.4155}]}
```

### GET /api/zone/{city_slug}/{bezirk_slug}/{zone_id}
```json
{"zone_id": "55", "name": "Zone 55", "bezirk": "Mitte", "bezirk_slug": "mitte", "city": "berlin", "gebuehr": "3.00", "zeiten": "Mo-Sa 9-20 Uhr", "besonderheiten": null, "bbox": [13.38, 52.51, 13.40, 52.53]}
```

### Martin Vector Tiles
```
URL: https://tiles.parkzonen.de/parkzonen/{z}/{x}/{y}.mvt
Source-Layer: parkzonen
Feature-ID: parkzonen.id (SERIAL PRIMARY KEY — integer, NOT in properties)
Properties: zone_id, name, bezirk, bezirk_slug, gebuehr, zeiten
Zoom: 10-18
```

## Design Blueprint

Kein formales design.md vorhanden (Scanner: complexity 0, no Stitch). Design-Tokens aus `design-concept.md` + `requirements.md`:

### Farb-Tokens (Karten-Polygone, Data-Driven)
| Bedeutung | Hex | Tailwind | MapLibre Expression |
|-----------|-----|----------|---------------------|
| Kostenlos (gebuehr = null) | `#10B981` | emerald-500 | `['==', ['get', 'gebuehr'], null]` |
| Guenstig (gebuehr < 2.00) | `#F59E0B` | amber-500 | `['<', ['to-number', ['get', 'gebuehr']], 2.0]` |
| Teuer (gebuehr >= 2.00) | `#EF4444` | red-500 | Default fallback |

### UI-Farben (Tailwind)
- Hintergruende: `bg-slate-50`
- Panels/Bottom-Sheet: `bg-white`, `shadow-2xl`, `rounded-t-3xl` (Mobile)
- Primary Action (Buttons): `bg-slate-900 text-white`

### Typografie
- System: `font-sans` (Inter auf Vercel)
- Ueberschriften: `text-xl font-bold text-slate-900`
- Fliesstext: `text-sm text-slate-600`

### Polygon Opacity (Feature-State)
- Default: `fill-opacity: 0.4`
- Selected: `fill-opacity: 0.6` (via `map.setFeatureState`)
- Outline: `line-color: #ffffff`, `line-width: 1`

### Touch-Targets
- Minimum 44px fuer ALLE interaktiven Elemente
- Inputs: `h-12` (48px)
- Buttons/Links: `py-4 px-4`

### Responsive Breakpoints
- Mobile (< 768px / `md:`): Fullscreen-Karte + Bottom-Sheet von unten
- Desktop (>= 768px): Sidebar links (30%) + Karte rechts (70%)

### Anti-Patterns (Design)
- NO colorful/playful UI — nuechtern, Google-Maps-artig
- NO modals/popups for zone details — Bottom-Sheet/Sidebar only
- NO custom fonts beyond Inter — system font stack
- NO decorative elements — pure utility

## Agent Roles & File Ownership

### Agent 1: map-agent
Baut die MapLibre-Kartenkomponente mit Vector Tiles und Feature-State Highlighting.

- **Owns**: `src/components/ZoneMapMapLibre.tsx`, `src/components/MapWrapper.tsx`
- **Off-limits**: `src/app/`, `src/components/AddressSearch.tsx`, `src/components/ZoneDetailsPanel.tsx`, `src/components/CityGrid.tsx`, `src/lib/`
- **Delivers**: Fertige Kartenkomponente mit Props-Interface:
  ```typescript
  interface ZoneMapProps {
    initialBbox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
    center?: [number, number]; // [lng, lat]
    initialZoom?: number;
    selectedZoneId?: number;
    onZoneClick?: (zone: { id: number; properties: Record<string, unknown> }) => void;
  }
  ```
- **Discovery Tasks**:
  - Verify Martin tiles reachable: `curl -sI https://tiles.parkzonen.de/parkzonen/14/8802/5374.mvt`
  - Verify Feature-ID is top-level integer in MVT (not just in properties)
  - Verify OpenFreeMap positron style URL is reachable
- **Freedom**: MapLibre initialization pattern, cleanup logic, attribution placement, gesture handling, map controls
- **Escalate to Lead**: If Martin tiles return 404 or Feature-IDs are not integers
- **Validation**:
  - `npx tsc --noEmit`
  - Dev server: Karte rendert, Polygone sichtbar, Klick-Highlighting funktioniert

### Agent 2: pages-agent
Baut alle Page Routes mit SSG, Layouts und DB-Queries. OWNS shared layout files.

- **Owns**: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/[city]/page.tsx`, `src/app/[city]/layout.tsx`, `src/app/[city]/[bezirk]/page.tsx`, `src/app/[city]/[bezirk]/[zone]/page.tsx`, `src/lib/queries.ts`, `src/components/CityGrid.tsx`, `package.json`, `tailwind.config.ts`, `tsconfig.json`
- **Off-limits**: `src/components/ZoneMapMapLibre.tsx`, `src/components/MapWrapper.tsx`, `src/components/AddressSearch.tsx`, `src/components/SchemaOrg.tsx`
- **Delivers**:
  - Startseite mit Hero-Suchfeld placeholder + CityGrid (Server Component)
  - Stadt/Stadtteil/Zonendetail-Seiten mit `generateStaticParams` + `generateMetadata`
  - DB Query Helper `src/lib/queries.ts`: `getStaedte()`, `getBezirkeByStadt(city)`, `getZoneBySlug(city, bezirk, zoneId)`
  - Responsive Layout in `[city]/layout.tsx`: `md:flex` with Sidebar (30%) + Map (70%)
  - Integrates components from map-agent and search-agent into layouts
- **Discovery Tasks**:
  - Check if Next.js project already exists from backend-mvp (`package.json`, `src/`)
  - Check if `src/lib/db.ts` exists — reuse, don't recreate
  - Verify `generateStaticParams` against real DB: `SELECT slug FROM staedte WHERE active=true`
- **Freedom**: Layout structure, loading states, error boundaries, CityGrid card design
- **Escalate to Lead**: If DB schema differs from spec, if backend-mvp project doesn't exist yet
- **Validation**:
  - `npx tsc --noEmit` — ALWAYS (no backend needed)
  - `npm run build` — only if `DATABASE_URL` is set (needs PostGIS for generateStaticParams)
  - `curl http://localhost:3000/berlin` — only if backend live

### Agent 3: search-agent
Baut Adresssuche, Zonendetail-Panel und Ad-Banner.

- **Owns**: `src/components/AddressSearch.tsx`, `src/components/ZoneDetailsPanel.tsx`, `src/components/AdBanner.tsx`, `src/types/zone.ts`
- **Off-limits**: `src/app/`, `src/components/ZoneMapMapLibre.tsx`, `src/components/CityGrid.tsx`, `src/lib/`
- **Delivers**:
  - `AddressSearch`: Client Component mit 1.2s Debouncing, Autocomplete-Dropdown, calls `/api/address/autocomplete`
  - `ZoneDetailsPanel`: Bottom-Sheet (Mobile < md) / Sidebar content (Desktop >= md). Props: `zone`, `isOpen`, `onClose`
  - `AdBanner`: NICE priority — Sidebar-Banner (Desktop) / Sticky-Banner (Mobile)
  - `src/types/zone.ts`: Shared TypeScript types:
    ```typescript
    export interface ParkZone {
      zone_id: string;
      name: string;
      bezirk: string;
      bezirk_slug: string;
      gebuehr: string | null;
      zeiten: string;
      besonderheiten: string | null;
      bbox?: [number, number, number, number];
    }
    ```
- **Discovery Tasks**:
  - Verify `/api/address/autocomplete?q=Tor` responds with expected `suggestions` array
  - Verify `/api/zone?lat=52.5163&lng=13.3777` returns zone data matching Contract
- **Freedom**: Debounce implementation, Bottom-Sheet animation/transition, Dropdown styling, keyboard navigation in autocomplete
- **Escalate to Lead**: If API routes return different response format than Contract
- **Validation**:
  - `npx tsc --noEmit`
  - Dev server: Suchfeld → Vorschlaege nach 1.2s → Auswahl triggert callback
  - Mobile (375px): Bottom-Sheet oeffnet von unten mit `rounded-t-3xl`
  - Desktop (1280px): Panel zeigt Details in Sidebar-Bereich

### Agent 4: seo-agent (spawned AFTER pages-agent)
Baut Schema.org Markup, robots.txt, sitemap.xml.

- **Owns**: `src/components/SchemaOrg.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`
- **Off-limits**: All page files (reads them, does NOT modify)
- **Delivers**:
  - `SchemaOrg`: JSON-LD component (`Dataset` / `WebPage` with local references)
  - `robots.ts`: Allows all crawlers, points to sitemap
  - `sitemap.ts`: Dynamic sitemap from DB (all cities, bezirke, zones)
- **Discovery Tasks**:
  - Check which pages exist and what `generateMetadata` already produces
  - Verify pages-agent hasn't already added Schema.org (avoid duplication)
- **Freedom**: Schema.org type choice, sitemap priority values, robots directives
- **Escalate to Lead**: If pages-agent already included Schema.org in page files
- **Note**: SendMessage to pages-agent requesting SchemaOrg component integration into `[city]/layout.tsx`
- **Validation**:
  - `curl http://localhost:3000/berlin | grep 'application/ld+json'`
  - `curl http://localhost:3000/robots.txt` — valid format
  - `curl http://localhost:3000/sitemap.xml` — contains `/berlin`, `/berlin/mitte`

### Agent 5: qa-agent (spawned LAST — REQUIRES BACKEND LIVE)
Verifiziert alle Acceptance Criteria und Cross-Agent Integration. **Kann erst spawnen wenn PostGIS + Martin + API Routes laufen.**

- **Owns**: Read-only access to ALL directories
- **Off-limits**: No file modifications
- **Delivers**: Contract verification report — PASS/FAIL/WARN per AC-ID
- **Validation Checklist**:
  - `npm run build` — keine Fehler
  - `npx tsc --noEmit` — keine Type-Fehler
  - AC-101: Map renders with positron basemap + Martin tiles
  - AC-102: Color coding matches spec (green/yellow/red)
  - AC-103: Zone click → Bottom-Sheet (375px) or Sidebar (1280px)
  - AC-104: Feature-State Highlighting works (opacity change)
  - AC-105: Search calls /api/address/autocomplete (not Nominatim directly)
  - AC-106: Debouncing >= 1.2s (Network tab timing)
  - AC-107: Startseite has search + CityGrid
  - AC-108-110: All page routes render correctly
  - AC-111: Responsive breakpoint at md (768px)
  - AC-112: Touch-targets >= 44px
  - AC-113: SEO metadata on all routes
  - AC-114: MapLibre loaded via dynamic import (ssr: false)
  - AC-115: CityGrid has no "use client" directive

## Agent Communication Rules

### Communication Map
```
map-agent ↔ search-agent: onZoneClick callback interface (ZoneMapProps → ZoneDetailsPanel)
pages-agent → map-agent: passes initialBbox, center, selectedZoneId as props in layouts
pages-agent → search-agent: integrates AddressSearch + ZoneDetailsPanel in layouts
seo-agent → pages-agent: requests SchemaOrg integration into [city]/layout.tsx
qa-agent → all: findings go back to responsible agent for fixing
```

### Shared File Protocol
- `src/app/[city]/layout.tsx` → **pages-agent OWNS**. Map-agent and search-agent deliver components via exports; pages-agent imports and integrates them.
- `src/types/zone.ts` → **search-agent OWNS**. Map-agent and pages-agent import the type but do NOT modify.
- `package.json` → **pages-agent OWNS**. Other agents send dependency requests (`npm install maplibre-gl`) via SendMessage; pages-agent runs the install.

### Agent-to-Agent (without Lead)
- Component Props interface questions ("What's the exact type of onZoneClick?")
- Import path clarifications ("Is ZoneMap default or named export?")
- Dependency requests ("Please run `npm install maplibre-gl`")

### Escalate to Lead
- Architecture/scope changes
- Building something outside own File Ownership
- API response format differs from Contract
- Martin tiles unreachable

### Schema-Mismatch Protocol
1. STOP — don't build against wrong assumptions
2. Collect evidence (curl output, error messages)
3. SendMessage to Lead: "Plan says X, I found Y. Proposal: Z"
4. Wait for Lead decision; Lead broadcasts correction to all agents

## Freedom Levels

### CONSTRAINTS (from ADRs — Agent MUST follow, no exceptions)
- **AD-1**: MapLibre GL JS only — NO Google Maps, NO Leaflet, NO Mapbox GL
- **AD-2**: OpenFreeMap positron: `https://tiles.openfreemap.org/styles/positron` — NO other basemap
- **AD-3**: Nominatim via `/api/address/autocomplete` ONLY — Frontend NEVER calls Nominatim directly
- **AD-4**: Feature-State via `map.setFeatureState()` — NO layer filter/repaint for highlighting
- **AD-5**: Mobile Bottom-Sheet + Desktop Sidebar — NO modals, NO tooltips-only
- **AD-6**: `next/dynamic` with `{ ssr: false }` for MapLibre — NO SSR of map component

### GOALS (Agent decides HOW)
- Map renders fast on mobile (target: LCP < 2.5s)
- Autocomplete feels responsive (debounce 1.2s, then instant dropdown)
- Pages are statically generated at build time for SEO
- Zone details readable and complete (name, bezirk, gebuehr, zeiten)
- Touch targets >= 44px on all interactive elements

### DISCOVERY TASKS (Agent researches BEFORE building — proceed without if backend not live)
- **Martin tiles**: Check if `tiles.parkzonen.de` is reachable. If not: build map component against Contract, test visually later → map-agent
- **API routes**: Check if `/api/address/autocomplete` responds. If not: build search against Contract types, test E2E later → search-agent
- **DB connection**: Check if `DATABASE_URL` is set and connectable. If not: mock `generateStaticParams` with hardcoded Berlin data, swap for DB queries later → pages-agent
- **Project state**: Check if Next.js project exists from backend-mvp → pages-agent

## Features (ordered by dependency)

### Feature 1: Interactive Map with Color-Coded Zones
**Agents**: map-agent
**ACs**: AC-101, AC-102, AC-104, AC-114
**Description**: MapLibre-Karte mit OpenFreeMap positron, Martin Vector Tiles, farbkodierte Polygone (Gruen/Gelb/Rot nach Gebuehr), Feature-State Highlighting bei Klick. Exportiert `ZoneMapMapLibre` component mit `onZoneClick` callback.

### Feature 2: Page Routes + Static Generation
**Agents**: pages-agent
**ACs**: AC-107, AC-108, AC-109, AC-110, AC-115
**Description**: Startseite mit Suchfeld + CityGrid (Server Component). Stadtseite, Stadtteilseite, Zonendetailseite mit `generateStaticParams` + `generateMetadata`. Responsive Layout (Mobile fullscreen / Desktop sidebar+map). Integrates components from other agents.

### Feature 3: Address Search + Zone Details Panel
**Agents**: search-agent
**ACs**: AC-103, AC-105, AC-106, AC-111, AC-112
**Description**: AddressSearch mit 1.2s Client-Debouncing und Autocomplete-Dropdown via `/api/address/autocomplete`. ZoneDetailsPanel als Bottom-Sheet (Mobile) / Sidebar (Desktop). Shared TypeScript types. Touch-Targets >= 44px.

### Feature 4: SEO + Schema.org
**Agents**: seo-agent (spawns after pages-agent completes)
**ACs**: AC-113
**Description**: Schema.org JSON-LD (`Dataset`/`WebPage`), robots.txt, sitemap.xml from DB. generateMetadata already handled by pages-agent.

### Feature 5: AdSense Integration (NICE)
**Agents**: search-agent
**ACs**: AC-116
**Description**: Desktop Sidebar-Banner, Mobile Sticky-Banner. Only if MUST features complete.

## Forbidden Patterns

- **NO Google Maps / Mapbox GL** — MapLibre + OpenFreeMap only (AD-1, saves ~500 Euro/mo)
- **NO direct Nominatim calls from client** — always via /api/address/autocomplete (AD-3)
- **NO SSR for MapLibre** — always `next/dynamic({ ssr: false })` (AD-6)
- **NO `useEffect` without cleanup** — Map instance must be disposed in return function
- **NO hardcoded coordinates** — always from DB/API (bbox from staedte, center from zone)
- **NO touch-targets < 44px** — all interactive elements min 44px (AC-112)
- **NO AdSense overlapping map controls** — z-index below map UI
- **NO parallel writes to same file** — pages-agent owns layouts, others deliver components (KI-004)
- **NO more than 3 parallel developer-agents** — rate limit risk (KI-004)
- **NO DROP/CREATE on backend tables** — PostGIS data is READ ONLY

## End-to-End Validation (REQUIRES BACKEND LIVE)

> Diese Tests koennen erst laufen wenn PostGIS, Martin und die API Routes deployed sind.
> Developer-Agents validieren mit `npx tsc --noEmit` + strukturellen Checks.

### Happy Path: Mobile User Finds Parking Zone
1. Open `http://localhost:3000/` on 375px viewport
2. See hero search field + Berlin city card
3. Tap "Berlin" → navigate to `/berlin`
4. See fullscreen map with colored polygons (green, yellow, red)
5. Tap a red zone → Bottom-Sheet slides up with zone name, bezirk, gebuehr, zeiten
6. Tap search field → type "Torstrasse" → wait 1.2s → autocomplete suggestions appear
7. Tap first suggestion → map flies to location → zone highlighted (opacity 0.6)

### Happy Path: Desktop User Browses District
1. Open `http://localhost:3000/berlin/mitte` on 1280px viewport
2. See sidebar (30%) + map (70%), map zoomed to Mitte bounding box
3. Click zone → sidebar shows zone details
4. Navigate to `/berlin/mitte/zone-55` → map focused on zone 55, sidebar pre-filled

### Build + SEO Validation
```bash
# Build
npx tsc --noEmit
npm run lint
npm run build
ls .next/server/app/berlin/

# SEO
curl -s http://localhost:3000/ | grep '<title>'
curl -s http://localhost:3000/berlin | grep '<title>'
curl -s http://localhost:3000/berlin | grep 'og:title'
curl -s http://localhost:3000/berlin | grep 'application/ld+json'
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/robots.txt
```
