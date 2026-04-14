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

export interface Stadt {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  active: boolean;
}

export interface Bezirk {
  slug: string;
  name: string;
  city_slug: string;
  bbox: [number, number, number, number];
}

export interface AutocompleteSuggestion {
  display_name: string;
  lat: number;
  lng: number;
}
